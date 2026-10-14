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
var SEL={prc:new Set(),fin:new Set(),eval:new Set()},mode=null,busy=false,CR={},CRT={};
var RET=window.ARB_RET||{retention_days:3,item_line:'Хранится до {until}',item_title:'',list_note:'',soon_hours:24,soon_color:'#FF9500'};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pl(n){var a=n%10,b=n%100;return n+' '+(a==1&&b!=11?'отчёт':a>=2&&a<=4&&(b<12||b>14)?'отчёта':'отчётов')}
function ok(){return typeof TOKEN!='undefined'&&TOKEN&&typeof REPO!='undefined'&&REPO&&!REPO.startsWith('/*')}
function ts(s){var m=/(\d{4})(\d\d)(\d\d)T?(\d\d)(\d\d)(\d\d)/.exec(s||'');return m?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5],+m[6]):null}
function msk(t){var d=new Date(t+3*36e5),p=function(n){return (n<10?'0':'')+n};return p(d.getUTCDate())+'.'+p(d.getUTCMonth()+1)+', '+p(d.getUTCHours())+':'+p(d.getUTCMinutes())}
async function loadCr(){if(!ok()||CRT.p&&Date.now()-CRT.p<60000)return;CRT.p=Date.now();try{var ix=JSON.parse(await ghRaw(L.prc.idx));Object.keys(ix).forEach(function(k){CR['prc:'+k]=ts(ix[k]&&ix[k].request_id)});paint()}catch(e){CRT.p=0}}
function created(k,id){return k=='prc'?CR['prc:'+id]:ts(id)}
var css='.adcb{flex:0 0 22px;width:22px;height:22px;border-radius:50%;border:2px solid var(--mut,#8a9);box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;margin:2px 10px 0 0;cursor:pointer;position:relative}.adcb:before{content:"";position:absolute;inset:-11px}'+
'.adcb.on{background:#14B8A6;border-color:#14B8A6}.adcb.on:after{content:"";width:5px;height:10px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:translateY(-1px) rotate(45deg)}'+
'.lot[data-ad]{display:flex;flex-wrap:wrap;align-items:flex-start}.lot[data-ad]>.row{flex:1 1 0;min-width:0}.lot[data-ad]>:not(.row):not(.adcb){flex:1 1 100%}'+
'.adret{font-size:12px;color:var(--mut,#8a9);display:flex;align-items:center;gap:4px;margin-top:2px}.adret.soon{color:'+RET.soon_color+'}.adnote{font-size:12px;color:var(--mut,#8a9);margin:0 0 8px}'+
'.adh{display:flex!important;align-items:center;gap:6px;position:sticky;top:var(--adtop,0px);z-index:4;padding:6px 0;margin-top:0;min-height:36px}.adh>.adt{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.adall{flex:0 0 auto;background:transparent!important;border:0!important;box-shadow:none!important;color:var(--acc2,#5EEAD4)!important;font-size:14px;font-weight:600;padding:0 8px;height:36px;min-height:36px;margin:0!important}.adall:disabled{opacity:.4}'+
'.adtop{flex:0 0 auto;height:36px;min-height:36px;padding:0 12px;margin:0!important;border-radius:10px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;transition:background .15s,color .15s}'+
'.adtop.off .adi{opacity:.5}.adtop.off{background:transparent!important;border:1px solid rgba(255,59,48,.5)!important;color:rgba(255,59,48,.5)!important;cursor:default}.adtop.on{background:#FF3B30!important;border:1px solid #FF3B30!important;color:#fff!important}.adtop:active{filter:brightness(.85)}'+
'#adbar{position:fixed;left:0;right:0;bottom:0;z-index:50;display:none;align-items:center;gap:10px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:var(--card,#10302a);border-top:1px solid #8884;box-shadow:0 -4px 16px #0004}'+
'#adbar b{flex:1;font-weight:600;min-width:0}.adred{background:transparent!important;color:#EF4444!important;border:1px solid #EF444466!important;font-weight:600;display:inline-flex;align-items:center;gap:6px}.adred:disabled{opacity:.45}'+
'#adbar .lbtn,#addlg .lbtn{margin:0}#addlg{border:0;border-radius:14px;padding:20px;max-width:340px;width:calc(100% - 40px);background:var(--card,#10302a);color:inherit}#addlg::backdrop{background:#0008}#addlg p{margin:0 0 16px}#addlg .r{display:flex;gap:10px;justify-content:flex-end}'+
'body.adon-any{padding-bottom:72px}';
var DL=Object.assign({icon:'🗑',btn:'Удалить',btn_n:'Удалить ({n})',hint_empty:'Отметьте отчёты',hint_n:'Удалить отмеченные отчёты: {n}',login:'Удаление доступно после входа (PIN).',confirm:'Удалить {reports}? Действие необратимо',select_all:'Выбрать все',unselect_all:'Снять все',bar_count:'Выбрано: {n}',bar_clear:'Снять'},window.ARB_DEL||{});
function F(s,o){return String(s).replace(/\{(\w+)\}/g,function(m,k){return o[k]!=null?o[k]:m})}
var TR='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>';
var CK='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
function setup(){
 if(!$('adcss')){var s=document.createElement('style');s.id='adcss';s.textContent=css;document.head.appendChild(s)}
 if(!$('adbar')){document.body.insertAdjacentHTML('beforeend','<div id="adbar"><b id="adn">Выбрано: 0</b><button class="lbtn sec" id="adcan">Снять</button><button class="lbtn adred" id="addel" disabled>'+TR+'<span id="addt">Удалить</span></button></div><dialog id="addlg"><p id="adq"></p><p class="sm" id="adm" style="margin-top:-8px"></p><div class="r"><button class="lbtn sec" id="adno">Отмена</button><button class="lbtn adred" id="adyes">Удалить</button></div></dialog>');
  $('adcan').onclick=function(){if(mode)SEL[mode].clear();paint()};$('addel').onclick=ask;$('adno').onclick=function(){if(!busy)$('addlg').close()};$('adyes').onclick=go}
 Object.keys(L).forEach(function(k){var l=$(L[k].list);if(!l)return;var h=null,n=l;
  while(n&&!h){n=n.previousElementSibling;if(n&&n.tagName=='H3')h=n}
  if(h&&!h.querySelector('.adall')){h.classList.add('adh');if(!h.querySelector('.adt')){var sp=document.createElement('span');sp.className='adt';while(h.firstChild)sp.appendChild(h.firstChild);h.appendChild(sp)}var b=document.createElement('button');b.type='button';b.className='lbtn sec adall';b.dataset.ad=k;b.textContent=DL.select_all;b.onclick=function(){var ids=allIds(k);var all=ids.length&&ids.every(function(i){return SEL[k].has(i)});if(!all)selk(k);ids.forEach(function(i){all?SEL[k].delete(i):SEL[k].add(i)});paint()};h.appendChild(b);var d=document.createElement('button');d.type='button';d.className='lbtn adtop off';d.dataset.ad=k;d.setAttribute('aria-disabled','true');d.onclick=function(){ask(k)};h.appendChild(d)}
  if(!l.dataset.adw){l.dataset.adw=1;l.addEventListener('click',function(e){var cb=e.target.closest('.adcb');if(!cb)return;e.preventDefault();e.stopPropagation();var id=cb.parentNode.dataset.ad;selk(k);SEL[k].has(id)?SEL[k].delete(id):SEL[k].add(id);paint()},true)}});
 loadCr();paint()}
