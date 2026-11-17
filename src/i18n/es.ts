import type { Dict } from "./pt";

// Textos del sitio en español. Mismas claves que pt.ts.

export const es: Dict = {
  meta: {
    tagline: "tu mes en música",
    description:
      "Mira tus artistas, canciones, álbumes y géneros más escuchados de cualquier mes y descarga una imagen lista para compartir. Solo necesitas tu usuario de Last.fm.",
    ogAlt: "sulco: ¿qué sonó en tu mes? Un collage de portadas de álbumes y la invitación a crear tu recap desde Last.fm.",
  },
  common: {
    skipToContent: "Saltar al contenido",
    homeLabel: "sulco, página de inicio",
    backHome: "Volver al inicio",
  },
  home: {
    titleLine1: "¿qué sonó",
    titleLine2: "en",
    titleHighlight: "tu mes?",
    intro: "Tus artistas, canciones, álbumes y géneros más escuchados, en una imagen para publicar.",
    noLastfm: "¿No tienes Last.fm?",
    noLastfmBefore: "Crea una cuenta gratis en",
    noLastfmAfter:
      "y activa el scrobbling de tu app de música (Spotify, Deezer, YouTube Music y otras) en la configuración de Last.fm. Desde entonces, todo lo que escuches cuenta.",
    showcaseCaption: "destacados este mes",
    trendingCaption: "álbumes en tendencia en el mundo hoy",
    edition: (n: number, date: string) => `n.º ${n} · ${date}`,
  },
  form: {
    label: "Usuario de Last.fm",
    placeholder: "tu_usuario",
    submit: "Crear",
    sending: "Abriendo…",
    invalid: "Escribe un usuario de Last.fm válido (2 a 15 letras, números, _ o -).",
  },
  footer: {
    line: "tu mes en música · sin registro, hecho en tu dispositivo",
    madeBy: "hecho por",
    onX: (handle: string, label?: string) => `${label ? `${label} ` : ""}@${handle} en X (se abre en otra pestaña)`,
    lastfm: "Datos de Last.fm",
    code: "Código abierto",
    privacy: "Privacidad",
    language: "Idioma",
  },
  notFound: {
    title: "Página no encontrada",
    eyebrow: "ERROR 404",
    heading: "Esta página no existe",
    body: "La dirección puede estar mal o la página cambió de lugar. Para ver un recap, escribe un usuario de Last.fm:",
  },
  privacy: {
    title: "Privacidad",
    description: "Lo que sulco hace (y no hace) con tus datos.",
    summary:
      "En resumen: el sitio solo necesita tu usuario de Last.fm, lee solo lo que ya es público en tu perfil y no guarda nada sobre ti.",
    sections: [
      {
        title: "Lo que recibe el sitio",
        paragraphs: [
          "Solo el usuario de Last.fm que escribes. Ya es público: cualquiera puede abrir last.fm/user/tu-usuario.",
        ],
      },
      {
        title: "Lo que lee el sitio",
        paragraphs: [
          "Solo datos públicos de tu perfil de Last.fm: las canciones, los artistas y los álbumes que escuchaste (los scrobbles), el total de scrobbles y la foto de perfil. El sitio no se conecta a Spotify ni a ningún otro servicio de streaming, y no pide contraseña.",
        ],
      },
      {
        title: "Lo que el sitio no tiene",
        list: ["Registro, inicio de sesión ni contraseña.", "Base de datos.", "Cookies de rastreo ni anuncios.", "Historial de lo que cada persona buscó."],
      },
      {
        title: "Lo que se guarda, y por cuánto tiempo",
        paragraphs: [
          "Para no sobrecargar a Last.fm, sus respuestas se guardan por un tiempo (caché), según el tipo de dato: de 10 minutos a 1 día para tus tops y scrobbles, 7 días para las etiquetas de los artistas y 30 días para las portadas de los álbumes. Esa caché guarda la respuesta de Last.fm, sin relación con quién la pidió.",
          "En tu propio navegador, el sitio recuerda tus elecciones de la imagen (formato, color y si muestra los números), para que no tengas que elegir de nuevo. Eso queda solo en tu dispositivo: no es una cookie y nunca se envía al sitio. Para borrarlo, limpia los datos del sitio en el navegador.",
          "Si eliges un idioma en el pie de página, el sitio guarda esa elección en una cookie llamada \"lang\", que solo contiene \"pt\", \"en\" o \"es\" y dura un año. No te identifica; solo sirve para abrir el sitio en el idioma elegido.",
          "La empresa que aloja el sitio (Vercel) guarda por poco tiempo registros técnicos de acceso, como la dirección de la página visitada. Como el usuario forma parte de la dirección (ej.: /u/tu-usuario), puede aparecer en esos registros. El sitio en sí no guarda ningún registro con usuarios.",
        ],
      },
      {
        title: "Conteo de visitas",
        paragraphs: [
          "Para saber cuántas personas usan el sitio, se usa Vercel Web Analytics, que cuenta visitas sin cookies. Antes de que cada conteo salga de tu navegador, el sitio borra el usuario de la dirección (/u/tu-usuario se convierte en /u/[perfil]) y todo lo que va después del \"?\", como el período elegido. Así nadie puede ver qué perfiles se consultaron.",
          "El conteo registra solo la página (sin usuario), el país, el tipo de dispositivo, el navegador y, si llegaste desde otro sitio, desde cuál. Vercel distingue a los visitantes con un código que cambia cada día, sin guardar quién eres.",
          "Si tu navegador tiene activado \"No rastrear\" (Do Not Track) o Global Privacy Control, la visita no se cuenta.",
        ],
      },
      {
        title: "Dónde se crean las imágenes",
        paragraphs: [
          "El recap y la cuadrícula de álbumes se dibujan en tu propio dispositivo, en el navegador. La imagen no se envía a nuestro servidor; solo sale de tu dispositivo si la descargas o la compartes.",
        ],
      },
      {
        title: "Proyecto no comercial",
        paragraphs: [
          "Los datos vienen de Last.fm, de acuerdo con los términos de uso de su API. El sitio no tiene relación con Last.fm ni con Spotify.",
        ],
      },
    ],
  },
};
