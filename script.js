const $=(s,e=document)=>e.querySelector(s),K='cuaderno.v1',COL=['#8b5a3c','#5f7f9c','#e8a0bf','#7f9a74','#d6a032','#7d5a85'];
let S=JSON.parse(localStorage.getItem(K)||'null')||{nb:[],hb:[],ev:[],chat:[],cfg:{name:'',key:'',model:'gemini-3.8-flash'}};
if(S.cfg.model=='gemini-2.5-flash')S.cfg.model='gemini-3.8-flash';
const save=()=>localStorage.setItem(K,JSON.stringify(S)),uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,today=()=>iso(new Date());
const fd=(s,o={day:'numeric',month:'short'})=>new Intl.DateTimeFormat('es',o).format(new Date(s+'T12:00'));
const md=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/`(.+?)`/g,'<code>$1</code>').replace(/^[-*] /gm,'• ').replace(/\n/g,'<br>');
const ui={nb:null,q:'',wk:0,mo:new Date(),sel:today(),pop:'',busy:false,att:[]};
const R=['inicio','cuadernos','habitos','calendario','asistente','ajustes'];
const nbOf=id=>S.nb.find(b=>b.id==id);
/* archivos: se guardan en IndexedDB (LocalStorage es muy pequeño) */
const DB=new Promise(r=>{const q=indexedDB.open('cuaderno-files',1);q.onupgradeneeded=()=>q.result.createObjectStore('f');q.onsuccess=()=>r(q.result)});
const idb=async(m,fn)=>{const db=await DB;return new Promise((res,rej)=>{const t=db.transaction('f',m),q=fn(t.objectStore('f'));t.oncomplete=()=>res(q.result);t.onerror=()=>rej(t.error)})};
const putF=(id,b)=>idb('readwrite',s=>s.put(b,id)),getF=id=>idb('readonly',s=>s.get(id)),delF=id=>idb('readwrite',s=>s.delete(id)),allK=()=>idb('readonly',s=>s.getAllKeys());
const b64=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(b)});
const fileIn=(fs=[])=>`<label class="l">archivos adjuntos (imágenes, PDF o texto; máx. 10 MB)</label><input type="file" name="fl" multiple>${fs.map(m=>`<div class="g"><a href="#" data-dl="${m.id}">${esc(m.name)}</a> <label><input type="checkbox" name="rm" value="${m.id}" style="width:auto"> quitar</label></div>`).join('')}`;
async function addFiles(x,d){x.files=(x.files||[]).filter(m=>{if(d.getAll('rm').includes(m.id)){delF(m.id);return false}return true});for(const f of d.getAll('fl')){if(!f.size)continue;if(f.size>1e7){alert(f.name+' pesa más de 10 MB');continue}const id=uid();await putF(id,f);x.files.push({id,name:f.name,type:f.type,size:f.size})}}
async function fpart(b,n,t){const ty=t||b.type||'';if(/^(image\/|application\/pdf)/.test(ty))return[{text:`[adjunto: ${n}]`},{inlineData:{mimeType:ty,data:await b64(b)}}];if(/^text\/|json/.test(ty)||/\.(md|txt|csv)$/i.test(n))return[{text:`[adjunto: ${n}]\n`+(await b.text()).slice(0,50000)}];return[]}
async function exportAll(){const files={};for(const k of await allK()){const b=await getF(k);files[k]={t:b.type,d:await b64(b)}}
 const f=new File([JSON.stringify({...S,cfg:{...S.cfg,key:''},files})],'cuaderno-respaldo-'+today()+'.json',{type:'application/json'});
 if(navigator.canShare?.({files:[f]})){try{await navigator.share({files:[f]});return}catch(e){if(e.name=='AbortError')return}}
 const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=f.name;a.click()}
async function importAll(file){const j=JSON.parse(await file.text());if(!j.nb||!j.hb||!j.ev)throw 0;if(!confirm('Esto reemplazará tus datos actuales. ¿Continuar?'))return;
 const files=j.files||{};delete j.files;j.cfg={...j.cfg,key:S.cfg.key};for(const k in files)await putF(k,await(await fetch(`data:${files[k].t||'application/octet-stream'};base64,${files[k].d}`)).blob());S=j;save();render()}
