import { appRegistry } from "../apps/index.js";
import { state, saveState } from "../state.js";
import { $, bind } from "../ui.js";
import { clearNotifications, removeNotification } from "./notifications.js";

const entries = () => Object.entries(appRegistry).map(([key, app]) => ({ key, app, title: app.title || key }));
const closeLayer = (id) => $(id)?.classList.remove("open");
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

export function openRegisteredApp(key) {
  const app = appRegistry[key];
  if (!app) return;
  closeLayer("spotlight");
  closeLayer("appSwitcher");
  closeLayer("notificationCenter");
  app.open();
}

function rememberApp(key, title) {
  state.activeApp = { key, title };
  state.recentApps = [key, ...state.recentApps.filter((item) => item !== key)].slice(0, 8);
  saveState();
}

function renderSpotlight(query = "") {
  const normalized = query.trim().toLocaleLowerCase("zh-Hant");
  const matches = entries().filter(({ key, title }) => !normalized || `${key} ${title}`.toLocaleLowerCase("zh-Hant").includes(normalized));
  $("spotlightResults").innerHTML = matches.length
    ? matches.map(({ key, title }) => `<button class="spotlight-result" data-spotlight-app="${key}"><span>${title.slice(0, 1)}</span><b>${title}</b><small>開啟</small></button>`).join("")
    : `<div class="system-empty">找不到符合的 App</div>`;
  document.querySelectorAll("[data-spotlight-app]").forEach((button) => bind(button, () => openRegisteredApp(button.dataset.spotlightApp)));
}

export function openSpotlight() {
  if (state.locked) return;
  closeLayer("appSwitcher");
  $("spotlight").classList.add("open");
  $("spotlightInput").value = "";
  renderSpotlight();
  window.setTimeout(() => $("spotlightInput").focus(), 80);
}

function renderSwitcher() {
  const recent = state.recentApps.map((key) => ({ key, app: appRegistry[key] })).filter((item) => item.app);
  $("switcherCards").innerHTML = recent.length
    ? recent.map(({ key, app }) => `<article class="switcher-card" data-switcher-card="${key}"><button class="switcher-close" data-close-recent="${key}" aria-label="關閉 ${app.title}">×</button><button class="switcher-open" data-switcher-app="${key}"><span>${app.title.slice(0, 1)}</span><b>${app.title}</b><small>最近使用</small></button></article>`).join("")
    : `<div class="system-empty light">沒有最近使用的 App</div>`;
  document.querySelectorAll("[data-switcher-app]").forEach((button) => bind(button, () => openRegisteredApp(button.dataset.switcherApp)));
  document.querySelectorAll("[data-close-recent]").forEach((button) => bind(button, (event) => {
    event.stopPropagation();
    state.recentApps = state.recentApps.filter((key) => key !== button.dataset.closeRecent);
    saveState();
    renderSwitcher();
  }));
}

export function openAppSwitcher() {
  if (state.locked) return;
  closeLayer("spotlight");
  renderSwitcher();
  $("appSwitcher").classList.add("open");
}

function relativeTime(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (elapsed < 60000) return "剛剛";
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)} 分鐘前`;
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)} 小時前`;
  return new Date(value).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}

export function renderNotifications() {
  $("notificationList").innerHTML = state.notifications.length
    ? state.notifications.map((item) => `<article class="notification-item"><button class="notification-open" data-notification-id="${item.id}"><span>${escapeHtml(item.source.slice(0, 1))}</span><div><header><b>${escapeHtml(item.source)}</b><time>${relativeTime(item.createdAt)}</time></header><p>${escapeHtml(item.message)}</p></div></button><button class="notification-delete" data-delete-notification="${item.id}" aria-label="刪除通知">×</button></article>`).join("")
    : `<div class="system-empty light">沒有較早的通知</div>`;
  document.querySelectorAll("[data-notification-id]").forEach((button) => bind(button, () => {
    const item = state.notifications.find((entry) => entry.id === button.dataset.notificationId);
    if (item?.app) openRegisteredApp(item.app);
  }));
  document.querySelectorAll("[data-delete-notification]").forEach((button) => bind(button, (event) => {
    event.stopPropagation();
    removeNotification(button.dataset.deleteNotification);
  }));
}

export function initSystemUI() {
  bind($("spotlightTrigger"), openSpotlight);
  bind($("closeSpotlight"), () => closeLayer("spotlight"));
  $("spotlightInput").addEventListener("input", (event) => renderSpotlight(event.target.value));
  bind($("switcherTrigger"), openAppSwitcher);
  bind($("closeSwitcher"), () => closeLayer("appSwitcher"));
  bind($("clearNotifications"), clearNotifications);
  window.addEventListener("simulator:notifications-changed", renderNotifications);
  window.addEventListener("simulator:app-opened", (event) => {
    const match = entries().find(({ title }) => title === event.detail.title);
    if (match) rememberApp(match.key, match.title);
  });
  renderNotifications();
}
