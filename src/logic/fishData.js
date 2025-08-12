const items = require("@root/items.json");

function groupByRarity(fishes) {
  return fishes.reduce((acc, fish) => {
    const key = fish.rarity.toString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(fish);
    return acc;
  }, {});
}

const fishesByRarity = groupByRarity(items.fishes);

module.exports = {
  fishesByRarity,
};
