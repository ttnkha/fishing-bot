const items = require("@root/items.json");
const { getFish, getBait } = require("@logic/gameLogic");
const { saveData } = require("@services/dataStore");
const { messages } = require("@services/strings");
const { fishesByRarity } = require("@logic/fishData");

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

async function handleDig(message, data, id) {
  if (!data[id]) {
    return message.reply(messages.notStarted);
  }

  const roll = Math.random() * 100;
  const { type, bait, trash } = getBait(items, roll);

  switch (type) {
    case "common":
      data[id].bait.push(bait);
      await saveData(data);
      return message.reply(messages.foundBait(bait));
    case "trash":
      return message.reply(messages.foundTrash(trash));
    case "rare":
      data[id].bait.push(bait);
      await saveData(data);
      return message.reply(messages.foundRareBait(bait));
  }
}

async function handleHook(message, data, id) {
  if (!data[id]) {
    return message.reply(messages.notStarted);
  }

  if (data[id].bait.length <= 0) {
    return message.reply(messages.noBait);
  }

  const rod = data[id].rod;
  const bait = data[id].bait.pop();

  const { type, fish } = getFish(rod.code, bait.rarity, fishesByRarity);

  if (type === "miss") {
    await saveData(data);
    return message.reply(messages.miss);
  }

  // 🐟 Check if fish already exists in inventory
  const inventory = data[id].inventory || [];
  const existingFish = inventory.find((f) => f.name === fish.name);

  if (existingFish) {
    existingFish.quantity += 1;
  } else {
    fish.quantity = 1;
    inventory.push(fish);
  }

  data[id].inventory = inventory;
  await saveData(data);

  return message.reply(messages.caughtFish(fish.name));
}

async function handleBag(message, data, id) {
  if (!data[id]) {
    return message.reply(messages.notStarted);
  }

  const inv = data[id].inventory;
  return message.reply(
    `Cần: ${data[id].rod.name} | Mồi: ${data[id].bait.length} | Túi cá: ${inv.length > 0 ? inv.map((e) => `${e.name} (Số lượng: ${e.quantity})`).join(", ") : "Trống"} | Coins: ${data[id].coins || 0}`
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
  handleDig,
  handleHook,
  handleBag,
  handleUpgradeRod,
  showRodShop,
};
