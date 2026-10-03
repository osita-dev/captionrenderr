import type { WordTimestamp } from './types';

/**
 * Smart word grouping — groups words by phrases for readability.
 * Uses natural language patterns to create meaningful groups.
 */

// Common English stop words that usually belong with the next word
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'also', 'as', 'if', 'then', 'else', 'while', 'because',
  'until', 'although', 'though', 'since', 'unless', 'whether', 'after',
  'before', 'during', 'about', 'into', 'through', 'over', 'under', 'again',
  'further', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
]);

// Words that typically start a new phrase
const PHRASE_STARTERS = new Set([
  'the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your',
  'his', 'her', 'our', 'their', 'its', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'it', 'i', 'you', 'he', 'she', 'we', 'they',
  'me', 'him', 'her', 'us', 'them', 'what', 'which', 'who', 'whom',
  'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'as', 'if', 'then', 'else', 'while', 'because', 'until', 'although',
  'though', 'since', 'unless', 'whether', 'after', 'before', 'during',
  'about', 'into', 'through', 'over', 'under', 'again', 'further',
  'once', 'here', 'there',
]);

export interface CaptionGroup {
  words: WordTimestamp[];
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * Group words into readable phrases.
 * @param words - Array of word timestamps
 * @param maxWords - Maximum words per group (1-4)
 * @returns Array of caption groups
 */
export function groupWords(words: WordTimestamp[], maxWords: number): CaptionGroup[] {
  if (maxWords <= 1) {
    // Single word mode — each word is its own group
    return words.map((word) => ({
      words: [word],
      startTime: word.startTime,
      endTime: word.endTime,
      text: word.text,
    }));
  }

  const groups: CaptionGroup[] = [];
  let currentGroup: WordTimestamp[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];

    // Add word to current group
    currentGroup.push(word);

    // Check if we should close the group
    const shouldClose = shouldCloseGroup(currentGroup, nextWord, maxWords, words, i);

    if (shouldClose || currentGroup.length >= maxWords) {
      groups.push(createGroup(currentGroup));
      currentGroup = [];
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 0) {
    groups.push(createGroup(currentGroup));
  }

  return groups;
}

/**
 * Determine if the current group should be closed
 */
function shouldCloseGroup(
  currentGroup: WordTimestamp[],
  nextWord: WordTimestamp | undefined,
  maxWords: number,
  _allWords: WordTimestamp[],
  _currentIndex: number
): boolean {
  // Always close if we've reached max words
  if (currentGroup.length >= maxWords) {
    return true;
  }

  // Don't close if there's no next word
  if (!nextWord) {
    return true;
  }

  const lastWord = currentGroup[currentGroup.length - 1];
  const nextText = nextWord.text.toLowerCase();

  // Close if there's a significant time gap (> 0.5 seconds)
  const timeGap = nextWord.startTime - lastWord.endTime;
  if (timeGap > 0.5) {
    return true;
  }

  // Close if the next word starts a new phrase
  if (PHRASE_STARTERS.has(nextText) && currentGroup.length >= 2) {
    return true;
  }

  // Close if the current group has a stop word at the end
  const lastText = lastWord.text.toLowerCase();
  if (STOP_WORDS.has(lastText) && currentGroup.length >= 2) {
    return true;
  }

  // Close if we're at a natural breaking point
  // (e.g., after a preposition or conjunction)
  const breakWords = new Set(['and', 'or', 'but', 'so', 'yet', 'for', 'nor']);
  if (breakWords.has(lastText) && currentGroup.length >= 2) {
    return true;
  }

  return false;
}

/**
 * Create a caption group from an array of words
 */
function createGroup(words: WordTimestamp[]): CaptionGroup {
  return {
    words,
    startTime: words[0].startTime,
    endTime: words[words.length - 1].endTime,
    text: words.map((w) => w.text).join(' '),
  };
}
