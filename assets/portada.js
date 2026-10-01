(function(){'use strict';
var H=document.documentElement,$$=function(s){return[].slice.call(document.querySelectorAll(s))};
H.classList.add('pj');
if(!('IntersectionObserver' in window)){$$('.skill').forEach(function(s){s.classList.add('in')});return}
var links=$$('.nav a[href^="#"]'),map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
var spy=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting||!map[e.target.id])return;links.forEach(function(a){a.classList.remove('active')});map[e.target.id].classList.add('active')})},{rootMargin:'-40% 0px -55% 0px'});
$$('main section[id]').forEach(function(s){spy.observe(s)});
var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
var bars=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var s=e.target,b=s.querySelector('b'),n=b?parseInt(b.textContent,10):NaN;s.classList.add('in');bars.unobserve(s);
 if(rm||isNaN(n))return;var t0=performance.now();(function f(t){var p=Math.min(1,(t-t0)/1300);b.textContent=Math.round(n*(1-Math.pow(1-p,3)))+'%';if(p<1)requestAnimationFrame(f)})(t0)})},{threshold:.4});
$$('.skill').forEach(function(s){bars.observe(s)});
})();
