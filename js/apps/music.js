import { state, saveState } from "../state.js";
import { $, bind, openApp, showNotice } from "../ui.js";

const audio = new Audio();
audio.preload = "none";
let results = [];
let current = null;

function notifyState() {
  saveState();
  window.dispatchEvent(new CustomEvent("simulator:music-state"));
}

function updateIsland() {
  window.dispatchEvent(new CustomEvent("simulator:music-state"));
}

function searchITunes(term) {
  return new Promise((resolve, reject) => {
    const callback = `itunesCallback_${Date.now()}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callback];
      script.remove();
    };
    window[callback] = (data) => {
      cleanup();
      resolve((data.results || []).filter((item) => item.previewUrl));
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("目前無法連接歌曲搜尋服務"));
    };
    script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=TW&media=music&entity=song&limit=8&callback=${callback}`;
    document.head.appendChild(script);
  });
}

function understandMusicRequest(text) {
  return text.trim()
    .replace(/[，。！？,.!?]/g, " ")
    .replace(/^(可以|請|麻煩)?\s*(幫我)?\s*/i, "")
    .replace(/^(我)?\s*(想要?|要|想)\s*(聽|播放|播)\s*/i, "")
    .replace(/^(聽|播放|播)\s*/i, "")
    .replace(/\s*(的歌|歌曲|音樂)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchAndRender(rawRequest, autoPlay = false) {
  const term = understandMusicRequest(rawRequest);
  if (!term) {
    $("musicResults").innerHTML = `<div class="empty-state">請輸入歌曲、歌手或想聽的音樂類型</div>`;
    return;
  }
  $("musicResults").innerHTML = `<div class="empty-state">正在理解「${term}」並搜尋…</div>`;
  try {
    results = await searchITunes(term);
    if (!results.length) {
      $("musicResults").innerHTML = `<div class="empty-state">找不到「${term}」的可試聽歌曲</div>`;
      return;
    }
    if (autoPlay) {
      await playTrack(results[0]);
      return;
    }
    renderResults();
  } catch (error) {
    $("musicResults").innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

function renderResults() {
  $("musicResults").innerHTML = results.map((track, index) => `
    <div class="music-result">
      <img src="${track.artworkUrl100?.replace("100x100", "200x200") || ""}" alt="">
      <button data-preview="${index}"><b>${track.trackName}</b><small>${track.artistName}</small></button>
      <a href="${track.trackViewUrl}" target="_blank" rel="noopener">Apple Music</a>
    </div>`).join("");
  document.querySelectorAll("[data-preview]").forEach((button) =>
    bind(button, () => playTrack(results[Number(button.dataset.preview)])));
}

function platformUrl(platform) {
  const query = encodeURIComponent(current
    ? `${current.trackName} ${current.artistName}`
    : $("musicSearchInput")?.value.trim() || state.musicTitle);
  return {
    apple: current?.trackViewUrl || `https://music.apple.com/tw/search?term=${query}`,
    spotify: `https://open.spotify.com/search/${query}`,
    youtube: `https://music.youtube.com/search?q=${query}`,
    kkbox: `https://www.kkbox.com/tw/tc/search.php?word=${query}`
  }[platform];
}

function bindPlatforms() {
  document.querySelectorAll("[data-music-platform]").forEach((button) => bind(button, () => {
    window.open(platformUrl(button.dataset.musicPlatform), "_blank", "noopener,noreferrer");
  }));
}

async function playTrack(track) {
  current = track;
  audio.src = track.previewUrl.replace(/^http:/, "https:");
  state.musicTitle = track.trackName;
  state.musicArtist = track.artistName;
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: track.trackName, artist: track.artistName, album: track.collectionName || "Apple OS Simulator", artwork: [{ src: track.artworkUrl100?.replace("100x100","600x600") || "icons/app-icon.svg", sizes: "600x600" }] });
  state.musicProgress = 0;
  try {
    await audio.play();
    state.musicPlaying = true;
    notifyState();
    updateIsland();
    musicApp.openPlayer();
  } catch {
    state.musicPlaying = false;
    notifyState();
    showNotice("瀏覽器阻擋播放，請再按一次播放鍵");
  }
}

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  state.musicProgress = audio.currentTime / audio.duration * 100;
  const progress = $("musicProgress");
  if (progress) progress.value = state.musicProgress;
  updateIsland();
  window.dispatchEvent(new CustomEvent("simulator:music-state"));
});
audio.addEventListener("play", () => {
  state.musicPlaying = true;
  notifyState();
  updateIsland();
});
audio.addEventListener("pause", () => {
  state.musicPlaying = false;
  notifyState();
  updateIsland();
});
audio.addEventListener("ended", () => {
  state.musicPlaying = false;
  state.musicProgress = 0;
  notifyState();
  updateIsland();
});

