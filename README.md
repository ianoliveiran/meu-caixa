# Meu Cofrin

Painel de finanças pessoais que se atualiza sozinho com seus bancos e cartões pelo Open Finance, usando o **Meu Pluggy** (gratuito para uso pessoal). Nada de digitar compra por compra.

Roda como **site** (celular e computador, com login) em Vercel + Supabase. Também existe uma versão antiga para Windows (Electron), que guarda tudo só no PC.

## O que ele faz

- **Visão geral:**
  - **Livre até o salário:** o dinheiro nas contas hoje, menos o que vence antes do próximo salário.
  - **Do próximo salário:** quanto sobra depois das faturas, das despesas fixas e do que você quer investir.
- **Cartões:**
  - fatura atual de cada cartão, limite livre e últimas faturas;
  - parcelas que já comprometem os próximos meses.
- **Contas a pagar e Despesas fixas:**
  - contas mensais, semanais e de uma vez só;
  - cada uma fica paga sozinha quando o pagamento aparece no extrato.
- **Lançamentos:**
  - tudo que entrou e saiu, com categoria;
  - filtro e agrupamento por categoria, e regra fixa por nome ("tudo que for Fulana é Contas da casa");
  - qualquer gasto vira despesa fixa com um clique, e dá para baixar a lista como planilha.
- **Metas:** por exemplo, a entrada do apartamento. A meta pode somar as parcelas de uma despesa fixa e o saldo de uma conta. O app diz quanto guardar por mês.
- **Limites por categoria**, com aviso em 80% e quando passar.
- **Cobranças que se repetem:** assinaturas encontradas sozinhas, com aviso quando ficam mais caras.
- **Créditos fora do banco**, como o do iFood: você lança as compras e acompanha o limite.
- **Conversar:** assistente com a API da OpenAI que conhece seus números. Tem várias conversas e cria lembretes quando você pede.
- **Notificações** no celular e no PC: compras novas, contas vencendo, limites, lembretes e gastos fora do normal.
- **Ajustes visuais:** modo escuro e botão para esconder os valores.
- **Tudo opcional:** cada recurso pode ser desligado em Bancos e ajustes.

O app trata casos que bagunçam outros controles:
- pagamento de fatura não conta como gasto;
- Pix entre suas próprias contas não é renda nem despesa;
- Pix no crédito e as taxas dele aparecem separados;
- o salário que cai no fim do mês conta para o mês seguinte.

## Montar o seu (versão web)

Você vai precisar de contas gratuitas no GitHub, no Supabase, na Vercel e no Meu Pluggy. Leva uns 20 minutos.

### 1. Copiar o projeto

Faça um **fork** deste repositório no seu GitHub.

### 2. Supabase (banco de dados e login)

