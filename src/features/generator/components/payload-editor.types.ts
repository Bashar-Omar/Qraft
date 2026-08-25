export type PayloadEditorProps = Readonly<{
  value: string;
  issue?: string;
  onChange(value: string): void;
}>;
