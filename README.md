# Recap Mensal

Nome provisório. Site que gera um resumo mensal do que você ouviu, a partir do seu username do Last.fm.

## O que faz

- Recap do mês em imagem: artistas, músicas, álbuns e gêneros mais ouvidos.
- Grade de capas dos álbuns mais ouvidos (3x3, 4x4 ou 5x5), por semana, mês ou outros períodos.
- Sem cadastro e sem login: basta o username.

## Status

Em desenvolvimento. O andamento está em [docs/ROTEIRO.md](docs/ROTEIRO.md).

## Como rodar

Pré-requisitos: Node.js LTS e uma chave da API do Last.fm.

```
cp .env.example .env.local   # cole sua chave no arquivo
npm install
npm run dev
```

Depois abra http://localhost:3000.

## Privacidade

O site lê apenas dados públicos do perfil no Last.fm. Não tem banco de dados, não guarda buscas e gera as imagens no próprio navegador.

## Tecnologias

Next.js, TypeScript e Tailwind CSS.

## Créditos

Dados fornecidos pelo [Last.fm](https://www.last.fm). Projeto não comercial e sem vínculo com o Last.fm ou com o Spotify.
