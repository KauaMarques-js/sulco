/**
 * Intl.NumberFormat cache. Formatting numbers with a fresh options object on
 * every render (and on every playback tick) is surprisingly expensive; the
 * formatters are immutable, so they can be shared per language + digits.
 */
const cache = new Map<string, Intl.NumberFormat>();

export function numFmt(lang: string, min: number, max: number = min): Intl.NumberFormat {
  const key = `${lang}:${min}:${max}`;
  let f = cache.get(key);
  if (!f) { f = new Intl.NumberFormat(lang, { minimumFractionDigits: min, maximumFractionDigits: max }); cache.set(key, f); }
  return f;
}
