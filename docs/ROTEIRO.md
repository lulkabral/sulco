# Roteiro

Fases do desenvolvimento, cada uma com o que ela entrega e uma lista de "pronto quando".

Ritmo de cada fase:

1. Planejar a fase antes de mexer no código.
2. Implementar e testar no navegador o que a fase entregou.
3. Rodar lint, test e build e fazer um commit pequeno e descritivo.

---

## Fase 0: Base do projeto

Base do projeto Next.js (App Router, TypeScript, Tailwind, ESLint) na versão estável atual, com Vitest e um teste de exemplo. Página inicial só com o nome do site.

Pronto quando:

- [x] `npm run dev` abre a página em http://localhost:3000
- [x] lint, test e build passam
- [x] `.env.local` existe na minha máquina e está fora do git
- [x] primeiro commit feito

## Fase 1: Conexão com o Last.fm (servidor)

Módulo de servidor que fala com o Last.fm e as rotas `GET /api/lastfm/user?user=` e `GET /api/lastfm/top?user=&type=artists|albums|tracks&period=&limit=`. Entrada validada, só os métodos permitidos, resposta normalizada em JSON limpo e tipado, erros com os nossos códigos, Cache-Control conforme o `LASTFM.md` e a chave nunca exposta. Testes das funções de normalização com respostas salvas em arquivo; o que for diferente do esperado vai para `docs/LASTFM.md`.

Pronto quando:

- [x] abrir `/api/lastfm/top?user=MEU_USER&type=albums&period=7day` no navegador mostra JSON limpo
- [x] username inexistente devolve `USER_NOT_FOUND`
- [x] a chave não aparece em nenhuma resposta nem no código do navegador
- [x] testes passam

## Fase 2: Tela inicial e página do usuário

Tela inicial (campo de username) e página `/u/[username]` com cabeçalho do usuário, seletor de período e as três listas de top em texto, seguindo a seção "Telas" de `docs/SPEC.md`. Todos os estados de "Estados que toda tela precisa tratar", layout pensado primeiro para celular e rodapé com nota de privacidade e crédito ao Last.fm. Ainda sem imagens geradas.

Pronto quando:

- [x] digitar meu username leva à página com meus tops
- [x] trocar o período atualiza as listas
- [x] usuário inexistente e período vazio mostram mensagens claras (período vazio ainda não visto com dados reais: falta uma conta sem scrobbles recentes)
- [x] funciona bem na largura de celular

## Fase 3: Grade de álbuns

Aba Grade com a colagem em canvas (3x3, 4x4 e 5x5), legenda e contagem de plays opcionais e botão para baixar em PNG (no celular, compartilhar pelo menu nativo quando houver suporte), seguindo "Recurso 2: Grade de álbuns" de `docs/SPEC.md`. Primeiro, conferir se as capas do Last.fm podem ser desenhadas e exportadas no canvas (CORS); se não, uma rota que repassa só imagens do domínio do Last.fm.

Pronto quando:

- [x] a grade aparece e o PNG baixado abre certo (PNG de 1500 px gerado no Chromium; falta abrir um baixado no celular)
- [x] álbum sem capa vira quadrado com o nome
- [x] legenda e contagem ligam e desligam
- [x] se existir rota de imagem, ela recusa qualquer outro domínio (não se aplica: as capas funcionam no canvas sem rota, ver `LASTFM.md`)

## Fase 4: Recap em imagem

Recap em canvas no formato story 1080x1920, seguindo "Recurso 1: Recap em imagem" de `docs/SPEC.md`: título do período, username, total de scrobbles, top 5 de artistas, músicas e álbuns, capa em destaque e crédito, com espaço previsto para os gêneros. Direção visual escolhida entre 2 ou 3 opções. Nomes longos cortados com reticências, fontes carregadas antes de desenhar e o mesmo fluxo de baixar ou compartilhar da grade.

Pronto quando:

- [x] o recap dos últimos 30 dias sai legível e sem texto estourando (testado também com total de 6 dígitos, álbum sem capa e nome enorme)
- [x] baixar e compartilhar funcionam (PNG gerado no Chromium; compartilhar usa o mesmo código da grade e falta testar num celular)
- [x] nada no visual lembra a marca do Spotify (direção "Encarte": papel creme, serifada, vermelho-tijolo)

## Fase 5: Gêneros

