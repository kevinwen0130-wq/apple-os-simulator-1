import { messagesApp } from "./messages.js";
import { cameraApp } from "./camera.js";
import { photosApp } from "./photos.js";
import { safariApp } from "./safari.js";
import { phoneApp } from "./phone.js";
import { weatherApp } from "./weather.js";
import { mapsApp } from "./maps.js";
import { settingsApp } from "./settings.js";
import { musicApp } from "./music.js";
import { calculatorApp } from "./calculator.js";
import { mailApp } from "./mail.js";
import { notesApp } from "./notes.js";
import { remindersApp } from "./reminders.js";
import { calendarApp } from "./calendar.js";
import { filesApp } from "./files.js";
import { clockApp } from "./clock.js";
import { healthApp } from "./health.js";
import { walletApp } from "./wallet.js";
import { storeApp } from "./store.js";
import { newsApp } from "./news.js";
import { translateApp } from "./translate.js";
import { simpleApps } from "./simple.js";

export const appRegistry = {
  phone: phoneApp,
  messages: messagesApp,
  camera: cameraApp,
  photos: photosApp,
  safari: safariApp,
  weather: weatherApp,
  maps: mapsApp,
  settings: settingsApp,
  music: musicApp,
  calculator: calculatorApp,
  mail: mailApp,
  notes: notesApp,
  reminders: remindersApp,
  calendar: calendarApp,
  files: filesApp,
  clock: clockApp,
  health: healthApp,
  wallet: walletApp,
  store: storeApp,
  news: newsApp,
  translate: translateApp,
  ...simpleApps
};
