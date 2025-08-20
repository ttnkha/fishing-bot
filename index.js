require("module-alias/register");
require("./keepAlive");

const dotenv = require("dotenv");
const isRailway = !!process.env.RAILWAY_PROJECT_NAME;
if (isRailway) {
  console.log("Running on Railway, env:", process.env.RAILWAY_ENVIRONMENT_NAME);
  dotenv.config();
} else {
  console.log("Running locally, loading .env file");
  const env = process.env.NODE_ENV || "development";
  dotenv.config({ path: `.env.${env}` });
}

const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, MessageFlags } = require("discord.js");
const { loadData } = require("@services/data");
const { handleStart, handleBag } = require("@handlers/botHandlers");
const { handleSellFishInteraction, promptUserToSellFish } = require("@handlers/fishSellHandler");
const { promptUserToSelectBait } = require("@handlers/hookHandler");
const { handleDig } = require("@handlers/digHandler");
const { showRodShop } = require("@handlers/shopHandlers");
const { handleUpgradeRod, fixRod } = require("@handlers/rodHandlers");

// https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147551232&scope=bot%20applications.commands

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
    await interaction.deferReply({ ephemeral: MessageFlags.Ephemeral });

    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Đã có lỗi xảy ra khi chạy lệnh!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.followUp({
          content: "Đã có lỗi xảy ra khi chạy lệnh!",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (err) {
      console.error("Không thể gửi phản hồi lỗi:", err);
    }
  }
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!") || message.author.bot) return;

  const args = message.content.slice(1).split(/ +/);
  const command = args.shift().toLowerCase();

  const id = message.author.id;

  let data;
  try {
    data = await loadData(id);
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu:", error);
    return message.reply("Lỗi hệ thống, vui lòng thử lại sau.");
  }

  try {
    await message.deferReply({ ephemeral: MessageFlags.Ephemeral });

    switch (command) {
      case "batdau":
        await handleStart(message, data, id);
        break;
      case "dao":
        await handleDig(message, data, id);
        break;
      case "cau":
        await promptUserToSelectBait(message, data, id);
        break;
      case "tui":
        await handleBag(message, data);
        break;
      case "ban":
        await promptUserToSellFish(message, data, id);
        break;
      case "cuahang":
        await showRodShop(message, data);
        break;
      case "nangcapcan":
        await handleUpgradeRod(message, data, id);
        break;
      case "suacancau":
        await fixRod(message, data, id);
        break;
      default:
        message.editReply("Lệnh không hợp lệ hoặc chưa được hỗ trợ.");
    }
  } catch (error) {
    console.error("Lỗi xử lý lệnh:", error);
    message.reply("Đã có lỗi xảy ra khi xử lý lệnh.");
  }
});

console.log(
  `Bot started on host: ${process.env.RAILWAY_PRIVATE_DOMAIN || "local"} at ${new Date().toISOString()}`
);
client.login(process.env.DISCORD_TOKEN);
