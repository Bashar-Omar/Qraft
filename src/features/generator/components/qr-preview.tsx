import { matrixToPathData } from "@/core/code/qr-matrix";
import type { RenderedCode } from "@/core/code/render";

type QrPreviewProps = Readonly<{
  rendered: RenderedCode;
}>;

export function QrPreview({ rendered }: QrPreviewProps) {
  const size = rendered.matrix.length;
  const path = matrixToPathData(rendered.matrix);

  return (
    <svg
      aria-label="Generated QR code preview"
      className="qr-preview"
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${size} ${size}`}
    >
      <rect fill="#ffffff" height={size} width={size} />
      <path d={path} fill="#000000" />
    </svg>
  );
}
