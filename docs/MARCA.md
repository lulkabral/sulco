# Marca no site

Como o sulco aparece na tela. A identidade completa (símbolo, arquivos, perfil do X) está em `brand/GUIA.md`.
Nome sempre em minúsculas: "sulco". Tagline: "seu mês em música".

## Cores (tokens)

Sala escura, um holofote. Os nomes viram classes do Tailwind (`bg-room`, `text-soft`, `border-line`...), definidas em `src/app/globals.css` (`@theme`). Nada de cor solta em componente: se faltar uma, crie o token lá.

| Token | Cor | Uso |
|---|---|---|
| `room` | `#15120F` | fundo |
| `card` | `#221D19` | cartões |
| `card-2` | `#2C2621` | cartão em destaque, hover |
| `line` | `#3A322C` | bordas e linhas finas |
| `ink` | `#F4EEE6` | texto |
| `soft` | `#B5ABA0` | texto de apoio |
| `ink-faint` | `#958B7F` | detalhes pequenos |
| `amber` | `#E8A13A` | destaque (ver abaixo) |
| `amber-ink` | `#2A1A05` | texto sobre o destaque |
| `danger` | `#FF9B85` | erro do formulário |
| `vinyl` / `vinyl-groove` | `#0B0A09` / `#1B1714` | sulcos dos discos |

As mesmas cores, para o canvas, ficam em `src/lib/theme.ts` (mudou num, mude no outro).

**Regra:** o âmbar aparece em uma coisa por tela, a que mais importa.

### Destaque que segue a paleta

As paletas da imagem (Âmbar, Meia-noite, Vinho, Papel, Lilás e Cor da capa) moram em `src/lib/recap/palettes.ts`, a fonte da verdade; não invente cores novas.

`amber`, `amber-hover` e `amber-ink` leem as variáveis `--accent`, `--accent-hover` e `--accent-ink`. Por padrão são o âmbar. Na página do perfil, `AccentScope` troca essas variáveis pelo destaque da paleta escolhida (botões principais, item escolhido, aba ativa, anel de foco). O fundo continua escuro.

A troca só acontece se passar no contraste AA (`uiAccentFor`, em `src/lib/recap/ui-accent.ts`, com teste): o destaque precisa de 4,5:1 sobre `room`, `card` e `card-2`, e o texto do botão precisa de 4,5:1 sobre o destaque. Se não passar (Papel, algumas capas), fica o âmbar. Em CSS escrito à mão, use `var(--accent)`, não `var(--color-amber)` (essa é resolvida uma vez na raiz e não acompanha a troca).

O logo (`public/brand/simbolo.svg`) é sempre âmbar.

## Tipografia

| Fonte | Uso | Regra |
|---|---|---|
| Geist 800 | títulos e nomes | espaçamento apertado (-0.04em; o título da página inicial usa -0.045em) |
| Geist 500 | texto | |
| Geist Mono | números, datas, contagens, metadados | sempre com `tabular-nums` (a "ficha técnica": período, scrobbles, minutos, "desde 2019"), com linhas finas de 1px na cor `line` |
| Caveat | bilhete escrito à mão | até 5 palavras (ex.: "em evidência este mês"); hoje só na legenda da colagem |

Todas carregadas com `next/font/google` (subset latin, `display: swap`), sem CDN externo. A legenda da vitrine é conferida no teste (`showcase.test.ts`) e no `npm run vitrine`.

Não usar serif no site. Sem textura de grão: a página fica lisa, para ninguém achar que a imagem baixada vai sair granulada.

## Movimento

- **Carregamento:** um disco de vinil girando a 33⅓ rpm (`VinylLoader`, CSS puro: sulcos com `repeating-radial-gradient`, reflexo e selo âmbar). Com "reduzir movimento", fica parado e aparece "carregando…". Quando se sabe quanto falta (páginas do mês), a barra de progresso aparece junto.
- Nada de animação nova espalhada: o disco do carregamento é o único movimento automático acrescentado nesta fase. Todo movimento usa `motion-safe:` e para com "reduzir movimento".

## Sem vínculo

Não usar "Wrapped" nem nome, logo ou cores do Spotify (regra de marca do projeto). O nome do Spotify pode aparecer só como instrução (o passo do "Não tem Last.fm?"), sem logo nem cores dele. Creditar o Last.fm com link.
