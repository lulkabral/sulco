# Revisão de segurança

Feita na fase 7, em 15/11/2026, com o build de produção e o servidor local. Refazer antes de cada publicação grande.

## As quatro perguntas do roteiro

**1. A chave aparece em algum arquivo enviado ao navegador?** Não.
Busca do valor real da chave (sem imprimi-lo) em `.next/static`, no `.next` inteiro, nos arquivos versionados e em todo o histórico do git: 0 ocorrências em todos. O `.env.local` está no `.gitignore` e nunca foi commitado. A chave só é lida em `src/lib/lastfm/client.ts`, que importa `server-only` (o build falha se o navegador tentar importá-lo).

**2. Existe alguma variável `NEXT_PUBLIC_` indevida?** Não.
A única variável de ambiente lida pelo código é `LASTFM_API_KEY`, no servidor. `NEXT_PUBLIC_` só aparece em comentários e docs que proíbem o uso.

**3. Alguma rota aceita método ou domínio fora da lista?** Não.
- As 4 rotas (`user`, `top`, `tags`, `scrobbles`) exportam só `GET`; POST, PUT, DELETE e PATCH devolvem 405.
- O método do Last.fm é fixo em cada rota e conferido contra a lista de `docs/LASTFM.md`. Um `?method=` extra na URL é ignorado.
- O código só faz `fetch` para o endereço fixo da API do Last.fm (servidor) e para as nossas próprias rotas (navegador).
- Imagens: o otimizador do Next aceita só `https://lastfm-img.freetls.fastly.net/i/u/**`. Testado: outro domínio, outra pasta, `http://` e `lastfm-img.freetls.fastly.net.evil.com` devolvem 400. Não existe rota de proxy de imagens (as capas são carregadas direto, com CORS; ver `LASTFM.md`).
- Validação de entrada em tudo: username (regra do Last.fm), período, tipo, limite, nome de artista, intervalo de até 32 dias, página até 50.

**4. Algum log grava username?** Não, depois de uma correção.
- Os `console.error` registram só o método do Last.fm e o código do erro.
- O log de pedidos do `next dev` ignora `/api/lastfm/*` e `/u/*`. Conferido com pedidos reais: nenhum username nos logs.
- **Corrigido nesta revisão:** o formulário da página inicial não tinha `action`. Se fosse enviado antes de o JavaScript carregar, virava `GET /?username=NOME`, que aparecia no log (e não levava a lugar nenhum). Agora ele envia para `/u?username=NOME`, que redireciona para `/u/NOME` e também fica fora do log.

## Riscos que continuam (para a fase 8)

- **Sem limite de pedidos nas nossas rotas.** Qualquer pessoa pode chamar `/api/lastfm/*` em sequência, e cada chamada que não estiver em cache gasta a nossa chave no Last.fm (que pode suspendê-la). O cache reduz bastante o problema, mas não o elimina. Recomendação: ligar uma regra de limite de pedidos por IP no firewall da Vercel ao publicar.
- **Registros da hospedagem.** A Vercel guarda por pouco tempo os endereços acessados, e `/u/NOME` inclui o username. Isso está dito na página `/privacidade`.
- **`metadataBase` local.** O build local avisa que usa `http://localhost:3000` nos endereços da imagem de compartilhamento. Na Vercel, o Next usa o domínio do projeto sozinho (`VERCEL_PROJECT_PRODUCTION_URL`). Conferir na fase 8.
