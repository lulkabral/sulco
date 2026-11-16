# Especificação

## Ideia

O Spotify só mostra a retrospectiva no fim do ano. Este site mostra a de qualquer mês, a partir do histórico público que a pessoa já tem no Last.fm. A pessoa digita o username, escolhe o período e baixa uma imagem pronta para compartilhar.

Quem usa Spotify, Deezer, YouTube Music etc. só precisa ter o scrobbling ligado na própria conta do Last.fm. O site não se conecta a nenhum serviço de streaming.

## Telas

### 1. Início (`/`)

- Campo para o username do Last.fm e botão "Gerar".
- Uma frase explicando o que o site faz.
- Link "Não tem Last.fm?" explicando em duas linhas como criar conta e ligar o scrobbling.
- Rodapé: nota de privacidade, crédito ao Last.fm com link, link do repositório.

### 2. Página do usuário (`/u/[username]`)

- Cabeçalho com avatar, username (link para o perfil no Last.fm), total de scrobbles e uma faixa com as capas mais ouvidas do último ano (1 chamada `user.getTopAlbums` com `12month`, com cache).
- Seletor de período: uma fileira só, com os períodos do Last.fm e os 12 meses fechados (no celular, rola para o lado).
- Duas abas: **Recap** e **Grade**, num seletor com ícones e um destaque âmbar que desliza para a aba escolhida assim que a pessoa toca (sem esperar o servidor). Trocar de aba não recarrega os dados do período.
- Listas em texto dos tops (artistas, músicas, álbuns), que servem de conferência e de versão acessível da imagem.

## Identidade visual: "Sala escura"

Escolhida no redesign entre as fases 7 e 8, no lugar da direção "Encarte" da fase 4.

- **Tema escuro sempre.** Fundo preto quente (`#15120F`), cartões `#221D19`, texto `#F4EEE6`, destaque âmbar (`#E8A13A`). Nada de verde nem de degradês coloridos (não lembrar o Spotify).
- **Tipografia:** só Geist, com títulos bem pesados (800).
- **Movimento:**
  - faixas de capas passando: peças abstratas na página inicial e as capas do usuário (últimos 12 meses) no topo da página dele;
  - na página inicial, as peças estão vivas: vinis girando, quadrados "respirando" e formas orgânicas que se deformam;
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

- título com o período (ex.: "Outubro de 2026") e o username;
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

- Story: 1080 x 1920 (o principal).
- Quadrado: 1080 x 1080 (depois).

Regras:

- Desenhar com Canvas 2D. Esperar as fontes carregarem (`document.fonts.ready`) antes de desenhar.
- Nomes longos são cortados com reticências; nunca estouram a área.
- Exportar em PNG com dois botões lado a lado: **Baixar imagem** e **Compartilhar**. Compartilhar usa o menu nativo do celular (Web Share API com arquivo); no computador, sem esse menu, vira **Copiar imagem** (área de transferência); sem nenhum dos dois, baixa.
- A prévia na tela é uma `<img>` (cópia PNG do canvas), para que segurar o dedo nela abra o "Salvar imagem" do celular. Em telas de toque aparece a dica "segure a imagem para salvar ou compartilhar".
- Artistas não têm foto disponível na API (ver `LASTFM.md`). Usar capas de álbum ou composição só com texto. Na lista "Artistas" da página, cada artista aparece numa bolinha com a capa do seu álbum mais ouvido no período (buscada pela rota `album` se ainda não veio, como no ano); sem álbum do artista na lista, a capa da sua música mais ouvida; sem nada, a inicial do nome.
- As quatro listas da página (Artistas, Músicas, Álbuns, Gêneros) têm um ícone no título: microfone, nota, disco e etiqueta.
- Músicas e Álbuns mostram a capa em miniatura quadrada. A capa da música vem dos scrobbles (mês fechado) ou de `track.getInfo` (demais períodos, buscada no navegador depois que a lista aparece).
- Gêneros: cada gênero é uma faixa que se enche de âmbar conforme o peso, com os até 3 artistas que mais puxaram aquele gênero (nomes e bolinhas sobrepostas). Sem números.

A paleta padrão (Âmbar) é a identidade visual do site (ver "Identidade visual"). (Na fase 4 a imagem era "Encarte", em papel creme; virou a paleta "Papel".)

## Recurso 2: Grade de álbuns

- Tamanhos: 3x3, 4x4, 5x5.
- Períodos: os mesmos do seletor (padrão: últimos 7 dias, a "semaninha").
- Opções: mostrar ou não o nome do álbum e artista; mostrar ou não a contagem de plays. A grade não leva assinatura nem selo (só as capas); o recap continua com a assinatura e o crédito ao Last.fm.
- Álbum sem capa: quadrado neutro com o nome do álbum.
- Exportar em PNG, mesmos botões e mesma prévia segurável do recap.

## Gêneros

O Last.fm não tem campo de gênero. O cálculo usa as tags dos artistas:

1. pegar os ~20 artistas mais ouvidos do período;
2. buscar as tags de cada um (`artist.getTopTags`);
3. normalizar nomes (minúsculas, juntar variações óbvias como "hip hop" e "hip-hop");
4. descartar tags que não são gênero (lista configurável: "seen live", "favorites", "favourites", "albums i own", anos e décadas, nacionalidades, "female vocalists", o próprio nome do artista etc.);
5. para cada artista, usar as 5 tags mais fortes que sobraram; peso = plays do artista x (força da tag / 100);
6. somar e mostrar o top 5.

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

- Carregando (com indicação de progresso quando houver várias chamadas).
- Usuário não encontrado.
- Perfil com histórico privado.
- Nenhum scrobble no período.
- Limite de requisições atingido ou Last.fm fora do ar (mensagem clara e botão de tentar de novo).

## Privacidade

O que o site faz e deve continuar fazendo:

- Recebe só um username, que já é informação pública do Last.fm.
- Lê só dados públicos do perfil.
- Não tem cadastro, senha, banco de dados nem cookies de rastreio.
- Contagem de visitas: Vercel Web Analytics (sem cookies). Antes do envio, `/u/NOME` vira `/u/[perfil]` e os parâmetros são descartados; quem tem Do Not Track ou Global Privacy Control ligado não é contado.
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