const BOLT='<svg viewBox="0 0 40 56"><path d="M24 2 4 32h14l-4 22 22-32H22z" fill="#3b82f6" stroke="#171717" stroke-width="2.5" stroke-linejoin="round"/></svg>';
const HEART='<svg viewBox="0 0 40 40"><path d="M20 37C3 25 4 9 14 8c4 0 6 3 6 5 0-2 2-5 6-5 10 1 11 17-6 29z" fill="#ff6f1e" stroke="#171717" stroke-width="2.5" stroke-linejoin="round"/><circle cx="14" cy="18" r="2" fill="#171717"/><circle cx="25" cy="18" r="2" fill="#171717"/></svg>';
const NBK='<svg class="nbk" viewBox="0 0 200 260"><rect x="10" y="10" width="180" height="240" rx="14" fill="#8b5a3c" stroke="#171717" stroke-width="3"/><rect x="10" y="10" width="28" height="240" rx="12" fill="#6e452b" stroke="#171717" stroke-width="3"/><rect x="62" y="130" width="104" height="80" rx="8" fill="#fff" stroke="#171717" stroke-width="2"/><path d="M74 154h60M74 174h40" stroke="#171717" stroke-width="2" stroke-linecap="round"/></svg>';
const pr=p=>`<span class="pr" title="prioridad ${['','baja','media','alta'][p]}">${[1,2,3].map(n=>`<b class="${n<=p?'f':''}" style="height:${5+n*4}px"></b>`).join('')}</span>`;
const evRow=e=>{const b=nbOf(e.nb);return`<div class="card ev" style="--c:${b?b.c:'#bbb'}" data-a="ev" data-id="${e.id}"><div><h3>${esc(e.t)}</h3><small>${b?esc(b.name):'sin materia'} · ${fd(e.d,{weekday:'short',day:'numeric',month:'short'})}</small></div>${pr(e.p)}</div>`};
const upcoming=()=>S.ev.filter(e=>e.d>=today()).sort((a,b)=>a.d.localeCompare(b.d));
const empty=(t,b)=>`<div class="empty"><p>${t}</p>${b||''}</div>`;
const streak=h=>{let d=new Date(),n=0;if(!h.log[iso(d)])d.setDate(d.getDate()-1);while(h.log[iso(d)]){n++;d.setDate(d.getDate()-1)}return n};

/* diálogo reutilizable */
const D=$('#dlg');
function dlg(title,body,ok,del){D.innerHTML=`<form><h2>${title}</h2>${body}<div class="row"><button class="btn pri">guardar</button><button type="button" class="btn" data-x="no">cancelar</button>${del?'<button type="button" class="btn" data-x="del">eliminar</button>':''}</div></form>`;
 const f=$('form',D);f.onsubmit=async e=>{e.preventDefault();const d=new FormData(f);await ok(Object.fromEntries(d),d);save();D.close();render()};
 f.onclick=e=>{const x=e.target.dataset.x;if(x=='no')D.close();if(x=='del'&&confirm('¿Eliminar? No se puede deshacer.')){del();save();D.close();render()}};D.showModal()}
const inp=(n,l,v='',t='text',x='')=>`<label class="l">${l}</label><input name="${n}" type="${t}" value="${esc(v)}" ${x}>`;
const sw=v=>`<label class="l">color</label><div>${COL.map(c=>`<label class="sw"><input type="radio" name="c" value="${c}" ${c==v?'checked':''}><i style="background:${c}"></i></label>`).join('')}</div>`;

