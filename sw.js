const CACHE="apple-os-simulator-v5";
const CORE=["./","./index.html","./css/styles.css","./css/ios-polish.css","./css/ios-apps.css","./css/ios-apps-batch2.css","./css/ios-apps-batch3.css","./js/main.js","./js/ui.js","./js/state.js","./icons/app-icon.svg"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match("./index.html"))));});
