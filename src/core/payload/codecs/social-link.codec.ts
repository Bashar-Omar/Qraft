import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
} from "@/core/payload/payload";

export const SOCIAL_PLATFORM_IDS = [
  "x",
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "facebook",
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORM_IDS)[number];

export type SocialLinkPayloadInput = Readonly<{
  platform: SocialPlatformId;
  target: string;
}>;

export type SocialLinkPayloadData = Readonly<{
  platform: SocialPlatformId;
  destination: string;
  host: string;
  source: "identifier" | "url";
}>;

const MAX_SOCIAL_LINK_LENGTH = 2048;
const MAX_IDENTIFIER_LENGTH = 100;

const SOCIAL_PLATFORM_ID_SET = new Set<SocialPlatformId>(SOCIAL_PLATFORM_IDS);

function validationError(message: string, field: keyof SocialLinkPayloadInput, issue: string) {
  return new PayloadValidationError(message, [{ field, message: issue }]);
}

function readInput(input: unknown): SocialLinkPayloadInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw validationError(
      "Choose a social platform and enter a profile or page target.",
      "target",
      "A social profile/page target is required.",
    );
  }

  const record = input as Record<string, unknown>;
  const platform = record.platform;
  const target = record.target;

  if (typeof platform !== "string" || !SOCIAL_PLATFORM_ID_SET.has(platform as SocialPlatformId)) {
    throw validationError(
      "Choose a supported social platform.",
      "platform",
      "Choose X, Instagram, TikTok, YouTube, LinkedIn or Facebook.",
    );
  }

  if (typeof target !== "string") {
    throw validationError(
      "Enter a social profile or page target.",
      "target",
      "A handle, identifier or full HTTPS URL is required.",
    );
  }

  return { platform: platform as SocialPlatformId, target };
}

function normalizeTarget(value: string): string {
  const target = value.trim();

  if (!target) {
    throw validationError(
      "Enter a social profile or page target.",
      "target",
      "A handle, identifier or full HTTPS URL is required.",
    );
  }

  if (target.length > MAX_SOCIAL_LINK_LENGTH) {
    throw validationError(
      "This social link is too long for the curated helper.",
      "target",
      `Keep the target under ${MAX_SOCIAL_LINK_LENGTH.toLocaleString()} characters.`,
    );
  }

  if (/[\u0000-\u0020\u007f]/.test(target)) {
    throw validationError(
      "Social-link targets cannot contain control characters.",
      "target",
      "Remove control characters from the target.",
    );
  }

  return target;
}

function hostMatchesPlatform(platform: SocialPlatformId, hostname: string): boolean {
  const host = hostname.toLowerCase();

  switch (platform) {
    case "x":
      return ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(host);
    case "instagram":
      return ["instagram.com", "www.instagram.com"].includes(host);
    case "tiktok":
      return ["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(host);
    case "youtube":
      return ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host);
    case "linkedin":
      return host === "linkedin.com" || host.endsWith(".linkedin.com");
    case "facebook":
      return host === "facebook.com" || host.endsWith(".facebook.com");
  }
}

function platformFromHost(hostname: string): SocialPlatformId | null {
  for (const platform of SOCIAL_PLATFORM_IDS) {
    if (hostMatchesPlatform(platform, hostname)) return platform;
  }
  return null;
}

function parseFullSocialUrl(
  platform: SocialPlatformId | null,
  destination: string,
): SocialLinkPayloadData {
  let parsed: URL;

  try {
    parsed = new URL(destination);
  } catch {
    throw validationError(
      "Enter a valid social HTTPS URL.",
      "target",
      "The social destination could not be parsed as a URL.",
    );
  }

  if (parsed.protocol !== "https:") {
    throw validationError(
      "Social links use HTTPS in the curated helper.",
      "target",
      "Use an https:// profile/page URL.",
    );
  }

  if (!parsed.hostname || parsed.username || parsed.password || parsed.port) {
    throw validationError(
      "Enter a normal public social HTTPS URL.",
      "target",
      "Credentials and custom ports are not supported in curated social links.",
    );
  }

  if (parsed.pathname === "/") {
    throw validationError(
      "Enter a profile, page or channel destination instead of a platform homepage.",
      "target",
      "The URL needs a profile/page/channel path or identifier.",
    );
  }

  const detectedPlatform = platformFromHost(parsed.hostname);
  if (!detectedPlatform) {
    throw validationError(
      "Use a supported social platform URL.",
      "target",
      "This host is not one of the social platforms supported by the curated helper.",
    );
  }

  if (platform && detectedPlatform !== platform) {
    throw validationError(
      "The selected platform does not match this URL.",
      "target",
      `Choose ${detectedPlatform} or enter a URL for the selected platform.`,
    );
  }

  return {
    platform: detectedPlatform,
    destination,
    host: parsed.hostname.toLowerCase(),
    source: "url",
  };
}

