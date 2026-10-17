/* Arbitr App — PIN раздела «Бланки и подписи» (бланки, загрузка бланков, подписи-факсимиле).
   · PIN раздела (4 цифры) хранится ТОЛЬКО как солёный хеш PBKDF2-SHA256 в записи настроек раздела arbitr/ua/lock.enc
     закрытого репозитория; сама запись дополнительно зашифрована основным PIN (как всё хранилище). Открытого PIN нет нигде.
   · Файлы раздела зашифрованы ключом данных DK (AES-256-GCM); DK обёрнут ключом из PIN раздела (PBKDF2 → AES-GCM),
     а сверху каждый файл зашифрован основным PIN: arbitr/ua/f_*.enc (встроенная карточка) и записи _ua_* в IndexedDB (свои бланки/подписи).
   · Пока PIN раздела не введён, файлы раздела не загружаются и не расшифровываются (docs.js auLoad → ArbUAL.gate).
   · 3 неверные попытки → пауза ua_lock.block_s (30 с) с обратным отсчётом (счётчик в localStorage, без ПДн). Автоблокировка: уход со страницы/вкладки, 5 мин бездействия.
   · Честно: 4 цифры — 10 000 вариантов. Тот, у кого уже есть основной PIN и доступ к репозиторию, переберёт их офлайн
     (счётчик попыток защищает только интерфейс). PIN раздела — защита от постороннего у открытого приложения, а не криптостойкий секрет.
   Настройки и тексты — docs_config.json → ua_lock. Крючки в docs.js: auLoad (gate), drawMgr (sec), mgrSave (свои файлы раздела не пишутся в карточку), window.ArbUAD. */
