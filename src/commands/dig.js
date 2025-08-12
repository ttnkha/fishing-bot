const { SlashCommandBuilder } = require("@discordjs/builders");
const { handleDig } = require("@handlers/botHandlers");
const { loadData, saveData } = require("@services/dataStore");

module.exports = {
  data: new SlashCommandBuilder().setName("đào").setDescription("Tìm mồi câu"),
  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData();
    await handleDig(interaction, data, id);
    await saveData(data);
  },
};
