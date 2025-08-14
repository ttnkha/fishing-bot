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
  return message.reply(
    `Cần: ${userData.rod.name} | Mồi: ${baits.length > 0 ? baits.map((e) => `${e.name} (Số lượng: ${e.quantity})`).join(", ") : "Trống"} | Túi cá: ${inv.length > 0 ? inv.map((e) => `${e.name} (Số lượng: ${e.quantity})`).join(", ") : "Trống"} | Coins: ${userData.coins || 0}`
  );
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

async function showRodShop(message) {
  let shopText = messages.rodShopIntro;
  items.rods.forEach((r) => {
    shopText += `- Level ${r.level}: ${r.name} - Giá: ${r.price} coins\n`;
  });
  shopText += messages.rodShopUsage;
  message.reply(shopText);
}

module.exports = {
  handleStart,
  handleBag,
  handleUpgradeRod,
  showRodShop,
};
