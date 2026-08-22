/**
 * Serialises structured data for injection into a <script type="application/ld+json"> tag.
 *
 * Product titles/descriptions can come from user-editable sources (the local admin panel and
 * imported JSON), so a raw JSON.stringify would allow a `</script>` sequence to break out of the
 * script element. Escaping the HTML-significant characters (plus the JS line separators U+2028 /
 * U+2029) as JSON unicode escapes keeps the payload identical for parsers while making a script
 * breakout impossible.
 */
const UNSAFE = new RegExp("[<>&" + String.fromCharCode(0x2028, 0x2029) + "]", "g");

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
}
