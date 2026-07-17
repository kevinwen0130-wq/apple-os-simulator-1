import { state, saveState } from "../state.js";
import { $, bind, openApp } from "../ui.js";

const today = () => new Date().toISOString().slice(0, 10);

export const calendarApp = {
  title: "行事曆",
  open() {
    const events = [...state.calendarEvents].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    openApp(this.title, `
      <div class="calendar-date"><strong>${new Date().getDate()}</strong><span>${new Date().toLocaleDateString("zh-TW",{month:"long",weekday:"long"})}</span><button id="addEvent">＋</button></div>
      <div class="system-list">${events.length ? events.map((event) => `
        <div class="event-row"><span></span><div><b>${event.title}</b><small>${event.date} ${event.time || "全天"}</small></div><button data-delete-event="${event.id}">×</button></div>`).join("") :
        `<div class="empty-state">尚無行程</div>`}</div>`);
    bind($("addEvent"), () => {
      openApp("新增行程", `<div class="editor-form"><input id="eventTitle" placeholder="行程名稱"><label>日期<input id="eventDate" type="date" value="${today()}"></label><label>時間<input id="eventTime" type="time"></label><button id="saveEvent">加入行事曆</button></div>`);
      bind($("saveEvent"), () => {
        const title = $("eventTitle").value.trim();
        if (!title) return;
        state.calendarEvents.push({ id: crypto.randomUUID(), title, date: $("eventDate").value, time: $("eventTime").value });
        saveState(); this.open();
      });
    });
    document.querySelectorAll("[data-delete-event]").forEach((button) => bind(button, () => {
      state.calendarEvents = state.calendarEvents.filter((event) => event.id !== button.dataset.deleteEvent);
      saveState(); this.open();
    }));
  }
};
