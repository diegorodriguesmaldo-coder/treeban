# Brisa

Workspace Kanban em português com React, TypeScript, Supabase e Cloudflare Pages.

- **Site:** https://brisa-workspace.pages.dev
- **Código:** https://github.com/diegorodriguesmaldo-coder/treeban

## Desenvolvimento

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
npm test
npm run build
```

As duas variáveis de `.env.example` são públicas e já têm os valores do projeto como padrão em `src/supabase.ts`. Para outro projeto, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local`. Nunca use uma chave `service_role` no frontend.

## Funcionalidades

- Login por e-mail e senha, criação de contas na própria tela de acesso, recuperação de senha e logout.
- Um workspace compartilhado. Todos os usuários cadastrados têm exatamente o mesmo acesso aos quadros. Não há perfis de administrador ou níveis de permissão.
- Novos usuários entram automaticamente na equipe. O botão Convidar copia o link de cadastro; não envia convites por e-mail.
- Quadros, favoritos, fundos, colunas personalizáveis, arrastar e soltar, ordenação e coluna de conclusão configurável.
- Cards em modal com descrição, responsáveis reais, etiquetas, prazos, prioridades, checklists, comentários e anexos.
- Busca global, filtros, visão geral, tarefas pessoais e visualizações de quadro, lista e calendário.
- Atividade, arquivamento, restauração, desfazer e backup JSON.
- Sincronização em tempo real, detecção de conflitos e recuperação de alterações pendentes após queda de conexão.
- Interface responsiva. Atalhos: `Ctrl/Cmd + K`, `N`, `Ctrl/Cmd + Enter` e `?`.

## Banco de dados

O projeto Supabase é `usyqpikhdkddlfbidlzf` (brisatrello). O esquema está versionado em `supabase/migrations/`.

| Recurso | Uso |
| --- | --- |
| `auth.users` | Contas e senhas geridas pelo Supabase Auth |
| `profiles` | Nome e cor de cada usuário; a pessoa só altera o próprio perfil |
| `workspace_members` | Vínculo automático de cada conta ao workspace compartilhado |
| `workspaces` | Documento JSONB versionado com todos os quadros e seus dados |
| `boards`, `board_columns`, `cards` | Views relacionais para consultar o documento |
| `checklist_items`, `card_comments`, `card_attachments`, `labels` | Views relacionais dos detalhes |

O documento permite mover cards e reordenar colunas atomicamente. `save_workspace_document` usa comparação de revisão para rejeitar gravações desatualizadas. O cliente reaplica apenas suas alterações sobre a versão mais recente, preservando edições independentes, comentários e novos cards de outras pessoas. Edições simultâneas do mesmo campo seguem a última gravação aceita. Exclusões prevalecem sobre edições do mesmo item.

RLS protege todas as tabelas. As views usam `security_invoker` para respeitar as políticas das tabelas. Visitantes sem login não podem ler ou alterar o workspace. Não existem chaves administrativas no código publicado.

Os anexos de até 800 KB são guardados como dados no documento e sincronizados. Para arquivos maiores, adicione links. A revisão atual aceita documentos de até 8 MB. Para volumes maiores, a evolução indicada é migrar binários para Supabase Storage e dividir os documentos por quadro.

O navegador guarda a sessão e um rascunho pendente por usuário quando necessário. O banco é a fonte dos dados compartilhados. Antes de sair, o app verifica se há alterações pendentes de sincronização.

## Autenticação e e-mails

O cadastro usa `supabase.auth.signUp`, o login usa `signInWithPassword` e a recuperação usa `resetPasswordForEmail`. A confirmação de e-mail segue a configuração do projeto no painel Supabase.

- Para cadastro imediato, desative **Confirm email** em Authentication → Sign In / Providers → Email.
- Para exigir confirmação ou enviar recuperação de senha para endereços externos à equipe do Supabase, configure um SMTP próprio.
- Em Authentication → URL Configuration, configure `https://brisa-workspace.pages.dev` como Site URL e inclua a mesma URL entre os redirecionamentos permitidos. Inclua `http://localhost:5173` apenas se precisar testar e-mails localmente.
- Sem SMTP configurado, o serviço padrão do Supabase restringe o envio de e-mails. Isso afeta confirmação e recuperação; login com senha e cadastro com confirmação desativada funcionam sem e-mails.

## Publicação

```sh
npm run build
npx wrangler pages deploy dist --project-name brisa-workspace --branch main
```

O projeto Pages usa Direct Upload. Ele não depende de uma sessão local para servir o site. O repositório contém o código-fonte e as migrações; uma nova publicação pode ser feita pelo comando acima com uma conta Cloudflare autenticada. O GitHub não dispara publicações automáticas nesta configuração.

Capas e paisagem são SVGs locais. A interface usa DM Sans e Manrope, com alternativas sans-serif se as fontes externas não estiverem disponíveis.
