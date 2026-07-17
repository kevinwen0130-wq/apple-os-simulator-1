import { state, saveState } from "../state.js";

export function addNotification({ message, source = "系統", app = null }) {
  const notification = {
    id: crypto.randomUUID(),
    message: String(message),
    source,
    app,
    createdAt: new Date().toISOString()
  };
  state.notifications.unshift(notification);
  state.notifications = state.notifications.slice(0, 50);
  saveState();
  window.dispatchEvent(new CustomEvent("simulator:notifications-changed"));
  return notification;
}

export function removeNotification(id) {
  state.notifications = state.notifications.filter((item) => item.id !== id);
  saveState();
  window.dispatchEvent(new CustomEvent("simulator:notifications-changed"));
}

export function clearNotifications() {
  state.notifications = [];
  saveState();
  window.dispatchEvent(new CustomEvent("simulator:notifications-changed"));
}