const V={
inicio(){const up=upcoming(),wk=up.filter(e=>(new Date(e.d)-new Date(today()))/864e5<7).length,done=S.hb.filter(h=>h.log[today()]).length,best=Math.max(0,...S.hb.map(streak)),n=S.cfg.name;
 const notes=S.nb.reduce((a,b)=>a+b.notes.length,0),nx=up[0];
 const Q=[['cuadernos',`${S.nb.length} cuadernos`,`${notes} notas`],['habitos','hábitos',`${done}/${S.hb.length} hoy`],['calendario','fechas',nx?`${esc(nx.t)}, ${fd(nx.d)}`:'nada pendiente'],['asistente','asistente','pregunta a tus apuntes']];
 return`<div class="hero"><div style="--i:0"><div class="stk">${BOLT}</div><h1>hola${n?', '+esc(n):''}.</h1><p class="cap">esto es lo que viene</p>
 <p>${wk?`tienes <span class="mk">${wk}</span> ${wk>1?'evaluaciones':'evaluación'} esta semana.`:'no tienes evaluaciones esta semana.'} llevas ${done} de ${S.hb.length} hábitos hoy.</p>
 <div class="row"><a class="btn pri" href="#/asistente">preguntar a mis apuntes</a><a class="btn" href="#/cuadernos">abrir cuadernos</a></div></div>
 <div class="art" style="--i:1">${NBK}<span class="b">${BOLT}</span><span class="h">${HEART}</span></div></div>
 <div class="grid" style="margin-top:24px">${Q.map((q,i)=>`<a class="card" style="--i:${i+2}" href="#/${q[0]}"><h3>${q[1]}</h3><small>${q[2]}</small></a>`).join('')}</div>
 <h2 style="margin-top:32px">próximos eventos</h2>${up.length?`<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${up.slice(0,4).map(evRow).join('')}</div>`:empty('aún no hay fechas. agrega tu primer examen.','<div class="row"><a class="btn" href="#/calendario">ir al calendario</a></div>')}
 <div class="band">un día a la vez.${best?` tu mejor racha va en ${best} ${best>1?'días':'día'}.`:''}</div>`},

cuadernos(){const q=norm(ui.q.trim()),b=nbOf(ui.nb);
 if(b)return`<a class="g" href="#/cuadernos" data-a="back">← cuadernos</a><h2>${esc(b.name)}</h2><div class="row"><button class="btn pri" data-a="newnote" data-id="${b.id}">nueva nota</button><button class="btn" data-a="editnb" data-id="${b.id}">editar cuaderno</button></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${b.notes.map(x=>`<div class="card" data-a="note" data-id="${b.id}:${x.id}"><h3>${esc(x.t)}</h3><p>${esc(x.b.slice(0,140))}</p>${x.files?.length?`<small>${x.files.length} adjunto${x.files.length>1?'s':''}</small>`:''}</div>`).join('')||empty('este cuaderno está vacío. escribe tu primera nota.')}</div>`;
 let res='';if(q){const t=q.split(/\s+/);res=S.nb.flatMap(b=>b.notes.map(x=>({b,x,s:t.reduce((a,w)=>a+(norm(x.t).includes(w)?3:0)+(norm(x.b).includes(w)?1:0),0)}))).filter(r=>r.s).sort((a,b)=>b.s-a.s)
  .map(r=>{const i=Math.max(0,norm(r.x.b).indexOf(t[0])-30),sn=esc(r.x.b.slice(i,i+120));return`<div class="card" style="margin-bottom:10px" data-a="note" data-id="${r.b.id}:${r.x.id}"><small>${esc(r.b.name)}</small><h3>${esc(r.x.t)}</h3><p>…${sn}…</p></div>`}).join('')||empty('no encontré nada con esas palabras.')}
 return`<h2>cuadernos</h2><input id="q" type="search" placeholder="buscar en todas mis notas" value="${esc(ui.q)}">
 ${q?`<div style="margin-top:16px">${res}</div>`:`<div class="row"><button class="btn pri" data-a="newnb">nuevo cuaderno</button></div>${S.nb.length?`<div class="covers">${S.nb.map((b,i)=>`<button class="cover" data-a="opennb" data-id="${b.id}" style="--c:${b.c};--r:${i%2?1.5:-1.5}deg"><span class="lab"><b>${esc(b.name)}</b><small>${b.notes.length} notas</small></span></button>`).join('')}</div>`:empty('crea un cuaderno por materia y guarda tus apuntes.')}`}`},

habitos(){const m=new Date();m.setDate(m.getDate()-((m.getDay()+6)%7)+ui.wk*7);const ds=[...Array(7)].map((_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d});
 return`<h2>hábitos</h2><div class="row"><button class="btn pri" data-a="newhb">nuevo hábito</button><button class="btn" data-a="wk" data-id="-1">‹</button><span class="g">${fd(iso(ds[0]))} – ${fd(iso(ds[6]))}</span><button class="btn" data-a="wk" data-id="1">›</button></div>
 ${S.hb.map(h=>{const n=ds.filter(d=>h.log[iso(d)]).length,s=streak(h);return`<div class="card hb"><header><h3 data-a="edithb" data-id="${h.id}" style="cursor:pointer">${esc(h.name)}</h3><span class="tag">racha ${s} ${s==1?'día':'días'}</span></header>
 <div class="days">${ds.map((d,i)=>{const k=iso(d);return`<label class="day ${k==today()?'t':''} ${ui.pop==h.id+k?'pop':''}">${'LMXJVSD'[i]}<input type="checkbox" data-h="${h.id}" data-d="${k}" ${h.log[k]?'checked':''} ${k>today()?'disabled':''}><span>${d.getDate()}</span></label>`}).join('')}</div>
 <div class="bar"><i style="width:${n/7*100}%"></i></div><small>${n} de 7 esta semana</small></div>`}).join('')||empty('agrega un hábito diario, como leer 20 minutos.')}`},

calendario(){const m=ui.mo,y=m.getFullYear(),mo=m.getMonth(),off=(new Date(y,mo,1).getDay()+6)%7,n=new Date(y,mo+1,0).getDate(),sel=S.ev.filter(e=>e.d==ui.sel);
 return`<h2>${new Intl.DateTimeFormat('es',{month:'long',year:'numeric'}).format(m)}</h2><div class="row"><button class="btn" data-a="mo" data-id="-1">‹</button><button class="btn" data-a="mo" data-id="0">hoy</button><button class="btn" data-a="mo" data-id="1">›</button><button class="btn pri" data-a="newev">nueva fecha</button></div>
 <div class="cal">${'LMXJVSD'.split('').map(l=>`<small>${l}</small>`).join('')}${'<span></span>'.repeat(off)}${[...Array(n)].map((_,i)=>{const k=iso(new Date(y,mo,i+1)),es=S.ev.filter(e=>e.d==k);return`<button data-a="day" data-id="${k}" class="${k==ui.sel?'s':''} ${k==today()?'t':''}">${i+1}<em>${es.slice(0,3).map(e=>`<i style="--c:${nbOf(e.nb)?.c||'#bbb'}"></i>`).join('')}</em></button>`}).join('')}</div>
 <h3 style="margin:20px 0 10px">${fd(ui.sel,{weekday:'long',day:'numeric',month:'long'})}</h3>${sel.map(evRow).join('')||'<p class="g">sin eventos este día.</p>'}`},

asistente(){const ok=S.cfg.key;return`<h2>asistente</h2>${ok?'':empty('pega tu API key de Gemini para activar el chat.','<div class="row"><a class="btn" href="#/ajustes">ir a ajustes</a></div>')}
 <div class="chat">${S.chat.map(m=>`<div class="m ${m.r}">${md(m.t)}${m.fn?.length?`<br><small>adjuntos: ${m.fn.map(esc).join(', ')}</small>`:''}${m.src?.length?`<br><small>fuentes: ${m.src.map(esc).join(' | ')}</small>`:''}</div>`).join('')||(ok?'<p class="g">pregunta algo sobre tus apuntes. por ejemplo: “resume mi cuaderno de historia”.</p>':'')}${ui.att.length?`<small>adjuntos listos: ${ui.att.map(f=>esc(f.name)).join(', ')}</small>`:''}${ui.busy?'<div class="m a dots"><span></span><span></span><span></span></div>':''}</div>
 <form class="ask" id="ask"><label class="btn" for="af">adjuntar</label><input type="file" id="af" multiple hidden><input name="q" placeholder="pregunta sobre tus apuntes" autocomplete="off" required><button class="btn pri">enviar</button></form>`},

ajustes(){const c=S.cfg;return`<h2>ajustes</h2><form id="cfg" style="max-width:480px">${inp('name','tu nombre',c.name)}${inp('key','API key de Gemini',c.key,'password','autocomplete="off"')}<small>consíguela gratis en aistudio.google.com/apikey. se guarda solo en este navegador.</small>
 ${inp('model','modelo',c.model,'text','list="ml"')}<datalist id="ml"><option value="gemini-3.8-flash"></datalist>
 <div class="row"><button class="btn pri">guardar</button><button type="button" class="btn" data-a="clear">borrar chat</button></div></form><h3 style="margin-top:28px">copia de seguridad</h3><p class="g">incluye cuadernos, notas, archivos adjuntos, hábitos, fechas y chat. tu API key no se exporta.</p><div class="row"><button class="btn pri" data-a="exp">exportar o enviar</button><label class="btn">importar<input type="file" accept=".json" id="imp" hidden></label></div>`}};

