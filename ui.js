(function(){
var P={ai:"<path d=\"M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 15l.7 1.5L7 17l-1.3.5L5 19l-.7-1.5L3 17l1.3-.5z\"/>",prc:'<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',fin:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',eval:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',docs:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',cp:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',arch:'<path d="M3 4h18v4H3zM5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/>',
send:'<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',up:'<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',dl:'<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',ref:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>'};
function I(k,c){return '<svg class="ui-i'+(c?' '+c:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+P[k]+'</svg>'}
function add(el,k){if(!el||el.querySelector('.ui-i'))return;el.insertAdjacentHTML('afterbegin',I(k))}
var OK={prc:1,fin:1,eval:1,docs:1,cp:1,arch:1,ai:1};function run(){document.querySelectorAll('nav button').forEach(function(b){if(!OK[b.dataset.v]){b.classList.add('hid');b.style.display='none'}});['vreg','vman','vrep','vmet','vsrc','vprop','vperr','vfav'].forEach(function(i){var e=document.getElementById(i);if(e&&e.style.display!=='none'&&!document.querySelector('nav button.on[data-v="'+i.slice(1)+'"]:not(.hid)'))e.style.display='none'});document.querySelectorAll('nav button[data-v]').forEach(function(b){if(P[b.dataset.v]&&!b.querySelector('.ui-i')){b.innerHTML=I(b.dataset.v,'ui-t')+'<span>'+b.textContent+'</span>'}});
 ['psend','fsend','esend'].forEach(function(i){add(document.getElementById(i),'send')});
 document.querySelectorAll('.fdrop>span').forEach(function(s){add(s,'up')});
 document.querySelectorAll('button[data-f]').forEach(function(b){add(b,'dl')});
 var r=document.getElementById('rfb');if(r&&!r.querySelector('.ui-i')){r.innerHTML=I('ref')}}
var n=document.querySelector('header .brand-n');if(n)n.textContent='Arbitr';run();new MutationObserver(function(){clearTimeout(run.t);run.t=setTimeout(run,60)}).observe(document.body,{childList:true,subtree:true});
})();
