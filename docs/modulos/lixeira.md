# Modulo: Lixeira

Status: nao identificado no projeto atual.

## 1. Objetivo da secao

Nao ha modulo de lixeira identificado.

## 2. Telas existentes

Nenhuma tela propria de lixeira foi identificada.

## 3. Componentes utilizados

Nao identificado.

## 4. Campos principais

Nao identificado.

## 5. Acoes disponiveis

Nao identificado.

## 6. Fluxo do usuario

Atualmente algumas exclusoes chamam `delete()` direto no Supabase, apos confirmacao.

## 7. Relacao com o banco de dados

Nao ha campos padrao como `deleted_at` identificados nas migrations atuais.

## 8. Integracoes

Poderia integrar com clientes, tarefas, documentos e usuarios.

## 9. Pontos fortes

As exclusoes atuais pedem confirmacao, reduzindo erro acidental.

## 10. Problemas ou limitacoes

Exclusoes definitivas nao permitem restauracao pelo app.

## 11. Sugestoes de melhoria futura

- Implementar soft delete antes de apagar definitivamente.
- Criar tela de restauracao para registros criticos.
- Definir politicas por papel para limpar lixeira.
