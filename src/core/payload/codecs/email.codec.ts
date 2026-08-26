import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
  type PayloadIssue,
} from "@/core/payload/payload";

export type EmailPayloadInput = Readonly<{
  recipients: string;
  subject: string;
  body: string;
}>;

export type EmailPayloadData = Readonly<{
  recipients: readonly string[];
  subject: string;
  body: string;
}>;

const MAX_RECIPIENTS = 10;
const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 5_000;
const COMMON_LOCAL_PART = /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/;

function readEmailInput(input: unknown): EmailPayloadInput {
  if (typeof input !== "object" || input === null) {
    throw new PayloadValidationError("Enter email details.", [
      { field: "recipients", message: "At least one recipient is required." },
    ]);
  }

  const recipients =
    "recipients" in input && typeof input.recipients === "string" ? input.recipients : "";
  const subject = "subject" in input && typeof input.subject === "string" ? input.subject : "";
  const body = "body" in input && typeof input.body === "string" ? input.body : "";

  return { recipients, subject, body };
}

function normalizeMailbox(mailbox: string): string | null {
  const trimmed = mailbox.trim();
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

    if (!hostname || hostname.includes(":")) {
      return null;
    }

    return `${local}@${hostname}`;
  } catch {
    return null;
  }
}

function encodeMailbox(mailbox: string): string {
  const atIndex = mailbox.lastIndexOf("@");
  const local = mailbox.slice(0, atIndex);
  const domain = mailbox.slice(atIndex + 1);
  return `${encodeURIComponent(local)}@${domain}`;
}

function normalizeBodyLineBreaks(body: string): string {
  return body.replace(/\r\n|\r|\n/g, "\r\n");
}

function parseEmailInput(input: unknown): EmailPayloadData {
  const raw = readEmailInput(input);
  const issues: PayloadIssue[] = [];
  const recipientTokens = raw.recipients
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  if (recipientTokens.length === 0) {
    issues.push({ field: "recipients", message: "At least one recipient is required." });
  } else if (recipientTokens.length > MAX_RECIPIENTS) {
    issues.push({
      field: "recipients",
      message: `Use no more than ${MAX_RECIPIENTS} recipients in one QR code.`,
    });
  }

  const recipients = recipientTokens.map(normalizeMailbox);

  if (recipients.some((recipient) => recipient === null)) {
    issues.push({
      field: "recipients",
      message: "Use common mailbox addresses such as name@example.com, separated by commas.",
    });
  }

  if (/\r|\n/.test(raw.subject)) {
    issues.push({ field: "subject", message: "The subject must stay on one line." });
  } else if (raw.subject.length > MAX_SUBJECT_LENGTH) {
    issues.push({
      field: "subject",
      message: `Keep the subject under ${MAX_SUBJECT_LENGTH.toLocaleString()} characters.`,
    });
  }

  if (raw.body.length > MAX_BODY_LENGTH) {
    issues.push({
      field: "body",
      message: `Keep the message under ${MAX_BODY_LENGTH.toLocaleString()} characters.`,
    });
  }

  if (issues.length > 0) {
    throw new PayloadValidationError("Check the email details.", issues);
  }

  return {
    recipients: recipients as string[],
    subject: raw.subject,
    body: raw.body,
  };
}

export const emailCodec: PayloadCodec<EmailPayloadData> = {
  id: "email",
  parseInput: parseEmailInput,
  encode(data) {
    const query: string[] = [];

    if (data.subject) {
      query.push(`subject=${encodeURIComponent(data.subject)}`);
    }

    if (data.body) {
      query.push(`body=${encodeURIComponent(normalizeBodyLineBreaks(data.body))}`);
    }

    const path = data.recipients.map(encodeMailbox).join(",");
    return `mailto:${path}${query.length > 0 ? `?${query.join("&")}` : ""}`;
  },
  inspect(payload) {
    if (!payload.toLowerCase().startsWith("mailto:")) {
      return null;
    }

    try {
      const value = payload.slice("mailto:".length);
      const queryIndex = value.indexOf("?");
      const recipientPart = queryIndex >= 0 ? value.slice(0, queryIndex) : value;
      const queryPart = queryIndex >= 0 ? value.slice(queryIndex + 1) : "";
      const recipients = recipientPart
        .split(",")
        .filter(Boolean)
        .map((recipient) => decodeURIComponent(recipient));
      const params = new URLSearchParams(queryPart);
      const data = parseEmailInput({
        recipients: recipients.join(", "),
        subject: params.get("subject") ?? "",
        body: (params.get("body") ?? "").replace(/\r\n/g, "\n"),
      });

      return { id: "email", data };
    } catch {
      return null;
    }
  },
};

export const emailPayloadDefinition: PayloadDefinition<EmailPayloadData> = {
  id: "email",
  label: "Email",
  description: "Compose an email with recipients, subject and message.",
  category: "popular",
  sampleInput: {
    recipients: "hello@example.com",
    subject: "Hello from Qraft",
    body: "Craft codes that work.",
  } satisfies EmailPayloadInput,
  codec: emailCodec,
};
