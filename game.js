const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const spotNameEl = document.querySelector("#spotName");
const messageEl = document.querySelector("#message");
const missionSummaryEl = document.querySelector("#missionSummary");
const actionButton = document.querySelector("#actionButton");
const menuButton = document.querySelector("#menuButton");
const versionEl = document.querySelector("#version");
const playTab = document.querySelector("#playTab");
const missionTab = document.querySelector("#missionTab");
const spotTab = document.querySelector("#spotTab");
const dexTab = document.querySelector("#dexTab");
const shopTab = document.querySelector("#shopTab");
const menuTab = document.querySelector("#menuTab");
const menuScreen = document.querySelector("#menuScreen");
const missionScreen = document.querySelector("#missionScreen");
const dexScreen = document.querySelector("#dexScreen");
const shopScreen = document.querySelector("#shopScreen");
const spotScreen = document.querySelector("#spotScreen");
const startButton = document.querySelector("#startButton");
const menuMusicButton = document.querySelector("#menuMusicButton");
const menuMissionButton = document.querySelector("#menuMissionButton");
const menuSpotButton = document.querySelector("#menuSpotButton");
const menuReloadButton = document.querySelector("#menuReloadButton");
const menuDexButton = document.querySelector("#menuDexButton");
const menuShopButton = document.querySelector("#menuShopButton");
const fullResetButton = document.querySelector("#fullResetButton");
const closeMissionButton = document.querySelector("#closeMissionButton");
const closeDexButton = document.querySelector("#closeDexButton");
const closeDexDetailButton = document.querySelector("#closeDexDetailButton");
const closeShopButton = document.querySelector("#closeShopButton");
const closeSpotButton = document.querySelector("#closeSpotButton");
const musicToggleButton = document.querySelector("#musicToggleButton");
const dexList = document.querySelector("#dexList");
const dexDetail = document.querySelector("#dexDetail");
const dexDetailArt = document.querySelector("#dexDetailArt");
const dexDetailLead = document.querySelector("#dexDetailLead");
const dexDetailRarity = document.querySelector("#dexDetailRarity");
const dexDetailName = document.querySelector("#dexDetailName");
const dexDetailMeta = document.querySelector("#dexDetailMeta");
const dexDetailSpot = document.querySelector("#dexDetailSpot");
const dexDetailTrend = document.querySelector("#dexDetailTrend");
const dexDetailSizes = document.querySelector("#dexDetailSizes");
const dexDetailText = document.querySelector("#dexDetailText");
const shopList = document.querySelector("#shopList");
const shopMoney = document.querySelector("#shopMoney");
const missionCount = document.querySelector("#missionCount");
const missionList = document.querySelector("#missionList");
const spotList = document.querySelector("#spotList");

const {
  version: GAME_VERSION,
  shinyOdds,
  rarityStyles,
  rodUpgrades,
  floatUpgrades,
  reelUpgrades,
  baitUpgrades,
  sizeTiers,
  feverSettings,
  starCatch,
  fishingSpots,
  bgmThemes,
  missionDefs,
  fishTypes,
} = window.GAME_CONFIG;

const COLLECTION_KEY = "tapFishingCollection";
const ECONOMY_KEY = "tapFishingEconomy";
const MISSION_KEY = "tapFishingMissions";
const MUSIC_KEY = "tapFishingMusic";

const titleDefs = [
  { id: "rookie", name: "新人釣り師", condition: () => true },
  { id: "collector", name: "図鑑の友", condition: () => Object.keys(state.collection).length >= 5 },
  { id: "deepHunter", name: "深海ハンター", condition: () => state.spotId === "deep" || getCollectionCount("ヌシ") > 0 },
  { id: "legend", name: "伝説を釣る者", condition: () => Object.keys(state.collection).reduce((sum, name) => sum + getCollectionCount(name), 0) >= 30 },
];

const dexRewardDefs = [
  { id: "allC", label: "Cコンプリート", reward: 220, condition: () => fishTypes.filter((type) => type.rarity === "C").every((type) => getCollectionCount(type.name) > 0) },
  { id: "firstSR", label: "SR初入手", reward: 360, condition: (type) => type.rarity === "SR" || type.rarity === "SSR" },
];

const rarityRank = {
  SSR: 4,
  SR: 3,
  R: 2,
  C: 1,
};

const missionKindLabels = {
  count: "基本",
  money: "基本",
  rare: "進行",
  spotCount: "場所",
  sizeCatch: "サイズ",
  rarityCount: "高難度",
  fishCount: "魚種",
  discovered: "図鑑",
  sizeComplete: "図鑑",
  fishSet: "伝説",
  shinyCount: "色違い",
};

const missionKindOrder = ["基本", "進行", "場所", "魚種", "サイズ", "図鑑", "高難度", "伝説", "色違い"];


const fishImages = new Map();

fishTypes.forEach((type) => {
  if (!type.image) return;
  const image = new Image();
  image.src = type.image;
  fishImages.set(type.image, image);
});

const state = {
  width: 0,
  height: 0,
  pixelRatio: 1,
  waterLine: 0,
  rodX: 0,
  bobber: { x: 0, y: 0, baseY: 0, visible: false, sunk: false },
  phase: "idle",
  view: "menu",
  score: 0,
  caughtCount: 0,
  money: loadEconomy().money,
  rodLevel: loadEconomy().rodLevel,
  rodId: loadEconomy().rodId,
  floatId: loadEconomy().floatId,
  reelId: loadEconomy().reelId,
  baitId: loadEconomy().baitId,
  owned: loadEconomy().owned,
  rewards: loadEconomy().rewards,
  titleId: loadEconomy().titleId,
  titles: loadEconomy().titles,
  spotId: loadEconomy().spotId,
  running: true,
  lastTime: 0,
  targetFish: null,
  showcaseFish: null,
  showcaseSize: null,
  showcasePrice: 0,
  showcaseShiny: false,
  feverTimer: 0,
  wasFeverActive: false,
  ambientFish: [],
  phaseTimer: 0,
  biteTimer: 0,
  showcaseTimer: 0,
  ripples: [],
  collection: loadCollection(),
  missions: loadMissions(),
  musicEnabled: loadMusicEnabled(),
  returnView: "game",
  audio: {
    context: null,
    masterGain: null,
    nextNoteTime: 0,
    noteIndex: 0,
    currentThemeId: "",
    unlocked: false,
    lastMusicToggleAt: 0,
  },
};

function closeDexDetail() {
  dexDetail.classList.add("is-hidden");
}

function openDexDetail(type) {
  const entry = getCollectionEntry(type.name);
  const discovered = entry.count > 0;
  const recommendedSpot = fishingSpots.find((spot) => spot.id === type.recommendedSpot);
  dexDetailArt.replaceChildren();

  if (discovered && type.image) {
    const image = document.createElement("img");
    image.src = type.image;
    image.alt = type.name;
    dexDetailArt.append(image);
  } else {
    const shadow = document.createElement("span");
    shadow.className = "dex-shadow";
    shadow.style.width = `${Math.min(82, Math.max(46, type.shadow))}%`;
    dexDetailArt.append(shadow);
  }

  dexDetailRarity.className = discovered ? `dex-rarity rarity-${type.rarity.toLowerCase()}` : "dex-rarity";
  dexDetailRarity.textContent = discovered ? type.rarity : "?";
  dexDetailName.textContent = discovered ? type.name : "???";
  dexDetailMeta.textContent = discovered ? `${entry.count}匹 / ${type.points}pt / 色違い ${entry.shiny}匹` : "未発見";
  dexDetailLead.textContent = discovered
    ? entry.shiny
      ? `色違いも確認済みじゃ! ${type.name}の記録としてはかなり特別じゃぞい。`
      : `${type.name}のことなら、わしに聞くとよいぞい。`
    : "まだ姿が確認できておらんのう。";
  dexDetailSpot.textContent = discovered ? recommendedSpot?.name || "不明" : "???";
  dexDetailTrend.textContent = discovered ? type.sizeHint || "まだ傾向は調査中じゃ。" : "???";
  dexDetailText.textContent = discovered
    ? type.description || "まだ詳しい解説は準備中じゃ。"
    : "まずは実際に釣り上げてみるのじゃ。姿を確かめれば、図鑑の記録もぐっと深まるぞい。";

  dexDetailSizes.replaceChildren(
    ...sizeTiers.map((tier) => {
      const chip = document.createElement("span");
      chip.className = `dex-size${discovered && entry.sizes[tier.label] ? " is-caught" : ""}`;
      chip.textContent = tier.label;
      return chip;
    })
  );

  dexDetail.classList.remove("is-hidden");
}

function loadMusicEnabled() {
  try {
    const saved = localStorage.getItem(MUSIC_KEY);
    return saved === null ? true : saved === "on";
  } catch {
    return true;
  }
}

function saveMusicEnabled() {
  localStorage.setItem(MUSIC_KEY, state.musicEnabled ? "on" : "off");
}

