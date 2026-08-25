"use client";

import { useEffect, useMemo, useState } from "react";

import type { GeneratedCode } from "@/application/generate/generate-code";
import { exportCode, generateCode } from "@/composition/core-qr";
import { CodeRenderError, type QrErrorCorrectionLevel } from "@/core/code/render";
import { payloadRegistry } from "@/core/payload/payload-registry";
import { PayloadValidationError, type PayloadId } from "@/core/payload/payload";
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
): Record<PayloadId, string> {
  return Object.fromEntries(
    definitions.map((definition) => [
      definition.id,
      typeof definition.sampleInput === "string" ? definition.sampleInput : "",
    ]),
  ) as Record<PayloadId, string>;
}

type GenerationState =
  | Readonly<{ status: "ready"; value: GeneratedCode }>
  | Readonly<{ status: "error"; message: string; fieldIssue?: string }>
  | Readonly<{ status: "waiting" }>;

function toGenerationError(error: unknown): Readonly<{ message: string; fieldIssue?: string }> {
  if (error instanceof PayloadValidationError) {
    return {
      message: error.message,
      fieldIssue: error.issues[0]?.message,
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
  const [drafts, setDrafts] = useState<Record<PayloadId, string>>(() =>
    createInitialDrafts(definitions),
  );
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<QrErrorCorrectionLevel>("M");
  const [generation, setGeneration] = useState<GenerationState>({ status: "waiting" });
  const [exporting, setExporting] = useState<"svg" | "png" | null>(null);
  const [exportIssue, setExportIssue] = useState<string | null>(null);
  const currentDraft = drafts[payloadId];
  const editorRegistration = getPayloadEditorRegistration(payloadId);
  const PayloadEditor = editorRegistration.component;

  useEffect(() => {
    let active = true;

    void generateCode({
      payloadId,
      input: currentDraft,
      errorCorrectionLevel,
    })
      .then((value) => {
        if (active) {
          setGeneration({ status: "ready", value });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          const details = toGenerationError(error);
          setGeneration({ status: "error", ...details });
        }
      });

    return () => {
      active = false;
    };
  }, [currentDraft, errorCorrectionLevel, payloadId]);

  const selectPayload = (nextPayloadId: PayloadId) => {
    setPayloadId(nextPayloadId);
  };

  const updateDraft = (value: string) => {
    setDrafts((current) => ({
      ...current,
      [payloadId]: value,
    }));
  };

  const download = async (format: "svg" | "png") => {
    if (generation.status !== "ready") {
      return;
    }

    setExporting(format);
    setExportIssue(null);

    try {
      const artifact = await exportCode(
        generation.value.rendered,
        format,
        `qraft-${generation.value.definition.id}`,
      );
      downloadArtifact(artifact);
    } catch {
      setExportIssue(`Qraft could not prepare the ${format.toUpperCase()} download.`);
    } finally {
      setExporting(null);
    }
  };

  const fieldIssue = generation.status === "error" ? generation.fieldIssue : undefined;
  const payloadNotice =
    generation.status === "ready"
      ? (editorRegistration.getNotice?.(generation.value.parsedData) ?? null)
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
          <div className="type-row type-row--locked" aria-label="More payloads arrive in Phase 1B">
            <span>
              <strong>Email · Phone · SMS · Wi-Fi</strong>
              <small>Queued for the next Phase 1 slice.</small>
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
          <PayloadEditor issue={fieldIssue} onChange={updateDraft} value={currentDraft} />

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

        <div className="preview-stage" aria-live="polite">
          {generation.status === "ready" ? (
            <QrPreview rendered={generation.value.rendered} />
          ) : generation.status === "error" ? (
            <div className="preview-error">
              <span className="mono-label">CHECK CONTENT</span>
              <strong>{generation.message}</strong>
            </div>
          ) : (
            <div className="preview-pending">Generating…</div>
          )}
        </div>

        {generation.status === "ready" ? (
          <>
            <div className="preview-meta">
              <span>FORMAT</span>
              <strong>QR / STANDARD</strong>
              <span>VERSION</span>
              <strong>V{generation.value.rendered.metadata.version}</strong>
              <span>ECC</span>
              <strong>{generation.value.rendered.metadata.errorCorrectionLevel}</strong>
              <span>QUIET ZONE</span>
              <strong>{generation.value.rendered.metadata.quietZoneModules} MODULES</strong>
              <span>DATA</span>
              <strong>{generation.value.rendered.metadata.payloadBytes} BYTES</strong>
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
