import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type InstagramTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  user_id?: string | number;
  permissions?: string;
  error_message?: string;
};

export default {
  fetch: async (req) => {
    const supabaseAdmin = createAdminClient();
    const ctx = { supabaseAdmin };

    const siteUrl = Deno.env.get("CRM_SITE_URL") || "http://localhost:5173";
    const fallbackRedirect = `${siteUrl}/instagram`;

    try {
      if (req.method !== "GET") {
        return redirectWithStatus(fallbackRedirect, "error", "metodo_invalido");
      }

      const url = new URL(req.url);
      const code = url.searchParams.get("code") || "";
      const state = url.searchParams.get("state") || "";
      const error = url.searchParams.get("error") || "";
      const errorReason = url.searchParams.get("error_reason") || error;

      if (error) {
        return redirectWithStatus(fallbackRedirect, "error", errorReason || "autorizacao_cancelada");
      }

      if (!code || !state) {
        return redirectWithStatus(fallbackRedirect, "error", "callback_incompleto");
      }

      const stateHash = await sha256(state);
      const { data: stateRecord, error: stateError } = await ctx.supabaseAdmin
        .from("crm_instagram_oauth_states")
        .select("*")
        .eq("state_hash", stateHash)
        .is("usado_em", null)
        .gt("expira_em", new Date().toISOString())
        .maybeSingle();

      if (stateError || !stateRecord) {
        return redirectWithStatus(fallbackRedirect, "error", "state_invalido");
      }

      const appId = Deno.env.get("INSTAGRAM_APP_ID") || Deno.env.get("META_APP_ID");
      const appSecret = Deno.env.get("INSTAGRAM_APP_SECRET") || Deno.env.get("META_APP_SECRET");
      const redirectUri = Deno.env.get("INSTAGRAM_REDIRECT_URI");

      if (!appId || !appSecret || !redirectUri) {
        await markProfileError(ctx, stateRecord.instagram_perfil_id, "Credenciais Meta nao configuradas.");
        return redirectWithStatus(stateRecord.redirect_to || fallbackRedirect, "error", "credenciais_ausentes");
      }

      const token = await exchangeCodeForToken({ appId, appSecret, redirectUri, code });

      if (!token.access_token) {
        await markProfileError(ctx, stateRecord.instagram_perfil_id, token.error_message || "Token nao retornado.");
        return redirectWithStatus(stateRecord.redirect_to || fallbackRedirect, "error", "token_invalido");
      }

      const scopes = parseScopes(token.permissions || Deno.env.get("INSTAGRAM_OAUTH_SCOPES") || "");
      const expiresAt = token.expires_in
        ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString()
        : null;
      const now = new Date().toISOString();
      const userId = token.user_id ? String(token.user_id) : null;

      await ctx.supabaseAdmin
        .from("crm_instagram_conexoes")
        .upsert(
          {
            cliente_id: stateRecord.cliente_id,
            instagram_perfil_id: stateRecord.instagram_perfil_id,
            provider: "instagram",
            meta_user_id: userId,
            meta_account_id: userId,
            access_token: token.access_token,
            token_type: token.token_type || "bearer",
            expires_at: expiresAt,
            scopes,
            status: "ativa",
            last_error: null,
            criado_por: stateRecord.criado_por,
            atualizado_em: now,
          },
          { onConflict: "instagram_perfil_id" },
        );

      await ctx.supabaseAdmin
        .from("crm_instagram_perfis")
        .update({
          meta_user_id: userId,
          meta_account_id: userId,
          meta_connected_at: now,
          meta_connection_status: "conectado",
          meta_token_expires_at: expiresAt,
          meta_scopes: scopes,
          meta_connected_by: stateRecord.criado_por,
          meta_error: null,
          atualizado_em: now,
        })
        .eq("id", stateRecord.instagram_perfil_id);

      await ctx.supabaseAdmin
        .from("crm_instagram_oauth_states")
        .update({ usado_em: now })
        .eq("id", stateRecord.id);

      return redirectWithStatus(stateRecord.redirect_to || fallbackRedirect, "success", "instagram_conectado");
    } catch (error) {
      console.error(error);

      return redirectWithStatus(fallbackRedirect, "error", "erro_inesperado");
    }
  },
};

async function exchangeCodeForToken({
  appId,
  appSecret,
  redirectUri,
  code,
}: {
  appId: string;
  appSecret: string;
  redirectUri: string;
  code: string;
}): Promise<InstagramTokenResponse> {
  const endpoint = Deno.env.get("INSTAGRAM_TOKEN_URL") || "https://api.instagram.com/oauth/access_token";
  const body = new URLSearchParams();
  body.set("client_id", appId);
  body.set("client_secret", appSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", redirectUri);
  body.set("code", code);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      error_message: data?.error_message || data?.error?.message || "Falha ao trocar codigo por token.",
    };
  }

  return data;
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

function redirectWithStatus(baseUrl: string, status: string, reason: string) {
  const url = new URL(baseUrl || "http://localhost:5173/instagram");
  url.searchParams.set("instagram_connection", status);
  url.searchParams.set("reason", reason);

  return Response.redirect(url.toString(), 302);
}

function parseScopes(value: string) {
  return String(value || "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
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
