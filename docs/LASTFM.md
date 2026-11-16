# Cola da API do Last.fm

Documentação oficial: https://www.last.fm/api
Termos de uso: https://www.last.fm/api/tos

Itens marcados com **(confirmar)** vêm de relatos da comunidade ou de memória. Teste com uma chamada real antes de depender deles e atualize este arquivo com o resultado.

## Básico

- Endereço único: `https://ws.audioscrobbler.com/2.0/`
- Parâmetros sempre presentes: `method`, `api_key`, `format=json`
- Os métodos abaixo são de leitura e não exigem login do usuário, só a nossa chave.
- Exemplo:

```
GET https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=USERNAME&period=7day&limit=25&api_key=CHAVE&format=json
```

## Métodos permitidos nas nossas rotas

| Método | Para quê | Parâmetros principais |
|---|---|---|
| `user.getInfo` | validar o username, avatar, total de scrobbles | `user` |
| `user.getTopArtists` | top artistas | `user`, `period`, `limit`, `page` |
| `user.getTopAlbums` | top álbuns e grade | `user`, `period`, `limit`, `page` |
| `user.getTopTracks` | top músicas | `user`, `period`, `limit`, `page` |
| `user.getRecentTracks` | scrobbles de um intervalo (mês fechado) | `user`, `from`, `to`, `limit` (máx. 200), `page` |
| `artist.getTopTags` | tags do artista (gêneros) | `artist` |
| `user.getWeeklyArtistChart`, `user.getWeeklyAlbumChart`, `user.getWeeklyTrackChart` | tops de um ano inteiro (com `from`/`to` livres) | `user`, `from`, `to` |
| `album.getInfo` | só a capa dos álbuns do ano (o gráfico não traz imagem) | `artist`, `album` |
| `track.getInfo` | só a capa do álbum de cada música da lista "Músicas" (o top de músicas só traz a estrela) | `artist`, `track`, `autocorrect=1` |

Qualquer outro método deve ser recusado pela rota.

`period` aceita: `overall`, `7day`, `1month`, `3month`, `6month`, `12month`.

## Armadilhas

1. **`1month` não é mês do calendário.** São os últimos 30 dias corridos. Para "outubro de 2026", usar `user.getRecentTracks` com `from` e `to` e somar.
2. **`from` e `to` são timestamps UNIX em UTC.** O começo e o fim do mês devem ser calculados no fuso da pessoa (no navegador) e convertidos.
3. **Faixa tocando agora.** `user.getRecentTracks` pode devolver no topo a música em reprodução, com `@attr.nowplaying = "true"` e sem campo `date`. Ignorar na soma. **Ela aparece mesmo com `from`/`to` de um mês passado** (confirmado em 15/11/2026: a página 1 de outubro veio com 201 itens para `limit=200`). Descartada em `normalizeScrobblePage`.
4. **Paginação.** A resposta traz `@attr.totalPages` e `@attr.total`. Buscar página a página, com limite máximo.
5. **Formato cru estranho.** Campos como `artist["#text"]`, `image[].#text`, `@attr`. Números chegam como texto. Normalizar tudo no servidor antes de devolver.
6. **Um item só pode vir como objeto em vez de lista.** Nos tops com `limit=1` veio lista (testado em 15/11/2026), mas a normalização trata os dois casos por segurança.
7. **Fotos de artista não existem na API.** Desde 2019 o campo de imagem de artista devolve um placeholder (estrela branca em fundo cinza). Capas de álbum funcionam normalmente. O placeholder tem `2a96cbd8b46e442fc41c2b86b821562f` no endereço (confirmado em 15/11/2026, também aparece nas imagens de `user.getTopTracks`); tratamos como "sem imagem".
8. **Álbum sem capa.** O campo de imagem vem como texto vazio.
9. **Tamanho das capas.** O maior tamanho listado é `extralarge` (300 px). Trocar o trecho de tamanho no endereço funciona (confirmado em 15/11/2026): `600x600` devolve 600 px; tirar o trecho devolve o original (640 px no teste); pedir acima do original devolve o original. Para a grade 5x5, 300 px por capa já dá 1500 px de largura. Miniatura: `174s` devolve 174 px (~55 KB), mas `174x174` devolve o **original** (4 MB no teste de 16/11/2026); os tamanhos `NxN` só funcionam para 300 e 600. A tela usa `174s` (`thumbUrl`).
10. **Erros.** Conferir o campo `error` no JSON; não confiar só no status HTTP. Usuário inexistente vem com HTTP 404 e `{"error": 6, "message": "User not found"}`.
11. **Período inválido não dá erro.** `period=2day` devolve os dados de `overall` sem avisar (testado em 15/11/2026). Por isso validamos `period` na nossa rota.

