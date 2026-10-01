/* Gestor de imágenes y archivos — solo Administrador */
(function(){
  const DB_NAME='portfolioMediaDB', STORE='files';
  let dbPromise;
  function db(){
    if(dbPromise) return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB_NAME,1);
      r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
      r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
    }); return dbPromise;
  }
  const key=s=>location.pathname.replace(/\\/g,'/')+'::'+s;
  function isAdmin(){return localStorage.getItem('portfolioRole')==='admin' && localStorage.getItem('portfolioEditMode')==='true';}
  function editableImage(img){
    // Todas las imágenes visibles del portafolio pueden ser reemplazadas por el administrador.
    // Se excluyen únicamente imágenes generadas por la interfaz del editor/bot y elementos internos.
    if(!img || img.closest('.admin-media-actions,#authModal,#editPanel,#contentAdminToolbar,#contentAddModal,.bot-panel,.bot-toggle,script,style')) return false;
    const src=img.getAttribute('src')||'';
    if(!src || src.startsWith('data:image/svg+xml')) return false;
    return true;
  }
  function addImageControl(img){
    if(img.dataset.mediaEditor==='1') return;
    img.dataset.mediaEditor='1';
    const originalSrc=img.getAttribute('src'); img.dataset.mediaOriginal=originalSrc; const parent=img.parentElement;
    if(!parent) return;
    if(getComputedStyle(parent).position==='static') parent.style.position='relative';
    const box=document.createElement('div'); box.className='admin-media-actions';
    const b=document.createElement('button'); b.type='button'; b.className='admin-media-control'; b.textContent='✎ Editar'; b.title='Administrador: reemplazar esta imagen';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();chooseImage(img)});
    const del=document.createElement('button'); del.type='button'; del.className='admin-media-control admin-delete-control'; del.textContent='🗑 Eliminar'; del.title='Administrador: eliminar esta imagen';
    del.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();deleteMedia(img,null)});
    box.append(b,del); parent.appendChild(box);
  }
  function addFileControl(a){
    if(a.dataset.mediaEditor==='1') return;
    a.dataset.mediaEditor='1';
    const box=document.createElement('div'); box.className='admin-media-actions admin-file-actions';
    const b=document.createElement('button'); b.type='button'; b.className='admin-media-control'; b.textContent='✎ Editar'; b.title='Administrador: reemplazar este archivo';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();chooseFile(a)});
    const del=document.createElement('button'); del.type='button'; del.className='admin-media-control admin-delete-control'; del.textContent='🗑 Eliminar'; del.title='Administrador: eliminar este archivo';
    del.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();deleteMedia(null,a)});
    a.insertAdjacentElement('afterend',box); box.append(b,del);
  }
  function chooseImage(img){
    if(!isAdmin()){ toast('Solo el administrador puede modificar imágenes.'); return; }
    const input=document.createElement('input'); input.type='file'; input.accept='image/*';
    input.onchange=()=>{const f=input.files[0]; if(!f)return; const r=new FileReader(); r.onload=async()=>{try{const d=await db(); const tx=d.transaction(STORE,'readwrite'); tx.objectStore(STORE).put({name:f.name,type:f.type,data:r.result},key(img.getAttribute('src'))); tx.oncomplete=()=>{img.src=r.result; img.dataset.replaced='1'; toast('Imagen actualizada para el administrador.');};}catch(e){toast('No se pudo guardar la imagen.');}}; r.readAsDataURL(f)}; input.click();
  }
  function chooseFile(a){
    if(!isAdmin()){ toast('Solo el administrador puede modificar archivos.'); return; }
    const input=document.createElement('input'); input.type='file';
    input.onchange=()=>{const f=input.files[0]; if(!f)return; const r=new FileReader(); r.onload=async()=>{try{const d=await db(); const tx=d.transaction(STORE,'readwrite'); tx.objectStore(STORE).put({name:f.name,type:f.type,data:r.result},key(a.getAttribute('href'))); tx.oncomplete=()=>{a.href=r.result;a.download=f.name;a.dataset.replaced='1';a.querySelector('small')?.remove();toast('Archivo reemplazado para el administrador.');};}catch(e){toast('No se pudo guardar el archivo.');}}; r.readAsDataURL(f)}; input.click();
  }

  async function removeKey(k,done){
    try{const d=await db(); const tx=d.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(k); tx.oncomplete=done;}
    catch(e){toast('No se pudo eliminar la modificación.');}
  }
  function deleteImage(img){
    if(!isAdmin()){toast('Solo el administrador puede eliminar imágenes.');return;}
    const original=img.dataset.mediaOriginal;
    if(!original){toast('No hay una modificación para eliminar.');return;}
    removeKey(key(original),()=>{img.src=original;img.dataset.replaced='';toast('Modificación eliminada. Imagen restaurada.');});
  }
  function deleteFile(a){
    if(!isAdmin()){toast('Solo el administrador puede eliminar archivos.');return;}
    const original=a.dataset.mediaOriginal;
    if(!original){toast('No hay una modificación para eliminar.');return;}
    removeKey(key(original),()=>{a.href=original;a.removeAttribute('download');a.dataset.replaced='';toast('Modificación eliminada. Archivo restaurado.');});
  }

  function deleteMedia(img,a){
    if(!isAdmin()){toast('Solo el administrador puede eliminar imágenes o archivos.');return;}
    const target=img||a; const original=target.dataset.mediaOriginal || target.getAttribute(img?'src':'href');
    if(!original){toast('No se pudo identificar el elemento.');return;}
    if(!confirm('¿Eliminar esta '+(img?'imagen':'archivo')+' del portafolio?')) return;
    const itemKey='portfolioDeletedMedia:'+location.pathname+'::'+original;
    localStorage.setItem(itemKey,'1');
    const wrapper=img ? img.parentElement : a.parentElement;
    if(wrapper && wrapper.querySelector('.admin-media-actions')) wrapper.querySelector('.admin-media-actions').remove();
    if(img){img.style.display='none';} else {a.style.display='none';}
    toast((img?'Imagen':'Archivo')+' eliminado del portafolio.');
  }
  function applyDeleted(){
    if(!isAdmin()) return;
    document.querySelectorAll('img').forEach(i=>{const src=i.getAttribute('src'); if(src && localStorage.getItem('portfolioDeletedMedia:'+location.pathname+'::'+src)==='1'){i.style.display='none';}});
    document.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href'); if(href && localStorage.getItem('portfolioDeletedMedia:'+location.pathname+'::'+href)==='1'){a.style.display='none'; const box=a.nextElementSibling; if(box?.classList.contains('admin-media-actions')) box.remove();}});
  }

  async function restore(){
    const d=await db(); const items=[]; const tx=d.transaction(STORE,'readonly'); const req=tx.objectStore(STORE).openCursor();
    req.onsuccess=()=>{const c=req.result;if(c){items.push([c.key,c.value]);c.continue();}else{for(const [k,v] of items){const sep=k.lastIndexOf('::');const path=k.slice(sep+2);document.querySelectorAll('img[src="'+CSS.escape(path)+'"]').forEach(i=>i.src=v.data);document.querySelectorAll('a[href="'+CSS.escape(path)+'"]').forEach(a=>{a.href=v.data;a.download=v.name;});}}};
  }
  function toast(t){let x=document.getElementById('mediaToast');if(!x){x=document.createElement('div');x.id='mediaToast';document.body.appendChild(x)}x.textContent=t;x.classList.add('show');clearTimeout(x._t);x._t=setTimeout(()=>x.classList.remove('show'),2200)}
  function refresh(){
    applyDeleted();
    document.querySelectorAll('img').forEach(i=>{if(editableImage(i)){if(isAdmin())addImageControl(i);else i.dataset.mediaEditor='';}});
    document.querySelectorAll('a[href]').forEach(a=>{if(/\.(pdf|docx|doc|pptx|ppt|xlsx|xls|zip)(\?|#|$)/i.test(a.getAttribute('href')||'')){if(isAdmin())addFileControl(a);}});
    document.body.classList.toggle('admin-edit-mode',isAdmin());
  }
  document.addEventListener('portfolio-edit-mode',refresh);
  window.addEventListener('storage',refresh);
  restore().finally(refresh);
})();
