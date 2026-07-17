import { state, saveState } from "./state.js";
import { showIslandNotification } from "./island.js";
import { addNotification } from "./system/notifications.js";

export const $ = (id) => document.getElementById(id);
export const bind = (element, handler) => element?.addEventListener("click", handler);
const appHistory = [];

function updateBackButton() {
  const back = $("backApp");
  const label = back?.querySelector("span");
  back?.classList.add("visible");
  if (label) label.textContent = appHistory.at(-1)?.title || "主畫面";
}

function renderApp(title, content, direction = "forward") {
  $("appTitle").textContent = title;
  $("appContent").innerHTML = content;
  $("appWindow").classList.add("open");
  $("appContent").classList.remove("nav-forward", "nav-back");
  requestAnimationFrame(() => $("appContent")?.classList.add(direction === "back" ? "nav-back" : "nav-forward"));
  updateBackButton();
  window.dispatchEvent(new CustomEvent("simulator:app-opened", { detail: { title } }));
}

export function setLocked(locked) {
  state.locked = locked;
  $("lock").classList.toggle("hidden", !locked);
  saveState();
}

export function openApp(title, content) {
  if ($("appWindow").classList.contains("open") && $("appContent").childNodes.length) {
    const fragment = document.createDocumentFragment();
    while ($("appContent").firstChild) fragment.append($("appContent").firstChild);
    appHistory.push({
      title: $("appTitle").textContent,
      fragment,
      scrollTop: $("appWindow").scrollTop
    });
    if (appHistory.length > 15) appHistory.shift();
  }
  window.dispatchEvent(new CustomEvent("simulator:close-app"));
  renderApp(title, content);
}

export function backApp() {
  const previous = appHistory.pop();
  if (!previous) return closeApp();
  window.dispatchEvent(new CustomEvent("simulator:close-app"));
  $("appTitle").textContent = previous.title;
  $("appContent").replaceChildren(previous.fragment);
  $("appContent").classList.remove("nav-forward", "nav-back");
  requestAnimationFrame(() => $("appContent")?.classList.add("nav-back"));
  $("appWindow").scrollTop = previous.scrollTop;
  updateBackButton();
  window.dispatchEvent(new CustomEvent("simulator:app-restored", { detail: { title: previous.title } }));
}

export function closeApp() {
  window.dispatchEvent(new CustomEvent("simulator:close-app"));
  appHistory.length = 0;
  $("appWindow").classList.remove("open");
  $("backApp")?.classList.remove("visible");
  state.activeApp = null;
  saveState();
}

export function showNotice(message, options = {}) {
  const sourceApp = options.app || state.activeApp?.key || null;
  const source = options.source || state.activeApp?.title || "系統";
  addNotification({ message, source, app: sourceApp });
  $("notice").innerHTML = `<b>訊息</b><br>${message}`;
  $("watchNotice").innerHTML = `<b>來自 iPhone</b><br>${message}`;
  $("notice").classList.add("show");
  $("watchNotice").classList.add("show");
  showIslandNotification(message);
  window.setTimeout(() => {
    $("notice").classList.remove("show");
    $("watchNotice").classList.remove("show");
  }, 2800);
}

export function updateClock() {
  const time = new Date().toLocaleTimeString("zh-TW", {
    hour: "2-digit", minute: "2-digit", hour12: false
  });
  ["clock", "lockclock", "watchClock"].forEach((id) => $(id).textContent = time);
}
