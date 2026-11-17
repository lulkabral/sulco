import type { Dict } from "./pt";

// Textos do site em inglês. Mesmas chaves de pt.ts.

export const en: Dict = {
  meta: {
    tagline: "your month in music",
    description:
      "See your most played artists, tracks, albums and genres of any month and download an image ready to share. All you need is your Last.fm username.",
    ogAlt: "sulco: what played in your month? A collage of album covers and an invitation to make your recap from Last.fm.",
  },
  common: {
    skipToContent: "Skip to content",
    homeLabel: "sulco, home page",
    backHome: "Back to home",
  },
  home: {
    titleLine1: "what played",
    titleLine2: "in",
    titleHighlight: "your month?",
    intro: "Your most played artists, tracks, albums and genres, in one image ready to post.",
    noLastfm: "Don't have Last.fm?",
    noLastfmBefore: "Create a free account at",
    noLastfmAfter:
      "and turn on scrobbling for your music app (Spotify, Deezer, YouTube Music and others) in the Last.fm settings. From then on, everything you listen to counts.",
    showcaseCaption: "in the spotlight this month",
    trendingCaption: "albums trending worldwide today",
    edition: (n: number, date: string) => `no. ${n} · ${date}`,
  },
  form: {
    label: "Last.fm username",
    placeholder: "your_username",
    submit: "Make it",
    sending: "Opening…",
    invalid: "Enter a valid Last.fm username (2 to 15 letters, numbers, _ or -).",
  },
  footer: {
    line: "your month in music · no sign-up, made on your device",
    madeBy: "made by",
    onX: (handle: string, label?: string) => `${label ? `${label} ` : ""}@${handle} on X (opens in a new tab)`,
    lastfm: "Data from Last.fm",
    code: "Open source",
    privacy: "Privacy",
    language: "Language",
  },
  notFound: {
    title: "Page not found",
    eyebrow: "ERROR 404",
    heading: "This page doesn't exist",
    body: "The address may be wrong or the page has moved. To see a recap, enter a Last.fm username:",
  },
  privacy: {
    title: "Privacy",
    description: "What sulco does (and doesn't do) with your data.",
    summary:
      "In short: the site only needs your Last.fm username, reads only what is already public on your profile and stores nothing about you.",
    sections: [
      {
        title: "What the site receives",
        paragraphs: [
          "Only the Last.fm username you type. It is already public: anyone can open last.fm/user/your-username.",
        ],
      },
      {
        title: "What the site reads",
        paragraphs: [
          "Only public data from your Last.fm profile: the tracks, artists and albums you listened to (your scrobbles), your total scrobbles and your profile picture. The site does not connect to Spotify or any other streaming service, and never asks for a password.",
        ],
      },
      {
        title: "What the site doesn't have",
        list: ["Sign-up, login or passwords.", "A database.", "Tracking cookies or ads.", "A history of what each person looked up."],
      },
      {
        title: "What is stored, and for how long",
        paragraphs: [
          "To avoid overloading Last.fm, its answers are kept for a while (cache), depending on the kind of data: 10 minutes to 1 day for your tops and scrobbles, 7 days for artist tags and 30 days for album covers. This cache holds Last.fm's answer, with no link to who asked for it.",
          "In your own browser, the site remembers your image choices (layout, color and whether to show numbers), so you don't have to pick them again. This stays on your device only: it is not a cookie and is never sent to the site. To erase it, clear the site's data in your browser.",
          "If you pick a language in the footer, the site stores that choice in a cookie called \"lang\", which only contains \"pt\", \"en\" or \"es\" and lasts one year. It does not identify you; it only opens the site in the language you chose.",
          "The company that hosts the site (Vercel) keeps technical access logs for a short time, such as the address of the page visited. Since the username is part of the address (e.g. /u/your-username), it may appear in those logs. The site itself never writes any log with usernames.",
        ],
      },
      {
        title: "Visit counting",
        paragraphs: [
          "To know how many people use the site, it uses Vercel Web Analytics, which counts visits without cookies. Before each count leaves your browser, the site removes the username from the address (/u/your-username becomes /u/[perfil]) and everything after the \"?\", such as the chosen period. So no one can see which profiles were looked up.",
          "The count records only the page (without username), the country, the device type, the browser and, if you came from another site, which one. Vercel tells visitors apart by a code that changes every day, without storing who you are.",
          "If your browser has \"Do Not Track\" or Global Privacy Control turned on, the visit is not counted.",
        ],
      },
      {
        title: "Where the images are made",
        paragraphs: [
          "The recap and the album grid are drawn on your own device, by your browser. The image is not sent to our server; it only leaves your device if you download or share it.",
        ],
      },
      {
        title: "Non-commercial project",
        paragraphs: [
          "The data comes from Last.fm, under the terms of use of their API. The site is not affiliated with Last.fm or Spotify.",
        ],
      },
    ],
  },
};
