(function(){
var P={prc:'<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',fin:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',eval:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
send:'<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',up:'<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',dl:'<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',ref:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>'};
function I(k,c){return '<svg class="ui-i'+(c?' '+c:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+P[k]+'</svg>'}
function add(el,k){if(!el||el.querySelector('.ui-i'))return;el.insertAdjacentHTML('afterbegin',I(k))}
function run(){document.querySelectorAll('nav button[data-v]').forEach(function(b){if(P[b.dataset.v]&&!b.querySelector('.ui-i')){b.innerHTML=I(b.dataset.v,'ui-t')+'<span>'+b.textContent+'</span>'}});
 ['psend','fsend','esend'].forEach(function(i){add(document.getElementById(i),'send')});
 document.querySelectorAll('.fdrop>span').forEach(function(s){add(s,'up')});
 document.querySelectorAll('button[data-f]').forEach(function(b){add(b,'dl')});
 var r=document.getElementById('rfb');if(r&&!r.querySelector('.ui-i')){r.innerHTML=I('ref')}}
var n=document.querySelector('header .brand-n');if(n)n.textContent='Arbitr';run();new MutationObserver(function(){clearTimeout(run.t);run.t=setTimeout(run,60)}).observe(document.body,{childList:true,subtree:true});
})();