(function(){
 var ST='none',LK=null,LKSHA=null,DK=null,LAST=Date.now(),IDX=null,BUSY=false,PAD=null,TEST={};
 function D(){return window.ArbUAD}function A(){return (window.ArbCP&&ArbCP.qapi&&ArbCP.qapi().A)||{}}
 function K(){var c=(A().C&&A().C())||{};return c.ua_lock||{}}
 function U(k,o){var s=((K().ui||{})[k])||k;o=o||{};Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function P(){return K().path||'arbitr/ua/'}function IT(){return +K().iterations||600000}
 var te=new TextEncoder(),td=new TextDecoder();
 function b64(u){u=new Uint8Array(u);var s='';for(var i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)}
 function ub(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})}
 function rnd(n){return crypto.getRandomValues(new Uint8Array(n))}
 async function pb(pin,salt,bits){var k=await crypto.subtle.importKey('raw',te.encode(String(pin)),'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:IT()},k,bits||256))}
 async function aes(raw,use){return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,use||['encrypt','decrypt'])}
 async function gcmE(key,data){var iv=rnd(12),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,data)),o=new Uint8Array(12+ct.length);o.set(iv);o.set(ct,12);return o}
 async function gcmD(key,buf){buf=new Uint8Array(buf);return crypto.subtle.decrypt({name:'AES-GCM',iv:buf.subarray(0,12)},key,buf.subarray(12))}
 function same(a,b){if(a.length!=b.length)return false;var d=0;for(var i=0;i<a.length;i++)d|=a[i]^b[i];return d===0}
 /* внешний слой — основной PIN (формат arbitr/au) */
 async function outE(bytes){var vs=A().vaultSalt(),e=await A().venc(bytes,vs.s,vs.it);return JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(e.iv),ct:b64(new Uint8Array(e.ct))})}
 async function outD(txt){return A().vdec(txt)}
 /* GitHub (закрытый репозиторий): только arbitr/ua/* (WRITE_OK) и удаление старых копий arbitr/au/lh*,sig* (DEL_OK) */
 async function gGet(path){var r=await ghApi(path);if(r.status==404)return null;if(!r.ok)throw new Error('GitHub '+r.status);var j=await r.json();return {txt:td.decode(ub(String(j.content||'').replace(/\s/g,''))),sha:j.sha}}
 async function gPut(path,txt,sha,msg){var body={message:msg||('arbitr ua '+path.split('/').pop()),branch:typeof BRANCH!='undefined'?BRANCH:'main',content:b64(te.encode(txt))};if(sha)body.sha=sha;var r=await ghApi(path,{method:'PUT',body:JSON.stringify(body)});if(!r.ok)throw new Error('GitHub '+r.status);try{return (await r.json()).content.sha}catch(e){return null}}
 /* устройство: IndexedDB arbitr_local/managers, записи с «_» карточками не читаются */
 async function dGet(id){try{var r=await ArbDB.get('managers',id);return r&&r.id===id?r:null}catch(e){return null}}
 async function dPutEnc(id,bytes){return ArbDB.put('managers',{id:id,m:await ArbArch.enc(bytes)})}
 async function dDecRec(r){return new Uint8Array(await ArbArch.dec(r.m))}
 /* попытки */
 function att(){try{return JSON.parse(localStorage.getItem('arbitr_ua_att')||'{}')||{}}catch(e){return {}}}
 function attSet(o){localStorage.setItem('arbitr_ua_att',JSON.stringify(o))}
 function blockedFor(){var a=att();return a.until&&a.until>Date.now()?Math.ceil((a.until-Date.now())/1000):0}
 function fail(){var a=att(),n=(a.n||0)+1,max=+K().max_attempts||3;if(n>=max){attSet({n:0,until:Date.now()+(+K().block_s||30)*1000})}else attSet({n:n,until:0});return n>=max}
 /* ---------- состояние ---------- */
 async function gate(man){if(K().enabled===false)return false;var dev=!!(await dGet('_ua_lock')),rem=null;try{rem=await gGet(P()+'lock.enc')}catch(e){}
  if(rem){LK={txt:rem.txt};LKSHA=rem.sha}if(rem||dev){ST=DK?'open':'locked';return true}ST='none';return false}
 async function lockRec(){var txt=LK&&LK.txt;if(!txt){var r=null;try{r=await gGet(P()+'lock.enc')}catch(e){}if(r){txt=r.txt;LKSHA=r.sha}}
  if(!txt){var d=await dGet('_ua_lock');if(d)return JSON.parse(td.decode(await dDecRec(d)))}if(!txt)throw new Error(U('no_lock'));LK={txt:txt};return JSON.parse(td.decode(await outD(txt)))}
 async function check(rec,pin){var h=await pb(pin,ub(rec.sh));return same(h,ub(rec.h))}
 async function unwrap(rec,pin){var kek=await aes(await pb(pin,ub(rec.sw)),['decrypt']);return aes(new Uint8Array(await gcmD(kek,ub(rec.wk))),['encrypt','decrypt'])}
 async function mkRec(pin,dkRaw,files){var sh=rnd(16),sw=rnd(16),h=await pb(pin,sh),kek=await aes(await pb(pin,sw),['encrypt']);
  return {v:1,kdf:'PBKDF2-SHA256',it:IT(),sh:b64(sh),h:b64(h),sw:b64(sw),wk:b64(await gcmE(kek,dkRaw)),files:files||[],at:new Date().toISOString()}}
 async function saveRec(rec){var bytes=te.encode(JSON.stringify(rec)),txt=await outE(bytes);LKSHA=await gPut(P()+'lock.enc',txt,LKSHA,'arbitr ua lock');LK={txt:txt};await dPutEnc('_ua_lock',bytes)}
 function mgrs(){return (A().MGR&&A().MGR())||[]}
 function own(x){return x&&!x.builtin}
 async function idxLoad(){var r=await dGet('_ua_idx');IDX=r?JSON.parse(td.decode(await dDecRec(r))):{};return IDX}
 async function idxSave(){await dPutEnc('_ua_idx',te.encode(JSON.stringify(IDX||{})))}
 /* открыть: файлы раздела загружаются и расшифровываются только здесь */
 async function open(pin){var rec=await lockRec();if(!(await check(rec,pin)))return false;DK=await unwrap(rec,pin);attSet({});var d=D(),AU=d.AU;
  for(var i=0;i<(rec.files||[]).length;i++){var f=rec.files[i];try{var data=await gcmD(DK,await outD(await d.gr(P()+f.file)));
    if(f.kind=='lh'){AU.lh=AU.lh.filter(function(x){return x.id!=f.id});var l=await d.lm({id:f.id,name:f.name,type:f.type,builtin:true,data:data,size:data.byteLength,added:0});l.ua=1;AU.lh.push(l)}
    else{AU.sig=AU.sig.filter(function(x){return x.id!=f.id});var g=await d.sm({id:f.id,name:f.name,builtin:true,data:data,order:f.order||i});g.ua=1;AU.sig.push(g)}}catch(e){console.warn('ua file',f.id,e)}}
  await idxLoad();var DV=d.D();for(var mid in IDX){var tgt=DV[mid];if(!tgt&&mid=='au_builtin')tgt=DV.au_builtin={id:'au_builtin',builtin:true,f:{},fed:'',lhv:{},lhT:{},sigSel:'',lh:[],sig:[]};if(!tgt)continue;
   for(var j=0;j<IDX[mid].length;j++){var x=IDX[mid][j],r=await dGet('_ua_'+x.id);if(!r)continue;try{var dd=await gcmD(DK,await dDecRec(r)),it;
     if(x.kind=='lh')it=await d.lm({id:x.id,name:x.name,type:x.type,size:x.size,added:x.added,data:dd});else it=await d.sm({id:x.id,name:x.name,data:dd,added:x.added});it.ua=1;
     var arr=x.kind=='lh'?tgt.lh:tgt.sig;if(!arr.some(function(y){return y.id==x.id}))arr.push(it)}catch(e){console.warn('ua dev',x.id,e)}}}
  ST='open';LAST=Date.now();d.mc();edSync();return true}
 function lock(why){if(ST!='open')return;var d=D();sweep(true).catch(function(){}).then(function(){DK=null;ST='locked';var f=function(x){if(x.ua&&x.url){try{URL.revokeObjectURL(x.url)}catch(e){}x.url=''}return !x.ua},AU=d.AU;AU.lh=AU.lh.filter(f);AU.sig=AU.sig.filter(f);var DV=d.D();
   Object.keys(DV).forEach(function(k){var m=DV[k];if(m.lh)m.lh=m.lh.filter(f);if(m.sig)m.sig=m.sig.filter(f)});mgrs().forEach(function(m){m.lh=m.lh.filter(f);m.sig=m.sig.filter(f)});d.mc();edSync();TEST.lastLock=why||''})}
 /* свои загруженные бланки/подписи → записи _ua_* (DK + основной PIN); в карточке (managers) их больше нет */
 async function sweep(quiet){if(!DK||BUSY||!(window.ArbArch&&!ArbArch.locked()))return;BUSY=true;try{if(!IDX)await idxLoad();var d=D(),ch=false,seen={};
  for(var i=0;i<mgrs().length;i++){var m=mgrs()[i],mid=m.id,L=[],mod=false;['lh','sig'].forEach(function(k){(m[k]||[]).forEach(function(x){if(own(x))L.push([k,x])})});
   for(var j=0;j<L.length;j++){var k=L[j][0],x=L[j][1];seen[x.id]=1;if(!x.ua){await dPutEnc('_ua_'+x.id,await gcmE(DK,x.data.slice(0)));x.ua=1;mod=true}}
   var list=L.map(function(q){var x=q[1];return {id:x.id,kind:q[0],name:x.name,type:x.type,size:x.size,added:x.added}});if(JSON.stringify(list)!=JSON.stringify(IDX[mid]||[])){IDX[mid]=list;ch=true}
   if(mod)await d.sv(m)}
  Object.keys(IDX).forEach(function(mid){if(!mgrs().some(function(m){return m.id==mid})){delete IDX[mid];ch=true}});
  var all=[];try{all=await ArbDB.all('managers')}catch(e){}for(var a=0;a<all.length;a++){var id=String(all[a].id);if(/^_ua_(?!lock$|idx$)/.test(id)&&!seen[id.slice(4)])await ArbDB.del('managers',id)}
  if(ch)await idxSave()}finally{BUSY=false}}
 /* первая настройка: перенос встроенных бланков/подписей и своих файлов под PIN раздела */
 async function setup(pin){var d=D(),AU=d.AU,dk=rnd(32);DK=await aes(dk,['encrypt','decrypt']);var files=[],old=[];
  var src=AU.lh.map(function(x){return ['lh',x]}).concat(AU.sig.map(function(x){return ['sig',x]})).filter(function(q){return q[1].builtin&&!q[1].ua&&q[1].data});
  for(var i=0;i<src.length;i++){var k=src[i][0],x=src[i][1],fn='f_'+ArbDB.uid('').replace(/[^\w]/g,'')+'.enc';
   await gPut(P()+fn,await outE(await gcmE(DK,x.data.slice(0))),null,'arbitr ua file');files.push({id:x.id,kind:k,name:x.name,type:x.type||'',file:fn,order:i});old.push('arbitr/au/'+String(x.id).replace(/^au_/,'')+'.enc')}
  var rec=await mkRec(pin,dk,files);dk.fill(0);await saveRec(rec);
  /* проверка цепочки до удаления старых копий */
  var back=JSON.parse(td.decode(await outD((await gGet(P()+'lock.enc')).txt)));if(!(await check(back,pin)))throw new Error(U('verify_fail'));
  if(files.length){var v=await gcmD(await unwrap(back,pin),await outD(await d.gr(P()+files[0].file)));if(!v.byteLength)throw new Error(U('verify_fail'))}
  src.forEach(function(q){q[1].ua=1});ST='open';LAST=Date.now();IDX=IDX||{};await sweep(true);
  var rm=0;if(K().remove_old_copies!==false&&typeof ghDelete=='function')for(var j=0;j<old.length;j++){try{await ghDelete(old[j]);rm++}catch(e){console.warn('ua rm',old[j],e)}}
  TEST.setup={files:files.length,removed:rm};d.mc();edSync();return rec}
 async function change(cur,nw){var rec=await lockRec();if(!(await check(rec,cur)))return false;var kek=await aes(await pb(cur,ub(rec.sw)),['decrypt']),dk=new Uint8Array(await gcmD(kek,ub(rec.wk)));
  var r2=await mkRec(nw,dk,rec.files);dk.fill(0);r2.changed=new Date().toISOString();await saveRec(r2);attSet({});return true}
 /* ---------- интерфейс ---------- */
 function edSync(){var d=D();if(!d)return;var ed=d.ed();if(ed){var m=mgrs().find(function(x){return x.id==ed.id});if(m){ed.lh=m.lh.slice();ed.sig=m.sig.slice()}d.dr()}try{if(A().refresh)A().refresh()}catch(e){}}
 function sec(m,drawLH,drawSig){if(K().enabled===false)return drawLH(m)+drawSig(m);
  if(ST=='locked'){setTimeout(place,0);return '<i data-ual-slot hidden></i>'}
  if(ST=='open')return '<div class="dual dualon"><div class="dualbar"><span>🔓 '+E(U('opened'))+'</span><button type="button" class="lbtn sec" data-ual="change">'+E(U('change'))+'</button><button type="button" class="lbtn sec" data-ual="close">'+E(U('close'))+'</button></div>'+drawLH(m)+drawSig(m)+'</div>';
  return drawLH(m)+drawSig(m)+'<div class="dual dualset"><button type="button" class="lbtn sec" data-ual="setup">🔒 '+E(U('setup'))+'</button><p class="sm">'+E(U('setup_hint'))+'</p></div>'}
 /* строка «Служебные материалы» — внизу карточки, перед кнопками «Сохранить/Отмена» */
