const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const timeEl = document.querySelector("#time");
const messageEl = document.querySelector("#message");
const actionButton = document.querySelector("#actionButton");
const resetButton = document.querySelector("#resetButton");

const fishTypes = [
  { name: "アジ", points: 10, color: "#f6d06f", speed: 92, size: 34 },
  { name: "タイ", points: 25, color: "#f4776f", speed: 72, size: 42 },
  { name: "マグロ", points: 50, color: "#4f81d9", speed: 116, size: 58 },
];

const state = {
  width: 0,
  height: 0,
  pixelRatio: 1,
  waterLine: 0,
  rodX: 0,
  hookY: 0,
  hookTargetY: 0,
  hookState: "ready",
  caughtFish: null,
  score: 0,
  timeLeft: 60,
  running: true,
  lastTime: 0,
  fish: [],
  ripples: [],
  messageTimer: 0,
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
  state.hookY = state.waterLine - 18;
  state.hookTargetY = state.hookY;
}

function makeFish(type, index) {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const yMin = state.waterLine + 60;
  const yMax = state.height - 72;
  return {
    ...type,
    x: direction > 0 ? -type.size - index * 90 : state.width + type.size + index * 90,
    y: yMin + Math.random() * Math.max(40, yMax - yMin),
    direction,
    wobble: Math.random() * Math.PI * 2,
  };
}

function resetGame() {
  state.score = 0;
  state.timeLeft = 60;
  state.running = true;
  state.hookState = "ready";
  state.caughtFish = null;
  state.ripples = [];
  state.fish = Array.from({ length: 9 }, (_, index) => {
    const type = fishTypes[index % fishTypes.length];
    return makeFish(type, index);
  });
  updateHud();
  setMessage("タップで針を落とそう", "針を落とす");
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  timeEl.textContent = String(Math.ceil(state.timeLeft));
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

  if (state.hookState === "ready") {
    const pointerY = event.clientY ? event.clientY - canvas.getBoundingClientRect().top : state.height * 0.72;
    state.hookTargetY = Math.max(state.waterLine + 64, Math.min(pointerY, state.height - 56));
    state.hookState = "dropping";
    state.ripples.push({ x: state.rodX, y: state.waterLine + 4, radius: 4, alpha: 1 });
    setMessage("狙いを定めて...", "巻き上げる");
    return;
  }

  if (state.hookState === "dropping" || state.hookState === "waiting") {
    state.hookState = "reeling";
    setMessage("巻き上げ中", "もう少し");
  }
}

function update(delta) {
  if (!state.running) {
    return;
  }

  state.timeLeft -= delta;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.running = false;
    state.hookState = "ready";
    setMessage(`終了 SCORE ${state.score}`, "もう一度");
  }
  updateHud();

  updateHook(delta);
  updateFish(delta);
  updateRipples(delta);
}

function updateHook(delta) {
  const dropSpeed = 330;
  const reelSpeed = 470;

  if (state.hookState === "dropping") {
    state.hookY = Math.min(state.hookTargetY, state.hookY + dropSpeed * delta);
    if (Math.abs(state.hookY - state.hookTargetY) < 2) {
      state.hookState = "waiting";
      setMessage("魚が近づいたらタップ", "巻き上げる");
    }
  }

  if (state.hookState === "waiting") {
    const caught = state.fish.find((fish) => {
      const dx = Math.abs(fish.x - state.rodX);
      const dy = Math.abs(fish.y - state.hookY);
      return dx < fish.size * 0.72 && dy < fish.size * 0.62;
    });

    if (caught) {
      state.caughtFish = caught;
      state.hookState = "reeling";
      setMessage(`${caught.name}がかかった!`, "巻き上げる");
    }
  }

  if (state.hookState === "reeling") {
    state.hookY = Math.max(state.waterLine - 18, state.hookY - reelSpeed * delta);
    if (state.caughtFish) {
      state.caughtFish.x = state.rodX;
      state.caughtFish.y = state.hookY + 24;
    }
    if (state.hookY <= state.waterLine - 18) {
      finishReeling();
    }
  }
}

function finishReeling() {
  if (state.caughtFish) {
    state.score += state.caughtFish.points;
    setMessage(`${state.caughtFish.name} +${state.caughtFish.points}`, "針を落とす");
    const index = state.fish.indexOf(state.caughtFish);
    state.fish[index] = makeFish(fishTypes[Math.floor(Math.random() * fishTypes.length)], index);
    state.caughtFish = null;
  } else {
    setMessage("今回は空振り", "針を落とす");
  }
  state.hookState = "ready";
  state.hookTargetY = state.waterLine - 18;
}

function updateFish(delta) {
  for (let index = 0; index < state.fish.length; index += 1) {
    const fish = state.fish[index];
    if (fish === state.caughtFish) {
      continue;
    }
    fish.wobble += delta * 3;
    fish.x += fish.direction * fish.speed * delta;
    fish.y += Math.sin(fish.wobble) * 12 * delta;

    const offLeft = fish.direction < 0 && fish.x < -fish.size * 2;
    const offRight = fish.direction > 0 && fish.x > state.width + fish.size * 2;
    if (offLeft || offRight) {
      state.fish[index] = makeFish(fishTypes[Math.floor(Math.random() * fishTypes.length)], index);
    }
  }
}

function updateRipples(delta) {
  state.ripples = state.ripples
    .map((ripple) => ({
      ...ripple,
      radius: ripple.radius + 54 * delta,
      alpha: ripple.alpha - 1.4 * delta,
    }))
    .filter((ripple) => ripple.alpha > 0);
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  drawSky();
  drawWater();
  drawRodAndHook();
  state.fish.forEach(drawFish);
  drawForeground();
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
  gradient.addColorStop(0, "#2d9fd2");
  gradient.addColorStop(1, "#083b68");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, state.waterLine, state.width, state.height - state.waterLine);

  ctx.strokeStyle = "rgba(255,255,255,0.42)";
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

  state.ripples.forEach((ripple) => {
    ctx.strokeStyle = `rgba(255,255,255,${ripple.alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(ripple.x, ripple.y, ripple.radius * 1.8, ripple.radius * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawRodAndHook() {
  const deckY = state.waterLine - 8;
  ctx.strokeStyle = "#553c2b";
  ctx.lineCap = "round";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(state.rodX - 86, deckY);
  ctx.quadraticCurveTo(state.rodX - 28, deckY - 88, state.rodX + 18, deckY - 58);
  ctx.stroke();

  ctx.strokeStyle = "rgba(16,32,51,0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.rodX + 18, deckY - 58);
  ctx.lineTo(state.rodX, state.hookY);
  ctx.stroke();

  ctx.strokeStyle = "#f7f2df";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(state.rodX + 4, state.hookY + 4, 10, Math.PI * 0.08, Math.PI * 1.55);
  ctx.stroke();
}

function drawFish(fish) {
  const direction = fish.direction;
  const size = fish.size;
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.scale(direction, 1);

  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-size * 0.8, 0);
  ctx.lineTo(-size * 1.38, -size * 0.42);
  ctx.lineTo(-size * 1.32, size * 0.42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(size * 0.2, -size * 0.08, size * 0.28, size * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#102033";
  ctx.beginPath();
  ctx.arc(size * 0.58, -size * 0.08, Math.max(3, size * 0.07), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
