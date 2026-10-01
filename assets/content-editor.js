/*
  Editor integral del portafolio — SOLO ADMINISTRADOR.
  Permite editar/eliminar textos existentes, reemplazar imágenes y añadir
  nuevos textos, imágenes y archivos desde el propio portafolio.
  Los datos originales del HTML no se reescriben: las modificaciones se
  guardan como una capa local del administrador.
*/
(function(){
  'use strict';
  const roleKey='portfolioRole';
  const editModeKey='portfolioEditMode';
  const pageKey=location.pathname.replace(/\\/g,'/');
  const editStore='portfolioContentEdits:'+pageKey;
  const addStore='portfolioAddedContent:'+pageKey;
  const deleteStore='portfolioDeletedContent:'+pageKey;
  const MEDIA_DB='portfolioAddedMediaDB', MEDIA_STORE='files';
  let mediaDB=null, editing=false, snapshot={};

  const isAdmin=()=>localStorage.getItem(roleKey)==='admin';
  const isEditMode=()=>isAdmin() && localStorage.getItem(editModeKey)==='true';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const loadJSON=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'')||f}catch{return f}};
  const saveJSON=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  function toast(msg){
    let t=$('#contentEditorToast');
    if(!t){t=document.createElement('div');t.id='contentEditorToast';document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2300);
  }

  function db(){
    if(mediaDB)return mediaDB;
    mediaDB=new Promise((resolve,reject)=>{
      const r=indexedDB.open(MEDIA_DB,1);
      r.onupgradeneeded=()=>r.result.createObjectStore(MEDIA_STORE);
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });return mediaDB;
  }
  async function mediaPut(id,value){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(MEDIA_STORE,'readwrite');tx.objectStore(MEDIA_STORE).put(value,id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
  async function mediaGet(id){const d=await db();return new Promise((res,rej)=>{const q=d.transaction(MEDIA_STORE,'readonly').objectStore(MEDIA_STORE).get(id);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
  async function mediaDelete(id){const d=await db();return new Promise((res,rej)=>{const tx=d.transaction(MEDIA_STORE,'readwrite');tx.objectStore(MEDIA_STORE).delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}

  function keyFor(el){
    if(el.dataset.ceKey)return el.dataset.ceKey;
    if(el.id)return el.dataset.ceKey='id:'+el.id;
    const parts=[];let n=el;
    while(n&&n!==document.body){const p=n.parentElement;if(!p)break;let i=0;for(const c of p.children){if(c.tagName===n.tagName)i++;if(c===n)break}parts.unshift(n.tagName.toLowerCase()+':'+i);n=p}
    return el.dataset.ceKey='path:'+parts.join('/');
  }

  function blocked(el){return !!el.closest('#accessBar,#authModal,#editPanel,#contentAdminToolbar,#contentAddModal,.admin-media-actions,.bot-panel,.bot-toggle,script,style,.ce-element-actions,.ce-added-controls');}

  function ensureTextWrappers(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];let n;
    while((n=walker.nextNode())){
      const txt=n.nodeValue.trim(),p=n.parentElement;
      if(!txt||!p||blocked(p)||p.closest('[data-ce-text]'))continue;
      if(['SCRIPT','STYLE','TEXTAREA','SELECT','OPTION','INPUT'].includes(p.tagName))continue;
      nodes.push(n);
    }
    nodes.forEach(node=>{const s=document.createElement('span');s.dataset.ceText='1';s.textContent=node.nodeValue;node.parentNode.replaceChild(s,node)});
  }

  function editableElements(){
    ensureTextWrappers();
    const els=$$('[data-ce-text],h1,h2,h3,h4,h5,h6,p,li,summary,small,strong,span,b,em,blockquote,figcaption,label,a,button,dt,dd,th,td,footer,nav');
    return els.filter(el=>{
      if(blocked(el)||!el.textContent.trim())return false;
      if(el.classList.contains('social-icon')||el.classList.contains('unit-card-arrow')||el.classList.contains('week-arrow')||el.classList.contains('status-dot'))return false;
      if(el.dataset.ceText==='1')return true;
      if(el.closest('.ce-added-block'))return false;
      return !Array.from(el.children).some(c=>c.textContent.trim());
    });
  }

  function isDeleted(k){return loadJSON(deleteStore,[]).includes(k)}

  function applySaved(){
    const saved=loadJSON(editStore,{}),deleted=loadJSON(deleteStore,[]);
    editableElements().forEach(el=>{const k=keyFor(el);if(Object.prototype.hasOwnProperty.call(saved,k))el.innerHTML=saved[k];if(deleted.includes(k))el.closest('.ce-deleted-shell')?.remove()||el.remove()});
  }

  function setEditable(on){
    editing=!!on;document.body.classList.toggle('content-admin-editing',editing);
    editableElements().forEach(el=>{el.dataset.ceEditable='1';el.contentEditable=editing?'true':'false';el.spellcheck=true;});
    if(editing){snapshot={};editableElements().forEach(el=>snapshot[keyFor(el)]=el.innerHTML);$('#contentAdminToolbar')?.classList.add('open');$('#ceEdit').textContent='✓ Editando contenido';toast('Ahora puedes hacer clic en cualquier texto para cambiarlo.');}
    else{$('#ceEdit')&&( $('#ceEdit').textContent='✎ Editar todo el contenido');}
    renderElementControls();
  }

  function saveAll(){
    if(!isAdmin())return toast('Solo el administrador puede guardar cambios.');
    const saved=loadJSON(editStore,{});editableElements().forEach(el=>{saved[keyFor(el)]=el.innerHTML});saveJSON(editStore,saved);
    setEditable(false);toast('Cambios de texto guardados correctamente.');
  }
  function cancelAll(){
    if(!editing)return;
    editableElements().forEach(el=>{const k=keyFor(el);if(Object.prototype.hasOwnProperty.call(snapshot,k))el.innerHTML=snapshot[k]});
    setEditable(false);toast('Cambios sin guardar cancelados.');
  }

  function deleteElement(el){
    if(!isAdmin()||!editing)return;
    const k=keyFor(el);
    if(!confirm('¿Eliminar este contenido del portafolio?'))return;
    const arr=loadJSON(deleteStore,[]);if(!arr.includes(k))arr.push(k);saveJSON(deleteStore,arr);el.remove();toast('Contenido eliminado.');
  }

  function renderElementControls(){
    $$('.ce-element-actions').forEach(x=>x.remove());
    if(!isAdmin()||!editing)return;
    editableElements().forEach(el=>{
      if(el.closest('.ce-added-block'))return;
      const wrap=document.createElement('span');wrap.className='ce-element-actions';
      const edit=document.createElement('button');edit.type='button';edit.textContent='✎';edit.title='Editar texto';edit.onclick=e=>{e.preventDefault();e.stopPropagation();el.focus()};
      const del=document.createElement('button');del.type='button';del.textContent='🗑';del.title='Eliminar contenido';del.onclick=e=>{e.preventDefault();e.stopPropagation();deleteElement(el)};
      wrap.append(edit,del);el.insertAdjacentElement('afterend',wrap);
    });
  }

  function sections(){
    const out=[];$$('main section,main .content-card,main .card,main .quest').forEach((el,i)=>{if(blocked(el))return;if(!el.dataset.ceTarget)el.dataset.ceTarget='target-'+i+'-'+(el.id||el.className.toString().split(' ')[0]||'bloque');const title=(el.querySelector('h1,h2,h3,.quest-title,.section-head h2')?.textContent||('Bloque '+(i+1))).trim().replace(/\s+/g,' ');if(!out.some(x=>x.el===el))out.push({el,title,key:el.dataset.ceTarget})});
    if(!out.length)out.push({el:$('#app-screen')||document.body,title:'Contenido principal',key:'main'});return out;
  }

  async function renderAdded(){
    $$('.ce-added-block[data-added-id]').forEach(x=>x.remove());
    const saved=loadJSON(addStore,[]),targets=sections();
    for(const item of saved){
      const target=targets.find(x=>x.key===item.target)||targets[0];if(!target)continue;
      const block=document.createElement('div');block.className='ce-added-block';block.dataset.addedId=item.id;
      const h=document.createElement('h3');h.textContent=item.title;const p=document.createElement('p');p.textContent=item.body||'';block.append(h,p);
      if(item.mediaId){try{const m=await mediaGet(item.mediaId);if(m){if(m.type.startsWith('image/')){const im=document.createElement('img');im.src=m.data;im.alt=item.title;im.className='ce-added-image';block.appendChild(im)}else{const a=document.createElement('a');a.href=m.data;a.download=m.name;a.target='_blank';a.className='ce-added-file';a.textContent='📎 '+m.name;block.appendChild(a)}}}catch{}}
      const controls=document.createElement('div');controls.className='ce-added-controls';
      const ed=document.createElement('button');ed.textContent='✎ Editar';ed.onclick=()=>editAdded(item.id);
      const del=document.createElement('button');del.textContent='🗑 Eliminar';del.onclick=()=>deleteAdded(item.id);
      controls.append(ed,del);block.appendChild(controls);target.el.appendChild(block);
    }
    renderElementControls();
  }
  function editAdded(id){const arr=loadJSON(addStore,[]),item=arr.find(x=>x.id===id);if(!item)return;openAdd(item)}
  async function deleteAdded(id){if(!isAdmin())return;if(!confirm('¿Eliminar este contenido añadido?'))return;const arr=loadJSON(addStore,[]),item=arr.find(x=>x.id===id);saveJSON(addStore,arr.filter(x=>x.id!==id));if(item?.mediaId)await mediaDelete(item.mediaId);renderAdded();toast('Contenido añadido eliminado.')}

  function openAdd(existing=null){
    if(!isAdmin())return toast('Solo el administrador puede añadir contenido.');
    const m=$('#contentAddModal');if(!m)return;const select=$('#ceTarget');select.innerHTML='';sections().forEach(s=>{const o=document.createElement('option');o.value=s.key;o.textContent=s.title.slice(0,70);select.appendChild(o)});
    $('#ceEditingId').value=existing?.id||'';select.value=existing?.target||select.value;$('#ceTitle').value=existing?.title||'';$('#ceBody').value=existing?.body||'';$('#ceFile').value='';$('#ceFileName').textContent=existing?.fileName?('Archivo actual: '+existing.fileName):'Sin archivo seleccionado';m.classList.add('open');$('#ceTitle').focus();
  }
  function closeAdd(){$('#contentAddModal')?.classList.remove('open')}
  async function addBlock(){
    const id=$('#ceEditingId').value||'add-'+Date.now(),title=$('#ceTitle').value.trim(),body=$('#ceBody').value.trim(),target=$('#ceTarget').value,file=$('#ceFile').files[0];
    if(!title&&!body&&!file)return toast('Añade al menos un texto o un archivo.');
    const arr=loadJSON(addStore,[]),old=arr.find(x=>x.id===id);let mediaId=old?.mediaId||null,fileName=old?.fileName||'';
    if(file){mediaId='media-'+id;fileName=file.name;const reader=new FileReader();reader.onload=async()=>{await mediaPut(mediaId,{name:file.name,type:file.type||'application/octet-stream',data:reader.result});saveItem();};reader.readAsDataURL(file);return}
    saveItem();
    function saveItem(){const item={id,title,body,target,mediaId,fileName};const idx=arr.findIndex(x=>x.id===id);if(idx>=0)arr[idx]=item;else arr.push(item);saveJSON(addStore,arr);renderAdded();closeAdd();toast(old?'Contenido actualizado.':'Nuevo contenido añadido.');}
  }

  function buildUI(){
    if(!isAdmin())return;
    if(!$('#contentAdminToolbar')){const bar=document.createElement('div');bar.id='contentAdminToolbar';bar.innerHTML='<button id="ceEdit">✎ Editar todo el contenido</button><button id="ceAdd">＋ Añadir texto / imagen / archivo</button><button class="ce-save" id="ceSave">💾 Guardar cambios</button><button class="ce-cancel" id="ceCancel">↶ Cancelar</button>';document.body.appendChild(bar);$('#ceEdit').onclick=()=>setEditable(!editing);$('#ceAdd').onclick=()=>openAdd();$('#ceSave').onclick=saveAll;$('#ceCancel').onclick=cancelAll;}
    if(!$('#contentAddModal')){const m=document.createElement('div');m.id='contentAddModal';m.innerHTML='<div class="ce-backdrop"></div><div class="ce-add-card"><h3>＋ Añadir contenido</h3><p>Solo el administrador puede añadir o modificar contenido.</p><input type="hidden" id="ceEditingId"><label>Ubicación<select id="ceTarget"></select></label><label>Título<input id="ceTitle" maxlength="180" placeholder="Ej. Nueva evidencia"></label><label>Texto / descripción<textarea id="ceBody" rows="6" maxlength="8000" placeholder="Escribe el contenido..."></textarea></label><label>Imagen o archivo<input id="ceFile" type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.sql,.zip,.txt,.csv"></label><div id="ceFileName">Sin archivo seleccionado</div><div class="ce-add-actions"><button id="ceAddCancel">Cancelar</button><button class="ce-add-save" id="ceAddSave">Guardar contenido</button></div></div>';document.body.appendChild(m);$('.ce-backdrop',m).onclick=closeAdd;$('#ceAddCancel').onclick=closeAdd;$('#ceAddSave').onclick=addBlock;$('#ceFile').onchange=e=>$('#ceFileName').textContent=e.target.files[0]?.name||'Sin archivo seleccionado';}
  }

  function refresh(){
    if(!isAdmin()){editing=false;document.body.classList.remove('content-admin-editing');$('#contentAdminToolbar')?.remove();$('#contentAddModal')?.remove();return}
    buildUI();applySaved();renderAdded();if(isEditMode()&&editing)setEditable(true);else renderElementControls();
  }

  document.addEventListener('portfolio-edit-mode',()=>{if(isAdmin()){buildUI();editing=true;setEditable(true);renderAdded()}else refresh()});
  window.addEventListener('storage',e=>{if(e.key===roleKey||e.key===editModeKey||e.key===editStore||e.key===addStore||e.key===deleteStore)refresh()});
  document.addEventListener('keydown',e=>{if(isAdmin()&&editing&&e.ctrlKey&&e.key.toLowerCase()==='s'){e.preventDefault();saveAll()}if(e.key==='Escape'&&$('#contentAddModal')?.classList.contains('open'))closeAdd()});
  document.addEventListener('click',e=>{if(!editing)return;const a=e.target.closest('a');if(a&&!e.target.closest('#contentAdminToolbar,#contentAddModal,.admin-media-actions,.ce-element-actions,.ce-added-controls')){e.preventDefault();e.stopPropagation()}},true);
  window.__ce={keyFor,editableElements};
  setTimeout(()=>{if(isAdmin()){buildUI();applySaved();renderAdded();}},100);
})();
