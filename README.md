# Meu Caixa

Painel de finanças pessoais para Windows que se atualiza sozinho com seus bancos e cartões pelo Open Finance, usando o **Meu Pluggy** (gratuito para uso pessoal). Nada de digitar compra por compra.

Tudo fica guardado só no seu computador. O app não tem servidor, não manda seus dados para lugar nenhum além da própria Pluggy, e o Client Secret é criptografado pelo Windows.

## O que ele mostra

- **Livre até o salário:** o dinheiro nas contas hoje menos o que vence antes do próximo salário, e quanto sobra do salário depois das faturas, despesas fixas e do que você quer investir.
- **Cartões:** fatura atual de cada cartão, limite livre e as últimas faturas.
- **Contas a pagar:** despesas fixas (mensais ou semanais), contas de uma vez só e as faturas dos cartões. Cada uma fica paga sozinha quando o pagamento aparece no extrato.
- **Lançamentos:** tudo que entrou e saiu, com categoria. Dá para trocar a categoria de um lançamento ou criar uma regra fixa ("tudo que for Fulana de Tal é Contas da casa").
- **Para onde foi o dinheiro:** gastos por categoria. Clique numa categoria para ver os lançamentos.
- **Créditos fora do banco**, como o crédito do iFood: você lança as compras e acompanha o limite.
- Botão de olho para esconder todos os valores na tela.

O app já trata casos que bagunçam outros controles: pagamento de fatura não conta como gasto, Pix entre suas próprias contas não é renda nem despesa, Pix no crédito e suas taxas aparecem separados, e o salário que cai no fim do mês conta para o mês seguinte.

## Instalar

1. Baixe o `MeuCaixa-Windows.zip` na página de **Releases** deste repositório.
2. Descompacte numa pasta fixa (não deixe em Downloads) e abra `Meu Caixa.exe`.
3. O Windows pode avisar que o app é desconhecido, porque ele não tem assinatura digital. Clique em **Mais informações** e depois em **Executar assim mesmo**.
4. Para conhecer antes de conectar, clique em **Ver com dados de exemplo**. Depois saia do exemplo em Bancos e ajustes.

O app abre junto com o Windows e fica perto do relógio. Fechar a janela não fecha o app: para sair de vez, clique com o botão direito no ícone e escolha **Sair**.

## Conectar seus bancos (uma vez só)

1. Crie sua conta em [meu.pluggy.ai](https://meu.pluggy.ai) e conecte seus bancos. Cada banco pede a autorização no app dele.
2. Em [dashboard.pluggy.ai](https://dashboard.pluggy.ai), crie uma aplicação de desenvolvimento. Nas configurações dela, deixe o conector **MeuPluggy** na lista. Copie o **Client ID** e o **Client Secret**.
3. Ainda no dashboard, abra o **Demo** da aplicação, escolha **MeuPluggy** e autorize. Faça isso uma vez para cada banco.
4. Clique em cada item conectado no Demo e copie o **Item ID**.
5. No Meu Caixa, em **Bancos e ajustes**: cole o Client ID e o Client Secret, depois adicione cada Item ID com o nome do banco (Nubank, Itaú, Inter, Caixa, Mercado Pago...). O nome é usado para a cor do cartão, porque a Pluggy chama todos de "MeuPluggy".
6. Informe o salário e o dia em que ele cai.

Guia oficial: [github.com/pluggyai/meu-pluggy](https://github.com/pluggyai/meu-pluggy)

### Limites do Meu Pluggy

- Até 5 conexões (bancos) no plano gratuito.
- A Pluggy atualiza os bancos uma vez por dia. Uma compra de hoje pode aparecer só amanhã.
- A autorização do Open Finance vale 12 meses. Quando vencer, refaça a conexão no meu.pluggy.ai.
- Cada banco manda os dados de um jeito. Na tela Cartões, cada cartão mostra como a fatura foi calculada.

## Onde ficam os dados

`%APPDATA%\Meu Caixa\meu-caixa.json`, com uma cópia de segurança por dia na pasta `backups` ao lado (guarda as últimas 14).

## Versão web (celular e qualquer computador)

O mesmo painel também roda como site, com login, usando Vercel e Supabase:

- `api/rpc.js` é a única rota do servidor. Ela confere o login no Supabase, carrega os dados do dono e roda a mesma lógica do app de Windows (`src/actions.js`).
- Os dados ficam numa linha por usuário em `app_state`, protegida por RLS (cada um só lê e grava a própria).
- O Client Secret da Pluggy é guardado criptografado (AES-256-GCM) com a chave `SECRET_KEY`, que só existe na Vercel.
- O cadastro é fechado: só e-mails da tabela `private.allowed_emails` conseguem criar senha.
- Não há agendamento: o site atualiza os bancos quando você abre e a última atualização tem mais de 6 horas.

Variáveis na Vercel: `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SECRET_KEY` (32 bytes aleatórios em base64, por exemplo `openssl rand -base64 32`).

## Para quem quer mexer no código

Precisa de [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm start          # abre o app em modo de desenvolvimento
npm test           # testa as regras (fatura, transferências, salário, contas)
npm run pack:win   # gera a pasta do app para Windows em dist/
```

Estrutura:

- `main.js`: janela, ícone perto do relógio, sincronização agendada e comunicação com a tela.
- `src/pluggy.js`: cliente da API da Pluggy (somente leitura).
- `src/sync.js`: busca contas, transações e faturas e grava no arquivo local.
- `src/rules.js`: todas as regras que transformam o extrato no painel.
- `src/demo.js`: dados de exemplo (inventados).
- `renderer/`: a interface.

As fontes Inter e Space Grotesk vêm do projeto Fontsource, sob a licença SIL Open Font License (arquivos em `renderer/fonts`).
