# Roadmap sugerido

Este roadmap e sugestao baseada no estado atual do codigo. Nao representa funcionalidades ja implementadas.

## Fase 1: estabilizacao tecnica

- Separar a shell principal de `CRMLeadsPage.jsx`.
- Criar arquivo central de rotas/paginas.
- Padronizar componentes comuns antes de novas telas grandes.
- Revisar uso de `global.css` e reduzir overrides amplos com `!important`.

## Fase 2: design system interno

- Extrair `StatCard`, `Modal`, `DataTable`, `StatusBadge`, `FilterPanel`, `ViewToggle`.
- Definir classes padrao para estados vazio, loading e erro.
- Padronizar microcopy e nomes das secoes.

## Fase 3: perfil de usuario

- Confirmar ou criar colunas em `crm_usuarios`: `foto_url`, `data_nascimento`, `cargo`, `telefone`.
- Permitir edicao real do perfil.
- Consolidar alerta de aniversario.

## Fase 4: operacional

- Refinar tarefas recorrentes.
- Melhorar arquivadas por mes.
- Conectar tarefas com ficha do cliente de forma mais direta.
- Criar filtros salvos se fizer sentido.

## Fase 5: direcao e financeiro

- Ampliar analises por mes, servico, quantidade de artigos e produtividade.
- Criar links entre cards e listas filtradas.
- Separar indicadores estrategicos de listagens operacionais.

## Fase 6: modulos futuros

- Relatorios.
- Arquivos.
- Lixeira.
- Recursos humanos completo.
- Indicadores internos.

## Cuidados permanentes

- Nao misturar mensalidade de cliente com receita real de tarefas.
- Nao criar cards repetidos em paginas diferentes sem proposito.
- Criar migrations pequenas e reversiveis.
- Validar deploy depois de alteracoes de layout global.
