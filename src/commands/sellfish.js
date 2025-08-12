const { SlashCommandBuilder } = require("discord.js");
const { loadData } = require("@services/dataStore");
const { promptUserToSellFish } = require("@handlers/botHandlers");

module.exports = {
  data: new SlashCommandBuilder().setName("bán").setDescription("Bán một con cá trong túi của bạn"),

  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData();
    await promptUserToSellFish(interaction, data, id);
  },
};
