# Especificação

## Ideia

O Spotify só mostra a retrospectiva no fim do ano. Este site mostra a de qualquer mês, a partir do histórico público que a pessoa já tem no Last.fm. A pessoa digita o username, escolhe o período e baixa uma imagem pronta para compartilhar.

Quem usa Spotify, Deezer, YouTube Music etc. só precisa ter o scrobbling ligado na própria conta do Last.fm. O site não se conecta a nenhum serviço de streaming.

## Telas

### 1. Início (`/`)

Direção "Hi-Fi / catálogo de vinil" desde 18/11/2026 (regras em `docs/MARCA.md`).

- **Barra de catálogo** com linha de 1px embaixo: logo à esquerda, metadados em mono no meio (no computador; sem data, porque a página fica em cache) e PT/EN/ES à direita.
- **Hero em duas colunas** com divisória de 1px (no celular, a ação primeiro e o palco embaixo):
  - à esquerda: linha técnica com "LED" âmbar, título "o que tocou / no seu mês." (segunda linha no tom de apoio, ponto final âmbar), uma frase de apoio, o campo de username com prefixo `last.fm/user/` (a partir de `sm`) e botão "Gerar →", as ações "ver outro exemplo" e "Não tem Last.fm? guia", e a ficha técnica (`04` formatos, `5×5` grade, `00` cadastro);
  - à direita, o **palco**: abas `01 Toca-discos`, `02 Lineup`, `03 Mosaico` e `04 Grade`, o pôster desenhado pelo mesmo código da imagem baixada (com as capas da vitrine, um "@exemplo" e "Últimos 30 dias") e as 5 paletas reais embaixo. Nenhuma chamada nova à API do Last.fm: só as imagens das capas. "Ver outro exemplo" gira a ordem das capas.
- **Vitrine em prateleira.** Até 6 álbuns escolhidos a dedo pelo dono do site em `src/data/vitrine.json` (como o banner do X), com a capa de cada um via `album.getInfo` (cache de 30 dias; a página toda se renova a cada dia ou a cada publicação). Confere-se com `npm run vitrine` (passo a passo em `brand/GUIA.md`). Capas retas com borda de 1px, número de catálogo, álbum e artista; a `legenda` do arquivo aparece no cabeçalho da prateleira.
- **Plano B: álbuns em alta no mundo.** Se menos de 4 capas da vitrine forem achadas, a prateleira (e o palco) mostram um ranking montado do top 50 músicas global (`chart.getTopTracks`), o álbum de cada uma (`track.getInfo`) e pontos pela posição (o `playcount` do ranking é de todos os tempos e não serve); sem coletâneas. Guardado 1 dia. Se também falhar, volta para as faixas abstratas.
- (Até 18/11/2026 havia uma "edição do dia", nº N · data, no topo; saiu porque a página fica em cache e a data atrasava.)
- Nada dos cartões "1, 2, 3" (repetiam o óbvio).
- "Não tem Last.fm? guia" abre uma gaveta (`<dialog>`: fecha no botão, tocando fora ou com Esc) com o passo a passo: criar conta, Spotify, Pano Scrobbler e o aviso de que só conta a partir da conexão.
- Rodapé de todas as páginas, em uma linha (empilhado no celular): "sulco · frase" e links de texto em mono (perfis no X, crédito ao Last.fm e privacidade). A língua fica só no topo das páginas (início, perfil, privacidade e 404). Sem pílulas e sem link do repositório (pedido do dono em 17/11/2026).

### 2. Página do usuário (`/u/[username]`)

- Cabeçalho (desde 17/11/2026): faixa com as capas mais ouvidas do último ano **passando**, com cara de colagem (borda clara, cada capa um pouco torta, fita em algumas; 1 chamada `user.getTopAlbums` com `12month`, com cache). O avatar é o selo de um **disco de vinil girando**: um aro fino de vinil em volta da foto (gira o disco, a foto fica parada; para com "reduzir movimento"). O disco avança sobre a faixa; ao lado, o username grande (link para o perfil no Last.fm) e os números em etiquetas ("70.182 scrobbles", "desde 2019").
- Abas e período numa linha só: **Recap | Grade** e um botão com o período atual ("30 dias ▾", "out 2026 ▾"), com visual de adesivo. Ele abre a escolha de período (os 6 períodos do Last.fm + o calendário de mês ou ano): no celular, uma gaveta que sobe de baixo; no computador, uma janela no meio. Usa o `<dialog>` do navegador (foco preso, Esc fecha, foco volta ao botão); fecha também ao tocar fora ou ao escolher. Assim o recap aparece já na primeira tela do celular (antes começava a 638 px; agora a ~420 px).
- Duas abas: **Recap** e **Grade**, num seletor com ícones e um destaque âmbar que desliza para a aba escolhida assim que a pessoa toca (sem esperar o servidor). Trocar de aba não recarrega os dados do período.
- Listas em texto dos tops (artistas, músicas, álbuns), que servem de conferência e de versão acessível da imagem.

