const criticalKeywords = [
  'kms',
  'kill myself',
  'suicide',
  'self harm',
  'self-harm',
  'wanna die',
  'end it all',
  'ending my life',
];

// This creates a regex like: /\b(kms|kill myself|...)\b/i
const criticalKeywordsRegex = new RegExp(`\\b(${criticalKeywords.join('|')})\\b`, 'i');

/**
 * Checks if the input text contains any of the high-risk critical keywords.
 * @param text The user's input string.
 * @returns `true` if a critical keyword is found, otherwise `false`.
 */
export const checkForCriticalKeywords = (text: string): boolean => {
  return criticalKeywordsRegex.test(text);
};