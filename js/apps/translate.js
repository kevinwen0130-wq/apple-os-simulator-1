import { $, bind, openApp } from "../ui.js";
import { fetchJSON } from "../network.js";

export const translateApp = {
  title: "翻譯",
  open() {
    openApp(this.title, `<div class="ios-large-title"><h1>翻譯</h1></div><div class="translate-languages"><select id="sourceLanguage"><option value="zh-TW">繁體中文</option><option value="en">英文</option><option value="ja">日文</option><option value="ko">韓文</option></select><button id="swapLanguages">⇄</button><select id="targetLanguage"><option value="en">英文</option><option value="zh-TW">繁體中文</option><option value="ja">日文</option><option value="ko">韓文</option></select></div><textarea id="translateInput" class="translate-input" placeholder="輸入文字"></textarea><button id="translateNow">翻譯</button><div id="translateResult" class="translate-result"><small>翻譯結果</small><p>—</p></div><button id="openGoogleTranslate" class="external-service">使用 Google 翻譯開啟</button>`);
    bind($("swapLanguages"),()=>{const a=$("sourceLanguage").value;$("sourceLanguage").value=$("targetLanguage").value;$("targetLanguage").value=a;});
    bind($("translateNow"),async()=>{const text=$("translateInput").value.trim();if(!text)return;$("translateResult").innerHTML="<small>正在翻譯…</small>";try{const source=$("sourceLanguage").value.replace("zh-TW","zh-TW"),target=$("targetLanguage").value.replace("zh-TW","zh-TW");const data=await fetchJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source+"|"+target)}`,{},10000);$("translateResult").innerHTML=`<small>翻譯結果</small><p>${data.responseData?.translatedText||"無法翻譯"}</p>`;}catch(error){$("translateResult").innerHTML=`<small>翻譯失敗</small><p>${error.message}</p>`;}});
    bind($("openGoogleTranslate"),()=>{const text=$("translateInput").value.trim();window.open(`https://translate.google.com/?sl=${$("sourceLanguage").value}&tl=${$("targetLanguage").value}&text=${encodeURIComponent(text)}&op=translate`,"_blank","noopener,noreferrer");});
  }
};
