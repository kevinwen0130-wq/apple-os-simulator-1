const defaults = {
  locked: true,
  volume: 55,
  conversations: null,
  photos: [],
  deletedPhotos: [],
  recentCalls: [],
  contacts: [],
  safariHistory: [],
  safariBookmarks: [],
  mail: null,
  notes: [],
  reminders: [],
  calendarEvents: [],
  files: [],
  alarms: [],
  health: { steps: 6428, heartRate: 78, sleep: 7.3, water: 4 },
  walletCards: [],
  installedApps: [],
  notifications: [],
  recentApps: [],
  activeApp: null,
  weatherCache: null,
  location: null,
  appearance: "light",
  simulatorBrightness: 100,
  musicPlaying: false,
  musicTrack: 0,
  musicProgress: 22,
  musicTitle: "尚未選擇歌曲",
  musicArtist: "搜尋歌曲開始播放",
  wifi: true,
  bluetooth: true,
  airplaneMode: false,
  watchView: "face"
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem("apple-simulator-state") || "{}");
    return {
      ...defaults,
      ...stored,
      photos: Array.isArray(stored.photos)
        ? stored.photos.filter((photo) => photo && typeof photo === "object" && photo.src)
        : [],
      notifications: Array.isArray(stored.notifications) ? stored.notifications : [],
      recentApps: Array.isArray(stored.recentApps) ? stored.recentApps : []
    };
  } catch {
    return { ...defaults };
  }
}

export const state = loadState();
export const saveState = () => localStorage.setItem("apple-simulator-state", JSON.stringify(state));
export function resetState() {
  localStorage.removeItem("apple-simulator-state");
  location.reload();
}
