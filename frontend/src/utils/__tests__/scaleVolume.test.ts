import { scaleVolume } from "../audioUtils";
describe("scaleVolume", () => {
  it("returns 0 for volume 0", () => {
    expect(scaleVolume(0)).toBe(0);
  });
  it("returns 1 for volume 100", () => {
    expect(scaleVolume(100)).toBe(1);
  });
  it("returns mid-range value", () => {
    const r = scaleVolume(50);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(1);
  });
  it("follows logarithmic curve", () => {
    expect(scaleVolume(75) - scaleVolume(50)).toBeGreaterThan(
      scaleVolume(50) - scaleVolume(25),
    );
  });
  it("matches formula", () => {
    expect(scaleVolume(60)).toBeCloseTo(1 - Math.log(40) / Math.log(100));
  });
});