/* IA: recupera notas relevantes y las manda como contexto */
function ctx(q){const t=norm(q).split(/\W+/).filter(w=>w.length>2),n=S.nb.flatMap(b=>b.notes.map(x=>({b,x,s:t.reduce((a,w)=>a+(norm(x.t+' '+b.name).includes(w)?3:0)+norm(x.b).split(w).length-1,0)}))).sort((a,b)=>b.s-a.s);let len=0;return n.filter(e=>(len+=e.x.b.length)<60000)}
async function ask(q,fs=[]){const c=ctx(q),sys='Eres el asistente de estudio del usuario. Responde en español basándote en sus apuntes. Si la respuesta no está en ellos, dilo y ofrece una respuesta general señalando que no viene de sus notas.\n\nAPUNTES:\n'+(c.map(e=>`[${e.b.name} / ${e.x.t}]\n${e.x.b}`).join('\n\n')||'(sin notas)');
 const ex=[];for(const e of c.filter(e=>e.s>0).slice(0,3))for(const m of e.x.files||[]){const b=await getF(m.id);if(b)ex.push(...await fpart(b,m.name,m.type))}for(const f of fs)ex.push(...await fpart(f,f.name,f.type));const hist=S.chat.slice(-12).map(m=>({role:m.r=='u'?'user':'model',parts:[{text:m.t}]}));hist[hist.length-1].parts.push(...ex.slice(0,12));const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${S.cfg.model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':S.cfg.key},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:hist})}),j=await r.json();
 if(!r.ok)throw Error(j.error?.message||r.status);return{r:'a',t:j.candidates?.[0]?.content?.parts?.map(p=>p.text).join('')||'(sin respuesta)',src:c.filter(e=>e.s>0).slice(0,3).map(e=>e.b.name+': '+e.x.t)}}

/* acciones */
const A={
 back(){ui.nb=null},opennb(id){ui.nb=id},wk(id){ui.wk+=+id},day(id){ui.sel=id},clear(){S.chat=[]},exp(){exportAll()},
 mo(id){ui.mo=id==0?new Date():new Date(ui.mo.getFullYear(),ui.mo.getMonth()+ +id,1)},
 newnb(){dlg('nuevo cuaderno',inp('name','materia','','text','required')+sw(COL[S.nb.length%6]),f=>S.nb.push({id:uid(),name:f.name,c:f.c||COL[0],notes:[]}))},
 editnb(id){const b=nbOf(id);dlg('editar cuaderno',inp('name','materia',b.name,'text','required')+sw(b.c),f=>Object.assign(b,{name:f.name,c:f.c||b.c}),()=>{b.notes.forEach(n=>(n.files||[]).forEach(m=>delF(m.id)));S.nb=S.nb.filter(x=>x!=b);ui.nb=null})},
 newnote(id){const b=nbOf(id);dlg('nueva nota',inp('t','título','','text','required')+`<label class="l">apuntes</label><textarea name="b" required></textarea>`+fileIn(),async(f,d)=>{const x={id:uid(),t:f.t,b:f.b,files:[]};await addFiles(x,d);b.notes.unshift(x)})},
 note(id){const[bi,ni]=id.split(':'),b=nbOf(bi),x=b.notes.find(n=>n.id==ni);dlg('nota',inp('t','título',x.t,'text','required')+`<label class="l">apuntes</label><textarea name="b" required>${esc(x.b)}</textarea>`+fileIn(x.files),async(f,d)=>{Object.assign(x,{t:f.t,b:f.b});await addFiles(x,d)},()=>{(x.files||[]).forEach(m=>delF(m.id));b.notes=b.notes.filter(n=>n!=x)})},
 newhb(){dlg('nuevo hábito',inp('name','nombre','','text','required'),f=>S.hb.push({id:uid(),name:f.name,log:{}}))},
 edithb(id){const h=S.hb.find(x=>x.id==id);dlg('editar hábito',inp('name','nombre',h.name,'text','required'),f=>h.name=f.name,()=>S.hb=S.hb.filter(x=>x!=h))},
 newev(){evForm({d:ui.sel,p:2,nb:S.nb[0]?.id,t:''})},ev(id){evForm(S.ev.find(e=>e.id==id))}
};
function evForm(e){const isNew=!e.id;dlg(isNew?'nueva fecha':'editar fecha',inp('t','examen o entrega',e.t,'text','required')+inp('d','fecha',e.d,'date','required')+
 `<label class="l">materia</label><select name="nb">${S.nb.map(b=>`<option value="${b.id}" ${b.id==e.nb?'selected':''}>${esc(b.name)}</option>`).join('')||'<option value="">crea un cuaderno primero</option>'}</select>
 <label class="l">prioridad</label><div class="seg">${[[1,'baja'],[2,'media'],[3,'alta']].map(([v,l])=>`<label><input type="radio" name="p" value="${v}" ${v==e.p?'checked':''}><span>${l}</span></label>`).join('')}</div>`,
 f=>{const o={t:f.t,d:f.d,nb:f.nb,p:+f.p||2};isNew?S.ev.push({id:uid(),...o}):Object.assign(e,o);ui.sel=f.d},isNew?null:()=>S.ev=S.ev.filter(x=>x!=e))}

/* render y navegación */
function render(){const r=R.includes(location.hash.slice(2))?location.hash.slice(2):'inicio';
 R.forEach(n=>{const s=$('#v-'+n);if(n==r){const was=s.classList.contains('on');s.innerHTML=V[n]();if(!was){s.classList.add('on')}}else s.classList.remove('on')});
 const i=R.indexOf(r);$('.nav').style.setProperty('--i',Math.min(i,4));$('.nav i').style.opacity=i>4?0:1;
 if(r=='asistente'){const a=$('#ask');a.onsubmit=send;$('#af').onchange=e=>{ui.att.push(...[...e.target.files].filter(f=>f.size<=1e7));render()};if(!ui.busy)a.q.focus({preventScroll:true});scrollTo({top:1e5,behavior:'smooth'})}
 if(r=='ajustes'&&S.cfg.key)fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=100',{headers:{'x-goog-api-key':S.cfg.key}}).then(r=>r.json()).then(j=>$('#ml').innerHTML=(j.models||[]).filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>`<option value="${m.name.replace('models/','')}">`).join('')).catch(()=>{});
 if(r=='ajustes')$('#imp').onchange=e=>importAll(e.target.files[0]).catch(()=>alert('Archivo no válido'));if(r=='ajustes')$('#cfg').onsubmit=e=>{e.preventDefault();Object.assign(S.cfg,Object.fromEntries(new FormData(e.target)));save();render();toast()};
 if(r=='cuadernos'&&$('#q'))$('#q').oninput=e=>{ui.q=e.target.value;const p=e.target.selectionStart;render();const q=$('#q');q.focus();q.setSelectionRange(p,p)}}
const toast=()=>{const t=document.createElement('div');t.textContent='guardado';t.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#fdfbf9;border:1.5px solid #171717;border-radius:20px;padding:8px 20px;z-index:9;animation:in .3s';document.body.append(t);setTimeout(()=>t.remove(),1500)};
async function send(e){e.preventDefault();const q=e.target.q.value.trim();if(!q||ui.busy)return;if(!S.cfg.key)return location.hash='#/ajustes';
 const fs=ui.att;ui.att=[];S.chat.push({r:'u',t:q,fn:fs.map(f=>f.name)});ui.busy=true;render();try{S.chat.push(await ask(q,fs))}catch(x){S.chat.push({r:'a',t:'No pude responder: '+x.message+'. Revisa tu API key y el modelo en ajustes.'})}ui.busy=false;S.chat=S.chat.slice(-60);save();render()}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(t&&A[t.dataset.a]){A[t.dataset.a](t.dataset.id);save();render()}});
document.addEventListener('change',e=>{const c=e.target.dataset;if(c.h){const h=S.hb.find(x=>x.id==c.h);e.target.checked?h.log[c.d]=1:delete h.log[c.d];ui.pop=c.h+c.d;save();render()}});
addEventListener('hashchange',()=>{ui.nb=null;ui.q='';scrollTo(0,0);render()});
render();if('serviceWorker'in navigator)(()=>{const had=navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>had&&location.reload());return navigator.serviceWorker.register('sw.js')})().catch(()=>{});

document.addEventListener('click',async e=>{const l=e.target.closest('[data-dl]');if(!l)return;e.preventDefault();const b=await getF(l.dataset.dl);if(b){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=l.textContent;a.click()}});
