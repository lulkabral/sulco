# Identidade visual (nome provisório: sulco)

Mesma linha do site ("Sala escura"): preto quente, cartões um pouco mais claros e um único destaque âmbar.
As cores batem com `src/app/globals.css` e `src/lib/theme.ts`.

## Símbolo

O "S" da palavra é um disco de vinil âmbar: sulcos finos, dois feixes de brilho, furo central com pino e um sulco em S cortando o disco.
Disco + "ulco" formam o nome: a marca é a própria palavra. O disco sozinho (`simbolo.svg`) é o avatar e o favicon; nos tamanhos pequenos o brilho e os sulcos somem e sobra o S limpo.
Nome sempre em minúsculas, Plus Jakarta Sans 800, espaçamento apertado. (As peças de brand/ feitas antes de 18/11/2026 usam Geist 800.)

## Cores

| Uso | Cor |
|---|---|
| Fundo (room) | `#15120F` |
| Cartão | `#221D19` |
| Linhas | `#3A322C` |
| Texto | `#F4EEE6` |
| Texto de apoio | `#B5ABA0` |
| Destaque (âmbar) | `#E8A13A` |

Regra: âmbar só em uma coisa por peça (destaque). As capas abstratas usam as cores de `TILE_COLORS` em `theme.ts`.

## Tipografia

Plus Jakarta Sans, a mesma do site (arquivos em `assets/`, licença OFL). Nome em Plus Jakarta Sans 800, minúsculas, espaçamento apertado.
Textos de apoio em Plus Jakarta Sans 500. Números e rótulos técnicos do site em IBM Plex Mono (`docs/MARCA.md`).

## Arquivos

| Arquivo | Onde usar |
|---|---|
| `avatar-800.png` | foto de perfil do X (o X corta em círculo; o símbolo já cabe) |
| `banner-1500x500.png` / `banner-3000x1000.png` | capa do perfil (use a de 3000 se o X aceitar sem compressão pesada) |
| `post-fixado-1200x675.png` | imagem do post fixado |
| `lockup-transparente.png` / `lockup.svg` | disco-S + "ulco", para fundos escuros |
| `simbolo.svg`, `simbolo-800.png`, `avatar.svg`, `banner.svg`, `post-fixado.svg` | originais editáveis |
| `logos-opcoes.png` | direções de logo que foram testadas (histórico) |

## Perfil do X

- **Bio (113 caracteres):** Seu mês em música, em uma imagem. Recap mensal e grade de álbuns a partir do seu Last.fm. Sem cadastro, sem login.
- **Link:** o endereço do site.
- **Sem vínculo:** não usar "Wrapped" nem nome, logo ou cores do Spotify (regra de marca do projeto). Creditar o Last.fm.

## Post fixado (sugestão)

> Todo mês eu queria ver o que ouvi, sem esperar o fim do ano.
> Então fiz um site: você digita seu usuário do Last.fm e ele gera o recap do mês e a grade dos álbuns mais ouvidos.
> Sem cadastro, sem login. [link]

(anexar `post-fixado-1200x675.png`)

## Trocar o nome

Os arquivos foram gerados por script. Para trocar o nome, basta gerar tudo de novo: o símbolo não muda.

## Vitrine da página inicial

A prateleira de capas da página inicial (e o palco do hero) mostra os álbuns que você escolhe, como no banner.

1. Edite `src/data/vitrine.json`: a `legenda` (curta, até 5 palavras: aparece no cabeçalho da prateleira) e até 6 `itens`, cada um com `artista` e `album` (os dois são obrigatórios). Opcional: `legenda_en` e `legenda_es`, a legenda nas páginas em inglês e espanhol (sem elas, aparece "in the spotlight this month" / "destacados este mes").
2. Rode `npm run vitrine`: ele procura cada álbum no Last.fm e diz se achou a capa (✓) ou não (✗). Se não achar, confira a grafia na página do álbum no last.fm.
3. Publique: `git add src/data/vitrine.json`, `git commit -m "Vitrine: ..."` e `git push`. A Vercel publica sozinha e a página já sai com a lista nova.

Com menos de 4 capas encontradas, o site mostra os álbuns em alta no mundo no lugar da vitrine. A ordem do arquivo é a ordem na prateleira (números 01 a 06).

A prévia do link (a imagem que aparece ao colar o endereço no X ou no WhatsApp, `src/app/og/[lang]/route.tsx`, uma por língua) usa as mesmas capas, em prateleira, e se atualiza uma vez por dia. O canto de baixo à esquerda fica vazio porque o X põe ali o nome do site. O X guarda a prévia de links já postados por um tempo; links novos já saem com a vitrine atual.

## Banner da conta (ferramenta local)

Só para a conta oficial do sulco (não é recurso do site). Gera a capa do perfil com os artistas em evidência no mês ou no momento.

1. Copie `brand/banner.exemplo.json` para `brand/banner.json` (ou crie um arquivo por banner).
2. Edite `titulo`, `subtitulo` e até 10 `itens` (`artista` e, se quiser, `album`; sem álbum, usa o mais popular do artista).
3. Rode `npm run banner` (ou `npm run banner -- brand/outro.json`).
4. Saem `brand/banner-AAAA-MM-1500x500.png` e `-3000x1000.png` (o nome pode ser trocado com `"arquivo"` no JSON).

Os seus `banner*.json` e os banners gerados (`banner-AAAA-MM-…png`) ficam fora do git (`.gitignore`); só o exemplo é versionado. Usa a chave do `.env.local` e o ImageMagick (`convert`). A disposição (`src/lib/banner/layout.ts`) deixa livres o canto inferior esquerdo (avatar) e as faixas de cima e de baixo (o X corta no celular); há teste para isso. Capa que o Last.fm não tiver vira um quadrado colorido.
