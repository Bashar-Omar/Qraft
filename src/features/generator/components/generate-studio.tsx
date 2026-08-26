"use client";

import { useEffect, useMemo, useState } from "react";

import type { GeneratedCode } from "@/application/generate/generate-code";
import { exportCode, generateCode } from "@/composition/core-qr";
import { CodeRenderError, type QrErrorCorrectionLevel } from "@/core/code/render";
import { payloadRegistry } from "@/core/payload/payload-registry";
import { PayloadValidationError, type PayloadId, type PayloadIssue } from "@/core/payload/payload";
import { QrPreview } from "@/features/generator/components/qr-preview";
import { getPayloadEditorRegistration } from "@/features/generator/components/payload-editor-registry";
import { downloadArtifact } from "@/features/generator/lib/download";

const ECC_OPTIONS: readonly Readonly<{
  id: QrErrorCorrectionLevel;
  label: string;
  recovery: string;
}>[] = [
  { id: "L", label: "Low", recovery: "~7%" },
  { id: "M", label: "Medium", recovery: "~15%" },
  { id: "Q", label: "Quartile", recovery: "~25%" },
  { id: "H", label: "High", recovery: "~30%" },
];

function createInitialDrafts(
  definitions: ReturnType<typeof payloadRegistry.list>,
): Record<PayloadId, unknown> {
  return Object.fromEntries(
    definitions.map((definition) => [definition.id, definition.sampleInput]),
  ) as Record<PayloadId, unknown>;
}

type GenerationState =
  | Readonly<{ status: "ready"; requestKey: string; value: GeneratedCode }>
  | Readonly<{
      status: "error";
      requestKey: string;
      message: string;
      issues?: readonly PayloadIssue[];
    }>
  | Readonly<{ status: "waiting" }>;

function toGenerationError(
  error: unknown,
): Readonly<{ message: string; issues?: readonly PayloadIssue[] }> {
  if (error instanceof PayloadValidationError) {
    return {
      message: error.message,
      issues: error.issues,
    };
  }

  if (error instanceof CodeRenderError) {
    return { message: error.message };
  }

  return { message: "Qraft could not generate this QR code." };
}

