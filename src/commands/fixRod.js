const { SlashCommandBuilder } = require("discord.js");
const { loadData } = require("@services/data");
const { fixRod } = require("@handlers/rodHandlers");

module.exports = {
  data: new SlashCommandBuilder().setName("sửacầncâu").setDescription("Sửa cần câu của bạn"),

  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData(id);
    await fixRod(interaction, data, id);
  },
};
