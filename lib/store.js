const fs = require("node:fs");
const path = require("node:path");

const DATA_FILE = path.join(__dirname, "..", "data.json");
const DEFAULT_DATA = {
  settings: {
    salaryChannelId: null,
    salaryDashboardMessageId: null,
    stampPrice: 3,
    salaryMembers: []
  },
  parties: {},
  sales: [],
  raidHistory: []
};

function cloneDefault() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function loadData() {
  ensureDataFile();

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return {
      ...cloneDefault(),
      ...parsed,
      settings: {
        ...cloneDefault().settings,
        ...(parsed.settings || {})
      },
      parties: parsed.parties || {},
      sales: parsed.sales || [],
      raidHistory: parsed.raidHistory || []
    };
  } catch (error) {
    console.error("data.json rusak, membuat data baru:", error);
    const fresh = cloneDefault();
    saveData(fresh);
    return fresh;
  }
}

function saveData(data) {
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, DATA_FILE);
}

module.exports = { loadData, saveData };
