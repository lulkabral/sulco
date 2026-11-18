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
    loading: "carregando…",
  },
  home: {
    titleLine1: "o que tocou",
    titleLine2: "no",
    titleHighlight: "seu mês?",
    intro: "Seus artistas, músicas, álbuns e gêneros mais ouvidos, numa imagem para postar.",
    noLastfm: "Não tem Last.fm?",
    noLastfmJoin: "Crie a conta grátis em",
    noLastfmJoinAfter: ". O nome de usuário que você escolher lá é o que se digita aqui.",
    noLastfmSteps: [
      "Para ligar o seu app de música: no site do Last.fm, toque na foto do perfil → Configurações → Aplicativos e conecte o serviço que você usa.",
      "YouTube Music (Android): instale o Pano Scrobbler na Play Store, entre com a conta do Last.fm, libere o acesso às notificações e deixe o YouTube Music ligado.",
    ],
    noLastfmNote: "O Last.fm só conta a partir da conexão: o que você ouviu antes não entra.",
    showcaseCaption: "em evidência este mês",
    trendingCaption: "em alta no mundo hoje",
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
    privacy: "Privacidade",
    language: "Língua",
  },
  notFound: {
    title: "Página não encontrada",
    eyebrow: "ERRO 404",
    heading: "Essa página não existe",
    body: "O endereço pode estar errado ou a página mudou de lugar. Para ver um recap, digite um username do Last.fm:",
  },
  periods: {
    long: {
      overall: "Todo o tempo",
      "7day": "Últimos 7 dias",
      "1month": "Últimos 30 dias",
      "3month": "Últimos 3 meses",
      "6month": "Últimos 6 meses",
      "12month": "Últimos 12 meses",
    } as Record<string, string>,
    short: {
      overall: "Todo o tempo",
      "7day": "7 dias",
      "1month": "30 dias",
      "3month": "3 meses",
      "6month": "6 meses",
      "12month": "12 meses",
    } as Record<string, string>,
    /** Rótulo curtinho do bloco do Mosaico. */
    tag: {
      overall: "TUDO",
      "7day": "7 DIAS",
      "1month": "30 DIAS",
      "3month": "3 MESES",
      "6month": "6 MESES",
      "12month": "1 ANO",
    } as Record<string, string>,
    monthsShort: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
    yearOngoing: (year: number) => `${year} até agora`,
    wholeYear: (year: number) => `Ano inteiro de ${year}`,
    since: (text: string) => `desde ${text}`,
  },
  units: {
    plays: (n: string, count: number) => `${n} ${count === 1 ? "reprodução" : "reproduções"}`,
    scrobbles: "scrobbles",
    minutes: "minutos",
    and: "e",
  },
  profile: {
    fallbackTitle: "Usuário",
    metaDescription: (user: string) => `Recap e grade de álbuns de ${user}, a partir do Last.fm.`,
    switchUser: "Trocar usuário",
    sinceYear: (year: number) => `desde ${year}`,
    tabsLabel: "Abas",
    tabs: { recap: "Recap", grade: "Grade" } as Record<string, string>,
    periodNav: "Período",
    periodButton: "Período: ",
    periodDialog: "Escolher período",
    periodHeading: "Período",
    close: "Fechar",
    pickerHeading: "Escolher mês ou ano",
    prevYear: "Ano anterior",
    nextYear: "Próximo ano",
    monthsOf: (year: number) => `Meses de ${year}`,
    monthUnavailable: "Mês ainda não terminou ou é de antes do cadastro",
    noMusicTitle: "Nenhuma música neste período",
    noMusicBody: (label: string) => `Não há scrobbles em “${label.toLowerCase()}”. Tente um período maior.`,
  },
  lists: {
    artists: "Artistas",
    tracks: "Músicas",
    albums: "Álbuns",
    genres: "Gêneros",
    empty: "Nada neste período.",
    genresError: "Não deu para calcular agora. Tente recarregar a página.",
    genresNoTags: "Os artistas deste período não têm tags suficientes no Last.fm.",
  },
  errors: {
    BAD_REQUEST: {
      title: "Esse username não parece válido",
      text: "Usernames do Last.fm têm de 2 a 15 caracteres: letras, números, _ ou -.",
    },
    USER_NOT_FOUND: {
      title: "Não achamos esse usuário no Last.fm",
      text: "Confira se o username está escrito certo.",
    },
    PRIVATE_PROFILE: {
      title: "Esse perfil deixa o histórico privado",
      text: "Para usar o site, desmarque a opção de esconder as músicas recentes nas configurações de privacidade do Last.fm.",
    },
    RATE_LIMITED: {
      title: "Muitas consultas ao mesmo tempo",
      text: "O Last.fm pediu para irmos com calma. Espere alguns segundos e tente de novo.",
    },
    LASTFM_DOWN: {
      title: "O Last.fm não respondeu",
      text: "Pode ser instabilidade do lado deles. Espere alguns segundos e tente de novo.",
    },
    retry: "Tentar de novo",
    retrying: "Tentando…",
  },
  month: {
    noMusicTitle: (label: string) => `Nenhuma música em ${label.toLowerCase()}`,
    noMusicBody: "Não há scrobbles neste período. Tente outro mês, outro ano ou um dos períodos acima.",
    truncated: (max: string, used: string) =>
      `Este mês tem mais de ${max} scrobbles. Para não sobrecarregar o Last.fm, a conta usa só os ${used} mais recentes do mês.`,
    fetching: (label: string) => `Buscando seus scrobbles de ${label.toLowerCase()}…`,
    fetchingCovers: (label: string, done: number, total: number) =>
      `Buscando as capas de ${label.toLowerCase()}: ${done} de ${total}`,
    readingPages: (label: string, done: number, total: number) =>
      `Lendo seus scrobbles de ${label.toLowerCase()}: página ${done} de ${total}`,
    progressLabel: "Progresso da leitura dos scrobbles",
  },
  recap: {
    heading: "Imagem do recap",
    building: "Montando o recap…",
    completing: "Completando capas e gêneros…",
    minutesNote: "Minutos estimados pela duração das suas músicas mais ouvidas.",
    format: "Formato",
    color: "Cor",
    coverColor: "Cor da capa",
    layouts: { "toca-discos": "Toca-discos", mosaico: "Mosaico", lineup: "Lineup", classico: "Clássico" } as Record<string, string>,
    palettes: { ambar: "Âmbar", "meia-noite": "Meia-noite", vinho: "Vinho", papel: "Papel", lilas: "Lilás" } as Record<string, string>,
    showNumbers: "Mostrar scrobbles e minutos",
    showNumbersHint: "Na imagem: total de scrobbles, minutos ouvidos e quantas vezes você ouviu cada item",
    alt: (user: string, label: string, layout: string) =>
      `Recap de ${user}: ${label.toLowerCase()}, formato ${layout}. Os tops em texto estão abaixo.`,
    shareTitle: (label: string) => `Meu recap: ${label.toLowerCase()}`,
    saveHint: "Dica: segure a imagem para salvar ou compartilhar.",
  },
  grid: {
    heading: "Grade de álbuns",
    building: "Montando a grade…",
    completing: "Completando as capas…",
    empty: "Nenhum álbum neste período.",
    size: "Tamanho",
    fewAlbums: (n: number) => `Só ${n} ${n === 1 ? "álbum" : "álbuns"} neste período; o resto da grade fica vazio.`,
    show: "Mostrar",
    caption: "Nome do álbum e artista",
    plays: "Número de reproduções",
    alt: (size: number, label: string) =>
      `Grade ${size}x${size} com as capas dos álbuns mais ouvidos: ${label.toLowerCase()}. A lista em texto está abaixo.`,
    shareTitle: (label: string) => `Meus álbuns: ${label.toLowerCase()}`,
  },
  export: {
    download: "Baixar imagem",
    share: "Compartilhar",
    copy: "Copiar imagem",
    copied: "Imagem copiada!",
  },
  /** Texto desenhado dentro das imagens (recap e grade). */
  canvas: {
    inYourHead: "Na sua cabeça",
    onRepeat: "No repeat",
    genresLine: "GÊNEROS",
    calculating: "calculando…",
    noTags: "sem tags suficientes",
    unavailable: "indisponível",
    presents: (user: string) => `@${user} apresenta`,
    recapOf: (user: string) => `Recap · @${user}`,
    albumOf: {
      month: "O álbum do mês",
      year: "O álbum do ano",
      life: "O álbum da sua vida",
      week: "O álbum da semana",
      period: "O álbum do período",
    },
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
