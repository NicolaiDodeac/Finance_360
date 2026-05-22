/**
 * Deterministic food-service merchant detection for categorisation suggestions.
 * Suggestions only — never forces a category or business flag.
 */

/** Multi-word or distinctive merchant phrases (normalized uppercase key). */
const EATING_OUT_PHRASES = [
  "JUST EAT",
  "DELIVEROO",
  "UBER EATS",
  "BURGER KING",
  "MCDONALD",
  "GREGGS",
  "STARBUCKS",
  "COSTA COFFEE",
  "COSTA ",
  " CAFE NERO",
  "NERO COFFEE",
  "PRET A MANGER",
  " PRET ",
] as const;

/** Safe substring matches (unlikely to false-positive on bank names). */
const EATING_OUT_INCLUDES = [
  "RESTAURANT",
  "RESTAURANTE",
  "RISTORANTE",
  "PIZZERIA",
  "PIZZA",
  "BAKERY",
  "BAKERS",
  "PATISSERIE",
  "PASTICCERIA",
  "TAKEAWAY",
  "KEBAB",
  "SUSHI",
  "NOODLE",
  "CURRY",
  "MCDONALD",
  "KFC",
  "GREGGS",
  "STARBUCKS",
  "DELIVEROO",
  "ESPRESSO",
  "COFFEE",
  "JUST EAT",
  "UBER EAT",
  "BURGER KING",
  "SUBWAY",
  "PRET A MANGER",
  "NERO",
] as const;

/** Whole-token or token-prefix matches (avoids e.g. BAR inside BARCLAYS). */
const EATING_OUT_TOKEN_EXACT = new Set([
  "PUB",
  "BAR",
  "GRILL",
  "KITCHEN",
  "CHICKEN",
  "INDIAN",
  "CHINESE",
  "THAI",
  "BURGER",
  "PIZZA",
  "CAFE",
  "CAF",
  "SUBWAY",
  "NERO",
  "PRET",
]);

const EATING_OUT_TOKEN_PREFIXES = ["PIZZ"] as const;

export function looksLikeEatingOut(key: string): boolean {
  if (!key) return false;

  if (EATING_OUT_PHRASES.some((phrase) => key.includes(phrase))) {
    return true;
  }

  if (EATING_OUT_INCLUDES.some((fragment) => key.includes(fragment))) {
    return true;
  }

  const tokens = key.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (EATING_OUT_TOKEN_EXACT.has(token)) {
      return true;
    }
    if (EATING_OUT_TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix))) {
      return true;
    }
  }

  return false;
}
