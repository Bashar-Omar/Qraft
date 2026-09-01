"use client";

import { useCallback, useState } from "react";

import type {
  ImportedBarcodeProject,
  ImportedQrProject,
} from "@/application/project/import-qraft-project";
import { BarcodeGenerateStudio } from "@/features/generator/components/barcode-generate-studio";
import { QrGenerateStudio } from "@/features/generator/components/qr-generate-studio";

type StudioMode = "qr" | "barcode";

export function GenerateStudio() {
  const [mode, setMode] = useState<StudioMode>("qr");
  const [barcodeVisited, setBarcodeVisited] = useState(false);
  const [qrSeed, setQrSeed] = useState<ImportedQrProject | null>(null);
  const [barcodeSeed, setBarcodeSeed] = useState<ImportedBarcodeProject | null>(null);
  const [qrRevision, setQrRevision] = useState(0);
  const [barcodeRevision, setBarcodeRevision] = useState(0);

  const openBarcode = useCallback((project?: ImportedBarcodeProject) => {
    setBarcodeVisited(true);
    setMode("barcode");
    if (project) {
      setBarcodeSeed(project);
      setBarcodeRevision((revision) => revision + 1);
    }
  }, []);

  const openQr = useCallback((project?: ImportedQrProject) => {
    setMode("qr");
    if (project) {
      setQrSeed(project);
      setQrRevision((revision) => revision + 1);
    }
  }, []);

  return (
    <div className="generate-workspace" data-testid="studio-shell">
      <div className="studio-mode-switch" role="tablist" aria-label="Generate workspace">
        <button
          aria-controls="qr-studio-panel"
          aria-selected={mode === "qr"}
          className={mode === "qr" ? "is-active" : ""}
          id="qr-studio-tab"
          onClick={() => openQr()}
          role="tab"
          type="button"
        >
          <span>QR Studio</span>
          <small>Payloads · design · quality</small>
        </button>
        <button
          aria-controls="barcode-studio-panel"
          aria-selected={mode === "barcode"}
          className={mode === "barcode" ? "is-active" : ""}
          id="barcode-studio-tab"
          onClick={() => openBarcode()}
          role="tab"
          type="button"
        >
          <span>Barcode Studio</span>
          <small>Code 128 · Data Matrix</small>
        </button>
      </div>

      <div
        aria-labelledby="qr-studio-tab"
        hidden={mode !== "qr"}
        id="qr-studio-panel"
        role="tabpanel"
      >
        <QrGenerateStudio
          initialProject={qrSeed}
          key={`qr-${qrRevision}`}
          onOpenBarcodeProject={openBarcode}
        />
      </div>

      {barcodeVisited ? (
        <div
          aria-labelledby="barcode-studio-tab"
          hidden={mode !== "barcode"}
          id="barcode-studio-panel"
          role="tabpanel"
        >
          <BarcodeGenerateStudio
            initialProject={barcodeSeed}
            key={`barcode-${barcodeRevision}`}
            onOpenQrProject={openQr}
          />
        </div>
      ) : null}
    </div>
  );
}
