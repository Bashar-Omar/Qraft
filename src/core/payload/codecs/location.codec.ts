import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
  type PayloadIssue,
} from "@/core/payload/payload";

export type LocationPayloadInput = Readonly<{
  latitude: string;
  longitude: string;
  altitude: string;
  uncertainty: string;
}>;

export type LocationPayloadData = Readonly<{
  latitude: number;
  longitude: number;
  altitude: number | null;
  uncertainty: number | null;
}>;

function readInput(input: unknown): LocationPayloadInput {
  if (typeof input !== "object" || input === null) {
    throw new PayloadValidationError("Enter location coordinates.", [
      { field: "latitude", message: "Latitude is required." },
      { field: "longitude", message: "Longitude is required." },
    ]);
  }

  return {
    latitude: "latitude" in input && typeof input.latitude === "string" ? input.latitude : "",
    longitude: "longitude" in input && typeof input.longitude === "string" ? input.longitude : "",
    altitude: "altitude" in input && typeof input.altitude === "string" ? input.altitude : "",
    uncertainty:
      "uncertainty" in input && typeof input.uncertainty === "string" ? input.uncertainty : "",
  };
}

function parseFiniteNumber(value: string, field: string, label: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) {
    throw new PayloadValidationError("Check the location coordinates.", [
      { field, message: `${label} must be a decimal number.` },
    ]);
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new PayloadValidationError("Check the location coordinates.", [
      { field, message: `${label} must be a finite decimal number.` },
    ]);
  }

  return Object.is(parsed, -0) ? 0 : parsed;
}

function parseInput(input: unknown): LocationPayloadData {
  const raw = readInput(input);
  const issues: PayloadIssue[] = [];
  let latitude: number | null = null;
  let longitude: number | null = null;
  let altitude: number | null = null;
  let uncertainty: number | null = null;

  try {
    latitude = parseFiniteNumber(raw.latitude, "latitude", "Latitude");
  } catch (error) {
    if (error instanceof PayloadValidationError) issues.push(...error.issues);
  }
  try {
    longitude = parseFiniteNumber(raw.longitude, "longitude", "Longitude");
  } catch (error) {
    if (error instanceof PayloadValidationError) issues.push(...error.issues);
  }
  try {
    altitude = parseFiniteNumber(raw.altitude, "altitude", "Altitude");
  } catch (error) {
    if (error instanceof PayloadValidationError) issues.push(...error.issues);
  }
  try {
    uncertainty = parseFiniteNumber(raw.uncertainty, "uncertainty", "Uncertainty");
  } catch (error) {
    if (error instanceof PayloadValidationError) issues.push(...error.issues);
  }

  if (latitude === null) {
    issues.push({ field: "latitude", message: "Latitude is required." });
  } else if (latitude < -90 || latitude > 90) {
    issues.push({ field: "latitude", message: "Latitude must be between -90 and 90 degrees." });
  }

  if (longitude === null) {
    issues.push({ field: "longitude", message: "Longitude is required." });
  } else if (longitude < -180 || longitude > 180) {
    issues.push({ field: "longitude", message: "Longitude must be between -180 and 180 degrees." });
  }

  if (uncertainty !== null && uncertainty < 0) {
    issues.push({ field: "uncertainty", message: "Uncertainty cannot be negative." });
  }

  if (issues.length > 0 || latitude === null || longitude === null) {
    throw new PayloadValidationError("Check the location coordinates.", issues);
  }

  return { latitude, longitude, altitude, uncertainty };
}

function formatNumber(value: number): string {
  return Object.is(value, -0) ? "0" : String(value);
}

export const locationCodec: PayloadCodec<LocationPayloadData> = {
  id: "location",
  parseInput,
  encode(data) {
    const coordinates = [
      formatNumber(data.latitude),
      formatNumber(data.longitude),
      ...(data.altitude === null ? [] : [formatNumber(data.altitude)]),
    ].join(",");
    const uncertainty = data.uncertainty === null ? "" : `;u=${formatNumber(data.uncertainty)}`;
    return `geo:${coordinates}${uncertainty}`;
  },
  inspect(payload) {
    const match = /^geo:([^;,]+),([^;,]+)(?:,([^;]+))?(.*)$/i.exec(payload.trim());
    if (!match) {
      return null;
    }

    const [, latitude, longitude, altitude, parameterText] = match;
    let uncertainty = "";

    if (parameterText) {
      const parameters = parameterText.split(";").filter(Boolean);
      for (const parameter of parameters) {
        const equals = parameter.indexOf("=");
        const key =
          equals >= 0 ? parameter.slice(0, equals).toLowerCase() : parameter.toLowerCase();
        const value = equals >= 0 ? parameter.slice(equals + 1) : "";

        if (key === "crs") {
          if (value.toLowerCase() !== "wgs84") return null;
        } else if (key === "u") {
          if (uncertainty) return null;
          uncertainty = value;
        } else {
          return null;
        }
      }
    }

    try {
      const data = parseInput({
        latitude,
        longitude,
        altitude: altitude ?? "",
        uncertainty,
      });
      return { id: "location", data };
    } catch {
      return null;
    }
  },
};

export const locationPayloadDefinition: PayloadDefinition<LocationPayloadData> = {
  id: "location",
  label: "Location",
  description: "Encode a standards-based WGS-84 geo: location.",
  category: "popular",
  sampleInput: {
    latitude: "30.0444",
    longitude: "31.2357",
    altitude: "",
    uncertainty: "",
  } satisfies LocationPayloadInput,
  codec: locationCodec,
};
