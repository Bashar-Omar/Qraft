import { describe, expect, it } from "vitest";

import { escapeWifiValue, wifiCodec } from "@/core/payload/codecs/wifi.codec";
import { PayloadValidationError } from "@/core/payload/payload";

describe("wifiCodec", () => {
  it("encodes a protected network with the common Wi-Fi QR syntax", () => {
    const data = wifiCodec.parseInput({
      ssid: "Qraft Lab",
      security: "WPA",
      password: "example-only",
      hidden: false,
    });

    expect(wifiCodec.encode(data)).toBe("WIFI:T:WPA;S:Qraft Lab;P:example-only;;");
  });

  it("escapes reserved Wi-Fi payload characters", () => {
    expect(escapeWifiValue('foo;bar\\baz,:"')).toBe('foo\\;bar\\\\baz\\,\\:\\"');

    const data = wifiCodec.parseInput({
      ssid: 'foo;bar\\baz,:"',
      security: "WPA",
      password: 'pass;word\\,:"',
      hidden: true,
    });
    const payload = wifiCodec.encode(data);

    expect(wifiCodec.inspect(payload)?.data).toEqual(data);
  });

  it("omits password data for open networks", () => {
    const data = wifiCodec.parseInput({
      ssid: "Guest",
      security: "nopass",
      password: "should-not-leak",
      hidden: false,
    });

    expect(data.password).toBe("");
    expect(wifiCodec.encode(data)).toBe("WIFI:T:nopass;S:Guest;;");
  });

  it("includes the hidden flag only when enabled", () => {
    const data = wifiCodec.parseInput({
      ssid: "Hidden Lab",
      security: "WEP",
      password: "legacy-key",
      hidden: true,
    });

    expect(wifiCodec.encode(data)).toBe("WIFI:T:WEP;S:Hidden Lab;P:legacy-key;H:true;;");
  });

  it("enforces the 32-byte SSID boundary", () => {
    expect(() =>
      wifiCodec.parseInput({
        ssid: "é".repeat(17),
        security: "WPA",
        password: "example-only",
        hidden: false,
      }),
    ).toThrow(PayloadValidationError);
  });
});
