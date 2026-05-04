const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const caughtEl = document.querySelector("#caught");
const messageEl = document.querySelector("#message");
const actionButton = document.querySelector("#actionButton");
const resetButton = document.querySelector("#resetButton");
const versionEl = document.querySelector("#version");

const GAME_VERSION = "v0.4.0";

const fishTypes = [
  { name: "ワカサギ", points: 10, shadow: 30, speed: 96, biteWindow: 0.92, color: "#dce8ec" },
  { name: "アジ", points: 20, shadow: 42, speed: 82, biteWindow: 0.82, color: "#87b8d6" },
  { name: "タイ", points: 45, shadow: 58, speed: 68, biteWindow: 0.72, color: "#f17a73" },
  { name: "スズキ", points: 70, shadow: 76, speed: 58, biteWindow: 0.62, color: "#9fc5ba" },
  { name: "マグロ", points: 110, shadow: 98, speed: 48, biteWindow: 0.54, color: "#4c73b8" },
];

const state = {
  width: 0,
  height: 0,
  pixelRatio: 1,
  waterLine: 0,
  rodX: 0,
  bobber: { x: 0, y: 0, baseY: 0, visible: false, sunk: false },
  phase: "idle",
  score: 0,
  caughtCount: 0,
  running: true,
  lastTime: 0,
  targetFish: null,
  showcaseFish: null,
  ambientFish: [],
  phaseTimer: 0,
  biteTimer: 0,
  showcaseTimer: 0,
  ripples: [],
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  state.width = Math.floor(rect.width);
  state.height = Math.floor(rect.height);
  canvas.width = Math.floor(state.width * state.pixelRatio);
  canvas.height = Math.floor(state.height * state.pixelRatio);
  ctx.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
  state.waterLine = state.height * 0.32;
  state.rodX = state.width * 0.5;
  positionBobber();
  makeAmbientFish();
}

function positionBobber() {
  state.bobber.x = state.width * 0.5;
  state.bobber.baseY = state.waterLine + Math.max(70, state.height * 0.18);
  state.bobber.y = state.bobber.baseY;
}

function randomFishType() {
  const roll = Math.random();
  if (roll > 0.94) return fishTypes[4];
  if (roll > 0.82) return fishTypes[3];
  if (roll > 0.58) return fishTypes[2];
  if (roll > 0.28) return fishTypes[1];
  return fishTypes[0];
}

function makeAmbientFish() {
  state.ambientFish = Array.from({ length: 7 }, (_, index) => makeShadow(index));
}

function makeShadow(index) {
  const type = randomFishType();
  const direction = Math.random() > 0.5 ? 1 : -1;
  const yMin = state.waterLine + 70;
  const yMax = state.height - 64;
  return {
    type,
    x: direction > 0 ? -type.shadow - index * 120 : state.width + type.shadow + index * 120,
    y: yMin + Math.random() * Math.max(50, yMax - yMin),
    direction,
    speed: type.speed * (0.55 + Math.random() * 0.35),
    wobble: Math.random() * Math.PI * 2,
    alpha: 0.24 + Math.random() * 0.12,
  };
}

function makeTargetFish() {
  const type = randomFishType();
  const side = Math.random() > 0.5 ? -1 : 1;
  const startX = state.bobber.x + side * Math.max(state.width * 0.38, 260);
  return {
    type,
    x: startX,
    y: state.bobber.baseY + 86 + Math.random() * 70,
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
  scoreEl.textContent = String(state.score);
  caughtEl.textContent = String(state.caughtCount);
  versionEl.textContent = GAME_VERSION;
}

function setMessage(text, buttonText) {
  messageEl.textContent = text;
  actionButton.textContent = buttonText;
}

function handleTap(event) {
  event.preventDefault();
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
  state.bobber.y = state.waterLine - 22;
  state.targetFish = makeTargetFish();
  state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 6, alpha: 1 });
  setMessage("魚影が近づくまで待とう", "待つ");
}

function catchFish() {
  const fish = state.targetFish;
  state.score += fish.type.points;
  state.caughtCount += 1;
  state.phase = "showcase";
  state.showcaseTimer = 1.8;
  state.showcaseFish = fish.type;
  state.targetFish = null;
  state.bobber.sunk = false;
  state.bobber.visible = false;
  state.ripples.push({ x: state.bobber.x, y: state.bobber.baseY, radius: 8, alpha: 1 });
  setMessage(`${fish.type.name}を釣った! +${fish.type.points}`, "次を投げる");
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
      state.biteTimer = state.targetFish.type.biteWindow;
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
  gradient.addColorStop(0, "#8bd5f0");
  gradient.addColorStop(1, "#dff8fb");
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
  gradient.addColorStop(0, "#3ba9d3");
  gradient.addColorStop(1, "#0a416f");
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
  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 3;
  for (let y = state.waterLine + 18; y < state.height; y += 58) {
    ctx.beginPath();
    for (let x = -20; x <= state.width + 20; x += 28) {
      const waveY = y + Math.sin((x + performance.now() * 0.04) * 0.04) * 5;
      if (x === -20) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
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

function drawShowcase() {
  if (!state.showcaseFish) return;
  const progress = 1 - state.showcaseTimer / 1.8;
  const pop = Math.min(1, progress * 4);
  const fade = Math.min(1, state.showcaseTimer * 4);
  const size = Math.min(state.width * 0.22, state.height * 0.16, 132) * (0.82 + pop * 0.18);
  const y = state.height * 0.49 + Math.sin(progress * Math.PI) * -18;

  ctx.save();
  ctx.globalAlpha = 0.58 * fade;
  ctx.fillStyle = "#071d2a";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.ellipse(state.width * 0.5, y + size * 0.18, size * 1.88, size * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFishBody(state.showcaseFish, state.width * 0.5, y, size, 1);

  ctx.fillStyle = "#102033";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(26, Math.min(42, state.width * 0.08))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(state.showcaseFish.name, state.width * 0.5, y + size * 0.84);
  ctx.font = `800 ${Math.max(16, Math.min(24, state.width * 0.045))}px ui-rounded, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(16,32,51,0.72)";
  ctx.fillText(`+${state.showcaseFish.points}`, state.width * 0.5, y + size * 1.16);
  ctx.restore();
}

function drawBobber() {
  if (!state.bobber.visible) return;
  const bobberTop = state.bobber.sunk ? state.bobber.y - 7 : state.bobber.y - 22;

  ctx.strokeStyle = "rgba(16,32,51,0.64)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.rodX + 18, state.waterLine - 66);
  ctx.lineTo(state.bobber.x, bobberTop);
  ctx.stroke();

  ctx.fillStyle = "#f8f6e7";
  ctx.beginPath();
  ctx.ellipse(state.bobber.x, bobberTop + 10, 10, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e83b42";
  ctx.beginPath();
  ctx.ellipse(state.bobber.x, bobberTop + 3, 10, 10, 0, Math.PI, Math.PI * 2);
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
  const deckY = state.waterLine - 8;
  ctx.strokeStyle = "#553c2b";
  ctx.lineCap = "round";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(state.rodX - 86, deckY);
  ctx.quadraticCurveTo(state.rodX - 28, deckY - 88, state.rodX + 18, deckY - 58);
  ctx.stroke();
}

function drawForeground() {
  ctx.fillStyle = "#725338";
  ctx.fillRect(0, state.waterLine - 12, state.width, 16);
  ctx.fillStyle = "#8d6745";
  for (let x = 0; x < state.width; x += 82) {
    ctx.fillRect(x, state.waterLine - 18, 50, 22);
  }
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

resizeCanvas();
resetGame();
requestAnimationFrame(loop);
