"use client";

import type { SymbologyDomain, SymbologyFamily, SymbologyTier } from "@/core/code/symbology";

export type BarcodeCatalogFamily = "all" | SymbologyFamily;
export type BarcodeCatalogTier = "all" | Exclude<SymbologyTier, "experimental">;
export type BarcodeCatalogDomain = "all" | SymbologyDomain;

type BarcodeCatalogControlsProps = Readonly<{
  query: string;
  family: BarcodeCatalogFamily;
  tier: BarcodeCatalogTier;
  domain: BarcodeCatalogDomain;
  includeExperimental: boolean;
  resultCount: number;
  className?: string;
  onQueryChange(value: string): void;
  onFamilyChange(value: BarcodeCatalogFamily): void;
  onTierChange(value: BarcodeCatalogTier): void;
  onDomainChange(value: BarcodeCatalogDomain): void;
  onIncludeExperimentalChange(value: boolean): void;
}>;

const FAMILY_OPTIONS: readonly Readonly<{ id: BarcodeCatalogFamily; label: string }>[] = [
  { id: "all", label: "All" },
  { id: "linear", label: "Linear" },
  { id: "matrix", label: "Matrix" },
  { id: "stacked", label: "Stacked" },
];

const TIER_OPTIONS: readonly Readonly<{ id: BarcodeCatalogTier; label: string }>[] = [
  { id: "all", label: "All support" },
  { id: "curated", label: "Curated" },
  { id: "expert", label: "Expert" },
];

const DOMAIN_OPTIONS: readonly Readonly<{ id: BarcodeCatalogDomain; label: string }>[] = [
  { id: "all", label: "All domains" },
  { id: "general", label: "General" },
  { id: "retail", label: "Retail" },
  { id: "industrial", label: "Industrial" },
  { id: "logistics", label: "Logistics" },
  { id: "documents", label: "Documents" },
  { id: "mobile", label: "Mobile" },
  { id: "healthcare", label: "Healthcare" },
  { id: "postal", label: "Postal" },
];

export function BarcodeCatalogControls({
  query,
  family,
  tier,
  domain,
  includeExperimental,
  resultCount,
  className = "",
  onQueryChange,
  onFamilyChange,
  onTierChange,
  onDomainChange,
  onIncludeExperimentalChange,
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

      <div className="barcode-catalog-filter-stack">
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
        <div aria-label="Barcode support filter" className="barcode-family-filter" role="group">
          {TIER_OPTIONS.map((option) => (
            <button
              aria-pressed={tier === option.id}
              className={tier === option.id ? "is-active" : ""}
              key={option.id}
              onClick={() => onTierChange(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="barcode-catalog-select-row">
        <label>
          <span className="mono-label">DOMAIN</span>
          <select
            aria-label="Barcode domain filter"
            onChange={(event) => onDomainChange(event.target.value as BarcodeCatalogDomain)}
            value={domain}
          >
            {DOMAIN_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="barcode-experimental-toggle">
          <input
            checked={includeExperimental}
            onChange={(event) => onIncludeExperimentalChange(event.target.checked)}
            type="checkbox"
          />
          <span>
            <strong>Include experimental</strong>
            <small>Explicit opt-in for formats without full verification coverage.</small>
          </span>
        </label>
      </div>

      <span className="barcode-catalog-count">
        {resultCount} MATCH{resultCount === 1 ? "" : "ES"}
      </span>
    </div>
  );
}
