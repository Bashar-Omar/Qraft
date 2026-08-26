import type { ChangeEvent } from "react";

import type { QrErrorCorrectionLevel } from "@/core/code/render";
import {
  DEFAULT_QR_LOGO_CONFIG,
  QR_LOGO_LIMITS,
  type QraftQrLogoConfig,
} from "@/core/design/qr-logo";

export type QrLogoPanelAsset = Readonly<{
  name: string;
  sourceWidth: number;
  sourceHeight: number;
  normalizedDimension: number;
}>;

type QrLogoPanelProps = Readonly<{
  asset: QrLogoPanelAsset | null;
  config: QraftQrLogoConfig | undefined;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  preparing: boolean;
  issue: string | null;
  onChooseFile(file: File): void;
  onChangeConfig(config: QraftQrLogoConfig): void;
  onApplyConservative(): void;
  onRemove(): void;
}>;

const PADDING_OPTIONS = [0, 0.5, 1] as const;

export function QrLogoPanel({
  asset,
  config,
  errorCorrectionLevel,
  preparing,
  issue,
  onChooseFile,
  onChangeConfig,
  onApplyConservative,
  onRemove,
}: QrLogoPanelProps) {
  const logoConfig = config ?? DEFAULT_QR_LOGO_CONFIG;

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      onChooseFile(file);
    }
  };

  return (
    <section className="logo-panel" aria-labelledby="logo-heading">
      <div className="logo-panel__heading">
        <div>
          <span className="mono-label">STYLE / LOCAL LOGO</span>
          <h2 id="logo-heading">Brand the center</h2>
        </div>
        <span className="local-pill">LOCAL ONLY</span>
      </div>

      <label className={preparing ? "logo-upload is-busy" : "logo-upload"}>
        <span>
          <strong>{asset ? "Replace logo" : "Choose logo"}</strong>
          <small>PNG, JPEG or WebP · 4 MiB max · 4096px max</small>
        </span>
        <input
          accept="image/png,image/jpeg,image/webp"
          aria-label="Logo image"
          disabled={preparing}
          onChange={chooseFile}
          type="file"
        />
        <span className="button button--secondary" aria-hidden="true">
          {preparing ? "Preparing…" : asset ? "Replace" : "Choose file"}
        </span>
      </label>

      {issue ? <p className="logo-panel__issue">{issue}</p> : null}

      {asset ? (
        <>
          <div className="logo-asset-meta" aria-label="Selected logo details">
            <div>
              <span>LOGO READY</span>
              <strong>{asset.name}</strong>
            </div>
            <small>
              {asset.sourceWidth}×{asset.sourceHeight}px source · normalized locally to a{" "}
              {asset.normalizedDimension}×{asset.normalizedDimension}px square PNG
            </small>
          </div>

          <div className="logo-control-grid">
            <label className="logo-range-field">
              <span>
                <strong>Logo size</strong>
                <output>{logoConfig.sizePercent}%</output>
              </span>
              <input
                aria-label="Logo size"
                max={QR_LOGO_LIMITS.maxSizePercent}
                min={QR_LOGO_LIMITS.minSizePercent}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onChangeConfig({
                    ...logoConfig,
                    sizePercent: Number(event.target.value),
                  })
                }
                step={1}
                type="range"
                value={logoConfig.sizePercent}
              />
              <small>
                Centered clearance area relative to the QR symbol, excluding quiet zone.
              </small>
            </label>

            <div className="logo-padding-field">
              <span>
                <strong>Logo padding</strong>
                <small>{logoConfig.paddingModules} module</small>
              </span>
              <div className="design-segmented" aria-label="Logo padding">
                {PADDING_OPTIONS.map((padding) => (
                  <button
                    aria-pressed={logoConfig.paddingModules === padding}
                    className={logoConfig.paddingModules === padding ? "is-active" : ""}
                    key={padding}
                    onClick={() => onChangeConfig({ ...logoConfig, paddingModules: padding })}
                    type="button"
                  >
                    {padding}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="logo-safety-actions">
            <div>
              <span className="mono-label">CONSERVATIVE START</span>
              <small>20% area · 0.5 module padding · ECC Q</small>
            </div>
            <button
              className="button button--secondary"
              onClick={onApplyConservative}
              type="button"
            >
              Apply conservative settings
            </button>
          </div>

          <button className="logo-remove" onClick={onRemove} type="button">
            Remove logo
          </button>

          <p className="logo-panel__note">
            Current ECC: <strong>{errorCorrectionLevel}</strong>. Qraft clears center modules
            through the designer adapter, estimates occlusion separately, and keeps the final SVG
            self-contained for export and local self-test.
          </p>
        </>
      ) : (
        <p className="logo-panel__note">
          Raster logos are decoded and re-encoded locally before rendering. SVG uploads are rejected
          in this phase rather than injecting untrusted markup into the QR artifact.
        </p>
      )}
    </section>
  );
}
