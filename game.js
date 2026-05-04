const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const caughtEl = document.querySelector("#caught");
const messageEl = document.querySelector("#message");
const actionButton = document.querySelector("#actionButton");
const resetButton = document.querySelector("#resetButton");
const versionEl = document.querySelector("#version");
const playTab = document.querySelector("#playTab");
const dexTab = document.querySelector("#dexTab");
const shopTab = document.querySelector("#shopTab");
const reloadButton = document.querySelector("#reloadButton");
const menuScreen = document.querySelector("#menuScreen");
const dexScreen = document.querySelector("#dexScreen");
const shopScreen = document.querySelector("#shopScreen");
const startButton = document.querySelector("#startButton");
const menuReloadButton = document.querySelector("#menuReloadButton");
const menuDexButton = document.querySelector("#menuDexButton");
const menuShopButton = document.querySelector("#menuShopButton");
const closeDexButton = document.querySelector("#closeDexButton");
const closeShopButton = document.querySelector("#closeShopButton");
const dexList = document.querySelector("#dexList");
const shopList = document.querySelector("#shopList");
const shopMoney = document.querySelector("#shopMoney");

const GAME_VERSION = "v0.9.3";
const COLLECTION_KEY = "tapFishingCollection";
const ECONOMY_KEY = "tapFishingEconomy";

const rarityStyles = {
  C: { label: "C", color: "#6f8798", glow: "rgba(210, 231, 238, 0.42)", particles: 8 },
  R: { label: "R", color: "#2f8fcb", glow: "rgba(111, 218, 240, 0.58)", particles: 16 },
  SR: { label: "SR", color: "#d68a18", glow: "rgba(255, 205, 84, 0.74)", particles: 28 },
};

const rodUpgrades = [
  { name: "竹の竿", cost: 0, biteBonus: 0, rareBonus: 0, rodColor: "#5a3b28", accentColor: "rgba(245,229,168,0.75)", glow: 0 },
  { name: "しなやかな竿", cost: 160, biteBonus: 0.1, rareBonus: 0.12, rodColor: "#2f6f55", accentColor: "#b7f0c3", glow: 2 },
  { name: "銀の竿", cost: 420, biteBonus: 0.18, rareBonus: 0.28, rodColor: "#7d8f9a", accentColor: "#f3fbff", glow: 5 },
  { name: "金の竿", cost: 900, biteBonus: 0.28, rareBonus: 0.5, rodColor: "#b97818", accentColor: "#ffe070", glow: 8 },
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
  running: true,
  lastTime: 0,
  targetFish: null,
  showcaseFish: null,
  ambientFish: [],
  phaseTimer: 0,
  biteTimer: 0,
  showcaseTimer: 0,
  ripples: [],
  collection: loadCollection(),
};

function loadEconomy() {
  try {
    const economy = JSON.parse(localStorage.getItem(ECONOMY_KEY)) || {};
    return {
      money: Number.isFinite(economy.money) ? economy.money : 0,
      rodLevel: Number.isFinite(economy.rodLevel) ? economy.rodLevel : 0,
    };
  } catch {
    return { money: 0, rodLevel: 0 };
  }
}

