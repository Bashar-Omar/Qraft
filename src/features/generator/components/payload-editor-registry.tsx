import type { ComponentType } from "react";

import type { PayloadId } from "@/core/payload/payload";
import { TextEditor } from "@/features/generator/components/text-editor";
import type { PayloadEditorProps } from "@/features/generator/components/payload-editor.types";
import { UrlEditor } from "@/features/generator/components/url-editor";

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

const payloadEditors: Readonly<Record<PayloadId, PayloadEditorRegistration>> = {
  url: {
    component: UrlEditor,
    getNotice: getUrlNotice,
  },
  text: {
    component: TextEditor,
  },
};

export function getPayloadEditorRegistration(payloadId: PayloadId): PayloadEditorRegistration {
  return payloadEditors[payloadId];
}
