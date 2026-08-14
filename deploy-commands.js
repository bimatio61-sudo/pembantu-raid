require("dotenv").config();

const {
  REST,
  Routes
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  console.error("❌ DISCORD_TOKEN, CLIENT_ID, dan GUILD_ID wajib diisi di .env");
  process.exit(1);
}

const commands = [];
const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log(`⏳ Registering ${commands.length} command(s)...`);

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log("✅ Guild slash commands registered.");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
