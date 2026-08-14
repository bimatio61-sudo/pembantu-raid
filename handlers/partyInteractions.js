const { PermissionFlagsBits } = require("discord.js");
const {
  buildPartyEmbed,
  buildPartyComponents,
  buildUserSelect,
  buildRoleSelect,
  buildKickSelect,
  buildSwapSelect,
  buildNestSelect
} = require("../lib/party");
const { hasPartyAdmin, memberCount } = require("../lib/utils");
const { calculateSalary } = require("../lib/salary");

async function refreshParty(interaction, party) {
  party.updatedAt = Date.now();

  try {
    const channel = await interaction.guild.channels.fetch(party.channelId);
    const message = await channel.messages.fetch(party.messageId);
    await message.edit({
      embeds: [buildPartyEmbed(party, interaction.guild)],
      components: buildPartyComponents(party)
    });
    return true;
  } catch (error) {
    console.error("Gagal refresh party:", error.message);
    return false;
  }
}

async function handlePartyInteraction(interaction, ctx) {
  const { data, saveData, updateSalaryDashboard } = ctx;
  const parts = interaction.customId.split(":");
  const action = parts[1];
  const partyId = parts[2];
  const party = data.parties[partyId];

  if (!party) {
    await interaction.reply({ content: "❌ Party sudah tidak ditemukan.", ephemeral: true });
    return;
  }

  if (interaction.isButton()) {
    if (action === "role") {
      const roleId = parts[3];

      if (party.status !== "OPEN") {
        await interaction.reply({ content: "🔒 Party sedang terkunci/ditutup.", ephemeral: true });
        return;
      }

      if (!(roleId in party.slots)) {
        await interaction.reply({ content: "❌ Slot tersebut tidak tersedia.", ephemeral: true });
        return;
      }

      if (party.slots[roleId]) {
        await interaction.reply({
          content: `❌ Slot **${roleId}** sudah diisi <@${party.slots[roleId]}>.`,
          ephemeral: true
        });
        return;
      }

      const currentSlot = Object.entries(party.slots).find(([, id]) => id === interaction.user.id);
      if (currentSlot) {
        await interaction.reply({
          content: `❌ Kamu sudah berada di slot **${currentSlot[0]}**. Keluar dulu jika ingin pindah slot.`,
          ephemeral: true
        });
        return;
      }

      if (memberCount(party) >= party.maxSlots) {
        await interaction.reply({ content: "❌ Party sudah penuh.", ephemeral: true });
        return;
      }

      party.slots[roleId] = interaction.user.id;
      saveData(data);
      await refreshParty(interaction, party);

      await interaction.reply({
        content: `✅ Kamu masuk ke slot **${roleId}**.`,
        ephemeral: true
      });
      return;
    }

    if (action === "leave") {
      const slot = Object.entries(party.slots).find(([, id]) => id === interaction.user.id)?.[0];

      if (!slot) {
        await interaction.reply({ content: "❌ Kamu tidak ada di party ini.", ephemeral: true });
        return;
      }

      if (interaction.user.id === party.creatorId) {
        await interaction.reply({
          content: "❌ Creator tidak dapat Leave. Gunakan **Close Party** atau `/party delete`.",
          ephemeral: true
        });
        return;
      }

      party.slots[slot] = null;
      saveData(data);
      await refreshParty(interaction, party);

      await interaction.reply({ content: `🚪 Kamu keluar dari slot **${slot}**.`, ephemeral: true });
      return;
    }

    if (action === "lock") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.reply({ content: "❌ Hanya creator/admin yang boleh Lock.", ephemeral: true });
        return;
      }

      if (party.status === "CLOSED") {
        await interaction.reply({ content: "❌ Party sudah ditutup.", ephemeral: true });
        return;
      }

      party.status = party.status === "LOCKED" ? "OPEN" : "LOCKED";
      saveData(data);
      await refreshParty(interaction, party);

      await interaction.reply({
        content: party.status === "LOCKED" ? "🔒 Party dikunci." : "🔓 Party dibuka kembali.",
        ephemeral: true
      });
      return;
    }

    if (action === "close") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.reply({ content: "❌ Hanya creator/admin yang boleh Close.", ephemeral: true });
        return;
      }

      party.status = "CLOSED";
      saveData(data);
      await refreshParty(interaction, party);

      await interaction.reply({ content: "🔴 Party ditutup.", ephemeral: true });
      return;
    }

    if (action === "add") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.reply({ content: "❌ Hanya creator/admin yang boleh Add Member.", ephemeral: true });
        return;
      }

      if (party.status !== "OPEN") {
        await interaction.reply({ content: "🔒 Unlock party terlebih dahulu.", ephemeral: true });
        return;
      }

      await interaction.reply({
        content: "Pilih member yang ingin dimasukkan:",
        components: [buildUserSelect(`party:adduser:${party.id}`, "Pilih 1 member")],
        ephemeral: true
      });
      return;
    }

    if (action === "kick") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.reply({ content: "❌ Hanya creator/admin yang boleh Kick.", ephemeral: true });
        return;
      }

      const row = buildKickSelect(party);
      if (!row) {
        await interaction.reply({ content: "❌ Belum ada member untuk di-kick.", ephemeral: true });
        return;
      }

      await interaction.reply({
        content: "Pilih slot/member yang ingin dikeluarkan:",
        components: [row],
        ephemeral: true
      });
      return;
    }

    if (action === "swap") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.reply({ content: "❌ Hanya creator/admin yang boleh Swap.", ephemeral: true });
        return;
      }

      await interaction.reply({
        content: "Pilih **2 slot** yang ingin ditukar:",
        components: [buildSwapSelect(party)],
        ephemeral: true
      });
      return;
    }

    if (action === "nest") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.reply({ content: "❌ Hanya creator/admin yang boleh SET NEST.", ephemeral: true });
        return;
      }

      await interaction.reply({
        content: "Pilih Raid Nest:",
        components: [buildNestSelect(party.id)],
        ephemeral: true
      });
      return;
    }

    if (action === "finish") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.reply({ content: "❌ Hanya creator/admin yang boleh Raid Finish.", ephemeral: true });
        return;
      }

      const members = Object.values(party.slots).filter(Boolean);

      for (const id of members) {
        if (!data.settings.salaryMembers.includes(id)) {
          data.settings.salaryMembers.push(id);
        }
      }

      party.status = "CLOSED";
      data.raidHistory.push({
        id: `raid-${Date.now()}`,
        partyId: party.id,
        partyName: party.name,
        nest: party.nest,
        completedAt: Date.now(),
        memberIds: [...data.settings.salaryMembers],
        saleCount: data.sales.length,
        ...calculateSalary(data)
      });

      saveData(data);
      await refreshParty(interaction, party);
      await updateSalaryDashboard(interaction.guild);

      const summary = calculateSalary(data);

      await interaction.reply({
        content:
          `🏁 **${party.name}** selesai.\n` +
          `👥 ${members.length} member disinkronkan ke Salary.\n` +
          `💰 Total Pool saat ini: **${summary.totalPool.toLocaleString("en-US")}g**\n` +
          `💵 Salary/member: **${summary.salaryPerMember.toLocaleString("en-US", { maximumFractionDigits: 2 })}g**`,
        ephemeral: true
      });
      return;
    }
  }

  if (interaction.isUserSelectMenu()) {
    if (action === "adduser") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.reply({ content: "❌ Tidak punya akses.", ephemeral: true });
        return;
      }

      const userId = interaction.values[0];

      if (party.status !== "OPEN") {
        await interaction.reply({ content: "🔒 Party sedang terkunci.", ephemeral: true });
        return;
      }

      if (party.maxSlots <= memberCount(party)) {
        await interaction.reply({ content: "❌ Party sudah penuh.", ephemeral: true });
        return;
      }

      if (Object.values(party.slots).includes(userId)) {
        await interaction.reply({ content: "❌ User tersebut sudah ada di party.", ephemeral: true });
        return;
      }

      await interaction.update({
        content: `Pilih slot untuk <@${userId}>:`,
        components: [buildRoleSelect(party.id, userId)]
      });
      return;
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (action === "addrole") {
      const userId = parts[3];
      const roleId = interaction.values[0];

      if (!hasPartyAdmin(interaction, party)) {
        await interaction.update({ content: "❌ Tidak punya akses.", components: [] });
        return;
      }

      if (!(roleId in party.slots)) {
        await interaction.update({ content: "❌ Slot tidak tersedia.", components: [] });
        return;
      }

      if (party.slots[roleId]) {
        await interaction.update({
          content: `❌ Slot **${roleId}** sudah terisi.`,
          components: []
        });
        return;
      }

      if (Object.values(party.slots).includes(userId)) {
        await interaction.update({
          content: "❌ User sudah ada di party.",
          components: []
        });
        return;
      }

      party.slots[roleId] = userId;
      saveData(data);
      await refreshParty(interaction, party);

      await interaction.update({
        content: `✅ <@${userId}> masuk ke **${roleId}**.`,
        components: []
      });
      return;
    }

    if (action === "kickselect") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.update({ content: "❌ Tidak punya akses.", components: [] });
        return;
      }

      const roleId = interaction.values[0];
      const userId = party.slots[roleId];

      if (!userId) {
        await interaction.update({ content: "❌ Slot sudah kosong.", components: [] });
        return;
      }

      party.slots[roleId] = null;
      saveData(data);
      await refreshParty(interaction, party);

      await interaction.update({
        content: `🚪 <@${userId}> dikeluarkan dari **${roleId}**.`,
        components: []
      });
      return;
    }

    if (action === "swapselect") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.update({ content: "❌ Tidak punya akses.", components: [] });
        return;
      }

      const [a, b] = interaction.values;
      [party.slots[a], party.slots[b]] = [party.slots[b], party.slots[a]];
      saveData(data);
      await refreshParty(interaction, party);

      await interaction.update({
        content: `🔄 Slot **${a}** dan **${b}** berhasil ditukar.`,
        components: []
      });
      return;
    }

    if (action === "nestselect") {
      if (!hasPartyAdmin(interaction, party)) {
        await interaction.update({ content: "❌ Tidak punya akses.", components: [] });
        return;
      }

      party.nest = interaction.values[0];
      saveData(data);
      await refreshParty(interaction, party);

      await interaction.update({
        content: `🎯 Raid Nest diubah menjadi **${party.nest}**.`,
        components: []
      });
    }
  }
}

module.exports = { handlePartyInteraction, refreshParty };