function readIdentifier(value: string): string {
  const identifier = value.startsWith("@") ? value.slice(1) : value;

  if (!identifier) {
    throw validationError(
      "Enter a social handle or identifier.",
      "target",
      "The handle/identifier cannot be empty.",
    );
  }

  if (identifier.length > MAX_IDENTIFIER_LENGTH) {
    throw validationError(
      "This social identifier is too long for the curated helper.",
      "target",
      `Keep identifiers under ${MAX_IDENTIFIER_LENGTH.toLocaleString()} characters, or paste the full profile URL instead.`,
    );
  }

  if (/\s|[/?#\\]/u.test(identifier)) {
    throw validationError(
      "Enter only the profile handle/identifier, or paste the full HTTPS URL.",
      "target",
      "Handles/identifiers cannot contain spaces, slashes, query strings or fragments.",
    );
  }

  return identifier;
}

function assertPlatformIdentifier(platform: SocialPlatformId, identifier: string): void {
  if (platform === "x" && !/^[A-Za-z0-9_]{5,15}$/.test(identifier)) {
    throw validationError(
      "Enter a valid X username.",
      "target",
      "X usernames are 5–15 letters, numbers or underscores. Omit the leading @ if you prefer.",
    );
  }

  if (platform === "facebook" && !/^[A-Za-z0-9.]+$/.test(identifier)) {
    throw validationError(
      "Enter a Facebook username or paste the full profile/page URL.",
      "target",
      "Facebook usernames use letters, numbers and periods in this helper.",
    );
  }

  if ((platform === "instagram" || platform === "tiktok") && !/^[A-Za-z0-9._]+$/.test(identifier)) {
    throw validationError(
      `Enter a ${platform === "instagram" ? "Instagram" : "TikTok"} username or paste the full profile URL.`,
      "target",
      "Use letters, numbers, periods or underscores for a handle in this helper.",
    );
  }

  if (platform === "linkedin" && !/^[A-Za-z0-9-]+$/.test(identifier)) {
    throw validationError(
      "Enter a LinkedIn public-profile slug or paste the full profile/page URL.",
      "target",
      "LinkedIn shorthand accepts letters, numbers and hyphens; paste the full URL for other LinkedIn page forms.",
    );
  }
}

function encodeIdentifier(identifier: string): string {
  try {
    return encodeURIComponent(identifier);
  } catch {
    throw validationError(
      "This handle cannot be encoded as a URL safely.",
      "target",
      "Use a valid Unicode handle or paste the full HTTPS profile URL.",
    );
  }
}

function buildProfileUrl(platform: SocialPlatformId, rawIdentifier: string): SocialLinkPayloadData {
  const identifier = readIdentifier(rawIdentifier);
  assertPlatformIdentifier(platform, identifier);
  const encoded = encodeIdentifier(identifier);

  const destination = (() => {
    switch (platform) {
      case "x":
        return `https://x.com/${encoded}`;
      case "instagram":
        return `https://www.instagram.com/${encoded}/`;
      case "tiktok":
        return `https://www.tiktok.com/@${encoded}`;
      case "youtube":
        return `https://www.youtube.com/@${encoded}`;
      case "linkedin":
        return `https://www.linkedin.com/in/${encoded}`;
      case "facebook":
        return `https://www.facebook.com/${encoded}`;
    }
  })();

  const parsed = new URL(destination);
  return {
    platform,
    destination,
    host: parsed.hostname,
    source: "identifier",
  };
}

function parseSocialLink(input: SocialLinkPayloadInput): SocialLinkPayloadData {
  const target = normalizeTarget(input.target);

  if (/^[a-z][a-z\d+.-]*:/i.test(target)) {
    return parseFullSocialUrl(input.platform, target);
  }

  return buildProfileUrl(input.platform, target);
}

export const socialLinkCodec: PayloadCodec<SocialLinkPayloadData> = {
  id: "social",
  parseInput(input) {
    return parseSocialLink(readInput(input));
  },
  encode(data) {
    return data.destination;
  },
  inspect(payload) {
    if (!payload || payload.trim() !== payload || !/^https:/i.test(payload)) return null;

    try {
      const data = parseFullSocialUrl(null, normalizeTarget(payload));
      return { id: "social", data };
    } catch {
      return null;
    }
  },
};

export const socialLinkPayloadDefinition: PayloadDefinition<SocialLinkPayloadData> = {
  id: "social",
  label: "Social Link",
  description: "Open a social profile, page or channel through a curated HTTPS link.",
  category: "general",
  sampleInput: {
    platform: "x",
    target: "qraftdemo",
  } satisfies SocialLinkPayloadInput,
  codec: socialLinkCodec,
};
