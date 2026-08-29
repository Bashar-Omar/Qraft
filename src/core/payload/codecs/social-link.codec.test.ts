import { describe, expect, it } from "vitest";

import { socialLinkCodec } from "@/core/payload/codecs/social-link.codec";
import { PayloadValidationError } from "@/core/payload/payload";

describe("socialLinkCodec", () => {
  it("builds a canonical X profile URL from a handle", () => {
    const data = socialLinkCodec.parseInput({ platform: "x", target: "@OpenAI" });

    expect(data).toEqual({
      platform: "x",
      destination: "https://x.com/OpenAI",
      host: "x.com",
      source: "identifier",
    });
    expect(socialLinkCodec.encode(data)).toBe("https://x.com/OpenAI");
  });

  it("builds common Instagram, TikTok and Facebook profile URLs from identifiers", () => {
    expect(
      socialLinkCodec.encode(
        socialLinkCodec.parseInput({ platform: "instagram", target: "qraft.demo" }),
      ),
    ).toBe("https://www.instagram.com/qraft.demo/");
    expect(
      socialLinkCodec.encode(
        socialLinkCodec.parseInput({ platform: "tiktok", target: "@qraft.demo" }),
      ),
    ).toBe("https://www.tiktok.com/@qraft.demo");
    expect(
      socialLinkCodec.encode(
        socialLinkCodec.parseInput({ platform: "facebook", target: "qraft.demo" }),
      ),
    ).toBe("https://www.facebook.com/qraft.demo");
  });

  it("percent-encodes an international YouTube handle instead of assuming ASCII", () => {
    const data = socialLinkCodec.parseInput({ platform: "youtube", target: "@قناة" });

    expect(data.destination).toBe(`https://www.youtube.com/@${encodeURIComponent("قناة")}`);
    expect(data.source).toBe("identifier");
  });

  it("builds LinkedIn shorthand as a public /in/ profile URL", () => {
    const data = socialLinkCodec.parseInput({ platform: "linkedin", target: "avery-morgan" });

    expect(data.destination).toBe("https://www.linkedin.com/in/avery-morgan");
  });

  it("preserves a full supported HTTPS social URL after local host validation", () => {
    const destination = "https://ca.linkedin.com/in/avery-morgan?trk=public_profile";
    const data = socialLinkCodec.parseInput({ platform: "linkedin", target: destination });

    expect(data).toEqual({
      platform: "linkedin",
      destination,
      host: "ca.linkedin.com",
      source: "url",
    });
  });

  it("rejects platform mismatches, unknown hosts and non-HTTPS URLs", () => {
    for (const input of [
      { platform: "x", target: "https://www.instagram.com/qraft/" },
      { platform: "youtube", target: "https://example.com/@qraft" },
      { platform: "tiktok", target: "http://www.tiktok.com/@qraft" },
    ] as const) {
      expect(() => socialLinkCodec.parseInput(input)).toThrow(PayloadValidationError);
    }
  });

  it("rejects credentials, custom ports and bare platform homepages", () => {
    for (const target of [
      "https://user:secret@x.com/qraftdemo",
      "https://x.com:8443/qraftdemo",
      "https://x.com/",
    ]) {
      expect(() => socialLinkCodec.parseInput({ platform: "x", target })).toThrow(
        PayloadValidationError,
      );
    }
  });

  it("applies documented X handle grammar and conservative identifier parsing", () => {
    for (const target of ["abc", "name-with-dash", "name with space", "name/path"]) {
      expect(() => socialLinkCodec.parseInput({ platform: "x", target })).toThrow(
        PayloadValidationError,
      );
    }
  });

  it("detects supported social HTTPS hosts without swallowing normal web URLs", () => {
    expect(socialLinkCodec.inspect("https://www.tiktok.com/@scout2015")).toMatchObject({
      id: "social",
      data: { platform: "tiktok", host: "www.tiktok.com", source: "url" },
    });
    expect(socialLinkCodec.inspect("https://www.youtube.com/@youtubecreators")).toMatchObject({
      id: "social",
      data: { platform: "youtube" },
    });
    expect(socialLinkCodec.inspect("https://example.com/profile/qraft")).toBeNull();
    expect(socialLinkCodec.inspect(" https://x.com/qraftdemo ")).toBeNull();
  });
});