function loadEconomy() {
  try {
    const economy = JSON.parse(localStorage.getItem(ECONOMY_KEY)) || {};
    const legacyRodIds = ["bamboo", "flex", "quick", "master"];
    const legacyRod = legacyRodIds[Math.min(economy.rodLevel || 0, legacyRodIds.length - 1)] || "bamboo";
    const rodId = rodUpgrades.some((item) => item.id === economy.rodId) ? economy.rodId : legacyRod;
    const owned = economy.owned || {};
    return {
      money: Number.isFinite(economy.money) ? economy.money : 0,
      rodLevel: Number.isFinite(economy.rodLevel) ? economy.rodLevel : 0,
      rodId,
      floatId: floatUpgrades.some((item) => item.id === economy.floatId) ? economy.floatId : "plain",
      reelId: reelUpgrades.some((item) => item.id === economy.reelId) ? economy.reelId : "plain",
      baitId: baitUpgrades.some((item) => item.id === economy.baitId) ? economy.baitId : "normal",
      owned: {
        rods: [
          "bamboo",
          rodId,
          ...(owned.rods || []).filter((id) => id !== "bamboo" && id !== rodId && rodUpgrades.some((item) => item.id === id)),
        ],
        floats: ["plain", ...(owned.floats || []).filter((id) => id !== "plain" && floatUpgrades.some((item) => item.id === id))],
        reels: ["plain", ...(owned.reels || []).filter((id) => id !== "plain" && reelUpgrades.some((item) => item.id === id))],
        baits: ["normal", ...(owned.baits || []).filter((id) => id !== "normal" && baitUpgrades.some((item) => item.id === id))],
      },
      rewards: economy.rewards || {},
      titleId: titleDefs.some((item) => item.id === economy.titleId) ? economy.titleId : "rookie",
      titles: ["rookie", ...((economy.titles || []).filter((id) => id !== "rookie" && titleDefs.some((item) => item.id === id)))],
      spotId: fishingSpots.some((spot) => spot.id === economy.spotId) ? economy.spotId : "pier",
    };
  } catch {
    return {
      money: 0,
      rodLevel: 0,
      rodId: "bamboo",
      floatId: "plain",
      reelId: "plain",
      baitId: "normal",
      owned: { rods: ["bamboo"], floats: ["plain"], reels: ["plain"], baits: ["normal"] },
      rewards: {},
      titleId: "rookie",
      titles: ["rookie"],
      spotId: "pier",
    };
  }
}

function saveEconomy() {
  localStorage.setItem(
    ECONOMY_KEY,
    JSON.stringify({
      money: state.money,
      rodLevel: state.rodLevel,
      rodId: state.rodId,
      floatId: state.floatId,
      reelId: state.reelId,
      baitId: state.baitId,
      owned: state.owned,
      rewards: state.rewards,
      titleId: state.titleId,
      titles: state.titles,
      spotId: state.spotId,
    })
  );
}

function fullResetProgress() {
  if (!window.confirm("所持金、竿、図鑑、ミッションをすべてリセットします。よろしいですか？")) {
    return;
  }

  localStorage.removeItem(COLLECTION_KEY);
  localStorage.removeItem(ECONOMY_KEY);
  localStorage.removeItem(MISSION_KEY);
  state.score = 0;
  state.caughtCount = 0;
  state.money = 0;
  state.rodLevel = 0;
  state.rodId = "bamboo";
  state.floatId = "plain";
  state.reelId = "plain";
  state.baitId = "normal";
  state.owned = { rods: ["bamboo"], floats: ["plain"], reels: ["plain"], baits: ["normal"] };
  state.rewards = {};
  state.titleId = "rookie";
  state.titles = ["rookie"];
  state.spotId = "pier";
  state.collection = {};
  state.missions = {};
  resetGame();
  showView("menu");
}

function reloadLatest() {
  const url = new URL(window.location.href);
  url.searchParams.set("refresh", Date.now().toString());
  window.location.replace(url.toString());
}

function normalizeCollectionEntry(entry) {
  if (typeof entry === "number") {
    return {
      count: entry,
      sizes: {},
      shiny: 0,
    };
  }

  if (!entry || typeof entry !== "object") {
    return {
      count: 0,
      sizes: {},
      shiny: 0,
    };
  }

  const normalizedSizes = {};
  for (const tier of sizeTiers) {
    normalizedSizes[tier.label] = Boolean(entry.sizes?.[tier.label]);
  }

  return {
    count: Number.isFinite(entry.count) ? entry.count : 0,
    sizes: normalizedSizes,
    shiny: Number.isFinite(entry.shiny) ? entry.shiny : 0,
  };
}

function getCollectionEntry(name) {
  return normalizeCollectionEntry(state.collection[name]);
}

function getCollectionCount(name) {
  return getCollectionEntry(name).count;
}

function hasCaughtSize(name, sizeLabel) {
  return Boolean(getCollectionEntry(name).sizes[sizeLabel]);
}

function isSizeComplete(name) {
  return sizeTiers.every((tier) => hasCaughtSize(name, tier.label));
}

function loadCollection() {
  try {
    const rawCollection = JSON.parse(localStorage.getItem(COLLECTION_KEY)) || {};
    return Object.fromEntries(Object.entries(rawCollection).map(([name, entry]) => [name, normalizeCollectionEntry(entry)]));
  } catch {
    return {};
  }
}

function saveCollection() {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(state.collection));
}

function loadMissions() {
  try {
    return JSON.parse(localStorage.getItem(MISSION_KEY)) || {};
  } catch {
    return {};
  }
}

function saveMissions() {
  localStorage.setItem(MISSION_KEY, JSON.stringify(state.missions));
}

