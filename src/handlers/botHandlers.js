const items = require("@root/items.json");
const { getFish, getBait } = require("@logic/gameLogic");
const { saveData } = require("@services/dataStore");
const { messages } = require("@services/strings");
const { fishesByRarity } = require("@logic/fishData");
const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

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
  if (data[id].bait <= 0) {
    return message.reply(messages.noBait);
  }

  const rod = data[id].rod;
  const bait = data[id].bait.pop();

  const { type, fish } = getFish(rod.code, bait.rarity, fishesByRarity);

  if (type === "miss") {
    await saveData(data);
    return message.reply(messages.miss);
  }

  data[id].inventory.push(fish);
  await saveData(data);
  return message.reply(messages.caughtFish(fish.name));
}

async function handleBag(message, data, id) {
  if (!data[id]) {
    return message.reply(messages.notStarted);
  }

  const inv = data[id].inventory;
  return message.reply(
    `Cần: ${data[id].rod.name} | Mồi: ${data[id].bait.length} | Túi cá: ${inv.length > 0 ? inv.map((e) => e.name).join(", ") : "Trống"} | Coins: ${data[id].coins || 0}`
  );
}

async function handleSellFish(message, data, id, fishName) {
  if (!data[id]) {
    return message.reply(messages.notStarted);
  }

  const inventory = data[id].inventory || [];
  const fishIndex = inventory.findIndex(
    (fish) => fish.name.toLowerCase() === fishName.toLowerCase()
  );

  if (fishIndex === -1) {
    return message.reply(messages.noFishInBag(fishName));
  }

  // Find fish price from items.json (ensure price property exists)
  const fishItem = items.fishes.find((fish) => fish.name.toLowerCase() === fishName.toLowerCase());
  if (!fishItem) {
    return message.reply(messages.notFoundFish(fishName));
  }

  // Remove fish from inventory
  inventory.splice(fishIndex, 1);

  // Add coins to player (default 0 if undefined)
  data[id].coins = (data[id].coins || 0) + (fishItem.price || 0);

  await saveData(data);

  return message.reply(messages.sellSuccess(fishItem.name, fishItem.price));
}

async function promptUserToSellFish(interaction, data, id) {
  const inv = data[id]?.inventory || [];
  if (inv.length === 0) {
    return interaction.reply(messages.noFishToSell);
  }

  const options = inv.slice(0, 25).map((fish, idx) => ({
    label: fish.name,
    value: `${idx}`,
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId("sell-fish-select")
    .setPlaceholder("Chọn cá để bán")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    content: messages.selectFishToSell,
    components: [row],
    ephemeral: true,
  });

  const collector = interaction.channel.createMessageComponentCollector({
    componentType: 3,
    time: 30000,
    filter: (i) => i.user.id === (interaction.user?.id ?? interaction.author?.id),
  });

  collector.once("collect", async (i) => {
    const index = parseInt(i.values[0], 10);
    const selectedFish = inv[index];
    await handleSellFish(i, data, id, selectedFish.name);
  });

  collector.once("end", async (_, reason) => {
    if (reason === "time") {
      await interaction.editReply({
        content: messages.sellTimeout,
        components: [],
      });
    }
  });
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
  handleSellFish,
  promptUserToSellFish,
  handleUpgradeRod,
  showRodShop,
};