## Identidade visual: "Sala escura"

Escolhida no redesign entre as fases 7 e 8, no lugar da direção "Encarte" da fase 4.

- **Tema escuro sempre.** Fundo preto quente (`#110F0D` desde 18/11/2026), superfícies `#181512`, texto `#F4EEE6`, destaque âmbar (`#E8A13A`). Nada de verde nem de degradês coloridos (não lembrar o Spotify).
- **Tipografia (desde 18/11/2026):** DM Sans (texto em 500, títulos em 800) e DM Mono para números, datas e rótulos técnicos. O canvas usa a mesma fonte. Tokens, fontes e regras em `docs/MARCA.md`.
- **Hi-Fi / catálogo (desde 18/11/2026, no lugar da colagem de zine de 17/11):** grid de linhas de 1px, rótulos em mono e o produto real como protagonista. Não usar verde neon (lembra o Spotify).
- **Movimento:**
  - na página inicial, cada capa da prateleira tem um disco girando atrás (com a capa como selo), que sai dela com o mouse em cima (as peças abstratas vivas só aparecem se a vitrine não carregar);
  - na página do usuário, as capas do ano passam no topo (param com o mouse em cima) e o avatar gira como um disco;
  - entrada suave de cartões e barrinhas.
  - Tudo para com "reduzir movimento" no sistema; as faixas também param com o mouse em cima.
- As cores ficam em `src/app/globals.css` (site) e `src/lib/theme.ts` (canvas). Mudou uma, mude a outra.
- Recap, grade e imagem de compartilhamento usam a mesma identidade.

### 3. Privacidade (`/privacidade`)

Texto curto e direto. Ver a seção "Privacidade" abaixo.

## Períodos

| Opção na tela | Como obter |
|---|---|
| Todo o tempo | `period=overall`; o total de scrobbles vem do perfil (`user.getInfo`), sem chamada extra |
| Últimos 7 dias | `period=7day` |
| Últimos 30 dias | `period=1month` |
| Últimos 3, 6, 12 meses | `period=3month` etc. |
| Mês fechado (ex.: outubro de 2026), qualquer um desde o cadastro | somar os scrobbles do intervalo (fase 6) |
| Ano inteiro (ex.: 2025) ou "2026 até agora", qualquer um desde o cadastro | gráficos do Last.fm com `from`/`to` + `album.getInfo` para as capas |

Atenção: `1month` são os últimos 30 dias corridos, não o mês do calendário. Por isso o mês fechado é uma fase separada.

## Recurso 1: Recap em imagem

Princípio: **lembrar, não medir.** A imagem mostra nomes e capas; números só se a pessoa pedir.

Conteúdo da imagem:

- título com o período (ex.: "Outubro de 2026") e o username (desde 20/11/2026 com a opção **"Mostrar meu @ na imagem"**, ligada por padrão e salva no navegador; desligada, o topo vira "RECAP" no Toca-discos, no Mosaico e no Clássico e "sulco apresenta" no Lineup, e o nome do arquivo baixado, do recap e da grade, sai sem o username);
- o álbum do período em destaque ("O álbum do mês", "O álbum da sua vida"...), com capa;
- artistas ("Na sua cabeça"), músicas ("No repeat"), álbuns e gêneros;
- rodapé com o crédito "dados: Last.fm" à esquerda e a assinatura à direita: endereço do site + logo "sulco" (disco-S desenhado no canvas, `src/lib/canvas/brandmark.ts`);
- com "Mostrar scrobbles e minutos" ligado: total de scrobbles e minutos ouvidos (na linha das datas, nunca no cartão do álbum; no Lineup, no "ingresso") e reproduções de cada item. A letra diminui se a linha não couber.
- Minutos: estimativa (o Last.fm não diz quanto durou cada scrobble). Duração média das 10 músicas mais ouvidas, pesada pelas vezes que tocaram (`track.getInfo`), vezes o total de scrobbles; sem nenhuma duração, 3 min 30 s por música (`src/lib/minutes.ts`). Só é calculada quando a pessoa liga a opção. O painel ao lado avisa que é estimativa.

