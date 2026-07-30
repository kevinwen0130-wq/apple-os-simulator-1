import { appRegistry } from "../apps/index.js";
import { state, saveState } from "../state.js";
import { $, bind, setLocked } from "../ui.js";
import { openRegisteredApp } from "./system-ui.js";

const aliases = {
  phone: ["電話", "撥號"], messages: ["訊息", "信息", "簡訊"], camera: ["相機", "拍照"], photos: ["照片", "相簿"],
  safari: ["safari", "瀏覽器", "網頁"], weather: ["天氣"], maps: ["地圖", "導航"], settings: ["設定", "設置"],
  music: ["音樂", "歌曲"], calculator: ["計算機"], mail: ["郵件", "信箱"], notes: ["備忘錄", "筆記"],
  reminders: ["提醒事項", "提醒"], calendar: ["行事曆", "日曆"], files: ["檔案", "文件"], clock: ["時鐘", "鬧鐘", "計時器"],
  health: ["健康"], wallet: ["錢包"], store: ["app store", "商店"], news: ["新聞"], translate: ["翻譯"]
};

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

function addExchange(command, response) {
  state.assistantHistory.push({ command, response, createdAt: new Date().toISOString() });
  state.assistantHistory = state.assistantHistory.slice(-12);
  saveState();
  $("assistantConversation").insertAdjacentHTML("beforeend", `<p class="assistant-user">${escapeHtml(command)}</p><p class="assistant-reply">${escapeHtml(response)}</p>`);
  $("assistantConversation").scrollTop = $("assistantConversation").scrollHeight;
}

function findApp(command) {
  const normalized = command.toLocaleLowerCase("zh-Hant");
  return Object.entries(aliases).find(([key, names]) => appRegistry[key] && names.some((name) => normalized.includes(name.toLocaleLowerCase("zh-Hant"))))?.[0] || null;
}

export function runAssistantCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) return;
  const normalized = command.toLocaleLowerCase("zh-Hant");
  const appKey = findApp(command);
  let response = "我還不會這個指令，你可以請我開啟 App、查時間或調整連線與外觀。";
  let action = null;

  if (/幾點|時間/.test(normalized)) {
    response = `現在是 ${new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })}。`;
  } else if (/日期|幾號|星期/.test(normalized)) {
    response = `今天是 ${new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}。`;
  } else if (/wi-?fi|無線網路/i.test(normalized)) {
    const enabled = !/關閉|關掉|停用/.test(normalized);
    state.wifi = enabled; if (enabled) state.airplaneMode = false; saveState();
    response = `Wi‑Fi 已${enabled ? "開啟" : "關閉"}。`;
  } else if (/藍牙|bluetooth/i.test(normalized)) {
    const enabled = !/關閉|關掉|停用/.test(normalized);
    state.bluetooth = enabled; saveState(); response = `藍牙已${enabled ? "開啟" : "關閉"}。`;
  } else if (/飛航|飛行模式/.test(normalized)) {
    const enabled = !/關閉|關掉|停用/.test(normalized);
    state.airplaneMode = enabled; if (enabled) state.wifi = false; saveState(); response = `飛航模式已${enabled ? "開啟" : "關閉"}。`;
  } else if (/深色|暗色/.test(normalized)) {
    state.appearance = "dark"; saveState(); document.body.classList.add("simulator-dark"); response = "已切換到深色模式。";
  } else if (/淺色|亮色/.test(normalized)) {
    state.appearance = "light"; saveState(); document.body.classList.remove("simulator-dark"); response = "已切換到淺色模式。";
  } else if (appKey) {
    response = `好的，正在開啟${appRegistry[appKey].title}。`;
    action = () => { setLocked(false); closeAssistant(); window.setTimeout(() => openRegisteredApp(appKey), 180); };
  }
  addExchange(command, response);
  window.setTimeout(() => action?.(), 320);
}

export function openAssistant() {
  $("assistant").classList.add("open");
  window.setTimeout(() => $("assistantInput").focus(), 80);
}

export function closeAssistant() {
  $("assistant").classList.remove("open", "listening");
}

function startVoiceInput() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    addExchange("語音輸入", "這個瀏覽器不支援語音辨識，請改用文字輸入。");
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "zh-TW";
  recognition.interimResults = false;
  $("assistant").classList.add("listening");
  recognition.onresult = (event) => { const command = event.results[0][0].transcript; $("assistantInput").value = command; runAssistantCommand(command); };
  recognition.onerror = () => addExchange("語音輸入", "沒有聽清楚，請再試一次。");
  recognition.onend = () => $("assistant").classList.remove("listening");
  recognition.start();
}

export function initAssistant() {
  bind($("assistantTrigger"), openAssistant);
  bind($("actionBtn"), openAssistant);
  bind($("closeAssistant"), closeAssistant);
  bind($("assistantMic"), startVoiceInput);
  $("assistantForm").addEventListener("submit", (event) => { event.preventDefault(); const command = $("assistantInput").value; $("assistantInput").value = ""; runAssistantCommand(command); });
  document.querySelectorAll("[data-assistant-command]").forEach((button) => bind(button, () => runAssistantCommand(button.dataset.assistantCommand)));
}
