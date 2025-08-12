const { SlashCommandBuilder } = require("@discordjs/builders");
const { handleBag } = require("@handlers/botHandlers");
const { loadData } = require("@services/dataStore");

module.exports = {
  data: new SlashCommandBuilder().setName("túi").setDescription("Xem mồi và cá trong túi"),
  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData();
    await handleBag(interaction, data, id);
  },
};
