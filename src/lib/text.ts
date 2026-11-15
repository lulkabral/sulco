/**
 * Normaliza um nome para comparação: minúsculas, sem espaços nas pontas
 * e com espaços repetidos reduzidos a um só.
 * Exemplo: "  Hip   Hop " -> "hip hop"
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
