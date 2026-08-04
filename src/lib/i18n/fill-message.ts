/** Replace `{key}` segments in a message template (no nested braces). */
export function fillMessage(template: string, replacements: Record<string, string>): string {
  let out = template
  for (const [key, value] of Object.entries(replacements)) {
    out = out.split(`{${key}}`).join(value)
  }
  return out
}
