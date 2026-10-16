/* Arbitr App · «Контрагенты»: навигация по разделам (ПК — колонка слева, телефон — сегменты), «Справочник адресатов»
   (Банки · Госорганы · [Прочие адресаты]), группы элементов и сортировка списков. Всё — из docs_config.json → cp_nav.
   Данные не читает и не хранит: списки строит docs_cp.js, здесь только правила. В localStorage — только ключ сортировки. */
(function(){
'use strict';
function CF(){return ((window.ARB_DOCS_CFG||{}).cp_nav)||{}}
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var MOB_DIR=false,DRAW=null;
/* ---- группы ---- */
function misc(){var m=CF().misc_placement||'others';return /^(others|oaddr|banks|gov)$/.test(m)?m:'others'}
function grpType(t){var g=(CF().dir_types||{})[t];if(!g||g=='misc')return misc();return g}
function grpCP(c){if(!c)return 'others';var K=CF();if((c.src=='dir'||c.auto_dir)&&c.dir_type)return grpType(c.dir_type);   /* auto_dir — СРО из блоков кредиторов (docs_crx.js) */
 var g=(K.cp_kinds||{})[c.kind];if(g)return g=='misc'?misc():g;
 return (c.roles||[]).indexOf(K.creditor_role||'creditor')>=0?'creditors':'others'}
function dirTypes(sec,all){/* типы справочника, которые показываются в разделе sec */return (all||[]).filter(function(t){return grpType(t)==sec})}
function alias(id){return (CF().aliases||{})[id]||id}
function topSecs(){return (CF().sections||[]).slice()}
function dirSecs(){var m=misc();return ((CF().directory||{}).sections||[]).filter(function(s){return !(s.only_if_used&&m!=s.id)})}
function allSecs(){return topSecs().concat(dirSecs())}
function isDir(id){return dirSecs().some(function(s){return s.id==id})}
function first(){var s=allSecs()[0];return s?s.id:null}
/* ---- сортировка ---- */
function SC(){return CF().sort||{}}
/* пункты меню раздела: option.sections — только в этих разделах (группировки «По должнику (А–Я)» / «По номеру дела» — docs_crx.js); sort.defaults[раздел] — сортировка по умолчанию */
function opts(sec){return (SC().options||[]).filter(function(o){return !o.sections||o.sections.indexOf(sec)>=0})}
function sortKey(sec){var k=null;try{k=localStorage.getItem('arbitr.sort.'+sec)}catch(e){}var L=opts(sec),ok=L.some(function(o){return o.id==k});if(ok)return k;var d=(SC().defaults||{})[sec];return L.some(function(o){return o.id==d})?d:(SC().default||'new')}
function setSort(sec,k){try{localStorage.setItem('arbitr.sort.'+sec,k)}catch(e){}}
var PRE=null;
function preRx(){if(PRE)return PRE;var L=(SC().strip_prefixes||[]).slice().sort(function(a,b){return b.length-a.length}).map(function(p){return p.toLowerCase().replace(/ё/g,'е').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')});
 PRE=L.length?new RegExp('^(?:'+L.join('|')+')(?=[\\s«"\'„“]|$)','i'):null;return PRE}
function sortName(s){var q=SC().strip_quotes||'«»"\'„“”',x=String(s||'').toLowerCase().replace(/ё/g,'е').trim(),rx=preRx(),prev;
 var strip=function(){while(x&&q.indexOf(x.charAt(0))>=0)x=x.slice(1).trim()};
 do{prev=x;strip();if(rx)x=x.replace(rx,'').trim()}while(x!=prev&&x);
 return x.replace(/[«»"'„“”]/g,'')}
function sortList(sec,L,dateOf,nameOf){var k=sortKey(sec),a=L.map(function(x,i){return {x:x,i:i,d:validTs(dateOf(x))}});
 if(k=='az'||k=='za'){var col=new Intl.Collator('ru',{sensitivity:'base',numeric:true});a.forEach(function(o){o.n=sortName(nameOf(o.x))});
  a.sort(function(p,q){var c=col.compare(p.n,q.n);if(!p.n&&q.n)return 1;if(p.n&&!q.n)return -1;return (k=='za'?-c:c)||p.i-q.i})}
 else a.sort(function(p,q){if(!p.d&&!q.d)return p.i-q.i;if(!p.d)return 1;if(!q.d)return -1;return (k=='old'?p.d-q.d:q.d-p.d)||p.i-q.i});
 return a.map(function(o){return o.x})}
function validTs(v){var n=+v;return isFinite(n)&&n>946684800000&&n<Date.now()+864e5?n:0}
/* дата добавления дела: поле created или метка времени в id «c<base36>» (newCase в docs_cp.js) */
function caseTs(c){if(!c)return 0;if(validTs(c.created))return +c.created;var m=/^c([0-9a-z]{8,9})$/.exec(c.id||'');return m?validTs(parseInt(m[1],36)):0}
function dd(ts){var d=new Date(ts);return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()}
function added(sec,ts){var k=sortKey(sec);ts=validTs(ts);if(!ts||(k!='new'&&k!='old'))return '';return '<div class="dadded">'+E((SC().added||'добавлен {d}').replace('{d}',dd(ts)))+'</div>'}
function label(k){var o=(SC().options||[]).find(function(x){return x.id==k});return o?o.label:k}
function sortBtn(sec){var k=sortKey(sec);return '<div class="dsrt" data-srt="'+E(sec)+'"><button type="button" class="dsrtb" data-cpsortopen="'+E(sec)+'" aria-haspopup="menu" aria-expanded="false" aria-label="'+E((SC().aria||'Сортировка')+': '+label(k))+'"><span class="dsrtl">↕ '+E(label(k))+' ▾</span><span class="dsrti" aria-hidden="true">↕</span></button>'+
 '<div class="dsrtm" role="menu" hidden>'+opts(sec).map(function(o){return '<button type="button" role="menuitemradio" aria-checked="'+(o.id==k)+'" data-cpsort="'+E(sec)+'|'+E(o.id)+'"><span class="dsrtc" aria-hidden="true">'+(o.id==k?'✓':'')+'</span>'+E(o.label)+'</button>'}).join('')+'</div></div>'}
/* строка из двух одинаковых кнопок над списком: «Загрузить файл» (label с input type=file) и «Экспорт ▾» (меню форматов; пункты — data-cp существующих функций экспорта в docs_cp.js) */
function UI(k){return (CF().ui||{})[k]||''}
function ioRow(sec,fileInput,items){var IO=CF().io||{},F=IO.formats||{};items=items||[];
 return '<div class="dio" data-io="'+E(sec)+'"><label class="lbtn sec dfile dioi">'+E(IO.import||'')+fileInput+'</label><div class="dexw"><button type="button" class="lbtn sec dexb" data-cpmenu="export|'+E(sec)+'" aria-haspopup="menu" aria-expanded="false"'+(items.length?'':' disabled')+'>'+E(IO.export||'')+' ▾</button>'+
  '<div class="dexm" role="menu" hidden>'+items.map(function(it){return '<button type="button" role="menuitem" data-cp="'+E(it.cp)+'">'+E(F[it.k]||it.k)+'</button>'}).join('')+'</div></div></div>'}
/* строка «поиск + сортировка»; search — готовый html поля поиска или '' */
function bar(sec,search){return '<div class="dsrow'+(search?'':' nos')+'">'+(search?'<div class="dsrq">'+search+'</div>':'')+sortBtn(sec)+'</div>'}
/* ---- разметка раздела (data-cpsec на пунктах колонки — совместимость со старыми ссылками/тестами аккордеона; щелчок обрабатывает data-cpnav) ---- */
function render(o){/* o: {sec, count(id), body(id), msg, setSec(id)} */
 var sec=alias(o.sec);if(!allSecs().some(function(s){return s.id==sec})){sec=first();o.setSec(sec)}
 var dirOn=isDir(sec),D=CF().directory||{},cnt=function(id){var n=o.count(id);return n===''||n==null?'':String(n)};
 var item=function(s,sub){var on=s.id==sec;return '<button type="button" class="dnvi'+(sub?' sub':'')+(on?' on':'')+'" data-cpnav="'+E(s.id)+'" data-cpsec="'+E(s.id)+'"'+(on?' aria-current="page"':'')+'><span class="dnvic" aria-hidden="true">'+E(s.icon||'')+'</span><span class="dnvt">'+E(s.title)+'</span><span class="dnvn">'+E(cnt(s.id))+'</span></button>'};
 var seg=function(L){return '<div class="dseg" role="tablist">'+L.map(function(s){var on=s.id==sec;return '<button type="button" role="tab" aria-selected="'+on+'" class="dsegb'+(on?' on':'')+'" data-cpnav="'+E(s.id)+'">'+E(s.short||s.title)+'</button>'}).join('')+'</div>'};
 var h='<p class="sm">'+E(CF().help||'')+'</p>'+(o.msg?'<p class="sm dok" id="dcpmsg">'+E(o.msg)+'</p>':'');
 h+='<div class="dnvw'+(dirOn?' indir':'')+'"><div class="dnv" role="navigation" aria-label="'+E(((window.ARB_DOCS_CFG||{}).counterparties||{}).nav||'Контрагенты')+'">'+topSecs().map(function(s){return item(s,false)}).join('')+'<hr class="dnvhr"><div class="dnvh">'+E(D.title||'')+'</div>'+dirSecs().map(function(s){return item(s,true)}).join('')+'</div>';
 h+='<div class="dnvm">'+(dirOn?'<button type="button" class="dnvback" data-cpnav="'+E((topSecs()[0]||{}).id||'')+'">'+E(D.back||'‹')+'</button><div class="dnvdh">'+E(D.title||'')+'</div>'+seg(dirSecs()):seg(topSecs())+'<button type="button" class="dnvdir" data-cpnav="'+E((dirSecs()[0]||{}).id||'')+'">'+E(D.mobile_open||D.title||'')+'</button>')+'</div>';
 var t=allSecs().find(function(s){return s.id==sec})||{};
 h+='<section class="dnvc" data-sec="'+E(sec)+'"><h3 class="dnvct">'+(dirOn?'<span class="dnvpre">'+E(D.title||'')+' · </span>':'')+E(t.title||'')+(cnt(sec)?' <span class="dnvn">'+E(cnt(sec))+'</span>':'')+'</h3>'+o.body(sec)+'</section></div>';
 return h}
/* ---- меню сортировки и переключение разделов (делегирование на документ) ---- */
function closeAll(ex){[].forEach.call(document.querySelectorAll('.dsrtm:not([hidden]),.dexm:not([hidden])'),function(m){if(m===ex)return;m.hidden=true;var b=m.parentNode.querySelector('.dsrtb,.dexb');if(b)b.setAttribute('aria-expanded','false')})}
document.addEventListener('click',function(e){var t=e.target;if(!t.closest)return;
 if(t.closest('.dexm [data-cp]')){setTimeout(closeAll,0);return}
 var ob=t.closest('[data-cpsortopen],[data-cpmenu]');if(ob){e.preventDefault();e.stopPropagation();var m=ob.parentNode.querySelector('.dsrtm,.dexm');closeAll(m);m.hidden=!m.hidden;ob.setAttribute('aria-expanded',String(!m.hidden));if(!m.hidden){var c=m.querySelector('[aria-checked="true"]')||m.querySelector('button');if(c)c.focus()}return}
 var it=t.closest('[data-cpsort]');if(it){e.preventDefault();e.stopPropagation();var p=it.dataset.cpsort.split('|');setSort(p[0],p[1]);closeAll();if(DRAW)DRAW();return}
 var nv=t.closest('[data-cpnav]');if(nv&&window.ArbCP&&ArbCP.openSec){e.preventDefault();e.stopPropagation();ArbCP.openSec(nv.dataset.cpnav);var w=document.querySelector('.dnvw');if(w&&w.getBoundingClientRect().top<0)w.scrollIntoView({block:'start'});return}
 if(!t.closest('.dsrt,.dexw'))closeAll()},true);
document.addEventListener('keydown',function(e){if(e.key=='Escape'&&document.querySelector('.dsrtm:not([hidden]),.dexm:not([hidden])')){closeAll();return}
 var m=e.target.closest&&e.target.closest('.dsrtm,.dexm');if(m&&(e.key=='ArrowDown'||e.key=='ArrowUp')){e.preventDefault();var L=[].slice.call(m.querySelectorAll('button')),i=L.indexOf(e.target);L[(i+(e.key=='ArrowDown'?1:L.length-1))%L.length].focus()}});
window.ArbCpNav={on:function(){return !!(CF().sections||[]).length},render:render,alias:alias,grpCP:grpCP,grpType:grpType,dirTypes:dirTypes,misc:misc,secs:allSecs,isDir:isDir,first:first,
 sort:sortList,sortKey:sortKey,setSort:setSort,sortName:sortName,caseTs:caseTs,validTs:validTs,added:added,bar:bar,sortBtn:sortBtn,ioRow:ioRow,ui:UI,setDraw:function(f){DRAW=f},cfg:CF};
})();
