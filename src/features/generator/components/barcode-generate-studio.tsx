"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { exportQraftProject } from "@/application/project/export-qraft-project";
import {
  importQraftProject,
  type ImportedBarcodeProject,
  type ImportedQrProject,
} from "@/application/project/import-qraft-project";
import { exportCode, renderBarcode, selfTestBarcode } from "@/composition/core-qr";
import { getBarcodeInputPolicy, type ValidatedBarcodePayload } from "@/core/code/barcode-input";
import { CodeRenderError, type RenderedBarcodeCode } from "@/core/code/render";
import { symbologyRegistry } from "@/core/code/symbology-registry";
import type { BarcodeSymbologyId, SymbologyDefinition } from "@/core/code/symbology";
import {
  DEFAULT_RASTER_PIXEL_SIZE,
  resolveRasterDimensions,
  type RasterPixelSize,
} from "@/core/export/raster";
import type { BarcodeSelfTestResult } from "@/core/quality/self-test";
import {
  BarcodeCatalogControls,
  type BarcodeCatalogDomain,
  type BarcodeCatalogFamily,
  type BarcodeCatalogTier,
} from "@/features/generator/components/barcode-catalog-controls";
import { BarcodePreview } from "@/features/generator/components/barcode-preview";
import {
  BarcodeQualityPanel,
  type BarcodeSelfTestState,
} from "@/features/generator/components/barcode-quality-panel";
import {
  ExportProjectPanel,
  type ExportBusyState,
} from "@/features/generator/components/export-project-panel";
import { downloadArtifact } from "@/features/generator/lib/download";

const INITIAL_BARCODE_DRAFTS: Readonly<Record<BarcodeSymbologyId, string>> = Object.freeze({
  code128: "QRAFT-128-001",
  code39: "QRAFT-39",
  code93: "QRAFT-93",
  itf: "0123456789",
  itf14: "0952876543210",
  ean13: "952012345678",
  ean8: "0133558",
  upca: "78858101497",
  upce: "0123455",
  codabar: "A0123456789B",
  code11: "01234-56789",
  msi: "0123456789",
  plessey: "1A2B3C4D",
  datamatrix: "Qraft Data Matrix",
  pdf417: "Qraft PDF417 document payload",
  aztec: "Qraft Aztec ticket payload",
  microqr: "MICRO-QRAFT",
  maxicode: "Qraft parcel 2026",
  rmqr: "Qraft narrow label",
});

type BarcodeGenerationState =
  | Readonly<{
      status: "ready";
      requestKey: string;
      definition: SymbologyDefinition;
      payload: string;
      validation: ValidatedBarcodePayload;
      rendered: RenderedBarcodeCode;
    }>
  | Readonly<{ status: "error"; requestKey: string; message: string }>
  | Readonly<{ status: "waiting" }>;

type SelfTestGenerationState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "running"; requestKey: string }>
  | Readonly<{ status: "complete"; requestKey: string; result: BarcodeSelfTestResult }>;

type BarcodeGenerateStudioProps = Readonly<{
  initialProject?: ImportedBarcodeProject | null;
  onOpenQrProject(project: ImportedQrProject): void;
}>;

function formatQuietZone(rendered: RenderedBarcodeCode): string {
  const quiet = rendered.metadata.quietZoneModules;
  if (quiet.top === quiet.right && quiet.right === quiet.bottom && quiet.bottom === quiet.left) {
    return `${quiet.top} MODULE${quiet.top === 1 ? "" : "S"}`;
  }
  return `L/R ${quiet.left}/${quiet.right} · T/B ${quiet.top}/${quiet.bottom}`;
}

function toBarcodeError(error: unknown): string {
  if (error instanceof CodeRenderError) return error.message;
  return "Qraft could not generate this barcode.";
}

