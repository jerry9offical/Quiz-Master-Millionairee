import { useMemo } from 'react';

/**
 * Runtime option shuffling to eliminate answer-position bias.
 *
 * For each question index, produces a stable shuffled ordering of [A, B, C, D].
 * The shuffle is deterministic per session (generated once on mount) but varies
 * across sessions thanks to Math.random seeding.
 *
 * Returns helpers to:
 *  - get the shuffled display order for a question
 *  - map a "display letter" back to the "original letter" (for RPC calls)
 *  - map an "original letter" to the "display letter" (for showing correct answer)
 */

type OptionLetter = 'A' | 'B' | 'C' | 'D';

interface ShuffleMap {
  /** Shuffled order of original letters, e.g. ['C','A','D','B'] means display slot 0 shows original C */
  order: OptionLetter[];
  /** display letter → original letter  (e.g. 'A' → 'C' if original C is in first display slot) */
  displayToOriginal: Record<OptionLetter, OptionLetter>;
  /** original letter → display letter */
  originalToDisplay: Record<OptionLetter, OptionLetter>;
}

const LABELS: OptionLetter[] = ['A', 'B', 'C', 'D'];

/** Fisher-Yates shuffle (uniform randomness) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildShuffleMap(shuffledOriginals: OptionLetter[]): ShuffleMap {
  const displayToOriginal = {} as Record<OptionLetter, OptionLetter>;
  const originalToDisplay = {} as Record<OptionLetter, OptionLetter>;

  shuffledOriginals.forEach((original, idx) => {
    const displayLabel = LABELS[idx]; // A, B, C, D positionally
    displayToOriginal[displayLabel] = original;
    originalToDisplay[original] = displayLabel;
  });

  return { order: shuffledOriginals, displayToOriginal, originalToDisplay };
}

/**
 * Hook: generate one shuffle-map per question, stable for the life of the component.
 *
 * @param questionCount – number of questions to generate mappings for
 */
export function useOptionShuffle(questionCount: number) {
  const maps = useMemo(() => {
    const result: ShuffleMap[] = [];
    for (let i = 0; i < questionCount; i++) {
      const shuffled = shuffle([...LABELS]);
      const map = buildShuffleMap(shuffled);
      result.push(map);

      // Console diagnostics (dev only)
      if (import.meta.env.DEV) {
        console.log(
          `[Shuffle] Q${i + 1}: original order [A,B,C,D] → shuffled [${shuffled.join(',')}]`
        );
      }
    }
    return result;
  }, [questionCount]);

  /**
   * Get the option text & display label for a question at the given index.
   * Returns an array of { displayLabel, originalLabel, text } in shuffled order.
   */
  const getShuffledOptions = (
    questionIndex: number,
    question: { option_a: string; option_b: string; option_c: string; option_d: string }
  ) => {
    const map = maps[questionIndex];
    if (!map) return LABELS.map(l => ({ displayLabel: l, originalLabel: l, text: (question as any)[`option_${l.toLowerCase()}`] as string }));

    const optionTexts: Record<OptionLetter, string> = {
      A: question.option_a,
      B: question.option_b,
      C: question.option_c,
      D: question.option_d,
    };

    return LABELS.map((displayLabel) => {
      const originalLabel = map.displayToOriginal[displayLabel];
      return {
        displayLabel,
        originalLabel,
        text: optionTexts[originalLabel],
      };
    });
  };

  /** Convert a display letter (what user clicked) → original letter (for RPC) */
  const toOriginal = (questionIndex: number, displayLetter: OptionLetter): OptionLetter => {
    const map = maps[questionIndex];
    if (!map) return displayLetter;

    const original = map.displayToOriginal[displayLetter];

    if (import.meta.env.DEV) {
      console.log(`[Shuffle] Q${questionIndex + 1}: user selected display=${displayLetter} → original=${original}`);
    }
    return original;
  };

  /** Convert an original letter (from RPC) → display letter (for UI highlighting) */
  const toDisplay = (questionIndex: number, originalLetter: string): OptionLetter => {
    const map = maps[questionIndex];
    if (!map) return originalLetter as OptionLetter;

    const display = map.originalToDisplay[originalLetter as OptionLetter];

    if (import.meta.env.DEV) {
      console.log(`[Shuffle] Q${questionIndex + 1}: correct original=${originalLetter} → display=${display}`);
    }
    return display;
  };

  return { getShuffledOptions, toOriginal, toDisplay, maps };
}
