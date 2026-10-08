const C='cuaderno-v3';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.hostname.includes('generativelanguage'))return;
e.respondWith(fetch(r,{cache:'no-cache'}).then(n=>{const k=n.clone();caches.open(C).then(c=>c.put(r,k)).catch(()=>{});return n}).catch(()=>caches.match(r)))});
