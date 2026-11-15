# Roteiro

Cada fase tem o pedido da fase e uma lista de "pronto quando".

Ritmo sugerido para cada fase:

1. Planejar a fase antes de mexer no código.
2. Leia o plano, peça ajustes se quiser e aprove.
3. Teste no navegador o que a fase entregou.
4. Peça o commit.


---

## Fase 0: Base do projeto

```
Leia docs/SPEC.md e docs/LASTFM.md. Depois execute a Fase 0 de docs/ROTEIRO.md.

Crie a base do projeto Next.js (App Router, TypeScript, Tailwind, ESLint) na raiz deste repositório, na versão estável atual. A pasta já tem arquivos (README.md, docs/, .env.example, .gitignore): gere o projeto numa pasta temporária e mova para a raiz sem apagar nem sobrescrever esses arquivos. No .gitignore, junte as regras.

Configure o Vitest com um teste de exemplo. Deixe a página inicial só com o nome provisório do site. No fim, rode lint, test e build e me explique em poucas linhas a estrutura de pastas criada.
```

Pronto quando:

- [x] `npm run dev` abre a página em http://localhost:3000
- [x] lint, test e build passam
- [x] `.env.local` existe na minha máquina e está fora do git
- [x] primeiro commit feito

## Fase 1: Conexão com o Last.fm (servidor)

```
Execute a Fase 1 de docs/ROTEIRO.md, seguindo docs/LASTFM.md.

Crie um módulo de servidor para falar com o Last.fm e as rotas:
- GET /api/lastfm/user?user=
- GET /api/lastfm/top?user=&type=artists|albums|tracks&period=&limit=

Requisitos: validar a entrada (username e parâmetros), aceitar só os métodos permitidos, normalizar a resposta para um JSON limpo e tipado, mapear erros para os nossos códigos, enviar Cache-Control conforme o LASTFM.md e nunca expor a chave. Escreva testes das funções de normalização com exemplos de resposta salvos em arquivo.

Antes de testar com chamada real, me pergunte qual username usar. Registre em docs/LASTFM.md o que descobrir de diferente do esperado.
```

Pronto quando:

- [x] abrir `/api/lastfm/top?user=MEU_USER&type=albums&period=7day` no navegador mostra JSON limpo
- [x] username inexistente devolve `USER_NOT_FOUND`
- [x] a chave não aparece em nenhuma resposta nem no código do navegador
- [x] testes passam

## Fase 2: Tela inicial e página do usuário

```
Execute a Fase 2 de docs/ROTEIRO.md, seguindo a seção "Telas" de docs/SPEC.md.

Crie a tela inicial (campo de username) e a página /u/[username] com cabeçalho do usuário, seletor de período (só os períodos prontos por enquanto) e as três listas de top em texto. Trate todos os estados da seção "Estados que toda tela precisa tratar". Layout pensado primeiro para celular. Rodapé com nota de privacidade e crédito ao Last.fm com link.

Ainda sem imagens geradas: o objetivo é ver os dados certos na tela.
```

Pronto quando:

- [x] digitar meu username leva à página com meus tops
- [x] trocar o período atualiza as listas
- [x] usuário inexistente e período vazio mostram mensagens claras (período vazio ainda não visto com dados reais: falta uma conta sem scrobbles recentes)
- [x] funciona bem na largura de celular

## Fase 3: Grade de álbuns

```
Execute a Fase 3 de docs/ROTEIRO.md, seguindo "Recurso 2: Grade de álbuns" de docs/SPEC.md.

Na aba Grade, gere a colagem em canvas com tamanhos 3x3, 4x4 e 5x5, opções de legenda e de contagem de plays, e botão para baixar em PNG (no celular, compartilhar pelo menu nativo quando houver suporte).

Comece testando se as capas do Last.fm podem ser desenhadas e exportadas no canvas (CORS). Se não puderem, crie uma rota que repassa a imagem aceitando somente o domínio de imagens do Last.fm. Anote o resultado em docs/LASTFM.md.
```

Pronto quando:

- [x] a grade aparece e o PNG baixado abre certo (PNG de 1500 px gerado no Chromium; falta abrir um baixado no celular)
- [x] álbum sem capa vira quadrado com o nome
- [x] legenda e contagem ligam e desligam
- [x] se existir rota de imagem, ela recusa qualquer outro domínio (não se aplica: as capas funcionam no canvas sem rota, ver `LASTFM.md`)