function noteToFrequency(note) {
  const match = /^([A-G])(#?)(\d)$/.exec(note);
  if (!match) return 440;
  const [, letter, sharp, octaveText] = match;
  const semitones = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const octave = Number(octaveText);
  const distance = semitones[letter] + (sharp ? 1 : 0) + (octave - 4) * 12;
  return 440 * 2 ** (distance / 12);
}

function ensureAudioContext() {
  if (state.audio.context) {
    return state.audio.context;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  const context = new AudioContextClass();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.72;
  masterGain.connect(context.destination);

  state.audio.context = context;
  state.audio.masterGain = masterGain;
  return context;
}

function scheduleVoice(note, startTime, duration, type, volume) {
  const context = state.audio.context;
  const masterGain = state.audio.masterGain;
  if (!context || !masterGain || !note) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(noteToFrequency(note), startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

function playSfxTone(startTime, frequency, duration, type, volume, endFrequency = frequency) {
  const context = state.audio.context;
  const masterGain = state.audio.masterGain;
  if (!context || !masterGain) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
}

function playSfx(kind) {
  const context = state.audio.context;
  if (!context || context.state !== "running") {
    return;
  }

  const now = context.currentTime + 0.01;

  if (kind === "nibble") {
    playSfxTone(now, 700, 0.05, "square", 0.035, 620);
    playSfxTone(now + 0.07, 760, 0.05, "square", 0.03, 680);
    return;
  }

  if (kind === "bite") {
    playSfxTone(now, 980, 0.08, "triangle", 0.05, 440);
    playSfxTone(now + 0.05, 620, 0.12, "sine", 0.035, 240);
    return;
  }

  if (kind === "fever") {
    playSfxTone(now, 740, 0.08, "triangle", 0.048, 980);
    playSfxTone(now + 0.08, 980, 0.08, "triangle", 0.05, 1320);
    playSfxTone(now + 0.18, 1320, 0.16, "sine", 0.045, 1760);
    return;
  }

  if (kind === "catch") {
    playSfxTone(now, 520, 0.08, "triangle", 0.045, 680);
    playSfxTone(now + 0.08, 680, 0.09, "triangle", 0.045, 880);
    playSfxTone(now + 0.18, 880, 0.14, "sine", 0.04, 1180);
    return;
  }

  if (kind === "catch-ssr") {
    playSfxTone(now, 460, 0.1, "triangle", 0.05, 620);
    playSfxTone(now + 0.09, 620, 0.1, "triangle", 0.052, 860);
    playSfxTone(now + 0.18, 860, 0.14, "sine", 0.05, 1260);
    playSfxTone(now + 0.31, 1160, 0.22, "sine", 0.05, 1640);
    playSfxTone(now + 0.31, 580, 0.18, "triangle", 0.032, 900);
    return;
  }

  if (kind === "miss") {
    playSfxTone(now, 360, 0.12, "sawtooth", 0.03, 150);
  }
}

function scheduleBgm() {
  const context = state.audio.context;
  if (!context || !state.musicEnabled || context.state !== "running") {
    return;
  }

  const themeId = getBgmThemeId();
  const theme = bgmThemes[themeId] || bgmThemes.pier;
  const stepDuration = 60 / theme.tempo / 2;
  const lookAhead = 0.18;

  while (state.audio.nextNoteTime < context.currentTime + lookAhead) {
    const stepIndex = state.audio.noteIndex;
    const leadNotes = theme.lead[stepIndex % theme.lead.length] || [];
    const padNotes = theme.pad[stepIndex % theme.pad.length] || [];

    leadNotes.forEach((note) => {
      scheduleVoice(note, state.audio.nextNoteTime, stepDuration * 0.92, theme.leadType, theme.leadGain);
    });
    padNotes.forEach((note) => {
      scheduleVoice(note, state.audio.nextNoteTime, stepDuration * 1.8, theme.padType, theme.padGain);
    });

    state.audio.nextNoteTime += stepDuration;
    state.audio.noteIndex += 1;
  }
}

function updateMusicButton() {
  const isPlayingCurrentTheme = isCurrentBgmPlaying();
  musicToggleButton.textContent = state.musicEnabled ? "BGM ON" : "BGM OFF";
  musicToggleButton.classList.toggle("is-on", state.musicEnabled);
  menuMusicButton.textContent = isPlayingCurrentTheme ? "BGMを止める" : state.musicEnabled ? "BGMを再開" : "BGMを鳴らす";
  menuMusicButton.classList.toggle("is-on", isPlayingCurrentTheme);
}

function getBgmThemeId() {
  return state.view === "menu" ? "menu" : getCurrentSpot().id;
}

function syncBgm(forceRestart = false) {
  if (!state.musicEnabled) {
    state.audio.currentThemeId = "";
    updateMusicButton();
    return;
  }

  if (!state.audio.unlocked) {
    updateMusicButton();
    return;
  }

  const context = ensureAudioContext();
  if (!context) {
    updateMusicButton();
    return;
  }

  const themeId = getBgmThemeId();
  if (forceRestart || state.audio.currentThemeId !== themeId) {
    state.audio.currentThemeId = themeId;
    state.audio.noteIndex = 0;
    state.audio.nextNoteTime = context.currentTime + 0.03;
  }

  scheduleBgm();
  updateMusicButton();
}

function unlockAudio() {
  const wasUnlocked = state.audio.unlocked;
  state.audio.unlocked = true;
  const context = ensureAudioContext();
  if (!context) {
    updateMusicButton();
    return;
  }

  if (context.state === "suspended") {
    context.resume().then(() => syncBgm(!wasUnlocked)).catch(() => {});
    return;
  }
  syncBgm(!wasUnlocked);
}

function startMusic() {
  state.musicEnabled = true;
  saveMusicEnabled();
  state.audio.unlocked = true;

  const context = ensureAudioContext();
  if (!context) {
    updateMusicButton();
    return;
  }

  state.audio.currentThemeId = "";
  state.audio.noteIndex = 0;
  state.audio.nextNoteTime = context.currentTime + 0.03;

  if (context.state === "suspended") {
    context.resume().then(() => syncBgm(true)).catch(() => {});
    updateMusicButton();
    return;
  }

  syncBgm(true);
}

function stopMusic() {
  state.musicEnabled = false;
  saveMusicEnabled();
  state.audio.currentThemeId = "";
  updateMusicButton();

  if (state.audio.context && state.audio.context.state === "running") {
    state.audio.context.suspend().catch(() => {});
  }
}

function isCurrentBgmPlaying() {
  const context = state.audio.context;
  const activeThemeId = getBgmThemeId();
  return (
    state.musicEnabled &&
    state.audio.unlocked &&
    context &&
    context.state === "running" &&
    state.audio.currentThemeId === activeThemeId
  );
}

function toggleMusic() {
  if (isCurrentBgmPlaying()) {
    stopMusic();
    return;
  }

  startMusic();
}

function handleMusicToggleEvent(event) {
  event.preventDefault();
  const now = performance.now();
  if (now - state.audio.lastMusicToggleAt < 260) {
    return;
  }

  state.audio.lastMusicToggleAt = now;
  toggleMusic();
}

function getCurrentSpot() {
  return fishingSpots.find((spot) => spot.id === state.spotId) || fishingSpots[0];
}

function getEquippedRod() {
  return rodUpgrades.find((item) => item.id === state.rodId) || rodUpgrades[0];
}

function getEquippedFloat() {
  return floatUpgrades.find((item) => item.id === state.floatId) || floatUpgrades[0];
}

function getEquippedReel() {
  return reelUpgrades.find((item) => item.id === state.reelId) || reelUpgrades[0];
}

function getEquippedBait() {
  return baitUpgrades.find((item) => item.id === state.baitId) || baitUpgrades[0];
}

function getCurrentTitle() {
  return titleDefs.find((item) => item.id === state.titleId) || titleDefs[0];
}

function showView(view) {
  state.view = view;
  if (view === "menu" || view === "game") {
    state.returnView = view;
  }
  menuScreen.classList.toggle("is-hidden", view !== "menu");
  missionScreen.classList.toggle("is-hidden", view !== "mission");
  dexScreen.classList.toggle("is-hidden", view !== "dex");
  shopScreen.classList.toggle("is-hidden", view !== "shop");
  spotScreen.classList.toggle("is-hidden", view !== "spot");
  playTab.classList.toggle("is-active", view === "game");
  missionTab.classList.toggle("is-active", view === "mission");
  spotTab.classList.toggle("is-active", view === "spot");
  dexTab.classList.toggle("is-active", view === "dex");
  shopTab.classList.toggle("is-active", view === "shop");
  menuTab.classList.toggle("is-active", view === "menu");

  if (view === "mission") {
    renderMissions();
  }
  if (view === "dex") {
    closeDexDetail();
    renderDex();
  }
  if (view === "shop") {
    renderShop();
  }
  if (view === "spot") {
    renderSpots();
  }

  syncBgm();
}

function showPanel(view, returnView = state.view === "menu" ? "menu" : "game") {
  state.returnView = returnView;
  showView(view);
}

function closePanel() {
  showView(state.returnView || "game");
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  state.width = Math.floor(rect.width);
  state.height = Math.floor(rect.height);
  canvas.width = Math.floor(state.width * state.pixelRatio);
  canvas.height = Math.floor(state.height * state.pixelRatio);
  ctx.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
  state.waterLine = state.height * 0.38;
  state.rodX = state.width * 0.5;
  positionBobber();
  makeAmbientFish();
}

function positionBobber() {
  state.bobber.x = state.width * 0.5;
  state.bobber.baseY = state.waterLine + Math.max(64, state.height * 0.16);
  state.bobber.y = state.bobber.baseY;
}

function randomFishType(includeSpecial = true) {
  const rod = getEquippedRod();
  const bait = getEquippedBait();
  const spot = getCurrentSpot();
  const feverActive = state.feverTimer > 0;
  const weightedTypes = fishTypes.map((type) => {
    const difficultyGap = Math.max(0, type.catchDifficulty - state.rodLevel);
    const difficultyPenalty = 1 / (1 + difficultyGap * 1.3);
    const rarityBoost =
      type.rarity === "SSR" ? rod.rareBonus * 1.18 : type.rarity === "SR" ? rod.rareBonus : type.rarity === "R" ? rod.rareBonus * 0.45 : 0;
    const feverBoost = feverActive ? feverSettings.rarityMultiplier[type.rarity] || 1 : 1;
    return {
      type,
      weight:
        type.catchWeight *
        difficultyPenalty *
        spot.rarityMultiplier[type.rarity] *
        bait.rarityMultiplier[type.rarity] *
        (1 + (bait.fishBonus[type.name] || 0)) *
        (1 + rarityBoost) *
        feverBoost,
    };
  });

  if (includeSpecial && !feverActive) {
    weightedTypes.push({
      type: starCatch,
      weight: feverSettings.starWeight,
    });
  }

  const totalWeight = weightedTypes.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of weightedTypes) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.type;
    }
  }

  return fishTypes[0];
}

function getBiteWindow(type) {
  const difficultyGap = Math.max(0, type.catchDifficulty - state.rodLevel);
  const difficultyPenalty = difficultyGap * 0.14;
  return Math.max(0.24, type.biteWindow + getEquippedRod().biteBonus + getEquippedFloat().biteBonus + getEquippedReel().biteBonus - difficultyPenalty);
}

function randomFishSize() {
  const spot = getCurrentSpot();
  const weightedSizes = sizeTiers.map((tier, index) => {
    const feverBigBonus = state.feverTimer > 0 ? feverSettings.bigBonus : 0;
    const bigBonus = spot.bigBonus + feverBigBonus;
    const bigBoost = index >= 2 ? 1 + bigBonus * (index === 3 ? 1.8 : 1) : 1;
    return { tier, weight: tier.weight * bigBoost };
  });
  const totalWeight = weightedSizes.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of weightedSizes) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.tier;
    }
  }

  return sizeTiers[1];
}

function makeAmbientFish() {
  state.ambientFish = Array.from({ length: 2 }, (_, index) => makeShadow(index));
}

function makeShadow(index) {
  const type = randomFishType(false);
  const direction = Math.random() > 0.5 ? 1 : -1;
  const yMin = state.waterLine + 58;
  const yMax = state.height - Math.max(118, state.height * 0.22);
  return {
    type,
    x: direction > 0 ? -type.shadow - index * 260 : state.width + type.shadow + index * 260,
    y: yMin + Math.random() * Math.max(50, yMax - yMin),
    direction,
    speed: type.speed * (0.55 + Math.random() * 0.35),
    wobble: Math.random() * Math.PI * 2,
    alpha: 0.12 + Math.random() * 0.08,
  };
}

function makeTargetFish() {
  const type = randomFishType();
  const size = type.isStar ? sizeTiers[1] : randomFishSize();
  const shiny = !type.isStar && Math.floor(Math.random() * shinyOdds) === 0;
  const side = Math.random() > 0.5 ? -1 : 1;
  const startX = state.bobber.x + side * Math.max(state.width * 0.3, 180);
  return {
    type,
    size,
    shiny,
    x: startX,
    y: state.bobber.baseY + 62 + Math.random() * 42,
    targetX: state.bobber.x + (Math.random() - 0.5) * 24,
    targetY: state.bobber.baseY + 34,
    direction: side > 0 ? -1 : 1,
    wobble: Math.random() * Math.PI * 2,
  };
}

