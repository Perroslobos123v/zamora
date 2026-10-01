(function(){
  'use strict';
  document.body.classList.add('galactic-ready');

  // Star field
  const field=document.createElement('div'); field.className='galactic-particles';
  const frag=document.createDocumentFragment();
  for(let i=0;i<55;i++){
    const s=document.createElement('i'); s.className='galactic-particle';
    s.style.left=(Math.random()*100)+'%';
    s.style.top=(20+Math.random()*90)+'%';
    s.style.animationDuration=(7+Math.random()*13)+'s';
    s.style.animationDelay=(-Math.random()*15)+'s';
    s.style.opacity=(.25+Math.random()*.55).toFixed(2);
    frag.appendChild(s);
  }
  field.appendChild(frag); document.body.appendChild(field);

  // Holographic sweep on important interactive elements.
  document.querySelectorAll('.btn,.unit-card,.unit-tab,.card,.project-intro,.week-card-arcane,.quest,.social-link').forEach(el=>el.classList.add('gx-holo'));

  // Subtle black-hole ornament on hero, without changing any original text.
  const hero=document.querySelector('.hero');
  if(hero && !hero.querySelector('.gx-blackhole')){const b=document.createElement('div');b.className='gx-blackhole';b.setAttribute('aria-hidden','true');hero.appendChild(b);}

  // Unit realm labels are additive only.
  const realms={1:'REINO DEL CONOCIMIENTO',2:'CÁMARA DEL ALMACENAMIENTO',3:'FORTALEZA DE SEGURIDAD',4:'SALÓN DE MAESTRÍA'};
  document.querySelectorAll('.unit-card[data-unit]').forEach(c=>{c.classList.add('gx-realm');c.dataset.realm=realms[c.dataset.unit]||'ZONA ACADÉMICA';});

  // Progress dashboard only on the main portfolio.
  if(document.getElementById('proyectos') && !document.getElementById('gxProgress')){
    const sec=document.createElement('section'); sec.id='gxProgress'; sec.className='gx-progress-section';
    sec.innerHTML=`<div class="container"><div class="section-head"><span class="mark">✦</span><h2>Mi Progreso · Mapa Galáctico</h2><p>Ruta académica</p></div><div class="gx-dashboard"><div class="gx-progress-card"><div class="gx-overall"><div class="gx-orb">XP</div><div><h3>Progreso del portafolio</h3><p>Las semanas se marcan desde el modo administrador.</p></div><div class="gx-percent" id="gxPercent">0%</div></div><div class="gx-bar"><i id="gxBar"></i></div><div class="gx-week-grid" id="gxWeeks"></div><div class="gx-admin-note">✦ Administrador: marca las semanas completadas para actualizar el progreso.</div></div><div class="gx-achievement-card"><div class="gx-overall"><div class="gx-orb">★</div><div><h3>Logros desbloqueables</h3><p>Insignias de tu recorrido.</p></div></div><div class="gx-achievements" id="gxAchievements"></div></div></div></div>`;
    const contact=document.querySelector('#contacto'); contact ? contact.parentNode.insertBefore(sec,contact) : document.querySelector('main').appendChild(sec);
    buildProgress();
  }

  function isAdmin(){return localStorage.getItem('portfolioRole')==='admin';}
  function getProgress(){try{return JSON.parse(localStorage.getItem('portfolioWeekProgress')||'[]')}catch(e){return []}}
  function setProgress(a){localStorage.setItem('portfolioWeekProgress',JSON.stringify(a));}
  function buildProgress(){
    const weeks=document.getElementById('gxWeeks'); if(!weeks)return;
    weeks.innerHTML=''; const done=getProgress();
    for(let i=1;i<=16;i++){
      const unit=Math.ceil(i/4), week=((i-1)%4)+1, key='u'+unit+'w'+week;
      const d=document.createElement('label'); d.className='gx-week'+(done.includes(key)?' done':'');
      d.innerHTML='<strong><input type="checkbox" '+(done.includes(key)?'checked':'')+' '+(isAdmin()?'':'disabled')+'> U'+unit+' · S'+week+'</strong><small>'+(['Conocimiento','Almacenamiento','Seguridad','Maestría'][unit-1]||'Ruta')+'</small>';
      d.querySelector('input').addEventListener('change',e=>{const a=getProgress();if(e.target.checked&&!a.includes(key))a.push(key);if(!e.target.checked){const n=a.indexOf(key);if(n>-1)a.splice(n,1)}setProgress(a);buildProgress();});
      weeks.appendChild(d);
    }
    const pct=Math.round(done.length/16*100); const p=document.getElementById('gxPercent'),bar=document.getElementById('gxBar'); if(p)p.textContent=pct+'%'; if(bar)bar.style.width=pct+'%';
    const ach=[['🌟','Primer salto','Completa 1 semana',done.length>=1],['📚','Explorador académico','Completa 4 semanas',done.length>=4],['⚔️','Maestro de unidad','Completa 8 semanas',done.length>=8],['🏆','Ruta completa','Completa las 16 semanas',done.length>=16]];
    const box=document.getElementById('gxAchievements'); if(box)box.innerHTML=ach.map(a=>'<div class="gx-achievement '+(a[3]?'unlocked':'')+'"><div class="badge">'+a[0]+'</div><div><strong>'+a[1]+'</strong><small>'+a[2]+'</small></div></div>').join('');
  }
  document.addEventListener('portfolio-edit-mode',buildProgress);

  // Image lightbox / gallery for existing evidence, without changing source information.
  const lb=document.createElement('div'); lb.className='gx-lightbox'; lb.innerHTML='<button type="button" aria-label="Cerrar">×</button><img alt="Vista ampliada">'; document.body.appendChild(lb);
  const lbImg=lb.querySelector('img'); lb.querySelector('button').onclick=()=>lb.classList.remove('open'); lb.onclick=e=>{if(e.target===lb)lb.classList.remove('open')};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('open')});
  document.querySelectorAll('.project-body img,.quest-media img,.reg-card-media img,.sgbd-card-media img,.infographic-gallery img,.profile-photo img').forEach(img=>{
    if(img.closest('.admin-media-control'))return; img.style.cursor='zoom-in'; img.addEventListener('click',()=>{lbImg.src=img.currentSrc||img.src;lbImg.alt=img.alt||'Evidencia ampliada';lb.classList.add('open')});
  });

  // Gallery of existing images, generated only when useful images exist.
  const source=[...document.querySelectorAll('.project-body img,.quest-media img,.reg-card-media img,.sgbd-card-media img,.infographic-gallery img')].filter((x,i,a)=>x.src && a.findIndex(y=>y.src===x.src)===i);
  if(source.length>=3 && document.getElementById('proyectos') && !document.getElementById('gxGallery')){
    const sec=document.createElement('section'); sec.id='gxGallery'; sec.innerHTML='<div class="container"><div class="section-head"><span class="mark">◈</span><h2>Galería de Evidencias</h2><p>Vista rápida</p></div><div class="gx-gallery"></div></div>';
    const progress=document.getElementById('gxProgress'); progress ? progress.parentNode.insertBefore(sec,progress.nextSibling) : document.querySelector('main').appendChild(sec);
    const g=sec.querySelector('.gx-gallery'); source.slice(0,8).forEach((img,i)=>{const item=document.createElement('div');item.className='gx-gallery-item';item.innerHTML='<img src="'+img.src.replace(/&/g,'&amp;')+'" alt="'+(img.alt||'Evidencia '+(i+1)).replace(/"/g,'&quot;')+'"><span>EVIDENCIA · '+String(i+1).padStart(2,'0')+'</span>';item.onclick=()=>{lbImg.src=img.src;lbImg.alt=img.alt||'Evidencia ampliada';lb.classList.add('open')};g.appendChild(item)});
  }

  // Optional ambient sound via Web Audio; never starts automatically.
  const audio=document.createElement('button');audio.className='gx-audio';audio.type='button';audio.title='Activar sonido ambiental';audio.textContent='♪';document.body.appendChild(audio);
  let ctx,master,osc,playing=false;
  audio.onclick=()=>{
    if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.018;master.connect(ctx.destination);osc=ctx.createOscillator();const lfo=ctx.createOscillator(),lg=ctx.createGain();osc.type='sine';osc.frequency.value=110;lfo.frequency.value=.06;lg.gain.value=7;lfo.connect(lg);lg.connect(osc.frequency);osc.connect(master);osc.start();lfo.start();}
    playing=!playing; if(playing){master.gain.setTargetAtTime(.018,ctx.currentTime,.15);audio.classList.add('on');audio.textContent='♫';audio.title='Desactivar sonido ambiental'}else{master.gain.setTargetAtTime(0,ctx.currentTime,.15);audio.classList.remove('on');audio.textContent='♪';audio.title='Activar sonido ambiental'}
  };

  // Extra motion pack: cursor, sparks, reveal, tilt, ripples and shooting stars.
  const reduceMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Custom cosmic cursor on desktop.
  if(!reduceMotion && window.matchMedia('(pointer:fine)').matches){
    const cursor=document.createElement('div'); cursor.className='gx-cursor';
    const ring=document.createElement('div'); ring.className='gx-cursor-ring';
    const dot=document.createElement('div'); dot.className='gx-cursor-dot';
    document.body.append(cursor,ring,dot);
    let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my,lastSpark=0;
    addEventListener('mousemove',e=>{
      mx=e.clientX; my=e.clientY; cursor.style.left=mx+'px';cursor.style.top=my+'px';dot.style.left=(mx-2)+'px';dot.style.top=(my-2)+'px';
      cursor.style.opacity=ring.style.opacity=dot.style.opacity='1';
      if(performance.now()-lastSpark>75){lastSpark=performance.now();
        const sp=document.createElement('i');sp.className='gx-spark';sp.style.left=mx+'px';sp.style.top=my+'px';sp.style.setProperty('--sx',(Math.random()*26-13)+'px');sp.style.setProperty('--sy',(Math.random()*26-13)+'px');document.body.appendChild(sp);setTimeout(()=>sp.remove(),720);
      }
    });
    (function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(loop)})();
    document.querySelectorAll('a,button,.card,.unit-card,.unit-tab,.social-link,.quest,.gx-gallery-item,.week-card-arcane').forEach(el=>{
      el.addEventListener('mouseenter',()=>ring.classList.add('hover'));el.addEventListener('mouseleave',()=>ring.classList.remove('hover'));
    });
  }

  // Scroll reveal for existing content; no text/content is changed.
  const revealTargets=document.querySelectorAll('section,.card,.unit-card,.quest,.week-card-arcane,.project-intro,.reg-card,.achievement-card');
  revealTargets.forEach((el,i)=>{el.classList.add('gx-reveal');el.style.transitionDelay=Math.min(i%7,6)*45+'ms'});
  if(!reduceMotion && 'IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('gx-visible');io.unobserve(en.target)}}),{threshold:.08,rootMargin:'0px 0px -40px'});
    revealTargets.forEach(el=>io.observe(el));
  }else revealTargets.forEach(el=>el.classList.add('gx-visible'));

  // Gentle 3D tilt on cards.
  if(!reduceMotion && window.matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.card,.unit-card,.gx-progress-card,.gx-achievement-card,.gx-gallery-item,.project-intro').forEach(el=>{
      el.classList.add('gx-tilt');
      el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--mx',(x*100+50)+'%');el.style.setProperty('--my',(y*100+50)+'%');el.style.transform=`perspective(900px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg) translateY(-2px)`});
      el.addEventListener('mouseleave',()=>{el.style.transform='';});
    });
  }

  // Click ripples for buttons and navigation.
  document.querySelectorAll('.btn,.nav a,.unit-tab,.social-link,.access-btn,.auth-submit,.edit-actions button,.gx-top-btn,.gx-audio').forEach(el=>{
    el.style.position=el.style.position||'relative';el.addEventListener('click',e=>{const r=el.getBoundingClientRect(),size=Math.max(r.width,r.height),q=document.createElement('i');q.className='gx-ripple';q.style.width=q.style.height=size+'px';q.style.left=(e.clientX-r.left-size/2)+'px';q.style.top=(e.clientY-r.top-size/2)+'px';el.appendChild(q);setTimeout(()=>q.remove(),700)});
  });

  // Random shooting stars, kept sparse for readability.
  if(!reduceMotion){setInterval(()=>{if(document.hidden)return;const s=document.createElement('i');s.className='gx-shooting-star';s.style.left=(65+Math.random()*38)+'vw';s.style.top=(8+Math.random()*48)+'vh';document.body.appendChild(s);setTimeout(()=>s.remove(),1200)},6500)}

  // Highlight the navigation item for the current section when possible.
  const navLinks=[...document.querySelectorAll('.nav a[href^="#"]')];
  if(navLinks.length && 'IntersectionObserver' in window){
    const sections=[...navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean)];
    const nio=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting){navLinks.forEach(a=>a.classList.toggle('gx-nav-active',a.getAttribute('href')==='#'+en.target.id))}}),{rootMargin:'-35% 0px -55% 0px',threshold:0});sections.forEach(s=>nio.observe(s));
  }

  // Back-to-top button.
  const topBtn=document.createElement('button');topBtn.className='gx-top-btn';topBtn.type='button';topBtn.title='Volver arriba';topBtn.textContent='↑';document.body.appendChild(topBtn);
  addEventListener('scroll',()=>topBtn.classList.toggle('show',scrollY>500),{passive:true});topBtn.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

  // Add a small orbit to the main hero as a decorative motion layer.
  if(hero && !reduceMotion && !hero.querySelector('.gx-orbit')){const o=document.createElement('div');o.className='gx-orbit';o.style.right='12%';o.style.top='22%';hero.appendChild(o)}

})();
