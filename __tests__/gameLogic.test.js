jest.mock("@handlers/utils", () => ({
  toCumulativeThresholds: jest.fn(),
}));

const { getBait, getFish } = require("@logic/gameLogic");
const { toCumulativeThresholds } = require("@handlers/utils");

// Mock data
const fakeTrash = [{ name: "Lon bia" }, { name: "Giày cũ" }];
const fakeBaits = {
  1: [{ name: "Trùng đất" }],
  2: [{ name: "Mồi cá nhỏ" }],
  3: [{ name: "Mồi hiếm" }],
};

const fakeFishes = {
  1: [{ name: "Cá trê" }],
  2: [{ name: "Cá lóc" }],
  3: [{ name: "Cá mập" }],
};

const rodRarityRates = {
  wood: { 1: 1, 2: 0.5, 3: 0.2 },
};

const baitModifiers = {
  common: 1,
  rare: 1.5,
};

const fishLevelRates = {
  1: 50,
  2: 30,
  3: 20,
};

const missChances = {
  wood: 0.2,
};

// 🧪 TEST getBait
describe("getBait", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return trash when outcome is -1", () => {
    toCumulativeThresholds.mockReturnValue([{ rarity: -1, max: 100 }]);

    const result = getBait({ trash: fakeTrash }, 50);
    expect(result.type).toBe("trash");
    expect(fakeTrash).toContainEqual(result.trash);
  });

  it("should return common bait when rarity <= 2", () => {
    toCumulativeThresholds.mockReturnValue([{ rarity: 2, max: 100 }]);

    const result = getBait({ trash: fakeTrash }, 50);
    expect(result.type).toBe("common");
  });

  it("should return rare bait when rarity > 2", () => {
    toCumulativeThresholds.mockReturnValue([{ rarity: 3, max: 100 }]);

    const result = getBait({ trash: fakeTrash }, 50);
    expect(result.type).toBe("rare");
  });
});

// 🧪 TEST getFish
describe("getFish", () => {
  beforeEach(() => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.5);
    toCumulativeThresholds.mockImplementation((rates) => {
      let max = 0;
      return rates.map((r) => {
        max += r.rate || r.max;
        return { ...r, max };
      });
    });
  });

  afterEach(() => {
    jest.spyOn(global.Math, "random").mockRestore();
  });

  it("should return miss if miss chance is met", () => {
    jest.spyOn(Math, "random").mockReturnValueOnce(0.1); // below missChances.wood = 0.2

    const result = getFish("wood", "common", fakeFishes);
    expect(result).toEqual({ type: "miss" });
  });

  it("should return fish based on calculated rarity", () => {
    // Force random() > miss chance
    jest.spyOn(Math, "random").mockReturnValueOnce(0.5); // not a miss
    jest.spyOn(Math, "random").mockReturnValue(0.3); // to hit level 1 fish

    const result = getFish("wood", "common", fakeFishes);
    expect(result.type).toBe("fish");
    expect(fakeFishes[1]).toContainEqual(result.fish);
  });

  it("should handle missing fishLevelRates and default baseRate to 0", () => {
    // mock Math.random to bypass miss
    jest.spyOn(Math, "random").mockReturnValueOnce(0.5); // > miss chance

    // mock thresholds
    toCumulativeThresholds.mockImplementation((rates) => {
      let max = 0;
      return rates.map((r) => {
        max += r.rate || r.max;
        return { ...r, max };
      });
    });

    const fakeFishes = {
      5: [{ name: "Cá ẩn" }],
    };

    // this rarity level (5) is missing in fishLevelRates
    const result = getFish("wood", "common", fakeFishes);

    expect(result).toEqual({
      type: "fish",
      fish: null,
    });
  });

  it("should handle missing rodRates and default rodRate to 1", () => {
    jest.spyOn(Math, "random").mockReturnValueOnce(0.5); // not a miss

    const fakeFishes = {
      1: [{ name: "Cá mặc định" }],
    };

    // use rodCode that does not exist in rodRarityRates
    const result = getFish("unknownRod", "common", fakeFishes);

    expect(result.type).toBe("fish");
    expect(fakeFishes[1]).toContainEqual(result.fish);
  });
});
