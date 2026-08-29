import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
} from "@/core/payload/payload";

export type AppLinkStrategy = "https" | "custom-scheme";

export type AppLinkPayloadInput = Readonly<{
  strategy: AppLinkStrategy;
  destination: string;
}>;

export type AppLinkPayloadData = Readonly<{
  strategy: AppLinkStrategy;
  destination: string;
  scheme: string;
  host?: string;
}>;

const MAX_APP_LINK_LENGTH = 2048;
const SCHEME_PATTERN = /^([A-Za-z][A-Za-z0-9+.-]*):/;
const BLOCKED_CUSTOM_SCHEMES = new Set([
  "about",
  "blob",
  "data",
  "file",
  "ftp",
  "ftps",
  "geo",
  "http",
  "https",
  "intent",
  "javascript",
  "mailto",
  "otpauth",
  "sms",
  "tel",
  "urn",
  "vbscript",
  "wifi",
  "ws",
  "wss",
]);

function validationError(message: string, field: keyof AppLinkPayloadInput, issue: string) {
  return new PayloadValidationError(message, [{ field, message: issue }]);
}

function readInput(input: unknown): AppLinkPayloadInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw validationError(
      "Choose an app-link strategy and enter a destination.",
      "destination",
      "An app-link destination is required.",
    );
  }

  const record = input as Record<string, unknown>;
  const strategy = record.strategy;
  const destination = record.destination;

  if (strategy !== "https" && strategy !== "custom-scheme") {
    throw validationError(
      "Choose how this app link should be encoded.",
      "strategy",
      "Choose HTTPS app/universal link or Custom app URI scheme.",
    );
  }

  if (typeof destination !== "string") {
    throw validationError(
      "Enter an app-link destination.",
      "destination",
      "An app-link destination is required.",
    );
  }

  return { strategy, destination };
}

function normalizeDestination(value: string): string {
  const destination = value.trim();

  if (!destination) {
    throw validationError(
      "Enter an app-link destination.",
      "destination",
      "An app-link destination is required.",
    );
  }

  if (destination.length > MAX_APP_LINK_LENGTH) {
    throw validationError(
      "This app link is too long for the curated helper.",
      "destination",
      `Keep the destination under ${MAX_APP_LINK_LENGTH.toLocaleString()} characters.`,
    );
  }

  if (/[\u0000-\u0020\u007f]/.test(destination)) {
    throw validationError(
      "App-link destinations cannot contain raw spaces or control characters.",
      "destination",
      "Percent-encode spaces or control characters before using this destination.",
    );
  }

  return destination;
}

function parseHttpsDestination(destination: string): AppLinkPayloadData {
  let parsed: URL;

  try {
    parsed = new URL(destination);
  } catch {
    throw validationError(
      "Enter a valid HTTPS app/universal link.",
      "destination",
      "The destination could not be parsed as an HTTPS URL.",
    );
  }

  if (parsed.protocol !== "https:") {
    throw validationError(
      "HTTPS is required for the recommended app-link strategy.",
      "destination",
      "Use an https:// destination, or choose Custom app URI scheme for an app-owned scheme.",
    );
  }

  if (!parsed.hostname) {
    throw validationError(
      "Enter an HTTPS destination with a host name.",
      "destination",
      "A host name is required.",
    );
  }

  if (parsed.username || parsed.password) {
    throw validationError(
      "Credentials are not supported in curated app links.",
      "destination",
      "Remove embedded username/password credentials from the destination.",
    );
  }

  return {
    strategy: "https",
    destination,
    scheme: "https",
    host: parsed.hostname,
  };
}

function parseCustomDestination(destination: string): AppLinkPayloadData {
  const match = SCHEME_PATTERN.exec(destination);

  if (!match) {
    throw validationError(
      "Enter an absolute custom app URI.",
      "destination",
      "A custom app URI must begin with an RFC 3986 scheme such as myapp:// or myapp:.",
    );
  }

  const scheme = match[1].toLowerCase();
  const remainder = destination.slice(match[0].length);

  const uriPunctuation = "-._~:/?#[]@!$&'()*+,;=%";
  const hasOnlyUriCharacters = [...destination].every(
    (character) => /^[A-Za-z0-9]$/.test(character) || uriPunctuation.includes(character),
  );

  if (!hasOnlyUriCharacters) {
    throw validationError(
      "Custom app URIs must use RFC 3986 URI characters.",
      "destination",
      "Percent-encode Unicode or other characters that are not valid in a URI.",
    );
  }

  if (/%(?![0-9A-Fa-f]{2})/.test(destination)) {
    throw validationError(
      "Custom app URIs contain an invalid percent escape.",
      "destination",
      "Every percent sign (%) must be followed by two hexadecimal digits.",
    );
  }

  if (!remainder) {
    throw validationError(
      "Enter a destination after the custom scheme.",
      "destination",
      "The custom URI needs content after the scheme separator (:).",
    );
  }

  if (BLOCKED_CUSTOM_SCHEMES.has(scheme)) {
    throw validationError(
      "Use the dedicated Qraft editor for this URI scheme.",
      "destination",
      `${scheme}: is not accepted as an app-owned custom scheme in this helper.`,
    );
  }

  return {
    strategy: "custom-scheme",
    destination,
    scheme,
  };
}

function parseAppLink(input: AppLinkPayloadInput): AppLinkPayloadData {
  const destination = normalizeDestination(input.destination);

  return input.strategy === "https"
    ? parseHttpsDestination(destination)
    : parseCustomDestination(destination);
}

export const appLinkCodec: PayloadCodec<AppLinkPayloadData> = {
  id: "app",
  parseInput(input) {
    return parseAppLink(readInput(input));
  },
  encode(data) {
    return data.destination;
  },
  inspect(payload) {
    const destination = payload.trim();
    if (!destination || destination !== payload) return null;

    try {
      if (/^https:/i.test(destination)) {
        const data = parseHttpsDestination(normalizeDestination(destination));
        return { id: "app", data };
      }

      const data = parseCustomDestination(normalizeDestination(destination));
      return { id: "app", data };
    } catch {
      return null;
    }
  },
};

export const appLinkPayloadDefinition: PayloadDefinition<AppLinkPayloadData> = {
  id: "app",
  label: "App Link",
  description: "Open app content through HTTPS association or an app-owned URI scheme.",
  category: "general",
  sampleInput: {
    strategy: "https",
    destination: "https://example.com/app/products/42",
  } satisfies AppLinkPayloadInput,
  codec: appLinkCodec,
};
