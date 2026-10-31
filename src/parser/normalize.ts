/** Kleinschreibung, Umlaute → ae/oe/ue/ss, Satzzeichen entfernen, Leerraum zusammenfassen. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[„“"'’`´«»!?¿¡,;:()[\]{}<>*]/g, ' ')
    .replace(/(\D)\.|\.(\D)|\.$/g, '$1 $2')
    .replace(/[-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(input: string): string[] {
  const n = normalize(input);
  return n ? n.split(' ') : [];
}

/** Editierdistanz (Damerau/OSA: Vertauschung benachbarter Buchstaben zählt als ein Fehler) */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return Math.min(d[a.length][b.length], max + 1);
}

/** Erlaubte Tippfehler-Toleranz abhängig von der Wortlänge (kurze Wörter: keine). */
export function typoTolerance(word: string): number {
  if (word.length >= 8) return 2;
  if (word.length >= 4) return 1;
  return 0;
}

const NUMBER_WORDS: Record<string, number> = {
  eine: 1,
  einen: 1,
  ein: 1,
  eins: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fuenf: 5,
  zehn: 10,
  fuenfzehn: 15,
  zwanzig: 20,
  dreissig: 30,
  halbe: 30,
  vierzig: 40,
  sechzig: 60,
};

export function parseNumberWord(w: string): number | null {
  if (/^\d+$/.test(w)) return parseInt(w, 10);
  return NUMBER_WORDS[w] ?? null;
}
