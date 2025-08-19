const items = require("@root/items.json");
const { saveData } = require("@services/data");
const { messages } = require("@services/strings");

async function handleStart(message, userData, userId) {
  if (userData) {
    return message.reply(messages.alreadyStarted);
  }
  userData = {
    rod: items.rods[0],
    bait: [],
    inventory: [],
    coins: 0,
  };
  await saveData(userId, userData);
  return message.reply(messages.startSuccess);
}

async function handleBag(message, userData) {
  if (!userData) {
    return message.reply(messages.notStarted);
  }

  const inv = userData.inventory;
  const baits = userData.bait;
  const rod = userData.rod;

  const rodStatus = `🪝 Cần: ${rod.name}${rod.broken ? " ❌ Hỏng" : ""} (🔧 Độ bền: ${rod.durability ?? 100})`;
  const baitStatus = `🪱 Mồi: ${baits.length > 0 ? baits.map((e) => `${e.name} (🎯 ${e.quantity})`).join(", ") : "Trống"}`;
  const invStatus = `🐟 Túi cá: ${inv.length > 0 ? inv.map((e) => `${e.name} (🎯 ${e.quantity})`).join(", ") : "Trống"}`;
  const coinStatus = `💰 Coins: ${userData.coins || 0}`;

  const statusMessage = `🎒 Túi đồ của bạn gồm:\n${rodStatus}\n${baitStatus}\n${invStatus}\n${coinStatus}`;

  return message.reply(statusMessage);
}

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

module.exports = {
  handleStart,
  handleBag,
  handleUpgradeRod,
};
