/**
 * Reviewed against all 150 original stems, correct options and explanations.
 * Numbers below are knowledge-card sequence numbers; empty entries are intentionally unlinked.
 * Candidates are advisory only. Confirmed links never come from module-name equivalence.
 */
const confirmed: Record<number, number[]> = {
  1: [2],
  2: [69],
  3: [13],
  4: [18],
  5: [30],
  6: [42],
  7: [56],
  8: [51],
  10: [69],
  11: [65],
  12: [74],
  13: [3],
  14: [12, 75],
  15: [13],
  17: [31],
  18: [43],
  19: [57],
  20: [51],
  22: [70],
  23: [65],
  25: [1],
  27: [14],
  28: [21],
  29: [32],
  30: [43],
  34: [72],
  35: [65],
  36: [74],
  37: [6],
  39: [14],
  40: [19],
  41: [33],
  42: [44],
  43: [59],
  44: [52],
  46: [71],
  47: [66],
  48: [6],
  49: [75],
  51: [24],
  52: [34],
  53: [44],
  54: [61],
  55: [52],
  57: [71],
  59: [7],
  61: [16],
  62: [23],
  63: [35],
  64: [46],
  65: [61],
  66: [53],
  67: [67],
  68: [9],
  69: [22],
  70: [35],
  71: [47],
  72: [60],
  73: [8],
  74: [25],
  75: [36],
  76: [11],
  79: [26],
  80: [38],
  82: [62],
  85: [73],
  87: [64],
  88: [11],
  91: [27],
  92: [39],
  94: [63],
  95: [50],
  97: [73],
  98: [53, 68],
  99: [76],
  100: [5],
  102: [15],
  103: [20, 29],
  104: [37],
  105: [48],
  106: [58],
  110: [67],
  111: [29, 76],
  112: [3, 13],
  113: [2],
  115: [62],
  116: [37],
  118: [54],
  119: [52],
  122: [68],
  123: [76],
  124: [4],
  127: [59],
  128: [40],
  130: [54],
  131: [53],
  133: [70],
  134: [49],
  135: [1],
  136: [12, 75],
  139: [41],
  140: [49],
  141: [40],
  142: [55],
  143: [66],
  144: [6],
  145: [58],
  147: [55],
  148: [64],
  149: [2, 47],
  150: [17],
};
// Conservative review amendments: gateway governance, zero trust and chaos engineering
// do not directly test the narrower card essentials even if their general domain overlaps.
delete confirmed[127];
delete confirmed[131];
delete confirmed[147];

export const reviewedQuestionLinks = Array.from({ length: 150 }, (_, i) => ({
  questionId: `RK${String(i + 1).padStart(3, "0")}`,
  knowledgeIds: (confirmed[i + 1] ?? []).map(
    (n) => `K${String(n).padStart(3, "0")}`,
  ),
  decision: confirmed[i + 1] ? ("confirmed" as const) : ("unlinked" as const),
}));

export function keywordCandidates(
  question: {
    stem: string;
    explanation: string;
    options: Record<string, string>;
    answer: string;
  },
  cards: { id: string; title: string }[],
) {
  const body =
    `${question.stem} ${question.options[question.answer]} ${question.explanation}`.toLowerCase();
  return cards
    .filter((k) =>
      k.title
        .split(/[\/\-与]/)
        .some((term) => term.length >= 2 && body.includes(term.toLowerCase())),
    )
    .map((k) => k.id);
}
