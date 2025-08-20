const { getFish } = require("@logic/gameLogic");
const { saveData } = require("@services/data");
const { messages } = require("@services/strings");
const { fishesByRarity } = require("@logic/itemsByRarity");
const { StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require("discord.js");
const { HOOK_COOLDOWN_MS } = require("@config/constants");
const { getCooldownRemaining, setUserCooldown } = require("@services/cooldowns.js");
const { createCooldownEmbed } = require("@services/cooldownEmbed");

async function promptUserToSelectBait(interaction, userData, id) {
  const cooldownRemaining = await getCooldownRemaining(id, "hook", HOOK_COOLDOWN_MS);
  if (cooldownRemaining > 0) {
    const embed = createCooldownEmbed(HOOK_COOLDOWN_MS, cooldownRemaining);
    return interaction.editReply({ embeds: [embed] });
  }

  const baits = userData?.bait || [];
  if (baits.length === 0) {
    return interaction.editReply("Bạn không có mồi nào để câu.");
  }

  const rod = userData.rod;
  if (!rod) {
    return interaction.editReply("Bạn chưa có cần câu.");
  }

  if (rod.broken) {
    return interaction.editReply(
      "Cần câu của bạn đã bị gãy. Hãy sửa nó trước khi tiếp tục câu cá."
    );
  }

  if (rod.level > 1) {
    rod.durability = rod.durability ?? 100;
    if (rod.durability <= 0) {
      rod.broken = true;
      await saveData(id, userData);
      return interaction.editReply("Cần câu của bạn đã bị gãy!");
    }
  }

  const options = baits.map((bait, idx) => ({
    label: `${bait.name} x${bait.quantity} [Độ hiếm: ${bait.rarity}]`,
    value: `${idx}`,
  }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId("select-bait")
    .setPlaceholder("Chọn mồi câu")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.editReply({
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
    await module.exports.handleHook(i, userData, id, baitIndex);
  });

  collector.once("end", (_, reason) => {
    if (reason === "time") {
      interaction
        .editReply({ content: "Hết thời gian chọn mồi câu.", components: [] })
        .catch(() => {});
    }
  });
}

async function handleHook(interaction, userData, id, baitIndex) {
  if (!userData) {
    return interaction.reply(messages.notStarted);
  }

  const baitList = userData.bait || [];
  if (baitIndex === undefined || baitIndex < 0 || baitIndex >= baitList.length) {
    return interaction.reply("Mồi câu không hợp lệ hoặc chưa chọn.");
  }

  await setUserCooldown(id, "hook", Date.now());

  const rod = userData.rod;
  const bait = baitList[baitIndex];
  const { type, fish } = getFish(rod.code, bait.rarity, fishesByRarity);

  // Decrease quantity of the used bait by 1
  baitList[baitIndex].quantity -= 1;

  // If quantity is zero or less, remove the bait from the list
  if (baitList[baitIndex].quantity <= 0) {
    baitList.splice(baitIndex, 1);
  }

  if (type === "miss") {
    await saveData(id, userData);
    return interaction.reply(messages.miss);
  }

  // Add or increment fish in inventory
  const inventory = userData.inventory || [];
  const existingFish = inventory.find((f) => f.name === fish.name);
  if (existingFish) {
    existingFish.quantity += 1;
  } else {
    fish.quantity = 1;
    inventory.push(fish);
  }
  userData.inventory = inventory;

  rod.durability -= 10;
  await saveData(id, userData);
  return interaction.reply(messages.caughtFish(fish.name));
}

module.exports = {
  promptUserToSelectBait,
  handleHook,
};