export function BarcodeGenerateStudio({
  initialProject,
  onOpenQrProject,
}: BarcodeGenerateStudioProps) {
  const initialDefinition = initialProject ? symbologyRegistry.get(initialProject.symbology) : null;
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogFamily, setCatalogFamily] = useState<BarcodeCatalogFamily>("all");
  const [catalogTier, setCatalogTier] = useState<BarcodeCatalogTier>("all");
  const [catalogDomain, setCatalogDomain] = useState<BarcodeCatalogDomain>("all");
  const [includeExperimental, setIncludeExperimental] = useState(
    initialDefinition?.tier === "experimental",
  );
  const definitions = useMemo(
    () =>
      symbologyRegistry
        .search({
          query: catalogQuery,
          availability: "live",
          ...(catalogFamily === "all" ? {} : { family: catalogFamily }),
          ...(catalogTier === "all" ? {} : { tier: catalogTier }),
          ...(catalogDomain === "all" ? {} : { domain: catalogDomain }),
        })
        .filter(
          (definition): definition is SymbologyDefinition & { id: BarcodeSymbologyId } =>
            definition.id !== "qr" && (includeExperimental || definition.tier !== "experimental"),
        ),
    [catalogDomain, catalogFamily, catalogQuery, catalogTier, includeExperimental],
  );
  const [symbology, setSymbology] = useState<BarcodeSymbologyId>(
    initialProject?.symbology ?? "code128",
  );
  const [drafts, setDrafts] = useState<Record<BarcodeSymbologyId, string>>(() => ({
    ...INITIAL_BARCODE_DRAFTS,
    ...(initialProject ? { [initialProject.symbology]: initialProject.payload } : {}),
  }));
  const [humanReadableText, setHumanReadableText] = useState(
    initialProject?.humanReadableText ?? true,
  );
  const [generation, setGeneration] = useState<BarcodeGenerationState>({ status: "waiting" });
  const [rasterPixelSize, setRasterPixelSize] = useState<RasterPixelSize>(
    initialProject?.rasterPixelSize ?? DEFAULT_RASTER_PIXEL_SIZE,
  );
  const [exporting, setExporting] = useState<ExportBusyState>(null);
  const [exportIssue, setExportIssue] = useState<string | null>(null);
  const [projectNotice, setProjectNotice] = useState<string | null>(
    initialProject ? "Opened barcode project locally as schema v2." : null,
  );
  const [selfTest, setSelfTest] = useState<SelfTestGenerationState>({ status: "idle" });
  const selfTestAttempt = useRef(0);

  const definition = symbologyRegistry.get(symbology);
  const inputPolicy = getBarcodeInputPolicy(symbology);
  const payload = drafts[symbology];
  const effectiveHumanReadableText = definition.capabilities.humanReadableText
    ? humanReadableText
    : false;
  const requestKey = useMemo(
    () => JSON.stringify([symbology, payload, effectiveHumanReadableText]),
    [effectiveHumanReadableText, payload, symbology],
  );

  useEffect(() => {
    let active = true;
    void renderBarcode({
      symbology,
      payload,
      humanReadableText: effectiveHumanReadableText,
    })
      .then((result) => {
        if (active) {
          setGeneration({
            status: "ready",
            requestKey,
            definition: result.symbology,
            payload: result.payload,
            validation: result.validation,
            rendered: result.rendered,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) setGeneration({ status: "error", requestKey, message: toBarcodeError(error) });
      });
    return () => {
      active = false;
    };
  }, [effectiveHumanReadableText, payload, requestKey, symbology]);

  const currentGeneration: BarcodeGenerationState =
    generation.status === "waiting" || generation.requestKey === requestKey
      ? generation
      : { status: "waiting" };

  const currentSelfTest: BarcodeSelfTestState =
    selfTest.status === "idle" || selfTest.requestKey === requestKey
      ? selfTest.status === "complete"
        ? { status: "complete", result: selfTest.result }
        : selfTest.status === "running"
          ? { status: "running" }
          : { status: "idle" }
      : { status: "idle" };

  const selectSymbology = (next: BarcodeSymbologyId) => {
    const nextDefinition = symbologyRegistry.get(next);
    setSymbology(next);
    setHumanReadableText(nextDefinition.capabilities.humanReadableText);
    setExportIssue(null);
    setProjectNotice(null);
  };

  const runSelfTest = async () => {
    if (
      currentGeneration.status !== "ready" ||
      definition.verification.artifactSelfTest !== "independent"
    )
      return;
    const selfTestRequestKey = requestKey;
    const attempt = selfTestAttempt.current + 1;
    selfTestAttempt.current = attempt;
    setSelfTest({ status: "running", requestKey: selfTestRequestKey });
    const result = await selfTestBarcode({
      rendered: currentGeneration.rendered,
      expectedPayload: currentGeneration.payload,
    });
    if (selfTestAttempt.current === attempt) {
      setSelfTest({ status: "complete", requestKey: selfTestRequestKey, result });
    }
  };

  const download = async (format: "svg" | "png" | "jpeg" | "webp") => {
    if (currentGeneration.status !== "ready") return;
    setExporting(format);
    setExportIssue(null);
    setProjectNotice(null);
    try {
      const artifact = await exportCode(currentGeneration.rendered, format, `qraft-${symbology}`, {
        pixelSize: rasterPixelSize,
      });
      downloadArtifact(artifact);
    } catch (error) {
      setExportIssue(
        error instanceof Error
          ? error.message
          : `Qraft could not prepare the ${format.toUpperCase()} download.`,
      );
    } finally {
      setExporting(null);
    }
  };

  const saveProject = async () => {
    if (currentGeneration.status !== "ready") return;
    setExporting("project");
    setExportIssue(null);
    setProjectNotice(null);
    try {
      const artifact = await exportQraftProject({
        mode: "barcode",
        symbology,
        payload: currentGeneration.payload,
        humanReadableText: effectiveHumanReadableText,
        rasterPixelSize,
      });
      downloadArtifact(artifact);
      setProjectNotice("Portable barcode project saved locally as schema v2.");
    } catch (error) {
      setExportIssue(error instanceof Error ? error.message : "Qraft could not save this project.");
    } finally {
      setExporting(null);
    }
  };

  const openProject = async (file: File) => {
    setExporting("import");
    setExportIssue(null);
    setProjectNotice(null);
    try {
      const imported = await importQraftProject(file);
      if (imported.mode === "qr") {
        onOpenQrProject(imported);
        return;
      }
      const importedDefinition = symbologyRegistry.get(imported.symbology);
      if (importedDefinition.tier === "experimental") setIncludeExperimental(true);
      setSymbology(imported.symbology);
      setDrafts((current) => ({ ...current, [imported.symbology]: imported.payload }));
      setHumanReadableText(imported.humanReadableText);
      setRasterPixelSize(imported.rasterPixelSize);
      setProjectNotice(`Opened ${file.name || "Qraft project"} locally.`);
    } catch (error) {
      setExportIssue(error instanceof Error ? error.message : "Qraft could not open this project.");
    } finally {
      setExporting(null);
    }
  };

  const actualRasterDimensions =
    currentGeneration.status === "ready"
      ? resolveRasterDimensions(currentGeneration.rendered, rasterPixelSize)
      : undefined;

  return (
    <div className="studio-shell barcode-studio-shell" data-testid="barcode-studio-shell">
      <aside className="studio-pane studio-pane--types">
        <div className="studio-pane__heading">
          <span className="mono-label">TYPE</span>
          <span className="phase-pill phase-pill--live">BARCODE</span>
        </div>
        <BarcodeCatalogControls
          domain={catalogDomain}
          family={catalogFamily}
          includeExperimental={includeExperimental}
          onDomainChange={setCatalogDomain}
          onFamilyChange={setCatalogFamily}
          onIncludeExperimentalChange={setIncludeExperimental}
          onQueryChange={setCatalogQuery}
          onTierChange={setCatalogTier}
          query={catalogQuery}
          resultCount={definitions.length}
          tier={catalogTier}
        />
        <div className="type-list">
          {definitions.map((item, index) => (
            <button
              aria-pressed={symbology === item.id}
              className={symbology === item.id ? "type-row is-active" : "type-row"}
              key={item.id}
              onClick={() => selectSymbology(item.id)}
              type="button"
            >
              <span>
                <strong>{item.label}</strong>
                <small>{item.summary}</small>
                <span className="type-row__support" aria-label={`${item.tier} support`}>
                  <span className={`support-badge support-badge--${item.tier}`}>
                    {item.tier.toUpperCase()}
                  </span>
                  <span className="support-badge">
                    {item.verification.artifactSelfTest === "independent"
                      ? "SELF-TEST"
                      : "RENDER-ONLY"}
                  </span>
                </span>
              </span>
              <span className="type-row__index">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
          {definitions.length === 0 ? (
            <div className="barcode-catalog-empty" role="status">
              No live barcode formats match this catalog filter.
            </div>
          ) : null}
          <div className="barcode-catalog-note">
            <span className="mono-label">SUPPORT MODEL</span>
            <small>
              Curated, allow-listed Expert, and deliberate Experimental formats share one
              Qraft-owned catalog.
            </small>
          </div>
        </div>
      </aside>

      <section className="studio-pane studio-pane--editor">
        <div className="studio-pane__heading">
          <span className="mono-label">CONTENT / {definition.label.toUpperCase()}</span>
          <span className={`phase-pill phase-pill--${definition.tier}`}>
            {definition.tier.toUpperCase()}
          </span>
        </div>

        <BarcodeCatalogControls
          className="barcode-catalog-controls--mobile"
          domain={catalogDomain}
          family={catalogFamily}
          includeExperimental={includeExperimental}
          onDomainChange={setCatalogDomain}
          onFamilyChange={setCatalogFamily}
          onIncludeExperimentalChange={setIncludeExperimental}
          onQueryChange={setCatalogQuery}
          onTierChange={setCatalogTier}
          query={catalogQuery}
          resultCount={definitions.length}
          tier={catalogTier}
        />
        <div className="studio-mobile-types" aria-label="Barcode type">
          {definitions.map((item) => (
            <button
              aria-pressed={symbology === item.id}
              className={symbology === item.id ? "is-active" : ""}
              key={item.id}
              onClick={() => selectSymbology(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="studio-editor-stack">
          <div className="studio-field">
            <label htmlFor="barcode-content">Barcode content</label>
            <textarea
              aria-invalid={currentGeneration.status === "error"}
              id="barcode-content"
              inputMode={inputPolicy.inputMode}
              onChange={(event) =>
                setDrafts((current) => ({ ...current, [symbology]: event.target.value }))
              }
              placeholder={inputPolicy.placeholder}
              rows={inputPolicy.rows}
              spellCheck={false}
              value={payload}
            />
            <p className="studio-field__hint">{inputPolicy.hint}</p>
            {currentGeneration.status === "ready" && currentGeneration.validation.checkDigit ? (
              <p className="studio-field__success" role="status">
                CHECK DIGIT · {currentGeneration.validation.checkDigit.digit} ·{" "}
                {currentGeneration.validation.checkDigit.status.toUpperCase()} · ENCODED{" "}
                {currentGeneration.validation.encodedPayload}
              </p>
            ) : null}
            {currentGeneration.status === "error" ? (
              <p className="studio-field__issue" role="status">
                {currentGeneration.message}
              </p>
            ) : null}
          </div>

          {definition.capabilities.humanReadableText ? (
            <label className="studio-checkbox" htmlFor="barcode-hrt">
              <input
                checked={humanReadableText}
                id="barcode-hrt"
                onChange={(event) => setHumanReadableText(event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>Human-readable text</strong>
                <small>Render the encoded value below the bars. The code data is unchanged.</small>
              </span>
            </label>
          ) : null}

          <div className="barcode-capability-card" aria-label="Barcode capabilities">
            <div>
              <span className="mono-label">CAPABILITIES / REGISTRY</span>
              <strong>Only valid controls are exposed.</strong>
            </div>
            <div className="barcode-capability-grid">
              <span>VECTOR · {definition.capabilities.vector ? "YES" : "NO"}</span>
              <span>RASTER · {definition.capabilities.raster ? "YES" : "NO"}</span>
              <span>HRT · {definition.capabilities.humanReadableText ? "YES" : "NO"}</span>
              <span>LOGO · {definition.capabilities.logo ? "YES" : "NO"}</span>
              <span>GRADIENT · {definition.capabilities.gradient ? "YES" : "NO"}</span>
              <span>QUIET ZONE · {definition.capabilities.quietZone ? "YES" : "NO"}</span>
              <span>
                SELF TEST ·{" "}
                {definition.verification.artifactSelfTest === "independent" ? "YES" : "NO"}
              </span>
            </div>
          </div>

          <div className="studio-safety-card">
            <div>
              <span className="mono-label">STANDARDS GUARDRAIL</span>
              <strong>Renderer breadth does not equal product support.</strong>
            </div>
            <ul>
              <li>Qraft-owned input validation</li>
              <li>Vendor-isolated BWIP adapter</li>
              <li>Validated canonical SVG geometry</li>
              <li>
                {definition.verification.artifactSelfTest === "independent"
                  ? "Independent ZXing artifact self-test"
                  : "Explicit renderer-only verification label"}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <aside className="studio-pane studio-pane--preview">
        <div className="studio-pane__heading">
          <span className="mono-label">LIVE PREVIEW</span>
          <span className="local-pill">LOCAL</span>
        </div>

        <div className="preview-stage" aria-busy={currentGeneration.status === "waiting"}>
          {currentGeneration.status === "ready" ? (
            <BarcodePreview label={definition.label} rendered={currentGeneration.rendered} />
          ) : currentGeneration.status === "error" ? (
            <div className="preview-error">
              <span className="mono-label">CHECK CONTENT</span>
              <strong>{currentGeneration.message}</strong>
            </div>
          ) : (
            <div className="preview-pending">Generating…</div>
          )}
        </div>

        {currentGeneration.status === "ready" ? (
          <>
            <div className="preview-meta">
              <span>FORMAT</span>
              <strong>{definition.label.toUpperCase()} / BWIP</strong>
              <span>GEOMETRY</span>
              <strong>
                {currentGeneration.rendered.width} × {currentGeneration.rendered.height}
              </strong>
              <span>HRT</span>
              <strong>
                {currentGeneration.rendered.metadata.humanReadableText ? "ON" : "OFF"}
              </strong>
              <span>QUIET ZONE</span>
              <strong>{formatQuietZone(currentGeneration.rendered)}</strong>
              <span>DATA</span>
              <strong>{currentGeneration.rendered.metadata.payloadBytes} BYTES</strong>
              <span>SUPPORT</span>
              <strong>{definition.tier.toUpperCase()}</strong>
              <span>VERIFY</span>
              <strong>
                {definition.verification.artifactSelfTest === "independent"
                  ? "ZXING SELF-TEST"
                  : "RENDER ONLY"}
              </strong>
            </div>
            <BarcodeQualityPanel
              onRunSelfTest={() => void runSelfTest()}
              selfTest={currentSelfTest}
              verification={definition.verification}
            />
          </>
        ) : null}

        <ExportProjectPanel
          actualRasterDimensions={actualRasterDimensions}
          busy={exporting}
          canExport={currentGeneration.status === "ready"}
          exportIssue={exportIssue}
          onChangeRasterPixelSize={setRasterPixelSize}
          onDownload={(format) => void download(format)}
          onOpenProject={(file) => void openProject(file)}
          onSaveProject={() => void saveProject()}
          projectNotice={projectNotice}
          rasterPixelSize={rasterPixelSize}
        />
      </aside>
    </div>
  );
}
