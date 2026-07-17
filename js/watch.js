import { state, saveState } from "./state.js";
import { $, bind, showNotice } from "./ui.js";

const apps = {
  heart: ["心率", `<div style="font-size:44px">❤️</div><h2>78 BPM</h2><div class="row">靜止心率 72</div>`],
  workout: ["體能訓練", `<div style="font-size:44px">🏃</div><p>戶外步行 24:18</p><div class="row">1.82 公里</div>`],
  music: ["音樂", `<div style="font-size:44px">🎵</div><p>Demo Track</p><button id="watchPlay">播放／暫停</button>`],
  weather: ["天氣", `<div style="font-size:44px">🌤️</div><h2>28°</h2><p>臺北 · 多雲</p>`],
  messages: ["訊息", `<div class="row">iPhone：同步測試成功！</div><button id="quickReply">快速回覆</button>`],
  settings: ["設定", `<div class="row">Wi-Fi</div><div class="row">藍牙</div><div class="row">顯示與亮度</div>`]
};

function render(view) {
  state.watchView = view;
  $("watchFace").hidden = view !== "face";
  $("watchApps").classList.toggle("open", view === "apps");
  $("watchDetail").classList.toggle("open", view === "detail");
  $("watchRecent").classList.toggle("open", view === "recent");
  saveState();
}

function openWatchApp(name) {
  const app = apps[name];
  $("watchTitle").textContent = app[0];
  $("watchContent").innerHTML = app[1];
  render("detail");
  bind($("watchPlay"), () => showNotice("Apple Watch 已切換音樂播放狀態"));
  bind($("quickReply"), () => showNotice("Apple Watch 回覆：好的"));
}

export function initWatch() {
  bind($("crownBtn"), () => render(state.watchView === "face" ? "apps" : "face"));
  bind($("watchSideBtn"), () => render("recent"));
  bind($("watchBack"), () => render("apps"));
  bind($("recentBack"), () => render("face"));
  document.querySelectorAll("[data-watch-app]").forEach((button) => {
    bind(button, () => openWatchApp(button.dataset.watchApp));
  });
  render(state.watchView);
}
