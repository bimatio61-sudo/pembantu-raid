const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { formatGold } = require("../lib/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sold_list")
    .setDescription("Lihat semua item yang terjual")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { data }) {
    if (!data.sales.length) {
      await interaction.reply({ content: "Belum ada item terjual.", ephemeral: true });
      return;
    }

    const lines = data.sales.slice(-20).map((sale, i) =>
      `**${i + 1}. ${sale.itemName}** — ${formatGold(sale.gold)} + ${sale.stamp} stamp — <@${sale.userId}>\nID: \`${sale.id}\``
    );

    await interaction.reply({
      content: lines.join("\n\n"),
      ephemeral: true
    });
  }
};
