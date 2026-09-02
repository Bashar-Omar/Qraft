import {
  SYMBOLOGY_DEFINITIONS,
  type SymbologyAvailability,
  type SymbologyDefinition,
  type SymbologyDomain,
  type SymbologyFamily,
  type SymbologyId,
  type SymbologyTier,
} from "@/core/code/symbology";

export type SymbologySearchQuery = Readonly<{
  query?: string;
  family?: SymbologyFamily;
  tier?: SymbologyTier;
  availability?: SymbologyAvailability;
  domain?: SymbologyDomain;
}>;

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function matchesQuery(definition: SymbologyDefinition, query: string): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return true;

  const haystack = normalizeSearchText(
    [
      definition.id,
      definition.label,
      definition.summary,
      definition.family,
      definition.tier,
      ...definition.aliases,
      ...definition.catalog.domains,
      ...definition.catalog.keywords,
    ].join(" "),
  );

  return normalized.split(/\s+/u).every((token) => haystack.includes(token));
}

export class SymbologyRegistry {
  private readonly definitions: ReadonlyMap<SymbologyId, SymbologyDefinition>;

  constructor(definitions: readonly SymbologyDefinition[]) {
    const map = new Map<SymbologyId, SymbologyDefinition>();

    for (const definition of definitions) {
      if (map.has(definition.id)) {
        throw new Error(`Duplicate symbology registration: ${definition.id}.`);
      }
      map.set(definition.id, definition);
    }

    this.definitions = map;
  }

  get(id: SymbologyId): SymbologyDefinition {
    const definition = this.definitions.get(id);
    if (!definition) {
      throw new Error(`Unknown symbology: ${id}.`);
    }
    return definition;
  }

  list(): readonly SymbologyDefinition[] {
    return [...this.definitions.values()];
  }

  listLive(): readonly SymbologyDefinition[] {
    return this.search({ availability: "live" });
  }

  search(query: SymbologySearchQuery = {}): readonly SymbologyDefinition[] {
    return this.list().filter((definition) => {
      if (query.family && definition.family !== query.family) return false;
      if (query.tier && definition.tier !== query.tier) return false;
      if (query.availability && definition.availability !== query.availability) return false;
      if (query.domain && !definition.catalog.domains.includes(query.domain)) return false;
      return matchesQuery(definition, query.query ?? "");
    });
  }
}

export const symbologyRegistry = new SymbologyRegistry(SYMBOLOGY_DEFINITIONS);
