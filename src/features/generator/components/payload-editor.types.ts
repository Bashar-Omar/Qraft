import type { PayloadIssue } from "@/core/payload/payload";

export type PayloadEditorProps = Readonly<{
  value: unknown;
  issues?: readonly PayloadIssue[];
  onChange(value: unknown): void;
}>;

export function getPayloadFieldIssue(
  issues: readonly PayloadIssue[] | undefined,
  field: string,
): string | undefined {
  return issues?.find((issue) => issue.field === field)?.message;
}
