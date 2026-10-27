# Instagram module

Modulo interno do CRM para gestao de Instagram dos clientes.

Funcionalidades implementadas:

- Ativacao do Instagram na ficha do cliente.
- Dashboard interno em `/instagram`.
- Planejamento mensal.
- Editor de posts.
- Calendario de postagens.
- Preview interno.
- Link magico publico em `/instagram-preview/:token`.

Funcionalidades ainda nao implementadas:

- Aprovacao/reprovacao pelo cliente.
- Comentarios no link magico.
- Integracao com API Meta.

Migrations necessarias, em ordem:

```txt
supabase/migrations/004_instagram_module.sql
supabase/migrations/005_instagram_monthly_planning.sql
supabase/migrations/006_instagram_post_editor.sql
supabase/migrations/007_instagram_magic_link_preview.sql
```

Reference documents:

- `docs/modulos/instagram.md`
- `docs/tasks/instagram/001-estrutura-do-modulo.md`
