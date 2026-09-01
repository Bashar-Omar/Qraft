import type { RenderedBarcodeCode } from "@/core/code/render";

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type BarcodePreviewProps = Readonly<{
  label: string;
  rendered: RenderedBarcodeCode;
}>;

export function BarcodePreview({ label, rendered }: BarcodePreviewProps) {
  return (
    // Canonical SVG is validated at the BWIP adapter boundary and isolated in an image data URI.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={`Generated ${label} barcode preview`}
      className="qr-preview barcode-preview"
      draggable={false}
      src={svgToDataUri(rendered.svg)}
    />
  );
}
