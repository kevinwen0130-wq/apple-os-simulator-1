import { state, saveState } from "../state.js";
import { $, bind, openApp } from "../ui.js";

const normalize = (value) => /^https?:\/\//i.test(value) ? value : `https://www.google.com/search?q=${encodeURIComponent(value)}`;

function launch(value) {
  if (!value.trim()) return;
  const url = normalize(value.trim());
  state.safariHistory.unshift({ title: value.trim(), url, visitedAt: new Date().toISOString() });
  state.safariHistory = state.safariHistory.slice(0,30); saveState();
  window.open(url, "_blank", "noopener,noreferrer");
}

export const safariApp = {
  title: "Safari",
  open() {
    openApp(this.title, `
      <div class="ios-safari-start">
        <div class="ios-large-title"><h1>起始頁面</h1></div>
        <section><h3>常用項目</h3><div class="favorites-grid"><button data-site="https://www.apple.com/tw/"><span></span><small>Apple</small></button><button data-site="https://github.com"><span class="github-favorite">⌘</span><small>GitHub</small></button><button data-site="https://zh.wikipedia.org"><span>W</span><small>Wikipedia</small></button></div></section>
        <section><h3>隱私權報告</h3><div class="ios-privacy-card"><span>🛡</span><div><b>Safari 已阻擋追蹤器</b><small>模擬器內開啟的真實網站會使用瀏覽器的新分頁。</small></div></div></section>
      </div>
      <div class="ios-safari-toolbar"><button id="safariBack">‹</button><button id="safariForward">›</button><button id="showBookmarks">▤</button><label><span>AA</span><input id="safariInput" placeholder="搜尋或輸入網站名稱"><button id="safariGo">↻</button></label><button id="showHistory">□</button></div>`);
    bind($("safariGo"),()=>launch($("safariInput").value));
    $("safariInput").addEventListener("keydown",(event)=>{if(event.key==="Enter")launch(event.currentTarget.value);});
    document.querySelectorAll("[data-site]").forEach((button)=>bind(button,()=>launch(button.dataset.site)));
    bind($("showHistory"),()=>this.history());
    bind($("showBookmarks"),()=>this.bookmarks());
  },
  history() {
    openApp("瀏覽紀錄", `<div class="ios-large-title"><h1>瀏覽紀錄</h1><button id="clearHistory">清除</button></div><label class="ios-search"><span>⌕</span><input id="historySearch" placeholder="搜尋瀏覽紀錄"></label><div class="ios-history-list">${state.safariHistory.map((item)=>`<button data-history-url="${item.url}"><span>◷</span><div><b>${item.title}</b><small>${item.url}</small></div></button>`).join("")||`<div class="empty-state">沒有瀏覽紀錄</div>`}</div>`);
    bind($("clearHistory"),()=>{state.safariHistory=[];saveState();this.history();});
    document.querySelectorAll("[data-history-url]").forEach((button)=>bind(button,()=>window.open(button.dataset.historyUrl,"_blank","noopener,noreferrer")));
  },
  bookmarks() {
    openApp("書籤", `<div class="ios-large-title"><h1>書籤</h1><button id="addBookmark">＋</button></div><div id="bookmarkForm" class="ios-bookmark-form" hidden><input id="bookmarkName" placeholder="名稱"><input id="bookmarkUrl" placeholder="https://"><button id="saveBookmark">儲存</button></div><div class="ios-bookmark-list">${state.safariBookmarks.map((item)=>`<div><button data-bookmark-url="${item.url}"><span>☆</span>${item.name}</button><button data-delete-bookmark="${item.id}">×</button></div>`).join("")||`<div class="empty-state">尚無書籤</div>`}</div>`);
    bind($("addBookmark"),()=>{$("bookmarkForm").hidden=false;$("bookmarkName").focus();});
    bind($("saveBookmark"),()=>{const name=$("bookmarkName").value.trim(),url=$("bookmarkUrl").value.trim();if(!name||!url)return;state.safariBookmarks.push({id:crypto.randomUUID(),name,url:normalize(url)});saveState();this.bookmarks();});
    document.querySelectorAll("[data-bookmark-url]").forEach((button)=>bind(button,()=>window.open(button.dataset.bookmarkUrl,"_blank","noopener,noreferrer")));
    document.querySelectorAll("[data-delete-bookmark]").forEach((button)=>bind(button,()=>{state.safariBookmarks=state.safariBookmarks.filter((item)=>item.id!==button.dataset.deleteBookmark);saveState();this.bookmarks();}));
  }
};