| Código | Significado | Nosso código |
|---|---|---|
| 6 | parâmetro inválido / usuário não encontrado | `USER_NOT_FOUND` |
| 8 | "operation failed": falha passageira do Last.fm (visto em 15/11/2026 em `user.getTopAlbums` 12month; a mesma chamada funcionou logo depois) | `LASTFM_DOWN`, com uma nova tentativa automática |
| 10 | chave inválida | `LASTFM_DOWN` (e registrar no log do servidor, sem a chave) |
| 11, 16 | serviço fora do ar / erro temporário | `LASTFM_DOWN`, com uma nova tentativa automática |
| 17 | exige login: histórico recente privado **(confirmar)** | `PRIVATE_PROFILE` |
| 26 | chave suspensa | `LASTFM_DOWN` |
| 29 | limite de requisições | `RATE_LIMITED` |

Fora do site, a ferramenta local `npm run banner` (só para a conta oficial) também usa `album.getInfo` e `artist.getTopAlbums`, direto da máquina do dono do projeto. Isso não passa pelas rotas e não é exposto ao navegador.

## Uso responsável

- O Last.fm não publica um limite numérico, mas os termos avisam que a conta pode ser suspensa se o app fizer várias chamadas por segundo continuamente. Meta do projeto: no máximo 3 a 4 chamadas simultâneas por pedido e cache em tudo.
- Tempo de cache sugerido (cabeçalho `Cache-Control` com `s-maxage`):
  - `user.getInfo` e tops por período: 10 a 30 minutos
  - páginas de scrobbles de mês já encerrado: 24 horas ou mais
  - páginas de scrobbles do mês corrente: 10 minutos
  - tags de artista: 7 dias
- Enviar um `User-Agent` que identifique o projeto.

## Termos de uso (resumo do que nos afeta)

- Uso permitido apenas não comercial. Para uso comercial, é preciso pedir acordo ao Last.fm (partners@last.fm).
- Exigem crédito com link para o Last.fm. Links de perfil devem apontar para `https://www.last.fm/user/USERNAME`; links de artista, álbum ou música, para a página correspondente no Last.fm.
- Há um teto de dados do Last.fm que se pode manter armazenado; como não guardamos nada além de cache temporário, não nos afeta.

## Como criar a chave

1. Entrar no Last.fm e abrir https://www.last.fm/api/account/create
2. Preencher nome e descrição do app. O campo de callback pode ficar vazio.
3. Copiar a "API key" para o arquivo `.env.local`. O "shared secret" não é usado neste projeto.

## Descobertas (preencher durante o desenvolvimento)

- CORS do servidor de imagens: as capas vêm de `lastfm-img.freetls.fastly.net` (não `lastfm.freetls.fastly.net`) e a resposta traz `Access-Control-Allow-Origin: *` (curl em 15/11/2026).
- **Capas no canvas (fase 3, testado no Chromium em 15/11/2026):** carregando a imagem com `img.crossOrigin = "anonymous"`, a capa é desenhada e o canvas exporta PNG normalmente (300 e 600 px). Sem o `crossOrigin`, a capa aparece, mas `toBlob`/`toDataURL` falham com "Tainted canvases may not be exported". Conclusão: **não precisamos de rota que repasse imagens**; o navegador busca as capas direto do servidor de imagens (`src/lib/canvas/image.ts`). Falta conferir no Safari do iPhone.
- Algumas capas de 600 px demoram vários segundos (uma levou 6 s no teste). Por isso `loadImage` desiste depois de 15 s e trata o álbum como "sem capa".
- **Total de scrobbles de um período (fase 4, testado em 15/11/2026):** os tops não trazem esse número (o `total` deles é a quantidade de itens *diferentes*). Usamos `user.getRecentTracks` com `from`, `to` e `limit=1`: o `@attr.total` da resposta é o total do intervalo, e bate exatamente com a soma dos plays de `user.getTopArtists` no mesmo período.
- **Quantos dias cada período tem:** `7day` = 7, `1month` = 30, `3month` = 90, `6month` = 180, `12month` = 365 dias, contados para trás a partir de agora (com 182 dias, por exemplo, o total de `6month` já não bate). Ficam em `PERIOD_DAYS` (`src/lib/periods.ts`). O fim do intervalo é arredondado em blocos de 10 min para o cache funcionar.
- **Páginas de scrobbles (fase 6, testado em 15/11/2026):**
  - Cada página leva de 1 a 4 s para responder. Por isso buscamos até 3 páginas ao mesmo tempo, e não uma por vez.
  - Página além da última (`page=999`) devolve lista vazia, sem erro.
  - `limit` acima de 200 funciona na prática (`limit=1000` devolveu 1000 itens), mas a documentação diz que o máximo é 200. Ficamos com 200.
  - A faixa traz só o artista *da faixa*, não o artista *do álbum*. Em coletâneas e trilhas, faixas do mesmo álbum podem virar "álbuns" diferentes na soma.
  - **Conferência:** outubro de 2026 de um perfil real, somado pelo site, bateu exatamente com a biblioteca do Last.fm (`/user/USERNAME/library/artists?from=2026-10-01&to=2026-10-31`): 564 scrobbles, 54 artistas e os mesmos números no top 5.
  - Cache: intervalo encerrado há mais de 1 dia fica 1 dia na CDN (e 1 hora no navegador). Esse dia de folga existe porque scrobbles de um aparelho que estava offline ainda podem chegar depois.
