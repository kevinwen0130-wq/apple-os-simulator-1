import { state } from "../state.js";
import { $, bind, openApp } from "../ui.js";
import { deviceInfo, getLocation } from "../device.js";

function mapUrl(destination, directions = false) {
  const encoded = encodeURIComponent(destination);
  if (deviceInfo.isIOS) {
    return directions ? `https://maps.apple.com/?daddr=${encoded}&dirflg=d` : `https://maps.apple.com/?q=${encoded}`;
  }
  return directions
    ? `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

export const mapsApp = {
  title: "地圖",
  open() {
    openApp(this.title, `
      <div class="ios-map-app">
        <div class="ios-map-canvas"><i class="road r1"></i><i class="road r2"></i><i class="road r3"></i><span class="map-water"></span><div class="map-dot">●</div><div class="map-place p1">公園</div><div class="map-place p2">市中心</div><button id="locateMe" class="ios-locate">➤</button></div>
        <section class="ios-map-sheet">
          <div class="sheet-handle"></div><h2>地圖</h2>
          <label class="ios-search"><span>⌕</span><input id="mapQuery" placeholder="搜尋地點或地址"><button id="searchMap">搜尋</button></label>
          <div class="ios-map-location"><span>📍</span><div><b id="mapLocation">目前位置</b><small id="mapAccuracy">點右上方定位按鈕</small></div></div>
          <button id="navigateMap" class="ios-route-button">路線</button>
          <p class="permission-note">導航會開啟裝置上的 ${deviceInfo.isIOS ? "Apple 地圖" : "Google 地圖"}。</p>
        </section>
      </div>`);
    bind($("locateMe"), async () => {
      $("mapLocation").textContent = "定位中…";
      try {
        const location = await getLocation({ fresh: true });
        $("mapLocation").textContent = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
        $("mapAccuracy").textContent = `精確度約 ${location.accuracy} 公尺`;
      } catch (error) {
        $("mapLocation").textContent = error.message;
      }
    });
    bind($("searchMap"), () => {
      const query = $("mapQuery").value.trim();
      if (query) window.open(mapUrl(query), "_blank", "noopener,noreferrer");
    });
    bind($("navigateMap"), () => {
      const query = $("mapQuery").value.trim();
      if (query) window.open(mapUrl(query, true), "_blank", "noopener,noreferrer");
      else if (state.location) window.open(mapUrl(`${state.location.latitude},${state.location.longitude}`), "_blank", "noopener,noreferrer");
      else $("mapLocation").textContent = "請先輸入目的地";
    });
  }
};