function place(){var s=document.querySelector('[data-ual-slot]');if(!s||ST!='locked')return;var root=s.closest('form,.dmgr,.card,section')||s.parentNode,old=document.querySelector('[data-ual=row]');if(old)old.remove();
 var row=document.createElement('div');row.className='dual';row.dataset.ual='row';row.innerHTML='<button type="button" class="dualrow" data-ual="open" aria-label="'+E(U('row_aria'))+'"><span aria-hidden="true">🔒</span> '+E(U('row'))+'</button>';
 var sv=root.querySelector('[data-mg=save]')||document.querySelector('[data-mg=save]'),at=sv?(sv.parentNode.querySelectorAll('[data-mg]').length>1?sv.parentNode:sv):null;if(at&&at.parentNode)at.parentNode.insertBefore(row,at);else s.parentNode.insertBefore(row,s.nextSibling)}
function pad(mode,why){
  /* одно окно: повторный вызов не открывает второй пинпад поверх первого; PIN вводится один раз за сессию */
  if(PAD&&document.body.contains(PAD)){try{PAD.focus()}catch(e){}return}
  if(mode=='enter'&&ST=='open'){var cb0=PADCB;PADCB=null;if(cb0)cb0(true);return}
  closePad();var steps=mode=='setup'?['new','again']:mode=='change'?['current','new','again']:['enter'],vals=[],cur='',busy=false,lastK='',lastT=0,deb=+K().key_debounce_ms||150,tk=null;
  var el=document.createElement('div');el.className='dualm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');PAD=el;
  var keys=[1,2,3,4,5,6,7,8,9,'',0,'⌫'];
  /* разметка строится один раз; на каждую цифру меняются только точки/сообщение/disabled */
  el.innerHTML='<div class="dualbox"><b class="dualt"></b>'+(why=='gen'?'<p class="sm dualsub">'+E(U('gen_hint'))+'</p>':'')+'<div class="dualdots" aria-live="polite">'+[0,1,2,3].map(function(){return '<i></i>'}).join('')+'</div>'+
    '<p class="dualmsg" role="status"></p><div class="dualkeys">'+keys.map(function(k){return k===''?'<span></span>':'<button type="button" data-k="'+k+'"'+(k==='⌫'?' aria-label="'+E(U('backspace')||'Стереть')+'"':'')+'>'+k+'</button>'}).join('')+'</div>'+
    (mode=='setup'?'<p class="sm dualwarn">'+E(U('weak'))+'</p>':'')+'<button type="button" class="lbtn sec" data-k="x">'+E(U(why=='gen'?'gen_skip':'cancel'))+'</button></div>';
  var T=el.querySelector('.dualt'),D=el.querySelector('.dualdots'),M=el.querySelector('.dualmsg'),KB=el.querySelectorAll('.dualkeys button');
  function dots(){var ii=D.children;for(var i=0;i<4;i++)ii[i].className=i<cur.length?'on':'';D.setAttribute('aria-label',U('dots_aria',{n:cur.length}))}
  function draw(msg,err){var b=blockedFor();T.textContent=U('t_'+steps[Math.min(vals.length,steps.length-1)]);dots();
    var t=b?U('blocked',{s:b}):(msg||'');if(M.textContent!==t)M.textContent=t;M.className='dualmsg'+(err||b?' err':'');M.setAttribute('role',err||b?'alert':'status');
    for(var i=0;i<KB.length;i++)KB[i].disabled=!!b||busy}
  function shake(){D.classList.remove('shake');void D.offsetWidth;D.classList.add('shake')}
  function wrong(bl){vals=[];cur='';draw(bl?'':U('wrong',{n:Math.max(0,(+K().max_attempts||3)-(att().n||0))}),1);shake();if(bl)tickBlock()}
  async function done(){vals.push(cur);cur='';if(vals.length<steps.length){draw();return}
   if(steps[steps.length-1]=='again'&&vals[vals.length-1]!==vals[vals.length-2]){vals=mode=='change'?[vals[0]]:[];draw(U('mismatch'),1);shake();return}
   busy=true;draw(U('wait'));
   try{if(mode=='enter'){var ok=await open(vals[0]);busy=false;if(ok){var cb=PADCB;PADCB=null;closePad();if(cb)cb(true);return}wrong(fail());return}
    if(mode=='change'){var ok2=await change(vals[0],vals[1]);busy=false;if(ok2){closePad();toast(U('changed'));return}wrong(fail());return}
    if(mode=='setup'){await setup(vals[0]);busy=false;closePad();toast(U('set_ok'));return}}catch(e){busy=false;vals=[];cur='';draw(U('error',{m:e.message}),1)}}
  function tickBlock(){clearInterval(tk);tk=setInterval(function(){if(!PAD||PAD!==el){clearInterval(tk);return}draw();if(!blockedFor()){clearInterval(tk);draw()}},1000)}
  function press(k){if(busy||blockedFor())return;var now=Date.now();if(k!=='⌫'&&k===lastK&&now-lastT<deb)return;lastK=k;lastT=now;
    if(k=='⌫'){cur=cur.slice(0,-1);dots();return}if(k=='ok'){if(cur.length==4)done();return}
    if(cur.length<4){cur+=k;if(M.textContent&&!blockedFor()){M.textContent='';M.className='dualmsg'}dots();if(cur.length==4)done()}}
  el.addEventListener('click',function(e){var b=e.target.closest('[data-k]');if(!b||b.disabled)return;e.preventDefault();var k=b.dataset.k;if(k=='x'){closePad();return}press(k)});
  el._kd=function(e){if(PAD!==el)return;if(e.key=='Escape'){e.preventDefault();closePad();return}
    if(/^\d$/.test(e.key)){e.preventDefault();press(e.key)}else if(e.key=='Backspace'){e.preventDefault();press('⌫')}else if(e.key=='Enter'){e.preventDefault();press('ok')}};
  document.addEventListener('keydown',el._kd,true);
  el.tabIndex=-1;document.body.appendChild(el);draw();if(blockedFor())tickBlock();el.focus()}
 function closePad(){if(PAD){if(PAD._kd)document.removeEventListener('keydown',PAD._kd,true);PAD.remove();PAD=null}var cb=PADCB;PADCB=null;if(cb&&ST!='open')cb(false)}