A pessoa escolhe, em cima da prévia (a escolha fica guardada só no navegador dela, em `localStorage`):

- **Formato:** Toca-discos (padrão: vinil com a capa nº 1 como selo e capas empilhadas), Mosaico (colagem de 9 capas), Lineup (pôster de festival com até 15 artistas) ou Clássico (fileira de capas e cartões).
- **Cor:** paletas prontas (Âmbar, Meia-noite, Vinho, Papel, Lilás) ou "Cor da capa", tirada da capa nº 1. Cada paleta define fundo, cartões, texto e destaque juntos, com contraste testado.
- **Mostrar scrobbles e minutos** (antes "Mostrar números"): desligado por padrão. Fica num cartão com borda, que fica âmbar quando ligado.

Código: `src/lib/recap/` (um arquivo por formato em `layouts/`).

Formatos:

- Story: 1080 x 1920 (o principal). Desde 20/11/2026 a imagem é desenhada nesse layout e exportada em 1,5x, **1620 x 2880**, para ficar nítida no zoom e no arquivo baixado sem exagerar (o 2x, 2160 x 3840, pareceu demais ao dono); a capa principal (nº 1) usa a capa original do Last.fm e as demais, 600 px.
- Quadrado: 1080 x 1080 (depois).

Regras:

- Desenhar com Canvas 2D. Esperar as fontes carregarem (`document.fonts.ready`) antes de desenhar.
- Nomes longos são cortados com reticências; nunca estouram a área.
- Exportar em PNG (até 5 MB, o limite de imagem do X; acima disso, JPEG de qualidade 92%, com a mesma resolução) com dois botões lado a lado: **Baixar imagem** e **Compartilhar**. Compartilhar usa o menu nativo do celular (Web Share API com arquivo); no computador, sem esse menu, vira **Copiar imagem** (área de transferência); sem nenhum dos dois, baixa.
- Em telas de toque, a prévia é uma `<img>` (cópia PNG do canvas), para que segurar o dedo nela abra o "Salvar imagem" do celular, com a dica "segure a imagem para salvar ou compartilhar". A cópia só é gerada com a imagem completa e depois de a pessoa parar de trocar opções por 350 ms (gerar um PNG de 1080x1920 a cada clique pesava). No computador não há cópia: a tela mostra o próprio canvas.
- **Desenho progressivo (17/11/2026):** a imagem aparece assim que a fonte carrega; cada capa entra quando chega e os gêneros entram por último ("Completando capas e gêneros…" embaixo da prévia). Antes, a imagem esperava os gêneros (2 a 3 s com cache vazio) e todas as capas. Baixar e compartilhar só liberam com tudo pronto. A grade faz o mesmo com as capas.
- Artistas não têm foto disponível na API (ver `LASTFM.md`). Usar capas de álbum ou composição só com texto. Na lista "Artistas" da página, cada artista aparece numa bolinha com a capa do seu álbum mais ouvido no período (buscada pela rota `album` se ainda não veio, como no ano); sem álbum do artista na lista, a capa da sua música mais ouvida; se nada disso tiver capa, a capa do álbum mais popular do artista no Last.fm (rota `artist`); só sem nenhuma capa, a inicial do nome.
- As quatro listas da página (Artistas, Músicas, Álbuns, Gêneros) têm um ícone no título: microfone, nota, disco e etiqueta.
- Músicas e Álbuns mostram a capa em miniatura quadrada. A capa da música vem dos scrobbles (mês fechado) ou de `track.getInfo` (demais períodos, buscada no navegador depois que a lista aparece).
- Gêneros: cada gênero é uma faixa que se enche de âmbar conforme o peso, com os até 3 artistas que mais puxaram aquele gênero (nomes e bolinhas sobrepostas). Sem números.

A paleta padrão (Âmbar) é a identidade visual do site (ver "Identidade visual"). (Na fase 4 a imagem era "Encarte", em papel creme; virou a paleta "Papel".)

## Recurso 2: Grade de álbuns

