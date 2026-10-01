/* Publicación real del portafolio (solo Administrador): sube archivos y publica textos editados a GitHub. */
(function(){'use strict';
var S=document.currentScript?document.currentScript.src:'',ROOT=S.replace(/assets\/admin-publish\.js.*$/,'');
var rel=location.href.split('#')[0].split('?')[0].replace(ROOT,'');if(!rel||/\/$/.test(rel))rel+='index.html';
var $=function(s,r){return(r||document).querySelector(s)};
var admin=function(){return localStorage.getItem('portfolioRole')==='admin'};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var cfg=function(){try{return JSON.parse(localStorage.getItem('portfolioGh')||'{}')}catch(e){return{}}};
var enc=function(s){return btoa(unescape(encodeURIComponent(s)))},dec=function(b){return decodeURIComponent(escape(atob(b.replace(/\s/g,''))))};
var clean=function(n){return n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9._-]+/g,'_')};
var folderOf=function(n){var e=n.split('.').pop().toLowerCase();return e==='sql'?'scripts':/^(png|jpe?g|gif|webp)$/.test(e)?'infografias':'documentos'};
function gh(method,path,body){var c=cfg();if(!c.owner||!c.repo||!c.token)return Promise.reject(new Error('Completa la conexión con GitHub.'));
 var url='https://api.github.com/repos/'+c.owner+'/'+c.repo+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+(method==='GET'?'?ref='+encodeURIComponent(c.branch||'main'):'');
 return fetch(url,{method:method,headers:{Authorization:'Bearer '+c.token,Accept:'application/vnd.github+json'},body:body?JSON.stringify(body):undefined}).then(function(r){
  if(method==='GET'&&r.status===404)return null;
  if(!r.ok)return r.json().catch(function(){return{}}).then(function(j){throw new Error('GitHub '+r.status+': '+(j.message||'error'))});
  return r.json()})}
function put(path,b64,msg){return gh('GET',path).then(function(cur){var b={message:msg,content:b64,branch:cfg().branch||'main'};if(cur)b.sha=cur.sha;return gh('PUT',path,b)})}
function getData(){return gh('GET','assets/site-content.json').then(function(r){return r?JSON.parse(dec(r.content)):{}})}
function putData(d){return put('assets/site-content.json',enc(JSON.stringify(d,null,1)),'Actualizar contenido del portafolio')}
function b64(f){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(String(r.result).split(',')[1])};r.onerror=no;r.readAsDataURL(f)})}

/* ---------- Lo que ven todos los visitantes ---------- */
function card(u){var im=/\.(png|jpe?g|gif|webp)$/i.test(u.name),href=ROOT+u.path;
 return '<article class="doc-card">'+(im?'<a href="'+href+'" target="_blank" rel="noopener"><img src="'+href+'" alt="'+esc(u.title)+'" style="width:100%;border-radius:10px;margin-bottom:12px"></a>':'')+'<h3>'+esc(u.title)+'</h3><p>'+esc(u.name)+'</p><div class="doc-btns"><a class="doc-btn" href="'+href+'" target="_blank" rel="noopener">Ver</a><a class="doc-btn gold" href="'+href+'" download>⬇ Descargar</a></div></article>'}
function show(d){
 var m=(d.edits||{})[rel];
 if(m&&window.__ce&&!admin())window.__ce.editableElements().forEach(function(el){var k=window.__ce.keyFor(el);if(k in m)el.innerHTML=m[k]});
 var all=d.uploads||[],mine=/documentos\/index\.html$/.test(rel)?all:all.filter(function(u){return rel===u.week+'/index.html'});
 var host=$('.unit-page-inner')||$('main');
 if(mine.length&&host&&!$('#archivos-subidos')){var l=document.createElement('link');l.rel='stylesheet';l.href=ROOT+'assets/documentos.css';document.head.appendChild(l);
  var s=document.createElement('section');s.className='doc-panel';s.id='archivos-subidos';
  s.innerHTML='<div class="doc-head"><div class="doc-kicker">Archivos añadidos</div><h2>Material subido</h2></div><div class="doc-grid">'+mine.map(card).join('')+'</div>';host.appendChild(s)}}
setTimeout(function(){fetch(ROOT+'assets/site-content.json?'+Date.now()).then(function(r){return r.ok?r.json():{}}).then(show).catch(function(){})},350);

