import { state, saveState } from "../state.js";
import { $, bind, openApp } from "../ui.js";

export const notesApp = {
  title: "備忘錄",
  open() {
    openApp(this.title, `
      <div class="system-app-toolbar"><b>${state.notes.length} 則備忘錄</b><button id="newNote">新增</button></div>
      <div class="system-list">${state.notes.length ? state.notes.map((note) => `
        <button class="system-row" data-note="${note.id}"><b>${note.title || "新備忘錄"}</b><small>${note.body.slice(0, 45) || "沒有其他文字"}</small></button>`).join("") :
        `<div class="empty-state">尚無備忘錄</div>`}</div>`);
    bind($("newNote"), () => this.edit());
    document.querySelectorAll("[data-note]").forEach((button) => bind(button, () => this.edit(button.dataset.note)));
  },
  edit(id) {
    const note = state.notes.find((item) => item.id === id) || { id: crypto.randomUUID(), title: "", body: "", updatedAt: "" };
    openApp("備忘錄", `<div class="editor-form"><input id="noteTitle" value="${note.title}" placeholder="標題"><textarea id="noteBody" placeholder="開始輸入…">${note.body}</textarea><div><button id="saveNote">儲存</button>${id ? `<button id="deleteNote" class="danger">刪除</button>` : ""}</div></div>`);
    bind($("saveNote"), () => {
      note.title = $("noteTitle").value.trim();
      note.body = $("noteBody").value;
      note.updatedAt = new Date().toISOString();
      if (!id) state.notes.unshift(note);
      saveState(); this.open();
    });
    bind($("deleteNote"), () => {
      state.notes = state.notes.filter((item) => item.id !== id);
      saveState(); this.open();
    });
  }
};
