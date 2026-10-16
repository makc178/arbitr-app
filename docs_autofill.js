/* Arbitr App — автозаполнение полей документов из выбранных данных (отдельный модуль; docs.js не трогаем, он у лимита 200 КБ).
   Правила — только docs_config.json → af_fields.rules (поле ← источник). Источники:
   · dir — встроенный справочник органов (bank_data/addressees*.js: официальные открытые данные, у ФНС — data.nalog.ru, дата набора из файла):
           орган берётся по выбранному адресату (ключ dk) или по точному наименованию; код инспекции по цифрам ИНН не угадывается;
   · case_same — карточка должника (ЕГРЮЛ), только если в ней та же инспекция, что выбрана адресатом;
   · cp — карточка «Контрагентов», найденная по наименованию в поле key;
   · case_card — что карточка назначения АУ (docs_audeb.js) записала в дело (cs.data/cs.apf) для полей уровня документа.
   Где подставляется: один документ — через ArbDLR.ff (docs.js raw), пока поле не трогали руками; пакет — docs_batch.js pget/vget (крючки ArbAF.per/doc).
   Над подставленным полем — метка источника (тот же вид, что .dfxsrc в docs_dfx.js) «из справочника ФНС · ДД.ММ.ГГГГ»; если подставить нечего — кнопка «↻ Подтянуть» вместо «Заполните»
   и причина под полем. Ручной ввод не перезаписывается; «↻ Подтянуть» возвращает значение из источника. */