/* подстановка в документ, пока материалы скрыты: один раз спросить PIN, после генерации снова скрыть */
var PADCB=null,SKIP=0,GEN=null;
function need(){if(K().enabled===false||ST!='locked'||K().gen_prompt===false||Date.now()<SKIP)return Promise.resolve(null);
 return new Promise(function(res){PADCB=null;pad('enter','gen');PADCB=function(ok){if(!ok){SKIP=Date.now()+(+K().gen_skip_s||60)*1000;res(null);return}GEN=Date.now();res(release)}})}
function release(){var t=GEN;setTimeout(function(){if(GEN===t&&ST=='open'){GEN=null;lock('gen')}},(+K().gen_hold_s||20)*1000)}
 function toast(m){try{A().toast(m)}catch(e){}}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-ual]');if(b){var a=b.dataset.ual;if(a=='open')pad('enter');else if(a=='setup')pad('setup');else if(a=='change')pad('change');else if(a=='close')lock('manual');return}
  var nv=e.target.closest&&e.target.closest('nav button[data-v]');if(nv&&nv.dataset.v!='cp')lock('leave');
  var mg=e.target.closest&&e.target.closest('[data-mg=save],[data-mg=cancel]');
  if(mg||e.target.closest&&e.target.closest('#dmlhup,#dmsigup'))setTimeout(function(){sweep(true).catch(function(x){console.warn('ua sweep',x)}).then(function(){if(mg)lock('leave')})},1500)},true);
 document.addEventListener('change',function(e){if(ST=='open'&&e.target&&e.target.type=='file')setTimeout(function(){sweep(true).catch(function(){})},1500)},true);
 ['pointerdown','keydown','wheel','touchstart'].forEach(function(n){document.addEventListener(n,function(){LAST=Date.now()},{passive:true,capture:true})});
 setInterval(function(){if(ST=='open'&&Date.now()-LAST>(+K().idle_min||5)*60000)lock('idle')},(+K().idle_check_s||15)*1000);
 document.addEventListener('visibilitychange',function(){if(document.hidden)lock('hidden')});window.addEventListener('pagehide',function(){lock('pagehide')});
 /* «Документы» (17.10, «не подгружаются бланки и подпись»): пока раздел скрыт PIN, переключатели «Бланк» и «Подпись» были неактивны без объяснения —
    в нижней панели формы строка «Бланки и подписи скрыты PIN раздела · Открыть»; после ввода PIN бланки и подписи подставляются в предпросмотр и документ (тексты — docs_config.json → ua_lock.ui) */
 function docRow(){if(K().enabled===false||K().doc_row===false||ST!='locked')return '';return '<div class="dual dualdoc" data-ual-doc><span class="sm">🔒 '+E(U('doc_locked'))+'</span><button type="button" class="lbtn sec" data-ual="open">'+E(U('doc_open'))+'</button></div>'}
 window.ArbUAL={gate:gate,sec:sec,lock:lock,need:need,docRow:docRow,state:function(){return ST},_t:TEST,_sweep:sweep};
})();
