const fileCacheName = "file-v1";
const dataCacheName = "data-v1";

const filesToCache = [
  "/",
  "/db.js",
  "/favicon.ico",
  "/index.html",
  "/index.js",
  "/manifest.webmanifest",
  "/style.css",
  "/assets/images/icons/icon-182x192.png",
  "/assets/images/icons/icon-512x512.png"
];

self.addEventListener('install', (event) => {
  console.log("hit install");

  event.waitUntil(
    caches
      .open(fileCacheName)
      .then(cache => {
        return cache.addAll(filesToCache);
      })
      .catch(err => console.log('error caching files on install', err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("hit activation");
  event.waitUntil(
    caches
      .keys()
      .then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== fileCacheName && key !== dataCacheName) {
              console.log("deleting cache: ", key);
              return caches.delete(key);
            }
          })
        )
      })
      .catch(err => console.log('activation error: ', err))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  console.log(event);
  if (event.request.url.includes('/api')) {
    return event.respondWith(
      caches
        .open(dataCacheName)
        .then(cache => {
          return fetch(event.request)
            .then(response => {
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }
              return response;
            })
            .catch(() => cache.match(event.request))
        })
        .catch(err => console.log('error fetching api: ', err))
    );
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        return response || fetch(event.response);
      })
      .catch(err => console.log(err))
  );
});