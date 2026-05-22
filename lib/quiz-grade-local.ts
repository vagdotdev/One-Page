// Client-safe short-answer grading heuristics (no LLM / Node imports).

const STOP = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "were",
  "with",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantWords(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOP.has(w));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    let prev = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cur =
        a[i] === b[j]
          ? row[j]
          : Math.min(row[j], row[j + 1], prev) + 1;
      row[j] = prev;
      prev = cur;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

function wordMatches(answerWords: string[], word: string): boolean {
  if (answerWords.includes(word)) return true;
  if (word.length < 4) return false;
  return answerWords.some(
    (w) => levenshtein(w, word) <= Math.max(1, Math.floor(word.length * 0.25)),
  );
}

export function gradeShortAnswerLocally(
  referencePhrases: string[],
  answer: string,
): boolean {
  const normalizedAnswer = normalize(answer);
  if (!normalizedAnswer) return false;

  const answerWords = significantWords(answer);

  for (const phrase of referencePhrases) {
    const normalizedPhrase = normalize(phrase);
    if (!normalizedPhrase) continue;

    if (
      normalizedAnswer.includes(normalizedPhrase) ||
      normalizedPhrase.includes(normalizedAnswer)
    ) {
      return true;
    }

    const refWords = significantWords(phrase);
    if (refWords.length === 0) continue;

    const hits = refWords.filter((w) => wordMatches(answerWords, w));
    const threshold =
      refWords.length <= 2 ? refWords.length : Math.ceil(refWords.length * 0.5);
    if (hits.length >= threshold) return true;
  }

  return false;
}
