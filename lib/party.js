const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require("discord.js");

const config = require("../config.json");
const { memberCount, findUserSlot, makeId } = require("./utils");

function roleName(roleId) {
  return config.partyRoles.find(r => r.id === roleId)?.label || roleId;
}

function roleEmoji(roleId) {
  return config.partyRoles.find(r => r.id === roleId)?.emoji || "•";
}

function statusText(status) {
  if (status === "OPEN") return "OPEN";
  if (status === "LOCKED") return "LOCKED";
  return "CLOSED";
}

function buildPartyEmbed(party, guild) {
  const lines = config.partyRoles.map(role => {
    const userId = party.slots[role.id];
    return `${role.emoji} **${role.label}** : ${userId ? `<@${userId}>` : "Empty"}`;
  });

  const creator = `<@${party.creatorId}>`;
  const notes = config.partyNotes.map(x => x).join("\n");

  return new EmbedBuilder()
    .setColor(party.status === "OPEN" ? 0x2ecc71 : party.status === "LOCKED" ? 0xf1c40f : 0xe74c3c)
    .setTitle(`⚔️ ${party.name} (${party.maxSlots} Slot)`)
    .setDescription(lines.join("\n"))
    .addFields({
      name: "────────────────────",
      value:
        `**Creator:** ${creator}\n` +
        `**Status:** ${statusText(party.status)}\n` +
        `**Members:** ${memberCount(party)}/${party.maxSlots}\n` +
        `**Raid Nest:** ${party.nest}\n\n` +
        notes
    })
    .setFooter({ text: `Party ID: ${party.id}` })
    .setTimestamp(party.updatedAt || party.createdAt);
}

function disabledPartyButtons(party) {
  return party.status === "CLOSED";
}

function buildPartyComponents(party) {
  const closed = disabledPartyButtons(party);

  const roleRows = [];
  for (let i = 0; i < config.partyRoles.length; i += 4) {
    const row = new ActionRowBuilder();
    for (const role of config.partyRoles.slice(i, i + 4)) {
      const occupied = Boolean(party.slots[role.id]);
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`party:role:${party.id}:${role.id}`)
          .setLabel(role.label)
          .setEmoji(role.emoji)
          .setStyle(occupied ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(closed)
      );
    }
    roleRows.push(row);
  }

  const management = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`party:close:${party.id}`)
      .setLabel("Close Party")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(closed),
    new ButtonBuilder()
      .setCustomId(`party:lock:${party.id}`)
      .setLabel(party.status === "LOCKED" ? "Unlock" : "Lock")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(closed),
    new ButtonBuilder()
      .setCustomId(`party:finish:${party.id}`)
      .setLabel("Raid Finish")
      .setStyle(ButtonStyle.Success)
      .setDisabled(closed),
    new ButtonBuilder()
      .setCustomId(`party:leave:${party.id}`)
      .setLabel("Leave")
      .setEmoji("🚪")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(closed)
  );

  const utility = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`party:add:${party.id}`)
      .setLabel("Add Member")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Success)
      .setDisabled(closed),
    new ButtonBuilder()
      .setCustomId(`party:kick:${party.id}`)
      .setLabel("Kick")
      .setEmoji("🚪")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(closed),
    new ButtonBuilder()
      .setCustomId(`party:swap:${party.id}`)
      .setLabel("Swap")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(closed),
    new ButtonBuilder()
      .setCustomId(`party:nest:${party.id}`)
      .setLabel("SET NEST")
      .setEmoji("🎯")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(closed)
  );

  return [...roleRows, management, utility];
}

function buildUserSelect(customId, placeholder, maxValues = 1) {
  return new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(maxValues)
  );
}

function buildRoleSelect(partyId, userId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`party:addrole:${partyId}:${userId}`)
    .setPlaceholder("Pilih slot untuk member")
    .setMinValues(1)
    .setMaxValues(1);

  for (const role of config.partyRoles) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(role.label)
        .setDescription(partyId ? `Masukkan member ke ${role.label}` : role.label)
        .setValue(role.id)
        .setEmoji(role.emoji)
    );
  }

  return new ActionRowBuilder().addComponents(menu);
}

function buildKickSelect(party) {
  const options = Object.entries(party.slots)
    .filter(([, userId]) => userId)
    .map(([roleId, userId]) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(`${roleName(roleId)} - ${userId}`)
        .setDescription(`Keluarkan <@${userId}> dari party`)
        .setValue(roleId)
    );

  if (!options.length) return null;

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`party:kickselect:${party.id}`)
      .setPlaceholder("Pilih slot yang ingin di-kick")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options)
  );
}

function buildSwapSelect(party) {
  const options = Object.entries(party.slots).map(([roleId, userId]) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${roleName(roleId)} ${userId ? "• Filled" : "• Empty"}`)
      .setDescription(userId ? `User: ${userId}` : "Slot kosong")
      .setValue(roleId)
      .setEmoji(roleEmoji(roleId))
  );

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`party:swapselect:${party.id}`)
      .setPlaceholder("Pilih 2 slot untuk ditukar")
      .setMinValues(2)
      .setMaxValues(2)
      .addOptions(options)
  );
}

function buildNestSelect(partyId) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`party:nestselect:${partyId}`)
    .setPlaceholder("Pilih Raid Nest");

  for (const nest of config.raidNestOptions) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(nest)
        .setValue(nest)
    );
  }

  return new ActionRowBuilder().addComponents(menu);
}

function createParty({ name, nest, maxSlots, creatorId, channelId, messageId = null }) {
  const slots = {};
  for (const role of config.partyRoles.slice(0, maxSlots)) slots[role.id] = null;

  // If maxSlots is lower than 8, keep the first N configured slots.
  const party = {
    id: makeId("party"),
    name,
    nest,
    maxSlots,
    creatorId,
    channelId,
    messageId,
    status: "OPEN",
    slots,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  return party;
}

module.exports = {
  buildPartyEmbed,
  buildPartyComponents,
  buildUserSelect,
  buildRoleSelect,
  buildKickSelect,
  buildSwapSelect,
  buildNestSelect,
  createParty,
  roleName,
  statusText
};
