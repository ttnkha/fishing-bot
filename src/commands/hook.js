const { SlashCommandBuilder } = require("@discordjs/builders");
const { promptUserToSelectBait } = require("@handlers/hookHandler");
const { loadData } = require("@services/dataStore");

module.exports = {
  data: new SlashCommandBuilder().setName("câu").setDescription("Câu cá"),
  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData();
    await promptUserToSelectBait(interaction, data, id);
  },
};