function resetGame() {
  state.score = 0;
  state.caughtCount = 0;
  state.running = true;
  state.phase = "idle";
  state.phaseTimer = 0;
  state.biteTimer = 0;
  state.showcaseTimer = 0;
  state.targetFish = null;
  state.showcaseFish = null;
  state.showcaseSize = null;
  state.showcasePrice = 0;
  state.feverTimer = 0;
  state.wasFeverActive = false;
  state.ripples = [];
  state.bobber.visible = false;
  state.bobber.sunk = false;
  positionBobber();
  makeAmbientFish();
  updateHud();
  updateMissionSummary();
  setMessage("タップで浮きを投げよう", "投げる");
}

function updateHud() {
  scoreEl.textContent = `${state.money}`;
  spotNameEl.textContent = getCurrentSpot().name;
  versionEl.textContent = GAME_VERSION;
  if (state.feverTimer > 0) {
    missionSummaryEl.textContent = `FEVER ${Math.ceil(state.feverTimer)}秒 / レア魚と大物の気配アップ`;
  } else if (state.wasFeverActive) {
    state.wasFeverActive = false;
    updateMissionSummary();
  }
}

function renderDex() {
  const sortedFishTypes = [...fishTypes].sort((left, right) => {
    const rarityDiff = (rarityRank[right.rarity] || 0) - (rarityRank[left.rarity] || 0);
    if (rarityDiff !== 0) return rarityDiff;
    const pointDiff = right.points - left.points;
    if (pointDiff !== 0) return pointDiff;
    return left.name.localeCompare(right.name, "ja");
  });

  dexList.replaceChildren(
    ...sortedFishTypes.map((type) => {
      const entry = getCollectionEntry(type.name);
      const count = entry.count;
      const shinyCount = entry.shiny;
      const sizeComplete = count ? isSizeComplete(type.name) : false;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `dex-card rarity-card-${type.rarity.toLowerCase()}${shinyCount ? " has-shiny" : ""}${count ? "" : " is-locked"}`;

      const art = document.createElement("div");
      art.className = "dex-art";

      if (count && type.image) {
        const image = document.createElement("img");
        image.src = type.image;
        image.alt = type.name;
        art.append(image);
      } else {
        const shadow = document.createElement("span");
        shadow.className = "dex-shadow";
        shadow.style.width = `${Math.min(82, Math.max(46, type.shadow))}%`;
        art.append(shadow);
      }

      const name = document.createElement("div");
      name.className = "dex-name";
      name.textContent = count ? type.name : "???";

      const header = document.createElement("div");
      header.className = "dex-header-row";

      const rarity = document.createElement("div");
      rarity.className = `dex-rarity rarity-${type.rarity.toLowerCase()}`;
      rarity.textContent = type.rarity;

      const meta = document.createElement("div");
      meta.className = "dex-meta";
      meta.textContent = count ? `${count}匹 / ${type.points}pt${shinyCount ? ` / 色違い${shinyCount}` : ""}` : "未発見";

      const complete = document.createElement("div");
      complete.className = `dex-complete${sizeComplete ? " is-done" : ""}${count ? "" : " is-locked"}`;
      complete.textContent = count ? (sizeComplete ? "COMP" : "SIZE") : "--";

      header.append(rarity, complete);

      if (shinyCount) {
        const shinyBadge = document.createElement("div");
        shinyBadge.className = "dex-shiny-badge";
        shinyBadge.textContent = "色違い";
        header.append(shinyBadge);
      }

      const sizes = document.createElement("div");
      sizes.className = "dex-sizes";
      for (const tier of sizeTiers) {
        const chip = document.createElement("span");
        const caught = entry.sizes[tier.label];
        chip.className = `dex-size${caught ? " is-caught" : ""}`;
        chip.textContent = tier.label;
        sizes.append(chip);
      }

      card.addEventListener("click", () => openDexDetail(type));
      card.append(art, header, name, meta, sizes);
      return card;
    })
  );
}

function renderShop() {
  shopMoney.textContent = `${state.money}円`;
  const sections = [
    { title: "竿", items: rodUpgrades, ownedKey: "rods", equippedKey: "rodId", buy: buyRod, describe: describeRod },
    { title: "浮き", items: floatUpgrades, ownedKey: "floats", equippedKey: "floatId", buy: buyFloat, describe: describeFloat },
    { title: "リール", items: reelUpgrades, ownedKey: "reels", equippedKey: "reelId", buy: buyReel, describe: describeReel },
    { title: "エサ", items: baitUpgrades, ownedKey: "baits", equippedKey: "baitId", buy: buyBait, describe: describeBait },
  ];
  const nodes = [];

  for (const section of sections) {
    const heading = document.createElement("h3");
    heading.className = "shop-section-title";
    heading.textContent = section.title;
    nodes.push(heading);

    for (const item of section.items) {
      const owned = state.owned[section.ownedKey].includes(item.id);
      const equipped = state[section.equippedKey] === item.id;
      const affordable = state.money >= item.cost;
      const card = document.createElement("article");
      card.className = "shop-card";

      const info = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = item.name;
      const detail = document.createElement("p");
      detail.textContent = section.describe(item);
      info.append(title, detail);

      const button = document.createElement("button");
      button.className = "buy-button";
      button.type = "button";
      button.disabled = equipped || (!owned && !affordable);
      button.textContent = equipped ? "装備中" : owned ? "装備" : `${item.cost}円`;
      button.addEventListener("click", () => section.buy(item.id));

      card.append(info, button);
      nodes.push(card);
    }
  }

  shopList.replaceChildren(...nodes);
}

function describeRod(rod) {
  return `反応 +${rod.biteBonus.toFixed(2)}秒 / 高レア +${Math.round(rod.rareBonus * 100)}% / 売値 +${Math.round(rod.saleBonus * 100)}%`;
}

function describeFloat(float) {
  return `前兆 +${float.nibbleBonus.toFixed(2)}秒 / 反応 +${float.biteBonus.toFixed(2)}秒`;
}

function describeReel(reel) {
  return `反応 +${reel.biteBonus.toFixed(2)}秒 / 売値 +${Math.round(reel.saleBonus * 100)}%`;
}

function describeBait(bait) {
  const highRare = Math.round(((bait.rarityMultiplier.SSR || bait.rarityMultiplier.SR) - 1) * 100);
  return highRare ? `高レア出現 ${highRare > 0 ? "+" : ""}${highRare}%` : "標準の出現率";
}

function renderSpots() {
  spotList.replaceChildren(
    ...fishingSpots.map((spot) => {
      const selected = spot.id === state.spotId;
      const locked = state.rodLevel < spot.unlockRodLevel;
      const card = document.createElement("article");
      card.className = "spot-card";

      const info = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = spot.name;
      const detail = document.createElement("p");
      const requiredRod = rodUpgrades.find((rod) => rod.power >= spot.unlockRodLevel);
      detail.textContent = locked ? `${requiredRod.name}以上が必要` : spot.description;
      info.append(title, detail);

      const button = document.createElement("button");
      button.className = "spot-button";
      button.type = "button";
      button.disabled = locked || selected;
      button.textContent = selected ? "選択中" : locked ? "未開放" : "行く";
      button.addEventListener("click", () => selectSpot(spot.id));

      card.append(info, button);
      return card;
    })
  );
}

function selectSpot(spotId) {
  const spot = fishingSpots.find((item) => item.id === spotId);
  if (!spot || state.rodLevel < spot.unlockRodLevel) {
    return;
  }

  state.spotId = spotId;
  saveEconomy();
  makeAmbientFish();
  updateHud();
  renderSpots();
  setMessage(`${spot.name}に移動した`, "投げる");
  syncBgm(true);
}

function getMissionProgress(def) {
  if (def.kind === "discovered") {
    return fishTypes.reduce((sum, type) => sum + (getCollectionCount(type.name) > 0 ? 1 : 0), 0);
  }

  if (def.kind === "sizeComplete") {
    return fishTypes.reduce((sum, type) => sum + (isSizeComplete(type.name) ? 1 : 0), 0);
  }

  if (def.kind === "fishSet") {
    return (def.fishNames || []).reduce((sum, name) => sum + (getCollectionCount(name) > 0 ? 1 : 0), 0);
  }

  return state.missions[def.id]?.progress || 0;
}

function getMissionCardProgress(def) {
  return Math.min(def.target, getMissionProgress(def));
}

function getCompletedMissionCount() {
  return missionDefs.filter((def) => state.missions[def.id]?.completed).length;
}

function isSpotUnlocked(spotId) {
  const spot = fishingSpots.find((item) => item.id === spotId);
  return !spot || state.rodLevel >= spot.unlockRodLevel;
}