1. Crie um projeto em [supabase.com](https://supabase.com). Escolha a região São Paulo.
2. Em **SQL Editor**, rode o arquivo `supabase/schema.sql`. Antes, troque `voce@exemplo.com` pelo seu e-mail: só os e-mails dessa lista conseguem criar conta.
3. Ainda no SQL Editor, rode `supabase/push.sql`. Antes, troque `https://SEU-SITE.vercel.app` pelo endereço que a Vercel vai te dar no passo 3. Se ainda não souber, rode depois. Isso liga o agendador de hora em hora, que busca os bancos e manda as notificações.
4. Em **Project Settings → API**, copie a **Project URL** e a **publishable key** (ou anon key).

### 3. Vercel (o site)

1. Em [vercel.com/new](https://vercel.com/new), importe o seu fork. Se o repositório não aparecer, ligue o GitHub em Account Settings → Authentication.
2. Em **Settings → Environment Variables**, crie:
   - `SUPABASE_URL`: a Project URL.
   - `SUPABASE_ANON_KEY`: a publishable key.
   - `SECRET_KEY`: 32 bytes aleatórios em base64. Essa chave tranca o Client Secret da Pluggy e a chave da OpenAI no servidor. Gere no seu PC:
     - no PowerShell: `$b=New-Object byte[] 32;[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b);[Convert]::ToBase64String($b)`
     - no Mac ou Linux: `openssl rand -base64 32`
3. Faça um novo deploy (Deployments → ⋯ → Redeploy) para o site pegar as chaves.
4. Se quiser outro endereço, troque em **Settings → Domains**. Lembre de usar o mesmo endereço no `push.sql`.

### 4. Primeiro acesso

1. Abra o site, coloque o seu e-mail e uma senha e clique em **Primeiro acesso: criar senha**.
2. Conecte os bancos (veja abaixo) e preencha o salário em **Bancos e ajustes**.
3. **Opcional:** na aba **Conversar**, cole uma chave da OpenAI ([platform.openai.com/api-keys](https://platform.openai.com/api-keys)). No campo Modelo, `gpt-6.1-terra` é um bom equilíbrio entre qualidade e custo.
4. **Opcional:** em **Bancos e ajustes → Notificações**, ative em cada aparelho.
   - **iPhone:** primeiro adicione o site à tela de início (Compartilhar → Adicionar à Tela de Início) e ative pelo ícone.
   - **PC:** no Edge ou no Chrome, instale o site como aplicativo. No Firefox, os avisos só chegam com o navegador aberto.

### Entrar com o Google (opcional)

1. No [Google Cloud](https://console.cloud.google.com):
   - crie um projeto;
   - configure a tela de consentimento como **External**, sem logo, e adicione seu e-mail como usuário de teste;
   - crie um **ID do cliente OAuth** do tipo Web application, com o redirect `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
2. No Supabase, em **Authentication → Sign In / Providers → Google**, ligue e cole o Client ID e o Client Secret.
3. Em **Authentication → URL Configuration**, coloque o endereço do site em **Site URL** e `https://SEU-SITE.vercel.app/**` em **Redirect URLs**.

### Conectar os bancos (Meu Pluggy)

1. Crie sua conta em [meu.pluggy.ai](https://meu.pluggy.ai) e conecte seus bancos. Cada banco pede a autorização no app dele.
2. Em [dashboard.pluggy.ai](https://dashboard.pluggy.ai), crie uma aplicação de desenvolvimento com o conector **MeuPluggy** e copie o **Client ID** e o **Client Secret**.
3. Abra o **Demo** da aplicação, escolha MeuPluggy e autorize. Faça isso uma vez para cada banco e copie cada **Item ID**. Faça isso nos primeiros 15 dias: depois do período de teste não dá para conectar bancos novos pelo Demo, mas os já conectados continuam funcionando.
4. No Meu Cofrin, em **Bancos e ajustes**:
   - cole o Client ID e o Client Secret;
   - adicione cada Item ID com o nome do banco (Nubank, Itaú, Inter, Caixa, Mercado Pago...). O nome define a cor do cartão.

Limites do Meu Pluggy:
- até 5 conexões;
- os bancos atualizam uma vez por dia e não dá para forçar;
- a autorização do Open Finance vale 12 meses. Quando vencer, refaça no meu.pluggy.ai.

Guia oficial: [github.com/pluggyai/meu-pluggy](https://github.com/pluggyai/meu-pluggy)

## Segurança

- **Login fechado:** o cadastro só aceita os e-mails da tabela `private.allowed_emails`.
- **Dados por usuário:** cada um tem uma linha em `app_state`, protegida por RLS. Cada usuário só lê e grava a própria.
- **Dados trancados:** os dados de cada conta ficam compactados e criptografados (AES-256-GCM) no banco, com a `SECRET_KEY` que só existe na Vercel. Quem abre o Supabase vê só um texto ilegível. As chaves da Pluggy e da OpenAI também, e nunca voltam para o navegador. **Guarde uma cópia da `SECRET_KEY`** (num gerenciador de senhas): sem ela, os dados não abrem mais.
- **Agendador protegido:** ele usa um segredo gerado dentro do próprio banco (`private.cron_config`). As funções que leem os dados de todos só respondem com esse segredo.
- **Servidor:** o site manda cabeçalhos de segurança (CSP, sem iframe, sem indexação).

## Para quem quer mexer no código

Precisa de [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm test           # testa as regras (fatura, transferências, salário, contas)
npm run build:web  # monta o site em web/dist
npm start          # abre a versão de Windows em modo de desenvolvimento
npm run pack:win   # gera a pasta do app para Windows em dist/
```

Estrutura:

- `src/rules.js`: as regras que transformam o extrato no painel. `src/insights.js` tem metas, limites, parcelas, assinaturas e alertas.
- `src/actions.js`: as ações do app (salvar, sincronizar, metas...), usadas pelo site.
- `src/sync.js` e `src/pluggy.js`: busca contas, transações e faturas na Pluggy (somente leitura).
- `src/assistant.js`: o assistente (OpenAI), com as ferramentas de lembrete.
- `src/push.js`: decide e manda as notificações.
- `api/rpc.js`: a única rota do site. Confere o login, carrega os dados, roda a ação e grava.
- `api/cron.js`: chamada de hora em hora pelo Supabase. Sincroniza e notifica.
- `renderer/`: a interface (a mesma no site e no Windows). `web/` tem o login, o service worker e o build do site.
- `main.js` e `preload.js`: a versão de Windows.
- `supabase/`: o SQL para montar o banco.

As fontes Inter e Space Grotesk vêm do projeto Fontsource, sob a licença SIL Open Font License (arquivos em `renderer/fonts`).
