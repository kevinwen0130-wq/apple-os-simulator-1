import { state } from "./state.js";

const $ = (id) => document.getElementById(id);
const bind = (element, handler) => element?.addEventListener("click", handler);

let currentActivity = { type: "idle", app: null };
let notificationTimer = null;
let timerActivity = null;

function setMode(type) {
  const island = $("island");
  island.dataset.mode = type;
  island.classList.toggle("playing", type === "music" && state.musicPlaying);
  $("islandWave").hidden = type !== "music";
}

function renderIdle() {
  currentActivity = { type: "idle", app: null };
  setMode("idle");
  $("islandIcon").textContent = "●";
  $("islandCompactText").textContent = "";
  $("islandLabel").textContent = "動態島";
  $("islandTitle").textContent = "沒有進行中的活動";
  $("islandText").textContent = "播放音樂或啟動計時器後會顯示在這裡";
  $("islandProgress").style.width = "0%";
  $("islandPrimary").textContent = "▶";
}

export function renderMusicIsland() {
  if (currentActivity.type === "notification") return;
  if (!state.musicPlaying && timerActivity) return renderTimerIsland(timerActivity);
  if (state.musicTitle === "尚未選擇歌曲") return renderIdle();
  currentActivity = { type: "music", app: "music" };
  setMode("music");
  $("islandIcon").textContent = "♪";
  $("islandCompactText").textContent = state.musicPlaying ? state.musicTitle : "已暫停";
  $("islandLabel").textContent = state.musicPlaying ? "正在播放" : "音樂已暫停";
  $("islandTitle").textContent = state.musicTitle;
  $("islandText").textContent = state.musicArtist;
  $("islandProgress").style.width = `${state.musicProgress}%`;
  $("islandPrimary").textContent = state.musicPlaying ? "Ⅱ" : "▶";
}

export function showIslandNotification(message, app = "messages") {
  clearTimeout(notificationTimer);
  currentActivity = { type: "notification", app };
  setMode("notification");
  $("islandIcon").textContent = "●";
  $("islandCompactText").textContent = "新通知";
  $("islandLabel").textContent = "新通知";
  $("islandTitle").textContent = app === "messages" ? "訊息" : "系統";
  $("islandText").textContent = message;
  $("islandProgress").style.width = "100%";
  $("islandPrimary").textContent = "✓";
  const island = $("island");
  island.classList.remove("notification-pop");
  requestAnimationFrame(() => island.classList.add("notification-pop", "expanded"));
  notificationTimer = setTimeout(() => {
    island.classList.remove("notification-pop", "expanded");
    if (timerActivity) renderTimerIsland(timerActivity);
    else renderMusicIsland();
  }, 3200);
}

export function renderTimerIsland(activity) {
  timerActivity = activity?.remaining > 0 ? activity : null;
  if (!timerActivity || currentActivity.type === "notification") {
    if (!timerActivity) renderMusicIsland();
    return;
  }
  currentActivity = { type: "timer", app: "clock" };
  setMode("timer");
  const minutes = Math.floor(activity.remaining / 60);
  const seconds = activity.remaining % 60;
  const text = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  $("islandIcon").textContent = "◷";
  $("islandCompactText").textContent = text;
  $("islandLabel").textContent = "計時器";
  $("islandTitle").textContent = text;
  $("islandText").textContent = "計時進行中";
  $("islandProgress").style.width = `${Math.max(0, activity.remaining / activity.total * 100)}%`;
  $("islandPrimary").textContent = "■";
}

export function initIsland(openApp, toggleMusic) {
  const toggleExpanded = () => $("island").classList.toggle("expanded");
  bind($("island"), toggleExpanded);
  ["pointerdown", "touchstart"].forEach((type) => $("island").addEventListener(type, (event) => event.stopPropagation(), { passive: true }));
  $("island").addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") toggleExpanded();
  });
  bind($("islandOpen"), (event) => {
    event.stopPropagation();
    if (currentActivity.app) openApp(currentActivity.app);
  });
  bind($("islandPrimary"), (event) => {
    event.stopPropagation();
    if (currentActivity.type === "music") toggleMusic();
    if (currentActivity.type === "timer") openApp("clock");
    if (currentActivity.type === "notification") $("island").classList.remove("expanded");
  });
  bind($("islandQuickAction"), (event) => {
    event.stopPropagation();
    if (currentActivity.type === "music") toggleMusic();
    else if (currentActivity.type === "timer" || currentActivity.type === "notification") {
      if (currentActivity.app) openApp(currentActivity.app);
    } else {
      $("island").classList.add("expanded");
    }
  });
  window.addEventListener("simulator:music-state", renderMusicIsland);
  window.addEventListener("simulator:timer-state", (event) => renderTimerIsland(event.detail));
  renderMusicIsland();
}
