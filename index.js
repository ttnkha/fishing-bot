require("module-alias/register");
require("./keepAlive");

const dotenv = require("dotenv");

const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });

const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");
const { loadData } = require("@services/dataStore");
const {
  handleStart,
  handleDig,
  handleHook,
  handleBag,
  showRodShop,
  handleUpgradeRod,
} = require("@handlers/botHandlers");
const { handleSellFishInteraction, promptUserToSellFish } = require("@handlers/fishSellHandler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Map();
const commandsPath = path.join(__dirname, "./src/commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("sell-quantity-")) {
      await handleSellFishInteraction(interaction);
    }
  }

  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "Đã có lỗi xảy ra khi chạy lệnh!", ephemeral: true });
  }
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!") || message.author.bot) return;

  const args = message.content.slice(1).split(/ +/);
  const command = args.shift().toLowerCase();

  let data;
  try {
    data = await loadData();
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu:", error);
    return message.reply("Lỗi hệ thống, vui lòng thử lại sau.");
  }

  const id = message.author.id;

  try {
    switch (command) {
      case "bắtđầu":
        await handleStart(message, data, id);
        break;
      case "đào":
        await handleDig(message, data, id);
        break;
      case "câu":
        await handleHook(message, data, id);
        break;
      case "túi":
        await handleBag(message, data, id);
        break;
      case "bán":
        await promptUserToSellFish(message, data, id);
        break;
      case "cửahàng":
        await showRodShop(message);
        break;
      case "nângcấpcần":
        await handleUpgradeRod(message, data, id);
        break;
      default:
        message.reply("Lệnh không hợp lệ hoặc chưa được hỗ trợ.");
    }
  } catch (error) {
    console.error("Lỗi xử lý lệnh:", error);
    message.reply("Đã có lỗi xảy ra khi xử lý lệnh.");
  }
});

client.login(process.env.DISCORD_TOKEN);
