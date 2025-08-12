const { SlashCommandBuilder } = require("discord.js");
const { loadData } = require("@services/dataStore");
const { handleUpgradeRod } = require("@handlers/botHandlers");

module.exports = {
  data: new SlashCommandBuilder().setName("nângcấpcần").setDescription("Nâng cấp cần câu của bạn"),

  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData();
    await handleUpgradeRod(interaction, data, id);
  },
};
