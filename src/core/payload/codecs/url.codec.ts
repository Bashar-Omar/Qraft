import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
} from "@/core/payload/payload";

export type UrlPayloadData = Readonly<{
  url: string;
  normalizedFromMissingScheme: boolean;
}>;

const MAX_URL_LENGTH = 2048;
const allowedProtocols = new Set(["http:", "https:"]);

function readUrlInput(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "url" in input &&
    typeof input.url === "string"
  ) {
    return input.url;
  }

  throw new PayloadValidationError("Enter a web address.", [
    { field: "url", message: "A URL is required." },
  ]);
}

function normalizeUrl(value: string): UrlPayloadData {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new PayloadValidationError("Enter a web address.", [
      { field: "url", message: "A URL is required." },
    ]);
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    throw new PayloadValidationError("This URL is too long for the curated URL editor.", [
      {
        field: "url",
        message: `Keep the URL under ${MAX_URL_LENGTH.toLocaleString()} characters.`,
      },
    ]);
  }

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new PayloadValidationError("Enter a valid web address.", [
      { field: "url", message: "The address could not be parsed as a URL." },
    ]);
  }

  if (!allowedProtocols.has(parsed.protocol)) {
    throw new PayloadValidationError("Use an HTTP or HTTPS address in the curated URL editor.", [
      {
        field: "url",
        message: "Only http:// and https:// URLs are supported here. Raw protocols arrive later.",
      },
    ]);
  }

  if (!parsed.hostname) {
    throw new PayloadValidationError("Enter a URL with a host name.", [
      { field: "url", message: "A host name is required." },
    ]);
  }

  return {
    url: candidate,
    normalizedFromMissingScheme: !hasScheme,
  };
}

export const urlCodec: PayloadCodec<UrlPayloadData> = {
  id: "url",
  parseInput(input) {
    return normalizeUrl(readUrlInput(input));
  },
  encode(data) {
    return data.url;
  },
  inspect(payload) {
    try {
      const data = normalizeUrl(payload);
      return { id: "url", data };
    } catch {
      return null;
    }
  },
};

export const urlPayloadDefinition: PayloadDefinition<UrlPayloadData> = {
  id: "url",
  label: "URL",
  description: "Open a website or web application.",
  category: "popular",
  sampleInput: "https://example.com",
  codec: urlCodec,
};
