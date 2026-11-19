// Cores da identidade "Sala escura" para o canvas (recap e grade).
// São as mesmas de src/app/globals.css: se mudar lá, mude aqui também.

export const THEME = {
  room: "#110F0D",
  card: "#181512",
  card2: "#211C18",
  line: "#3A322C",
  ink: "#F4EEE6",
  inkSoft: "#ABA196",
  inkFaint: "#958B7F",
  amber: "#E8A13A",
  amberInk: "#2A1A05",
} as const;

/**
 * Paleta das peças abstratas das faixas da página inicial (antes de ter um usuário,
 * não há capas para mostrar). Tons quentes e terrosos, sem verde vivo.
 */
export const TILE_COLORS = [
  "#B8432C",
  "#3D5A73",
  "#D9A441",
  "#5E4B6E",
  "#2F6B5E",
  "#8A6A4F",
  "#C77C9B",
  "#29333F",
  "#E0C9A6",
  "#7A2E2E",
  "#4E7A8C",
  "#A65E3A",
] as const;
