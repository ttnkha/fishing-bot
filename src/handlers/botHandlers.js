const items = require("@root/items.json");
const { saveData } = require("@services/dataStore");
const { messages } = require("@services/strings");

async function handleStart(message, data, id) {
  if (data[id]) {
    return message.reply(messages.alreadyStarted);
  }
  data[id] = {
    rod: items.rods[0],
    bait: [],
    inventory: [],
    coins: 0,
  };
  await saveData(data);
  return message.reply(messages.startSuccess);
}

async function handleBag(message, data, id) {
  if (!data[id]) {
    return message.reply(messages.notStarted);
  }

  const inv = data[id].inventory;
  const baits = data[id].bait;
  return message.reply(
    `Cần: ${data[id].rod.name} | Mồi: ${baits.length > 0 ? baits.map((e) => `${e.name} (Số lượng: ${e.quantity})`).join(", ") : "Trống"} | Túi cá: ${inv.length > 0 ? inv.map((e) => `${e.name} (Số lượng: ${e.quantity})`).join(", ") : "Trống"} | Coins: ${data[id].coins || 0}`
  );
}

async function handleUpgradeRod(message, data, userId) {
  const user = data[userId];
  if (!user) return message.reply("User data not found.");

  const rods = items.rods;
  const nextRod = rods.find((r) => r.level === user.rod.level + 1);

  if (!nextRod) return message.reply(messages.alreadyMaxRod);

  if (user.coins < nextRod.price) {
    return message.reply(messages.notEnoughCoins(nextRod.price - user.coins));
  }

  // Deduct coins and upgrade rod level
  user.coins -= nextRod.price;
  user.rod = nextRod;

  await saveData(data); // your save function

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
