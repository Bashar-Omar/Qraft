"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GeneratedCode } from "@/application/generate/generate-code";
import { exportCode, generateCode, selfTestQr } from "@/composition/core-qr";
import { CodeRenderError, type QrErrorCorrectionLevel } from "@/core/code/render";
import { DEFAULT_QR_DESIGN, type QraftQrDesign } from "@/core/design/qr-design";
import { payloadRegistry } from "@/core/payload/payload-registry";
import { evaluateQrQuality } from "@/core/quality/evaluate-qr-quality";
import type { QrSelfTestResult } from "@/core/quality/self-test";
import { PayloadValidationError, type PayloadId, type PayloadIssue } from "@/core/payload/payload";
import {
  QualityAssistant,
  type QualitySelfTestState,
} from "@/features/generator/components/quality-assistant";
import { QrDesignPanel } from "@/features/generator/components/qr-design-panel";
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

type SelfTestGenerationState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "running"; requestKey: string }>
  | Readonly<{ status: "complete"; requestKey: string; result: QrSelfTestResult }>;

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
  const [design, setDesign] = useState<QraftQrDesign>(DEFAULT_QR_DESIGN);
  const [generation, setGeneration] = useState<GenerationState>({ status: "waiting" });
  const [exporting, setExporting] = useState<"svg" | "png" | null>(null);
  const [exportIssue, setExportIssue] = useState<string | null>(null);
  const [selfTest, setSelfTest] = useState<SelfTestGenerationState>({ status: "idle" });
  const selfTestAttempt = useRef(0);
  const currentDraft = drafts[payloadId];
  const editorRegistration = getPayloadEditorRegistration(payloadId);
  const PayloadEditor = editorRegistration.component;
  const requestKey = useMemo(
    () => JSON.stringify([payloadId, currentDraft, errorCorrectionLevel, design]),
    [currentDraft, design, errorCorrectionLevel, payloadId],
  );

  useEffect(() => {
    let active = true;

    void generateCode({
      payloadId,
      input: currentDraft,
      errorCorrectionLevel,
      design,
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
  }, [currentDraft, design, errorCorrectionLevel, payloadId, requestKey]);

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

  const qualityAssessment =
    currentGeneration.status === "ready"
      ? evaluateQrQuality({
          design: currentGeneration.value.design,
          metadata: currentGeneration.value.rendered.metadata,
        })
      : null;

  const currentSelfTest: QualitySelfTestState =
    selfTest.status === "idle" || selfTest.requestKey === requestKey
      ? selfTest.status === "complete"
        ? { status: "complete", result: selfTest.result }
        : selfTest.status === "running"
          ? { status: "running" }
          : { status: "idle" }
      : { status: "idle" };

  const runSelfTest = async () => {
    if (currentGeneration.status !== "ready") {
      return;
    }

    const selfTestRequestKey = requestKey;
    const attempt = selfTestAttempt.current + 1;
    selfTestAttempt.current = attempt;
    setSelfTest({ status: "running", requestKey: selfTestRequestKey });

    const result = await selfTestQr({
      rendered: currentGeneration.value.rendered,
      design: currentGeneration.value.design,
      expectedPayload: currentGeneration.value.payload,
    });

    if (selfTestAttempt.current === attempt) {
      setSelfTest({ status: "complete", requestKey: selfTestRequestKey, result });
    }
  };

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
          <div
            className="type-row type-row--locked"
            aria-label="Quality Assistant is active; logo upload is next"
          >
            <span>
              <strong>Quality · Local test</strong>
              <small>Active now. Logo guardrails are next.</small>
            </span>
            <span className="type-row__index">LIVE</span>
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

          <QrDesignPanel onChange={setDesign} value={design} />

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
              <span className="mono-label">DESIGN GUARDRAIL</span>
              <strong>Styling without giving up the baseline.</strong>
            </div>
            <ul>
              <li>4-module quiet zone</li>
              <li>Contrast + inversion checks</li>
              <li>Explicit ECC guidance</li>
              <li>Independent local self-test</li>
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
              <strong>
                {currentGeneration.value.rendered.metadata.rendererId === "designer-qr"
                  ? "QR / DESIGNER"
                  : "QR / STANDARD"}
              </strong>
              <span>VERSION</span>
              <strong>V{currentGeneration.value.rendered.metadata.version}</strong>
              <span>ECC</span>
              <strong>{currentGeneration.value.rendered.metadata.errorCorrectionLevel}</strong>
              <span>QUIET ZONE</span>
              <strong>{currentGeneration.value.rendered.metadata.quietZoneModules} MODULES</strong>
              <span>DATA</span>
              <strong>{currentGeneration.value.rendered.metadata.payloadBytes} BYTES</strong>
            </div>

            {qualityAssessment ? (
              <QualityAssistant
                assessment={qualityAssessment}
                onRunSelfTest={() => void runSelfTest()}
                selfTest={currentSelfTest}
              />
            ) : null}

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
