const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const caughtEl = document.querySelector("#caught");
const messageEl = document.querySelector("#message");
const missionSummaryEl = document.querySelector("#missionSummary");
const actionButton = document.querySelector("#actionButton");
const resetButton = document.querySelector("#resetButton");
const versionEl = document.querySelector("#version");
const playTab = document.querySelector("#playTab");
const spotTab = document.querySelector("#spotTab");
const dexTab = document.querySelector("#dexTab");
const shopTab = document.querySelector("#shopTab");
const reloadButton = document.querySelector("#reloadButton");
const menuScreen = document.querySelector("#menuScreen");
const dexScreen = document.querySelector("#dexScreen");
const shopScreen = document.querySelector("#shopScreen");
const spotScreen = document.querySelector("#spotScreen");
const startButton = document.querySelector("#startButton");
const menuSpotButton = document.querySelector("#menuSpotButton");
const menuReloadButton = document.querySelector("#menuReloadButton");
const menuDexButton = document.querySelector("#menuDexButton");
const menuShopButton = document.querySelector("#menuShopButton");
const fullResetButton = document.querySelector("#fullResetButton");
const closeDexButton = document.querySelector("#closeDexButton");
const closeShopButton = document.querySelector("#closeShopButton");
const closeSpotButton = document.querySelector("#closeSpotButton");
const dexList = document.querySelector("#dexList");
const shopList = document.querySelector("#shopList");
const shopMoney = document.querySelector("#shopMoney");
const spotList = document.querySelector("#spotList");

const GAME_VERSION = "v1.2.0";
const COLLECTION_KEY = "tapFishingCollection";
const ECONOMY_KEY = "tapFishingEconomy";
const MISSION_KEY = "tapFishingMissions";

const rarityStyles = {
  C: { label: "C", color: "#6f8798", glow: "rgba(210, 231, 238, 0.42)", particles: 8 },
  R: { label: "R", color: "#2f8fcb", glow: "rgba(111, 218, 240, 0.58)", particles: 16 },
  SR: { label: "SR", color: "#d68a18", glow: "rgba(255, 205, 84, 0.74)", particles: 28 },
};

const rodUpgrades = [
  { id: "bamboo", name: "竹の竿", cost: 0, power: 0, biteBonus: 0, rareBonus: 0, saleBonus: 0, rodColor: "#5a3b28", accentColor: "rgba(245,229,168,0.75)", glow: 0 },
  { id: "flex", name: "しなやかな竿", cost: 160, power: 1, biteBonus: 0.1, rareBonus: 0.1, saleBonus: 0, rodColor: "#2f6f55", accentColor: "#b7f0c3", glow: 2 },
  { id: "lucky", name: "星見の竿", cost: 360, power: 1, biteBonus: 0.02, rareBonus: 0.42, saleBonus: 0, rodColor: "#37508c", accentColor: "#d8e2ff", glow: 5 },
  { id: "quick", name: "早合わせの竿", cost: 360, power: 1, biteBonus: 0.28, rareBonus: 0.08, saleBonus: 0, rodColor: "#7d8f9a", accentColor: "#f3fbff", glow: 4 },
  { id: "merchant", name: "商人の竿", cost: 360, power: 1, biteBonus: 0.08, rareBonus: 0.05, saleBonus: 0.28, rodColor: "#b97818", accentColor: "#ffe070", glow: 5 },
  { id: "master", name: "名人の竿", cost: 1100, power: 2, biteBonus: 0.24, rareBonus: 0.38, saleBonus: 0.16, rodColor: "#5b3d91", accentColor: "#ffc8ff", glow: 8 },
];

const floatUpgrades = [
  { id: "plain", name: "ふつうの浮き", cost: 0, nibbleBonus: 0, biteBonus: 0 },
  { id: "bright", name: "見やすい浮き", cost: 180, nibbleBonus: 0.18, biteBonus: 0.04 },
  { id: "signal", name: "合図の浮き", cost: 460, nibbleBonus: 0.28, biteBonus: 0.1 },
];

