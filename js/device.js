import { state, saveState } from "./state.js";

export const deviceInfo = {
  isAndroid: /Android/i.test(navigator.userAgent),
  isIOS: /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
  isSecure: window.isSecureContext,
  hasCamera: Boolean(navigator.mediaDevices?.getUserMedia),
  hasLocation: "geolocation" in navigator,
  hasMotion: "DeviceMotionEvent" in window
};

export function getLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("這個瀏覽器不支援定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy),
        updatedAt: new Date().toISOString()
      };
      state.location = location;
      saveState();
      resolve(location);
    }, (error) => {
      const messages = {
        1: "定位權限被拒絕，請在瀏覽器網站設定中允許位置。",
        2: "目前無法取得位置。",
        3: "取得位置逾時，請再試一次。"
      };
      reject(new Error(messages[error.code] || "定位發生錯誤"));
    }, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: options.fresh ? 0 : 300000
    });
  });
}

export async function requestMotionPermission(onUpdate) {
  if (!deviceInfo.hasMotion) throw new Error("這個裝置不支援動作感測器");
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    const result = await DeviceMotionEvent.requestPermission();
    if (result !== "granted") throw new Error("動作感測器權限未允許");
  }
  window.addEventListener("devicemotion", (event) => {
    onUpdate({
      x: event.accelerationIncludingGravity?.x,
      y: event.accelerationIncludingGravity?.y,
      z: event.accelerationIncludingGravity?.z
    });
  }, { once: true });
}
