const { SlashCommandBuilder } = require("@discordjs/builders");
const { handleStart } = require("@handlers/botHandlers");
const { loadData } = require("@services/data");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bắtđầu")
    .setDescription("Bắt đầu hành trình câu cá của bạn"),
  async execute(interaction) {
    const id = interaction.user.id;
    const data = await loadData(id);
    await handleStart(interaction, data, id);
  },
};