/* ---------- Panel de administrador ---------- */
var say=function(t,bad){var e=$('#apMsg');if(e){e.textContent=t;e.style.color=bad?'#ff9a9a':'#9be8ff'}};
function mount(){if($('#apBtn'))return;
 var st=document.createElement('style');st.id='apStyle';st.textContent='#apBtn{position:fixed;left:16px;bottom:16px;z-index:99998;padding:11px 16px;border-radius:10px;border:1px solid #ffe18a;background:#0a1620;color:#ffe18a;font:600 14px Montserrat,sans-serif;cursor:pointer;box-shadow:0 8px 30px rgba(0,0,0,.5)}#apBox{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;padding:14px}#apBox.on{display:flex}#apCard{width:min(520px,100%);max-height:92vh;overflow:auto;padding:22px;border:1px solid rgba(255,225,138,.5);border-radius:14px;background:#07131c;color:#e9edf0;font:500 14px Montserrat,sans-serif}#apCard h3{margin:0 0 4px;font:700 18px Cormorant Garamond,serif;color:#ffe18a}#apCard h4{margin:18px 0 8px;font:700 14px Cormorant Garamond,serif;color:#9be8ff}#apCard label{display:block;margin:8px 0 3px;color:#9fb2c0;font-size:12.5px}#apCard input,#apCard select{width:100%;padding:9px;border-radius:8px;border:1px solid rgba(53,207,255,.35);background:#020711;color:#fff;font:inherit}#apCard .r{display:flex;gap:8px}#apCard button{margin-top:12px;padding:10px 14px;border-radius:9px;border:1px solid rgba(255,225,138,.5);background:rgba(255,225,138,.1);color:#ffe18a;font:600 13.5px Montserrat,sans-serif;cursor:pointer}#apCard small{display:block;margin-top:8px;color:#7f93a1;line-height:1.5}#apMsg{margin-top:12px;min-height:20px}';
 document.head.appendChild(st);
 var b=document.createElement('button');b.id='apBtn';b.textContent='⬆ Publicar / Subir';document.body.appendChild(b);
 var m=document.createElement('div');m.id='apBox';var c=cfg(),mm=rel.match(/unidad-(\d)\/semana-(\d)/);
 var opts=function(sel){return[1,2,3,4].map(function(n){return'<option value="'+n+'"'+(sel==n?' selected':'')+'>'+n+'</option>'}).join('')};
 m.innerHTML='<div id="apCard"><h3>Publicar en el portafolio</h3><small>Solo administrador. Lo que publiques lo verán todos los visitantes en 1–2 minutos.</small>'
 +'<h4>1 · Conexión con GitHub</h4><div class="r"><div><label>Usuario</label><input id="apO" value="'+esc(c.owner||'')+'"></div><div><label>Repositorio</label><input id="apR" value="'+esc(c.repo||'')+'"></div><div><label>Rama</label><input id="apB" value="'+esc(c.branch||'main')+'"></div></div><label>Token (fine-grained, permiso Contents: Read and write)</label><input id="apT" type="password" value="'+esc(c.token||'')+'"><small>El token se guarda solo en este navegador. Nunca lo compartas.</small>'
 +'<h4>2 · Subir documento, script o imagen</h4><div class="r"><div><label>Unidad</label><select id="apU">'+opts(mm&&mm[1])+'</select></div><div><label>Semana</label><select id="apW">'+opts(mm&&mm[2])+'</select></div></div><label>Título (opcional)</label><input id="apTi"><label>Archivo (máx. 25 MB)</label><input id="apF" type="file"><button id="apUp">⬆ Subir y publicar</button>'
 +'<h4>3 · Publicar textos editados de esta página</h4><small>Primero usa “Editar todo el contenido” y “Guardar cambios”; luego publica aquí.</small><button id="apEd">📝 Publicar textos</button><div id="apMsg"></div><button id="apX">Cerrar</button></div>';
 document.body.appendChild(m);
 b.onclick=function(){m.classList.add('on')};$('#apX').onclick=function(){m.classList.remove('on')};
 function saveCfg(){localStorage.setItem('portfolioGh',JSON.stringify({owner:$('#apO').value.trim(),repo:$('#apR').value.trim(),branch:$('#apB').value.trim()||'main',token:$('#apT').value.trim()}))}
 var fail=function(e){say('❌ '+e.message,1)};
 $('#apUp').onclick=function(){saveCfg();var f=$('#apF').files[0];if(!f)return say('Elige un archivo.',1);if(f.size>25e6)return say('El archivo pesa más de 25 MB.',1);
  var name=clean(f.name),folder=folderOf(name),week='unidades/unidad-'+$('#apU').value+'/semana-'+$('#apW').value,path=week+'/'+folder+'/'+name;say('Subiendo…');
  b64(f).then(function(x){return put(path,x,'Subir '+name)}).then(getData).then(function(d){d.uploads=(d.uploads||[]).filter(function(u){return u.path!==path});
   d.uploads.push({week:week,path:path,name:name,folder:folder,title:$('#apTi').value.trim()||name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ')});return putData(d)})
  .then(function(){say('✅ Publicado en '+path+'. Aparecerá en la semana y en el Centro de documentos en 1–2 min.')}).catch(fail)};
 $('#apEd').onclick=function(){saveCfg();var k='portfolioContentEdits:'+location.pathname.replace(/\\/g,'/'),e={};try{e=JSON.parse(localStorage.getItem(k)||'{}')}catch(x){}
  if(!Object.keys(e).length)return say('No hay textos guardados en esta página.',1);say('Publicando…');
  getData().then(function(d){(d.edits=d.edits||{})[rel]=e;return putData(d)}).then(function(){say('✅ Textos publicados. Los verán todos en 1–2 min.')}).catch(fail)}}
function unmount(){['apBtn','apBox','apStyle'].forEach(function(i){var e=document.getElementById(i);if(e)e.remove()})}
setInterval(function(){if(admin())mount();else unmount()},1500);
})();
