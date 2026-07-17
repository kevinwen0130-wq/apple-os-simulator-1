import { state, saveState } from "../state.js";
import { $, bind, openApp, showNotice } from "../ui.js";

const formatDate = (value) => new Date(value).toLocaleString("zh-TW", {
  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
});

function persist() {
  try { saveState(); } catch { showNotice("照片資料暫時無法儲存"); }
}

function photoGrid(items, attribute = "photo") {
  return items.map(({ photo, index }) => `
    <button class="photo-tile" data-${attribute}="${index}">
      <img src="${photo.src}" alt="照片 ${index + 1}">
      ${photo.favorite ? `<span class="favorite-mark">♥</span>` : ""}
      ${photo.mode === "portrait" ? `<span class="portrait-mark">ƒ</span>` : ""}
    </button>`).join("");
}

export const photosApp = {
  title: "照片",
  filter: "all",

  open(filter = this.filter) {
    this.filter = filter;
    const all = state.photos.map((photo, index) => ({ photo, index }));
    const items = filter === "favorites" ? all.filter(({ photo }) => photo.favorite) : all;
    openApp(this.title, `
      <div class="photos-app">
        <div class="photos-heading"><div><h3>${filter === "favorites" ? "個人收藏" : "圖庫"}</h3><small>${items.length} 張照片</small></div><button id="selectPhotos">選取</button></div>
        <div class="photos-tabs"><button data-library-filter="all" class="${filter === "all" ? "selected" : ""}">所有照片</button><button data-library-filter="favorites" class="${filter === "favorites" ? "selected" : ""}">收藏</button></div>
        <div class="photo-grid">${items.length ? photoGrid(items) : `<div class="empty-library"><span>🖼️</span><b>${filter === "favorites" ? "尚無收藏照片" : "尚無照片"}</b><small>使用相機拍攝後，照片會出現在這裡。</small></div>`}</div>
        <button id="recentlyDeleted" class="album-row"><span>🗑️</span><b>最近刪除</b><small>${state.deletedPhotos?.length || 0}</small></button>
      </div>`);
    document.querySelectorAll("[data-photo]").forEach((button) => bind(button, () => this.openPhoto(Number(button.dataset.photo))));
    document.querySelectorAll("[data-library-filter]").forEach((button) => bind(button, () => this.open(button.dataset.libraryFilter)));
    bind($("recentlyDeleted"), () => this.openDeleted());
    bind($("selectPhotos"), () => this.openSelection(items));
  },

  openPhoto(index) {
    const photo = state.photos[index];
    if (!photo) return this.open();
    openApp("照片", `
      <div class="photo-viewer">
        <div class="photo-date"><b>${formatDate(photo.createdAt)}</b><small>${photo.camera === "user" ? "前置相機" : "後置相機"}${photo.width ? ` · ${photo.width} × ${photo.height}` : ""}</small></div>
        <div class="photo-stage"><img src="${photo.src}" alt="照片"><button id="sharePhoto" class="photo-share">↥</button></div>
        <div class="photo-counter">${index + 1} / ${state.photos.length}</div>
        <div class="photo-actions">
          <button id="previousPhoto" ${index >= state.photos.length - 1 ? "disabled" : ""}>‹</button>
          <button id="favoritePhoto">${photo.favorite ? "♥" : "♡"}</button>
          <button id="deletePhoto">🗑️</button>
          <button id="nextPhoto" ${index <= 0 ? "disabled" : ""}>›</button>
        </div>
      </div>`);
    bind($("previousPhoto"), () => this.openPhoto(index + 1));
    bind($("nextPhoto"), () => this.openPhoto(index - 1));
    bind($("favoritePhoto"), () => {
      photo.favorite = !photo.favorite;
      persist();
      this.openPhoto(index);
    });
    bind($("deletePhoto"), () => {
      state.deletedPhotos ||= [];
      state.deletedPhotos.unshift({ ...photo, deletedAt: new Date().toISOString() });
      state.deletedPhotos = state.deletedPhotos.slice(0, 30);
      state.photos.splice(index, 1);
      persist();
      showNotice("照片已移到「最近刪除」");
      this.open();
    });
    bind($("sharePhoto"), async () => {
      try {
        const blob = await (await fetch(photo.src)).blob();
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: "Apple OS Simulator 照片", files: [file] });
        else {
          const link = document.createElement("a");
          link.href = photo.src;
          link.download = file.name;
          link.click();
        }
      } catch {
        showNotice("目前瀏覽器不支援分享這張照片");
      }
    });
  },

  openSelection(items) {
    openApp("選取照片", `
      <div class="selection-toolbar"><b id="selectionCount">已選取 0 張</b><button id="deleteSelected" disabled>刪除</button></div>
      <div class="photo-grid">${items.length ? items.map(({ photo, index }) => `<button class="photo-tile selectable" data-select-photo="${index}"><img src="${photo.src}" alt="照片"><i>✓</i></button>`).join("") : `<div class="empty-library">沒有照片</div>`}</div>`);
    const selected = new Set();
    document.querySelectorAll("[data-select-photo]").forEach((button) => bind(button, () => {
      const index = Number(button.dataset.selectPhoto);
      selected.has(index) ? selected.delete(index) : selected.add(index);
      button.classList.toggle("selected", selected.has(index));
      $("selectionCount").textContent = `已選取 ${selected.size} 張`;
      $("deleteSelected").disabled = !selected.size;
    }));
    bind($("deleteSelected"), () => {
      state.deletedPhotos ||= [];
      [...selected].sort((a, b) => b - a).forEach((index) => {
        const [photo] = state.photos.splice(index, 1);
        if (photo) state.deletedPhotos.unshift({ ...photo, deletedAt: new Date().toISOString() });
      });
      persist();
      this.open();
    });
  },

  openDeleted() {
    state.deletedPhotos ||= [];
    openApp("最近刪除", `
      <div class="photos-heading"><div><h3>最近刪除</h3><small>可復原或永久刪除</small></div>${state.deletedPhotos.length ? `<button id="deleteAllPhotos">全部刪除</button>` : ""}</div>
      <div class="photo-grid">${state.deletedPhotos.length ? state.deletedPhotos.map((photo, index) => `<button class="photo-tile" data-deleted="${index}"><img src="${photo.src}" alt="已刪除照片"></button>`).join("") : `<div class="empty-library"><span>🗑️</span><b>沒有最近刪除的照片</b></div>`}</div>`);
    document.querySelectorAll("[data-deleted]").forEach((button) => bind(button, () => {
      const index = Number(button.dataset.deleted);
      const photo = state.deletedPhotos[index];
      openApp("最近刪除", `<div class="photo-viewer"><div class="photo-stage"><img src="${photo.src}" alt="已刪除照片"></div><div class="photo-actions"><button id="restorePhoto">復原</button><button id="erasePhoto" class="danger-button">永久刪除</button></div></div>`);
      bind($("restorePhoto"), () => {
        delete photo.deletedAt;
        state.photos.unshift(photo);
        state.deletedPhotos.splice(index, 1);
        persist();
        this.openDeleted();
      });
      bind($("erasePhoto"), () => {
        state.deletedPhotos.splice(index, 1);
        persist();
        this.openDeleted();
      });
    }));
    bind($("deleteAllPhotos"), () => {
      state.deletedPhotos = [];
      persist();
      this.openDeleted();
    });
  }
};
