import { describe, expect, it } from "vitest";
import { formatTokenAmount, sleep } from "./utils";

describe("sleep", () => {
  it("should resolve after the specified time", async () => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();
    const elapsed = end - start;

    expect(elapsed).toBeGreaterThanOrEqual(95);
    expect(elapsed).toBeLessThan(150);
  });

  it("should use default 1000ms when no argument provided", async () => {
    const start = Date.now();
    await sleep();
    const end = Date.now();
    const elapsed = end - start;

    expect(elapsed).toBeGreaterThanOrEqual(995);
    expect(elapsed).toBeLessThan(1050);
  });

  it("should work with 0ms", async () => {
    const start = Date.now();
    await sleep(0);
    const end = Date.now();
    const elapsed = end - start;

    expect(elapsed).toBeLessThan(10);
  });
});

describe("formatTokenAmount", () => {
  describe("whole numbers (no fractional part)", () => {
    it("should format amounts with no fractional part", () => {
      expect(formatTokenAmount(1000000000000000000n, 18)).toBe("1");
      expect(formatTokenAmount(5000000000000000000n, 18)).toBe("5");
      expect(formatTokenAmount(1000000n, 6)).toBe("1");
    });

    it("should handle zero amount", () => {
      expect(formatTokenAmount(0n, 18)).toBe("0");
      expect(formatTokenAmount(0n, 6)).toBe("0");
    });

    it("should handle large whole numbers", () => {
      expect(formatTokenAmount(1000000000000000000000n, 18)).toBe("1000");
      expect(formatTokenAmount(123000000000000000000n, 18)).toBe("123");
    });
  });

  describe("fractional numbers", () => {
    it("should format amounts with fractional parts", () => {
      expect(formatTokenAmount(1500000000000000000n, 18)).toBe("1.5");
      expect(formatTokenAmount(1230000000000000000n, 18)).toBe("1.23");
      expect(formatTokenAmount(1234560000000000000n, 18)).toBe("1.23456");
    });

    it("should remove trailing zeros from fractional part", () => {
      expect(formatTokenAmount(1500000000000000000n, 18)).toBe("1.5");
      expect(formatTokenAmount(1100000000000000000n, 18)).toBe("1.1");
      expect(formatTokenAmount(1010000000000000000n, 18)).toBe("1.01");
    });

    it("should handle very small amounts", () => {
      expect(formatTokenAmount(1n, 18)).toBe("0.000000000000000001");
      expect(formatTokenAmount(100n, 18)).toBe("0.0000000000000001");
      expect(formatTokenAmount(1000000000000000n, 18)).toBe("0.001");
    });

    it("should handle amounts less than 1 with various decimals", () => {
      expect(formatTokenAmount(500000n, 6)).toBe("0.5");
      expect(formatTokenAmount(123456n, 6)).toBe("0.123456");
      expect(formatTokenAmount(100000n, 6)).toBe("0.1");
    });
  });

  describe("edge cases and different decimal places", () => {
    it("should work with different decimal configurations", () => {
      // USDC (6 decimals)
      expect(formatTokenAmount(1000000n, 6)).toBe("1");
      expect(formatTokenAmount(1500000n, 6)).toBe("1.5");

      // ETH (18 decimals)
      expect(formatTokenAmount(1000000000000000000n, 18)).toBe("1");
      expect(formatTokenAmount(1500000000000000000n, 18)).toBe("1.5");

      // BTC (8 decimals)
      expect(formatTokenAmount(100000000n, 8)).toBe("1");
      expect(formatTokenAmount(150000000n, 8)).toBe("1.5");
    });

    it("should handle 0 decimals", () => {
      expect(formatTokenAmount(123n, 0)).toBe("123");
      expect(formatTokenAmount(0n, 0)).toBe("0");
    });

    it("should handle 1 decimal place", () => {
      expect(formatTokenAmount(15n, 1)).toBe("1.5");
      expect(formatTokenAmount(10n, 1)).toBe("1");
      expect(formatTokenAmount(1n, 1)).toBe("0.1");
    });

    it("should handle maximum precision correctly", () => {
      const amount = 123456789012345678n; // 18 digits
      const result = formatTokenAmount(amount, 18);
      expect(result).toBe("0.123456789012345678");
    });

    it("should handle very large numbers", () => {
      const largeAmount = 123456789000000000000000n; // > 1000 tokens
      const result = formatTokenAmount(largeAmount, 18);
      expect(result).toBe("123456.789");
    });
  });

  describe("precision and rounding behavior", () => {
    it("should preserve exact precision without rounding", () => {
      expect(formatTokenAmount(1111111111111111111n, 18)).toBe("1.111111111111111111");
      expect(formatTokenAmount(9999999999999999999n, 18)).toBe("9.999999999999999999");
    });

    it("should handle amounts where fractional part starts with zeros", () => {
      expect(formatTokenAmount(1000000000000000001n, 18)).toBe("1.000000000000000001");
      expect(formatTokenAmount(1000000000000001000n, 18)).toBe("1.000000000000001");
    });
  });
});
