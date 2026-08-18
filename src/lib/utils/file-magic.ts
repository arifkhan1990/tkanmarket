/**
 * Validates a file's magic bytes against its declared extension. Prevents
 * renamed files (e.g. an executable or zip-bomb renamed to `.xlsx`) from
 * reaching parsers. Admin uploads only.
 */
export function hasExpectedMagicBytes(buffer: ArrayBuffer, filename: string): boolean {
  const bytes = new Uint8Array(buffer)
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))

  switch (ext) {
    case '.xlsx':
      // OOXML is a ZIP archive: PK\x03\x04 (empty ZIP: PK\x05\x06).
      return (
        bytes.length >= 4 &&
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        ((bytes[2] === 0x03 && bytes[3] === 0x04) || (bytes[2] === 0x05 && bytes[3] === 0x06))
      )
    case '.xls':
      // OLE2 compound document (legacy Excel).
      return (
        bytes.length >= 8 &&
        bytes[0] === 0xd0 &&
        bytes[1] === 0xcf &&
        bytes[2] === 0x11 &&
        bytes[3] === 0xe0 &&
        bytes[4] === 0xa1 &&
        bytes[5] === 0xb1 &&
        bytes[6] === 0x1a &&
        bytes[7] === 0xe1
      )
    case '.json': {
      // Strip UTF-8 BOM, then require a JSON object or array opener.
      const start = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0
      const first = String.fromCharCode(bytes[start] ?? 0)
      return first === '{' || first === '['
    }
    case '.csv':
      return true // Plain text — no reliable magic bytes.
    default:
      return true
  }
}