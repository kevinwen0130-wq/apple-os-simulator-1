import { state, saveState } from "../state.js";
import { $, bind, setLocked } from "../ui.js";
import { openRegisteredApp } from "./system-ui.js";

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

function relativeTime(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (elapsed < 60000) return "剛剛";
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)} 分鐘前`;
  return new Date(value).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function renderLockScreen() {
  const date = new Date().toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" });
  $("lockDate").textContent = date;
  $("lockFlashlight").classList.toggle("active", state.flashlight);
  const notifications = state.notifications.slice(0, 3);
  $("lockNotifications").innerHTML = notifications.length
    ? notifications.map((item) => `<button class="lock-notification" data-lock-notification="${item.id}"><span>${escapeHtml(item.source.slice(0, 1))}</span><div><header><b>${escapeHtml(item.source)}</b><time>${relativeTime(item.createdAt)}</time></header><p>${escapeHtml(item.message)}</p></div></button>`).join("")
    : `<div class="lock-empty">沒有新通知</div>`;
  document.querySelectorAll("[data-lock-notification]").forEach((button) => bind(button, (event) => {
    event.stopPropagation();
    const notification = state.notifications.find((item) => item.id === button.dataset.lockNotification);
    setLocked(false);
    if (notification?.app) window.setTimeout(() => openRegisteredApp(notification.app), 220);
  }));
}

function toggleFlashlight(event) {
  event.stopPropagation();
  state.flashlight = !state.flashlight;
  saveState();
  $("screen").classList.toggle("flashlight-on", state.flashlight);
  renderLockScreen();
}

function openCamera(event) {
  event.stopPropagation();
  setLocked(false);
  window.setTimeout(() => openRegisteredApp("camera"), 220);
}

async function initBatteryStatus() {
  if (!("getBattery" in navigator)) return;
  try {
    const battery = await navigator.getBattery();
    const update = () => {
      const percent = Math.round(battery.level * 100);
      $("batteryLevel").style.width = `${percent}%`;
      $("lockStatus").hidden = !battery.charging;
      $("lockStatus").textContent = battery.charging ? `正在充電 · ${percent}%` : "";
    };
    update();
    battery.addEventListener("levelchange", update);
    battery.addEventListener("chargingchange", update);
  } catch {}
}

export function initLockScreen() {
  $("screen").classList.toggle("flashlight-on", state.flashlight);
  bind($("lockFlashlight"), toggleFlashlight);
  bind($("lockCamera"), openCamera);
  window.addEventListener("simulator:notifications-changed", renderLockScreen);
  window.addEventListener("simulator:lock-state", renderLockScreen);
  renderLockScreen();
  initBatteryStatus();
}