const reelUpgrades = [
  { id: "plain", name: "ふつうのリール", cost: 0, biteBonus: 0, saleBonus: 0 },
  { id: "smooth", name: "なめらかリール", cost: 220, biteBonus: 0.08, saleBonus: 0.04 },
  { id: "pro", name: "プロリール", cost: 620, biteBonus: 0.16, saleBonus: 0.1 },
];

const baitUpgrades = [
  { id: "normal", name: "ふつうのエサ", cost: 0, rarityMultiplier: { C: 1, R: 1, SR: 1 }, fishBonus: {} },
  { id: "rare", name: "きらめくエサ", cost: 260, rarityMultiplier: { C: 0.82, R: 1.16, SR: 1.45 }, fishBonus: {} },
  { id: "tuna", name: "大物エサ", cost: 520, rarityMultiplier: { C: 0.72, R: 1, SR: 1.72 }, fishBonus: { "マグロ": 1.6, "ヌシ": 1.7 } },
];

const titleDefs = [
  { id: "rookie", name: "新人釣り師", condition: () => true },
  { id: "collector", name: "図鑑の友", condition: () => Object.keys(state.collection).length >= 5 },
  { id: "deepHunter", name: "深海ハンター", condition: () => state.spotId === "deep" || state.collection["ヌシ"] },
  { id: "legend", name: "伝説を釣る者", condition: () => Object.values(state.collection).reduce((sum, count) => sum + count, 0) >= 30 },
];

const dexRewardDefs = [
  { id: "allC", label: "Cコンプリート", reward: 220, condition: () => fishTypes.filter((type) => type.rarity === "C").every((type) => state.collection[type.name]) },
  { id: "firstSR", label: "SR初入手", reward: 360, condition: (type) => type.rarity === "SR" },
];

const sizeTiers = [
  { label: "小", multiplier: 0.8, shadowScale: 0.88, weight: 30 },
  { label: "中", multiplier: 1, shadowScale: 1, weight: 44 },
  { label: "大", multiplier: 1.35, shadowScale: 1.18, weight: 20 },
  { label: "特大", multiplier: 2, shadowScale: 1.42, weight: 6 },
];

const fishingSpots = [
  {
    id: "pier",
    name: "いつもの桟橋",
    description: "小さめの魚が多く、安定して稼ぎやすい。",
    unlockRodLevel: 0,
    rarityMultiplier: { C: 1.2, R: 0.9, SR: 0.45 },
    bigBonus: 0,
    theme: {
      skyTop: "#86d8f0",
      skyBottom: "#eef9f6",
      waterTop: "#6ac0da",
      waterMid: "#2493c5",
      waterBottom: "#083a67",
      sun: "#ffcb58",
      cloud: "rgba(255,255,255,0.82)",
      horizon: "rgba(255,255,255,0.32)",
      detail: "pier",
    },
  },
  {
    id: "reef",
    name: "沖の岩場",
    description: "Rの魚と大きめの魚が少し増える。",
    unlockRodLevel: 1,
    rarityMultiplier: { C: 0.82, R: 1.28, SR: 0.9 },
    bigBonus: 0.12,
    theme: {
      skyTop: "#7bcbea",
      skyBottom: "#d9f1f6",
      waterTop: "#46abc7",
      waterMid: "#147d9d",
      waterBottom: "#063b5d",
      sun: "#ffd16c",
      cloud: "rgba(240,250,255,0.76)",
      horizon: "rgba(231,248,255,0.28)",
      detail: "reef",
    },
  },
  {
    id: "deep",
    name: "深い海",
    description: "SRと特大が狙えるが、銀の竿以上が必要。",
    unlockRodLevel: 2,
    rarityMultiplier: { C: 0.52, R: 1, SR: 1.62 },
    bigBonus: 0.28,
    theme: {
      skyTop: "#253b65",
      skyBottom: "#486f8f",
      waterTop: "#1d7895",
      waterMid: "#0c4d75",
      waterBottom: "#03192f",
      sun: "#d8e2ff",
      cloud: "rgba(191,211,229,0.5)",
      horizon: "rgba(170,211,232,0.22)",
      detail: "deep",
    },
  },
];

