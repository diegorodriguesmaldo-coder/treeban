# Instruções permanentes do projeto Brisa

## Preferência de entrega do usuário

O usuário determinou que toda atualização feita neste projeto deve ser enviada ao GitHub e publicada online. Ele revisa o resultado no site, de qualquer lugar, e não deve precisar conferir arquivos locais.

Pedidos futuros de alterações neste projeto incluem autorização para fazer o commit, enviar o código ao repositório existente e publicar no projeto Cloudflare Pages existente. Não pedir novamente autorização para esses passos rotineiros já autorizados. Respeitar solicitações posteriores do usuário que limitem a publicação.

## Destinos

- GitHub: https://github.com/diegorodriguesmaldo-coder/treeban
- Branch de produção: `main`
- Site de produção: https://brisa-workspace.pages.dev
- Cloudflare Pages: `brisa-workspace`
- Conta Cloudflare: `51eca39e840a1d38a185af33ad1cb648`
- Supabase: `usyqpikhdkddlfbidlzf` (brisatrello)

## Quando uma atualização está concluída

1. Implementar a alteração e executar as verificações adequadas. Para código do app, executar os testes pertinentes e a compilação de produção.
2. Fazer commit apenas das alterações do projeto, enviar para `origin/main` e confirmar que o commit está no GitHub.
3. Publicar a mesma versão no Cloudflare Pages. Registrar o SHA do commit publicado nos metadados do deployment.
4. Aguardar o deployment terminar com sucesso, confirmar que seu SHA corresponde ao `main` remoto e verificar o site de produção. Para mudanças de interface ou comportamento, testar o fluxo alterado no site publicado.
5. Entregar o link online ao usuário e explicar brevemente o resultado. Arquivos locais podem ser materiais adicionais, mas não substituem a versão publicada.

Nunca dizer que está entregue ou sincronizado se só existe localmente, se o envio ao GitHub falhou ou se o deployment não foi confirmado. Se uma credencial expirar ou uma integração bloquear o acesso, concluir tudo que for possível, preservar o trabalho e informar exatamente a pendência.

## Publicação e segurança

O Pages está configurado com Direct Upload. Atualmente não há deploy automático disparado por pushes ao GitHub; o agente deve executar a publicação em cada entrega. Não presumir que fazer push atualiza o site.

Usar as integrações disponíveis ou o Wrangler autenticado. Não guardar tokens, senhas ou chaves administrativas neste arquivo, no código, no histórico do Git, na URL do remoto ou em arquivos entregues ao usuário. As credenciais públicas do cliente Supabase são distintas de chaves administrativas.

Mudanças no banco devem manter migrações versionadas e respeitar as políticas de acesso. Não apagar dados de usuários para preparar uma entrega ou um teste.

## Identidade do produto

O nome confirmado é Brisa. A identidade usa laranja e creme, logo manuscrito e um mascote original com jeito de criativo de agência. Preservar essa direção nas próximas mudanças. Os arquivos e textos estão documentados em `docs/brand-and-copy.md`.

O teste gratuito tem limite real de 15 dias por conta, validado pelo banco e pela interface. Não anunciar planos pagos, cobranças ou condições comerciais que ainda não foram definidos pelo usuário.

O usuário escolheu gerar imagens pelo script `gerar-img.mjs` conectado à Vibi. Usar a variável privada `VIBI_API_KEY` apenas do `.env` local ou das variáveis de ambiente. Não usar `OPENAI_API_KEY` para as imagens deste projeto. O mascote original e o prompt aprovado estão em `public/assets/images/brisa-mascot.png` e `docs/mascot-prompt.md`.