export function GenerateStudio() {
  const definitions = useMemo(() => payloadRegistry.list(), []);
  const [payloadId, setPayloadId] = useState<PayloadId>("url");
  const [drafts, setDrafts] = useState<Record<PayloadId, unknown>>(() =>
    createInitialDrafts(definitions),
  );
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<QrErrorCorrectionLevel>("M");
  const [generation, setGeneration] = useState<GenerationState>({ status: "waiting" });
  const [exporting, setExporting] = useState<"svg" | "png" | null>(null);
  const [exportIssue, setExportIssue] = useState<string | null>(null);
  const currentDraft = drafts[payloadId];
  const editorRegistration = getPayloadEditorRegistration(payloadId);
  const PayloadEditor = editorRegistration.component;
  const requestKey = useMemo(
    () => JSON.stringify([payloadId, currentDraft, errorCorrectionLevel]),
    [currentDraft, errorCorrectionLevel, payloadId],
  );

  useEffect(() => {
    let active = true;

    void generateCode({
      payloadId,
      input: currentDraft,
      errorCorrectionLevel,
    })
      .then((value) => {
        if (active) {
          setGeneration({ status: "ready", requestKey, value });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          const details = toGenerationError(error);
          setGeneration({ status: "error", requestKey, ...details });
        }
      });

    return () => {
      active = false;
    };
  }, [currentDraft, errorCorrectionLevel, payloadId, requestKey]);

  const selectPayload = (nextPayloadId: PayloadId) => {
    setPayloadId(nextPayloadId);
  };

  const updateDraft = (value: unknown) => {
    setDrafts((current) => ({
      ...current,
      [payloadId]: value,
    }));
  };

  const currentGeneration: GenerationState =
    generation.status === "waiting" || generation.requestKey === requestKey
      ? generation
      : { status: "waiting" };

  const download = async (format: "svg" | "png") => {
    if (currentGeneration.status !== "ready") {
      return;
    }

    setExporting(format);
    setExportIssue(null);

    try {
      const artifact = await exportCode(
        currentGeneration.value.rendered,
        format,
        `qraft-${currentGeneration.value.definition.id}`,
      );
      downloadArtifact(artifact);
    } catch {
      setExportIssue(`Qraft could not prepare the ${format.toUpperCase()} download.`);
    } finally {
      setExporting(null);
    }
  };

  const fieldIssues = currentGeneration.status === "error" ? currentGeneration.issues : undefined;
  const payloadNotice =
    currentGeneration.status === "ready"
      ? (editorRegistration.getNotice?.(currentGeneration.value.parsedData) ?? null)
      : null;

  return (
    <div className="studio-shell" data-testid="studio-shell">
      <aside className="studio-pane studio-pane--types">
        <div className="studio-pane__heading">
          <span className="mono-label">TYPE</span>
          <span className="phase-pill">CORE QR</span>
        </div>
        <div className="type-list">
          {definitions.map((definition, index) => (
            <button
              aria-pressed={payloadId === definition.id}
              className={payloadId === definition.id ? "type-row is-active" : "type-row"}
              key={definition.id}
              onClick={() => selectPayload(definition.id)}
              type="button"
            >
              <span>
                <strong>{definition.label}</strong>
                <small>{definition.description}</small>
              </span>
              <span className="type-row__index">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
          <div className="type-row type-row--locked" aria-label="Visual Studio arrives in Phase 2">
            <span>
              <strong>Designer QR · Quality</strong>
              <small>Queued for the Visual Studio phase.</small>
            </span>
            <span className="type-row__index">NEXT</span>
          </div>
        </div>
      </aside>

      <section className="studio-pane studio-pane--editor">
        <div className="studio-pane__heading">
          <span className="mono-label">CONTENT / {payloadId.toUpperCase()}</span>
          <span className="phase-pill phase-pill--live">LIVE</span>
        </div>

        <div className="studio-mobile-types" aria-label="Payload type">
          {definitions.map((definition) => (
            <button
              aria-pressed={payloadId === definition.id}
              className={payloadId === definition.id ? "is-active" : ""}
              key={definition.id}
              onClick={() => selectPayload(definition.id)}
              type="button"
            >
              {definition.label}
            </button>
          ))}
        </div>

        <div className="studio-editor-stack">
          <PayloadEditor issues={fieldIssues} onChange={updateDraft} value={currentDraft} />

          {payloadNotice ? (
            <div className="studio-inline-note" role="status">
              <span className="mono-label">NORMALIZED</span>
              <p>{payloadNotice}</p>
            </div>
          ) : null}

          <fieldset className="ecc-control">
            <legend>Error correction</legend>
            <div className="ecc-grid">
              {ECC_OPTIONS.map((option) => (
                <button
                  aria-pressed={errorCorrectionLevel === option.id}
                  className={errorCorrectionLevel === option.id ? "is-active" : ""}
                  key={option.id}
                  onClick={() => setErrorCorrectionLevel(option.id)}
                  type="button"
                >
                  <span>{option.id}</span>
                  <strong>{option.label}</strong>
                  <small>{option.recovery}</small>
                </button>
              ))}
            </div>
            <p>
              Medium is the safe default. Higher recovery increases symbol density for the same
              payload.
            </p>
          </fieldset>

          <div className="studio-safety-card">
            <div>
              <span className="mono-label">SAFE BASELINE</span>
              <strong>Standards before styling.</strong>
            </div>
            <ul>
              <li>4-module quiet zone</li>
              <li>Black on white</li>
              <li>Explicit ECC</li>
              <li>Local generation only</li>
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
            <QrPreview rendered={currentGeneration.value.rendered} />
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
              <strong>QR / STANDARD</strong>
              <span>VERSION</span>
              <strong>V{currentGeneration.value.rendered.metadata.version}</strong>
              <span>ECC</span>
              <strong>{currentGeneration.value.rendered.metadata.errorCorrectionLevel}</strong>
              <span>QUIET ZONE</span>
              <strong>{currentGeneration.value.rendered.metadata.quietZoneModules} MODULES</strong>
              <span>DATA</span>
              <strong>{currentGeneration.value.rendered.metadata.payloadBytes} BYTES</strong>
            </div>

            <div className="preview-quality">
              <div>
                <span className="quality-dot" />
                <span>Safe baseline</span>
              </div>
              <small>Quiet zone and contrast are fixed in this slice.</small>
            </div>

            <div className="export-actions">
              <button
                className="button button--primary button--full"
                disabled={exporting !== null}
                onClick={() => void download("svg")}
                type="button"
              >
                {exporting === "svg" ? "Preparing SVG…" : "Download SVG"}
              </button>
              <button
                className="button button--secondary button--full"
                disabled={exporting !== null}
                onClick={() => void download("png")}
                type="button"
              >
                {exporting === "png" ? "Preparing PNG…" : "Download PNG"}
              </button>
            </div>
            {exportIssue ? (
              <p className="export-issue" role="alert">
                {exportIssue}
              </p>
            ) : null}
          </>
        ) : (
          <button className="button button--primary button--full" disabled type="button">
            Fix content to export
          </button>
        )}
      </aside>
    </div>
  );
}
