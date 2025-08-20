const items = require("@root/items.json");
const { saveData } = require("@services/data");
const { messages } = require("@services/strings");

async function handleStart(message, userData, userId) {
  if (userData) {
    return message.editReply(messages.alreadyStarted);
  }
  userData = {
    rod: items.rods[0],
    bait: [],
    inventory: [],
    coins: 0,
  };
  await saveData(userId, userData);
  return message.editReply(messages.startSuccess);
}

async function handleBag(message, userData) {
  if (!userData) {
    return message.editReply(messages.notStarted);
  }

  const inv = userData.inventory;
  const baits = userData.bait;
  const rod = userData.rod;

  const rodStatus = `🪝 Cần: ${rod.name}${rod.broken ? " ❌ Hỏng" : ""} (🔧 Độ bền: ${rod.durability ?? 100})`;

  const baitStatus =
    baits.length > 0
      ? `🪱 Mồi:\n${baits.map((e) => `– ${e.name} x${e.quantity}`).join("\n")}`
      : "🪱 Mồi: Trống";

  const invStatus =
    inv.length > 0
      ? `🐟 Túi cá:\n${inv.map((e) => `– ${e.name} x${e.quantity}`).join("\n")}`
      : "🐟 Túi cá: Trống";

  const coinStatus = `💰 Coins: ${userData.coins || 0}`;

  const statusMessage = `🎒 Túi đồ của bạn gồm:\n${rodStatus}\n${baitStatus}\n${invStatus}\n${coinStatus}`;

  return message.editReply(statusMessage);
}

module.exports = {
  handleStart,
  handleBag,
};