- Tamanhos: 3x3, 4x4, 5x5.
- Períodos: os mesmos do seletor (padrão: últimos 7 dias, a "semaninha").
- Opções: mostrar ou não o nome do álbum e artista; mostrar ou não a contagem de plays. A grade não leva assinatura nem selo (só as capas); o recap continua com a assinatura e o crédito ao Last.fm.
- Álbum que vem sem capa no top do usuário: a grade (e o recap) pergunta à página do álbum (`album.getInfo` pela rota `/api/lastfm/album`), que às vezes tem. Se nem ela tiver, quadrado neutro com o nome do álbum.
- Exportar em **2400 x 2400** (layout de 1500 em 1,6x, desde 20/11/2026; 2400 é divisível por 3, 4 e 5, sem fresta entre as capas), com a capa original na 3x3 e 600 px na 4x4 e na 5x5. Mesmos botões e mesma prévia segurável do recap; como a 3x3 em PNG chega a ~8 MB, ela costuma sair em JPEG 92% (~1,2 MB).
- **Formato Stories (desde 20/11/2026):** seletor "Quadrado / Stories". Stories sai em **1620 x 2880** (9:16, layout de 1080 x 1920 em 1,5x), com as capas ocupando a tela: **3x5** (15 álbuns) ou **4x6** (24 álbuns; a página busca até 25). A sobra de altura vira uma faixa do fundo em cima e embaixo, onde o Instagram cobre a tela. Sem assinatura, como a grade quadrada. A 5x5 não existe nesse formato (vira 4 colunas). O nome do arquivo termina em `-stories`.

## Gêneros

O Last.fm não tem campo de gênero. O cálculo usa as tags dos artistas:

1. pegar os ~20 artistas mais ouvidos do período;
2. buscar as tags de cada um (`artist.getTopTags`);
3. normalizar nomes (minúsculas, juntar variações óbvias como "hip hop" e "hip-hop");
4. descartar tags que não são gênero (lista configurável: "seen live", "favorites", "favourites", "albums i own", anos e décadas, nacionalidades, "female vocalists", o próprio nome do artista etc.);
5. para cada artista, usar as 5 tags mais fortes que sobraram; peso = plays do artista x (força da tag / 100);
6. somar e mostrar o top 5, conferindo no Last.fm (`tag.getInfo`) só os gêneros que chegaram ao top: fica a tag que tem descrição ou que mais de 1.000 pessoas usam. A recusada sai e o top é refeito (até 3 rodadas). Isso tira apelido de fã e nome de integrante ("martin", "james" no CORTIS), que nenhuma lista pega. A conferência fica 30 dias em cache e vale para todos os usuários; na vista de ano o navegador pergunta pela rota `/api/lastfm/tag`.

Tags erradas de um artista específico (o Last.fm juntou a Marina Sena com uma cantora grega: "greek", "greek pop") ficam numa lista própria em `src/lib/genres.ts` (`WRONG_TAGS`). Estados e cidades ("texas", "atlanta", "pernambuco") estão na lista de descarte.

Descartar antes de escolher as 5 mais fortes evita que lixo forte ("the voice": 100) tome a vaga de um gênero de verdade. Implementação: `src/lib/genres.ts`.

## Mês fechado (fase 6)

- "Escolher mês ou ano": calendário com ‹ ano › e a grade de 12 meses (meses ainda abertos ou de antes do cadastro ficam apagados), mais um botão para o ano inteiro (o corrente: "até agora"). Vale qualquer mês ou ano desde o cadastro da pessoa no Last.fm; no endereço, `?period=AAAA-MM` ou `?period=AAAA`. Não usar o nome "máquina do tempo" (lembra recurso do Spotify).
- No topo da página do usuário, um botão "Trocar usuário" volta ao início (não há login nem conta para sair).
- O navegador calcula início e fim do mês no fuso da pessoa e envia como timestamps.
- O navegador pede as páginas de scrobbles pela nossa rota (a 1ª sozinha, depois até 3 ao mesmo tempo, porque cada página leva de 1 a 4 s) e soma por artista, álbum e música. A soma acontece no navegador; o servidor não guarda nada.
- Só meses já encerrados (o mês corrente fica de fora) e a partir do mês de cadastro; qualquer outro valor volta ao padrão. No endereço: `?period=AAAA-MM`.
- Mostrar progresso ("página 3 de 12").
- Limite de páginas por consulta (ex.: 50 páginas = 10 mil scrobbles), com aviso se for atingido.
- Mês já encerrado não muda: pode ter cache longo.

## Estados que toda tela precisa tratar

