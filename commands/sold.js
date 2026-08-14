const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { parseGold, formatGold, makeId } = require("../lib/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sold_item")
    .setDescription("Input item yang berhasil dijual")
    .addStringOption(o =>
      o.setName("item_name")
        .setDescription("Nama item")
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption(o =>
      o.setName("gold")
        .setDescription("Harga jual, contoh 500g / 1.5k / 2m")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("stamp")
        .setDescription("Jumlah stamp")
        .setMinValue(0)
        .setRequired(true)
    )
    .addUserOption(o =>
      o.setName("tag")
        .setDescription("Member yang terkait dengan item")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { data, saveData, updateSalaryDashboard }) {
    const itemName = interaction.options.getString("item_name");
    const goldText = interaction.options.getString("gold");
    const stamp = interaction.options.getInteger("stamp");
    const user = interaction.options.getUser("tag");

    const gold = parseGold(goldText);

    if (!Number.isFinite(gold) || gold < 0) {
      await interaction.reply({
        content: "❌ Format gold tidak valid. Contoh: `500g`, `1.5k`, `2m`.",
        ephemeral: true
      });
      return;
    }

    const sale = {
      id: makeId("sale"),
      itemName,
      gold,
      stamp,
      userId: user.id,
      addedBy: interaction.user.id,
      createdAt: Date.now()
    };

    data.sales.push(sale);
    saveData(data);

    await updateSalaryDashboard(interaction.guild);

    await interaction.reply({
      content:
        `✅ **${itemName}** berhasil dicatat.\n` +
        `💰 Gold: **${formatGold(gold)}**\n` +
        `🧾 Stamp: **${stamp}**\n` +
        `👤 Member: ${user}\n` +
        `🆔 ID: \`${sale.id}\``,
      ephemeral: true
    });
  }
};