function selk(k){if(mode&&mode!==k)SEL[mode].clear();mode=k}
function allIds(k){var l=$(L[k].list);if(!l)return[];return [].map.call(l.querySelectorAll('.lot[data-ad]:not(.pend)'),function(c){return c.dataset.ad})}
function stop(){Object.keys(SEL).forEach(function(k){SEL[k].clear()});mode=null;paint()}
function paint(){var now=Date.now(),D=RET.retention_days*864e5;
 Object.keys(L).forEach(function(k){var l=$(L[k].list);if(!l)return;
  var ids=new Set(allIds(k));
  l.querySelectorAll('.lot:not(.pend)').forEach(function(c){var id=c.getAttribute('data-'+L[k].attr);if(!id)return;ids.add(id);
   c.dataset.ad=id;var cb=c.querySelector(':scope>.adcb');if(!cb){cb=document.createElement('span');cb.className='adcb';cb.setAttribute('role','checkbox');cb.title='Отметить';c.insertBefore(cb,c.firstChild)}
   var on=SEL[k].has(id);if(cb.classList.contains('on')!==on)cb.classList.toggle('on',on);if(cb.getAttribute('aria-checked')!=String(on))cb.setAttribute('aria-checked',on);
   var t=created(k,id),d1=c.querySelector('.d1');if(t&&d1){var u=t+D,txt=RET.item_line.replace('{until}',msk(u)),r=c.querySelector('.adret'),soon=u-now<RET.soon_hours*36e5;
    if(!r||r.dataset.t!=txt||r.classList.contains('soon')!==soon){if(!r){r=document.createElement('div');r.className='adret';d1.insertAdjacentElement('afterend',r)}r.dataset.t=txt;r.className='adret'+(soon?' soon':'');r.title=(RET.item_title||'').replace('{until}',msk(u));r.innerHTML=CK+'<span>'+E(txt)+'</span>'}}});
  SEL[k].forEach(function(i){if(!ids.has(i))SEL[k].delete(i)});
  var nt=l.previousElementSibling;if(RET.list_note&&ids.size&&!(nt&&nt.classList.contains('adnote'))){var p=document.createElement('p');p.className='adnote';p.textContent=RET.list_note.replace('{days}',RET.retention_days);l.parentNode.insertBefore(p,l)}
  var b=document.querySelector('.adall[data-ad="'+k+'"]');if(b){var all=ids.size&&[].every.call([...ids],function(i){return SEL[k].has(i)});var tx=all?DL.unselect_all:DL.select_all;if(b.textContent!=tx)b.textContent=tx;b.disabled=!ids.size}
  var d=document.querySelector('.adtop[data-ad="'+k+'"]');if(d){var c=mode===k?SEL[k].size:0,lb=DL.icon+' '+(c?F(DL.btn_n,{n:c}):DL.btn),ti=c?F(DL.hint_n,{n:c}):DL.hint_empty;if(d.dataset.lb!=lb){d.dataset.lb=lb;d.innerHTML='<span class="adi">'+E(DL.icon)+'</span>'+E(c?F(DL.btn_n,{n:c}):DL.btn)}d.classList.toggle('on',!!c);d.classList.toggle('off',!c);if(d.getAttribute('aria-disabled')!=String(!c))d.setAttribute('aria-disabled',String(!c));if(d.title!=ti){d.title=ti;d.setAttribute('aria-label',ti)}
   var h=d.parentNode;if(h&&!h.dataset.adbg){var e=h.parentNode;while(e&&e!==document.documentElement){var bg=getComputedStyle(e).backgroundColor;if(bg&&bg!='transparent'&&!/rgba\([^)]*,\s*0\)$/.test(bg))break;e=e.parentNode}h.style.background=e&&e!==document.documentElement?getComputedStyle(e).backgroundColor:getComputedStyle(document.body).backgroundColor;h.dataset.adbg=1}}});
 var hd=document.querySelector('header'),ht=hd&&/sticky|fixed/.test(getComputedStyle(hd).position)?Math.round(hd.getBoundingClientRect().height):0;if(document.documentElement.style.getPropertyValue('--adtop')!=ht+'px')document.documentElement.style.setProperty('--adtop',ht+'px');
 var n=mode?SEL[mode].size:0,bar=$('adbar');if(bar){var vis=n&&$(L[mode].list)&&$(L[mode].list).offsetParent!==null;bar.style.display=vis?'flex':'none';document.body.classList.toggle('adon-any',!!vis);$('adn').textContent=F(DL.bar_count,{n:n});$('adcan').textContent=DL.bar_clear;$('addel').disabled=!n;$('addt').textContent=n?F(DL.btn_n,{n:n}):DL.btn}}
