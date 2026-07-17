import { state, saveState } from "../state.js";
import { $, bind, openApp } from "../ui.js";
import { deviceInfo, getLocation, requestMotionPermission } from "../device.js";

function applyAppearance() {
  document.body.classList.toggle("simulator-dark", state.appearance === "dark");
  document.documentElement.style.setProperty("--simulator-brightness", `${state.simulatorBrightness}%`);
}

const toggle = (id, checked) => `<button class="ios-switch ${checked ? "on" : ""}" id="${id}" role="switch" aria-checked="${checked}"><i></i></button>`;

export const settingsApp = {
  title: "設定",
  open() {
    openApp(this.title, `
      <div class="ios-large-title"><h1>設定</h1></div>
      <label class="ios-search"><span>⌕</span><input placeholder="搜尋"></label>
      <button class="ios-apple-account"><span>KW</span><div><b>Apple 帳號</b><small>iCloud、媒體與購買項目</small></div><i>›</i></button>
      <div class="settings-group ios-settings-list">
        <div class="setting-row"><span class="setting-icon orange">✈</span><div><b>飛航模式</b></div>${toggle("settingAirplane",state.airplaneMode)}</div>
        <div class="setting-row"><span class="setting-icon blue">⌁</span><div><b>Wi‑Fi</b></div><small>${state.wifi ? "已連線" : "關閉"}　›</small></div>
        <div class="setting-row"><span class="setting-icon blue">ᛒ</span><div><b>藍牙</b></div><small>${state.bluetooth ? "開啟" : "關閉"}　›</small></div>
      </div>
      <div class="settings-group ios-settings-list">
        <button class="setting-row" id="openDisplay"><span class="setting-icon blue">AA</span><div><b>螢幕顯示與亮度</b></div><small>›</small></button>
        <button class="setting-row" id="openPrivacy"><span class="setting-icon blue">✋</span><div><b>隱私權與安全性</b></div><small>›</small></button>
        <button class="setting-row" id="openAbout"><span class="setting-icon gray">⚙</span><div><b>一般</b></div><small>›</small></button>
      </div>`);
    bind($("settingAirplane"), () => { state.airplaneMode=!state.airplaneMode;if(state.airplaneMode)state.wifi=false;saveState();this.open(); });
    bind($("openDisplay"), () => this.display());
    bind($("openPrivacy"), () => this.privacy());
    bind($("openAbout"), () => this.about());
  },
  display() {
    openApp("螢幕顯示與亮度", `<div class="ios-appearance-choice"><button id="lightAppearance" class="${state.appearance==="light"?"selected":""}"><span class="appearance-preview light"></span>淺色</button><button id="darkAppearance" class="${state.appearance==="dark"?"selected":""}"><span class="appearance-preview dark"></span>深色</button></div><div class="settings-group"><label class="setting-row"><div><b>亮度</b></div><input id="brightnessSetting" type="range" min="35" max="100" value="${state.simulatorBrightness}"></label></div>`);
    ["light","dark"].forEach((appearance) => bind($(`${appearance}Appearance`), () => {state.appearance=appearance;saveState();applyAppearance();this.display();}));
    $("brightnessSetting").addEventListener("input", (event) => {state.simulatorBrightness=Number(event.target.value);saveState();applyAppearance();});
  },
  privacy() {
    openApp("隱私權與安全性", `<p class="ios-section-note">網頁只會在你按下允許後，使用瀏覽器提供的權限。</p><div class="settings-group ios-settings-list"><button class="setting-row" id="requestLocation"><span class="setting-icon blue">➤</span><div><b>定位服務</b></div><small id="locationPermission">${deviceInfo.hasLocation?"尚未請求":"不支援"}　›</small></button><button class="setting-row" id="requestMotion"><span class="setting-icon pink">◉</span><div><b>動作與健身</b></div><small id="motionStatus">${deviceInfo.hasMotion?"尚未請求":"不支援"}　›</small></button><div class="setting-row"><span class="setting-icon green">●</span><div><b>相機</b></div><small>${deviceInfo.hasCamera?"可使用":"不支援"}</small></div></div>`);
    bind($("requestLocation"),async()=>{try{const location=await getLocation({fresh:true});$("locationPermission").textContent=`已允許 · ±${location.accuracy}m`;}catch(error){$("locationPermission").textContent=error.message;}});
    bind($("requestMotion"),async()=>{try{await requestMotionPermission(({x,y,z})=>$("motionStatus").textContent=`已連接 · ${[x,y,z].map(v=>Number(v||0).toFixed(1)).join(",")}`);}catch(error){$("motionStatus").textContent=error.message;}});
  },
  about() {
    openApp("一般", `<div class="settings-group ios-settings-list"><div class="setting-row"><div><b>關於本機</b></div><small>›</small></div><div class="setting-row"><div><b>裝置環境</b></div><small>${deviceInfo.isAndroid?"Android":deviceInfo.isIOS?"iPhone／iPad":"電腦瀏覽器"}</small></div><div class="setting-row"><div><b>連線</b></div><small>${deviceInfo.isSecure?"HTTPS":"本機測試"}</small></div><div class="setting-row"><div><b>版本</b></div><small>Apple OS Simulator V4</small></div></div>`);
  },
  init: applyAppearance
};
