# Identidade visual (nome provisório: sulco)

Mesma linha do site ("Sala escura"): preto quente, cartões um pouco mais claros e um único destaque âmbar.
As cores batem com `src/app/globals.css` e `src/lib/theme.ts`.

## Símbolo

O "S" da palavra é um disco de vinil âmbar: sulcos finos, dois feixes de brilho, furo central com pino e um sulco em S cortando o disco.
Disco + "ulco" formam o nome: a marca é a própria palavra. O disco sozinho (`simbolo.svg`) é o avatar e o favicon; nos tamanhos pequenos o brilho e os sulcos somem e sobra o S limpo.
Nome sempre em minúsculas, Geist 800, espaçamento apertado.

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

Geist, a mesma do site (arquivos em `assets/`). Nome em Geist 800, minúsculas, espaçamento apertado.
Textos de apoio em Geist 500.

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

## Banner mensal (a fazer)

A ideia: todo mês, trocar a capa do perfil por um banner com os álbuns mais ouvidos do mês. O mosaico abstrato atual serve de banner padrão.
Precisa de um formato "Banner do X" (1500x500) no site, usando as capas reais do Last.fm. Deixar a área inferior esquerda livre (o avatar tampa).
