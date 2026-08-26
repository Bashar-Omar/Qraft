import type { ChangeEvent } from "react";

import { QR_DESIGN_PRESETS, type QrDesignPresetId } from "@/core/design/presets";
import type {
  QrEyeDotShape,
  QrEyeFrameShape,
  QrHexColor,
  QrLinearGradientPaint,
  QrModuleShape,
  QraftQrDesign,
} from "@/core/design/qr-design";

const MODULE_OPTIONS: readonly Readonly<{ value: QrModuleShape; label: string }>[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy rounded" },
  { value: "extra-rounded", label: "Extra rounded" },
];

const EYE_FRAME_OPTIONS: readonly Readonly<{ value: QrEyeFrameShape; label: string }>[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Extra rounded" },
];

const EYE_DOT_OPTIONS: readonly Readonly<{ value: QrEyeDotShape; label: string }>[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
];

const GRADIENT_ANGLES = [0, 45, 90, 135] as const;

function asHexColor(value: string): QrHexColor {
  return value as QrHexColor;
}

function designMatches(left: QraftQrDesign, right: QraftQrDesign): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

type QrDesignPanelProps = Readonly<{
  value: QraftQrDesign;
  onChange(value: QraftQrDesign): void;
}>;

export function QrDesignPanel({ value, onChange }: QrDesignPanelProps) {
  const activePreset = QR_DESIGN_PRESETS.find((preset) => designMatches(preset.design, value));
  const foregroundPrimary =
    value.foreground.kind === "solid" ? value.foreground.color : value.foreground.from;

  const applyPreset = (presetId: QrDesignPresetId) => {
    const preset = QR_DESIGN_PRESETS.find((candidate) => candidate.id === presetId);

    if (preset) {
      onChange(preset.design);
    }
  };

  const updateGradient = (patch: Partial<Omit<QrLinearGradientPaint, "kind">>) => {
    if (value.foreground.kind !== "linear-gradient") {
      return;
    }

    onChange({
      ...value,
      foreground: { ...value.foreground, ...patch },
    });
  };

  return (
    <section className="design-panel" aria-labelledby="designer-heading">
      <div className="design-panel__heading">
        <div>
          <span className="mono-label">STYLE / DESIGNER</span>
          <h2 id="designer-heading">Craft the QR</h2>
        </div>
        <span className="phase-pill phase-pill--live">PHASE 2</span>
      </div>

      <div className="design-presets" aria-label="Design presets">
        {QR_DESIGN_PRESETS.map((preset) => (
          <button
            aria-pressed={activePreset?.id === preset.id}
            className={activePreset?.id === preset.id ? "design-preset is-active" : "design-preset"}
            key={preset.id}
            onClick={() => applyPreset(preset.id)}
            type="button"
          >
            <span
              className="design-preset__swatch"
              style={{
                background:
                  preset.design.background.kind === "transparent"
                    ? "transparent"
                    : preset.design.background.color,
              }}
            >
              <i
                style={{
                  background:
                    preset.design.foreground.kind === "solid"
                      ? preset.design.foreground.color
                      : `linear-gradient(${preset.design.foreground.rotationDegrees}deg, ${preset.design.foreground.from}, ${preset.design.foreground.to})`,
                }}
              />
            </span>
            <span>
              <strong>{preset.label}</strong>
              <small>{preset.description}</small>
            </span>
          </button>
        ))}
      </div>

      <fieldset className="design-group">
        <legend>Foreground</legend>
        <div className="design-segmented" aria-label="Foreground paint type">
          <button
            aria-pressed={value.foreground.kind === "solid"}
            className={value.foreground.kind === "solid" ? "is-active" : ""}
            onClick={() =>
              onChange({
                ...value,
                foreground: { kind: "solid", color: foregroundPrimary },
              })
            }
            type="button"
          >
            Solid
          </button>
          <button
            aria-pressed={value.foreground.kind === "linear-gradient"}
            className={value.foreground.kind === "linear-gradient" ? "is-active" : ""}
            onClick={() =>
              onChange({
                ...value,
                foreground:
                  value.foreground.kind === "linear-gradient"
                    ? value.foreground
                    : {
                        kind: "linear-gradient",
                        from: value.foreground.color,
                        to: "#0b6b55",
                        rotationDegrees: 45,
                      },
              })
            }
            type="button"
          >
            Gradient
          </button>
        </div>

        {value.foreground.kind === "solid" ? (
          <label className="design-color-field">
            <span>Module color</span>
            <span className="design-color-control">
              <input
                aria-label="Module color"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({
                    ...value,
                    foreground: { kind: "solid", color: asHexColor(event.target.value) },
                  })
                }
                type="color"
                value={value.foreground.color}
              />
              <code>{value.foreground.color.toUpperCase()}</code>
            </span>
          </label>
        ) : (
          <div className="design-gradient-grid">
            <label className="design-color-field">
              <span>Gradient start</span>
              <span className="design-color-control">
                <input
                  aria-label="Gradient start color"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateGradient({ from: asHexColor(event.target.value) })
                  }
                  type="color"
                  value={value.foreground.from}
                />
                <code>{value.foreground.from.toUpperCase()}</code>
              </span>
            </label>
            <label className="design-color-field">
              <span>Gradient end</span>
              <span className="design-color-control">
                <input
                  aria-label="Gradient end color"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateGradient({ to: asHexColor(event.target.value) })
                  }
                  type="color"
                  value={value.foreground.to}
                />
                <code>{value.foreground.to.toUpperCase()}</code>
              </span>
            </label>
            <div className="design-angle-field">
              <span>Gradient angle</span>
              <div className="design-angle-options">
                {GRADIENT_ANGLES.map((angle) => (
                  <button
                    aria-pressed={
                      value.foreground.kind === "linear-gradient" &&
                      value.foreground.rotationDegrees === angle
                    }
                    className={
                      value.foreground.kind === "linear-gradient" &&
                      value.foreground.rotationDegrees === angle
                        ? "is-active"
                        : ""
                    }
                    key={angle}
                    onClick={() => updateGradient({ rotationDegrees: angle })}
                    type="button"
                  >
                    {angle}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className="design-group">
        <legend>Background</legend>
        <label className="design-check-row">
          <span>
            <strong>Transparent background</strong>
            <small>
              Useful for layout work; Quality Assistant reports placement-dependent contrast.
            </small>
          </span>
          <input
            checked={value.background.kind === "transparent"}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange({
                ...value,
                background: event.target.checked
                  ? { kind: "transparent" }
                  : { kind: "solid", color: "#ffffff" },
              })
            }
            type="checkbox"
          />
        </label>

        {value.background.kind === "solid" ? (
          <label className="design-color-field">
            <span>Background color</span>
            <span className="design-color-control">
              <input
                aria-label="Background color"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChange({
                    ...value,
                    background: { kind: "solid", color: asHexColor(event.target.value) },
                  })
                }
                type="color"
                value={value.background.color}
              />
              <code>{value.background.color.toUpperCase()}</code>
            </span>
          </label>
        ) : null}
      </fieldset>

      <div className="design-shape-grid">
        <label>
          <span>Modules</span>
          <select
            aria-label="Module shape"
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onChange({ ...value, moduleShape: event.target.value as QrModuleShape })
            }
            value={value.moduleShape}
          >
            {MODULE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Eye frame</span>
          <select
            aria-label="Eye frame shape"
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onChange({ ...value, eyeFrame: event.target.value as QrEyeFrameShape })
            }
            value={value.eyeFrame}
          >
            {EYE_FRAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Eye dot</span>
          <select
            aria-label="Eye dot shape"
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onChange({ ...value, eyeDot: event.target.value as QrEyeDotShape })
            }
            value={value.eyeDot}
          >
            {EYE_DOT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="design-panel__note">
        Styling is local and non-destructive. The four-module quiet zone stays locked in Safe Mode,
        while the Quality Assistant reports contrast, polarity and ECC guidance for the current
        design.
      </p>
    </section>
  );
}
