const { SlashCommandBuilder } = require("@discordjs/builders");
const { handleHook } = require("@handlers/botHandlers");
const { loadData } = require("@services/dataStore");

module.exports = {
  data: new SlashCommandBuilder().setName("câu").setDescription("Câu cá"),
  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData();
    await handleHook(interaction, data, id);
  },
};
