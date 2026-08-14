const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { formatGold } = require("../lib/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("raid_done")
    .setDescription("Hitung total salary raid saat ini")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, { data, saveData, updateSalaryDashboard, calculateSalary }) {
    const summary = calculateSalary(data);

    if (!summary.memberCount) {
      await interaction.reply({
        content: "❌ Belum ada salary member. Gunakan `/salary addmember` atau selesaikan party.",
        ephemeral: true
      });
      return;
    }

    data.raidHistory.push({
      id: `raid-${Date.now()}`,
      completedAt: Date.now(),
      memberIds: [...data.settings.salaryMembers],
      totalGold: summary.totalGold,
      totalStamp: summary.totalStamp,
      stampValue: summary.stampValue,
      totalPool: summary.totalPool,
      salaryPerMember: summary.salaryPerMember,
      saleCount: data.sales.length
    });

    saveData(data);
    await updateSalaryDashboard(interaction.guild);

    const memberLines = data.settings.salaryMembers
      .map(id => `<@${id}> → **${formatGold(summary.salaryPerMember)}**`)
      .join("\n");

    await interaction.reply({
      content:
        `🏁 **RAID FINISH**\n\n` +
        `💰 Item Gold: **${formatGold(summary.totalGold)}**\n` +
        `🧾 Total Stamp: **${summary.totalStamp}**\n` +
        `💵 Stamp Value: **${formatGold(summary.stampValue)}**\n` +
        `💰 Total Salary Pool: **${formatGold(summary.totalPool)}**\n` +
        `👥 Members: **${summary.memberCount}**\n` +
        `💵 Salary / Member: **${formatGold(summary.salaryPerMember)}**\n\n` +
        memberLines
    });
  }
};
