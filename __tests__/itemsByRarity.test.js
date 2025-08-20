const { groupByRarity } = require("@logic/itemsByRarity");

describe("groupByRarity", () => {
  it("should group items by rarity", () => {
    const input = [
      { name: "Cá thường", rarity: 1 },
      { name: "Cá hiếm", rarity: 2 },
      { name: "Cá huyền thoại", rarity: 3 },
      { name: "Cá khác", rarity: 2 },
    ];

    const result = groupByRarity(input);

    expect(result).toEqual({
      1: [{ name: "Cá thường", rarity: 1 }],
      2: [
        { name: "Cá hiếm", rarity: 2 },
        { name: "Cá khác", rarity: 2 },
      ],
      3: [{ name: "Cá huyền thoại", rarity: 3 }],
    });
  });

  it("should return an empty object for empty input", () => {
    expect(groupByRarity([])).toEqual({});
  });

  it("should convert rarity to string keys", () => {
    const input = [{ name: "Test", rarity: 5 }];
    const result = groupByRarity(input);
    expect(Object.keys(result)).toEqual(["5"]);
  });

  it("should handle items missing rarity field (skip them)", () => {
    const input = [
      { name: "Valid", rarity: 1 },
      { name: "No rarity" }, // Should be ignored or handled
    ];

    const result = groupByRarity(input);

    expect(result).toEqual({
      1: [{ name: "Valid", rarity: 1 }],
      undefined: [{ name: "No rarity" }], // depends on how strict you want to be
    });
  });
});
