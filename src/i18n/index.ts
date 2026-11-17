import type { Locale } from "./config";
import { en } from "./en";
import { es } from "./es";
import { pt, type Dict } from "./pt";

export type { Dict };

/** Os três dicionários. São pequenos: vão juntos para o navegador sem pesar. */
export const DICTS: Record<Locale, Dict> = { pt, en, es };