## Fase 4: Recap em imagem

```
Execute a Fase 4 de docs/ROTEIRO.md, seguindo "Recurso 1: Recap em imagem" de docs/SPEC.md.

Antes de codar, me apresente 2 ou 3 direções visuais em texto (paleta, tipografia, disposição) para eu escolher. Depois gere o recap em canvas no formato story 1080x1920 com: título do período, username, total de scrobbles, top 5 artistas, músicas e álbuns, capa em destaque e crédito. Gêneros entram na fase seguinte; deixe o espaço previsto.

Nomes longos devem ser cortados com reticências. Espere as fontes carregarem antes de desenhar. Mesmo fluxo de baixar ou compartilhar da grade (reaproveite o código).
```

Pronto quando:

- [x] o recap dos últimos 30 dias sai legível e sem texto estourando (testado também com total de 6 dígitos, álbum sem capa e nome enorme)
- [x] baixar e compartilhar funcionam (PNG gerado no Chromium; compartilhar usa o mesmo código da grade e falta testar num celular)
- [x] nada no visual lembra a marca do Spotify (direção "Encarte": papel creme, serifada, vermelho-tijolo)

## Fase 5: Gêneros

```
Execute a Fase 5 de docs/ROTEIRO.md, seguindo a seção "Gêneros" de docs/SPEC.md.

Crie a rota de tags de artista (cache de 7 dias) e a função pura que calcula o top 5 de gêneros com os pesos e a lista de descarte. Escreva testes para essa função. Respeite o limite de chamadas simultâneas. Mostre os gêneros na página e no recap.

Depois de pronto, rode com meu username e me mostre o resultado para ajustarmos a lista de descarte.
```

Pronto quando:

- [x] os gêneros fazem sentido para o meu perfil (conferido com o meu perfil em 15/11/2026, depois de ajustar o descarte)
- [x] tags como "seen live" não aparecem
- [x] testes passam

## Fase 6: Mês fechado

```
Execute a Fase 6 de docs/ROTEIRO.md, seguindo "Mês fechado" de docs/SPEC.md e as armadilhas de docs/LASTFM.md.

Adicione ao seletor os últimos 12 meses do calendário. Crie a rota paginada de scrobbles por intervalo e a soma no navegador por artista, álbum e música, com barra de progresso, limite de páginas e fuso horário do navegador. Ignore a faixa "tocando agora". Cache longo para meses encerrados. Escreva testes da função de soma. Recap e grade devem funcionar com um mês fechado.
```

Pronto quando:

- [ ] "outubro de 2026" gera recap e grade
- [ ] os números batem com a página do meu perfil no Last.fm para o mesmo intervalo
- [ ] aparece progresso durante o carregamento
- [ ] testes passam

## Fase 7: Acabamento

```
Execute a Fase 7 de docs/ROTEIRO.md.

Crie a página /privacidade conforme a SPEC, título e descrição das páginas, imagem de compartilhamento do site, página 404 e revisão de acessibilidade (contraste, foco, textos alternativos, navegação por teclado). Atualize o README.

Depois faça uma revisão de segurança e me entregue um relatório curto: a chave aparece em algum arquivo enviado ao navegador? Existe alguma variável NEXT_PUBLIC indevida? Alguma rota aceita método ou domínio fora da lista? Algum log grava username?
```

Pronto quando:

- [ ] relatório de segurança sem pendências
- [ ] página de privacidade no ar e linkada no rodapé
- [ ] README atualizado

## Fase 8: Publicação

```
Execute a Fase 8 de docs/ROTEIRO.md.

Me guie passo a passo para publicar: criar o repositório no GitHub, conectar na Vercel, cadastrar a variável LASTFM_API_KEY no painel e conferir o site no ar. Antes, confirme que .env.local não está no histórico do git. Depois do deploy, liste o que devo testar em produção.
```

Pronto quando:

- [ ] site abre no endereço público
- [ ] recap e grade funcionam em produção, no celular
- [ ] a chave está só no painel da Vercel

---

## Ideias para depois

- Formato quadrado 1080x1080.
- Temas de cor para o recap.
- Comparação com o mês anterior ("subiu", "novo no top").
- Outros tamanhos de grade e grade de artistas.
- Login com Spotify, se as regras da API mudarem.
