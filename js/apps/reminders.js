import { state, saveState } from "../state.js";
import { $, bind, openApp } from "../ui.js";

export const remindersApp = {
  title: "提醒事項",
  open() {
    openApp(this.title, `
      <div class="system-app-toolbar"><b>我的清單</b><button id="addReminder">新增</button></div>
      <div class="system-list">${state.reminders.length ? state.reminders.map((item) => `
        <div class="check-row ${item.done ? "done" : ""}"><button data-toggle-reminder="${item.id}">${item.done ? "✓" : ""}</button><span>${item.text}</span><button data-delete-reminder="${item.id}">×</button></div>`).join("") :
        `<div class="empty-state">沒有提醒事項</div>`}</div>`);
    bind($("addReminder"), () => {
      openApp("新增提醒事項", `<div class="editor-form"><input id="reminderText" placeholder="要提醒什麼？"><button id="saveReminder">加入清單</button></div>`);
      bind($("saveReminder"), () => {
        const text = $("reminderText").value.trim();
        if (!text) return;
        state.reminders.unshift({ id: crypto.randomUUID(), text, done: false });
        saveState(); this.open();
      });
    });
    document.querySelectorAll("[data-toggle-reminder]").forEach((button) => bind(button, () => {
      const item = state.reminders.find((entry) => entry.id === button.dataset.toggleReminder);
      item.done = !item.done; saveState(); this.open();
    }));
    document.querySelectorAll("[data-delete-reminder]").forEach((button) => bind(button, () => {
      state.reminders = state.reminders.filter((entry) => entry.id !== button.dataset.deleteReminder);
      saveState(); this.open();
    }));
  }
};
