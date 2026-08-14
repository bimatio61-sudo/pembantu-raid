const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("raidparty")
    .setDescription("Shortcut untuk membuat raid party")
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
    ),

  async execute(interaction, { data, saveData, createPartyMessage }) {
    const party = createPartyMessage.create({
      name: interaction.options.getString("name"),
      nest: interaction.options.getString("nest"),
      maxSlots: 8,
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
      content: `✅ Raid party dibuat: **${party.name}**\nID: \`${party.id}\``,
      ephemeral: true
    });
  }
};
