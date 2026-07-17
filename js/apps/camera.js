import { state, saveState } from "../state.js";
import { $, bind, openApp, showNotice } from "../ui.js";

let stream = null;
let facingMode = "environment";
let flashEnabled = false;
let zoom = 1;
let mode = "photo";
let recordingStartedAt = 0;
let recordingTimer = null;

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  window.clearInterval(recordingTimer);
}

function setStatus(message) {
  if ($("cameraStatus")) $("cameraStatus").textContent = message;
}

async function startCamera() {
  const video = $("cameraVideo");
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("此瀏覽器不支援相機；請使用 Safari 或 Chrome 的 HTTPS／Live Server 頁面");
    return;
  }
  stopCamera();
  setStatus("正在啟動相機…");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
    video.style.transform = `scale(${zoom})`;
    setStatus(facingMode === "environment" ? "後置相機" : "前置相機");
  } catch (error) {
    setStatus(error?.name === "NotAllowedError"
      ? "相機權限被拒絕，請在瀏覽器網址列旁允許相機"
      : "無法啟動相機，可繼續瀏覽其他 App");
  }
}

function takeSnapshot() {
  const video = $("cameraVideo");
  if (!stream || !video.videoWidth) return showNotice("相機尚未準備完成");
  const canvas = document.createElement("canvas");
  const crop = zoom > 1 ? 1 / zoom : 1;
  const sourceWidth = video.videoWidth * crop;
  const sourceHeight = video.videoHeight * crop;
  const sourceX = (video.videoWidth - sourceWidth) / 2;
  const sourceY = (video.videoHeight - sourceHeight) / 2;
  const scale = Math.min(1, 1200 / sourceWidth);
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  const context = canvas.getContext("2d");
  if (facingMode === "user") {
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  $("cameraFlash").classList.add("active");
  window.setTimeout(() => $("cameraFlash")?.classList.remove("active"), flashEnabled ? 240 : 100);
  const photo = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    src: canvas.toDataURL("image/jpeg", 0.82),
    createdAt: new Date().toISOString(),
    favorite: false,
    width: canvas.width,
    height: canvas.height,
    camera: facingMode,
    mode
  };
  state.photos.unshift(photo);
  state.photos = state.photos.slice(0, 30);
  try {
    saveState();
  } catch {
    state.photos.shift();
    return showNotice("照片太多，請先到照片 App 刪除部分照片");
  }
  $("lastPhoto").src = photo.src;
  $("lastPhoto").hidden = false;
  $("openLastPhoto").disabled = false;
  $("shutter").classList.add("pressed");
  window.setTimeout(() => $("shutter")?.classList.remove("pressed"), 160);
  showNotice(mode === "portrait" ? "人像照片已儲存到照片 App" : "照片已儲存到照片 App");
}

function toggleVideoSimulation() {
  const shutter = $("shutter");
  if (!shutter.classList.contains("recording")) {
    if (!stream) return showNotice("相機尚未準備完成");
    shutter.classList.add("recording");
    recordingStartedAt = Date.now();
    setStatus("錄影中 00:00");
    recordingTimer = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - recordingStartedAt) / 1000);
      setStatus(`錄影中 ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`);
    }, 500);
  } else {
    shutter.classList.remove("recording");
    window.clearInterval(recordingTimer);
    setStatus("影片模式目前為互動示範，尚未儲存影片");
    showNotice("錄影已停止（示範模式）");
  }
}

function selectMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll("[data-camera-mode]").forEach((button) => button.classList.toggle("selected", button.dataset.cameraMode === mode));
  $("shutter").classList.toggle("video-shutter", mode === "video");
  setStatus(mode === "video" ? "影片模式" : mode === "portrait" ? "人像模式" : "照片模式");
}

export const cameraApp = {
  title: "相機",
  open() {
    const lastPhoto = state.photos[0]?.src || "";
    openApp(this.title, `
      <div class="camera-shell">
        <div class="camera-preview">
          <video id="cameraVideo" playsinline muted></video>
          <div class="camera-gridlines"></div>
          <div class="camera-focus" id="cameraFocus"></div>
          <div class="camera-flash" id="cameraFlash"></div>
          <div class="camera-status" id="cameraStatus">正在啟動相機…</div>
        </div>
        <div class="camera-tools">
          <button id="toggleFlash" class="${flashEnabled ? "selected" : ""}">${flashEnabled ? "⚡ 開" : "⚡ 關"}</button>
          <div class="zoom-options"><button data-zoom="1" class="${zoom === 1 ? "selected" : ""}">1×</button><button data-zoom="2" class="${zoom === 2 ? "selected" : ""}">2×</button><button data-zoom="3" class="${zoom === 3 ? "selected" : ""}">3×</button></div>
          <button id="flipCamera">↻</button>
        </div>
        <div class="camera-modes"><button data-camera-mode="video">影片</button><button data-camera-mode="photo">照片</button><button data-camera-mode="portrait">人像</button></div>
        <div class="camera-bottom">
          <button id="openLastPhoto" class="last-photo" ${lastPhoto ? "" : "disabled"}><img id="lastPhoto" src="${lastPhoto}" alt="最近照片" ${lastPhoto ? "" : "hidden"}></button>
          <button id="shutter" class="shutter" aria-label="快門"><span></span></button>
          <span class="camera-spacer"></span>
        </div>
      </div>`);
    bind($("shutter"), () => mode === "video" ? toggleVideoSimulation() : takeSnapshot());
    bind($("toggleFlash"), () => {
      flashEnabled = !flashEnabled;
      $("toggleFlash").textContent = flashEnabled ? "⚡ 開" : "⚡ 關";
      $("toggleFlash").classList.toggle("selected", flashEnabled);
    });
    bind($("flipCamera"), async () => {
      facingMode = facingMode === "environment" ? "user" : "environment";
      await startCamera();
    });
    document.querySelectorAll("[data-zoom]").forEach((button) => bind(button, () => {
      zoom = Number(button.dataset.zoom);
      $("cameraVideo").style.transform = `scale(${zoom})`;
      document.querySelectorAll("[data-zoom]").forEach((item) => item.classList.toggle("selected", item === button));
    }));
    document.querySelectorAll("[data-camera-mode]").forEach((button) => bind(button, () => selectMode(button.dataset.cameraMode)));
    $("cameraPreview");
    bind(document.querySelector(".camera-preview"), (event) => {
      const focus = $("cameraFocus");
      const bounds = event.currentTarget.getBoundingClientRect();
      focus.style.left = `${event.clientX - bounds.left}px`;
      focus.style.top = `${event.clientY - bounds.top}px`;
      focus.classList.remove("show");
      requestAnimationFrame(() => focus.classList.add("show"));
    });
    bind($("openLastPhoto"), async () => {
      stopCamera();
      const { photosApp } = await import("./photos.js");
      photosApp.openPhoto(0);
    });
    selectMode(mode);
    startCamera();
  }
};

window.addEventListener("simulator:close-app", stopCamera);
window.addEventListener("simulator:app-restored", () => {
  if ($("cameraVideo")) startCamera();
});