function isMissionSpoilerHidden(def) {
  if (state.missions[def.id]?.completed) return false;

  if (def.spotId && !isSpotUnlocked(def.spotId)) {
    return true;
  }

  if (def.fishName && getCollectionCount(def.fishName) <= 0) {
    return true;
  }

  if (def.fishNames?.some((name) => def.label.includes(name) && getCollectionCount(name) <= 0)) {
    return true;
  }

  return (def.fishNames || []).some((name) => {
    const type = fishTypes.find((fishType) => fishType.name === name);
    return type?.recommendedSpot && !isSpotUnlocked(type.recommendedSpot);
  });
}

function getMissionDisplay(def) {
  if (!isMissionSpoilerHidden(def)) {
    return {
      hidden: false,
      label: def.label,
      badge: missionKindLabels[def.kind] || "任務",
      reward: `${def.reward}円`,
    };
  }

  return {
    hidden: true,
    label: "まだ見ぬ任務",
    badge: "未開示",
    reward: "???円",
  };
}

function renderMissions() {
  missionCount.textContent = `${getCompletedMissionCount()} / ${missionDefs.length} 完了`;
  const missionGroups = new Map();

  missionDefs.forEach((def) => {
    const key = missionKindLabels[def.kind] || "任務";
    if (!missionGroups.has(key)) {
      missionGroups.set(key, []);
    }
    missionGroups.get(key).push(def);
  });

  const orderedGroups = [
    ...missionKindOrder.filter((key) => missionGroups.has(key)),
    ...[...missionGroups.keys()].filter((key) => !missionKindOrder.includes(key)),
  ];

  missionList.replaceChildren(
    ...orderedGroups.map((groupName) => {
      const section = document.createElement("section");
      section.className = "mission-section";
      const defs = missionGroups.get(groupName);
      const completedInGroup = defs.filter((def) => state.missions[def.id]?.completed).length;

      const heading = document.createElement("header");
      heading.className = "mission-section-header";
      const title = document.createElement("h3");
      title.textContent = groupName;
      const count = document.createElement("span");
      count.textContent = `${completedInGroup} / ${defs.length}`;
      heading.append(title, count);

      const cards = document.createElement("div");
      cards.className = "mission-section-cards";

      const sortedDefs = [...defs].sort((left, right) => {
        const leftDone = state.missions[left.id]?.completed ? 1 : 0;
        const rightDone = state.missions[right.id]?.completed ? 1 : 0;
        return leftDone - rightDone;
      });

      cards.replaceChildren(...sortedDefs.map((def) => {
        const progress = getMissionCardProgress(def);
        const completed = Boolean(state.missions[def.id]?.completed);
        const display = getMissionDisplay(def);
        const card = document.createElement("article");
        card.className = `mission-card${completed ? " is-done" : ""}${display.hidden ? " is-secret" : ""}`;

        const head = document.createElement("div");
        head.className = "mission-card-head";

        const titleWrap = document.createElement("div");
        const badge = document.createElement("span");
        badge.className = "mission-kind";
        badge.textContent = display.badge;
        const title = document.createElement("h3");
        title.textContent = display.label;
        titleWrap.append(badge, title);

        const reward = document.createElement("div");
        reward.className = "mission-reward";
        reward.textContent = display.reward;

        head.append(titleWrap, reward);

        const meter = document.createElement("div");
        meter.className = "mission-meter";
        const fill = document.createElement("span");
        const progressRate = (progress / def.target) * 100;
        fill.style.width = display.hidden || progress <= 0 ? "0%" : `${Math.max(6, progressRate)}%`;
        meter.append(fill);

        const meta = document.createElement("div");
        meta.className = "mission-meta";
        meta.textContent = display.hidden ? "ゲームを進めると内容が判明" : completed ? "達成済み" : `${progress} / ${def.target}`;

        card.append(head, meter, meta);
        return card;
      }));

      section.append(heading, cards);
      return section;
    })
  );
}

function updateMissionSummary() {
  const openMission = missionDefs.find((def) => !state.missions[def.id]?.completed);
  if (!openMission) {
    missionSummaryEl.textContent = `称号: ${getCurrentTitle().name} / ミッション ${missionDefs.length}件達成`;
    return;
  }

  const progress = getMissionCardProgress(openMission);
  const display = getMissionDisplay(openMission);
  const missionText = display.hidden ? "未開示の任務" : `${display.label} ${progress}/${openMission.target}`;
  missionSummaryEl.textContent = `称号: ${getCurrentTitle().name} / 任務 ${getCompletedMissionCount()}/${missionDefs.length} / ${missionText}`;
}

function updateMissions(type, salePrice, size, shiny = false) {
  let rewardTotal = 0;
  for (const def of missionDefs) {
    const mission = state.missions[def.id] || { progress: 0, completed: false };
    if (mission.completed) continue;

    if (def.kind === "count") {
      mission.progress += 1;
    }
    if (def.kind === "money") {
      mission.progress += salePrice;
    }
    if (def.kind === "rare" && type.rarity !== "C") {
      mission.progress += 1;
    }
    if (def.kind === "spotCount" && state.spotId === def.spotId) {
      mission.progress += 1;
    }
    if (def.kind === "sizeCatch" && size?.label === def.sizeLabel) {
      mission.progress += 1;
    }
    if (def.kind === "rarityCount" && (rarityRank[type.rarity] || 0) >= (rarityRank[def.rarity] || 0)) {
      mission.progress += 1;
    }
    if (def.kind === "fishCount" && type.name === def.fishName) {
      mission.progress += 1;
    }
    if (def.kind === "shinyCount" && shiny) {
      mission.progress += 1;
    }
    if (def.kind === "discovered") {
      mission.progress = fishTypes.reduce((sum, fishType) => sum + (getCollectionCount(fishType.name) > 0 ? 1 : 0), 0);
    }
    if (def.kind === "sizeComplete") {
      mission.progress = fishTypes.reduce((sum, fishType) => sum + (isSizeComplete(fishType.name) ? 1 : 0), 0);
    }
    if (def.kind === "fishSet") {
      mission.progress = (def.fishNames || []).reduce((sum, name) => sum + (getCollectionCount(name) > 0 ? 1 : 0), 0);
    }

    if (mission.progress >= def.target) {
      mission.progress = def.target;
      mission.completed = true;
      state.money += def.reward;
      rewardTotal += def.reward;
    }

    state.missions[def.id] = mission;
  }

  saveMissions();
  saveEconomy();
  updateMissionSummary();
  if (state.view === "mission") {
    renderMissions();
  }
  return rewardTotal;
}

function updateRewards(type, firstTime) {
  let rewardTotal = 0;
  const discoveryId = `new:${type.name}`;

  if (firstTime && !state.rewards[discoveryId]) {
    state.rewards[discoveryId] = true;
    state.money += 40;
    rewardTotal += 40;
  }

  for (const def of dexRewardDefs) {
    if (state.rewards[def.id]) continue;
    if (!def.condition(type, firstTime)) continue;

    state.rewards[def.id] = true;
    state.money += def.reward;
    rewardTotal += def.reward;
  }

  saveEconomy();
  return rewardTotal;
}

function updateTitles() {
  for (const def of titleDefs) {
    if (!state.titles.includes(def.id) && def.condition()) {
      state.titles.push(def.id);
      state.titleId = def.id;
    }
  }
  saveEconomy();
}

function buyOrEquip(collectionKey, equipKey, items, id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  if (!state.owned[collectionKey].includes(id)) {
    if (state.money < item.cost) return;
    state.money -= item.cost;
    state.owned[collectionKey].push(id);
  }

  state[equipKey] = id;
  if (collectionKey === "rods") {
    state.rodLevel = item.power;
    if (getCurrentSpot().unlockRodLevel > state.rodLevel) {
      state.spotId = "pier";
    }
  }

  saveEconomy();
  updateHud();
  renderShop();
}

function buyRod(id) {
  buyOrEquip("rods", "rodId", rodUpgrades, id);
}

function buyFloat(id) {
  buyOrEquip("floats", "floatId", floatUpgrades, id);
}

function buyReel(id) {
  buyOrEquip("reels", "reelId", reelUpgrades, id);
}

function buyBait(id) {
  buyOrEquip("baits", "baitId", baitUpgrades, id);
}

function setMessage(text, buttonText) {
  messageEl.textContent = text;
  actionButton.textContent = buttonText;
}

function handleTap(event) {
  event.preventDefault();
  unlockAudio();
  if (state.view !== "game") {
    return;
  }

  if (!state.running) {
    resetGame();
    return;
  }

  if (state.phase === "idle") {
    castBobber();
    return;
  }

  if (state.phase === "bite") {
    catchFish();
    return;
  }

  if (state.phase === "showcase") {
    state.phase = "idle";
    state.showcaseFish = null;
    state.showcaseSize = null;
    state.showcasePrice = 0;
    state.showcaseShiny = false;
    setMessage("タップで浮きを投げよう", "投げる");
    return;
  }

  if (state.phase === "waiting" || state.phase === "nibble") {
    missFish("早すぎた! 魚が逃げた");
  }
}

function castBobber() {
  state.phase = "casting";
  state.phaseTimer = 0.34;
  state.bobber.visible = true;
  state.bobber.sunk = false;
  state.bobber.y = state.height - 52;
  state.targetFish = makeTargetFish();
  state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 6, alpha: 1 });
  setMessage("魚影が近づくまで待とう", "待つ");
}

