/**
 * Helpers for blog post detail layout (TOC sections, hero title styling).
 */

const MAX_TOC = 5
const TOC_LABEL_LEN = 52

/** Split plain-text body into sections for TOC + anchors (double newlines). */
export function splitBlogBodySections(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** Short label for TOC from a paragraph. */
export function tocLabelFromParagraph(text: string, fallback: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (!oneLine) return fallback
  if (oneLine.length <= TOC_LABEL_LEN) return oneLine
  return `${oneLine.slice(0, TOC_LABEL_LEN).trim()}…`
}

export function getBlogTocEntries(
  body: string,
  fallbackLabel: (index: number) => string
): { id: string; label: string }[] {
  const sections = splitBlogBodySections(body)
  return sections.slice(0, MAX_TOC).map((text, i) => ({
    id: `section-${i}`,
    label: tocLabelFromParagraph(text, fallbackLabel(i))
  }))
}

export type HeroTitleParts =
  | { kind: 'split'; before: string; accent: string }
  | { kind: 'full'; text: string }

/**
 * Prefer a colon split for a two-tone hero title; otherwise single line.
 */
export function splitTitleForHero(title: string): HeroTitleParts {
  const idx = title.indexOf(': ')
  if (idx > 0 && idx < title.length - 2) {
    return {
      kind: 'split',
      before: `${title.slice(0, idx)}:`,
      accent: title.slice(idx + 2).trim()
    }
  }
  return { kind: 'full', text: title }
}
