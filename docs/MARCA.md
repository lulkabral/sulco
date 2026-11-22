# Marca no site

Como o sulco aparece na tela. A identidade completa (símbolo, arquivos, perfil do X) está em `brand/GUIA.md`.
Nome sempre em minúsculas: "sulco". Tagline: "seu mês em música".

## Cores (tokens)

Identidade **"Loja de discos viva"** (desde 19/11/2026): o site funciona nos **modos claro (Papel) e escuro (Sala escura)**, seguindo automaticamente o tema do aparelho (`prefers-color-scheme`) com botão no topo para trocar (escolha guardada só no `localStorage`, chave `sulco:theme`, sem cookie).

Os tokens viram classes do Tailwind (`bg-room`, `bg-card`, `bg-terra`, `bg-stage`, `text-soft`...), definidos em `src/app/globals.css` (`@theme`). Nada de cor solta em componente: se faltar uma, crie o token lá.

| Token | Modo claro (Papel) | Modo escuro (Sala) | Uso |
|---|---|---|---|
| `room` | `#F4EEE3` | `#14110E` | fundo da página |
| `card` | `#FAF6EE` | `#1D1814` | cartões e campos |
| `card-2` | `#EDE4D4` | `#26201B` | superfície secundária / hover |
| `rule` | `#DFD3BE` | `#2E2721` | divisórias finas |
| `line` | `#CFC0A8` | `#3C332C` | bordas de controles e cartões |
| `ink` | `#191512` | `#F4EEE6` | texto principal |
| `soft` | `#594F45` | `#B5ABA0` | texto de apoio |
| `ink-faint` | `#6B6054` | `#9D9286` | detalhes pequenos |
| `terra` / `terra-ink` | `#B83E16` / `#FFF9F2` | `#BC421A` / `#FFF9F2` | faixas e blocos vibrantes (discos da vitrine, gêneros) |
| `terra-text` | `#B83E16` | `#F07D54` | destaque terracota em texto sobre `room`/`card` |
| `cta` / `cta-ink` | `#191512` / `#FAF6EE` | `#E8A13A` / `#1D1204` | botão principal e aba ativa |
| `stage` / `stage-card` | `#181411` / `#221C18` | `#1B1613` / `#241E19` | palco escuro dedicado ao pôster/grade |
| `amber` / `amber-ink` | `#E8A13A` / `#2A1A05` | `#E8A13A` / `#2A1A05` | destaque do palco e do vinil |
| `danger` | `#B8321C` | `#FF9B85` | erro do formulário |
| `trend-up` / `trend-down` / `trend-new` | `#147538` / `#C92A2A` / `#1D64D8` | `#3ECF7C` / `#F46666` / `#5CA4FF` | setas de subida/queda e bolinha de estreia nas listas (no cartão terracota de Gêneros, entram numa pílula escura com os tons claros `*-stage`) |
| `vinyl` / `vinyl-groove` | `#0B0A09` / `#1B1714` | `#0B0A09` / `#1B1714` | sulcos dos discos |

**Imagens geradas no canvas:** o recap (`src/lib/recap/*`), a grade (`src/lib/grid/*`) e a prévia do link (`src/app/og/*`) continuam usando `src/lib/theme.ts` e `src/lib/recap/palettes.ts`. No formato **Toca-discos**, há a opção **Vinil colorido** (desligada por padrão, salva no `localStorage`): quando ligada, desenha um LP colorido liso com poucos sulcos sutis na cor que melhor contrasta com a capa nº 1; desligada, mantém o vinil preto clássico intacto.

### Destaque do palco no perfil (`AccentScope`)

As paletas da imagem (Âmbar, Meia-noite, Vinho, Papel, Lilás e Cor da capa) moram em `src/lib/recap/palettes.ts`. Na página do perfil, `AccentScope` troca `--accent`, `--accent-hover` e `--accent-ink` pelo destaque da paleta escolhida quando ela passa no contraste AA (`uiAccentFor`, em `src/lib/recap/ui-accent.ts`). Como o palco do pôster/grade (`bg-stage`) é sempre escuro nos dois temas, esse destaque mantém contraste AA tanto no modo claro quanto no modo escuro.

O disco do logo é sempre âmbar.

## Logo (novembro de 2026)

O "s" é a própria letra da DM Sans 800, em `#14110E`, dentro de um disco âmbar (`#E8A13A`). O disco funciona como a primeira letra da palavra: disco + "ulco" lê-se **"sulco"**, sempre em minúsculas. (Antes, o "S" era um traço desenhado dentro do disco.)

**Versões do símbolo** (originais em `brand/logo-2026-11/`, fora do git):

| Arquivo | Como é | Uso |
|---|---|---|
| `simbolo.svg` (copiado para `public/brand/`) | disco + "s" + anel escuro com furo âmbar no centro | interface e avatar, a partir de 32 px |
| `simbolo-mini.svg` | sem o furo central | abaixo de 32 px; `src/app/icon.svg` e `favicon.ico` (16/32/48/64) já são esta versão |
| `simbolo-completo.svg` | com dois sulcos finos | a partir de 48 px |
| `lockup-escuro.svg` / `lockup-claro.svg` | logo horizontal em contorno | o escuro está em `public/brand/` e assina a prévia do link (`src/app/og`) |
| `apple-icon.png` | 180 x 180, fundo `#14110E` | `src/app/apple-icon.png` |

