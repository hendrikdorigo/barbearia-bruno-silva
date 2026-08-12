# Bruno Silva Barbearia — Site/App

Sistema completo de agendamento, portfólios, comunidade e gestão para a
barbearia do Bruno Silva. Next.js (App Router, TypeScript) + Supabase
(banco/auth/storage) + Tailwind CSS. Deploy no Netlify.

## Credenciais de teste (admin/dono)

- URL do site: (ver mensagem de entrega / Netlify)
- E-mail: `bruno@barbearia.com`
- Senha: `Bruno@123`

Bruno é ao mesmo tempo **admin** (painel `/painel/admin`) e **barbeiro**
(painel `/painel/barbeiro`, com portfólio próprio).

Para testar como cliente, crie uma conta em `/cadastro`. Para testar como
barbeiro parceiro, cadastre um em `/painel/admin/barbeiros` logado como
Bruno.

## Rodando localmente

```bash
npm install
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Abra http://localhost:3000.

> Nota: para as rotas `/api/admin/barbeiros` e `/api/cron/*` funcionarem
> localmente, defina também `SUPABASE_SERVICE_ROLE_KEY` (Project Settings →
> API → service_role, no painel do Supabase) e `CRON_SECRET` (qualquer
> string aleatória) no `.env.local`. Essas chaves nunca devem ser expostas
> ao cliente/navegador.

## O que já está implementado (funcional)

- Home pública, listagem de barbeiros, página de portfólio individual com
  avaliações de clientes.
- Cadastro de cliente (CPF, data de nascimento, usuário/senha, foto opcional)
  e login.
- Fluxo completo de agendamento: barbeiro → serviço (4 preços fixos) →
  data/horário em slots de 30 min → aviso destacado de tolerância de atraso
  de 15 min → forma de pagamento (Crédito, Débito, Dinheiro, Pix) com opção
  de pagamento antecipado → confirmação.
- Cada barbeiro configura seus próprios dias e horários de trabalho em
  `/painel/barbeiro/horarios` (tabela `barbeiro_horarios`: liga/desliga cada
  dia da semana e define hora de início/fim). O agendamento respeita essa
  janela automaticamente — dias desligados aparecem como "não atende" e os
  slots são gerados só dentro do horário daquele barbeiro naquele dia. Novo
  barbeiro cadastrado já nasce com o padrão seg–sáb 09h–19h30 (domingo
  fechado), editável a qualquer momento.
- Gateway de pagamento **mock** com aprovação instantânea
  (`src/lib/payments.ts`), pronto para trocar por Mercado Pago/Stripe/PagSeguro.
- Regras de negócio no banco (triggers/funções Postgres):
  - Repasse automático de 50% ao Bruno quando o barbeiro não é o dono.
  - Função `marcar_no_show` cancela o agendamento e marca
    `exige_pagamento_antecipado = true` no cliente; some automaticamente
    após a próxima marcação ser concluída.
  - Trigger cria automaticamente um lembrete na fila `lembretes_whatsapp`
    (agendado para 1h antes) a cada novo agendamento.
  - Trigger notifica todos os clientes cadastrados a cada novo post na
    comunidade.
- Comunidade: barbeiros publicam texto/imagem/vídeo; clientes curtem e
  comentam; notificações in-app.
- Painel do barbeiro: agenda própria (confirmar/concluir/marcar no-show),
  edição do portfólio (bio, especialidades, imagens), posts da comunidade,
  botão de conexão com Google Calendar.
- Painel do admin (Bruno): todos os agendamentos com filtro por
  barbeiro/data/status, cadastro/ativação/desativação de barbeiros
  parceiros, tela de repasses de 50%.
- RLS configurado em todas as tabelas (clientes só veem os próprios dados,
  barbeiros gerenciam seu próprio portfólio/agenda, admin tem acesso total).

## Estrutura pronta, aguardando credenciais externas

### 1. WhatsApp Business API (lembrete 1h antes + aviso de 15 min de tolerância)

- Fila: tabela `lembretes_whatsapp` (criada automaticamente por trigger a
  cada agendamento).
- Adapter isolado: `src/lib/whatsapp.ts` — hoje sem token, apenas loga e
  marca a tentativa como "falhou" com o motivo.
- Endpoint que processa a fila: `POST /api/cron/lembretes` (protegido por
  header `x-cron-secret`).
- Função agendada Netlify já criada: `netlify/functions/lembretes-cron.mts`
  (roda a cada 10 min).
- **Para ativar**: preencha no Netlify as env vars `WHATSAPP_API_TOKEN`,
  `WHATSAPP_PHONE_NUMBER_ID` (Meta Cloud API) e `CRON_SECRET`.

### 2. Cancelamento automático por atraso (no-show)

- Endpoint: `POST /api/cron/no-show`, também protegido por `x-cron-secret`.
- Função agendada Netlify: `netlify/functions/no-show-cron.mts` (a cada 5 min).
- Hoje o barbeiro também pode marcar manualmente "no-show" pelo painel dele.
- **Para ativar a automação**: preencha `SUPABASE_SERVICE_ROLE_KEY` e
  `CRON_SECRET` no Netlify.

### 3. Google Calendar (OAuth por barbeiro)

- Botão "Conectar Google Calendar" no painel do barbeiro
  (`src/components/ConectarGoogleCalendar.tsx`).
- Fluxo OAuth real implementado em `src/lib/google-calendar.ts` +
  `/api/google/connect` + `/api/google/callback`. Tokens salvos em
  `barbeiros.google_calendar_access_token/refresh_token`.
- **Falta**: criar um projeto no [Google Cloud Console](https://console.cloud.google.com),
  ativar a Google Calendar API, criar credenciais OAuth (tipo "Web
  application") e preencher `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e
  `GOOGLE_REDIRECT_URI` (`https://SEU-DOMINIO/api/google/callback`) nas env
  vars do Netlify.
- A criação do evento em si (`criarEventoAgenda`) ainda precisa ser chamada
  no momento em que um agendamento é confirmado — hoje ela existe como
  função pronta em `src/lib/google-calendar.ts`, mas não está conectada ao
  fluxo de confirmação (próximo passo natural: chamá-la dentro de
  `AgendaBarbeiro.tsx` ou via trigger/edge function quando `status` vira
  `confirmado` e o barbeiro está conectado).

### 4. Gateway de pagamento real

- Hoje: mock com aprovação instantânea (`src/lib/payments.ts`).
- Para trocar por Mercado Pago, Stripe ou PagSeguro: substitua
  `processarPagamentoMock` pela chamada real da API do gateway escolhido,
  mantendo a mesma assinatura de retorno (`{ aprovado, referencia }`), e
  trate o webhook de confirmação do gateway para atualizar
  `pagamentos.status`.

## Banco de dados (Supabase)

- Projeto: `barbearia-bruno-silva` (região `sa-east-1`).
- Tabelas principais: `profiles`, `clientes`, `barbeiros`, `servicos`,
  `agendamentos`, `pagamentos`, `feedbacks`, `posts_comunidade`,
  `post_curtidas`, `post_comentarios`, `notificacoes`, `lembretes_whatsapp`.
- RLS habilitado em todas as tabelas. Buckets de Storage: `avatars`,
  `portfolio`, `comunidade` (públicos para leitura).
- Os 4 serviços fixos (Cabelo R$50, Barba R$40, Cabelo+Barba R$75, Cabelo
  Pai/Filho R$85) já estão semeados na tabela `servicos`.

> O projeto anterior "lenci-clinica" foi **pausado** (não excluído) para
> liberar uma vaga no plano gratuito do Supabase, conforme combinado. O
> projeto "mamute-telemetria" não foi alterado.

## Deploy na Vercel

O projeto Netlify da conta ficou sem créditos de deploy de produção, então
o deploy oficial passou a ser pela **Vercel** (também tem plano gratuito
generoso e é a plataforma nativa do Next.js).

```bash
npm install -g vercel   # se ainda não tiver
cd barbearia-bruno-silva
vercel login
vercel --prod
```

Durante o `vercel --prod` ele pergunta o nome do projeto (pode usar
`barbearia-bruno-silva`) e detecta o framework Next.js automaticamente —
não precisa configurar build command nem publish directory.

Alternativa sem terminal: importe o repositório (suba este código pro
GitHub primeiro) em [vercel.com/new](https://vercel.com/new) e conecte a
conta — cada `git push` vira um deploy automático.

Depois do primeiro deploy, preencha as env vars em **Project Settings →
Environment Variables** na Vercel (mesmos nomes da seção abaixo) e rode
`vercel --prod` de novo (ou faça um novo push) para elas entrarem em vigor.

### Sobre os jobs de cron (lembrete WhatsApp e no-show)

O plano gratuito (Hobby) da Vercel só permite cron job **1x por dia**, o
que não serve para os jobs de "a cada 5–10 minutos" que este projeto
precisa. Os endpoints (`/api/cron/no-show` e `/api/cron/lembretes`) já
aceitam tanto `GET` com header `authorization: Bearer <CRON_SECRET>`
quanto `POST` com header `x-cron-secret: <CRON_SECRET>` — então, em vez do
`vercel.json`, use um cron **externo e gratuito** apontando pra essas
rotas, por exemplo:

- [cron-job.org](https://cron-job.org) (gratuito): crie duas tarefas GET,
  uma para `https://SEU-DOMINIO/api/cron/no-show` a cada 5 min e outra
  para `https://SEU-DOMINIO/api/cron/lembretes` a cada 10 min, com o
  header `Authorization: Bearer <CRON_SECRET>`.
- Ou GitHub Actions com `schedule` no seu repositório, fazendo o mesmo GET.

(Se no futuro migrar para o plano Pro da Vercel, aí sim dá pra usar
`vercel.json` com `"crons"` nativamente.)

## Variáveis de ambiente

Necessárias para o site funcionar: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Ainda por preencher (opcionais, para ativar as integrações acima):
`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `WHATSAPP_API_TOKEN`,
`WHATSAPP_PHONE_NUMBER_ID`.

## Identidade visual

Wordmark tipográfico "Bruno Silva Barbearia" em preto (#0B0B0C) + dourado
(gradiente #E4C767 → #C9A227 → #8F7418), tipografia display Bebas Neue +
corpo Inter. Imagens de placeholder via Unsplash, fáceis de trocar depois
por fotos reais (basta atualizar as URLs em `portfolio_imagens` de cada
barbeiro pelo próprio painel, ou trocar a imagem do hero em
`src/app/page.tsx`).
