/* Arbitr: выбор и удаление отчётов (Судебная практика, Финанализ, Оценка).
   Удаляет файлы и записи индекса в закрытом репозитории одним коммитом через ключ GitHub пользователя (после PIN). */
(function(){
var $=function(i){return document.getElementById(i)};
var L={prc:{list:'prcl',attr:'pn',idx:'practice/index.json',reload:function(){return prcList()}},
       fin:{list:'finl',attr:'fc',idx:'finance/index.json',reload:function(){return finList()}},
       eval:{list:'evl',attr:'vk',idx:'valuation/index.json',reload:function(){return window.EVAL_LIST&&window.EVAL_LIST()}}};
/* разрешённые к удалению пути; всё остальное (reports/, lots, индексы целиком и т.д.) удалить нельзя */
var ALLOW=[/^practice\/[^\/]+\.(pdf|docx|md)$/i,/^finance\/F[\w\-]+\/.+$/,/^valuation\/\d{8}T\d{6}Z-ev-[a-z0-9]+\/.+$/];
var KEYRE={prc:/^[^\/\\]+\.(pdf|docx|md)$/i,fin:/^F[\w\-]+$/,eval:/^\d{8}T\d{6}Z-ev-[a-z0-9]+$/};
var mode=null,SEL=new Set(),busy=false;
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pl(n){var a=n%10,b=n%100;return n+' '+(a==1&&b!=11?'отчёт':a>=2&&a<=4&&(b<12||b>14)?'отчёта':'отчётов')}
function ok(){return typeof TOKEN!='undefined'&&TOKEN&&typeof REPO!='undefined'&&REPO&&!REPO.startsWith('/*')}
var css='.adsel{margin-left:auto;font-size:13px;padding:5px 12px;min-height:32px}.adh{display:flex;align-items:center;gap:8px}'+
'.adcb{flex:0 0 22px;width:22px;height:22px;border-radius:50%;border:2px solid var(--mut,#8a9);box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;margin-right:10px;align-self:center;cursor:pointer}'+
'.adcb.on{background:#14B8A6;border-color:#14B8A6}.adcb.on:after{content:"";width:5px;height:10px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:translateY(-1px) rotate(45deg)}'+
'.adon .lot[data-ad]{display:flex;align-items:flex-start;cursor:pointer}.adon .lot[data-ad]>.row{flex:1;min-width:0}.adon .lot[data-ad]>.pcard{display:none}.adon .lot[data-ad] button{pointer-events:none}'+
'#adbar{position:fixed;left:0;right:0;bottom:0;z-index:50;display:none;align-items:center;gap:10px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:var(--card,#10302a);border-top:1px solid #8884;box-shadow:0 -4px 16px #0004}'+
'#adbar b{flex:1;font-weight:600}.adred{background:#DC2626!important;color:#fff!important;border-color:#DC2626!important;display:inline-flex;align-items:center;gap:6px}.adred:disabled{opacity:.45}'+
'#adbar .lbtn,#addlg .lbtn{margin:0}#addlg{border:0;border-radius:14px;padding:20px;max-width:340px;width:calc(100% - 40px);background:var(--card,#10302a);color:inherit}#addlg::backdrop{background:#0008}#addlg p{margin:0 0 16px}#addlg .r{display:flex;gap:10px;justify-content:flex-end}'+
'body.adon-any{padding-bottom:72px}';
var TR='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>';
function setup(){
 if(!$('adcss')){var s=document.createElement('style');s.id='adcss';s.textContent=css;document.head.appendChild(s)}
 if(!$('adbar')){document.body.insertAdjacentHTML('beforeend','<div id="adbar"><b id="adn">Выбрано: 0</b><button class="lbtn adred" id="addel" disabled>'+TR+'Удалить</button><button class="lbtn sec" id="adcan">Отмена</button></div><dialog id="addlg"><p id="adq"></p><p class="sm" id="adm" style="margin-top:-8px"></p><div class="r"><button class="lbtn sec" id="adno">Отмена</button><button class="lbtn adred" id="adyes">Удалить</button></div></dialog>');
  $('adcan').onclick=function(){stop()};$('addel').onclick=ask;$('adno').onclick=function(){if(!busy)$('addlg').close()};$('adyes').onclick=go}
 Object.keys(L).forEach(function(k){var l=$(L[k].list);if(!l)return;var w=l.parentNode,h=null,n=l;
  while(n&&!h){n=n.previousElementSibling;if(n&&n.tagName=='H3')h=n}
  if(h&&!h.querySelector('.adsel')){h.classList.add('adh');h.style.display='flex';var b=document.createElement('button');b.type='button';b.className='lbtn sec adsel';b.dataset.ad=k;b.textContent='Выбрать';b.onclick=function(){mode===k?stop():start(k)};h.appendChild(b)}
  if(!l.dataset.adw){l.dataset.adw=1;l.addEventListener('click',function(e){if(mode!==k)return;var c=e.target.closest('.lot[data-ad]');if(!c)return;e.preventDefault();e.stopPropagation();var id=c.dataset.ad;SEL.has(id)?SEL.delete(id):SEL.add(id);paint()},true)}});
 paint()}
function start(k){if(!ok()){toast('Удаление доступно после входа (PIN).',4000);return}stop();mode=k;SEL.clear();paint()}
function stop(){mode=null;SEL.clear();paint()}
function paint(){Object.keys(L).forEach(function(k){var l=$(L[k].list);if(!l)return;var on=mode===k;l.classList.toggle('adon',on);
  var b=document.querySelector('.adsel[data-ad="'+k+'"]');if(b)b.textContent=on?'Готово':'Выбрать';
  l.querySelectorAll('.lot:not(.pend)').forEach(function(c){var id=c.getAttribute('data-'+L[k].attr);if(!id)return;
   var cb=c.querySelector(':scope>.adcb');
   if(on){c.dataset.ad=id;if(!cb){cb=document.createElement('span');cb.className='adcb';cb.setAttribute('role','checkbox');c.insertBefore(cb,c.firstChild)}cb.classList.toggle('on',SEL.has(id));cb.setAttribute('aria-checked',SEL.has(id))}
   else{delete c.dataset.ad;if(cb)cb.remove()}})});
 var bar=$('adbar');if(bar){bar.style.display=mode?'flex':'none';document.body.classList.toggle('adon-any',!!mode);$('adn').textContent='Выбрано: '+SEL.size;$('addel').disabled=!SEL.size}}
function ask(){if(!SEL.size)return;$('adq').textContent='Удалить '+pl(SEL.size)+'? Действие необратимо';$('adm').textContent='';$('adyes').disabled=false;$('adno').disabled=false;$('addlg').showModal()}
async function gh(path,o){o=o||{};var r=await fetch('https://api.github.com/repos/'+REPO+'/'+path,Object.assign({},o,{headers:{Authorization:'Bearer '+clean(TOKEN),Accept:'application/vnd.github+json','Content-Type':'application/json'},cache:'no-store'}));
 if(!r.ok){var t='';try{t=(await r.json()).message||''}catch(e){}var er=new Error('GitHub '+r.status+(t?': '+t:''));er.status=r.status;throw er}return r.json()}
function b64(s){return btoa(unescape(encodeURIComponent(s)))}
async function commit(k,ids){
 var ref=await gh('git/ref/heads/'+BRANCH),head=ref.object.sha,cm=await gh('git/commits/'+head),tr=await gh('git/trees/'+cm.tree.sha+'?recursive=1');
 if(tr.truncated)throw new Error('слишком большое дерево репозитория');
 var files=tr.tree.filter(function(x){return x.type=='blob'}).map(function(x){return x.path}),fs=new Set(files);
 var ix=JSON.parse(await ghRaw(L[k].idx)),del=[];
 ids.forEach(function(id){if(!KEYRE[k].test(id))throw new Error('недопустимый отчёт: '+id);
  if(k=='prc'){var p='practice/'+id;if(fs.has(p))del.push(p)}
  else{var dir=(k=='fin'?'finance/':'valuation/')+id+'/';files.forEach(function(p){if(p.indexOf(dir)===0)del.push(p)})}});
 del.forEach(function(p){if(!ALLOW.some(function(r){return r.test(p)})||/(^|\/)index\.json$/.test(p))throw new Error('путь не разрешён к удалению: '+p)});
 var n0=0,nx;
 if(Array.isArray(ix)){n0=ix.length;nx=ix.filter(function(e){var id=e&&(e.request_id||e.case_id||e.id);return ids.indexOf(id)<0});var gone=n0-nx.length}
 else{nx={};var gone=0;Object.keys(ix).forEach(function(key){var e=ix[key],id=key;if(k=='eval'&&e&&e.request_id)id=e.request_id;if(ids.indexOf(id)>=0||ids.indexOf(key)>=0)gone++;else nx[key]=e})}
 if(!del.length&&!gone)throw new Error('нечего удалять — список устарел, обновите');
 var t=del.map(function(p){return {path:p,mode:'100644',type:'blob',sha:null}});
 t.push({path:L[k].idx,mode:'100644',type:'blob',content:JSON.stringify(nx,null,1)+'\n'});
 var nt=await gh('git/trees',{method:'POST',body:JSON.stringify({base_tree:cm.tree.sha,tree:t})});
 var nc=await gh('git/commits',{method:'POST',body:JSON.stringify({message:'arbitr: удалено '+pl(ids.length)+' ('+L[k].idx.split('/')[0]+')',tree:nt.sha,parents:[head]})});
 await gh('git/refs/heads/'+BRANCH,{method:'PATCH',body:JSON.stringify({sha:nc.sha,force:false})});return del.length}
async function go(){if(busy||!mode||!SEL.size)return;if(!ok()){$('adm').textContent='Нужен вход (PIN).';return}
 busy=true;var k=mode,ids=[].slice.call(SEL),n=ids.length;$('adyes').disabled=true;$('adno').disabled=true;$('adm').textContent='Удаляю…';
 try{var f;try{f=await commit(k,ids)}catch(e){if(e.status==422||e.status==409){$('adm').textContent='Повторяю…';f=await commit(k,ids)}else throw e}
  $('addlg').close();stop();toast('✓ Удалено: '+pl(n)+' (файлов: '+f+')',6000);await L[k].reload()}
 catch(e){var m=e.status==403||e.status==404?'Ключу GitHub не хватает прав на запись (Contents: Read and write).':e.message;$('adm').textContent='Не удалось: '+m;$('adyes').disabled=false}
 finally{busy=false;$('adno').disabled=false}}
function tick(){setup()}
var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(tick,80)}).observe(document.body,{childList:true,subtree:true});
addEventListener('load',tick);setTimeout(tick,500);
})();
