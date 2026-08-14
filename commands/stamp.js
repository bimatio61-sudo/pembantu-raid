const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setstampprice")
    .setDescription("Atur harga 1 stamp")
    .addNumberOption(o =>
      o.setName("price")
        .setDescription("Harga stamp dalam gold")
        .setMinValue(0)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { data, saveData, updateSalaryDashboard }) {
    const price = interaction.options.getNumber("price");
    data.settings.stampPrice = price;
    saveData(data);

    await updateSalaryDashboard(interaction.guild);

    await interaction.reply({
      content: `✅ Harga stamp diubah menjadi **${price}g/stamp**.`,
      ephemeral: true
    });
  }
};
