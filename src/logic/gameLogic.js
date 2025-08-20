const { toCumulativeThresholds } = require("../handlers/utils");
const {
  baitDropRates,
  missChances,
  rodRarityRates,
  baitModifiers,
  fishLevelRates,
} = require("./dropRates");
const { baitsByRarity } = require("./itemsByRarity");

function getRandomItem(arr) {
  if (!arr) {
    return null;
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

function getBait(items, roll) {
  const thresholds = toCumulativeThresholds(baitDropRates);
  const outcome = thresholds.find((t) => roll < t.max).rarity;

  if (outcome === -1) {
    return { type: "trash", trash: getRandomItem(items.trash) };
  }

  return { type: outcome <= 2 ? "common" : "rare", bait: getRandomItem(baitsByRarity[outcome]) };
}

function calculateFinalRates(rodCode, baitType) {
  const rodRates = rodRarityRates[rodCode];
  const modifier = baitModifiers[baitType] || 1;

  const adjustedRatesArray = [];
  let total = 0;

  for (const rarity in fishLevelRates) {
    const baseRate = fishLevelRates[rarity];
    const rodRate = rodRates?.[rarity] ?? 1; // nếu không có, lấy 1
    let rate = baseRate * rodRate;

    // Áp dụng modifier bait nếu rarity > 1
    if (parseInt(rarity) > 1) {
      rate *= modifier;
    }

    adjustedRatesArray.push({ level: parseInt(rarity), rate });
    total += rate;
  }

  // Chuẩn hóa để tổng là 100%
  return adjustedRatesArray.map((entry) => ({
    level: entry.level,
    rate: (entry.rate / total) * 100,
  }));
}

function getFish(rodCode, baitRarity, fishesByRarity) {
  if (Math.random() < missChances[rodCode]) {
    return { type: "miss" };
  }

  const finalRates = calculateFinalRates(rodCode, baitRarity);
  const thresholds = toCumulativeThresholds(finalRates);

  const roll = Math.random() * 100;
  const level = thresholds.find((t) => roll < t.max).level;

  return { type: "fish", fish: getRandomItem(fishesByRarity[level]) };
}

module.exports = {
  getBait,
  getFish,
};
