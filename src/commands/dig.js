const { SlashCommandBuilder } = require("@discordjs/builders");
const { handleDig } = require("@handlers/digHandler");
const { loadData } = require("@services/data");

module.exports = {
  data: new SlashCommandBuilder().setName("đào").setDescription("Tìm mồi câu"),
  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData(id);
    await handleDig(interaction, data, id);
  },
};
