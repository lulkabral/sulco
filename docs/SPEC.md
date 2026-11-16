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
- Duas abas: **Recap** e **Grade**.
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

Atenção: `1month` são os últimos 30 dias corridos, não o mês do calendário. Por isso o mês fechado é uma fase separada.

## Recurso 1: Recap em imagem

Princípio: **lembrar, não medir.** A imagem mostra nomes e capas; números só se a pessoa pedir.

Conteúdo da imagem:

- título com o período (ex.: "Outubro de 2026") e o username;
- o álbum do período em destaque ("O álbum do mês", "O álbum da sua vida"...), com capa;
- artistas ("Na sua cabeça"), músicas ("No repeat"), álbuns e gêneros;
- crédito discreto "dados: Last.fm" e o endereço do site;
- com "Mostrar números" ligado: total de scrobbles (na linha das datas, nunca no cartão do álbum) e reproduções de cada item.

A pessoa escolhe, em cima da prévia (a escolha fica guardada só no navegador dela, em `localStorage`):

- **Formato:** Toca-discos (padrão: vinil com a capa nº 1 como selo e capas empilhadas), Mosaico (colagem de 9 capas), Lineup (pôster de festival com até 15 artistas) ou Clássico (fileira de capas e cartões).
- **Cor:** paletas prontas (Âmbar, Meia-noite, Vinho, Papel, Lilás) ou "Cor da capa", tirada da capa nº 1. Cada paleta define fundo, cartões, texto e destaque juntos, com contraste testado.
- **Mostrar números:** desligado por padrão.

Código: `src/lib/recap/` (um arquivo por formato em `layouts/`).

Formatos:

- Story: 1080 x 1920 (o principal).
- Quadrado: 1080 x 1080 (depois).

Regras:

- Desenhar com Canvas 2D. Esperar as fontes carregarem (`document.fonts.ready`) antes de desenhar.
- Nomes longos são cortados com reticências; nunca estouram a área.
- Exportar em PNG. No celular, oferecer compartilhar pelo menu nativo (Web Share API com arquivo); se não houver suporte, baixar.
- Artistas não têm foto disponível na API (ver `LASTFM.md`). Usar capas de álbum ou composição só com texto.

A paleta padrão (Âmbar) é a identidade visual do site (ver "Identidade visual"). (Na fase 4 a imagem era "Encarte", em papel creme; virou a paleta "Papel".)

## Recurso 2: Grade de álbuns

- Tamanhos: 3x3, 4x4, 5x5.
- Períodos: os mesmos do seletor (padrão: últimos 7 dias, a "semaninha").
- Opções: mostrar ou não o nome do álbum e artista; mostrar ou não a contagem de plays.
- Álbum sem capa: quadrado neutro com o nome do álbum.
- Exportar em PNG, mesmo fluxo de baixar ou compartilhar.

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

- Máquina do tempo: qualquer mês desde o cadastro da pessoa no Last.fm (seletor de ano e mês).
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
- Não guarda o que cada pessoa pesquisou. O cache guarda respostas da API por tempo limitado, sem ligação com quem pediu.
- Gera as imagens no aparelho da pessoa.

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