const missionDefs = [
  { id: "catch5", label: "魚を5匹釣る", target: 5, reward: 90, kind: "count" },
  { id: "earn300", label: "魚を売って300円稼ぐ", target: 300, reward: 140, kind: "money" },
  { id: "rare1", label: "R以上の魚を1匹釣る", target: 1, reward: 180, kind: "rare" },
];

const fishTypes = [
  {
    name: "ワカサギ",
    points: 10,
    shadow: 30,
    speed: 96,
    biteWindow: 0.92,
    color: "#dce8ec",
    image: "assets/fish/001.png",
    rarity: "C",
    catchWeight: 32,
    catchDifficulty: 0,
  },
  {
    name: "アジ",
    points: 20,
    shadow: 42,
    speed: 82,
    biteWindow: 0.82,
    color: "#87b8d6",
    image: "assets/fish/002.png",
    rarity: "C",
    catchWeight: 28,
    catchDifficulty: 0,
  },
  {
    name: "タイ",
    points: 45,
    shadow: 58,
    speed: 68,
    biteWindow: 0.72,
    color: "#f17a73",
    image: "assets/fish/003.png",
    rarity: "R",
    catchWeight: 18,
    catchDifficulty: 1,
  },
  {
    name: "スズキ",
    points: 70,
    shadow: 76,
    speed: 58,
    biteWindow: 0.62,
    color: "#9fc5ba",
    rarity: "R",
    catchWeight: 14,
    catchDifficulty: 1,
  },
  {
    name: "マグロ",
    points: 110,
    shadow: 98,
    speed: 48,
    biteWindow: 0.54,
    color: "#4c73b8",
    rarity: "SR",
    catchWeight: 7,
    catchDifficulty: 2,
  },
  {
    name: "カワハギ",
    points: 65,
    shadow: 70,
    speed: 60,
    biteWindow: 0.66,
    color: "#167988",
    image: "assets/fish/004.png",
    rarity: "R",
    catchWeight: 13,
    catchDifficulty: 1,
  },
  {
    name: "マンボウ",
    points: 90,
    shadow: 88,
    speed: 42,
    biteWindow: 0.58,
    color: "#f7cbd8",
    image: "assets/fish/005.png",
    rarity: "SR",
    catchWeight: 6,
    catchDifficulty: 2,
  },
  {
    name: "ニジイロギョ",
    points: 150,
    shadow: 92,
    speed: 62,
    biteWindow: 0.5,
    color: "#ff5eb8",
    image: "assets/fish/006.png",
    rarity: "SR",
    catchWeight: 4,
    catchDifficulty: 3,
  },
  {
    name: "ヌシ",
    points: 180,
    shadow: 104,
    speed: 38,
    biteWindow: 0.46,
    color: "#347d9f",
    image: "assets/fish/007.png",
    rarity: "SR",
    catchWeight: 3,
    catchDifficulty: 3,
  },
];

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
  ambientFish: [],
  phaseTimer: 0,
  biteTimer: 0,
  showcaseTimer: 0,
  ripples: [],
  collection: loadCollection(),
  missions: loadMissions(),
};

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

