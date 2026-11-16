# Revisão de segurança

Feita na fase 7, em 15/11/2026, com o build de produção e o servidor local. Refazer antes de cada publicação grande.

## As quatro perguntas do roteiro

**1. A chave aparece em algum arquivo enviado ao navegador?** Não.
Busca do valor real da chave (sem imprimi-lo) em `.next/static`, no `.next` inteiro, nos arquivos versionados e em todo o histórico do git: 0 ocorrências em todos. O `.env.local` está no `.gitignore` e nunca foi commitado. A chave só é lida em `src/lib/lastfm/client.ts`, que importa `server-only` (o build falha se o navegador tentar importá-lo).

**2. Existe alguma variável `NEXT_PUBLIC_` indevida?** Não.
A única variável de ambiente lida pelo código é `LASTFM_API_KEY`, no servidor. `NEXT_PUBLIC_` só aparece em comentários e docs que proíbem o uso.

**3. Alguma rota aceita método ou domínio fora da lista?** Não.
- As 7 rotas (`user`, `top`, `tags`, `scrobbles`, `chart`, `album`, `track`) exportam só `GET`; POST, PUT, DELETE e PATCH devolvem 405. (`chart` e `album` entraram depois da fase 7, para o ano inteiro; `track`, em 16/11/2026, para as capas das músicas; conferidas do mesmo jeito.)
- O método do Last.fm é fixo em cada rota e conferido contra a lista de `docs/LASTFM.md`. Um `?method=` extra na URL é ignorado.
- O código só faz `fetch` para o endereço fixo da API do Last.fm (servidor) e para as nossas próprias rotas (navegador).
- Imagens: desde 16/11/2026 a tela carrega as capas direto do Last.fm (`images.unoptimized`), então o otimizador da Vercel não é usado. Antes disso, ele aceitava só `https://lastfm-img.freetls.fastly.net/i/u/**`. Testado: outro domínio, outra pasta, `http://` e `lastfm-img.freetls.fastly.net.evil.com` devolvem 400. Não existe rota de proxy de imagens (as capas são carregadas direto, com CORS; ver `LASTFM.md`).
- Validação de entrada em tudo: username (regra do Last.fm), período, tipo, limite, nome de artista e de álbum, intervalo de até 32 dias (`scrobbles`) ou 367 dias (`chart`), página até 50.

**4. Algum log grava username?** Não, depois de uma correção.
- Os `console.error` registram só o método do Last.fm e o código do erro.
- O log de pedidos do `next dev` ignora `/api/lastfm/*` e `/u/*`. Conferido com pedidos reais: nenhum username nos logs.
- **Corrigido nesta revisão:** o formulário da página inicial não tinha `action`. Se fosse enviado antes de o JavaScript carregar, virava `GET /?username=NOME`, que aparecia no log (e não levava a lugar nenhum). Agora ele envia para `/u?username=NOME`, que redireciona para `/u/NOME` e também fica fora do log.

## Publicação (fase 8, 16/11/2026)

- Site em https://sulcofm.vercel.app; repositório público em https://github.com/lulkabral/sulco.
- Antes de publicar: `.env.local` nunca foi commitado; o valor da chave não aparece no histórico do git nem nos arquivos do repositório.
- Depois de publicar: busca da chave nas páginas e nos 10 arquivos JavaScript servidos ao navegador: 0 ocorrências. POST nas rotas: 405.
- Corrigido na publicação: a imagem de compartilhamento apontava para um domínio interno da Vercel (404). Agora `metadataBase` fixa o endereço oficial em `src/app/layout.tsx`.

## Capacidade no plano grátis (16/11/2026)

Painel da Vercel nas primeiras 12 horas: 8,3 mil pedidos na CDN, 2,3 mil execuções de funções, 87 MB transferidos. Comparando com as cotas mensais do plano Hobby (1 milhão de pedidos, 1 milhão de execuções, 100 GB), há folga de sobra.
- **O que estava perto do limite:** a otimização de imagens (cota de alguns milhares por mês). Cada perfil novo gastava umas 13 (12 capas + avatar). Corrigido: as imagens vêm direto do Last.fm, em miniatura de 174 px.
- **As rotas `/api/lastfm/*`** respondem com `s-maxage`, então pedidos repetidos saem da CDN sem executar função nem chamar o Last.fm. Mês fechado fica 1 dia na CDN.
- **Se algo estourar no plano Hobby, a Vercel pausa o recurso até o mês virar** (não cobra). Acompanhar em Observability e em Usage no painel.

## Contagem de visitas (16/11/2026)

Vercel Web Analytics, sem cookies, ligado pelo componente `PrivateAnalytics` em `src/app/layout.tsx`. O filtro `beforeSend` (`src/lib/analytics.ts`, com teste):
- troca `/u/NOME` por `/u/[perfil]` e descarta tudo depois do `?` e do `#`;
- não envia nada se o navegador pedir Do Not Track ou Global Privacy Control.
O script da Vercel só envia o endereço de origem quando a pessoa vem de outro site (conferido no código do script), então páginas internas com username nunca vão como origem. Nada de eventos personalizados com dados do perfil.

## Riscos que continuam

- ~~Sem limite de pedidos nas nossas rotas.~~ **Resolvido em 16/11/2026:** regra `limite-api` no Firewall da Vercel (projeto `sulco`): caminho começando com `/api/lastfm`, 120 pedidos por 60 s por IP, acima disso responde 429. Criada e publicada pela CLI (`vercel firewall rules list --project sulco` mostra). Além dela, a proteção automática da Vercel ("Security Checkpoint") desafia rajadas de pedidos de um mesmo IP: no teste, 130 pedidos seguidos via `curl` levaram 403 antes de chegar à regra; navegadores passam pela verificação sozinhos. Não repita testes de rajada contra o site em produção.
- **Registros da hospedagem.** A Vercel guarda por pouco tempo os endereços acessados, e `/u/NOME` inclui o username. Isso está dito na página `/privacidade`.
- **`metadataBase` local.** O build local avisa que usa `http://localhost:3000` nos endereços da imagem de compartilhamento. Na Vercel, o Next usa o domínio do projeto sozinho (`VERCEL_PROJECT_PRODUCTION_URL`). Conferir na fase 8.
