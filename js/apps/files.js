import { state, saveState } from "../state.js";
import { $, bind, openApp } from "../ui.js";

export const filesApp = {
  title: "檔案",
  open() {
    openApp(this.title, `
      <div class="system-app-toolbar"><b>在我的 iPhone 上</b><button id="newFile">新增文字檔</button></div>
      <div class="file-grid">${state.files.length ? state.files.map((file) => `
        <button class="file-card" data-file="${file.id}"><span>📄</span><b>${file.name}</b><small>${file.content.length} 個字元</small></button>`).join("") :
        `<div class="empty-state">資料夾是空的</div>`}</div>`);
    bind($("newFile"), () => this.edit());
    document.querySelectorAll("[data-file]").forEach((button) => bind(button, () => this.edit(button.dataset.file)));
  },
  edit(id) {
    const file = state.files.find((item) => item.id === id) || { id: crypto.randomUUID(), name: "未命名.txt", content: "" };
    openApp(file.name, `<div class="editor-form"><input id="fileName" value="${file.name}"><textarea id="fileContent">${file.content}</textarea><div><button id="saveFile">儲存</button>${id ? `<button id="deleteFile" class="danger">刪除</button>` : ""}</div></div>`);
    bind($("saveFile"), () => {
      file.name = $("fileName").value.trim() || "未命名.txt";
      file.content = $("fileContent").value;
      if (!id) state.files.unshift(file);
      saveState(); this.open();
    });
    bind($("deleteFile"), () => {
      state.files = state.files.filter((item) => item.id !== id);
      saveState(); this.open();
    });
  }
};
