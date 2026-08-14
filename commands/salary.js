const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("salary")
    .setDescription("Salary dashboard management")
    .addSubcommand(sub =>
      sub.setName("setup").setDescription("Buat/update dashboard salary di channel ini")
    )
    .addSubcommand(sub =>
      sub
        .setName("addmember")
        .setDescription("Tambahkan member ke pembagian salary")
        .addUserOption(o => o.setName("user").setDescription("Member").setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName("removemember")
        .setDescription("Hapus member dari pembagian salary")
        .addUserOption(o => o.setName("user").setDescription("Member").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("members").setDescription("Lihat member salary")
    )
    .addSubcommand(sub =>
      sub.setName("reset").setDescription("Reset semua data item/salary")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { data, saveData, updateSalaryDashboard, buildSalarySummary }) {
    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      data.settings.salaryChannelId = interaction.channelId;
      data.settings.stampPrice = Number(data.settings.stampPrice ?? 3);

      saveData(data);

      await interaction.reply({
        content: "⏳ Membuat/update dashboard salary...",
        ephemeral: true
      });

      await updateSalaryDashboard(interaction.guild);

      await interaction.editReply({
        content: "✅ Salary dashboard sudah dibuat/di-update di channel ini."
      });
      return;
    }

    if (sub === "addmember") {
      const user = interaction.options.getUser("user");
      if (!data.settings.salaryMembers.includes(user.id)) {
        data.settings.salaryMembers.push(user.id);
      }
      saveData(data);
      await updateSalaryDashboard(interaction.guild);

      await interaction.reply({
        content: `✅ ${user} ditambahkan ke salary members.`,
        ephemeral: true
      });
      return;
    }

    if (sub === "removemember") {
      const user = interaction.options.getUser("user");
      data.settings.salaryMembers =
        data.settings.salaryMembers.filter(id => id !== user.id);

      saveData(data);
      await updateSalaryDashboard(interaction.guild);

      await interaction.reply({
        content: `✅ ${user} dihapus dari salary members.`,
        ephemeral: true
      });
      return;
    }

    if (sub === "members") {
      const members = data.settings.salaryMembers;
      await interaction.reply({
        content: members.length
          ? members.map((id, i) => `${i + 1}. <@${id}>`).join("\n")
          : "Belum ada salary member.",
        ephemeral: true
      });
      return;
    }

    if (sub === "reset") {
      data.sales = [];
      data.settings.salaryMembers = [];
      saveData(data);
      await updateSalaryDashboard(interaction.guild);

      await interaction.reply({
        content: "⚠️ Semua data sold item dan salary members sudah di-reset.",
        ephemeral: true
      });
    }
  }
};
