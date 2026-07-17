import { state, saveState } from "../state.js";
import { $, bind, openApp, showNotice } from "../ui.js";
import { getLocation } from "../device.js";

const weatherText = {
  0: ["晴朗", "☀️"], 1: ["大致晴朗", "🌤️"], 2: ["局部多雲", "⛅"],
  3: ["陰天", "☁️"], 45: ["有霧", "🌫️"], 48: ["霧淞", "🌫️"],
  51: ["毛毛雨", "🌦️"], 53: ["毛毛雨", "🌦️"], 55: ["較強毛毛雨", "🌧️"],
  61: ["小雨", "🌧️"], 63: ["中雨", "🌧️"], 65: ["大雨", "🌧️"],
  71: ["小雪", "🌨️"], 73: ["中雪", "🌨️"], 75: ["大雪", "❄️"],
  80: ["陣雨", "🌦️"], 81: ["陣雨", "🌧️"], 82: ["強陣雨", "⛈️"], 95: ["雷雨", "⛈️"]
};

const condition = (code) => weatherText[code] || ["天氣狀況", "🌤️"];
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

async function fetchForecast(latitude, longitude, name) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude, longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily: "sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
    timezone: "auto", forecast_days: "7"
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error("天氣服務暫時無法使用");
  const data = await response.json();
  const result = { name, data, updatedAt: new Date().toISOString() };
  state.weatherCache = result;
  saveState();
  return result;
}

function renderForecast(result) {
  const { name, data } = result;
  const [description, icon] = condition(data.current.weather_code);
  const nowIndex = Math.max(0, data.hourly.time.findIndex((time) => new Date(time) >= new Date()));
  const hours = data.hourly.time.slice(nowIndex, nowIndex + 8);
  $("weatherContent").innerHTML = `
    <section class="weather-hero">
      <small>${escapeHTML(name)}</small>
      <span class="weather-symbol">${icon}</span>
      <strong>${Math.round(data.current.temperature_2m)}°</strong>
      <b>${description}</b>
      <p>最高 ${Math.round(data.daily.temperature_2m_max[0])}°　最低 ${Math.round(data.daily.temperature_2m_min[0])}°</p>
    </section>
    <section class="weather-card">
      <h3>每小時預報</h3>
      <div class="hourly-forecast">${hours.map((time, offset) => {
        const index = nowIndex + offset;
        return `<div><small>${offset ? new Date(time).toLocaleTimeString("zh-TW", { hour: "numeric" }) : "現在"}</small><span>${condition(data.hourly.weather_code[index])[1]}</span><b>${Math.round(data.hourly.temperature_2m[index])}°</b><em>${data.hourly.precipitation_probability[index] || 0}%</em></div>`;
      }).join("")}</div>
    </section>
    <section class="weather-card forecast-list">
      <h3>7 日預報</h3>
      ${data.daily.time.map((day, index) => `<div class="forecast-day">
        <span class="forecast-name">${index ? new Date(day).toLocaleDateString("zh-TW", { weekday: "short" }) : "今天"}</span>
        <span class="forecast-condition">${condition(data.daily.weather_code[index])[1]} <small>${data.daily.precipitation_probability_max[index] || 0}%</small></span>
        <span class="forecast-range"><small>${Math.round(data.daily.temperature_2m_min[index])}°</small><i></i><b>${Math.round(data.daily.temperature_2m_max[index])}°</b></span>
      </div>`).join("")}
    </section>
    <section class="weather-details">
      <div><small>體感溫度</small><b>${Math.round(data.current.apparent_temperature)}°</b></div>
      <div><small>濕度</small><b>${data.current.relative_humidity_2m}%</b></div>
      <div><small>風速</small><b>${Math.round(data.current.wind_speed_10m)} km/h</b></div>
      <div><small>降雨量</small><b>${data.current.precipitation} mm</b></div>
      <div><small>日出</small><b>${new Date(data.daily.sunrise[0]).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</b></div>
      <div><small>日落</small><b>${new Date(data.daily.sunset[0]).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}</b></div>
    </section>`;
  $("weatherStatus").textContent = `更新於 ${new Date(result.updatedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}`;
}

async function useCurrentLocation() {
  $("weatherStatus").textContent = "正在取得目前位置…";
  try {
    const { latitude, longitude } = await getLocation({ fresh: true });
    renderForecast(await fetchForecast(latitude, longitude, "目前位置"));
  } catch (error) {
    $("weatherStatus").textContent = error.message || "無法取得目前位置";
  }
}

async function searchCity() {
  const query = $("weatherSearch").value.trim();
  if (!query) return;
  $("weatherStatus").textContent = `正在搜尋「${query}」…`;
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=zh&format=json`);
    const data = await response.json();
    if (!data.results?.length) throw new Error("找不到這個城市");
    const place = data.results[0];
    renderForecast(await fetchForecast(place.latitude, place.longitude, `${place.name}${place.admin1 ? `・${place.admin1}` : ""}`));
  } catch (error) {
    $("weatherStatus").textContent = error.message || "搜尋失敗";
  }
}

export const weatherApp = {
  title: "天氣",
  open() {
    openApp(this.title, `
      <div class="weather-app">
        <div class="weather-searchbar"><input id="weatherSearch" placeholder="搜尋城市，例如：臺北"><button id="searchWeather">搜尋</button><button id="locateWeather" title="目前位置">⌖</button></div>
        <div id="weatherContent" class="weather-placeholder">🌤️<small>搜尋城市或使用目前位置</small></div>
        <p id="weatherStatus">需要網路才能取得即時天氣</p>
      </div>`);
    bind($("searchWeather"), searchCity);
    bind($("locateWeather"), useCurrentLocation);
    $("weatherSearch").addEventListener("keydown", (event) => {
      if (event.key === "Enter") searchCity();
    });
    if (state.weatherCache?.data) renderForecast(state.weatherCache);
  }
};
