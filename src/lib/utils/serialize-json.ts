/**
 * Safely serialize a JSON object for embedding inside a `<script>` tag
 * (e.g. `application/ld+json`). `JSON.stringify` does not escape `</script>`,
 * so a `</` sequence in a string value (such as a scraped fabric title) can
 * break out of the script block and inject arbitrary markup. Escaping `<`,
 * `>`, `&` and the line separators U+2028/U+2029 prevents that breakout while
 * keeping the serialized output valid JSON.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}