function startFever() {
  state.feverTimer = feverSettings.duration;
  state.wasFeverActive = true;
  playSfx("fever");
  setMessage(`星を釣った! ${feverSettings.duration}秒フィーバー!`, "次を投げる");
}

function catchFish() {
  const fish = state.targetFish;
  if (fish.type.isStar) {
    startFever();
    state.phase = "showcase";
    state.showcaseTimer = 2.35;
    state.showcaseFish = fish.type;
    state.showcaseSize = fish.size;
    state.showcasePrice = 0;
    state.showcaseShiny = false;
    state.targetFish = null;
    state.bobber.sunk = false;
    state.bobber.visible = false;
    state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 8, alpha: 1 });
    return;
  }

  const saleBonus = 1 + getEquippedRod().saleBonus + getEquippedReel().saleBonus;
  const salePrice = Math.round(fish.type.points * fish.size.multiplier * saleBonus);
  state.score += fish.type.points;
  state.caughtCount += 1;
  state.money += salePrice;
  const currentEntry = getCollectionEntry(fish.type.name);
  const firstTime = currentEntry.count === 0;
  const shinyCount = currentEntry.shiny + (fish.shiny ? 1 : 0);
  state.collection[fish.type.name] = {
    count: currentEntry.count + 1,
    sizes: {
      ...currentEntry.sizes,
      [fish.size.label]: true,
    },
    shiny: shinyCount,
  };
  const rewardTotal = updateRewards(fish.type, firstTime);
  const missionReward = updateMissions(fish.type, salePrice, fish.size, fish.shiny);
  updateTitles();
  updateMissionSummary();
  saveCollection();
  saveEconomy();
  state.phase = "showcase";
  state.showcaseTimer = 1.8;
  state.showcaseFish = fish.type;
  state.showcaseSize = fish.size;
  state.showcasePrice = salePrice;
  state.showcaseShiny = fish.shiny;
  state.targetFish = null;
  state.bobber.sunk = false;
  state.bobber.visible = false;
  state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 8, alpha: 1 });
  playSfx(fish.shiny || fish.type.rarity === "SSR" ? "catch-ssr" : "catch");
  const totalBonus = missionReward + rewardTotal;
  const rewardText = totalBonus ? ` / ボーナス +${totalBonus}円` : "";
  const shinyText = fish.shiny ? "色違い! " : "";
  setMessage(`${shinyText}${fish.size.label} ${fish.type.name}を売った! +${salePrice}円${rewardText}`, "次を投げる");
}

function missFish(text) {
  state.phase = "missed";
  state.phaseTimer = 0.85;
  state.bobber.sunk = false;
  state.targetFish = null;
  state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 10, alpha: 0.8 });
  playSfx("miss");
  setMessage(text, "次を投げる");
}

function update(delta) {
  updateFever(delta);
  updateHud();
  updateFishing(delta);
  updateAmbientFish(delta);
  updateRipples(delta);
  scheduleBgm();
}

function updateFever(delta) {
  if (state.feverTimer <= 0) return;
  state.feverTimer = Math.max(0, state.feverTimer - delta);
}

function updateFishing(delta) {
  if (state.phase === "casting") {
    state.phaseTimer -= delta;
    state.bobber.y += (state.bobber.baseY - state.bobber.y) * Math.min(1, delta * 12);
    if (state.phaseTimer <= 0) {
      state.phase = "waiting";
      state.phaseTimer = 1.1 + Math.random() * 1.6;
      state.bobber.y = state.bobber.baseY;
    }
  }

  if (state.phase === "waiting") {
    moveTargetFish(delta, 0.62);
    state.phaseTimer -= delta;
    if (state.phaseTimer <= 0 && isTargetNearBobber()) {
      state.phase = "nibble";
      state.phaseTimer = 0.5 + getEquippedFloat().nibbleBonus + Math.random() * 0.75;
      playSfx("nibble");
      setMessage("つついてる...", "まだ");
    }
  }

  if (state.phase === "nibble") {
    moveTargetFish(delta, 0.25);
    state.phaseTimer -= delta;
    state.bobber.y = state.bobber.baseY + Math.sin(performance.now() * 0.04) * 8;
    if (state.phaseTimer <= 0) {
      state.phase = "bite";
      state.biteTimer = getBiteWindow(state.targetFish.type);
      state.bobber.sunk = true;
      state.bobber.y = state.bobber.baseY + 32;
      state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 12, alpha: 1 });
      playSfx("bite");
      setMessage("いまだ!", "引く");
    }
  }

  if (state.phase === "bite") {
    state.biteTimer -= delta;
    if (state.biteTimer <= 0) {
      missFish("遅かった! 逃げられた");
    }
  }

  if (state.phase === "showcase") {
    state.showcaseTimer -= delta;
    if (state.showcaseTimer <= 0) {
      state.phase = "idle";
      state.showcaseFish = null;
      state.showcaseSize = null;
      state.showcasePrice = 0;
      state.showcaseShiny = false;
      setMessage("タップで浮きを投げよう", "投げる");
    }
  }

  if (state.phase === "missed") {
    state.phaseTimer -= delta;
    if (state.phaseTimer <= 0) {
      state.phase = "idle";
      state.bobber.visible = false;
      setMessage("タップで浮きを投げよう", "投げる");
    }
  }
}

function moveTargetFish(delta, pace) {
  if (!state.targetFish) return;
  const fish = state.targetFish;
  fish.wobble += delta * 4;
  fish.x += (fish.targetX - fish.x) * delta * pace;
  fish.y += (fish.targetY - fish.y) * delta * pace;
  fish.y += Math.sin(fish.wobble) * delta * 10;
  fish.direction = fish.x > state.bobber.x ? -1 : 1;
}

function isTargetNearBobber() {
  if (!state.targetFish) return false;
  const dx = Math.abs(state.targetFish.x - state.bobber.x);
  const dy = Math.abs(state.targetFish.y - state.bobber.baseY);
  return dx < 54 && dy < 66;
}

function updateAmbientFish(delta) {
  for (let index = 0; index < state.ambientFish.length; index += 1) {
    const fish = state.ambientFish[index];
    fish.wobble += delta * 2.6;
    fish.x += fish.direction * fish.speed * delta;
    fish.y += Math.sin(fish.wobble) * 9 * delta;

    const offLeft = fish.direction < 0 && fish.x < -fish.type.shadow * 2;
    const offRight = fish.direction > 0 && fish.x > state.width + fish.type.shadow * 2;
    if (offLeft || offRight) {
      state.ambientFish[index] = makeShadow(index);
    }
  }
}

function updateRipples(delta) {
  state.ripples = state.ripples
    .map((ripple) => ({
      ...ripple,
      radius: ripple.radius + 56 * delta,
      alpha: ripple.alpha - 1.3 * delta,
    }))
    .filter((ripple) => ripple.alpha > 0);
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  drawSky();
  drawWater();
  drawRod();
  drawForeground();
  drawFeverOverlay();
  drawShowcase();
}

function drawFeverOverlay() {
  if (state.feverTimer <= 0 || state.phase === "showcase") return;

  const pulse = 0.55 + Math.sin(performance.now() * 0.008) * 0.22;
  ctx.save();
  const border = Math.max(8, Math.min(18, state.width * 0.018));
  const frameGradient = ctx.createLinearGradient(0, 0, state.width, state.height);
  frameGradient.addColorStop(0, `rgba(255, 238, 102, ${0.2 + pulse * 0.18})`);
  frameGradient.addColorStop(0.5, `rgba(255, 148, 72, ${0.08 + pulse * 0.08})`);
  frameGradient.addColorStop(1, `rgba(255, 238, 102, ${0.18 + pulse * 0.16})`);
  ctx.fillStyle = frameGradient;
  ctx.fillRect(0, 0, state.width, border);
  ctx.fillRect(0, state.height - border, state.width, border);
  ctx.fillRect(0, 0, border, state.height);
  ctx.fillRect(state.width - border, 0, border, state.height);

  for (let index = 0; index < 18; index += 1) {
    const drift = performance.now() * 0.00018;
    const x = ((index * 83 + drift * state.width * 0.8) % (state.width + 80)) - 40;
    const y = state.waterLine + 24 + ((index * 47 + drift * state.height * 0.9) % Math.max(1, state.height - state.waterLine - 60));
    const sparkle = 2 + (index % 4) * 1.3 + pulse * 1.4;
    ctx.globalAlpha = 0.18 + (index % 3) * 0.08;
    drawStarBody(x, y, sparkle);
  }
  ctx.restore();
}

function drawSky() {
  const theme = getCurrentSpot().theme;
  const gradient = ctx.createLinearGradient(0, 0, 0, state.waterLine);
  gradient.addColorStop(0, theme.skyTop);
  gradient.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.waterLine);

  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(state.width - 74, 62, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.cloud;
  drawCloud(state.width * 0.18, 70, 1);
  drawCloud(state.width * 0.68, 104, 0.72);
}

