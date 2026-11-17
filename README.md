# sulco

**seu mês em música.** Site que gera um resumo do que você ouviu, a partir do seu username do Last.fm. O nome é sempre em minúsculas; a identidade visual está em [brand/GUIA.md](brand/GUIA.md).

## O que faz

- **Recap em imagem** (story 1080×1920): o álbum do período, artistas, músicas, álbuns e gêneros mais ouvidos. Quatro formatos (Toca-discos, Mosaico, Lineup e Clássico), seis opções de cor (incluindo a "Cor da capa") e, se quiser, total de scrobbles e minutos ouvidos (estimados).
- **Grade de capas** (3x3, 4x4 ou 5x5), com nome do álbum e número de reproduções opcionais.
- **Períodos:** "Todo o tempo", últimos 7 dias, 30 dias, 3, 6 e 12 meses, e **escolher mês ou ano** num calendário: qualquer ano inteiro ("2026 até agora") ou qualquer mês fechado desde o cadastro no Last.fm.
- Botões "Baixar imagem" e "Compartilhar" (menu do celular; no computador, copia a imagem). No celular, também dá para segurar a imagem e salvar. O recap leva a assinatura "sulco" e o crédito ao Last.fm; a grade é só das capas.
- Sem cadastro e sem login: basta o username. Funciona com qualquer serviço que faça scrobble no Last.fm (Spotify, Deezer, YouTube Music etc.).

## Como rodar

Pré-requisitos: Node.js LTS e uma chave da API do Last.fm (crie em https://www.last.fm/api/account/create; o passo a passo está em [docs/LASTFM.md](docs/LASTFM.md)).

```
cp .env.example .env.local   # cole sua chave no arquivo
npm install
npm run dev
```

Depois abra http://localhost:3000.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local |
| `npm run lint` | confere o estilo do código |
| `npm run test` | roda os testes uma vez (Vitest) |
| `npm run test:watch` | testes em modo contínuo |
| `npm run build` | build de produção |
| `npm run genres -- USERNAME [periodo]` | relatório de gêneros, para ajustar a lista de descarte |
| `npm run banner` | banner do X da conta oficial (ferramenta local; ver `brand/GUIA.md`) |
| `npm run vitrine` | confere os álbuns da vitrine da página inicial (`src/data/vitrine.json`; ver `brand/GUIA.md`) |

## Como está organizado

```
src/
  app/                   páginas e rotas (Next.js App Router)
    api/lastfm/          rotas que conversam com o Last.fm (só leitura): user, top, tags, scrobbles, chart, album, track
    u/[username]/        página do usuário
    privacidade/         página de privacidade
  components/            partes da tela (listas, grade, recap, seletores)
  lib/
    lastfm/              cliente do Last.fm (só no servidor), validação e normalização
    canvas/              desenho e exportação de imagens
    grid/, recap/        desenho da grade e do recap
    aggregate.ts         soma de scrobbles do mês fechado (no navegador)
    genres.ts            cálculo de gêneros a partir das tags
docs/                    especificação, notas da API e roteiro
scripts/                 ferramentas de desenvolvimento
```

Como funciona, em uma frase: o servidor busca e limpa os dados do Last.fm (com cache), e o navegador desenha as imagens e, no mês fechado, soma os scrobbles.

Mais detalhes: [docs/SPEC.md](docs/SPEC.md) (o que o site faz), [docs/LASTFM.md](docs/LASTFM.md) (como a API se comporta), [docs/SEGURANCA.md](docs/SEGURANCA.md) (revisão de segurança) e [docs/ROTEIRO.md](docs/ROTEIRO.md) (andamento).

## Privacidade

O site lê apenas dados públicos do perfil no Last.fm. Não tem cadastro, banco de dados nem cookies de rastreio, não guarda buscas e gera as imagens no próprio navegador. Conta visitas com o Vercel Web Analytics (sem cookies), apagando o username e os parâmetros do endereço antes do envio (`src/lib/analytics.ts`). A chave da API fica só no servidor. Texto completo na página `/privacidade`.

## Tecnologias

Next.js, TypeScript, Tailwind CSS, Canvas 2D e Vitest. Fonte: Geist (licença OFL; os arquivos TTF em `assets/` são usados na imagem de compartilhamento). Logo e ícones a partir de `brand/` (o símbolo fica em `public/brand/simbolo.svg`; os ícones do site em `src/app/icon.svg`, `apple-icon.png` e `favicon.ico`).

## Créditos

Dados fornecidos pelo [Last.fm](https://www.last.fm). Projeto não comercial e sem vínculo com o Last.fm ou com o Spotify.
