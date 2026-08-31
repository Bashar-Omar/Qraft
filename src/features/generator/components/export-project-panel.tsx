import type { ChangeEvent } from "react";

import {
  RASTER_PIXEL_SIZES,
  type RasterDimensions,
  type RasterPixelSize,
} from "@/core/export/raster";

export type ExportBusyState = "svg" | "png" | "jpeg" | "webp" | "project" | "import" | null;

type ExportProjectPanelProps = Readonly<{
  busy: ExportBusyState;
  canExport: boolean;
  rasterPixelSize: RasterPixelSize;
  actualRasterDimensions?: RasterDimensions;
  exportIssue: string | null;
  projectNotice: string | null;
  onChangeRasterPixelSize(value: RasterPixelSize): void;
  onDownload(format: "svg" | "png" | "jpeg" | "webp"): void;
  onSaveProject(): void;
  onOpenProject(file: File): void;
}>;

export function ExportProjectPanel({
  busy,
  canExport,
  rasterPixelSize,
  actualRasterDimensions,
  exportIssue,
  projectNotice,
  onChangeRasterPixelSize,
  onDownload,
  onSaveProject,
  onOpenProject,
}: ExportProjectPanelProps) {
  const chooseProject = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      onOpenProject(file);
    }
  };

  return (
    <section className="export-studio" aria-labelledby="export-studio-heading">
      <div className="export-studio__heading">
        <div>
          <span className="mono-label">EXPORT / PORTABLE PROJECT</span>
          <h2 id="export-studio-heading">Take the artifact with you.</h2>
        </div>
        <span className="local-pill">LOCAL</span>
      </div>

      <label className="export-size-field">
        <span>
          <strong>Raster target</strong>
          <small>
            {canExport && actualRasterDimensions
              ? `Current artifact: ${actualRasterDimensions.width} × ${actualRasterDimensions.height}px.`
              : "Aspect ratio and crisp code geometry are preserved automatically."}
          </small>
        </span>
        <select
          aria-label="Raster size"
          disabled={busy !== null || !canExport}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChangeRasterPixelSize(Number(event.target.value) as RasterPixelSize)
          }
          value={rasterPixelSize}
        >
          {RASTER_PIXEL_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} px
            </option>
          ))}
        </select>
      </label>

      <div className="export-format-grid" aria-label="Download format">
        <button
          className="button button--primary"
          disabled={busy !== null || !canExport}
          onClick={() => onDownload("svg")}
          type="button"
        >
          {busy === "svg" ? "Preparing SVG…" : "Download SVG"}
        </button>
        <button
          className="button button--secondary"
          disabled={busy !== null || !canExport}
          onClick={() => onDownload("png")}
          type="button"
        >
          {busy === "png" ? "Preparing PNG…" : "Download PNG"}
        </button>
        <button
          className="button button--secondary"
          disabled={busy !== null || !canExport}
          onClick={() => onDownload("jpeg")}
          type="button"
        >
          {busy === "jpeg" ? "Preparing JPEG…" : "Download JPEG"}
        </button>
        <button
          className="button button--secondary"
          disabled={busy !== null || !canExport}
          onClick={() => onDownload("webp")}
          type="button"
        >
          {busy === "webp" ? "Preparing WebP…" : "Download WebP"}
        </button>
      </div>

      {!canExport ? (
        <p className="export-studio__note export-studio__note--attention">
          Fix the current content to export or save it. You can still open a valid `.qraft.json`
          project locally.
        </p>
      ) : null}

      <p className="export-studio__note">
        SVG stays vector. PNG/WebP preserve transparency. JPEG always receives a solid white base if
        the current design is transparent. Unsupported browser encoders fail instead of silently
        downloading a PNG with the wrong extension.
      </p>

      <div className="project-actions">
        <button
          className="button button--secondary"
          disabled={busy !== null || !canExport}
          onClick={onSaveProject}
          type="button"
        >
          {busy === "project" ? "Saving project…" : "Save .qraft.json"}
        </button>
        <label
          className={
            busy !== null ? "button button--secondary is-disabled" : "button button--secondary"
          }
        >
          <input
            accept=".qraft.json,application/json"
            aria-label="Open Qraft project"
            disabled={busy !== null}
            onChange={chooseProject}
            type="file"
          />
          {busy === "import" ? "Opening project…" : "Open project"}
        </label>
      </div>

      <p className="export-studio__note">
        Project files are versioned, validated into fresh Qraft domain objects and stay local. A
        normalized logo can be embedded within a bounded project file so branded projects remain
        portable without an account.
      </p>

      {projectNotice ? <p className="project-notice">{projectNotice}</p> : null}
      {exportIssue ? (
        <p className="export-issue" role="alert">
          {exportIssue}
        </p>
      ) : null}
    </section>
  );
}
