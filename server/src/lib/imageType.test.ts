import { describe, expect, it } from "vitest";
import { detectImageType } from "./imageType.js";

const padding = Buffer.alloc(16);

describe("detectImageType", () => {
  it.each([
    { name: "a JPEG", bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0]), type: "jpeg" },
    {
      name: "a PNG",
      bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      type: "png",
    },
    {
      name: "a WebP",
      bytes: Buffer.from("RIFF\u0000\u0000\u0000\u0000WEBP", "latin1"),
      type: "webp",
    },
  ])("recognizes $name", ({ bytes, type }) => {
    expect(detectImageType(Buffer.concat([bytes, padding]))).toBe(type);
  });

  it.each([
    { name: "an SVG with a script", bytes: Buffer.from('<svg onload="alert(1)"></svg>') },
    { name: "a GIF", bytes: Buffer.from("GIF89a") },
    { name: "a text file", bytes: Buffer.from("this is not an image at all") },
  ])("refuses $name", ({ bytes }) => {
    expect(detectImageType(Buffer.concat([bytes, padding]))).toBeNull();
  });
});
