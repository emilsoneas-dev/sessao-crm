import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type SyncPayload = {
  instagram_perfil_id?: string;
  crm_access_token?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  fetch: async (req) => {
    const supabaseAdmin = createAdminClient();
    const ctx = { supabaseAdmin };

    try {
      if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
      }

      if (req.method !== "POST") {
        return json({ error: "Metodo nao permitido." }, 405);
      }

      const payload = (await req.json()) as SyncPayload;
      const caller = await getAuthenticatedCrmUser(req, ctx, payload.crm_access_token);
      if (!caller.ok) return caller.response;

      const profileId = String(payload.instagram_perfil_id || "").trim();

      if (!profileId) {
        return json({ error: "Perfil Instagram nao informado." }, 400);
      }

      const { data: crmProfile, error: crmProfileError } = await ctx.supabaseAdmin
        .from("crm_instagram_perfis")
        .select("id, usuario, nome")
        .eq("id", profileId)
        .maybeSingle();

      if (crmProfileError || !crmProfile) {
        return json({ error: "Perfil Instagram nao encontrado no CRM." }, 404);
      }

      const { data: connection, error: connectionError } = await ctx.supabaseAdmin
        .from("crm_instagram_conexoes")
        .select("*")
        .eq("instagram_perfil_id", profileId)
        .eq("status", "ativa")
        .maybeSingle();

      if (connectionError || !connection?.access_token) {
        await markProfileError(ctx, profileId, "Nenhuma conexao ativa encontrada.");
        return json({ error: "Nenhuma conexao ativa encontrada." }, 404);
      }

      if (connection.expires_at && new Date(connection.expires_at).getTime() < Date.now()) {
        await ctx.supabaseAdmin
          .from("crm_instagram_conexoes")
          .update({ status: "expirada", atualizado_em: new Date().toISOString() })
          .eq("id", connection.id);
        await ctx.supabaseAdmin
          .from("crm_instagram_perfis")
          .update({
            meta_connection_status: "expirado",
            meta_error: "Token expirado. Reconecte a conta.",
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", profileId);

        return json({ error: "Token expirado. Reconecte a conta." }, 401);
      }

      const profile = await fetchInstagramProfile(connection.access_token);
      const now = new Date().toISOString();
      const expectedUsername = normalizeInstagramUser(crmProfile.usuario || "");
      const connectedUsername = normalizeInstagramUser(profile.username || "");

      if (expectedUsername && connectedUsername && expectedUsername !== connectedUsername) {
        const mismatchMessage = `Conta conectada @${connectedUsername}, mas este cliente espera @${expectedUsername}. Gere um novo link para o cliente autorizar o Instagram correto.`;

        await ctx.supabaseAdmin
          .from("crm_instagram_perfis")
          .update({
            meta_connection_status: "erro",
            meta_error: mismatchMessage,
            meta_last_sync_at: now,
            atualizado_em: now,
          })
          .eq("id", profileId);

        await ctx.supabaseAdmin
          .from("crm_instagram_conexoes")
          .update({
            username: connectedUsername,
            meta_user_id: String(profile.user_id || profile.id || connection.meta_user_id || ""),
            meta_account_id: String(profile.user_id || profile.id || connection.meta_account_id || ""),
            last_sync_at: now,
            last_error: mismatchMessage,
            atualizado_em: now,
          })
          .eq("id", connection.id);

        return json({ error: mismatchMessage }, 409);
      }

      const profileUpdate: Record<string, unknown> = {
        metricas_origem: "meta_api",
        meta_connection_status: "conectado",
        meta_last_sync_at: now,
        meta_error: null,
        atualizado_em: now,
      };

      if (profile.username) profileUpdate.usuario = normalizeInstagramUser(profile.username);
      if (profile.name) profileUpdate.nome = profile.name;
      if (profile.biography) profileUpdate.bio = profile.biography;
      if (profile.website) profileUpdate.site = profile.website;
      if (profile.profile_picture_url) profileUpdate.foto_url = profile.profile_picture_url;
      if (Number.isFinite(Number(profile.followers_count))) profileUpdate.seguidores = Number(profile.followers_count);
      if (Number.isFinite(Number(profile.follows_count))) profileUpdate.seguindo = Number(profile.follows_count);
      if (Number.isFinite(Number(profile.media_count))) profileUpdate.publicacoes = Number(profile.media_count);
      if (profile.id || profile.user_id) {
        profileUpdate.meta_user_id = String(profile.user_id || profile.id);
        profileUpdate.meta_account_id = String(profile.user_id || profile.id);
      }

      const { data: updatedProfile, error: updateError } = await ctx.supabaseAdmin
        .from("crm_instagram_perfis")
        .update(profileUpdate)
        .eq("id", profileId)
        .select()
        .single();

      if (updateError) {
        await markProfileError(ctx, profileId, updateError.message);
        return json({ error: "Nao foi possivel atualizar o perfil.", details: updateError.message }, 500);
      }

      await ctx.supabaseAdmin
        .from("crm_instagram_conexoes")
        .update({
          username: profile.username || connection.username,
          meta_user_id: String(profile.user_id || profile.id || connection.meta_user_id || ""),
          meta_account_id: String(profile.user_id || profile.id || connection.meta_account_id || ""),
          last_sync_at: now,
          last_error: null,
          atualizado_em: now,
        })
        .eq("id", connection.id);

      return json({
        profile: updatedProfile,
        message: "Perfil Instagram sincronizado.",
      });
    } catch (error) {
      console.error(error);

      return json({ error: "Erro inesperado ao sincronizar Instagram." }, 500);
    }
  },
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

async function fetchInstagramProfile(accessToken: string) {
  const apiBase = Deno.env.get("INSTAGRAM_GRAPH_API_URL") || "https://graph.instagram.com";
  const fields = Deno.env.get("INSTAGRAM_PROFILE_FIELDS") ||
    "id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography,website";
  const url = new URL(`${apiBase}/me`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error_message || "Falha ao consultar perfil Instagram.");
  }

  return data || {};
}

async function getAuthenticatedCrmUser(req: Request, ctx: any, payloadToken?: string) {
  const authorization = payloadToken || "";
  const accessToken = authorization.replace("Bearer ", "").trim();

  if (!accessToken) {
    return {
      ok: false,
      response: json({ error: "Token de autenticacao nao enviado." }, 401),
    };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await ctx.supabaseAdmin.auth.getUser(accessToken);

  if (authError || !authUser?.email) {
    return {
      ok: false,
      response: json({ error: "Usuario nao autenticado." }, 401),
    };
  }

  const { data: crmUser, error: crmUserError } = await ctx.supabaseAdmin
    .from("crm_usuarios")
    .select("id, nome, email, papel, ativo")
    .eq("email", authUser.email)
    .eq("ativo", true)
    .maybeSingle();

  if (crmUserError || !crmUser || !["dono", "gestor", "funcionario"].includes(crmUser.papel)) {
    return {
      ok: false,
      response: json({ error: "Usuario sem permissao para sincronizar Instagram." }, 403),
    };
  }

  return { ok: true, user: crmUser };
}

async function markProfileError(ctx: any, profileId: string, message: string) {
  await ctx.supabaseAdmin
    .from("crm_instagram_perfis")
    .update({
      meta_connection_status: "erro",
      meta_error: message,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", profileId);
}

function normalizeInstagramUser(value: string) {
  return String(value || "").trim().replace(/^@+/, "");
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao configurado.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
