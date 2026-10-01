(function(){'use strict';
var rm=matchMedia('(prefers-reduced-motion: reduce)').matches,B=document.body;
var $$=function(s){return[].slice.call(document.querySelectorAll(s))};
var CARDS='.unit-card,.card,.week-folder,.s4-card,.doc-card,.hub-week,.reg-card,.sgbd-card,.infografia-card';
var REVEAL=CARDS+',.content-card,.quest,.s4-hero,.doc-head,.unit-banner-arcane';
var bar=document.createElement('div');bar.id='fxBar';B.appendChild(bar);
function prog(){var h=document.documentElement,m=h.scrollHeight-h.clientHeight;bar.style.transform='scaleX('+(m>0?h.scrollTop/m:0)+')'}
addEventListener('scroll',prog,{passive:true});prog();
if(rm)return;
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;t.classList.add('fx-in');io.unobserve(t);setTimeout(function(){t.classList.remove('fx-hide','fx-in')},1100)})},{threshold:.06});
 $$(REVEAL).forEach(function(el){var i=[].indexOf.call(el.parentNode.children,el);el.classList.add('fx-hide');el.style.setProperty('--fxd',(i%6)*70+'ms');io.observe(el)})}
if(matchMedia('(hover:hover)').matches)$$(CARDS).forEach(function(el){el.classList.add('fx-spot','fx-tilt');
 el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  el.style.setProperty('--mx',x*100+'%');el.style.setProperty('--my',y*100+'%');
  if(B.classList.contains('content-admin-editing')||r.width>700)return;
  el.style.transform='perspective(900px) rotateX('+((.5-y)*6)+'deg) rotateY('+((x-.5)*8)+'deg) translateY(-6px)'});
 el.addEventListener('pointerleave',function(){el.style.transform=''})});
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');
 if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank'||a.hasAttribute('download')||B.classList.contains('content-admin-editing'))return;
 var u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname===location.pathname||!/(\.html?|\/)$/.test(u.pathname))return;
 e.preventDefault();B.classList.add('fx-leave');setTimeout(function(){location.href=a.href},260)});
addEventListener('pageshow',function(){B.classList.remove('fx-leave')});
})();
