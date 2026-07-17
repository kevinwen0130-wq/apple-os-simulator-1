import { $, bind, openApp } from "../ui.js";
import { fetchJSON } from "../network.js";

const sources = [
  ["Google 新聞", "https://news.google.com/home?hl=zh-TW&gl=TW&ceid=TW:zh-Hant", "G"],
  ["中央社", "https://www.cna.com.tw/", "央"],
  ["BBC 中文", "https://www.bbc.com/zhongwen/trad", "B"],
  ["科技新報", "https://technews.tw/", "科"]
];

export const newsApp = {
  title: "新聞",
  open() {
    openApp(this.title, `<div class="ios-large-title"><h1>News</h1></div><label class="ios-search"><span>⌕</span><input id="newsQuery" placeholder="搜尋新聞主題"><button id="searchNews">搜尋</button></label><div class="news-sources">${sources.map(([name,url,icon])=>`<button data-news-url="${url}"><span>${icon}</span><div><b>${name}</b><small>開啟正式網站</small></div><i>›</i></button>`).join("")}</div><section class="news-trending"><h3>熱門知識</h3><div id="newsTrending"><div class="empty-state">正在載入即時內容…</div></div></section>`);
    document.querySelectorAll("[data-news-url]").forEach(button=>bind(button,()=>window.open(button.dataset.newsUrl,"_blank","noopener,noreferrer")));
    const search=()=>{const q=$("newsQuery").value.trim();if(q)window.open(`https://news.google.com/search?q=${encodeURIComponent(q)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`,"_blank","noopener,noreferrer");};
    bind($("searchNews"),search);$("newsQuery").addEventListener("keydown",e=>{if(e.key==="Enter")search();});
    fetchJSON("https://zh.wikipedia.org/api/rest_v1/feed/featured/"+new Date().toISOString().slice(0,10).replaceAll("-","/"),{},8000).then(data=>{
      const items=(data.mostread?.articles||[]).slice(0,5);$("newsTrending").innerHTML=items.map(item=>`<button data-wiki-url="${item.content_urls?.desktop?.page||"https://zh.wikipedia.org"}"><b>${item.normalizedtitle||item.title}</b><small>${item.description||"維基百科熱門內容"}</small></button>`).join("")||`<div class="empty-state">暫無內容</div>`;
      document.querySelectorAll("[data-wiki-url]").forEach(button=>bind(button,()=>window.open(button.dataset.wikiUrl,"_blank","noopener,noreferrer")));
    }).catch(error=>$("newsTrending").innerHTML=`<div class="empty-state">${error.message}</div>`);
  }
};
