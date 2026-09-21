import "./styles.css";
import { dedication, messages, flowerTags, shapeNames, orbitPhrases } from "./content";
import { RomanticScene } from "./scene";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("No se encontró el contenedor principal");

app.innerHTML = `
  <main class="experience" aria-label="Una sorpresa para ${dedication.name}">
    <canvas id="scene" aria-hidden="true"></canvas>
    <div class="aurora" aria-hidden="true"></div>
    <section class="welcome" id="welcome" aria-labelledby="welcome-title">
      <p class="eyebrow">Una pequeña sorpresa para</p>
      <h1 id="welcome-title">${dedication.name} <span class="heart" aria-hidden="true">${dedication.heart}</span></h1>
      <button class="start-flower" id="start" type="button" aria-label="Abrir sorpresa para ${dedication.name}">
        <span class="flower-core"></span>
        ${Array.from({ length: 16 }, (_, i) => `<span class="petal" style="--i:${i}"></span>`).join("")}
      </button>
      <p class="start-label">Toca la flor para comenzar</p>
    </section>

    <section class="world" id="world" aria-hidden="true">
      <header class="world-title">
        <p>Mi lugar favorito tiene un nombre</p>
        <h2>${dedication.name} <span class="heart" aria-hidden="true">${dedication.heart}</span></h2>
        <span id="shape-name">${shapeNames[0]}</span>
      </header>

      <p class="explore-hint">Arrastra para explorar · rueda o pellizca para acercarte · toca una flor</p>

      <div class="flower-tags-container" id="flower-tags" aria-hidden="true">
        ${flowerTags.map((tag, index) => `
          <button type="button" class="flower-tag" data-tag-index="${index}">${tag}</button>
        `).join("")}
      </div>

      <div class="flower-keyboard-list" aria-label="Flores con mensajes para ${dedication.name}">
        ${messages.map((message, index) => `
          <button type="button" data-flower-message="${index}">Abrir flor ${index + 1}: ${message}</button>
        `).join("")}
      </div>

      <div class="petals" aria-hidden="true">
        ${Array.from({ length: 12 }, (_, i) => `<i style="--i:${i};--x:${8 + ((i * 29) % 84)}%"></i>`).join("")}
      </div>

      <nav class="controls" aria-label="Controles de la experiencia">
        <button id="audio-toggle" class="round-control" type="button" aria-label="Activar música">♫</button>
        <button id="shape-trigger" class="round-control" type="button" aria-label="Transformar la figura central">✦</button>
        <button id="camera-reset" class="round-control" type="button" aria-label="Volver a la vista inicial">⌂</button>
        <button id="letter-open" class="letter-control" type="button"><span>♡</span> Abrir mi carta</button>
      </nav>
    </section>

    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <audio id="music" loop preload="none"></audio>

    <div class="modal" id="message-modal" role="dialog" aria-modal="true" aria-labelledby="message-text" hidden>
      <button class="modal-backdrop" type="button" data-close aria-label="Cerrar mensaje"></button>
      <article class="memory-card">
        <button class="close" type="button" data-close aria-label="Cerrar mensaje">×</button>
        <div class="photo-placeholder"><span>Fotografía aquí</span><small>Podrás reemplazarla después</small></div>
        <p id="message-text"></p>
        <span class="card-signature">Para ${dedication.name} ${dedication.heart}</span>
      </article>
    </div>

    <div class="modal" id="letter-modal" role="dialog" aria-modal="true" aria-labelledby="letter-title" hidden>
      <button class="modal-backdrop" type="button" data-close aria-label="Cerrar carta"></button>
      <article class="letter-card">
        <button class="close" type="button" data-close aria-label="Cerrar carta">×</button>
        <div class="letter-content">
          <p class="eyebrow">Una carta que siempre podrás volver a abrir</p>
          <h2 id="letter-title">${dedication.title}</h2>
          <p>${dedication.body}</p>
          <span>Con todo mi cariño ♡</span>
        </div>
      </article>
    </div>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const world = document.querySelector<HTMLElement>("#world")!;
const welcome = document.querySelector<HTMLElement>("#welcome")!;
const shapeName = document.querySelector<HTMLElement>("#shape-name")!;
const scene = new RomanticScene(canvas, orbitPhrases);
let started = false;
let autoMorph = 0;

function beginExperience() {
  if (started) return;
  started = true;
  welcome.classList.add("leaving");
  world.setAttribute("aria-hidden", "false");
  world.classList.add("visible");
  scene.startIntroAnimation();
  setTimeout(() => welcome.setAttribute("hidden", ""), 1200);
  autoMorph = window.setInterval(() => scene.nextShape(), 6800);
}

function triggerNextShape() {
  scene.nextShape();
  if (started) {
    clearInterval(autoMorph);
    autoMorph = window.setInterval(() => scene.nextShape(), 6800);
  }
}

document.querySelector("#start")?.addEventListener("click", beginExperience);
document.querySelector("#shape-trigger")?.addEventListener("click", triggerNextShape);
document.querySelector("#camera-reset")?.addEventListener("click", () => scene.resetCamera());
scene.onCenterClick = triggerNextShape;
scene.onShapeChange = (index) => {
  shapeName.animate([{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 600 });
  shapeName.textContent = shapeNames[index];
};

const toast = document.querySelector<HTMLElement>("#toast")!;
let toastTimer = 0;
function showToast(text: string) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

const music = document.querySelector<HTMLAudioElement>("#music")!;
const audioButton = document.querySelector<HTMLButtonElement>("#audio-toggle")!;
if (dedication.audioSrc) music.src = dedication.audioSrc;
audioButton.addEventListener("click", async () => {
  if (!dedication.audioSrc) {
    showToast("La canción definitiva se podrá añadir aquí ♫");
    return;
  }
  if (music.paused) {
    await music.play();
    audioButton.classList.add("active");
    audioButton.setAttribute("aria-label", "Pausar música");
  } else {
    music.pause();
    audioButton.classList.remove("active");
    audioButton.setAttribute("aria-label", "Activar música");
  }
});

let lastFocus: HTMLElement | null = null;
function openModal(modal: HTMLElement) {
  lastFocus = document.activeElement as HTMLElement;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add("open"));
  modal.querySelector<HTMLButtonElement>(".close")?.focus();
}

function closeModal(modal: HTMLElement) {
  modal.classList.remove("open");
  setTimeout(() => {
    modal.hidden = true;
    lastFocus?.focus();
  }, 280);
}

const messageModal = document.querySelector<HTMLElement>("#message-modal")!;
const messageText = document.querySelector<HTMLElement>("#message-text")!;
let messageIndex = 0;
function showMessage(index: number) {
  messageIndex = index % messages.length;
  messageText.textContent = messages[messageIndex];
  openModal(messageModal);
}
scene.onFlowerClick = showMessage;

const flowerTagButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".flower-tag"));
flowerTagButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.tagIndex);
    showMessage(index);
  });
});

scene.onFlowerPositionsUpdate = (positions) => {
  if (!started) return;
  for (let i = 0; i < positions.length; i += 1) {
    const pos = positions[i];
    const button = flowerTagButtons[pos.index];
    if (!button) continue;
    if (!pos.visible || pos.opacity <= 0.04) {
      button.style.opacity = "0";
      button.style.pointerEvents = "none";
    } else {
      button.style.opacity = pos.opacity.toFixed(2);
      button.style.zIndex = String(pos.zIndex);
      button.style.pointerEvents = "auto";
      button.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) translate(-50%, -100%) scale(${pos.scale.toFixed(2)})`;
    }
  }
};

document.querySelectorAll<HTMLButtonElement>("[data-flower-message]").forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.flowerMessage);
    showMessage(index);
  });
});

const letterModal = document.querySelector<HTMLElement>("#letter-modal")!;
document.querySelector("#letter-open")?.addEventListener("click", () => openModal(letterModal));

document.querySelectorAll<HTMLElement>(".modal").forEach((modal) => {
  modal.querySelectorAll("[data-close]").forEach((control) => control.addEventListener("click", () => closeModal(modal)));
});

document.addEventListener("keydown", (event) => {
  const open = document.querySelector<HTMLElement>(".modal.open");
  if (!open) return;
  if (event.key === "Escape") {
    closeModal(open);
    return;
  }
  if (event.key === "Tab") {
    const controls = [...open.querySelectorAll<HTMLElement>("button:not([disabled])")];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

addEventListener("beforeunload", () => {
  clearInterval(autoMorph);
  scene.destroy();
});
