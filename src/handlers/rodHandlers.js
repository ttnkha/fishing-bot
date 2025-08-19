const items = require("@root/items.json");
const { saveData } = require("@services/data");
const { messages } = require("@services/strings");
const { getRepairCost } = require("@handlers/utils");

async function handleUpgradeRod(message, userData, userId) {
  if (!userData) return message.reply("User data not found.");

  const rods = items.rods;
  const nextRod = rods.find((r) => r.level === userData.rod.level + 1);

  if (!nextRod) return message.reply(messages.alreadyMaxRod);

  if (userData.coins < nextRod.price) {
    return message.reply(messages.notEnoughCoins(nextRod.price - userData.coins));
  }

  // Deduct coins and upgrade rod level
  userData.coins -= nextRod.price;
  userData.rod = nextRod;

  await saveData(userId, userData); // your save function

  message.reply(messages.upgradeSuccess(nextRod.name, nextRod.price));
}

async function fixRod(message, userData, userId) {
  const rod = userData?.rod;

  if (!rod) {
    return message.reply("❌ Bạn chưa có cần câu để sửa.");
  }

  if (!rod.broken) {
    return message.reply(messages.rodRepairNotBroken);
  }

  const repairCost = getRepairCost(rod);

  if ((userData.coins || 0) < repairCost) {
    return message.reply(messages.rodRepairNotEnoughCoins(repairCost));
  }

  userData.coins -= repairCost;
  rod.broken = false;
  rod.durability = 100;

  await saveData(userId, userData);

  return message.reply(messages.rodRepairSuccess);
}

module.exports = {
  handleUpgradeRod,
  fixRod,
};