- **Gráficos com intervalo livre (ano inteiro, testado em 15/11/2026):**
  - `user.getWeekly{Artist,Album,Track}Chart` foram feitos para as semanas de `user.getWeeklyChartList`, mas **aceitam qualquer `from`/`to`** (isso não está documentado). Uma chamada só, cerca de 1 s, e até 1000 itens.
  - **Conferência:** 2026 até 15/11 de um perfil real: 15.524 scrobbles pela soma dos plays de todos os artistas, igual ao total de `user.getRecentTracks` no mesmo intervalo. O top 5 de artistas bate com a biblioteca do Last.fm (Madonna 1.243, Janet Jackson 1.026, Gal Costa 1.011...).
  - Pelas páginas de scrobbles, o mesmo ano seriam 78 páginas de 200 (passa do nosso limite de 50). Por isso o ano usa os gráficos.
  - O gráfico de álbuns agrupa pelo **artista do álbum** ("Various Artists" em coletâneas), diferente da soma de scrobbles do mês fechado.
  - Os itens vêm **sem capa** (álbum sem `image`; música com a estrela genérica). A capa vem de `album.getInfo`, só para os álbuns que aparecem (9 na imagem, 25 na grade), 3 por vez, com cache de 30 dias. Na primeira vez, algumas capas demoram vários segundos.
  - `album.getInfo` de álbum inexistente: HTTP 200 com `{"error": 6, "message": "Album not found"}`. Tratamos como "sem capa".
- `track.getInfo` (testado em 16/11/2026): `track.album.image` traz a capa do álbum da música (4 de 5 músicas testadas). Música sem álbum conhecido responde HTTP 200 com erro 6; tratamos como "sem capa". Chamado pelo navegador via `/api/lastfm/track`, só para as 10 músicas da lista e só quando a capa não veio de outro lugar (no mês fechado ela vem dos scrobbles), 3 por vez, cache de 30 dias.
  - Risco: como é um uso não documentado, o Last.fm pode mudar. Se mudar, só o ano inteiro para de funcionar.
- **`artist.getTopTags` (fase 5, testado em 15/11/2026):**
  - Veio no máximo 10 tags por artista, já ordenadas. `count` vai de 0 a 100 (a mais forte vale 100) e chega como número.
  - O nome da tag pode vir com maiúsculas diferentes ("Nu Metal", "Grunge") e até em português ("male vocalistas").
  - Artista inexistente responde HTTP 200 com `{"error": 6, "message": "The artist you supplied could not be found"}`. Na nossa rota de tags isso vira lista vazia, e não `USER_NOT_FOUND`.
  - Lixo comum entre as tags mais fortes: nacionalidade ("british", "american", "United States"), "female vocalists", nome de programa ("the voice", "X factor") e o nome do próprio artista ou de um pedaço dele. A lista de descarte fica em `src/lib/genres.ts`; `npm run genres -- USERNAME` mostra o que foi usado e o que foi descartado.
  - Com um perfil real (15/11/2026) apareceram ainda: nomes de país ("Belgium", "spain", "argentina"), números soltos ("11"), tags de piada ("Better than Nicki Minaj") e nomes de pessoas usados como tag ("NandaTsunami", "DJ Caio Santos"). Os três primeiros entram por lista e regra. Nomes de pessoas não têm como ser listados; como só aparecem em artistas pouco marcados, o peso deles fica baixo e não chega ao top 5.
- Placeholder de artista: confirmado, hash `2a96cbd8b46e442fc41c2b86b821562f`, em todos os tamanhos (`34s`, `64s`, `174s`, `300x300`).
- Erro para perfil privado: ainda não testado (falta um perfil com histórico privado).
- Tamanhos maiores de capa: funcionam trocando `300x300` por `600x600`, ou tirando o trecho (original). Ver armadilha 9.
- **Usernames antigos** (testado em 16/11/2026): o cadastro atual exige começar com letra, mas contas de 2005-2006 começam com número ou `_` (`1990` e `_x` existem). A validação aceita 2 a 15 caracteres de letras, números, `_` e `-` em qualquer ordem.
- `user.getInfo` traz campos que não usamos (`spotify_expiry_estimate`, `country: "None"` quando vazio). A data de cadastro está em `registered.unixtime` (texto) e `registered["#text"]` (número).
- O `next dev` registra no terminal a URL de cada pedido, com o username. Desligamos isso para `/api/lastfm/*` e `/u/*` em `next.config.ts` (`logging.incomingRequests.ignore`). Em produção o Next não registra pedidos.
