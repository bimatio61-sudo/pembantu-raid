const { EmbedBuilder } = require("discord.js");
const { formatGold } = require("./utils");
const { calculateSalary } = require("./salary");

function buildSalaryEmbed(data) {
  const summary = calculateSalary(data);
  const memberIds = data.settings.salaryMembers || [];

  const memberList = memberIds.length
    ? memberIds.map(id => `<@${id}>`).join(", ")
    : "Belum ada member";

  return new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("💰 RAID DASHBOARD")
    .addFields(
      {
        name: "💰 Total Gold",
        value: formatGold(summary.totalGold),
        inline: true
      },
      {
        name: "👥 Members",
        value: `${summary.memberCount}/${summary.memberCount}`,
        inline: true
      },
      {
        name: "📦 Total Items Sold",
        value: `${data.sales.length}`,
        inline: true
      },
      {
        name: "🧾 Stamp Price",
        value: `${formatGold(summary.stampPrice)} / stamp`,
        inline: true
      },
      {
        name: "🧾 Total Stamp",
        value: `${summary.totalStamp}`,
        inline: true
      },
      {
        name: "💵 Stamp Value",
        value: formatGold(summary.stampValue),
        inline: true
      },
      {
        name: "👥 Member List",
        value: memberList
      },
      {
        name: "💵 Salary Summary",
        value:
          `Total Pool: **${formatGold(summary.totalPool)}**\n` +
          `Salary / Member: **${formatGold(summary.salaryPerMember)}**`
      },
      {
        name: "📝 How to Input Sold Items",
        value:
          "• Use `/sold_item`\n" +
          "• Example: `/sold_item item_name:Ring Unique gold:500g stamp:20 tag:@user`\n" +
          "• Use `/sold_list` to see entries\n" +
          "• Use `/sold_remove` if an entry is wrong"
      },
      {
        name: "📝 How to Calculate Total Salary",
        value: "• Use `/raid_done` or press **Raid Finish** on a party."
      },
      {
        name: "📝 How to Set Stamp Prices",
        value: "• Use `/setstampprice`"
      }
    )
    .setFooter({ text: "BOSS GAJIAN • Party → Sold Items → Salary" })
    .setTimestamp();
}

module.exports = { buildSalaryEmbed };