**Proporções do lockup**, em em da fonte do "ulco" (em `LOCKUP`, `src/lib/brand-symbol.ts`):

- diâmetro do disco: **0,787em**;
- topo do disco alinhado ao topo do "l";
- base do disco **0,063em abaixo da linha de base** (`vertical-align: -0.063em`);
- espaço entre o disco e o "u": **0,01em** de margem (dá ~0,07em de respiro visual, pelo recuo da letra);
- "ulco" em DM Sans 800, `letter-spacing: -0.05em`.

**Cores:** no modo escuro a palavra fica em `var(--ink)` (`#F4EEE6`); no claro, em `#191512` (o `text-ink` de cada tema). O disco é sempre âmbar.

**Onde aparece:**

- **Cabeçalho** (`src/components/Logo.tsx`): disco como SVG embutido e "ulco" como texto real, na cor do tema. Sempre com o furo central, também no cabeçalho (disco de ~19 px): decisão do dono em 20/11/2026. A versão mini fica só para o favicon e o `icon.svg`.
- **Recap** (`src/lib/canvas/brandmark.ts`, no rodapé): disco e "s" desenhados no canvas com o mesmo contorno do SVG (não depende da fonte); o "ulco" usa a DM Sans já carregada antes do desenho. Abaixo de 32 px reais sai a mini.
- **Grade:** sem logo (decisão de 16/11/2026: a grade é só das capas).
- **Prévia do link:** `public/brand/lockup-escuro.svg`.
- O banner do X (`npm run banner`, ferramenta local) ainda usa o símbolo antigo `brand/simbolo-800.png`.

## Tipografia

| Fonte | Uso | Regra |
|---|---|---|
| DM Sans 800 | títulos e nomes | espaçamento apertado (-0.045em no título da página inicial) |
| DM Sans 500 | texto e interface (peso padrão do corpo; 600 e 700 para ênfase) | |
| DM Mono 500 | números, datas, contagens, metadados e rótulos em caixa alta | sempre com `tabular-nums` |

O canvas do recap e da grade usa a mesma DM Sans (lida do corpo da página). O "ulco" do logo também (`Logo.tsx` e `src/lib/canvas/brandmark.ts`). A prévia do link e o banner usam os TTF estáticos em `assets/` (licença OFL em `assets/DMSans-OFL.txt`).

Todas carregadas com `next/font/google` (subset latin, `display: swap`), sem CDN externo. A legenda da vitrine é curta (até 5 palavras): conferida no teste (`showcase.test.ts`) e no `npm run vitrine`.

Não usar serif nem letra manuscrita no site. Sem textura de grão: a página fica lisa, para ninguém achar que a imagem baixada vai sair granulada.

## Estética "Loja de discos viva"

- **Primeira dobra com o produto real:** título + campo em pílula arredondada + palco escuro ao vivo (abas `Toca-discos · Lineup · Mosaico · Grade` em 1 linha acima, o canvas real no centro como protagonista e barra compacta de cores, *Vinil colorido* e troca de disco logo abaixo) aparecem já na primeira tela tanto no celular quanto no computador.
- **Blocos de cor e ritmo:** alternância limpa entre papel/sala com o palco escuro no topo e a faixa terracota logo abaixo com os 6 LPs clicáveis (capa quadrada na frente e vinil colorido contrastante girando metade para fora à direita, sincronizado com o palco), sem blocos genéricos de explicação.
- **Perfil coerente:** topo com faixa limpa de capas retas (sem fita crepe) e `VinylAvatar` girando, pílulas para `Recap | Grade` e período (com gaveta arredondada), troca rápida de usuário em gaveta no topo, palco escuro com switches unificados e listas em abas no celular (`2×2` largo no computador) com o cartão de gêneros em terracota.
- **Proibido:** fita crepe em CSS, capas tortas decorativas na faixa, sombra deslocada de "adesivo", letra manuscrita, vidro fosco pesado, brilhos difusos de IA.

## Movimento

- **Ritmo suave e ágil:** todas as transições usam a curva suave (`--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1)`), com 200 ms em controles táteis, 300 ms em deslocamentos de abas/cartões e troca de tema sincronizada em ~240 ms. A rolagem de âncora (`#palco`) é suave.
- **Carregamento:** um disco de vinil girando cadenciado (`VinylLoader`, 2,1 s por volta, CSS puro). Com "reduzir movimento", fica parado e aparece "carregando…".
- **Discos e faixas de capas:** o disco do hero, o avatar do perfil e o disco selecionado na faixa terracota giram em ritmo calmo (17 s por volta); os outros discos da vitrine retomam o giro no mesmo ponto ao passar o mouse, sem tranco. A faixa de capas do topo do perfil desliza suave e pausa no hover. Todo movimento respeita `prefers-reduced-motion`.

## Sem vínculo

Não usar "Wrapped" nem nome, logo ou cores do Spotify (regra de marca do projeto). O nome do Spotify pode aparecer só como instrução (o passo do "Não tem Last.fm?"), sem logo nem cores dele. Creditar o Last.fm com link.
