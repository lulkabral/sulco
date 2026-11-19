# Marca no site

Como o sulco aparece na tela. A identidade completa (símbolo, arquivos, perfil do X) está em `brand/GUIA.md`.
Nome sempre em minúsculas: "sulco". Tagline: "seu mês em música".

## Cores (tokens)

Sala escura, um holofote: preto profundo e quente, contraste refinado e o âmbar usado com cirurgia. Os nomes viram classes do Tailwind (`bg-room`, `text-soft`, `border-line`...), definidas em `src/app/globals.css` (`@theme`). Nada de cor solta em componente: se faltar uma, crie o token lá.

| Token | Cor | Uso |
|---|---|---|
| `room` | `#110F0D` | fundo |
| `card` | `#181512` | superfícies (campo, palco, gaveta) |
| `card-2` | `#211C18` | superfície em destaque, hover |
| `rule` | `#2C2621` | divisórias de 1px do grid, sobre o fundo |
| `line` | `#3A322C` | bordas de controles e cartões (sobre superfícies, onde `rule` quase some) |
| `ink` | `#F4EEE6` | texto |
| `soft` | `#ABA196` | texto de apoio |
| `ink-faint` | `#958B7F` | detalhes pequenos (o `#7E756B` da proposta ficava abaixo de 4,5:1) |
| `amber` | `#E8A13A` | destaque (ver abaixo) |
| `amber-ink` | `#2A1A05` | texto sobre o destaque |
| `danger` | `#FF9B85` | erro do formulário |
| `vinyl` / `vinyl-groove` | `#0B0A09` / `#1B1714` | sulcos dos discos |

As mesmas cores, para o canvas e a prévia do link, ficam em `src/lib/theme.ts` (mudou num, mude no outro). As paletas da imagem do recap não mudam com isso.

**Regra:** o âmbar aparece em uma coisa por tela, a que mais importa. Na página inicial: o botão "Gerar", o ponto final do título e o "LED" da linha técnica, além do símbolo do logo.

### Destaque que segue a paleta

As paletas da imagem (Âmbar, Meia-noite, Vinho, Papel, Lilás e Cor da capa) moram em `src/lib/recap/palettes.ts`, a fonte da verdade; não invente cores novas.

`amber`, `amber-hover` e `amber-ink` leem as variáveis `--accent`, `--accent-hover` e `--accent-ink`. Por padrão são o âmbar. Na página do perfil, `AccentScope` troca essas variáveis pelo destaque da paleta escolhida (botões principais, item escolhido, aba ativa, anel de foco). O fundo continua escuro.

A troca só acontece se passar no contraste AA (`uiAccentFor`, em `src/lib/recap/ui-accent.ts`, com teste): o destaque precisa de 4,5:1 sobre `room`, `card` e `card-2`, e o texto do botão precisa de 4,5:1 sobre o destaque. Se não passar (Papel, algumas capas), fica o âmbar. Em CSS escrito à mão, use `var(--accent)`, não `var(--color-amber)` (essa é resolvida uma vez na raiz e não acompanha a troca).

O logo (`public/brand/simbolo.svg`) é sempre âmbar.

## Tipografia

| Fonte | Uso | Regra |
|---|---|---|
| Plus Jakarta Sans 800 | títulos e nomes | espaçamento apertado (-0.045em no título da página inicial) |
| Plus Jakarta Sans 400 a 700 | texto e interface | |
| IBM Plex Mono | números, datas, contagens, metadados, rótulos técnicos em caixa alta | sempre com `tabular-nums`; rótulos com espaçamento aberto (0.14em a 0.18em) |

O canvas do recap e da grade usa a mesma Plus Jakarta Sans (lida do corpo da página). O logo ("ulco") também: o disco tem a altura do "l" dessa fonte (0,766 do tamanho), em `Logo.tsx` e `src/lib/canvas/brandmark.ts`. A prévia do link usa os TTF estáticos em `assets/` (licença OFL em `assets/PlusJakartaSans-OFL.txt`).

Todas carregadas com `next/font/google` (subset latin, `display: swap`), sem CDN externo. A legenda da vitrine é curta (até 5 palavras): conferida no teste (`showcase.test.ts`) e no `npm run vitrine`.

Não usar serif nem letra manuscrita no site. Sem textura de grão: a página fica lisa, para ninguém achar que a imagem baixada vai sair granulada.

## Estética Hi-Fi / catálogo de vinil

Referência: catálogos de selos e aparelhos de som. Minimalismo escuro, grid arquitetônico, tipografia firme e o produto real como protagonista.

- **Grid de linhas finas:** seções e colunas separadas por linhas de 1px (`border-rule`, `divide-rule`). Na prateleira, `gap-px` sobre `bg-rule` faz as linhas entre os itens.
- **Rótulos técnicos:** caixa alta em mono, pequenos, com espaçamento aberto ("LADO A · RECAP MENSAL E GRADE", "CATÁLOGO / DADOS: LAST.FM"). Números de catálogo `01`–`06`.
- **Cantos quase retos:** 2 a 3 px no campo e nos botões; capas retas com borda de 1px.
- **Produto real:** o palco da página inicial desenha os formatos com o mesmo código da imagem baixada, com as capas da vitrine.
- **Proibido:** brilhos e degradês difusos, vidro fosco, cartões genéricos de "benefícios" com ícone, capas tortas com fita, letra manuscrita, sombra deslocada de "adesivo". O rigor vem de proporção, espaço vazio e linhas de 1px.

## Movimento

- **Carregamento:** um disco de vinil girando a 33⅓ rpm (`VinylLoader`, CSS puro: sulcos com `repeating-radial-gradient`, reflexo e selo âmbar). Com "reduzir movimento", fica parado e aparece "carregando…". Quando se sabe quanto falta (páginas do mês), a barra de progresso aparece junto.
- **Prateleira da vitrine:** atrás de cada capa, um disco com a capa como selo, girando devagar (7 s por volta). No computador, com o mouse em cima, ele sai da capa (por cima da célula vizinha) e gira a 33⅓ rpm. No celular, fica mais para fora, girando. Pedido do dono em 18/11/2026: o site precisava de mais movimento.
- O disco do palco da página inicial não gira: é o desenho real da imagem, que é estática.
- Movimento automático só em discos (carregamento, avatar do perfil e prateleira), sempre girando como disco de verdade. Todo movimento usa `motion-safe:` e para com "reduzir movimento".

## Sem vínculo

Não usar "Wrapped" nem nome, logo ou cores do Spotify (regra de marca do projeto). O nome do Spotify pode aparecer só como instrução (o passo do "Não tem Last.fm?"), sem logo nem cores dele. Creditar o Last.fm com link.
