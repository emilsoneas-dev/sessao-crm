import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type OAuthStartPayload = {
  instagram_perfil_id?: string;
  redirect_to?: string;
  crm_access_token?: string;
  expires_in_minutes?: number;
};

const DEFAULT_SCOPES = "instagram_business_basic,instagram_business_manage_insights";
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

      const payload = (await req.json()) as OAuthStartPayload;
      const caller = await getAuthenticatedCrmUser(req, ctx, payload.crm_access_token);
      if (!caller.ok) return caller.response;

      const profileId = String(payload.instagram_perfil_id || "").trim();

      if (!profileId) {
        return json({ error: "Perfil Instagram nao informado." }, 400);
      }

      const appId = Deno.env.get("INSTAGRAM_APP_ID") || Deno.env.get("META_APP_ID");
      const redirectUri = Deno.env.get("INSTAGRAM_REDIRECT_URI");
      const scopes = Deno.env.get("INSTAGRAM_OAUTH_SCOPES") || DEFAULT_SCOPES;

      if (!appId || !redirectUri) {
        return json({ error: "Configure INSTAGRAM_APP_ID e INSTAGRAM_REDIRECT_URI no Supabase." }, 500);
      }

      const { data: profile, error: profileError } = await ctx.supabaseAdmin
        .from("crm_instagram_perfis")
        .select("id, cliente_id, ativo")
        .eq("id", profileId)
        .maybeSingle();

      if (profileError || !profile) {
        return json({ error: "Perfil Instagram nao encontrado." }, 404);
      }

      if (!profile.ativo) {
        return json({ error: "Perfil Instagram inativo." }, 400);
      }

      const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
      const stateHash = await sha256(state);
      const now = new Date().toISOString();
      const expiresInMinutes = normalizeExpirationMinutes(payload.expires_in_minutes);
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

      const { error: stateError } = await ctx.supabaseAdmin
        .from("crm_instagram_oauth_states")
        .insert({
          state_hash: stateHash,
          cliente_id: profile.cliente_id,
          instagram_perfil_id: profile.id,
          redirect_to: sanitizeRedirect(payload.redirect_to),
          criado_por: caller.user.email,
          expira_em: expiresAt,
        });

      if (stateError) {
        return json({ error: "Nao foi possivel preparar a conexao Instagram.", details: stateError.message }, 500);
      }

      await ctx.supabaseAdmin
        .from("crm_instagram_perfis")
        .update({
          meta_connection_status: "pendente",
          meta_error: null,
          atualizado_em: now,
        })
        .eq("id", profile.id);

      const authUrl = new URL("https://www.instagram.com/oauth/authorize");
      authUrl.searchParams.set("client_id", appId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("state", state);

      return json({
        authUrl: authUrl.toString(),
        expiresAt,
        expiresInMinutes,
      });
    } catch (error) {
      console.error(error);

      return json({ error: "Erro inesperado ao iniciar conexao Instagram." }, 500);
    }
  },
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function normalizeExpirationMinutes(value?: number) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes)) return 15;

  return Math.min(Math.max(Math.round(minutes), 5), 24 * 60);
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

  if (crmUserError || !crmUser) {
    return {
      ok: false,
      response: json({ error: "Usuario do CRM nao autorizado." }, 403),
    };
  }

  if (!["dono", "gestor", "funcionario"].includes(crmUser.papel)) {
    return {
      ok: false,
      response: json({ error: "Usuario sem permissao para conectar Instagram." }, 403),
    };
  }

  return { ok: true, user: crmUser };
}

function sanitizeRedirect(value?: string) {
  const siteUrl = Deno.env.get("CRM_SITE_URL") || "";
  const fallback = `${siteUrl || "http://localhost:5173"}/instagram`;

  if (!value) return fallback;

  try {
    const url = new URL(value);
    if (siteUrl && url.origin !== new URL(siteUrl).origin) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
