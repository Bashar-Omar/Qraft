export type PayloadId =
  | "url"
  | "wifi"
  | "email"
  | "phone"
  | "sms"
  | "text"
  | "vcard"
  | "whatsapp"
  | "location"
  | "event"
  | "raw";

export type PayloadCategory = "popular" | "general";

export type PayloadIssue = Readonly<{
  field: string;
  message: string;
}>;

export type PayloadInspection<TData> = Readonly<{
  id: PayloadId;
  data: TData;
}>;

export class PayloadValidationError extends Error {
  readonly issues: readonly PayloadIssue[];

  constructor(message: string, issues: readonly PayloadIssue[]) {
    super(message);
    this.name = "PayloadValidationError";
    this.issues = issues;
  }
}

export interface PayloadCodec<TData> {
  readonly id: PayloadId;
  parseInput(input: unknown): TData;
  encode(data: TData): string;
  inspect(payload: string): PayloadInspection<TData> | null;
}

export interface PayloadDefinition<TData> {
  readonly id: PayloadId;
  readonly label: string;
  readonly description: string;
  readonly category: PayloadCategory;
  readonly sampleInput: unknown;
  readonly createInitialInput?: () => unknown;
  readonly codec: PayloadCodec<TData>;
}

export type RegisteredPayloadDefinition = Readonly<{
  id: PayloadId;
  label: string;
  description: string;
  category: PayloadCategory;
  sampleInput: unknown;
  createInitialInput(): unknown;
  parseAndEncode(input: unknown): Readonly<{ data: unknown; payload: string }>;
  inspect(payload: string): PayloadInspection<unknown> | null;
}>;

export function registerPayloadDefinition<TData>(
  definition: PayloadDefinition<TData>,
): RegisteredPayloadDefinition {
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    category: definition.category,
    sampleInput: definition.sampleInput,
    createInitialInput() {
      return definition.createInitialInput?.() ?? definition.sampleInput;
    },
    parseAndEncode(input) {
      const data = definition.codec.parseInput(input);
      return {
        data,
        payload: definition.codec.encode(data),
      };
    },
    inspect(payload) {
      return definition.codec.inspect(payload) as PayloadInspection<unknown> | null;
    },
  };
}
