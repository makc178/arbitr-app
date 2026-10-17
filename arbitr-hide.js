/* Arbitr: список удалённых пользователем отчётов и запросов («надгробия»).
   Удаление в Arbitr не стирает файлы закрытого репозитория: id попадают сюда и скрываются во всех списках,
   счётчиках и в «в обработке». Копия на устройстве — только хэши id (localStorage), полный список — в закрытом
   репозитории (путь из arbitr_config.json → delete.tombstones.path), чтобы удаление держалось на всех устройствах. */
(function(){
var C=Object.assign({path:'arbitr/deleted.json',local_key:'arbitr_deleted_v1',schema:'arbitr/deleted/v1',sync_s:60},((window.ARB_DEL||{}).tombstones)||{});
function h(s){s=String(s);var a=0x811c9dc5,b=0x9747b28c;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);a=Math.imul(a^c,16777619)>>>0;b=Math.imul(b^c,2246822519)>>>0;b=(b^(b>>>13))>>>0}return a.toString(36)+b.toString(36)}
var H=new Set(),RAW=null,last=0,loading=null;
function key(k,id){return h(k+':'+id)}
function rd(){try{var v=JSON.parse(localStorage.getItem(C.local_key)||'[]');if(Array.isArray(v))v.forEach(function(x){H.add(x)})}catch(e){}}
function wr(){try{localStorage.setItem(C.local_key,JSON.stringify(Array.from(H)))}catch(e){}}
rd();
function ok(){return typeof TOKEN!='undefined'&&TOKEN&&typeof REPO!='undefined'&&REPO&&!String(REPO).startsWith('/*')}
async function api(path,o){o=o||{};var r=await fetch('https://api.github.com/repos/'+REPO+'/contents/'+path+(o.method?'':'?ref='+encodeURIComponent(BRANCH)+'&_='+Date.now()),Object.assign({},o,{headers:{Authorization:'Bearer '+clean(TOKEN),Accept:'application/vnd.github+json','Content-Type':'application/json'},cache:'no-store'}));
 if(r.status==404&&!o.method)return null;if(!r.ok){var t='';try{t=(await r.json()).message||''}catch(e){}var er=new Error('GitHub '+r.status+(t?': '+t:''));er.status=r.status;throw er}return r.json()}
function dec(c){return decodeURIComponent(escape(atob(String(c||'').replace(/\s/g,''))))}
function enc(s){return btoa(unescape(encodeURIComponent(s)))}
async function fetchRaw(){var j=await api(C.path);if(!j)return {sha:null,d:{schema:C.schema,items:[]}};var d={schema:C.schema,items:[]};try{d=JSON.parse(dec(j.content))}catch(e){}if(!Array.isArray(d.items))d.items=[];return {sha:j.sha,d:d}}
function apply(items){(items||[]).forEach(function(x){if(x&&x.k&&x.id)H.add(key(x.k,x.id))})}
/* подтянуть список из репозитория (не чаще sync_s), объединить с устройством */
async function load(force){if(!ok())return;if(!force&&Date.now()-last<C.sync_s*1000)return;if(loading)return loading;
 loading=(async function(){try{var r=await fetchRaw();RAW=r;apply(r.d.items);wr();last=Date.now()}catch(e){}finally{loading=null}})();return loading}
/* записать изменения в репозиторий: add — новые надгробия, del — снятые (отмена/ошибка) */
async function push(add,del,msg){var dk=new Set((del||[]).map(function(x){return x.k+':'+x.id}));
 for(var att=0;;att++){var r=await fetchRaw(),have=new Set(r.d.items.map(function(x){return x.k+':'+x.id}));
  var items=r.d.items.filter(function(x){return !dk.has(x.k+':'+x.id)});(add||[]).forEach(function(x){if(!have.has(x.k+':'+x.id))items.push(x)});
  var body={message:msg||'arbitr: список удалённых',content:enc(JSON.stringify({schema:C.schema,items:items},null,1)+'\n'),branch:BRANCH};if(r.sha)body.sha=r.sha;
  try{await api(C.path,{method:'PUT',body:JSON.stringify(body)});RAW={d:{schema:C.schema,items:items}};last=Date.now();return}
  catch(e){if(att<2&&(e.status==409||e.status==422))continue;throw e}}}
function addLocal(items){apply(items);wr()}
function removeLocal(items){(items||[]).forEach(function(x){H.delete(key(x.k,x.id))});wr()}
window.ArbHide={has:function(k,id){return id!=null&&H.has(key(k,id))},req:function(id){return !!id&&H.has(key('req',id))},
 hidden:function(k,id,rid){return this.has(k,id)||this.req(rid)},load:load,push:push,addLocal:addLocal,removeLocal:removeLocal,
 size:function(){return H.size},cfg:C};
})();
