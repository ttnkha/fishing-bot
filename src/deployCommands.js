require("module-alias/register");

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
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    // console.log("Deleting all global commands...");
    // await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    // console.log("✅ All global commands deleted.");

    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
