"use client";

import type { SymbologyFamily } from "@/core/code/symbology";

export type BarcodeCatalogFamily = "all" | SymbologyFamily;

type BarcodeCatalogControlsProps = Readonly<{
  query: string;
  family: BarcodeCatalogFamily;
  resultCount: number;
  className?: string;
  onQueryChange(value: string): void;
  onFamilyChange(value: BarcodeCatalogFamily): void;
}>;

const FAMILY_OPTIONS: readonly Readonly<{ id: BarcodeCatalogFamily; label: string }>[] = [
  { id: "all", label: "All" },
  { id: "linear", label: "Linear" },
  { id: "matrix", label: "Matrix" },
  { id: "stacked", label: "Stacked" },
];

export function BarcodeCatalogControls({
  query,
  family,
  resultCount,
  className = "",
  onQueryChange,
  onFamilyChange,
}: BarcodeCatalogControlsProps) {
  return (
    <div className={`barcode-catalog-controls ${className}`.trim()}>
      <label className="barcode-catalog-search">
        <span className="mono-label">SEARCH CATALOG</span>
        <input
          aria-label="Search barcode types"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Name, alias or use case"
          type="search"
          value={query}
        />
      </label>
      <div aria-label="Barcode family filter" className="barcode-family-filter" role="group">
        {FAMILY_OPTIONS.map((option) => (
          <button
            aria-pressed={family === option.id}
            className={family === option.id ? "is-active" : ""}
            key={option.id}
            onClick={() => onFamilyChange(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <span className="barcode-catalog-count">
        {resultCount} MATCH{resultCount === 1 ? "" : "ES"}
      </span>
    </div>
  );
}
