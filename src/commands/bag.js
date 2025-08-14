const { SlashCommandBuilder } = require("@discordjs/builders");
const { handleBag } = require("@handlers/botHandlers");
const { loadData } = require("@services/data");

module.exports = {
  data: new SlashCommandBuilder().setName("túi").setDescription("Xem mồi và cá trong túi"),
  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData(id);
    await handleBag(interaction, data, id);
  },
};
