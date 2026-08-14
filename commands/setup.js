const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup salary dashboard di channel ini")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { data, saveData, updateSalaryDashboard }) {
    data.settings.salaryChannelId = interaction.channelId;
    saveData(data);

    await interaction.reply({
      content: "⏳ Menyiapkan Salary Dashboard...",
      ephemeral: true
    });

    await updateSalaryDashboard(interaction.guild);

    await interaction.editReply({
      content: "✅ Salary Dashboard siap di channel ini."
    });
  }
};
