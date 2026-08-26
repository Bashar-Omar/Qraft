import { DEFAULT_QR_DESIGN, parseQrDesign, type QraftQrDesign } from "@/core/design/qr-design";

export type QrDesignPresetId = "pure-mono" | "qraft-mint" | "soft-mint" | "packaging";

export type QrDesignPreset = Readonly<{
  id: QrDesignPresetId;
  label: string;
  description: string;
  design: QraftQrDesign;
}>;

export const QR_DESIGN_PRESETS: readonly QrDesignPreset[] = [
  {
    id: "pure-mono",
    label: "Pure Mono",
    description: "Square black-on-white baseline.",
    design: DEFAULT_QR_DESIGN,
  },
  {
    id: "qraft-mint",
    label: "Qraft Mint",
    description: "Slate modules on the brand mint wash.",
    design: parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      foreground: { kind: "solid", color: "#1B1F24" },
      background: { kind: "solid", color: "#E2F5EE" },
      moduleShape: "rounded",
      eyeFrame: "extra-rounded",
      eyeDot: "dot",
    }),
  },
  {
    id: "soft-mint",
    label: "Soft Mint",
    description: "A restrained dark gradient with rounded modules.",
    design: parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      foreground: {
        kind: "linear-gradient",
        from: "#04120D",
        to: "#0B6B55",
        rotationDegrees: 45,
      },
      background: { kind: "solid", color: "#F3F5F2" },
      moduleShape: "rounded",
      eyeFrame: "extra-rounded",
      eyeDot: "dot",
    }),
  },
  {
    id: "packaging",
    label: "Packaging",
    description: "High-contrast geometry for clean production artwork.",
    design: parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      foreground: { kind: "solid", color: "#111111" },
      background: { kind: "solid", color: "#FFFFFF" },
      moduleShape: "classy",
      eyeFrame: "square",
      eyeDot: "square",
    }),
  },
] as const;

export function getQrDesignPreset(id: QrDesignPresetId): QrDesignPreset {
  const preset = QR_DESIGN_PRESETS.find((candidate) => candidate.id === id);

  if (!preset) {
    throw new Error(`Unknown QR design preset: ${id}`);
  }

  return preset;
}
