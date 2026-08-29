import type { QrErrorCorrectionLevel, SymbologyId } from "@/core/code/render";
import type { PayloadIssue } from "@/core/payload/payload";

export type PayloadEditorRenderContext = Readonly<{
  symbology: SymbologyId;
  qrErrorCorrectionLevel: QrErrorCorrectionLevel;
}>;

export type PayloadEditorProps = Readonly<{
  value: unknown;
  issues?: readonly PayloadIssue[];
  renderContext: PayloadEditorRenderContext;
  onChange(value: unknown): void;
}>;

export function getPayloadFieldIssue(
  issues: readonly PayloadIssue[] | undefined,
  field: string,
): string | undefined {
  return issues?.find((issue) => issue.field === field)?.message;
}