export const musicApp = {
  title: "音樂",
  open() {
    openApp(this.title, `
      <div class="music-search ios-music-library">
        <div class="ios-large-title"><h1>音樂</h1><button id="musicAccount">●</button></div>
        <div class="ios-music-tabs"><button class="selected">Apple Music</button><button>資料庫</button></div>
        <div class="music-request">
          <label class="ios-search"><span>⌕</span><input id="musicSearchInput" placeholder="藝人、歌曲、歌詞等"></label>
          <div><button id="searchMusic">搜尋</button><button id="playMusicRequest">立即播放</button></div>
        </div>
        <p class="permission-note">歌曲試聽由 iTunes 提供，僅以串流方式播放。</p>
        <div class="music-platforms"><button data-music-platform="apple"> Music</button><button data-music-platform="spotify">Spotify</button><button data-music-platform="youtube">YouTube Music</button><button data-music-platform="kkbox">KKBOX</button></div>
        <div id="musicResults">${current ? `<button id="returnPlayer" class="row">回到正在播放：${current.trackName}</button>` : `<div class="empty-state">搜尋歌曲後即可直接播放 30 秒試聽</div>`}</div>
      </div>`);
    bindPlatforms();
    bind($("returnPlayer"), () => this.openPlayer());
    bind($("searchMusic"), () => searchAndRender($("musicSearchInput").value, false));
    bind($("playMusicRequest"), () => searchAndRender($("musicSearchInput").value, true));
    $("musicSearchInput").addEventListener("keydown", (event) => {
      if (event.key === "Enter") searchAndRender(event.currentTarget.value, true);
    });
  },

  openPlayer() {
    if (!current) return this.open();
    openApp(this.title, `
      <div class="music-player ios-now-playing">
        <div class="ios-player-drag"></div>
        <img class="album-image" src="${current.artworkUrl100?.replace("100x100", "600x600") || ""}" alt="${current.collectionName || ""}">
        <div class="track-meta"><b>${current.trackName}</b><span>${current.artistName}</span></div>
        <input id="musicProgress" type="range" min="0" max="100" value="${state.musicProgress}">
        <div class="ios-player-time"><small>0:00</small><small>−0:30</small></div>
        <div class="music-controls">
          <button id="backToSearch">⌄</button>
          <button id="toggleMusic" class="play-main">${state.musicPlaying ? "⏸" : "▶"}</button>
          <a class="apple-music-link" href="${current.trackViewUrl}" target="_blank" rel="noopener"> Music</a>
        </div>
        <div class="music-platforms"><button data-music-platform="apple"> Music</button><button data-music-platform="spotify">Spotify</button><button data-music-platform="youtube">YouTube Music</button><button data-music-platform="kkbox">KKBOX</button></div>
        <p class="permission-note">試聽內容由 iTunes 提供。完整歌曲請前往 Apple Music。</p>
      </div>`);
    bindPlatforms();
    bind($("backToSearch"), () => this.open());
    bind($("toggleMusic"), async () => {
      if (audio.paused) await audio.play();
      else audio.pause();
      this.openPlayer();
    });
    $("musicProgress").addEventListener("input", (event) => {
      if (audio.duration) audio.currentTime = Number(event.target.value) / 100 * audio.duration;
    });
  },

  toggle() {
    if (!current) return this.open();
    if (audio.paused) audio.play();
    else audio.pause();
  },

  init() {
    updateIsland();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("seekbackward", () => audio.currentTime = Math.max(0, audio.currentTime - 10));
      navigator.mediaSession.setActionHandler("seekforward", () => audio.currentTime = Math.min(audio.duration || 30, audio.currentTime + 10));
    }
  }
};