- Carregando: disco de vinil girando (parado com "reduzir movimento"), com barra de progresso quando houver várias chamadas.
- Usuário não encontrado.
- Perfil com histórico privado.
- Nenhum scrobble no período.
- Limite de requisições atingido ou Last.fm fora do ar (mensagem clara e botão de tentar de novo).

## Línguas (17/11/2026)

O site existe em português, inglês e espanhol.

- Português fica sem prefixo (`www.sulcofm.com.br/u/nome`); inglês e espanhol ganham `/en` e `/es` (`/en/u/nome`). Por baixo, o português é servido de `/pt/...` (`src/proxy.ts` reescreve o endereço sem mudar a barra).
- Primeira visita num endereço sem prefixo: se o navegador estiver em inglês ou espanhol (`Accept-Language`), vai para `/en` ou `/es`. Robôs (prévia do link no X, WhatsApp, buscadores) nunca são redirecionados, para a prévia de um link em português não sair em outra língua.
- Seletor "PT · EN · ES" no rodapé: abre a mesma página na outra língua e guarda a escolha no cookie `lang` (só "pt", "en" ou "es", 1 ano). A escolha vence a língua do navegador.
- Textos em `src/i18n/` (`pt.ts` é a origem; `en.ts` e `es.ts` têm as mesmas chaves, conferidas pelo TypeScript e por teste). Servidor: `getI18n()`; navegador: `useI18n()`.
- As imagens (recap e grade) saem na língua da página, inclusive datas, números ("1.950" / "1,950") e "reproduções" / "plays" / "reproducciones". Os gêneros continuam como o Last.fm escreve.
- A prévia do link existe nas três línguas: rota `/og/pt`, `/og/en`, `/og/es` (`src/app/og/[lang]/route.tsx`), apontada nos metadados do layout. Não é um arquivo `opengraph-image` dentro de `[lang]`: assim o Next tentava pré-gerá-la e dava erro 500 em produção.
- A legenda da vitrine pode ter versão em inglês e espanhol (`legenda_en`, `legenda_es` em `vitrine.json`); sem elas, vale a legenda padrão de cada língua.

## Privacidade

O que o site faz e deve continuar fazendo:

- Recebe só um username, que já é informação pública do Last.fm.
- Lê só dados públicos do perfil.
- Não tem cadastro, senha, banco de dados nem cookies de rastreio. O único cookie é `lang`, com a língua escolhida no rodapé (só "pt", "en" ou "es"; não identifica ninguém).
- Contagem de visitas: Vercel Web Analytics (sem cookies). Antes do envio, `/u/NOME` (e `/en/u/NOME`, `/es/u/NOME`) vira `/u/[perfil]` e os parâmetros são descartados; quem tem Do Not Track ou Global Privacy Control ligado não é contado.
- Não guarda o que cada pessoa pesquisou. O cache guarda respostas da API por tempo limitado, sem ligação com quem pediu.
- Gera as imagens no aparelho da pessoa.
- Lembra as escolhas da imagem (formato, cor, números) só no navegador da pessoa (`localStorage`), sem cookie e sem enviar ao servidor.

A página `/privacidade` diz exatamente isso, em linguagem simples.

## Fora do escopo por enquanto

- **Login com Spotify.** Em novembro de 2026, a API do Spotify em modo de desenvolvimento aceita só 5 usuários autorizados por app e exige Premium do dono; sair desse limite exige empresa registrada com 250 mil usuários ativos por mês. Inviável para um site público. Rever se as regras mudarem.
- Contas de usuário, histórico salvo, links com imagem hospedada.
- Anúncios, pagamento ou qualquer uso comercial (os termos da API do Last.fm só permitem uso não comercial; para monetizar seria preciso acordo com eles).

## Riscos conhecidos

- **Imagens de outro domínio no canvas.** Se o servidor de imagens do Last.fm não enviar cabeçalho CORS, o canvas fica "sujo" e não exporta. Testar na fase 3; se acontecer, criar uma rota nossa que repassa a imagem, aceitando apenas o domínio de imagens do Last.fm.
- **Usuários com muitos scrobbles no mês.** Tratado com paginação, progresso e limite.
- **Tags ruins.** A qualidade das tags varia; a lista de descarte precisa de ajuste com dados reais.
- **Limites da API.** O Last.fm não publica um número oficial, mas avisa que pode suspender chaves que fazem várias chamadas por segundo continuamente. Cache e concorrência baixa resolvem.
