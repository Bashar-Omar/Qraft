import type { ExportArtifact } from "@/core/export/export";

export function downloadArtifact(artifact: ExportArtifact): void {
  const url = URL.createObjectURL(artifact.blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = artifact.filename;
  anchor.rel = "noopener";
  anchor.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
