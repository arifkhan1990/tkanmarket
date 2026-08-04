/** Maps 0–100 engagement score to a 0.0–5.0 style label for display. */
export function engagementScoreToRatingLabel(score: number): string {
  const clamped = Math.max(0, Math.min(100, score))
  return ((clamped / 100) * 5).toFixed(1)
}
