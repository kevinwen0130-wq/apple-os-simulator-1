import { state, saveState } from "../state.js";
import { $, bind, openApp, showNotice } from "../ui.js";

let number = "";
const keys = [["1",""],["2","ABC"],["3","DEF"],["4","GHI"],["5","JKL"],["6","MNO"],["7","PQRS"],["8","TUV"],["9","WXYZ"],["*",""],["0","+"],["#",""]];

function beginCall(numberToCall, name = numberToCall) {
  state.recentCalls.unshift({ number: numberToCall, name, calledAt: new Date().toISOString() });
  state.recentCalls = state.recentCalls.slice(0, 20); saveState();
  openApp("通話", `<div class="ios-call-screen"><small>正在撥號…</small><h2>${name}</h2><span>${numberToCall}</span><div class="ios-call-options"><button>🔇<small>靜音</small></button><button>⌨<small>鍵盤</small></button><button>🔊<small>擴音</small></button><button>＋<small>加入通話</small></button><button>◉<small>FaceTime</small></button><button>♙<small>聯絡人</small></button></div><button id="endCall" class="ios-end-call">☎</button><a href="tel:${numberToCall}" class="ios-real-call">使用裝置的電話 App</a></div>`);
  bind($("endCall"), () => phoneApp.open("recents"));
}

export const phoneApp = {
  title: "電話",
  open(tab = "keypad") {
    openApp(this.title, `<div id="phoneBody" class="ios-phone-body"></div><nav class="ios-phone-tabs"><button data-phone-tab="recents"><span>◷</span>最近通話</button><button data-phone-tab="contacts"><span>♙</span>聯絡人</button><button data-phone-tab="keypad"><span>●</span>鍵盤</button></nav>`);
    document.querySelectorAll("[data-phone-tab]").forEach((button) => {
      button.classList.toggle("selected", button.dataset.phoneTab === tab);
      bind(button, () => this.open(button.dataset.phoneTab));
    });
    if (tab === "keypad") this.keypad();
    if (tab === "recents") this.recents();
    if (tab === "contacts") this.contacts();
  },
  keypad() {
    $("phoneBody").innerHTML = `<div class="dial-number" id="dialNumber">${number || "&nbsp;"}</div><button id="addDialContact" class="ios-add-number">${number ? "加入聯絡人" : ""}</button><div class="dial-pad">${keys.map(([key,letters]) => `<button data-key="${key}"><b>${key}</b><small>${letters}</small></button>`).join("")}</div><div class="dial-actions"><span></span><button id="callNumber" class="call-button">☎</button><button id="deleteDigit" aria-label="刪除">⌫</button></div>`;
    document.querySelectorAll("[data-key]").forEach((button) => bind(button, () => { number += button.dataset.key; $("dialNumber").textContent = number; $("addDialContact").textContent = "加入聯絡人"; }));
    bind($("deleteDigit"), () => { number = number.slice(0,-1); $("dialNumber").innerHTML = number || "&nbsp;"; $("addDialContact").textContent = number ? "加入聯絡人" : ""; });
    bind($("callNumber"), () => number ? beginCall(number) : showNotice("請先輸入電話號碼"));
    bind($("addDialContact"), () => number && this.newContact(number));
  },
  recents() {
    $("phoneBody").innerHTML = `<div class="ios-large-title"><h1>最近通話</h1><button id="clearRecents">編輯</button></div><div class="ios-segment"><button class="selected">全部</button><button>未接來電</button></div><div class="ios-recents">${state.recentCalls.length ? state.recentCalls.map((item) => `<button class="ios-recent" data-recent-call="${item.number}"><span class="ios-call-type">☎</span><div><b>${item.name || item.number}</b><small>行動電話</small></div><time>${new Date(item.calledAt).toLocaleDateString("zh-TW",{month:"numeric",day:"numeric"})}</time><i>ⓘ</i></button>`).join("") : `<div class="empty-state">沒有最近通話</div>`}</div>`;
    document.querySelectorAll("[data-recent-call]").forEach((button) => bind(button, () => beginCall(button.dataset.recentCall)));
    bind($("clearRecents"), () => { state.recentCalls=[]; saveState(); this.open("recents"); });
  },
  contacts() {
    $("phoneBody").innerHTML = `<div class="ios-large-title"><h1>聯絡人</h1><button id="addContact">＋</button></div><label class="ios-search"><span>⌕</span><input id="contactSearch" placeholder="搜尋"></label><div class="ios-contacts">${state.contacts.map((contact) => `<div class="ios-contact" data-contact-name="${contact.name.toLowerCase()}"><button data-contact-call="${contact.id}"><span>${contact.name[0]}</span><div><b>${contact.name}</b><small>${contact.number}</small></div></button><button data-contact-delete="${contact.id}">×</button></div>`).join("") || `<div class="empty-state">尚無聯絡人</div>`}</div>`;
    bind($("addContact"), () => this.newContact(""));
    $("contactSearch").addEventListener("input", (event) => document.querySelectorAll("[data-contact-name]").forEach((row) => row.hidden = !row.dataset.contactName.includes(event.target.value.toLowerCase())));
    document.querySelectorAll("[data-contact-call]").forEach((button) => bind(button, () => { const contact=state.contacts.find((item)=>item.id===button.dataset.contactCall); beginCall(contact.number,contact.name); }));
    document.querySelectorAll("[data-contact-delete]").forEach((button) => bind(button, () => { state.contacts=state.contacts.filter((item)=>item.id!==button.dataset.contactDelete);saveState();this.open("contacts"); }));
  },
  newContact(prefill) {
    openApp("新增聯絡人", `<div class="ios-new-contact"><span class="ios-contact-photo">＋</span><input id="contactName" placeholder="名字"><div class="settings-group"><input id="contactNumber" type="tel" value="${prefill}" placeholder="電話號碼"></div><button id="saveContact">完成</button></div>`);
    bind($("saveContact"), () => { const name=$("contactName").value.trim(),phone=$("contactNumber").value.trim();if(!name||!phone)return;state.contacts.push({id:crypto.randomUUID(),name,number:phone});saveState();this.open("contacts"); });
  }
};
