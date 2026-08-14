const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("party")
    .setDescription("Party management")
    .addSubcommand(sub =>
      sub
        .setName("create")
        .setDescription("Buat party baru")
        .addStringOption(o =>
          o.setName("name")
            .setDescription("Nama party")
            .setRequired(true)
            .setMaxLength(80)
        )
        .addStringOption(o =>
          o.setName("nest")
            .setDescription("Raid Nest")
            .setRequired(true)
            .addChoices(
              { name: "DDN Classic", value: "DDN Classic" },
              { name: "SDN Classic", value: "SDN Classic" },
              { name: "GDN Classic", value: "GDN Classic" },
              { name: "IDN Classic", value: "IDN Classic" },
              { name: "BDN Classic", value: "BDN Classic" },
              { name: "Other", value: "Other" }
            )
        )
        .addIntegerOption(o =>
          o.setName("slots")
            .setDescription("Jumlah slot party")
            .setMinValue(4)
            .setMaxValue(8)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("list")
        .setDescription("Lihat party yang masih aktif")
    )
    .addSubcommand(sub =>
      sub
        .setName("delete")
        .setDescription("Hapus party")
        .addStringOption(o =>
          o.setName("party_id")
            .setDescription("ID party dari footer Embed")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction, { data, saveData, createPartyMessage, buildPartyListEmbed }) {
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const name = interaction.options.getString("name");
      const nest = interaction.options.getString("nest");
      const maxSlots = interaction.options.getInteger("slots") || 8;

      const party = createPartyMessage.create({
        name,
        nest,
        maxSlots,
        creatorId: interaction.user.id,
        channelId: interaction.channelId
      });

      data.parties[party.id] = party;
      saveData(data);

      const message = await interaction.channel.send(
        await createPartyMessage.render(party)
      );

      party.messageId = message.id;
      party.updatedAt = Date.now();
      saveData(data);

      await interaction.reply({
        content: `✅ Party **${name}** berhasil dibuat.\nID: \`${party.id}\``,
        ephemeral: true
      });
      return;
    }

    if (sub === "list") {
      const active = Object.values(data.parties).filter(p => p.status !== "CLOSED");

      if (!active.length) {
        await interaction.reply({
          content: "Tidak ada party aktif.",
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        embeds: [buildPartyListEmbed(active)],
        ephemeral: true
      });
      return;
    }

    if (sub === "delete") {
      const partyId = interaction.options.getString("party_id");
      const party = data.parties[partyId];

      if (!party) {
        await interaction.reply({ content: "❌ Party tidak ditemukan.", ephemeral: true });
        return;
      }

      const isAdmin =
        party.creatorId === interaction.user.id ||
        interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);

      if (!isAdmin) {
        await interaction.reply({
          content: "❌ Hanya creator party atau admin yang boleh menghapus party.",
          ephemeral: true
        });
        return;
      }

      delete data.parties[partyId];
      saveData(data);

      await interaction.reply({
        content: `🗑️ Party \`${partyId}\` berhasil dihapus dari database.`,
        ephemeral: true
      });
    }
  }
};
