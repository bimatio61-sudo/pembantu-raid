const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config();

const { loadData, saveData } = require("./lib/store");
const { buildSalaryEmbed } = require("./lib/dashboard");
const { calculateSalary } = require("./lib/salary");
const {
  buildPartyEmbed,
  buildPartyComponents,
  createParty
} = require("./lib/party");
const { handlePartyInteraction } = require("./handlers/partyInteractions");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const commands = new Collection();
const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.data.name, command);
}

function buildPartyListEmbed(parties) {
  const embed = new EmbedBuilder()
    .setTitle("⚔️ ACTIVE RAID PARTIES")
    .setColor(0x5865f2);

  for (const party of parties.slice(0, 10)) {
    const members = Object.values(party.slots).filter(Boolean).length;
    embed.addFields({
      name: `${party.name} • ${party.nest}`,
      value:
        `Status: **${party.status}**\n` +
        `Members: **${members}/${party.maxSlots}**\n` +
        `Creator: <@${party.creatorId}>\n` +
        `ID: \`${party.id}\``
    });
  }

  return embed;
}

async function updateSalaryDashboard(guild) {
  const data = loadData();
  const channelId = data.settings.salaryChannelId;

  if (!channelId) return null;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    console.error("Salary channel tidak ditemukan.");
    return null;
  }

  const payload = {
    embeds: [buildSalaryEmbed(data)]
  };

  let message = null;

  if (data.settings.salaryDashboardMessageId) {
    message = await channel.messages
      .fetch(data.settings.salaryDashboardMessageId)
      .catch(() => null);
  }

  if (message) {
    await message.edit(payload);
    return message;
  }

  message = await channel.send(payload);
  data.settings.salaryDashboardMessageId = message.id;
  saveData(data);

  return message;
}

const context = {
  get data() {
    return loadData();
  },
  saveData,
  updateSalaryDashboard,
  calculateSalary,
  buildSalarySummary: calculateSalary,
  createPartyMessage: {
    create: createParty,
    render: async party => ({
      embeds: [buildPartyEmbed(party)],
      components: buildPartyComponents(party)
    })
  },
  buildPartyListEmbed
};

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📦 Loaded ${commands.size} slash command(s).`);
});

client.on("interactionCreate", async interaction => {
  try {
    if (
      interaction.isButton() ||
      interaction.isUserSelectMenu() ||
      interaction.isStringSelectMenu()
    ) {
      if (interaction.customId.startsWith("party:")) {
        await handlePartyInteraction(interaction, context);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "❌ Command tidak ditemukan.",
        ephemeral: true
      });
      return;
    }

    await command.execute(interaction, context);
  } catch (error) {
    console.error("Interaction error:", error);

    const message = {
      content: "❌ Terjadi error saat menjalankan command/interaksi.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message).catch(() => {});
    } else {
      await interaction.reply(message).catch(() => {});
    }
  }
});

process.on("unhandledRejection", error => {
  console.error("Unhandled rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("Uncaught exception:", error);
});

client.login(process.env.DISCORD_TOKEN);
