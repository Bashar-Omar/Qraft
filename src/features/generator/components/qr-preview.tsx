import type { RenderedCode } from "@/core/code/render";

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type QrPreviewProps = Readonly<{
  rendered: RenderedCode;
}>;

export function QrPreview({ rendered }: QrPreviewProps) {
  return (
    // The preview is Qraft's already-generated canonical SVG artifact, not a
    // network image. Keeping it in an <img> isolates SVG markup from the DOM
    // and avoids Next image optimization/server coupling for a local data URI.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="Generated QR code preview"
      className="qr-preview"
      draggable={false}
      src={svgToDataUri(rendered.svg)}
    />
  );
}