function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
  ctx.arc(x + 25 * scale, y - 9 * scale, 28 * scale, 0, Math.PI * 2);
  ctx.arc(x + 54 * scale, y, 20 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawWater() {
  const theme = getCurrentSpot().theme;
  const gradient = ctx.createLinearGradient(0, state.waterLine, 0, state.height);
  gradient.addColorStop(0, theme.waterTop);
  gradient.addColorStop(0.42, theme.waterMid);
  gradient.addColorStop(1, theme.waterBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, state.waterLine, state.width, state.height - state.waterLine);

  drawWaterLines();
  drawSpotDetails(theme.detail);
  state.ambientFish.forEach((fish) => drawFishShadow(fish, fish.alpha));
  if (state.targetFish) {
    drawFishShadow(state.targetFish, 0.5);
  }
  drawBobber();
  drawRipples();
}

function drawWaterLines() {
  const theme = getCurrentSpot().theme;
  for (let y = state.waterLine + 18; y < state.height; y += 42) {
    const depth = (y - state.waterLine) / Math.max(1, state.height - state.waterLine);
    const waveWidth = 14 + depth * 34;
    ctx.strokeStyle = `rgba(255,255,255,${0.34 - depth * 0.12})`;
    ctx.lineWidth = 1.4 + depth * 2.2;
    ctx.beginPath();
    for (let x = -20; x <= state.width + 20; x += waveWidth) {
      const waveY = y + Math.sin((x + performance.now() * 0.045) * 0.035) * (2 + depth * 6);
      if (x <= -20) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }

  const horizon = ctx.createLinearGradient(0, state.waterLine - 8, 0, state.waterLine + 18);
  horizon.addColorStop(0, "rgba(255,255,255,0)");
  horizon.addColorStop(1, theme.horizon);
  ctx.fillStyle = horizon;
  ctx.fillRect(0, state.waterLine - 8, state.width, 26);
}

function drawSpotDetails(detail) {
  if (detail === "reef") {
    ctx.fillStyle = "rgba(31, 61, 69, 0.42)";
    ctx.beginPath();
    ctx.ellipse(state.width * 0.18, state.waterLine + 42, 74, 18, -0.08, 0, Math.PI * 2);
    ctx.ellipse(state.width * 0.82, state.waterLine + 64, 96, 22, 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  if (detail === "deep") {
    const beams = ctx.createLinearGradient(0, state.waterLine, 0, state.height);
    beams.addColorStop(0, "rgba(190, 226, 255, 0.18)");
    beams.addColorStop(1, "rgba(190, 226, 255, 0)");
    ctx.fillStyle = beams;
    ctx.beginPath();
    ctx.moveTo(state.width * 0.3, state.waterLine);
    ctx.lineTo(state.width * 0.47, state.height);
    ctx.lineTo(state.width * 0.58, state.height);
    ctx.lineTo(state.width * 0.44, state.waterLine);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFishShadow(fish, alpha) {
  const size = fish.type.shadow * (fish.size?.shadowScale || 1);
  if (fish.type.isStar) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fish.x, fish.y);
    drawStarBody(0, 0, size * 0.55);
    ctx.restore();
    return;
  }

  ctx.save();
  if (fish.shiny) {
    const shimmer = 0.35 + Math.sin(performance.now() * 0.009) * 0.12;
    ctx.globalAlpha = Math.min(0.85, alpha + shimmer);
    ctx.fillStyle = "rgba(255, 232, 103, 0.5)";
    ctx.beginPath();
    ctx.ellipse(fish.x, fish.y, size * 1.18, size * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.scale(fish.direction, 1);
  ctx.fillStyle = fish.shiny ? `rgba(77, 48, 6, ${Math.min(0.72, alpha + 0.14)})` : `rgba(4, 31, 51, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.72, 0);
  ctx.lineTo(-size * 1.2, -size * 0.32);
  ctx.lineTo(-size * 1.18, size * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFishBody(type, x, y, size, direction, shiny = false) {
  if (type.isStar) {
    drawStarBody(x, y, size * 0.78);
    return;
  }

  const image = type.image ? fishImages.get(type.image) : null;
  if (image?.complete && image.naturalWidth > 0) {
    const imageSize = size * 2.28;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(direction, 1);
    if (shiny) {
      ctx.filter = "hue-rotate(135deg) saturate(1.8) brightness(1.22)";
    }
    ctx.drawImage(image, -imageSize * 0.5, -imageSize * 0.5, imageSize, imageSize);
    ctx.filter = "none";
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  ctx.fillStyle = shiny ? "#ffe870" : type.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-size * 0.82, 0);
  ctx.lineTo(-size * 1.35, -size * 0.38);
  ctx.lineTo(-size * 1.28, size * 0.38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.52)";
  ctx.beginPath();
  ctx.ellipse(size * 0.12, -size * 0.08, size * 0.34, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  if (shiny) {
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.05, size * 0.43, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#102033";
  ctx.beginPath();
  ctx.arc(size * 0.58, -size * 0.08, Math.max(4, size * 0.055), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(16,32,51,0.18)";
  ctx.lineWidth = Math.max(2, size * 0.025);
  ctx.beginPath();
  ctx.moveTo(-size * 0.24, -size * 0.34);
  ctx.quadraticCurveTo(size * 0.02, 0, -size * 0.24, size * 0.34);
  ctx.stroke();
  ctx.restore();
}

function drawStarBody(x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);

  const points = 5;
  ctx.fillStyle = "#ffd94d";
  ctx.strokeStyle = "rgba(116, 82, 0, 0.28)";
  ctx.lineWidth = Math.max(3, size * 0.05);
  ctx.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? size : size * 0.46;
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.beginPath();
  ctx.ellipse(-size * 0.18, -size * 0.2, size * 0.28, size * 0.14, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShowcaseParticles(style, progress, fade, centerX, centerY, radius) {
  for (let index = 0; index < style.particles; index += 1) {
    const angle = index * 2.399 + progress * 3.2;
    const orbit = radius * (0.42 + (index % 5) * 0.13 + progress * 0.18);
    const sparkleX = centerX + Math.cos(angle) * orbit;
    const sparkleY = centerY + Math.sin(angle * 0.86) * orbit * 0.56;
    const sparkleSize = 2.5 + (index % 4) * 1.3;

    ctx.globalAlpha = fade * (0.35 + (index % 3) * 0.18);
    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = fade;
}

function fillRoundedRect(x, y, width, height, radius) {
  const corner = Math.min(radius, width * 0.5, height * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + corner, y);
  ctx.lineTo(x + width - corner, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + corner);
  ctx.lineTo(x + width, y + height - corner);
  ctx.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  ctx.lineTo(x + corner, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - corner);
  ctx.lineTo(x, y + corner);
  ctx.quadraticCurveTo(x, y, x + corner, y);
  ctx.fill();
}

function drawShowcase() {
  if (!state.showcaseFish) return;
  const style = rarityStyles[state.showcaseFish.rarity];
  const isSsr = state.showcaseFish.rarity === "SSR";
  const isStar = Boolean(state.showcaseFish.isStar);
  const isShiny = state.showcaseShiny && !isStar;
  const sizeInfo = state.showcaseSize || sizeTiers[1];
  const showcaseDuration = isStar ? 2.35 : 1.8;
  const progress = 1 - state.showcaseTimer / showcaseDuration;
  const pop = Math.min(1, progress * 4);
  const fade = Math.min(1, state.showcaseTimer * 4);
  const size = Math.min(state.width * 0.34, state.height * 0.23, 188) * (0.8 + pop * 0.2) * Math.min(1.18, sizeInfo.shadowScale);
  const y = state.height * 0.48 + Math.sin(progress * Math.PI) * -20;

  ctx.save();
  ctx.globalAlpha = (isShiny ? 0.82 : isStar ? 0.64 : isSsr ? 0.76 : state.showcaseFish.rarity === "SR" ? 0.68 : 0.58) * fade;
  ctx.fillStyle = "#071d2a";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();

  ctx.save();
  if (isSsr || isStar || isShiny) {
    const flash = Math.max(0, 1 - progress * 4.2);
    if (flash > 0) {
      ctx.globalAlpha = flash * (isShiny ? 0.88 : isStar ? 0.52 : 0.72);
      const flashGradient = ctx.createLinearGradient(0, 0, state.width, state.height);
      flashGradient.addColorStop(0, "rgba(255,255,255,0.98)");
      flashGradient.addColorStop(0.45, isShiny ? "rgba(255,245,130,0.9)" : isStar ? "rgba(255,238,128,0.82)" : "rgba(242,196,255,0.88)");
      flashGradient.addColorStop(1, isShiny ? "rgba(80,220,255,0.72)" : isStar ? "rgba(255,194,65,0.66)" : "rgba(118,65,255,0.78)");
      ctx.fillStyle = flashGradient;
      ctx.fillRect(0, 0, state.width, state.height);
    }
  }

  if (isStar) {
    const beamCount = 18;
    ctx.save();
    ctx.translate(state.width * 0.5, y);
    ctx.rotate(progress * Math.PI * 1.35);
    for (let index = 0; index < beamCount; index += 1) {
      const angle = (Math.PI * 2 * index) / beamCount;
      const inner = size * (0.44 + Math.sin(progress * Math.PI) * 0.08);
      const outer = size * (2.6 + (index % 3) * 0.24);
      ctx.rotate(angle);
      const beam = ctx.createLinearGradient(inner, 0, outer, 0);
      beam.addColorStop(0, "rgba(255,255,255,0.52)");
      beam.addColorStop(0.48, "rgba(255,225,70,0.28)");
      beam.addColorStop(1, "rgba(255,225,70,0)");
      ctx.globalAlpha = fade * (0.28 + (index % 2) * 0.1);
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(inner, -size * 0.035);
      ctx.lineTo(outer, -size * 0.12);
      ctx.lineTo(outer, size * 0.12);
      ctx.lineTo(inner, size * 0.035);
      ctx.closePath();
      ctx.fill();
      ctx.rotate(-angle);
    }
    ctx.restore();
  }

  ctx.globalAlpha = fade;
  const glow = ctx.createRadialGradient(state.width * 0.5, y, size * 0.2, state.width * 0.5, y, size * 2.4);
  glow.addColorStop(0, isStar ? "rgba(255, 244, 98, 0.98)" : isShiny ? "rgba(255, 235, 78, 0.95)" : style.glow);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(state.width * 0.5, y + size * 0.02, size * 2.45, size * 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.showcaseFish.rarity !== "C" || isShiny || isStar) {
    const particleStyle = isStar
      ? { ...style, color: "#ffe84d", particles: 72 }
      : isShiny
        ? { ...style, color: "#ffe84d", particles: Math.max(style.particles, 44) }
        : style;
    drawShowcaseParticles(particleStyle, progress, fade, state.width * 0.5, y, size * (isStar ? 1.75 : 1.42));
  }

  if (isStar) {
    ctx.save();
    ctx.translate(state.width * 0.5, y);
    ctx.rotate(-progress * Math.PI * 2.2);
    ctx.globalAlpha = fade * 0.72;
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,214,64,0.74)";
    ctx.setLineDash([size * 0.16, size * 0.12]);
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (isSsr) {
    ctx.globalAlpha = fade * 0.58;
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(state.width * 0.18, y - size * 0.58);
    ctx.lineTo(state.width * 0.82, y + size * 0.62);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(state.width * 0.78, y - size * 0.62);
    ctx.lineTo(state.width * 0.28, y + size * 0.76);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.ellipse(state.width * 0.5, y + size * 0.18, size * 1.76, size * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFishBody(state.showcaseFish, state.width * 0.5, y, size, 1, isShiny);

  ctx.fillStyle = isShiny ? "#f4b900" : style.color;
  fillRoundedRect(state.width * 0.5 - size * 0.46, y + size * 0.66, size * 0.92, size * 0.3, 8);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(18, Math.min(30, state.width * 0.06))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(isShiny ? "色違い" : state.showcaseFish.rarity, state.width * 0.5, y + size * 0.81);

  ctx.fillStyle = "#102033";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(30, Math.min(50, state.width * 0.095))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(isStar ? "FEVER TIME" : `${isShiny ? "色違い " : ""}${sizeInfo.label} ${state.showcaseFish.name}`, state.width * 0.5, y + size * 1.18);
  ctx.font = `800 ${Math.max(18, Math.min(28, state.width * 0.052))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(16,32,51,0.72)";
  ctx.fillText(isStar ? `${feverSettings.duration}秒 レア魚・大物チャンス!` : `+${state.showcasePrice || state.showcaseFish.points}円`, state.width * 0.5, y + size * 1.48);
  ctx.restore();
}

function drawBobber() {
  if (!state.bobber.visible) return;
  const depth = Math.max(0, Math.min(1, (state.bobber.baseY - state.waterLine) / (state.height - state.waterLine)));
  const bobberScale = 0.58 + depth * 0.5;
  const bobberTop = state.bobber.sunk ? state.bobber.y - 5 * bobberScale : state.bobber.y - 18 * bobberScale;

  ctx.strokeStyle = "rgba(16,32,51,0.64)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.width * 0.5 + Math.min(110, state.width * 0.16), state.height - 66);
  ctx.lineTo(state.bobber.x, bobberTop);
  ctx.stroke();

  ctx.fillStyle = "#f8f6e7";
  ctx.beginPath();
  ctx.ellipse(state.bobber.x, bobberTop + 10 * bobberScale, 9 * bobberScale, 17 * bobberScale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e83b42";
  ctx.beginPath();
  ctx.ellipse(state.bobber.x, bobberTop + 3 * bobberScale, 9 * bobberScale, 9 * bobberScale, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  if (state.bobber.sunk) {
    ctx.fillStyle = "rgba(255,255,255,0.64)";
    ctx.beginPath();
    ctx.arc(state.bobber.x, state.bobber.baseY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRipples() {
  state.ripples.forEach((ripple) => {
    ctx.strokeStyle = `rgba(255,255,255,${ripple.alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(ripple.x, ripple.y, ripple.radius * 1.8, ripple.radius * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawRod() {
  const rod = getEquippedRod();
  const gripX = state.width * 0.5;
  const gripY = state.height + 58;
  const tipX = state.bobber.visible ? state.bobber.x : state.width * 0.5 + state.width * 0.05;
  const tipY = state.bobber.visible ? state.bobber.y - 12 : state.waterLine + state.height * 0.08;
  const controlX = state.width * 0.5 + Math.min(120, state.width * 0.18);
  const controlY = state.height * 0.58;
  const rodWidth = Math.max(7, state.width * 0.014) + rod.power * 0.8;

  ctx.lineCap = "round";
  if (rod.glow) {
    ctx.strokeStyle = rod.accentColor;
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = rodWidth + rod.glow;
    ctx.beginPath();
    ctx.moveTo(gripX, gripY);
    ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = rod.rodColor;
  ctx.lineWidth = rodWidth;
  ctx.beginPath();
  ctx.moveTo(gripX, gripY);
  ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
  ctx.stroke();

  ctx.strokeStyle = rod.accentColor;
  ctx.lineWidth = 2 + rod.power * 0.35;
  ctx.beginPath();
  ctx.moveTo(gripX + 8, gripY - 12);
  ctx.quadraticCurveTo(controlX + 4, controlY - 2, tipX + 1, tipY + 1);
  ctx.stroke();

  ctx.fillStyle = rod.accentColor;
  ctx.beginPath();
  ctx.arc(tipX, tipY, 2.6 + rod.power * 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function drawForeground() {
  ctx.fillStyle = "rgba(4, 24, 38, 0.12)";
  ctx.beginPath();
  ctx.ellipse(state.width * 0.5, state.height + 18, state.width * 0.34, 30, 0, 0, Math.PI * 2);
  ctx.fill();
}

function loop(time) {
  const delta = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resizeCanvas);
document.addEventListener("visibilitychange", () => {
  if (!state.audio.context) return;
  if (document.hidden) {
    state.audio.context.suspend().catch(() => {});
    return;
  }
  if (state.musicEnabled && state.audio.unlocked) {
    state.audio.context.resume().then(() => syncBgm(true)).catch(() => {});
  }
});
canvas.addEventListener("pointerdown", handleTap);
actionButton.addEventListener("pointerdown", handleTap);
menuButton.addEventListener("click", () => {
  unlockAudio();
  showView("menu");
});
missionTab.addEventListener("click", () => {
  unlockAudio();
  showPanel("mission", "game");
});
musicToggleButton.addEventListener("pointerdown", handleMusicToggleEvent);
musicToggleButton.addEventListener("touchend", handleMusicToggleEvent);
musicToggleButton.addEventListener("click", handleMusicToggleEvent);
musicToggleButton.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  toggleMusic();
});
menuMusicButton.addEventListener("pointerdown", handleMusicToggleEvent);
menuMusicButton.addEventListener("touchend", handleMusicToggleEvent);
menuMusicButton.addEventListener("click", handleMusicToggleEvent);
menuMusicButton.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  toggleMusic();
});
playTab.addEventListener("click", () => {
  unlockAudio();
  showView("game");
});
spotTab.addEventListener("click", () => {
  unlockAudio();
  showPanel("spot", "game");
});
dexTab.addEventListener("click", () => {
  unlockAudio();
  showPanel("dex", "game");
});
shopTab.addEventListener("click", () => {
  unlockAudio();
  showPanel("shop", "game");
});
menuTab.addEventListener("click", () => {
  unlockAudio();
  showView("menu");
});
startButton.addEventListener("click", () => {
  unlockAudio();
  showView("game");
});
menuMissionButton.addEventListener("click", () => {
  unlockAudio();
  showPanel("mission", "menu");
});
menuSpotButton.addEventListener("click", () => {
  unlockAudio();
  showPanel("spot", "menu");
});
menuReloadButton.addEventListener("click", reloadLatest);
menuDexButton.addEventListener("click", () => {
  unlockAudio();
  showPanel("dex", "menu");
});
menuShopButton.addEventListener("click", () => {
  unlockAudio();
  showPanel("shop", "menu");
});
fullResetButton.addEventListener("click", fullResetProgress);
closeMissionButton.addEventListener("click", closePanel);
closeDexButton.addEventListener("click", closePanel);
closeDexDetailButton.addEventListener("click", closeDexDetail);
dexDetail.addEventListener("click", (event) => {
  if (event.target === dexDetail) {
    closeDexDetail();
  }
});
closeShopButton.addEventListener("click", closePanel);
closeSpotButton.addEventListener("click", closePanel);

resizeCanvas();
resetGame();
updateMusicButton();
showView("menu");
requestAnimationFrame(loop);
