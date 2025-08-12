const { getBait, getFish } = require("@logic/gameLogic");

const mockItems = {
  baits: [{ name: "Bait1" }, { name: "Bait2" }],
  trash: [{ name: "Trash1" }, { name: "Trash2" }],
  fishes: {
    1: [{ name: "Fish1" }, { name: "Fish2" }],
    2: [{ name: "Fish3" }, { name: "Fish4" }],
    3: [{ name: "Fish5" }],
    4: [{ name: "Fish6" }],
    5: [{ name: "Fish7" }],
    special: [{ name: "FishSpecial" }],
  },
};

describe("getBait", () => {
  // We mock Math.random to control randomness

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns common bait when roll < 60", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5); // for getRandomItem
    const result = getBait(mockItems, 59);
    expect(result.type).toBe("common");
    expect(mockItems.baits).toContain(result.bait);
  });

  test("returns trash when 60 <= roll < 85", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5); // for getRandomItem
    const result = getBait(mockItems, 80);
    expect(result.type).toBe("trash");
    expect(mockItems.trash).toContain(result.trash);
  });

  test("returns rare bait when roll >= 85", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5); // for getRandomItem
    const result = getBait(mockItems, 90);
    expect(result.type).toBe("rare");
    expect(mockItems.baits).toContain(result.bait);
  });
});

describe("getFish", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("returns miss if random < missChance", () => {
    jest
      .spyOn(Math, "random")
      .mockImplementationOnce(() => 0.01) // for missChance check
      .mockImplementationOnce(() => 0); // fallback random for roll won't matter here
    expect(getFish("wood", mockItems)).toEqual({ type: "miss" });

    jest.spyOn(Math, "random").mockImplementationOnce(() => 0.14);
    expect(getFish("iron", mockItems)).toEqual({ type: "miss" });
  });

  test("returns fish for various roll levels", () => {
    const rod = "gold";

    // Roll for level 1 (<60)
    jest
      .spyOn(Math, "random")
      .mockImplementationOnce(() => 0.01)
      .mockImplementationOnce(() => 0.59)
      .mockImplementationOnce(() => 0);

    let result = getFish(rod, mockItems.fishes);
    expect(result.type).toBe("fish");
    expect(mockItems.fishes["1"]).toContain(result.fish);

    // Reset mocks for level 2
    jest
      .spyOn(Math, "random")
      .mockImplementationOnce(() => 0.01)
      .mockImplementationOnce(() => 0.75)
      .mockImplementationOnce(() => 0);

    result = getFish(rod, mockItems.fishes);
    expect(result.type).toBe("fish");
    expect(mockItems.fishes["2"]).toContain(result.fish);

    // Level 3
    jest
      .spyOn(Math, "random")
      .mockImplementationOnce(() => 0.01)
      .mockImplementationOnce(() => 0.85)
      .mockImplementationOnce(() => 0);

    result = getFish(rod, mockItems.fishes);
    expect(result.type).toBe("fish");
    expect(mockItems.fishes["3"]).toContain(result.fish);

    // Level 4
    jest
      .spyOn(Math, "random")
      .mockImplementationOnce(() => 0.01)
      .mockImplementationOnce(() => 0.95)
      .mockImplementationOnce(() => 0);

    result = getFish(rod, mockItems.fishes);
    expect(result.type).toBe("fish");
    expect(mockItems.fishes["4"]).toContain(result.fish);

    // Level 5
    jest
      .spyOn(Math, "random")
      .mockImplementationOnce(() => 0.01)
      .mockImplementationOnce(() => 0.994)
      .mockImplementationOnce(() => 0);

    result = getFish(rod, mockItems.fishes);
    expect(result.type).toBe("fish");
    expect(mockItems.fishes["5"]).toContain(result.fish);

    // Special level
    jest
      .spyOn(Math, "random")
      .mockImplementationOnce(() => 0.01)
      .mockImplementationOnce(() => 0.999)
      .mockImplementationOnce(() => 0);

    result = getFish(rod, mockItems.fishes);
    expect(result.type).toBe("fish");
    expect(mockItems.fishes["special"]).toContain(result.fish);
  });
});
