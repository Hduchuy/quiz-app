/**
 * Quiz Settings - Configuration for quiz behavior
 *
 * Features:
 * - shuffleQuestions: Random question order
 * - shuffleAnswers: Random answer order within each question
 * - showAnswerInstantly: Show correct/wrong feedback immediately after selection
 *
 * All settings are passed to prepareQuiz() which creates a shuffled copy
 * without mutating the original quiz data.
 */

/**
 * Default quiz settings
 */
export const DEFAULT_SETTINGS = {
  shuffleQuestions: false,
  shuffleAnswers: false,
  showAnswerInstantly: false
};

/**
 * Validate and normalize settings
 */
export function normalizeSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    shuffleQuestions: Boolean(settings.shuffleQuestions),
    shuffleAnswers: Boolean(settings.shuffleAnswers),
    showAnswerInstantly: Boolean(settings.showAnswerInstantly)
  };
}
