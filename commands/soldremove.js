const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sold_remove")
    .setDescription("Hapus item yang salah input")
    .addStringOption(o =>
      o.setName("sale_id")
        .setDescription("ID dari /sold_list")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { data, saveData, updateSalaryDashboard }) {
    const saleId = interaction.options.getString("sale_id");
    const index = data.sales.findIndex(s => s.id === saleId);

    if (index === -1) {
      await interaction.reply({ content: "❌ Sale ID tidak ditemukan.", ephemeral: true });
      return;
    }

    const [removed] = data.sales.splice(index, 1);
    saveData(data);
    await updateSalaryDashboard(interaction.guild);

    await interaction.reply({
      content: `🗑️ **${removed.itemName}** berhasil dihapus.`,
      ephemeral: true
    });
  }
};
