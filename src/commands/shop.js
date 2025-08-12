const { SlashCommandBuilder } = require("discord.js");
const { showRodShop } = require("@handlers/botHandlers");

module.exports = {
  data: new SlashCommandBuilder().setName("cửahàng").setDescription("Xem cửa hàng (nâng cấp,...)"),

  async execute(interaction) {
    await showRodShop(interaction);
  },
};
