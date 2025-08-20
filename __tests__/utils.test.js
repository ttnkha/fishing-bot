const { toCumulativeThresholds, formatTimeGMT7, getRepairCost } = require("@handlers/utils");

describe("toCumulativeThresholds", () => {
  it("should convert rates to cumulative thresholds", () => {
    const input = [
      { level: 1, rate: 10 },
      { level: 2, rate: 20 },
      { level: 3, rate: 30 },
    ];

    const result = toCumulativeThresholds(input);
    expect(result).toEqual([
      { level: 1, rate: 10, max: 10 },
      { level: 2, rate: 20, max: 30 },
      { level: 3, rate: 30, max: 60 },
    ]);
  });

  it("should handle empty array", () => {
    const result = toCumulativeThresholds([]);
    expect(result).toEqual([]);
  });
});

describe("formatTimeGMT7", () => {
  it("should format time correctly in GMT+7 timezone", () => {
    // Create a Date for UTC: 2023-01-01T00:00:00Z
    const date = new Date(Date.UTC(2023, 0, 1, 0, 0, 0));
    // GMT+7 time would be 07:00
    const formatted = formatTimeGMT7(date);
    expect(formatted).toBe("07:00");
  });

  it("should pad hours and minutes with zero", () => {
    // Create a date that corresponds to 1:05 GMT+7 (UTC -6:55)
    const date = new Date(Date.UTC(2023, 0, 1, 18, 5, 0)); // 18:05 UTC = 01:05 GMT+7 next day
    const formatted = formatTimeGMT7(date);
    expect(formatted).toBe("01:05");
  });
});

describe("getRepairCost", () => {
  it("should calculate repair cost as rod level times 100", () => {
    expect(getRepairCost({ level: 1 })).toBe(100);
    expect(getRepairCost({ level: 5 })).toBe(500);
    expect(getRepairCost({ level: 0 })).toBe(0);
  });
});