function saveEconomy() {
  localStorage.setItem(ECONOMY_KEY, JSON.stringify({ money: state.money, rodLevel: state.rodLevel }));
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

function showView(view) {
  state.view = view;
  menuScreen.classList.toggle("is-hidden", view !== "menu");
  dexScreen.classList.toggle("is-hidden", view !== "dex");
  shopScreen.classList.toggle("is-hidden", view !== "shop");
  playTab.classList.toggle("is-active", view === "game");
  dexTab.classList.toggle("is-active", view === "dex");
  shopTab.classList.toggle("is-active", view === "shop");

  if (view === "dex") {
    renderDex();
  }
  if (view === "shop") {
    renderShop();
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
  const rod = rodUpgrades[state.rodLevel];
  const weightedTypes = fishTypes.map((type) => {
    const difficultyGap = Math.max(0, type.catchDifficulty - state.rodLevel);
    const difficultyPenalty = 1 / (1 + difficultyGap * 1.3);
    const rarityBoost = type.rarity === "SR" ? rod.rareBonus : type.rarity === "R" ? rod.rareBonus * 0.45 : 0;
    return { type, weight: type.catchWeight * difficultyPenalty * (1 + rarityBoost) };
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
  return Math.max(0.24, type.biteWindow + rodUpgrades[state.rodLevel].biteBonus - difficultyPenalty);
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
  const side = Math.random() > 0.5 ? -1 : 1;
  const startX = state.bobber.x + side * Math.max(state.width * 0.3, 180);
  return {
    type,
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
  state.ripples = [];
  state.bobber.visible = false;
  state.bobber.sunk = false;
  positionBobber();
  makeAmbientFish();
  updateHud();
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
  shopList.replaceChildren(
    ...rodUpgrades.map((rod, index) => {
      const owned = index <= state.rodLevel;
      const next = index === state.rodLevel + 1;
      const affordable = state.money >= rod.cost;
      const card = document.createElement("article");
      card.className = "shop-card";

      const info = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = rod.name;
      const detail = document.createElement("p");
      const rareText = Math.round(rod.rareBonus * 100);
      const biteText = Math.round(rod.biteBonus * 100) / 100;
      detail.textContent = owned
        ? index === state.rodLevel
          ? `装備中 / 反応猶予 +${biteText}秒 / 高レア補正 +${rareText}%`
          : "購入済み"
        : `反応猶予 +${biteText}秒 / 高レア補正 +${rareText}%`;
      info.append(title, detail);

      const button = document.createElement("button");
      button.className = "buy-button";
      button.type = "button";
      button.disabled = !next || !affordable;
      button.textContent = owned ? "所持" : `${rod.cost}円`;
      button.addEventListener("click", () => buyRod(index));

      card.append(info, button);
      return card;
    })
  );
}

function buyRod(index) {
  const rod = rodUpgrades[index];
  if (index !== state.rodLevel + 1 || state.money < rod.cost) {
    return;
  }

  state.money -= rod.cost;
  state.rodLevel = index;
  saveEconomy();
  updateHud();
  renderShop();
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
  const salePrice = fish.type.points;
  state.score += fish.type.points;
  state.caughtCount += 1;
  state.money += salePrice;
  state.collection[fish.type.name] = (state.collection[fish.type.name] || 0) + 1;
  saveCollection();
  saveEconomy();
  state.phase = "showcase";
  state.showcaseTimer = 1.8;
  state.showcaseFish = fish.type;
  state.targetFish = null;
  state.bobber.sunk = false;
  state.bobber.visible = false;
  state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 8, alpha: 1 });
  setMessage(`${fish.type.name}を売った! +${salePrice}円`, "次を投げる");
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
      state.phaseTimer = 0.5 + Math.random() * 0.75;
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
  const gradient = ctx.createLinearGradient(0, 0, 0, state.waterLine);
  gradient.addColorStop(0, "#86d8f0");
  gradient.addColorStop(1, "#eef9f6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.waterLine);

  ctx.fillStyle = "#ffcb58";
  ctx.beginPath();
  ctx.arc(state.width - 74, 62, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.82)";
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
  const gradient = ctx.createLinearGradient(0, state.waterLine, 0, state.height);
  gradient.addColorStop(0, "#6ac0da");
  gradient.addColorStop(0.42, "#2493c5");
  gradient.addColorStop(1, "#083a67");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, state.waterLine, state.width, state.height - state.waterLine);

  drawWaterLines();
  state.ambientFish.forEach((fish) => drawFishShadow(fish, fish.alpha));
  if (state.targetFish) {
    drawFishShadow(state.targetFish, 0.5);
  }
  drawBobber();
  drawRipples();
}

function drawWaterLines() {
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
  horizon.addColorStop(1, "rgba(255,255,255,0.32)");
  ctx.fillStyle = horizon;
  ctx.fillRect(0, state.waterLine - 8, state.width, 26);
}

function drawFishShadow(fish, alpha) {
  const size = fish.type.shadow;
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
  const progress = 1 - state.showcaseTimer / 1.8;
  const pop = Math.min(1, progress * 4);
  const fade = Math.min(1, state.showcaseTimer * 4);
  const size = Math.min(state.width * 0.34, state.height * 0.23, 188) * (0.8 + pop * 0.2);
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
  ctx.fillText(state.showcaseFish.name, state.width * 0.5, y + size * 1.18);
  ctx.font = `800 ${Math.max(18, Math.min(28, state.width * 0.052))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(16,32,51,0.72)";
  ctx.fillText(`+${state.showcaseFish.points}円`, state.width * 0.5, y + size * 1.48);
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
  const rod = rodUpgrades[state.rodLevel];
  const gripX = state.width * 0.5;
  const gripY = state.height + 58;
  const tipX = state.bobber.visible ? state.bobber.x : state.width * 0.5 + state.width * 0.05;
  const tipY = state.bobber.visible ? state.bobber.y - 12 : state.waterLine + state.height * 0.08;
  const controlX = state.width * 0.5 + Math.min(120, state.width * 0.18);
  const controlY = state.height * 0.58;
  const rodWidth = Math.max(7, state.width * 0.014) + state.rodLevel * 0.8;

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
  ctx.lineWidth = 2 + state.rodLevel * 0.35;
  ctx.beginPath();
  ctx.moveTo(gripX + 8, gripY - 12);
  ctx.quadraticCurveTo(controlX + 4, controlY - 2, tipX + 1, tipY + 1);
  ctx.stroke();

  ctx.fillStyle = rod.accentColor;
  ctx.beginPath();
  ctx.arc(tipX, tipY, 2.6 + state.rodLevel * 0.9, 0, Math.PI * 2);
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
dexTab.addEventListener("click", () => showView("dex"));
shopTab.addEventListener("click", () => showView("shop"));
reloadButton.addEventListener("click", reloadLatest);
startButton.addEventListener("click", () => showView("game"));
menuReloadButton.addEventListener("click", reloadLatest);
menuDexButton.addEventListener("click", () => showView("dex"));
menuShopButton.addEventListener("click", () => showView("shop"));
closeDexButton.addEventListener("click", () => showView("game"));
closeShopButton.addEventListener("click", () => showView("game"));

resizeCanvas();
resetGame();
showView("menu");
requestAnimationFrame(loop);
