const { SlashCommandBuilder } = require("discord.js");
const { loadData } = require("@services/data");
const { promptUserToSellFish } = require("@handlers/fishSellHandler");

module.exports = {
  data: new SlashCommandBuilder().setName("bán").setDescription("Bán một con cá trong túi của bạn"),

  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData(id);
    await promptUserToSellFish(interaction, data, id);
  },
};
