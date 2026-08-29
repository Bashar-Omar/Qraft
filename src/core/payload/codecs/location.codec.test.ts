import { describe, expect, it } from "vitest";

import { locationCodec } from "@/core/payload/codecs/location.codec";

describe("Location payload", () => {
  it("encodes WGS-84 latitude and longitude as an RFC 5870 geo URI", () => {
    const data = locationCodec.parseInput({
      latitude: "30.0444",
      longitude: "31.2357",
      altitude: "",
      uncertainty: "",
    });

    expect(locationCodec.encode(data)).toBe("geo:30.0444,31.2357");
  });

  it("supports optional altitude and uncertainty", () => {
    const data = locationCodec.parseInput({
      latitude: "48.2010",
      longitude: "16.3695",
      altitude: "183",
      uncertainty: "40",
    });

    expect(locationCodec.encode(data)).toBe("geo:48.201,16.3695,183;u=40");
    expect(locationCodec.inspect("geo:48.201,16.3695,183;crs=wgs84;u=40")).toMatchObject({
      id: "location",
      data: { latitude: 48.201, longitude: 16.3695, altitude: 183, uncertainty: 40 },
    });
  });

  it("rejects coordinates outside the WGS-84 latitude/longitude ranges", () => {
    expect(() =>
      locationCodec.parseInput({ latitude: "91", longitude: "0", altitude: "", uncertainty: "" }),
    ).toThrow(/location/i);
    expect(() =>
      locationCodec.parseInput({ latitude: "0", longitude: "181", altitude: "", uncertainty: "" }),
    ).toThrow(/location/i);
  });

  it("rejects unknown geo URI parameters during inspection", () => {
    expect(locationCodec.inspect("geo:30,31;foo=bar")).toBeNull();
  });
});
