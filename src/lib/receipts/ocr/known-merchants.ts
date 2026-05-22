/** Known UK retailers — display name + fuzzy OCR patterns. */
export interface KnownMerchantDef {
  id: string;
  displayName: string;
  /** Match on original text (case-insensitive). */
  patterns: RegExp[];
  /** Match on compact text (letters/digits only, uppercased). */
  compactKeys: string[];
}

export const KNOWN_MERCHANTS: KnownMerchantDef[] = [
  {
    id: "tesco",
    displayName: "Tesco",
    patterns: [
      /\bT[E3][S5][CG][O0](?:\s*(?:EXPRESS|FUEL|METRO|EXTRA|LOCAL|STORES?))?\b/i,
      /\bTESC[O0GQ]\b/i,
      /\bTESCO\b/i,
      /\bTESG[O0]\b/i,
    ],
    compactKeys: ["TESCO", "TSCOEXPRESS", "TESCOFUEL", "TESCOEXTRA", "TESCOMETRO"],
  },
  {
    id: "sainsburys",
    displayName: "Sainsbury's",
    patterns: [
      /\bSA[I1][N][S5]B[UUR][RY][']?S?\b/i,
      /\bSAINSBURY(?:'S)?\b/i,
    ],
    compactKeys: ["SAINSBURYS", "SAINSBURY", "SANISBURYS"],
  },
  {
    id: "asda",
    displayName: "Asda",
    patterns: [/\b[A4][S5]D[A4]\b/i, /\bASDA\b/i],
    compactKeys: ["ASDA"],
  },
  {
    id: "morrisons",
    displayName: "Morrisons",
    patterns: [
      /\bM[O0]RR[I1][S5][O0]N[S5]?\b/i,
      /\bMORRISONS?\b/i,
    ],
    compactKeys: ["MORRISONS", "MORRISON"],
  },
  {
    id: "aldi",
    displayName: "Aldi",
    patterns: [/\b[A4][L1]D[I1]\b/i, /\bALDI\b/i],
    compactKeys: ["ALDI"],
  },
  {
    id: "lidl",
    displayName: "Lidl",
    patterns: [/\b[L1][I1]D[L1]\b/i, /\bLIDL\b/i],
    compactKeys: ["LIDL"],
  },
  {
    id: "shell",
    displayName: "Shell",
    patterns: [/\bSH[E3][L1]{2}\b/i, /\bSHELL\b/i],
    compactKeys: ["SHELL"],
  },
  {
    id: "bp",
    displayName: "BP",
    patterns: [/\bB\s*P\s+(?:FUEL|CONNECT|GARAGE)\b/i, /\bBP\s+FUEL\b/i],
    compactKeys: ["BPFUEL", "BPCONNECT"],
  },
  {
    id: "esso",
    displayName: "Esso",
    patterns: [/\b[E3][S5]{2}[O0]\b/i, /\bESSO\b/i],
    compactKeys: ["ESSO"],
  },
  {
    id: "texaco",
    displayName: "Texaco",
    patterns: [/\bT[E3]X[A4]C[O0]\b/i, /\bTEXACO\b/i],
    compactKeys: ["TEXACO"],
  },
  {
    id: "costa",
    displayName: "Costa",
    patterns: [/\bC[O0][S5]T[A4]\b/i, /\bCOSTA\s*(?:COFFEE)?\b/i],
    compactKeys: ["COSTA", "COSTACOFFEE"],
  },
  {
    id: "starbucks",
    displayName: "Starbucks",
    patterns: [/\bST[A4]RB[UUC]CK[S5]?\b/i, /\bSTARBUCKS\b/i],
    compactKeys: ["STARBUCKS"],
  },
  {
    id: "greggs",
    displayName: "Greggs",
    patterns: [/\bGR[E3][G6]{2}[S5]?\b/i, /\bGREGGS\b/i],
    compactKeys: ["GREGGS"],
  },
  {
    id: "boots",
    displayName: "Boots",
    patterns: [/\bB[O0]{2}T[S5]\b/i, /\bBOOTS\b/i],
    compactKeys: ["BOOTS"],
  },
  {
    id: "superdrug",
    displayName: "Superdrug",
    patterns: [/\bSUP[E3]RD[RU][UUG][G6]\b/i, /\bSUPERDRUG\b/i],
    compactKeys: ["SUPERDRUG"],
  },
  {
    id: "amazon",
    displayName: "Amazon",
    patterns: [/\b[A4]M[A4]Z[O0]N\b/i, /\bAMAZON\b/i],
    compactKeys: ["AMAZON"],
  },
  {
    id: "mcdonalds",
    displayName: "McDonald's",
    patterns: [/\bM[C<G][D0][O0]N[A4][L1][D0][S5]?\b/i, /\bMCDONALDS?\b/i],
    compactKeys: ["MCDONALDS", "MCDONALD"],
  },
  {
    id: "pret",
    displayName: "Pret",
    patterns: [/\bP[RP][E3]T\s*(?:A\s*MANGER)?\b/i],
    compactKeys: ["PRET", "PRETAMANGER"],
  },
  {
    id: "waitrose",
    displayName: "Waitrose",
    patterns: [/\bW[A4][I1]T[RK][O0][S5][E3]\b/i, /\bWAITROSE\b/i],
    compactKeys: ["WAITROSE"],
  },
  {
    id: "coop",
    displayName: "Co-op",
    patterns: [/\bC[O0][-\s]?[O0]P\b/i, /\bCOOP\b/i, /\bTHE\s+CO[\-\s]?OP\b/i],
    compactKeys: ["COOP", "THECOOP"],
  },
];