Rota de tags de artista (cache de 7 dias) e função pura, com testes, que calcula o top 5 de gêneros com os pesos e a lista de descarte da seção "Gêneros" de `docs/SPEC.md`, respeitando o limite de chamadas simultâneas. Gêneros na página e no recap, conferidos com um perfil real para ajustar a lista de descarte.

Pronto quando:

- [x] os gêneros fazem sentido para o meu perfil (conferido com o meu perfil em 15/11/2026, depois de ajustar o descarte)
- [x] tags como "seen live" não aparecem
- [x] testes passam

## Fase 6: Mês fechado

Últimos 12 meses do calendário no seletor, seguindo "Mês fechado" de `docs/SPEC.md` e as armadilhas de `docs/LASTFM.md`: rota paginada de scrobbles por intervalo e soma no navegador por artista, álbum e música, com barra de progresso, limite de páginas e fuso do navegador. Ignora a faixa "tocando agora", cache longo para meses encerrados e testes da função de soma. Recap e grade funcionam com um mês fechado.

Pronto quando:

- [x] "outubro de 2026" gera recap e grade
- [x] os números batem com a página do meu perfil no Last.fm para o mesmo intervalo (564 scrobbles, 54 artistas, top 5 igual)
- [x] aparece progresso durante o carregamento
- [x] testes passam

## Fase 7: Acabamento

Página `/privacidade` conforme a SPEC, título e descrição das páginas, imagem de compartilhamento do site, página 404 e revisão de acessibilidade (contraste, foco, textos alternativos, teclado). README atualizado. Revisão de segurança com relatório curto: a chave aparece em algum arquivo enviado ao navegador? Há variável `NEXT_PUBLIC` indevida? Alguma rota aceita método ou domínio fora da lista? Algum log grava username?

Pronto quando:

- [x] relatório de segurança sem pendências (`docs/SEGURANCA.md`; fica a recomendação de limitar pedidos na Vercel, na fase 8)
- [x] página de privacidade no ar e linkada no rodapé (no ar localmente; publicação na fase 8)
- [x] README atualizado

## Redesign "Sala escura" (entre as fases 7 e 8)

Pedido do dono do projeto: site mais atrativo e moderno, com movimento. Direção escolhida entre três mockups.

- [x] tema escuro com destaque âmbar, em todas as telas
- [x] faixas de capas passando (página inicial e topo da página do usuário)
- [x] recap, grade e imagem de compartilhamento na mesma identidade
- [x] contraste e "reduzir movimento" conferidos

## Imagem personalizável e máquina do tempo (antes da fase 8)

Pedido do dono do projeto: imagem mais artística e com escolhas, foco em lembrar (nomes e capas) e não em medir.

- [x] 4 formatos da imagem: Toca-discos, Mosaico, Lineup e Clássico
- [x] paletas de cor, incluindo "Cor da capa", com contraste testado
- [x] números desligados por padrão (total fora do cartão do álbum)
- [x] "Todo o tempo" e máquina do tempo com qualquer mês desde o cadastro
- [x] formas vivas na página inicial, paradas com "reduzir movimento"
- [x] ano inteiro e "ano até agora" na máquina do tempo (conferido com a biblioteca do Last.fm)

## Fase 8: Publicação

Publicação: repositório no GitHub, projeto conectado na Vercel, variável `LASTFM_API_KEY` cadastrada no painel e site conferido no ar. Antes, confirmar que `.env.local` não está no histórico do git; depois, a lista do que testar em produção.

Pronto quando:

- [x] site abre no endereço público (https://sulcofm.vercel.app, publicado em 16/11/2026; desde 18/11/2026 em https://www.sulcofm.com.br, com o antigo redirecionando; código em https://github.com/lulkabral/sulco)
- [x] recap e grade funcionam em produção, no celular (conferido em 16/11/2026: baixar PNG e compartilhar funcionaram)
- [x] a chave está só no painel da Vercel (0 ocorrências no repositório, no histórico e nos 10 arquivos JS publicados)

## Marca no site (depois da fase 8)

Pedido do dono do projeto: alinhar o visual do site ao manual de marca (`docs/MARCA.md`). Sem Instrument Serif e sem grão (decisões do dono; o grão chegou a ser feito e saiu para ninguém achar que a imagem sairia granulada).

- [x] cores com os nomes do manual no tema do Tailwind, sem cores soltas
- [x] título da página inicial maior (cabe em 360 px nas três línguas) e bilhete em Caveat, até 5 palavras
- [x] ficha técnica em mono no painel do recap e no perfil
- [x] destaque da página do perfil segue a paleta, só com contraste AA (senão, âmbar)
- [x] disco de vinil girando no carregamento, parado com "reduzir movimento"
- [x] passo a passo do "Não tem Last.fm?" nas três línguas, com o Spotify só como texto de instrução
- [x] conferido em 360 px e no computador, sem rolagem lateral

## Página inicial Hi-Fi / catálogo (18/11/2026)

Pedido do dono do projeto: tirar a cara de "site genérico de IA" da página inicial, numa direção de catálogo de vinil e aparelho de som (`docs/MARCA.md`).

- [x] DM Sans e DM Mono no lugar da Geist (escolhidas entre 4 opções, depois de testar a Plus Jakarta Sans), também no canvas, no logo e na prévia do link
- [x] fundo mais profundo e linhas de 1px do grid, com contraste AA conferido
- [x] campo de username em painel fino e guia do Last.fm em gaveta (Esc, toque fora e botão)
- [x] barra de catálogo, hero em duas colunas e ficha técnica
- [x] palco com os formatos reais e as paletas, sem chamada nova à API do Last.fm
- [x] vitrine em prateleira de catálogo, sem colagem com fita nem letra manuscrita
- [x] rodapé editorial em uma linha, sem pílulas
- [x] conferido em 360 px e no computador, sem rolagem lateral

## Imagens em resolução maior e @ opcional (20/11/2026)

Pedido do dono do projeto: as imagens não podem perder qualidade ao postar ou dar zoom, e o @ do Last.fm deve poder sair da imagem.

- [x] recap exportado em 1620 x 2880 (1,5x) e grade em 2400 x 2400 (mesmo layout; sombras ajustadas). O 2x (2160 x 3840 e 3000 x 3000) foi testado e pareceu demais ao dono
- [x] capas originais onde aparecem grandes (capa nº 1 do recap, grade 3x3), depois da versão rápida
- [x] PNG até 5 MB (limite do X); acima, JPEG 92% com a mesma resolução (grade 3x3: ~8 MB em PNG, ~1,2 MB em JPEG)
- [x] opção "Mostrar meu @ na imagem" (ligada por padrão), também no nome do arquivo, nas três línguas
- [x] palco da página inicial continua em 1x (é só exemplo)

## Grade no formato Stories (20/11/2026)

Pedido de um usuário no X: uma versão da grade para a tela dos Stories do Instagram. O dono aprovou a versão em tela cheia, sem nenhuma assinatura do sulco (a assinatura fica só no recap).

- [x] seletor "Formato: Quadrado / Stories" no painel da grade, nas três línguas
- [x] Stories em 1620 x 2880 (layout de 1080 x 1920 em 1,5x): 3x5 (15 álbuns, capas de 540 px) ou 4x6 (24 álbuns, capas de 405 px); sobra uma faixa do fundo em cima e embaixo, onde o Instagram põe a barra de progresso e o campo de resposta
- [x] a 5x5 não existe nos Stories (capas pequenas demais e 40 álbuns): vira 4 colunas
- [x] nome do arquivo termina em `-stories` (ex.: `grade-user-7day-3x5-stories.png`)
- [x] conferido em 360 px, sem rolagem lateral

## Comparação com o período anterior nas listas (22/11/2026)

Pedido do dono do projeto: indicar nas 4 listas de "O que mais tocou" (Artistas, Músicas, Álbuns e Gêneros) quem subiu, caiu ou apareceu pela primeira vez em relação ao período anterior.

- [x] seta verde (`▲`), seta vermelha (`▼`), bolinha azul (`●`) de primeira vez e traço neutro (`–`) ao lado da posição, com detalhe no mouse/leitor de tela
- [x] funciona em todos os períodos móveis (`7day`–`12month`), meses fechados e anos (sem setas em "Todo o tempo" ou quando o período anterior está vazio/antes do cadastro)
- [x] carregamento progressivo em segundo plano sem atrasar a página nem passar de 4 chamadas simultâneas ao Last.fm
- [x] tokens de cor com contraste AA nos modos claro, escuro e pílula escura no cartão terracota de Gêneros, com legenda discreta em PT/EN/ES

---

## Ideias para depois

- Formato quadrado 1080x1080.
- Temas de cor para o recap.
- Outros tamanhos de grade e grade de artistas.
- Login com Spotify, se as regras da API mudarem.
