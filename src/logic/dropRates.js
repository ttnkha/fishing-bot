module.exports = {
  baitDropRates: [
    { type: "common", rate: 60 },
    { type: "trash", rate: 25 },
    { type: "rare", rate: 15 },
  ],
  fishLevelRates: {
    1: 60,
    2: 20,
    3: 10,
    4: 8,
    5: 1.5,
    6: 0.5,
  },
  missChances: {
    wood: 0.3,
    iron: 0.15,
    titan: 0.05,
    gold: 0.01,
  },
  baitModifiers: {
    1: 1.0,
    2: 1.2,
    3: 1.5,
  },
  rodRarityRates: {
    wood: { 1: 80, 2: 15, 3: 5, 4: 0, 5: 0, 6: 0 },
    iron: { 1: 60, 2: 25, 3: 10, 4: 5, 5: 0, 6: 0 },
    titan: { 1: 40, 2: 30, 3: 15, 4: 10, 5: 5, 6: 0 },
    gold: { 1: 20, 2: 30, 3: 25, 4: 15, 5: 7, 6: 3 },
  },
};
