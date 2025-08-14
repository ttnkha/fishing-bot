const { getFish } = require("@logic/gameLogic");
const { saveData } = require("@services/dataStore");
const { messages } = require("@services/strings");
const { fishesByRarity } = require("@logic/itemsByRarity");
const { StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require("discord.js");
const { HOOK_COOLDOWN_MS } = require("@config/constants");
const { isOnCooldown, setUserCooldown } = require("@services/cooldownStore.js");

async function promptUserToSelectBait(interaction, data, id) {
  if (await isOnCooldown(id, "hook", HOOK_COOLDOWN_MS)) {
    return interaction.reply(messages.waitMessage);
  }

  const baits = data[id]?.bait || [];
  if (baits.length === 0) {
    return interaction.reply("Bạn không có mồi nào để câu.");
  }

  const options = baits.map((bait, idx) => ({
    label: `${bait.name} (Độ hiếm: ${bait.rarity}, Số lượng: ${bait.quantity})`,
    value: `${idx}`,
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId("select-bait")
    .setPlaceholder("Chọn mồi câu")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    content: "Chọn mồi câu bạn muốn sử dụng:",
    components: [row],
    flags: MessageFlags.Ephemeral,
  });

  const collector = interaction.channel.createMessageComponentCollector({
    componentType: 3, // select menu
    time: 30000,
    filter: (i) => i.user.id === id,
  });

  collector.once("collect", async (i) => {
    const baitIndex = parseInt(i.values[0], 10);

    // Pass the collected interaction, not the original one, to handleHook
    await handleHook(i, data, id, baitIndex);
  });

  collector.once("end", (_, reason) => {
    if (reason === "time") {
      interaction
        .editReply({ content: "Hết thời gian chọn mồi câu.", components: [] })
        .catch(() => {});
    }
  });
}

async function handleHook(interaction, data, id, baitIndex) {
  if (!data[id]) {
    return interaction.reply(messages.notStarted);
  }

  const baitList = data[id].bait || [];
  if (baitIndex === undefined || baitIndex < 0 || baitIndex >= baitList.length) {
    return interaction.reply("Mồi câu không hợp lệ hoặc chưa chọn.");
  }

  await setUserCooldown(id, "hook", Date.now());

  const bait = baitList[baitIndex];
  const rod = data[id].rod;

  const { type, fish } = getFish(rod.code, bait.rarity, fishesByRarity);

  // Decrease quantity of the used bait by 1
  baitList[baitIndex].quantity -= 1;

  // If quantity is zero or less, remove the bait from the list
  if (baitList[baitIndex].quantity <= 0) {
    baitList.splice(baitIndex, 1);
  }

  if (type === "miss") {
    await saveData(data);
    return interaction.reply(messages.miss);
  }

  // Add or increment fish in inventory
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

  return interaction.reply(messages.caughtFish(fish.name));
}

module.exports = {
  promptUserToSelectBait,
};
