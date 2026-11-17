// Textos do site em português (a língua de origem). en.ts e es.ts têm as mesmas chaves:
// o TypeScript reclama se faltar alguma. Textos com número viram função.

export const pt = {
  meta: {
    tagline: "seu mês em música",
    description:
      "Veja seus artistas, músicas, álbuns e gêneros mais ouvidos de qualquer mês e baixe uma imagem pronta para compartilhar. Basta o username do Last.fm.",
    ogAlt: "sulco: o que tocou no seu mês? Colagem de capas de álbuns e o convite para gerar o seu recap a partir do Last.fm.",
  },
  common: {
    skipToContent: "Pular para o conteúdo",
    homeLabel: "sulco, página inicial",
    backHome: "Voltar ao início",
  },
  home: {
    titleLine1: "o que tocou",
    titleLine2: "no",
    titleHighlight: "seu mês?",
    intro: "Seus artistas, músicas, álbuns e gêneros mais ouvidos, numa imagem para postar.",
    noLastfm: "Não tem Last.fm?",
    noLastfmBefore: "Crie uma conta grátis em",
    noLastfmAfter:
      "e ligue o scrobbling no seu app de música (Spotify, Deezer, YouTube Music e outros) nas configurações do Last.fm. A partir daí, tudo que você ouvir passa a contar.",
    showcaseCaption: "em evidência este mês",
    trendingCaption: "álbuns em alta no mundo hoje",
    edition: (n: number, date: string) => `nº ${n} · ${date}`,
  },
  form: {
    label: "Username do Last.fm",
    placeholder: "seu_usuario",
    submit: "Gerar",
    sending: "Abrindo…",
    invalid: "Digite um username do Last.fm válido (2 a 15 letras, números, _ ou -).",
  },
  footer: {
    line: "seu mês em música · sem cadastro, gerado no seu aparelho",
    madeBy: "feito por",
    onX: (handle: string, label?: string) => `${label ? `${label} ` : ""}@${handle} no X (abre em outra aba)`,
    lastfm: "Dados do Last.fm",
    code: "Código aberto",
    privacy: "Privacidade",
    language: "Língua",
  },
  notFound: {
    title: "Página não encontrada",
    eyebrow: "ERRO 404",
    heading: "Essa página não existe",
    body: "O endereço pode estar errado ou a página mudou de lugar. Para ver um recap, digite um username do Last.fm:",
  },
  privacy: {
    title: "Privacidade",
    description: "O que o sulco faz (e não faz) com os seus dados.",
    summary:
      "Resumo: o site só precisa do seu username do Last.fm, lê apenas o que já é público no seu perfil e não guarda nada sobre você.",
    sections: [
      {
        title: "O que o site recebe",
        paragraphs: [
          "Só o username do Last.fm que você digita. Ele já é público: qualquer pessoa pode abrir last.fm/user/seu-username.",
        ],
      },
      {
        title: "O que o site lê",
        paragraphs: [
          "Apenas dados públicos do seu perfil no Last.fm: as músicas, os artistas e os álbuns que você ouviu (os scrobbles), o total de scrobbles e a foto do perfil. O site não se conecta ao Spotify nem a nenhum outro serviço de streaming, e não pede senha.",
        ],
      },
      {
        title: "O que o site não tem",
        list: [
          "Cadastro, login ou senha.",
          "Banco de dados.",
          "Cookies de rastreio ou anúncios.",
          "Histórico do que cada pessoa pesquisou.",
        ],
      },
      {
        title: "O que fica guardado, e por quanto tempo",
        paragraphs: [
          "Para não sobrecarregar o Last.fm, as respostas dele ficam guardadas temporariamente (cache), conforme o tipo de dado: de 10 minutos a 1 dia para os seus tops e scrobbles, 7 dias para as tags dos artistas e 30 dias para as capas dos álbuns. Esse cache guarda a resposta do Last.fm, sem ligação com quem pediu.",
          "No seu próprio navegador, o site lembra as escolhas da imagem (formato, cor e se mostra os números), para você não precisar escolher de novo. Isso fica só no seu aparelho: não é cookie e nunca é enviado para o site. Para apagar, basta limpar os dados do site no navegador.",
          "Se você escolher uma língua no rodapé, o site guarda essa escolha num cookie chamado \"lang\", que só contém \"pt\", \"en\" ou \"es\" e dura um ano. Ele não identifica você; serve só para abrir o site na língua escolhida.",
          "A empresa que hospeda o site (Vercel) mantém, por pouco tempo, registros técnicos de acesso, como o endereço da página visitada. Como o username faz parte do endereço (ex.: /u/seu-username), ele pode aparecer nesses registros. O site em si não grava nenhum registro com username.",
        ],
      },
      {
        title: "Contagem de visitas",
        paragraphs: [
          "Para saber quantas pessoas usam o site, ele usa o Vercel Web Analytics, que conta visitas sem cookies. Antes de cada contagem sair do seu navegador, o site apaga o username do endereço (/u/seu-username vira /u/[perfil]) e tudo que vem depois do \"?\", como o período escolhido. Assim, ninguém consegue ver quais perfis foram consultados.",
          "A contagem registra só a página (sem username), o país, o tipo de aparelho, o navegador e, se você veio de outro site, de qual. A Vercel diferencia visitantes por um código que muda todo dia, sem guardar quem você é.",
          "Se o seu navegador estiver com \"Não rastrear\" (Do Not Track) ou Global Privacy Control ligado, a visita não é contada.",
        ],
      },
      {
        title: "Onde as imagens são criadas",
        paragraphs: [
          "O recap e a grade de álbuns são desenhados no seu próprio aparelho, pelo navegador. A imagem não é enviada para o nosso servidor; ela só sai do aparelho se você baixar ou compartilhar.",
        ],
      },
      {
        title: "Projeto não comercial",
        paragraphs: [
          "Os dados vêm do Last.fm, de acordo com os termos de uso da API deles. O site não tem vínculo com o Last.fm nem com o Spotify.",
        ],
      },
    ] as { title: string; paragraphs?: string[]; list?: string[] }[],
  },
};

/** Mesmo formato do português, com qualquer texto no lugar de cada texto. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : { [K in keyof T]: Widen<T[K]> };

export type Dict = Widen<typeof pt>;
