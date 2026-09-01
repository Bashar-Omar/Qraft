import {
  SYMBOLOGY_DEFINITIONS,
  type SymbologyDefinition,
  type SymbologyId,
} from "@/core/code/symbology";

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
    return this.list().filter((definition) => definition.availability === "live");
  }
}

export const symbologyRegistry = new SymbologyRegistry(SYMBOLOGY_DEFINITIONS);
