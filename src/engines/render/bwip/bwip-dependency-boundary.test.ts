import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      return sourceFiles(fullPath);
    }
    if (!/\.(ts|tsx)$/.test(fullPath) || fullPath.endsWith(".test.ts")) {
      return [];
    }
    return [fullPath];
  });
}

describe("BWIP dependency boundary", () => {
  it("keeps the vendor package import inside its browser runtime binding", () => {
    const srcRoot = path.resolve(process.cwd(), "src");
    const vendorToken = ["@bwip-js", "browser"].join("/");
    const importers = sourceFiles(srcRoot)
      .filter((file) => readFileSync(file, "utf8").includes(vendorToken))
      .map((file) => path.relative(process.cwd(), file).replaceAll("\\", "/"));

    expect(importers).toEqual(["src/engines/render/bwip/bwip-browser-runtime.ts"]);
  });
});
