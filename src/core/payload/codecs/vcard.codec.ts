import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
  type PayloadIssue,
} from "@/core/payload/payload";
import { normalizeGlobalPhoneNumber } from "@/core/payload/phone-number";
import { urlCodec } from "@/core/payload/codecs/url.codec";

export type VCardPayloadInput = Readonly<{
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
}>;

export type VCardPayloadData = Readonly<{
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
}>;

const MAX_NAME_LENGTH = 200;
const MAX_TEXT_FIELD_LENGTH = 300;
const MAX_EMAIL_LENGTH = 320;
const encoder = new TextEncoder();
const COMMON_LOCAL_PART = /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/;

function readInput(input: unknown): VCardPayloadInput {
  if (typeof input !== "object" || input === null) {
    throw new PayloadValidationError("Enter contact details.", [
      { field: "firstName", message: "Enter at least a first or last name." },
    ]);
  }

  const record = input as Record<string, unknown>;
  const read = (key: keyof VCardPayloadInput) =>
    typeof record[key] === "string" ? (record[key] as string) : "";

  return {
    firstName: read("firstName"),
    lastName: read("lastName"),
    organization: read("organization"),
    title: read("title"),
    phone: read("phone"),
    email: read("email"),
    url: read("url"),
  };
}

function normalizeEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH) return null;

  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === trimmed.length - 1 || trimmed.indexOf("@") !== atIndex) {
    return null;
  }

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (
    !COMMON_LOCAL_PART.test(local) ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    /[:/?#]/.test(domain)
  ) {
    return null;
  }

  try {
    const hostname = new URL(`https://${domain}`).hostname;
    return hostname && !hostname.includes(":") ? `${local}@${hostname}` : null;
  } catch {
    return null;
  }
}

function parseInput(input: unknown): VCardPayloadData {
  const raw = readInput(input);
  const issues: PayloadIssue[] = [];
  const firstName = raw.firstName.trim();
  const lastName = raw.lastName.trim();
  const organization = raw.organization.trim();
  const title = raw.title.trim();
  let phone = "";
  let email = "";
  let url = "";

  if (!firstName && !lastName) {
    issues.push({ field: "firstName", message: "Enter at least a first or last name." });
  }
  if (firstName.length > MAX_NAME_LENGTH) {
    issues.push({
      field: "firstName",
      message: `Keep the first name under ${MAX_NAME_LENGTH} characters.`,
    });
  }
  if (lastName.length > MAX_NAME_LENGTH) {
    issues.push({
      field: "lastName",
      message: `Keep the last name under ${MAX_NAME_LENGTH} characters.`,
    });
  }
  if (organization.length > MAX_TEXT_FIELD_LENGTH) {
    issues.push({ field: "organization", message: "The organization name is too long." });
  }
  if (title.length > MAX_TEXT_FIELD_LENGTH) {
    issues.push({ field: "title", message: "The job title is too long." });
  }

  if (raw.phone.trim()) {
    try {
      phone = normalizeGlobalPhoneNumber(raw.phone, "phone");
    } catch (error) {
      if (error instanceof PayloadValidationError) issues.push(...error.issues);
    }
  }

  if (raw.email.trim()) {
    const normalized = normalizeEmail(raw.email);
    if (!normalized) {
      issues.push({
        field: "email",
        message: "Enter a common email address such as name@example.com.",
      });
    } else {
      email = normalized;
    }
  }

  if (raw.url.trim()) {
    try {
      url = urlCodec.parseInput(raw.url).url;
    } catch {
      issues.push({ field: "url", message: "Enter a valid HTTP or HTTPS website." });
    }
  }

  if (issues.length > 0) {
    throw new PayloadValidationError("Check the contact details.", issues);
  }

  return { firstName, lastName, organization, title, phone, email, url };
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function unescapeText(value: string): string {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== "\\" || index === value.length - 1) {
      output += char;
      continue;
    }

    const next = value[index + 1];
    index += 1;
    output += next === "n" || next === "N" ? "\n" : next;
  }
  return output;
}

function splitEscaped(value: string, separator: string): string[] {
  const parts: string[] = [];
  let current = "";
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      current += `\\${char}`;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === separator) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (escaped) current += "\\";
  parts.push(current);
  return parts;
}

function foldContentLine(line: string): string {
  const segments: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const char of line) {
    const charBytes = encoder.encode(char).byteLength;
    if (current && currentBytes + charBytes > limit) {
      segments.push(current);
      current = char;
      currentBytes = charBytes;
      limit = 74;
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }

  if (current || segments.length === 0) segments.push(current);
  return segments.map((segment, index) => (index === 0 ? segment : ` ${segment}`)).join("\r\n");
}

function unfoldLines(payload: string): string[] {
  return payload.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

export const vcardCodec: PayloadCodec<VCardPayloadData> = {
  id: "vcard",
  parseInput,
  encode(data) {
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
    const lines = [
      "BEGIN:VCARD",
      "VERSION:4.0",
      `FN:${escapeText(fullName)}`,
      `N:${escapeText(data.lastName)};${escapeText(data.firstName)};;;`,
      ...(data.organization ? [`ORG:${escapeText(data.organization)}`] : []),
      ...(data.title ? [`TITLE:${escapeText(data.title)}`] : []),
      ...(data.phone ? [`TEL;TYPE=cell;VALUE=uri:tel:${data.phone}`] : []),
      ...(data.email ? [`EMAIL:${data.email}`] : []),
      ...(data.url ? [`URL:${data.url}`] : []),
      "END:VCARD",
    ];

    return `${lines.map(foldContentLine).join("\r\n")}\r\n`;
  },
  inspect(payload) {
    try {
      const lines = unfoldLines(payload.trim());
      if (
        lines[0]?.toUpperCase() !== "BEGIN:VCARD" ||
        lines.at(-1)?.toUpperCase() !== "END:VCARD"
      ) {
        return null;
      }

      let version = "";
      let n = "";
      let organization = "";
      let title = "";
      let phone = "";
      let email = "";
      let url = "";

      for (const line of lines.slice(1, -1)) {
        const colon = line.indexOf(":");
        if (colon < 0) continue;
        const left = line.slice(0, colon);
        const value = line.slice(colon + 1);
        const name = left.split(";", 1)[0]?.toUpperCase();

        if (name === "VERSION") version = value;
        else if (name === "N") n = value;
        else if (name === "ORG") organization = unescapeText(value);
        else if (name === "TITLE") title = unescapeText(value);
        else if (name === "TEL")
          phone = value.toLowerCase().startsWith("tel:") ? value.slice(4) : value;
        else if (name === "EMAIL") email = value;
        else if (name === "URL") url = value;
      }

      if (version !== "4.0" || !n) return null;
      const components = splitEscaped(n, ";");
      const data = parseInput({
        lastName: unescapeText(components[0] ?? ""),
        firstName: unescapeText(components[1] ?? ""),
        organization,
        title,
        phone,
        email,
        url,
      });
      return { id: "vcard", data };
    } catch {
      return null;
    }
  },
};

export const vcardPayloadDefinition: PayloadDefinition<VCardPayloadData> = {
  id: "vcard",
  label: "Contact",
  description: "Create a standards-based vCard 4.0 contact.",
  category: "popular",
  sampleInput: {
    firstName: "Avery",
    lastName: "Morgan",
    organization: "Qraft Studio",
    title: "Creative Director",
    phone: "+1 202 555 0123",
    email: "avery@example.com",
    url: "https://example.com",
  } satisfies VCardPayloadInput,
  codec: vcardCodec,
};
