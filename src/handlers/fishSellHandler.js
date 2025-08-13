const items = require("@root/items.json");
const { saveData, loadData } = require("@services/dataStore");
const { messages } = require("@services/strings");
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { MessageFlags } = require("discord-api-types/v10");

// Helper: find fish item info by name
function findFishItemByName(fishName) {
  const fishNameLower = fishName.toLowerCase();
  return items.fishes.find((f) => f.name.toLowerCase() === fishNameLower);
}

// Helper: remove quantity of fish from inventory, remove fish entries if quantity reaches 0
function removeFishFromInventory(inventory, fishName, quantity) {
  let quantityToRemove = quantity;
  const fishNameLower = fishName.toLowerCase();

  return inventory.filter((fish) => {
    if (fish.name.toLowerCase() === fishNameLower) {
      if (fish.quantity > quantityToRemove) {
        fish.quantity -= quantityToRemove;
        quantityToRemove = 0;
        return true;
      } else if (fish.quantity === quantityToRemove) {
        quantityToRemove = 0;
        return false;
      } else {
        quantityToRemove -= fish.quantity;
        return false;
      }
    }
    return true;
  });
}

async function handleSellFish(messageOrInteraction, data, id, fishName, quantity) {
  if (!data[id]) {
    return messageOrInteraction.reply(messages.notStarted);
  }

  if (!quantity || quantity <= 0) {
    return messageOrInteraction.reply({
      content: "Không bán thì đừng có phá!!!",
      flags: MessageFlags.Ephemeral,
    });
  }

  const inventory = data[id].inventory || [];
  const fishNameLower = fishName.toLowerCase();

  // Total quantity of this fish in inventory
  const totalFishQuantity = inventory
    .filter((f) => f.name.toLowerCase() === fishNameLower)
    .reduce((acc, f) => acc + f.quantity, 0);

  if (totalFishQuantity < quantity) {
    return messageOrInteraction.reply({
      content: "Bạn không có đủ số lượng cá để bán.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const fishItem = findFishItemByName(fishName);
  if (!fishItem) {
    return messageOrInteraction.reply(messages.notFoundFish(fishName));
  }

  // Remove fish from inventory
  data[id].inventory = removeFishFromInventory(inventory, fishName, quantity);

  // Add coins
  const totalEarned = (fishItem.price || 0) * quantity;
  data[id].coins = (data[id].coins || 0) + totalEarned;

  await saveData(data);

  return messageOrInteraction.reply(
    messages.sellSuccess(fishItem.name, fishItem.price, quantity, totalEarned)
  );
}

async function handleSellFishInteraction(interaction) {
  const userId = interaction.user.id;
  const data = await loadData();

  const index = parseInt(interaction.customId.split("-")[2], 10);
  const quantityStr = interaction.fields.getTextInputValue("quantity");
  const quantity = parseInt(quantityStr, 10);

  const inventory = data[userId]?.inventory || [];
  const selectedFish = inventory[index];

  if (!selectedFish) {
    return interaction.reply({
      content: "Cá đã chọn không hợp lệ.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await handleSellFish(interaction, data, userId, selectedFish.name, quantity);
}

async function promptUserToSellFish(interaction, data, id) {
  const inv = data[id]?.inventory || [];
  if (inv.length === 0) {
    return interaction.reply(messages.noFishToSell);
  }

  const options = inv.map((fish, idx) => ({
    label: `${fish.name} (Số lượng: ${fish.quantity})`,
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
    flags: MessageFlags.Ephemeral,
  });

  const collector = interaction.channel.createMessageComponentCollector({
    componentType: 3,
    time: 30000,
    filter: (i) => i.user.id === id,
  });

  collector.once("collect", async (i) => {
    try {
      const index = parseInt(i.values[0], 10);
      const selectedFish = inv[index];
      if (!selectedFish) {
        return i.editReply({ content: "Không tìm thấy cá đã chọn.", components: [] });
      }

      const modal = new ModalBuilder()
        .setCustomId(`sell-quantity-${index}`)
        .setTitle(`Bán cá: ${selectedFish.name}`);

      const quantityInput = new TextInputBuilder()
        .setCustomId("quantity")
        .setLabel("Nhập số lượng muốn bán")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(`Tối đa ${selectedFish.quantity}`)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(quantityInput));

      await i.showModal(modal);
    } catch (error) {
      console.error("Error showing modal:", error);
      try {
        if (!i.replied && !i.deferred) {
          await i.reply({
            content: "Đã xảy ra lỗi khi hiển thị form bán cá.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch {}
    }
  });

  collector.once("end", (_, reason) => {
    if (reason === "time") {
      interaction
        .editReply({
          content: "Hết thời gian chọn cá để bán.",
          components: [],
        })
        .catch(() => {});
    }
  });
}

module.exports = {
  handleSellFish,
  handleSellFishInteraction,
  promptUserToSellFish,
};
