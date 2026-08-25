import type { QrMatrix } from "@/core/code/render";

export function matrixToPathData(matrix: QrMatrix): string {
  const commands: string[] = [];

  for (let row = 0; row < matrix.length; row += 1) {
    const modules = matrix[row];
    let start = -1;

    for (let column = 0; column <= modules.length; column += 1) {
      const isDark = column < modules.length && modules[column];

      if (isDark && start === -1) {
        start = column;
      }

      if (!isDark && start !== -1) {
        const width = column - start;
        commands.push(`M${start} ${row}h${width}v1H${start}z`);
        start = -1;
      }
    }
  }

  return commands.join("");
}

export function matrixToSvg(matrix: QrMatrix): string {
  const size = matrix.length;
  const path = matrixToPathData(matrix);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    `<rect width="${size}" height="${size}" fill="#ffffff"/>`,
    `<path d="${path}" fill="#000000"/>`,
    "</svg>",
  ].join("");
}
