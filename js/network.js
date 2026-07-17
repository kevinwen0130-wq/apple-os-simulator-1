export async function fetchJSON(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`網路服務回應 ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("連線逾時，請稍後再試");
    if (!navigator.onLine) throw new Error("目前沒有網路連線");
    throw error;
  } finally { clearTimeout(timer); }
}

export function initNetworkStatus() {
  const banner = document.getElementById("networkBanner");
  const update = () => {
    document.body.classList.toggle("is-offline", !navigator.onLine);
    if (banner) {
      banner.textContent = navigator.onLine ? "已恢復網路連線" : "目前離線，部分 App 將使用快取資料";
      banner.classList.add("show");
      clearTimeout(update.timer);
      update.timer = setTimeout(() => banner.classList.remove("show"), navigator.onLine ? 1800 : 3500);
    }
    window.dispatchEvent(new CustomEvent("simulator:network-state", { detail: { online: navigator.onLine } }));
  };
  addEventListener("online", update);
  addEventListener("offline", update);
  if (!navigator.onLine) update();
}

export async function requestNotifications() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

export function systemNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, { body, icon: "icons/app-icon.svg", tag: "apple-os-simulator" });
    setTimeout(() => notification.close(), 8000);
  }
}