window.ArbAF=(function(){
 function C(){try{return (window.ArbFlow&&ArbFlow.C&&ArbFlow.C())||window.ARB_DOCS_CFG||{}}catch(e){return window.ARB_DOCS_CFG||{}}}
 function CF(){return C().af_fields||{}}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function T(k,o){var s=(CF().ui||{})[k];if(s==null)s='';o=o||{};Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function norm(x){return String(x==null?'':x).toLowerCase().replace(/ё/g,'е').replace(/№\s*/g,'№').replace(/[«»"'“”„.,]/g,' ').replace(/\s+/g,' ').trim()}
 function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[3]+'.'+m[2]+'.'+m[1]:String(x||'')}
 function fv(x){return x&&typeof x=='object'&&!Array.isArray(x)?x.value:x}
 function SS(){try{return window.__docsTest&&__docsTest.S()}catch(e){return null}}
 function curCaseObj(){var s=SS();if(!s||!s.cur)return null;return (s.cases||[]).find(function(x){return x.id==s.cur})||null}
 function caseData(){var s=SS();if(!s||!s.cur)return {};var c=(s.cases||[]).find(function(x){return x.id==s.cur});return (c&&c.data)||{}}
 function F(k){try{return ((window.__docsTest&&__docsTest.F())||{})[k]||{}}catch(e){return {}}}
 function rule(k){var R=CF().rules||[];for(var i=0;i<R.length;i++)if(R[i].field==k)return R[i];return null}
 /* ---- справочник органов: индекс по ключу адресата и по наименованию ---- */
 var IDX=null,IDXn=0,LD=0;
 function dirIdx(){var P=window.ArbCP;if(!P||!P.adReady||!P.dirOrg)return null;if(!P.adReady()){if(!LD&&P.addrLoad){LD=1;P.addrLoad().then(function(){LD=0;refresh()},function(){LD=0})}return null}
  if(IDX&&P.dirOrg(IDXn-1)&&!P.dirOrg(IDXn))return IDX;IDX={dk:{},nm:{}};var i=0,o;for(;(o=P.dirOrg(i));i++){IDX.dk[o.type+'|'+o.name]=o;var n=norm(o.name);(IDX.nm[n]=IDX.nm[n]||[]).push(o)}IDXn=i;return IDX}
 function dirDate(ty){var D=CF().dir_dates||{},g=window[D[ty]||D['*']];return g&&g.source_date?dmy(g.source_date):''}
 function lbl(k){var L=CF().src_labels||{};return L[k]||(/^case_card_/.test(k)?'':L['*'])||''}
 function pick(o,r){
  if(r.format){if((r.need||[]).some(function(a){return !String(fv(o[a])||'').trim()}))return '';
   return r.format.split(', ').filter(function(p){var m=p.match(/\{(\w+)\}/g)||[];return m.every(function(x){return String(fv(o[x.slice(1,-1)])||'').trim()})}).map(function(p){return p.replace(/\{(\w+)\}/g,function(_,a){return String(fv(o[a])).trim()})}).join(', ')}
  var j=function(L){return (L||[]).map(function(a){return String(fv(o[a])||'').trim()}).filter(Boolean).join(', ')};return j(r.attrs)||j(r.alt_attrs)}
 /* итог: {v, src} — есть значение; {why} — причина, почему не подставлено */
 function resolve(k,get,dk){var r=rule(k);if(!r)return null;var kv=r.key?String(get(r.key)||'').trim():'',why='';
  if(r.key&&!kv&&!dk)return {why:T('why_no_key',{f:F(r.key).label||r.key})};
  for(var i=0;i<(r.sources||[]).length;i++){var s=r.sources[i],v;
   if(s=='case_same'){var cd=caseData(),cv=String(fv(cd[k])||'').trim();if(cv&&kv&&norm(fv(cd[r.key]))==norm(kv))return {v:cv,src:lbl('case_same')};continue}
   if(s=='case_card'){var cs=curCaseObj(),cv2=cs&&cs.data?String(fv(cs.data[k])||'').trim():'';if(cv2){var ap=(cs.apf||{})[k]||{},dd=ap.d?dmy(ap.d):'',l2=lbl('case_card_'+(ap.s||''))||lbl('case_card');return {v:cv2,src:dd?T('src_fmt',{s:l2,d:dd}):l2}}why=why||T('why_no_card');continue}
   if(s=='dir'){var I=dirIdx();if(!I){why=why||T('why_loading');continue}var o=dk?I.dk[dk]:null;if(o&&r.types&&r.types.indexOf(o.type)<0)o=null;
    if(!o)o=(I.nm[norm(kv)]||[]).filter(function(x){return !r.types||r.types.indexOf(x.type)>=0})[0];
    if(!o){why=why||T('why_not_found',{n:kv});continue}v=pick(o,r);if(!v){why=T('why_no_attr',{n:o.name});continue}
    var d=dirDate(o.type);return {v:v,src:d?T('src_fmt',{s:lbl(o.type),d:d}):lbl(o.type),org:o}}
   if(s=='cp'){var P=window.ArbCP,c=P&&P.byName?P.byName(kv):null;if(!c){why=why||T('why_no_cp',{n:kv});continue}v=pick(c,r);if(!v){why=T('why_cp_empty',{n:kv});continue}return {v:v,src:lbl('cp')}}}
  return {why:why}}
 /* ---- пакет: значения для docs_batch.js ---- */
 function per(t,a,k){if(!rule(k)||!a)return null;var nm=a.dn||a.n;return resolve(k,function(){return nm},a.dk)}
 function doc(t,k,get){if(!rule(k))return null;return resolve(k,function(x){return get(x)||String(fv(caseData()[x])||'')})}
 /* ---- один документ: через ArbDLR.ff ---- */
 var LT={};
 function sget(tid){var d=((SS()||{}).drafts||{})[tid]||{};return function(x){var v=d[x];if(v!=null&&String(v).trim())return v;var cv=fv(caseData()[x]);if(cv)return cv;var el=document.getElementById('df_'+x)||document.getElementById('dc_'+x);return el?el.value:''}}
 function ff(k,tid){if(!rule(k))return null;LT[k]=tid;var s=SS(),d=((s||{}).drafts||{})[tid]||{};var g=sget(tid);if(Object.prototype.hasOwnProperty.call(d,k)){var m=d._af&&d._af[k];if(m==null||norm(m)==norm(g(rule(k).key)))return null;var r0=resolve(k,g);return r0&&r0.v?r0.v:''}var r=resolve(k,g);return r&&r.v?r.v:null}  // _af: значение подтянуто при другом адресате — пересчитать
 function hook(){var D=window.ArbDLR;if(!D||D.__af)return !!D;var o=D.ff;D.ff=function(k,tid){var v=o?o(k,tid):null;return v!=null?v:ff(k,tid)};D.__af=1;return true}
 /* ---- метки источника и «↻ Подтянуть» ---- */
 function css(){if(document.getElementById('af_css'))return;var st=document.createElement('style');st.id='af_css';
  st.textContent='.afw{position:relative}.afsrc{display:block;font-size:12px;color:var(--mut,#7a8a86);margin:0 0 2px;line-height:1.3}.afwhy{font-size:12px;opacity:.8;margin-top:3px;line-height:1.3}'+
   '.afpull{position:absolute;z-index:2;border:1px dashed currentColor;background:transparent;color:inherit;border-radius:8px;padding:3px 10px;font:inherit;font-size:14px;cursor:pointer;opacity:.85}.afpull:hover{opacity:1}'+
   '.afw:focus-within .afpull{display:none}';document.head.appendChild(st)}
 function info(i){var d=i.dataset;
  if(d.bper){var p=d.bper.split('|');return {k:p[p.length-1],get:function(){return p.slice(1,-1).join('|')}}}
  if(d.bk){var tid=d.btid;return {k:d.bk,get:function(x){var e=document.querySelector('[data-bk="'+x+'"][data-btid="'+tid+'"]')||document.querySelector('[data-bk="'+x+'"]');return (e&&e.value)||String(fv(caseData()[x])||'')}}}
  if(d.k&&/^df_/.test(i.id)&&LT[d.k])return {k:d.k,get:sget(LT[d.k])};return null}
 function deco(i){var f=info(i);if(!f||!rule(f.k))return;var w=i.parentNode;if(!w)return;var r=resolve(f.k,f.get)||{},val=String(i.value||'').trim(),sig=val+'|'+(r.v||'')+'|'+(r.why||'')+'|'+(r.src||'');
  if(i.dataset.afs==sig&&w.querySelector('.afsrc,.afpull'))return;i.dataset.afs=sig;w.classList.add('afw');w.querySelectorAll('.afsrc,.afpull,.afwhy').forEach(function(x){x.remove()});
  if(val){if(r.v&&(norm(val)==norm(r.v)||norm(val)==norm(dmy(r.v)))&&r.src){var s=document.createElement('div');s.className='dfxsrc afsrc';s.textContent=r.src;w.insertBefore(s,w.firstChild)}return}
  if(i.placeholder)i.dataset.afph=i.placeholder;i.placeholder=' ';
  var b=document.createElement('button');b.type='button';b.className='afpull';b.textContent=T('pull');b.style.top=(i.offsetTop+Math.max(0,(i.offsetHeight-30)/2))+'px';b.style.left=(i.offsetLeft+8)+'px';
  b.addEventListener('mousedown',function(e){e.preventDefault()});b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();pull(i,b)});
  i.insertAdjacentElement('afterend',b);if(r.why){var y=document.createElement('div');y.className='sm afwhy';y.textContent=r.why;b.insertAdjacentElement('afterend',y)}}
 function pull(i,b){var f=info(i);if(!f)return;var go=function(){var r=resolve(f.k,f.get)||{};if(r.v){i.value=iv(i,f.k,r.v);i.dataset.afs='';mark(i,f);i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(scan,30)}
   else{var w=i.parentNode,y=w&&w.querySelector('.afwhy');if(!y&&w){y=document.createElement('div');y.className='sm afwhy';b.insertAdjacentElement('afterend',y)}if(y)y.textContent=r.why||''}};
  var P=window.ArbCP;if(P&&P.addrLoad&&P.adReady&&!P.adReady())P.addrLoad().then(go,go);else go()}
 function iv(i,k,v){return i.type!='date'&&F(k).type=='date'&&/^\d{4}-\d\d-\d\d$/.test(v)?dmy(v):v}  // поле даты в виде ДД.ММ.ГГГГ
 function mark(i,f){if(!(i.dataset.k&&/^df_/.test(i.id)))return;var tid=LT[f.k],s=SS();if(!tid||!s)return;var d=s.drafts[tid]=s.drafts[tid]||{};(d._af=d._af||{})[f.k]=String(f.get(rule(f.k).key)||'')}
 function fillSingle(){document.querySelectorAll('#ded input[data-k],#ded textarea[data-k]').forEach(function(i){var f=info(i);if(!f||!rule(f.k)||String(i.value||'').trim())return;var d=(((SS()||{}).drafts||{})[LT[f.k]]||{});if(Object.prototype.hasOwnProperty.call(d,f.k))return;var r=resolve(f.k,f.get)||{};if(!r.v)return;i.value=iv(i,f.k,r.v);i.dataset.afs='';mark(i,f);i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))})}
 var ST=0;function scan(){clearTimeout(ST);ST=setTimeout(function(){var R=CF().rules||[];if(!R.length)return;css();
  var q=[];R.forEach(function(r){var k=String(r.field).replace(/"/g,'');q.push('[data-bper$="|'+k+'"]','[data-bk="'+k+'"]','#ded [data-k="'+k+'"]')});
  document.querySelectorAll(q.join(',')).forEach(function(i){if(/INPUT|TEXTAREA/.test(i.tagName))try{deco(i)}catch(e){}})},40)}
 function refresh(){try{if(window.ArbBatch&&ArbBatch.active&&ArbBatch.active())ArbBatch.refresh();else fillSingle()}catch(e){}scan()}  // справочник догрузился — один документ получает значения сразу (с пересчётом счётчиков docs.js)
 function start(){hook();css();var v=document.getElementById('vdocs')||document.body;new MutationObserver(function(m){if(m.some(function(x){return [].some.call(x.addedNodes,function(n){return n.nodeType==1&&!(n.classList&&(n.classList.contains('afsrc')||n.classList.contains('afpull')||n.classList.contains('afwhy')))})}))scan()}).observe(v,{childList:true,subtree:true});
  document.addEventListener('input',function(e){var t=e.target;if(t&&t.dataset&&(t.dataset.bper||t.dataset.bk||t.dataset.k))scan()},true);scan()}
 if(!hook())setTimeout(hook,0);if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',start);else start();
 return {resolve:resolve,per:per,doc:doc,ff:ff,scan:scan,rule:rule,_norm:norm}
})();
