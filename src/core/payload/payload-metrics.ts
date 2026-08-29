export type PayloadTextMetrics = Readonly<{
  utf8Bytes: number;
  codePoints: number;
  lineBreaks: number;
  nonWhitespaceControlCharacters: number;
}>;

const utf8Encoder = new TextEncoder();

export function measurePayloadText(value: string): PayloadTextMetrics {
  const lineBreaks = value.match(/\r\n|\r|\n/g)?.length ?? 0;
  let controls = 0;

  for (const char of value) {
    if (char === "\n" || char === "\r" || char === "\t") {
      continue;
    }

    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint <= 0x1f || codePoint === 0x7f) {
      controls += 1;
    }
  }

  return {
    utf8Bytes: utf8Encoder.encode(value).byteLength,
    codePoints: Array.from(value).length,
    lineBreaks,
    nonWhitespaceControlCharacters: controls,
  };
}
