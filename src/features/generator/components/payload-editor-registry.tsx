import type { ComponentType } from "react";

import type { PayloadId } from "@/core/payload/payload";
import { EmailEditor } from "@/features/generator/components/email-editor";
import type { PayloadEditorProps } from "@/features/generator/components/payload-editor.types";
import { LocationEditor } from "@/features/generator/components/location-editor";
import { PhoneEditor } from "@/features/generator/components/phone-editor";
import { SmsEditor } from "@/features/generator/components/sms-editor";
import { TextEditor } from "@/features/generator/components/text-editor";
import { UrlEditor } from "@/features/generator/components/url-editor";
import { VCardEditor } from "@/features/generator/components/vcard-editor";
import { WhatsAppEditor } from "@/features/generator/components/whatsapp-editor";
import { WifiEditor } from "@/features/generator/components/wifi-editor";

export type PayloadEditorRegistration = Readonly<{
  component: ComponentType<PayloadEditorProps>;
  getNotice?(parsedData: unknown): string | null;
}>;

function getUrlNotice(parsedData: unknown): string | null {
  if (
    typeof parsedData === "object" &&
    parsedData !== null &&
    "normalizedFromMissingScheme" in parsedData &&
    parsedData.normalizedFromMissingScheme === true
  ) {
    return "Qraft added https:// to produce a complete URL payload.";
  }

  return null;
}

function getWifiNotice(parsedData: unknown): string | null {
  if (typeof parsedData !== "object" || parsedData === null || !("security" in parsedData)) {
    return null;
  }

  const security = parsedData.security;

  if (security === "WEP") {
    return "WEP is a legacy Wi-Fi security mode. Prefer WPA/WPA2 when the network supports it.";
  }

  if (security === "nopass") {
    return "Open networks do not include a password in the generated Wi-Fi payload.";
  }

  return null;
}

const payloadEditors: Readonly<Record<PayloadId, PayloadEditorRegistration>> = {
  url: {
    component: UrlEditor,
    getNotice: getUrlNotice,
  },
  wifi: {
    component: WifiEditor,
    getNotice: getWifiNotice,
  },
  email: {
    component: EmailEditor,
  },
  phone: {
    component: PhoneEditor,
  },
  sms: {
    component: SmsEditor,
  },
  text: {
    component: TextEditor,
  },
  vcard: {
    component: VCardEditor,
  },
  whatsapp: {
    component: WhatsAppEditor,
  },
  location: {
    component: LocationEditor,
  },
};

export function getPayloadEditorRegistration(payloadId: PayloadId): PayloadEditorRegistration {
  return payloadEditors[payloadId];
}
