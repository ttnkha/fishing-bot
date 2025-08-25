const items = require("@root/items.json");
const { saveData } = require("@services/data");
const { messages } = require("@services/strings");
const { getRepairCost } = require("@handlers/utils");

async function handleUpgradeRod(message, userData, userId) {
  if (!userData) return message.editReply("User data not found.");

  const rods = items.rods;
  const nextRod = rods.find((r) => r.level === (userData.rod?.level ?? 0) + 1);

  if (!nextRod) return message.editReply(messages.alreadyMaxRod);

  if (userData.coins < nextRod.price) {
    return message.editReply(messages.notEnoughCoins(nextRod.price - userData.coins));
  }

  // Deduct coins and upgrade rod level
  userData.coins -= nextRod.price;
  userData.rod = nextRod;

  await saveData(userId, userData); // your save function

  message.editReply(messages.upgradeSuccess(nextRod.name, nextRod.price));
}

async function fixRod(message, userData, userId) {
  const rod = userData?.rod;

  if (!rod) {
    return message.editReply("❌ Bạn chưa có cần câu để sửa.");
  }

  if (!rod.broken) {
    return message.editReply(messages.rodRepairNotBroken);
  }

  const repairCost = getRepairCost(rod);

  if ((userData.coins || 0) < repairCost) {
    return message.editReply(messages.rodRepairNotEnoughCoins(repairCost));
  }

  userData.coins -= repairCost;

  const rods = items.rods;
  const rodInfo = rods.find((r) => r.code === rod.code);
  const repairChance = rodInfo?.repairChance ?? 1;

  const success = Math.random() < repairChance;

  if (success) {
    rod.broken = false;
    rod.durability = 100;
    await saveData(userId, userData);
    return message.editReply(messages.rodRepairSuccess);
  } else {
    delete userData.rod;
    await saveData(userId, userData);
    return message.editReply(
      "💥 Sửa thất bại! Cần câu của bạn đã bị hỏng hoàn toàn và không thể phục hồi."
    );
  }
}

module.exports = {
  handleUpgradeRod,
  fixRod,
};
