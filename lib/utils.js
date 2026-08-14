const { PermissionFlagsBits } = require("discord.js");

function parseGold(input) {
  if (typeof input === "number") return input;
  let value = String(input).trim().toLowerCase().replace(/,/g, "");
  if (!value) return NaN;

  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)\s*(g|k|m|b)?$/);
  if (!match) return NaN;

  const number = Number(match[1]);
  const suffix = match[2] || "g";
  const multiplier = { g: 1, k: 1000, m: 1000000, b: 1000000000 }[suffix];
  return number * multiplier;
}

function formatGold(value) {
  const n = Number(value) || 0;
  if (Number.isInteger(n)) return `${n.toLocaleString("en-US")}g`;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}g`;
}

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("en-US");
}

function memberCount(party) {
  return Object.values(party.slots).filter(Boolean).length;
}

function findUserSlot(party, userId) {
  return Object.entries(party.slots).find(([, id]) => id === userId)?.[0] || null;
}

function hasPartyAdmin(interaction, party) {
  if (interaction.user.id === party.creatorId) return true;
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
}

function hasManageGuild(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
}

function makeId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = {
  parseGold,
  formatGold,
  formatNumber,
  memberCount,
  findUserSlot,
  hasPartyAdmin,
  hasManageGuild,
  makeId
};
