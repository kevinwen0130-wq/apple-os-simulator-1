import { state, resetState, saveState } from "./state.js";
import { $, backApp, bind, closeApp, setLocked, showNotice, updateClock } from "./ui.js";
import { appRegistry } from "./apps/index.js";
import { initWatch } from "./watch.js";
import { settingsApp } from "./apps/settings.js";
import { musicApp } from "./apps/music.js";
import { initIsland } from "./island.js";
import { initNetworkStatus } from "./network.js";
import { initSystemUI, openAppSwitcher, openSpotlight, renderNotifications } from "./system/system-ui.js";

function initPhone() {
  setLocked(state.locked);
  updateClock();
  window.setInterval(updateClock, 30000);

  bind($("lock"), () => setLocked(false));
  bind($("syncBtn"), () => showNotice("iPhone 與 Apple Watch 已同步"));
  bind($("resetBtn"), resetState);
  bind($("actionBtn"), () => showNotice("動作按鈕：已執行快捷操作"));
  bind($("powerBtn"), () => setLocked(!state.locked));
  bind($("closeApp"), closeApp);
  bind($("backApp"), backApp);
  bind($("homebar"), () => state.locked ? setLocked(false) : closeApp());
  bind($("notice"), () => $("notice").classList.remove("show"));
  $("notificationCenter").addEventListener("click", (event) => {
    if (event.target === $("notificationCenter")) $("notificationCenter").classList.remove("open");
  });
  $("controlCenter").addEventListener("click", (event) => {
    if (event.target === $("controlCenter")) $("controlCenter").classList.remove("open");
  });
  bind($("closeControlCenter"), () => $("controlCenter").classList.remove("open"));
  bind($("controlCenterTrigger"), () => $("controlCenter").classList.add("open"));
  bind($("ccWifi"), () => {
    state.wifi = !state.wifi; state.airplaneMode = false; saveState(); renderControlCenter();
  });
  bind($("ccBluetooth"), () => {
    state.bluetooth = !state.bluetooth; saveState(); renderControlCenter();
  });
  bind($("ccAirplane"), () => {
    state.airplaneMode = !state.airplaneMode;
    if (state.airplaneMode) state.wifi = false;
    saveState(); renderControlCenter();
  });
  bind($("ccMusic"), () => musicApp.toggle());
  $("ccBrightness").addEventListener("input", (event) => {
    state.simulatorBrightness = Number(event.target.value);
    document.documentElement.style.setProperty("--simulator-brightness", `${state.simulatorBrightness}%`);
    saveState();
  });
  $("ccVolume").addEventListener("input", (event) => {
    state.volume = Number(event.target.value); saveState();
  });

  function changeVolume(amount) {
    state.volume = Math.max(5, Math.min(100, state.volume + amount));
    $("volumeLevel").style.height = `${state.volume}%`;
    $("volumeHud").classList.add("show");
    window.setTimeout(() => $("volumeHud").classList.remove("show"), 900);
  }

  function renderControlCenter() {
    $("ccWifi").classList.toggle("active", state.wifi);
    $("ccBluetooth").classList.toggle("active", state.bluetooth);
    $("ccAirplane").classList.toggle("active", state.airplaneMode);
    $("ccBrightness").value = state.simulatorBrightness;
    $("ccVolume").value = state.volume;
    $("ccMusicState").textContent = state.musicPlaying ? "正在播放" : "已暫停";
    $("ccMusicTitle").textContent = state.musicTitle;
  }
  renderControlCenter();
  window.addEventListener("simulator:music-state", renderControlCenter);

  bind($("volUp"), () => changeVolume(10));
  bind($("volDown"), () => changeVolume(-10));

  document.querySelectorAll("[data-app]").forEach((button) => {
    bind(button, () => {
      if (!state.locked) appRegistry[button.dataset.app]?.open();
    });
  });

  let startX = 0;
  let startY = 0;
  let pointerActive = false;
  $("screen").addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
  }, { passive: true });
  $("screen").addEventListener("touchend", (event) => {
    const point = event.changedTouches[0];
    const dy = point.clientY - startY;
    const dx = point.clientX - startX;
    const bounds = $("screen").getBoundingClientRect();
    if ($("appWindow").classList.contains("open") && startX < bounds.left + 30 && dx > 58 && Math.abs(dy) < 70) {
      backApp();
      return;
    }
    if (state.locked && dy < -55) setLocked(false);
    if (!state.locked && startY < bounds.top + 90 && dy > 55) {
      const panel = startX > bounds.left + bounds.width / 2 ? $("controlCenter") : $("notificationCenter");
      if (panel === $("notificationCenter")) renderNotifications();
      panel.classList.add("open");
    } else if (!state.locked && startY > bounds.top + 110 && startY < bounds.bottom - 120 && dy > 55 && Math.abs(dx) < 80) {
      openSpotlight();
    } else if (!state.locked && startY > bounds.bottom - 95 && dy < -55 && Math.abs(dx) < 90) {
      openAppSwitcher();
    }
  }, { passive: true });
  $("screen").addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
    pointerActive = true;
  });
  $("screen").addEventListener("pointerup", (event) => {
    if (!pointerActive) return;
    pointerActive = false;
    const dy = event.clientY - startY;
    const dx = event.clientX - startX;
    const bounds = $("screen").getBoundingClientRect();
    if ($("appWindow").classList.contains("open") && startX < bounds.left + 28 && dx > 60 && Math.abs(dy) < 70) {
      backApp();
      return;
    }
    if (!state.locked && startY < bounds.top + 95 && dy > 45) {
      const panel = startX > bounds.left + bounds.width / 2 ? $("controlCenter") : $("notificationCenter");
      if (panel === $("notificationCenter")) renderNotifications();
      panel.classList.add("open");
    } else if (!state.locked && startY > bounds.top + 110 && startY < bounds.bottom - 120 && dy > 50 && Math.abs(dx) < 80) {
      openSpotlight();
    } else if (!state.locked && startY > bounds.bottom - 95 && dy < -50 && Math.abs(dx) < 90) {
      openAppSwitcher();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNetworkStatus();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  settingsApp.init();
  musicApp.init();
  initIsland((name) => appRegistry[name]?.open(), () => musicApp.toggle());
  initSystemUI();
  initPhone();
  initWatch();
  console.info("Apple OS Simulator V4 已啟動");
});
