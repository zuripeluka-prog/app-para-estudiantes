const C='cuaderno-v2',A=['./','index.html','styles.css','script.js','icon.svg','manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.hostname.includes('generativelanguage'))return;
e.respondWith(caches.match(r).then(m=>m||fetch(r).then(n=>{const k=n.clone();caches.open(C).then(c=>c.put(r,k));return n}).catch(()=>m)))});
