import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type CreateCrmUserPayload = {
  nome?: string;
  email?: string;
  papel?: "dono" | "gestor" | "funcionario" | "cliente";
  ativo?: boolean;
};

const ALLOWED_ROLES = ["dono", "gestor", "funcionario", "cliente"];

export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    try {
      if (req.method !== "POST") {
        return Response.json(
          { error: "Método não permitido." },
          { status: 405 },
        );
      }

      const authorization = req.headers.get("Authorization") || "";
      const accessToken = authorization.replace("Bearer ", "").trim();

      if (!accessToken) {
        return Response.json(
          { error: "Token de autenticação não enviado." },
          { status: 401 },
        );
      }

      const {
        data: { user: callerAuthUser },
        error: callerAuthError,
      } = await ctx.supabaseAdmin.auth.getUser(accessToken);

      if (callerAuthError || !callerAuthUser?.email) {
        return Response.json(
          { error: "Usuário não autenticado." },
          { status: 401 },
        );
      }

      const { data: callerCrmUser, error: callerCrmUserError } =
        await ctx.supabaseAdmin
          .from("crm_usuarios")
          .select("id, nome, email, papel, ativo")
          .eq("email", callerAuthUser.email)
          .eq("ativo", true)
          .maybeSingle();

      if (callerCrmUserError) {
        return Response.json(
          { error: "Erro ao validar o usuário do CRM." },
          { status: 500 },
        );
      }

      if (!callerCrmUser || callerCrmUser.papel !== "dono") {
        return Response.json(
          { error: "Apenas o dono pode criar colaboradores." },
          { status: 403 },
        );
      }

      const payload = (await req.json()) as CreateCrmUserPayload;

      const nome = String(payload.nome || "").trim();
      const email = String(payload.email || "").trim().toLowerCase();
      const papel = payload.papel || "funcionario";
      const ativo = payload.ativo !== false;

      if (!nome || !email) {
        return Response.json(
          { error: "Nome e e-mail são obrigatórios." },
          { status: 400 },
        );
      }

      if (!ALLOWED_ROLES.includes(papel)) {
        return Response.json(
          { error: "Papel inválido." },
          { status: 400 },
        );
      }

      const siteUrl = Deno.env.get("CRM_SITE_URL") || "http://localhost:5173";
      const now = new Date().toISOString();

      const { data: invitedAuthUser, error: inviteError } =
        await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            nome,
            papel,
          },
          redirectTo: `${siteUrl}/set-password`,
        });

      if (inviteError) {
        return Response.json(
          {
            error: inviteError.message || "Erro ao enviar convite por e-mail.",
          },
          { status: 400 },
        );
      }

      const authUserId = invitedAuthUser.user?.id || null;

      const { data: crmUser, error: crmUserError } = await ctx.supabaseAdmin
        .from("crm_usuarios")
        .upsert(
          {
            auth_user_id: authUserId,
            nome,
            email,
            papel,
            ativo,
            convite_status: "enviado",
            convite_enviado_em: now,
            ultimo_convite_em: now,
            atualizado_em: now,
          },
          {
            onConflict: "email",
          },
        )
        .select()
        .single();

      if (crmUserError) {
        return Response.json(
          {
            error: "Convite enviado, mas houve erro ao salvar o usuário no CRM.",
            details: crmUserError.message,
          },
          { status: 500 },
        );
      }

      return Response.json({
        user: crmUser,
        message: "Convite enviado com sucesso.",
      });
    } catch (error) {
      console.error(error);

      return Response.json(
        { error: "Erro inesperado ao convidar colaborador." },
        { status: 500 },
      );
    }
  }),
};