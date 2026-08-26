import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
  type PayloadIssue,
} from "@/core/payload/payload";

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type WifiPayloadInput = Readonly<{
  ssid: string;
  security: WifiSecurity;
  password: string;
  hidden: boolean;
}>;

export type WifiPayloadData = WifiPayloadInput;

const MAX_SSID_BYTES = 32;
const MAX_PASSWORD_LENGTH = 128;
const WIFI_ESCAPED_CHARACTERS = new Set(["\\", ";", ",", '"', ":"]);

function readWifiInput(input: unknown): WifiPayloadInput {
  if (typeof input !== "object" || input === null) {
    throw new PayloadValidationError("Enter Wi-Fi details.", [
      { field: "ssid", message: "A network name is required." },
    ]);
  }

  const security =
    "security" in input &&
    (input.security === "WPA" || input.security === "WEP" || input.security === "nopass")
      ? input.security
      : "WPA";

  return {
    ssid: "ssid" in input && typeof input.ssid === "string" ? input.ssid : "",
    security,
    password: "password" in input && typeof input.password === "string" ? input.password : "",
    hidden: "hidden" in input && typeof input.hidden === "boolean" ? input.hidden : false,
  };
}

export function escapeWifiValue(value: string): string {
  return value.replace(/[\\;,":]/g, (character) => `\\${character}`);
}

function unescapeWifiValue(value: string): string {
  let result = "";

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === "\\" && index + 1 < value.length) {
      const next = value[index + 1];

      if (WIFI_ESCAPED_CHARACTERS.has(next)) {
        result += next;
        index += 1;
        continue;
      }
    }

    result += character;
  }

  return result;
}

function splitWifiFields(value: string): string[] {
  const fields: string[] = [];
  let current = "";
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      current += `\\${character}`;
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (character === ";") {
      fields.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  if (escaped) {
    current += "\\";
  }

  if (current) {
    fields.push(current);
  }

  return fields;
}

function parseWifiInput(input: unknown): WifiPayloadData {
  const raw = readWifiInput(input);
  const issues: PayloadIssue[] = [];
  const ssidBytes = new TextEncoder().encode(raw.ssid).length;

  if (!raw.ssid.trim()) {
    issues.push({ field: "ssid", message: "A network name (SSID) is required." });
  } else if (ssidBytes > MAX_SSID_BYTES) {
    issues.push({
      field: "ssid",
      message: `The SSID must fit within ${MAX_SSID_BYTES} UTF-8 bytes.`,
    });
  }

  if (raw.security !== "nopass" && !raw.password) {
    issues.push({ field: "password", message: "A password is required for a protected network." });
  } else if (raw.password.length > MAX_PASSWORD_LENGTH) {
    issues.push({
      field: "password",
      message: `Keep the password under ${MAX_PASSWORD_LENGTH} characters.`,
    });
  }

  if (issues.length > 0) {
    throw new PayloadValidationError("Check the Wi-Fi details.", issues);
  }

  return {
    ssid: raw.ssid,
    security: raw.security,
    password: raw.security === "nopass" ? "" : raw.password,
    hidden: raw.hidden,
  };
}

function parseWifiPayload(payload: string): WifiPayloadData | null {
  if (!payload.startsWith("WIFI:")) {
    return null;
  }

  const fields = new Map<string, string>();

  for (const field of splitWifiFields(payload.slice("WIFI:".length))) {
    if (!field) {
      continue;
    }

    const separatorIndex = field.indexOf(":");

    if (separatorIndex <= 0) {
      continue;
    }

    fields.set(field.slice(0, separatorIndex), unescapeWifiValue(field.slice(separatorIndex + 1)));
  }

  const securityValue = fields.get("T") ?? "nopass";
  const security: WifiSecurity | null =
    securityValue === "WPA" || securityValue === "WEP" || securityValue === "nopass"
      ? securityValue
      : null;

  if (!security) {
    return null;
  }

  try {
    return parseWifiInput({
      ssid: fields.get("S") ?? "",
      security,
      password: fields.get("P") ?? "",
      hidden: fields.get("H")?.toLowerCase() === "true",
    });
  } catch {
    return null;
  }
}

export const wifiCodec: PayloadCodec<WifiPayloadData> = {
  id: "wifi",
  parseInput: parseWifiInput,
  encode(data) {
    const fields = [`T:${data.security}`, `S:${escapeWifiValue(data.ssid)}`];

    if (data.security !== "nopass") {
      fields.push(`P:${escapeWifiValue(data.password)}`);
    }

    if (data.hidden) {
      fields.push("H:true");
    }

    return `WIFI:${fields.join(";")};;`;
  },
  inspect(payload) {
    const data = parseWifiPayload(payload);
    return data ? { id: "wifi", data } : null;
  },
};

export const wifiPayloadDefinition: PayloadDefinition<WifiPayloadData> = {
  id: "wifi",
  label: "Wi-Fi",
  description: "Join a WPA/WPA2, WEP or open network.",
  category: "popular",
  sampleInput: {
    ssid: "Qraft Lab",
    security: "WPA",
    password: "example-only",
    hidden: false,
  } satisfies WifiPayloadInput,
  codec: wifiCodec,
};
