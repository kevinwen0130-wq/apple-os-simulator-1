import { state, saveState } from "../state.js";
import { $, bind, openApp, showNotice } from "../ui.js";
import { requestNotifications, systemNotification } from "../network.js";

let stopwatchStart = null;
let stopwatchElapsed = 0;
let stopwatchTimer = null;
let countdownTimer = null;

export const clockApp = {
  title: "時鐘",
  open(tab = "alarms") {
    openApp(this.title, `<div class="clock-tabs"><button data-clock-tab="alarms">鬧鐘</button><button data-clock-tab="stopwatch">碼錶</button><button data-clock-tab="timer">計時器</button></div><div id="clockBody"></div>`);
    document.querySelectorAll("[data-clock-tab]").forEach((button) => bind(button, () => this.open(button.dataset.clockTab)));
    if (tab === "alarms") this.alarms();
    if (tab === "stopwatch") this.stopwatch();
    if (tab === "timer") this.timer();
  },
  alarms() {
    $("clockBody").innerHTML = `<div class="system-app-toolbar"><b>鬧鐘</b><input id="alarmTime" type="time"><button id="addAlarm">＋</button></div>${state.alarms.map((alarm) => `<div class="alarm-row"><strong>${alarm.time}</strong><button data-toggle-alarm="${alarm.id}">${alarm.enabled ? "開" : "關"}</button><button data-delete-alarm="${alarm.id}">×</button></div>`).join("")}`;
    bind($("addAlarm"), () => {
      const time = $("alarmTime").value;
      if (!time) return;
      state.alarms.push({ id: crypto.randomUUID(), time, enabled: true }); saveState(); this.open("alarms");
    });
    document.querySelectorAll("[data-toggle-alarm]").forEach((button) => bind(button, () => {
      const alarm = state.alarms.find((item) => item.id === button.dataset.toggleAlarm);
      alarm.enabled = !alarm.enabled; saveState(); this.open("alarms");
    }));
    document.querySelectorAll("[data-delete-alarm]").forEach((button) => bind(button, () => {
      state.alarms = state.alarms.filter((item) => item.id !== button.dataset.deleteAlarm);
      saveState(); this.open("alarms");
    }));
  },
  stopwatch() {
    $("clockBody").innerHTML = `<div class="stopwatch-display" id="stopwatchDisplay">${(stopwatchElapsed/1000).toFixed(1)}</div><div class="clock-actions"><button id="resetStopwatch">重設</button><button id="toggleStopwatch">${stopwatchStart ? "停止" : "開始"}</button></div>`;
    bind($("toggleStopwatch"), () => {
      if (stopwatchStart) {
        stopwatchElapsed += Date.now() - stopwatchStart; stopwatchStart = null; clearInterval(stopwatchTimer); this.open("stopwatch");
      } else {
        stopwatchStart = Date.now();
        stopwatchTimer = setInterval(() => {
          const display = $("stopwatchDisplay");
          if (display) display.textContent = ((stopwatchElapsed + Date.now() - stopwatchStart)/1000).toFixed(1);
        }, 100);
        this.open("stopwatch");
      }
    });
    bind($("resetStopwatch"), () => { stopwatchElapsed = 0; stopwatchStart = null; clearInterval(stopwatchTimer); this.open("stopwatch"); });
  },
  timer() {
    $("clockBody").innerHTML = `<div class="timer-form"><input id="timerMinutes" type="number" min="1" value="1"><span>分鐘</span><button id="startTimer">開始</button></div><div class="stopwatch-display" id="timerDisplay">01:00</div>`;
    bind($("startTimer"), () => {
      requestNotifications();
      clearInterval(countdownTimer);
      let remaining = Math.max(1, Number($("timerMinutes").value)) * 60;
      const total = remaining;
      window.dispatchEvent(new CustomEvent("simulator:timer-state",{detail:{remaining,total}}));
      countdownTimer = setInterval(() => {
        remaining--;
        window.dispatchEvent(new CustomEvent("simulator:timer-state",{detail:{remaining,total}}));
        const display = $("timerDisplay");
        if (display) display.textContent = `${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;
        if (remaining <= 0) { clearInterval(countdownTimer); showNotice("計時器時間到"); systemNotification("計時器", "計時器時間到"); document.title = "⏰ 計時器時間到"; setTimeout(()=>document.title="Apple OS Simulator V4",5000); }
      }, 1000);
    });
  }
};