function loadCollection() {
  try {
    return JSON.parse(localStorage.getItem(COLLECTION_KEY)) || {};
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
  menuScreen.classList.toggle("is-hidden", view !== "menu");
  dexScreen.classList.toggle("is-hidden", view !== "dex");
  shopScreen.classList.toggle("is-hidden", view !== "shop");
  spotScreen.classList.toggle("is-hidden", view !== "spot");
  playTab.classList.toggle("is-active", view === "game");
  spotTab.classList.toggle("is-active", view === "spot");
  dexTab.classList.toggle("is-active", view === "dex");
  shopTab.classList.toggle("is-active", view === "shop");

  if (view === "dex") {
    renderDex();
  }
  if (view === "shop") {
    renderShop();
  }
  if (view === "spot") {
    renderSpots();
  }
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

function randomFishType() {
  const rod = getEquippedRod();
  const bait = getEquippedBait();
  const spot = getCurrentSpot();
  const weightedTypes = fishTypes.map((type) => {
    const difficultyGap = Math.max(0, type.catchDifficulty - state.rodLevel);
    const difficultyPenalty = 1 / (1 + difficultyGap * 1.3);
    const rarityBoost = type.rarity === "SR" ? rod.rareBonus : type.rarity === "R" ? rod.rareBonus * 0.45 : 0;
    return {
      type,
      weight:
        type.catchWeight *
        difficultyPenalty *
        spot.rarityMultiplier[type.rarity] *
        bait.rarityMultiplier[type.rarity] *
        (1 + (bait.fishBonus[type.name] || 0)) *
        (1 + rarityBoost),
    };
  });
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
    const bigBoost = index >= 2 ? 1 + spot.bigBonus * (index === 3 ? 1.8 : 1) : 1;
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
  const type = randomFishType();
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
  const size = randomFishSize();
  const side = Math.random() > 0.5 ? -1 : 1;
  const startX = state.bobber.x + side * Math.max(state.width * 0.3, 180);
  return {
    type,
    size,
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
  caughtEl.textContent = String(state.caughtCount);
  versionEl.textContent = GAME_VERSION;
}

function renderDex() {
  dexList.replaceChildren(
    ...fishTypes.map((type) => {
      const count = state.collection[type.name] || 0;
      const card = document.createElement("article");
      card.className = `dex-card${count ? "" : " is-locked"}`;

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

      const rarity = document.createElement("div");
      rarity.className = `dex-rarity rarity-${type.rarity.toLowerCase()}`;
      rarity.textContent = type.rarity;

      const meta = document.createElement("div");
      meta.className = "dex-meta";
      meta.textContent = count ? `${count}匹 / ${type.points}pt` : "未発見";

      card.append(art, rarity, name, meta);
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
  const sr = Math.round((bait.rarityMultiplier.SR - 1) * 100);
  return sr ? `SR出現 ${sr > 0 ? "+" : ""}${sr}%` : "標準の出現率";
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
  renderSpots();
  setMessage(`${spot.name}に移動した`, "投げる");
}

function getMissionProgress(def) {
  return state.missions[def.id]?.progress || 0;
}

function updateMissionSummary() {
  const openMission = missionDefs.find((def) => !state.missions[def.id]?.completed);
  if (!openMission) {
    missionSummaryEl.textContent = `称号: ${getCurrentTitle().name} / ミッション全達成`;
    return;
  }

  const progress = Math.min(openMission.target, getMissionProgress(openMission));
  missionSummaryEl.textContent = `称号: ${getCurrentTitle().name} / ${openMission.label} ${progress}/${openMission.target}`;
}

function updateMissions(type, salePrice) {
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

function catchFish() {
  const fish = state.targetFish;
  const saleBonus = 1 + getEquippedRod().saleBonus + getEquippedReel().saleBonus;
  const salePrice = Math.round(fish.type.points * fish.size.multiplier * saleBonus);
  state.score += fish.type.points;
  state.caughtCount += 1;
  state.money += salePrice;
  const firstTime = !state.collection[fish.type.name];
  state.collection[fish.type.name] = (state.collection[fish.type.name] || 0) + 1;
  const rewardTotal = updateRewards(fish.type, firstTime);
  const missionReward = updateMissions(fish.type, salePrice);
  updateTitles();
  updateMissionSummary();
  saveCollection();
  saveEconomy();
  state.phase = "showcase";
  state.showcaseTimer = 1.8;
  state.showcaseFish = fish.type;
  state.showcaseSize = fish.size;
  state.showcasePrice = salePrice;
  state.targetFish = null;
  state.bobber.sunk = false;
  state.bobber.visible = false;
  state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 8, alpha: 1 });
  const totalBonus = missionReward + rewardTotal;
  const rewardText = totalBonus ? ` / ボーナス +${totalBonus}円` : "";
  setMessage(`${fish.size.label} ${fish.type.name}を売った! +${salePrice}円${rewardText}`, "次を投げる");
}

function missFish(text) {
  state.phase = "missed";
  state.phaseTimer = 0.85;
  state.bobber.sunk = false;
  state.targetFish = null;
  state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 10, alpha: 0.8 });
  setMessage(text, "次を投げる");
}

function update(delta) {
  updateHud();
  updateFishing(delta);
  updateAmbientFish(delta);
  updateRipples(delta);
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
  drawShowcase();
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
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.scale(fish.direction, 1);
  ctx.fillStyle = `rgba(4, 31, 51, ${alpha})`;
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

function drawFishBody(type, x, y, size, direction) {
  const image = type.image ? fishImages.get(type.image) : null;
  if (image?.complete && image.naturalWidth > 0) {
    const imageSize = size * 2.28;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(direction, 1);
    ctx.drawImage(image, -imageSize * 0.5, -imageSize * 0.5, imageSize, imageSize);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  ctx.fillStyle = type.color;
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
  const sizeInfo = state.showcaseSize || sizeTiers[1];
  const progress = 1 - state.showcaseTimer / 1.8;
  const pop = Math.min(1, progress * 4);
  const fade = Math.min(1, state.showcaseTimer * 4);
  const size = Math.min(state.width * 0.34, state.height * 0.23, 188) * (0.8 + pop * 0.2) * Math.min(1.18, sizeInfo.shadowScale);
  const y = state.height * 0.48 + Math.sin(progress * Math.PI) * -20;

  ctx.save();
  ctx.globalAlpha = (state.showcaseFish.rarity === "SR" ? 0.68 : 0.58) * fade;
  ctx.fillStyle = "#071d2a";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = fade;
  const glow = ctx.createRadialGradient(state.width * 0.5, y, size * 0.2, state.width * 0.5, y, size * 2.4);
  glow.addColorStop(0, style.glow);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(state.width * 0.5, y + size * 0.02, size * 2.45, size * 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.showcaseFish.rarity !== "C") {
    drawShowcaseParticles(style, progress, fade, state.width * 0.5, y, size * 1.42);
  }

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.ellipse(state.width * 0.5, y + size * 0.18, size * 1.76, size * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFishBody(state.showcaseFish, state.width * 0.5, y, size, 1);

  ctx.fillStyle = style.color;
  fillRoundedRect(state.width * 0.5 - size * 0.46, y + size * 0.66, size * 0.92, size * 0.3, 8);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(18, Math.min(30, state.width * 0.06))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(state.showcaseFish.rarity, state.width * 0.5, y + size * 0.81);

  ctx.fillStyle = "#102033";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(30, Math.min(50, state.width * 0.095))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(`${sizeInfo.label} ${state.showcaseFish.name}`, state.width * 0.5, y + size * 1.18);
  ctx.font = `800 ${Math.max(18, Math.min(28, state.width * 0.052))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(16,32,51,0.72)";
  ctx.fillText(`+${state.showcasePrice || state.showcaseFish.points}円`, state.width * 0.5, y + size * 1.48);
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
canvas.addEventListener("pointerdown", handleTap);
actionButton.addEventListener("pointerdown", handleTap);
resetButton.addEventListener("click", resetGame);
playTab.addEventListener("click", () => showView("game"));
spotTab.addEventListener("click", () => showView("spot"));
dexTab.addEventListener("click", () => showView("dex"));
shopTab.addEventListener("click", () => showView("shop"));
reloadButton.addEventListener("click", reloadLatest);
startButton.addEventListener("click", () => showView("game"));
menuSpotButton.addEventListener("click", () => showView("spot"));
menuReloadButton.addEventListener("click", reloadLatest);
menuDexButton.addEventListener("click", () => showView("dex"));
menuShopButton.addEventListener("click", () => showView("shop"));
fullResetButton.addEventListener("click", fullResetProgress);
closeDexButton.addEventListener("click", () => showView("game"));
closeShopButton.addEventListener("click", () => showView("game"));
closeSpotButton.addEventListener("click", () => showView("game"));

resizeCanvas();
resetGame();
showView("menu");
requestAnimationFrame(loop);