function ask(k){if(typeof k!='string')k=mode;if(!k||mode!==k||!SEL[k].size){toast(DL.hint_empty,3000);return}if(!ok()){toast(DL.login,4000);return}var n=SEL[mode].size;$('adq').textContent=F(DL.confirm,{reports:pl(n),n:n});$('adm').textContent='';$('adyes').disabled=false;$('adno').disabled=false;$('addlg').showModal()}
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
async function go(){if(busy||!mode||!SEL[mode].size)return;if(!ok()){$('adm').textContent='Нужен вход (PIN).';return}
 busy=true;var k=mode,ids=[].slice.call(SEL[mode]),n=ids.length;$('adyes').disabled=true;$('adno').disabled=true;$('adm').textContent='Удаляю…';
 try{var f;try{f=await commit(k,ids)}catch(e){if(e.status==422||e.status==409){$('adm').textContent='Повторяю…';f=await commit(k,ids)}else throw e}
  $('addlg').close();stop();toast('✓ Удалено: '+pl(n)+' (файлов: '+f+')',6000);await L[k].reload()}
 catch(e){var m=e.status==403||e.status==404?'Ключу GitHub не хватает прав на запись (Contents: Read and write).':e.message;$('adm').textContent='Не удалось: '+m;$('adyes').disabled=false}
 finally{busy=false;$('adno').disabled=false}}
function tick(){setup()}document.addEventListener('click',function(e){if(e.target.closest('nav button'))setTimeout(paint,50)});
var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(tick,80)}).observe(document.body,{childList:true,subtree:true});
addEventListener('load',tick);addEventListener('resize',function(){paint()});setTimeout(tick,500);
})();
