# Identidade e página de boas-vindas do Brisa

## Direção da marca

- Nome confirmado pelo usuário: **Brisa**.
- Personalidade: próxima, criativa e tranquila. O produto dá espaço às ideias e ajuda a equipe a enxergar o próximo passo.
- Laranja principal do lettering: `#ED713B`. As chamadas para ação usam o tom mais escuro `#BF4E22` para melhorar a leitura do texto branco.
- Fundo creme `#FFFCF7`, texto principal `#34352F` e detalhes em verde oliva.
- Logo manuscrito desenhado a partir da fonte Caveat com licença SIL Open Font License. Os SVGs finais têm contornos vetoriais e não dependem de uma fonte instalada.
- Mascote: personagem masculino original, um criativo de agência descontraído, com visual de animação 3D. O prompt e a execução pela Vibi estão documentados em `mascot-prompt.md`.

## Arquivos de identidade

- `public/brand/brisa-logo.svg`: logo laranja.
- `public/brand/brisa-logo-white.svg`: versão branca.
- `public/brand/brisa-logo-dark.svg`: versão escura.
- `public/brand/brisa-logo.png`: exportação em PNG com fundo transparente.
- `public/brand/brisa-symbol.svg` e `public/favicon.svg`: ícone manuscrito.
- `public/fonts/Caveat-Variable.ttf` e `Caveat-OFL.txt`: fonte e licença.
- `scripts/create-brand.mjs`: geração reproduzível dos contornos e do símbolo.
- `public/assets/images/brisa-mascot.png`: imagem original gerada pela Vibi, com fundo transparente.
- `public/images/brisa-mascot.webp`: imagem otimizada que aparece na página e no acesso à conta.

## Mensagem principal

**Tire as ideias do papel. Coloque no Brisa.**

Organize projetos em quadros, distribua as tarefas e acompanhe cada entrega. Sua equipe encontra o próximo passo no mesmo lugar.

Chamada principal: **Começar meus 15 dias grátis**.

Chamadas secundárias: **Dar uma olhada**, **Entrar** e **Criar minha conta**.

## Conteúdo da página

1. Apresentação do produto e do teste de 15 dias.
2. Prévia interativa com visualizações de quadro, lista e calendário. Os cards de demonstração podem ser abertos.
3. Recursos: colunas personalizáveis, contexto reunido nos cards e acompanhamento compartilhado da equipe.
4. Como começar: criar a conta, abrir um quadro e organizar as entregas.
5. Oferta de teste gratuito, perguntas frequentes e chamada final para cadastro.

As mensagens se apoiam em recursos já implementados. Não há depoimentos, números de clientes, integrações, planos pagos ou promessas de produtividade inventados.

## Oferta e acesso

O usuário autorizou um limite real de 15 dias. O período é individual e começa no cadastro. Para as contas existentes, o período começa com a aplicação da migração `brisa_fifteen_day_trial`.

Ao vencer, o acesso aos quadros é pausado no banco por RLS e na interface. Os dados salvos continuam no workspace. A própria conta não pode alterar o início nem o fim do teste. O cadastro não coleta cartão e não existe cobrança automática. O próximo plano comercial ainda não foi definido; a tela de vencimento orienta a pessoa a conversar com o responsável pelo Brisa na equipe.

## Rotas

- `/`: boas-vindas, inclusive para pessoas já autenticadas.
- `/login`: entrada e recuperação de senha.
- `/cadastro`: criação de conta e início do período de teste.
- `/app`: workspace protegido por autenticação e verificação do período de teste.
- `/?signup=1`: compatibilidade com links antigos; encaminha para `/cadastro`.

O Supabase continua responsável pelas contas. Os membros compartilham os mesmos quadros e têm o mesmo nível de permissão enquanto o período individual de acesso está ativo.
