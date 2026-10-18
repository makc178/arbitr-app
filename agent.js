window.ARB_AGENT_CFG={"enabled": true, "agent_public_key": {"kty": "EC", "crv": "P-256", "x": "SeB7l5aWDLh-B9LFN1qMRHcz7dlc0e2ZSlkwuL76N2U", "y": "l9Cc0044HpiHeYJ32rIaHfT9xXNUzfABafm4wbrdcQE"}, "paths": {"requests": "arbitr/agent_requests/", "files": "arbitr/agent_requests/files/", "reports": "arbitr/agent_reports/", "report_index": "arbitr/agent_reports/index.json", "user_key": "arbitr/agent_keys/user.json"}, "source": "Arbitr App / ИИ Агент", "pin_kdf_iterations": 600000, "poll_seconds": 60, "eta_ack_minutes": 60, "list_max": 50, "limits": {"max_chars": 8000, "max_files": 20, "max_file_mb": 50, "first_line_chars": 90}, "layout": {"page_max_px": 1200, "card_radius_px": 14, "card_pad_px": 24, "two_col_from_px": null, "cols": "minmax(0,6fr) minmax(0,5fr)", "textarea_min_rows": 6, "textarea_max_rows": 18, "drop_min_h_px": 96, "file_row_h_px": 44, "btn_h_px": 44, "toast_ms": 4000}, "colors": {"acc": "#14B8A6", "acc_hover": "#2DD4BF", "acc_ink": "#06201C", "danger": "#F87171", "danger_bg": "rgba(248,113,113,.12)", "danger_line": "rgba(248,113,113,.45)", "chip_sent_bg": "rgba(230,244,241,.08)", "chip_sent_ink": "#CDEBE2", "chip_work_bg": "rgba(94,234,212,.12)", "chip_work_ink": "#5EEAD4", "chip_done_bg": "#14B8A6", "chip_done_ink": "#06201C", "disabled_bg": "rgba(230,244,241,.08)", "disabled_ink": "rgba(230,244,241,.35)"}, "nav": {"id": "ai", "label": "ИИ Агент", "icon": "<path d=\"M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9zM5 15l.7 1.5L7 17l-1.3.5L5 19l-.7-1.5L3 17l1.3-.5z\"/>"}, "size_units": ["Б", "КБ", "МБ", "ГБ"], "t": {"title": "ИИ Агент", "lead": "Опишите задачу и приложите файлы. Администратор раздаст поручения ботам и выложит сводный отчёт в PDF здесь же.", "req_label": "Запрос", "placeholder": "Опишите задачу подробно", "counter_tpl": "{n} / {max}", "files_label": "Файлы", "drop_main": "Перетащите файлы или ", "drop_link": "выберите", "drop_sub": "PDF, Word, Excel, изображения · до {mb} МБ на файл", "enc_note": "Файлы хранятся зашифрованными и открываются только после ввода PIN", "remove_title": "Убрать файл", "send": "Отправить администратору", "send_hint_empty": "Опишите задачу, чтобы отправить", "send_hint_pin": "Отправить можно после входа по PIN приложения: запрос шифруется ключом, который открывается PIN", "toast": "Запрос передан администратору", "error": "Не отправлено", "retry": "↻ Повторить", "list_title": "Запросы и отчёты", "list_empty": "Запросов пока нет. Отправленные запросы и готовые отчёты появятся здесь.", "status": {"sent": "Отправлен", "work": "В работе", "done": "Отчёт готов"}, "work_prefix": "В работе у:", "open_pdf": "Открыть PDF", "download": "Скачать PDF", "files_n_tpl": "{n} файл.", "retry_title": "Повторить отправку: уже загруженные файлы повторно не загружаются", "eta_tpl": "Готово ориентировочно к {hm} МСК", "need_pin": "Раздел доступен после входа по ПИН: запросы и отчёты зашифрованы ключом, который открывается только ПИН.", "key_mismatch": "Ключ отчётов создан с другим ПИН. Войдите с прежним ПИН, чтобы открыть отчёты.", "key_wait": "Готовлю ключ шифрования…", "too_many": "Можно приложить не больше {n} файлов", "too_big": "Файл «{name}» больше {mb} МБ", "too_long": "Не больше {max} символов", "sending": "Шифрую и отправляю… {i} из {n}", "loading": "Загружаю список…", "load_fail": "Не удалось загрузить список. Обновите страницу.", "locked_line": "Запрос (текст зашифрован)", "pdf_fail": "Не удалось открыть отчёт. Попробуйте ещё раз.", "pdf_opening": "Расшифровываю отчёт…", "report_name": "Отчёт ИИ Агента {date}.pdf", "eta_pending_tpl": "Срок назовут до {hm} МСК"}, "ai_agent_layout_v1": true, "v1": {"_note": "Макет Дизайнера v1 (arbitr_app_design/ai_agent/spec.md). Включается флагом ai_agent_layout_v1=true ТОЛЬКО после утверждения пользователем: тексты/размеры ниже накладываются поверх t/layout, корню раздела ставится класс aiv1 (стили в assets/agent.css → .aiv1).", "t": {"enc_note": "Файлы хранятся зашифрованными и открываются только после ввода PIN", "work_prefix": "В работе у:", "download": "Скачать PDF", "req_no_tpl": "№ {n}", "files_count_title": "Приложено файлов", "sending": "Отправляем…"}, "layout": {"cols": "minmax(0,6fr) minmax(0,5fr)", "two_col_from_px": 1200, "card_radius_px": 14, "card_pad_px": 24, "textarea_radius_px": 12, "btn_radius_px": 12, "btn_pad_x_px": 22, "chip_h_px": 24, "row_radius_px": 12, "mobile_from_px": 700, "ws_gap_px": 16}, "req_no_base": 1000}};
/* Arbitr App · раздел «ИИ Агент» (config/agent.json → window.ARB_AGENT_CFG; без enabled=true скрипт в сборку не попадает).
   Пользователь пишет подробную инструкцию и прикладывает файлы → запрос уходит Администратору через закрытый репозиторий
   (arbitr/agent_requests/<id>.json, файлы arbitr/agent_requests/files/<id>/f<n>.enc) → Администратор раздаёт задачи ботам
   и выкладывает сводный PDF (arbitr/agent_reports/<id>.pdf.enc), он появляется в списке этого раздела.
   ШИФРОВАНИЕ (на устройстве, WebCrypto): случайный ключ данных AES-256-GCM шифрует текст и каждый файл; он обёрнут
   ECDH P-256 + HKDF-SHA256 для ключа АГЕНТА (открытый — в конфиге) и для ключа ПОЛЬЗОВАТЕЛЯ (чтобы показать свой текст).
   Ключ пользователя создаётся при первом входе по ПИН: закрытый обёрнут ключом из ПИН (PBKDF2-SHA256) и лежит в
   arbitr/agent_keys/user.json рядом с открытым; ПИН и расшифрованный ключ живут только в памяти этой вкладки.
   Отчёт PDF зашифрован ключом пользователя и открывается только после входа по ПИН. Срок (ETA) — только из запроса
   (tools/agent_eta.py), приложение его не придумывает. */
(function(){
'use strict';
var C=window.ARB_AGENT_CFG;if(!C||C.enabled!==true)return;
var V1=C.ai_agent_layout_v1===true,X=V1&&C.v1||{},T=Object.assign({},C.t,X.t||{}),L=Object.assign({},C.layout,X.layout||{}),P=C.paths,LIM=C.limits;
T.status=Object.assign({},C.t.status,(X.t||{}).status||{});
var te=new TextEncoder(),td=new TextDecoder(),SUB=crypto.subtle,ALG='ECDH-P256+HKDF-SHA256+A256GCM',EC={name:'ECDH',namedCurve:'P-256'};
var K={priv:null,pub:null,id:null,state:'none'},ST={files:[],att:null,list:[],cache:{},shas:{},loaded:false,err:false,busy:false,okT:0},R=null;
function $(s){return R&&R.querySelector(s)}
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function F(s,o){return String(s||'').replace(/\{(\w+)\}/g,function(_,k){return o&&o[k]!=null?o[k]:''})}
function u8(b){return b instanceof Uint8Array?b:new Uint8Array(b)}
function b64(b){b=u8(b);var s='',i;for(i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)}
function ub64(s){var r=atob(s),b=new Uint8Array(r.length);for(var i=0;i<r.length;i++)b[i]=r.charCodeAt(i);return b}
function rnd(n){return crypto.getRandomValues(new Uint8Array(n))}
function size(n){var U=C.size_units||['Б','КБ','МБ','ГБ'],i=0;n=+n||0;while(n>=1024&&i<U.length-1){n/=1024;i++}return (i?n.toFixed(1).replace('.',','):String(n))+' '+U[i]}
var TZ={timeZone:'Europe/Moscow'};
function dmy(iso){try{return new Date(iso).toLocaleDateString('ru-RU',Object.assign({day:'2-digit',month:'2-digit',year:'numeric'},TZ))}catch(e){return ''}}
function hm(iso){try{var d=new Date(iso),s=new Date(iso).toLocaleTimeString('ru-RU',Object.assign({hour:'2-digit',minute:'2-digit'},TZ));return (dmy(iso)!==dmy(new Date().toISOString())?dmy(iso)+' ':'')+s}catch(e){return ''}}
/* ---------- крипто ---------- */
async function kek(bits,info){var h=await SUB.importKey('raw',bits,'HKDF',false,['deriveKey']);return SUB.deriveKey({name:'HKDF',hash:'SHA-256',salt:te.encode('arbitr-agent-v1'),info:te.encode(info)},h,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function wrap(dek,pub,info){var e=await SUB.generateKey(EC,true,['deriveBits']),k=await kek(await SUB.deriveBits({name:'ECDH',public:pub},e.privateKey,256),info),iv=rnd(12),j=await SUB.exportKey('jwk',e.publicKey);
 return {alg:ALG,info:info,epk:{kty:j.kty,crv:j.crv,x:j.x,y:j.y},iv:b64(iv),wk:b64(await SUB.encrypt({name:'AES-GCM',iv:iv},k,dek))}}
async function unwrap(w,priv){if(w.alg!==ALG)throw new Error('alg');var p=await SUB.importKey('jwk',w.epk,EC,false,[]),k=await kek(await SUB.deriveBits({name:'ECDH',public:p},priv,256),w.info);
 return SUB.importKey('raw',await SUB.decrypt({name:'AES-GCM',iv:ub64(w.iv)},k,ub64(w.wk)),'AES-GCM',false,['encrypt','decrypt'])}
async function seal(k,data,aad){var iv=rnd(12),c=u8(await SUB.encrypt({name:'AES-GCM',iv:iv,additionalData:te.encode(aad)},k,data)),o=new Uint8Array(12+c.length);o.set(iv);o.set(c,12);return o}
async function unseal(k,b,aad){b=u8(b);return SUB.decrypt({name:'AES-GCM',iv:b.subarray(0,12),additionalData:te.encode(aad)},k,b.subarray(12))}
async function pinKek(pin,salt,it){var k=await SUB.importKey('raw',te.encode(String(pin)),'PBKDF2',false,['deriveKey']);return SUB.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:it},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function keyId(j){var h=u8(await SUB.digest('SHA-256',te.encode(j.x+'.'+j.y)));return Array.prototype.map.call(h.subarray(0,8),function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
var AGENT=null;function agentPub(){return AGENT||(AGENT=SUB.importKey('jwk',C.agent_public_key,EC,false,[]))}
/* ---------- закрытый репозиторий ---------- */
function tok(){return typeof TOKEN!='undefined'&&TOKEN}
async function waitTok(){for(var i=0;i<240&&!tok();i++)await new Promise(function(r){setTimeout(r,500)});if(!tok())throw new Error('token')}
async function gh(path,opt){if(typeof ghApi!='function')throw new Error('ghApi');return ghApi(path,opt||{})}
async function raw(path){var r=await gh(path,{headers:{Accept:'application/vnd.github.raw+json'}});if(r.status===404){var e=new Error('404');e.nf=1;throw e}if(!r.ok)throw new Error('GitHub '+r.status);return r}
async function put(path,bytes,msg,sha){var b={message:msg,content:b64(bytes),branch:(typeof BRANCH!='undefined'&&BRANCH)||'main'};if(sha)b.sha=sha;return gh(path,{method:'PUT',body:JSON.stringify(b)})}
/* ---------- ключ пользователя (первый вход по ПИН) ---------- */
async function onPin(pin){K.state='wait';draw();try{await waitTok();var j=null,r;
  try{j=await (await raw(P.user_key)).json()}catch(e){if(!e.nf)throw e}
  if(!j){var kp=await SUB.generateKey(EC,true,['deriveBits']),p8=u8(await SUB.exportKey('pkcs8',kp.privateKey)),s=rnd(16),iv=rnd(12),it=C.pin_kdf_iterations||600000,
    pj=await SUB.exportKey('jwk',kp.publicKey),pub={kty:pj.kty,crv:pj.crv,x:pj.x,y:pj.y},kid=await keyId(pub);
   var ct=await SUB.encrypt({name:'AES-GCM',iv:iv},await pinKek(pin,s,it),p8);
   j={v:1,created:new Date().toISOString(),key_id:kid,pub:pub,priv:{kdf:'PBKDF2-SHA256',it:it,s:b64(s),iv:b64(iv),ct:b64(ct)}};
   r=await put(P.user_key,te.encode(JSON.stringify(j)),'agent user key');
   if(r.status===422){j=await (await raw(P.user_key)).json()}else if(!r.ok)throw new Error('GitHub '+r.status);
   else{K.priv=await SUB.importKey('pkcs8',p8,EC,false,['deriveBits']);p8.fill(0);K.pub=await SUB.importKey('jwk',pub,EC,false,[]);K.id=kid;K.state='ok';pin=null;draw();load();return}}
  var pk;try{pk=u8(await SUB.decrypt({name:'AES-GCM',iv:ub64(j.priv.iv)},await pinKek(pin,ub64(j.priv.s),j.priv.it),ub64(j.priv.ct)))}catch(e){pin=null;K.state='mismatch';draw();return}
  pin=null;K.priv=await SUB.importKey('pkcs8',pk,EC,false,['deriveBits']);pk.fill(0);K.pub=await SUB.importKey('jwk',j.pub,EC,false,[]);K.id=j.key_id;K.state='ok';draw();load()}
 catch(e){pin=null;try{console.error('[ИИ Агент] ключ:',e)}catch(_){}K.state='none';draw()}}
var prev=window.__arbPin;window.__arbPin=function(pin){try{onPin(String(pin))}catch(e){}if(typeof prev=='function')return prev.apply(this,arguments)};
/* ---------- отправка ---------- */
function fsig(){return ST.files.map(function(f){return [f.name,f.size,f.lastModified].join('|')}).join('\n')}
function newId(){var t=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');var a='abcdefghijklmnopqrstuvwxyz0123456789',s='',r=rnd(6);for(var i=0;i<6;i++)s+=a[r[i]%36];return 'ag_'+t+'_'+s}
async function send(){var ta=$('#aitext'),text=ta.value.trim();if(!text||ST.busy||K.state!=='ok')return;ST.busy=true;ST.err=false;draw();
 var g=text+'\n\u0000'+fsig();if(!ST.att||ST.att.sig!==g){var raw32=rnd(32);ST.att={sig:g,id:newId(),created:new Date().toISOString(),dekRaw:raw32,dek:await SUB.importKey('raw',raw32,'AES-GCM',false,['encrypt','decrypt']),up:{}}}
 var A=ST.att,id=A.id,n=ST.files.length;
 try{for(var i=0;i<n;i++){var no=i+1;if(A.up[no])continue;msg(F(T.sending,{i:no,n:n}));
   var f=ST.files[i],blob=await seal(A.dek,await f.arrayBuffer(),id+'/f'+no),path=P.files+id+'/f'+no+'.enc',r=await put(path,blob,'agent file '+id);
   if(!r.ok&&r.status!==422)throw new Error('GitHub '+r.status);A.up[no]={n:no,path:path,size:blob.length}}
  msg(F(T.sending,{i:n,n:n}));
  var body={text:text,files:ST.files.map(function(f,i){return {n:i+1,name:f.name,type:f.type||'',size:f.size}})},dr=A.dekRaw;
  var q={v:1,id:id,created:A.created,status:'sent',source:C.source,user_key_id:K.id,files:Object.keys(A.up).map(function(k){return A.up[k]}).sort(function(a,b){return a.n-b.n}),
   enc:{alg:ALG,keys:{agent:await wrap(dr,await agentPub(),'arbitr-agent/request'),user:await wrap(dr,K.pub,'arbitr-agent/request')},ct:b64(await seal(A.dek,te.encode(JSON.stringify(body)),id))}};
  var rr=await put(P.requests+id+'.json',te.encode(JSON.stringify(q)),'agent request '+id);if(!rr.ok&&rr.status!==422)throw new Error('GitHub '+rr.status);
  ST.cache[id]={q:q,line:first(text)};ST.list=[ST.cache[id]].concat(ST.list.filter(function(x){return x.q.id!==id}));
  A.dekRaw.fill(0);ST.att=null;ST.files=[];ta.value='';ST.busy=false;msg('');ST.okT=Date.now();grow();draw();setTimeout(draw,(L.toast_ms||4000)+50)}
 catch(e){try{console.error('[ИИ Агент] отправка не удалась:',e)}catch(_){}ST.busy=false;ST.err=true;msg('');draw()}}
function first(t){var s=String(t||'').split('\n').map(function(x){return x.trim()}).filter(Boolean)[0]||'';var m=LIM.first_line_chars||90;return s.length>m?s.slice(0,m-1)+'…':s}
/* ---------- список ---------- */
var LT=0;
async function load(){if(!tok()||K.state!=='ok'||!R)return;try{var r=await gh(P.requests.replace(/\/$/,''));if(r.status===404){ST.list=[];ST.loaded=true;ST.lerr=false;draw();return}if(!r.ok)throw new Error('GitHub '+r.status);
  var a=(await r.json()).filter(function(x){return x.type==='file'&&/^ag_[\w\-]+\.json$/.test(x.name)}).sort(function(x,y){return x.name<y.name?1:-1}).slice(0,C.list_max||50),out=[];
  for(var i=0;i<a.length;i++){var id=a[i].name.slice(0,-5),c=ST.cache[id];
   if(!c||ST.shas[id]!==a[i].sha){try{var q=await (await raw(a[i].path)).json(),line='';
     try{var k=await unwrap(q.enc.keys.user,K.priv);line=first(JSON.parse(td.decode(await unseal(k,ub64(q.enc.ct),id))).text)}catch(e){line=''}
     c=ST.cache[id]={q:q,line:line};ST.shas[id]=a[i].sha}catch(e){if(!c)continue}}
   out.push(c)}
  ST.list=out;ST.loaded=true;ST.lerr=false;draw()}catch(e){try{console.error('[ИИ Агент] список:',e)}catch(_){}ST.lerr=true;ST.loaded=true;draw()}}
async function report(id,dl){var c=ST.cache[id];if(!c||K.state!=='ok')return;var w=null;if(!dl){try{w=window.open('','_blank')}catch(e){}}
 var el=R.querySelector('[data-rid="'+id+'"] .aig-pm');if(el)el.textContent=T.pdf_opening;
 try{var j=await (await raw((c.q.report&&c.q.report.file)||P.reports+id+'.pdf.enc')).json(),k=await unwrap(j.key,K.priv),pdf=await unseal(k,ub64(j.ct),id+'/pdf'),nm='';
  try{nm=td.decode(await unseal(k,ub64(j.name),id+'/name'))}catch(e){}
  if(td.decode(u8(pdf).subarray(0,5))!=='%PDF-')throw new Error('not pdf');
  var u=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));nm=nm||F(T.report_name,{date:dmy(c.q.created)});
  if(dl||!w){var a=document.createElement('a');a.href=u;a.download=nm;if(!dl)a.target='_blank';document.body.appendChild(a);a.click();a.remove()}else w.location.href=u;
  setTimeout(function(){URL.revokeObjectURL(u)},120000);if(el)el.textContent=''}
 catch(e){try{console.error('[ИИ Агент] отчёт:',e)}catch(_){}if(w)try{w.close()}catch(_){}if(el)el.textContent=T.pdf_fail}}
/* ---------- разметка ---------- */
function msg(s){var m=$('#aimsg');if(m)m.textContent=s}
function rowHTML(c,i,n){var q=c.q,s=q.status==='done'?'done':q.status==='work'?'work':'sent',no=(X.req_no_base||1000)+n-i,nf=(q.files||[]).length;
 var h='<div class="aig-row aig-'+s+'" data-rid="'+E(q.id)+'"><div class="aig-rh"><span class="aig-no">'+E(F(T.req_no_tpl,{n:no}))+'</span><span class="aig-d">'+E(dmy(q.created))+'</span>'+
  (V1?'<span class="aig-fn" title="'+E(T.files_count_title||'')+'">· '+E(F(T.files_n_tpl,{n:nf}))+'</span>':'')+'<span class="aig-chip">'+E(T.status[s])+'</span></div>'+
  '<div class="aig-l" title="'+E(c.line)+'">'+E(c.line||T.locked_line)+'</div>';
 if(s==='work'&&(q.bots||[]).length)h+='<div class="aig-bots"><span>'+E(T.work_prefix)+'</span> '+q.bots.map(function(b){return '<i>'+E(b)+'</i>'}).join(V1?'':', ')+'</div>';
 if(s!=='done'){var ack=q.eta?'':(C.eta_ack_minutes>0&&q.created?new Date(new Date(q.created).getTime()+C.eta_ack_minutes*60000).toISOString():'');if(q.eta||ack)h+='<div class="aig-eta'+(q.eta?'':' aig-eta0')+'">'+E(F(q.eta?T.eta_tpl:T.eta_pending_tpl,{hm:hm(q.eta||ack)}))+'</div>'}  /* срок: из запроса (agent_eta.py), до него — срок, к которому Администратор назовёт свой (config eta_ack_minutes) */
 if(s==='done')h+=(V1&&q.report?'<div class="aig-pf">'+E(size(q.report.bytes))+'</div>':'')+'<div class="aig-btns"><button type="button" class="aig-b1" data-open="'+E(q.id)+'">'+E(T.open_pdf)+'</button><button type="button" class="aig-b2" data-dl="'+E(q.id)+'">'+E(T.download)+'</button></div><div class="aig-pm sm" aria-live="polite"></div>';
 return h+'</div>'}
function draw(){if(!R)return;var ta=$('#aitext'),v=ta?ta.value.trim():'',ok=K.state==='ok',b=$('#aisend');
 var g=$('#aigate');g.hidden=ok;g.textContent=K.state==='mismatch'?T.key_mismatch:K.state==='wait'?T.key_wait:T.need_pin;
 b.disabled=!v||!ok||ST.busy;$('#aihint').textContent=!ok&&K.state!=='wait'?(T.send_hint_pin||T.need_pin):!v?T.send_hint_empty:'';
 $('#aifail').hidden=!ST.err;var t=$('#aiok');t.hidden=!(Date.now()-ST.okT<(L.toast_ms||4000));
 var n=ta?ta.value.length:0,ct=$('#aicnt');ct.textContent=F(T.counter_tpl,{n:n.toLocaleString('ru-RU'),max:(LIM.max_chars).toLocaleString('ru-RU')});ct.classList.toggle('lim',n>=LIM.max_chars);
 $('#aifiles').innerHTML=ST.files.map(function(f,i){return '<div class="aig-file"><span class="aig-fi" aria-hidden="true"></span><span class="aig-fnm" title="'+E(f.name)+'">'+E(f.name)+'</span><span class="aig-fs">'+E(size(f.size))+'</span><button type="button" class="aig-x" data-rm="'+i+'" title="'+E(T.remove_title)+'" aria-label="'+E(T.remove_title)+'"'+(ST.busy?' disabled':'')+'>×</button></div>'}).join('');
 var l=$('#ailist');if(!ok){l.innerHTML='';return}
 l.innerHTML=!ST.loaded?'<div class="aig-empty">'+E(T.loading)+'</div>':ST.lerr&&!ST.list.length?'<div class="aig-empty">'+E(T.load_fail)+'</div>':!ST.list.length?'<div class="aig-empty">'+E(T.list_empty)+'</div>':ST.list.map(function(c,i){return rowHTML(c,i,ST.list.length)}).join('')}
function grow(){var ta=$('#aitext');if(!ta)return;var cs=getComputedStyle(ta),lh=parseFloat(cs.lineHeight)||22,pad=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth),mx=lh*(L.textarea_max_rows||18)+pad,mn=lh*(L.textarea_min_rows||6)+pad;
 ta.style.height='auto';var h=Math.max(mn,Math.min(mx,ta.scrollHeight+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth)));ta.style.height=h+'px';ta.style.overflowY=ta.scrollHeight+2>mx?'auto':'hidden'}
function addFiles(fl){var e='';for(var i=0;i<fl.length;i++){var f=fl[i];if(ST.files.length>=LIM.max_files){e=F(T.too_many,{n:LIM.max_files});break}if(f.size>LIM.max_file_mb*1048576){e=F(T.too_big,{name:f.name,mb:LIM.max_file_mb});continue}ST.files.push(f)}msg(e);draw()}
function shell(){var v=document.createElement('div');v.id='vai';v.style.display='none';var c=C.colors||{},st=[];
 Object.keys(c).forEach(function(k){st.push('--ai-'+k.replace(/_/g,'-')+':'+c[k])});
 ['card_radius_px','card_pad_px','textarea_radius_px','btn_radius_px','btn_pad_x_px','chip_h_px','row_radius_px','drop_min_h_px','file_row_h_px','btn_h_px','page_max_px','ws_gap_px'].forEach(function(k){if(L[k]!=null)st.push('--ai-'+k.replace(/_px$/,'').replace(/_/g,'-')+':'+L[k]+'px')});
 if(L.cols)st.push('--ai-cols:'+L.cols);
 v.innerHTML='<div class="aig'+(V1?' aiv1':'')+'" style="'+E(st.join(';'))+'"><section class="aig-form md prc"><h2>'+E(T.title)+'</h2><p class="sm aig-lead">'+E(T.lead)+'</p>'+
  '<div class="aig-gate" id="aigate" role="status"></div>'+
  '<div class="aig-lh"><label for="aitext">'+E(T.req_label)+'</label><span class="aig-cnt" id="aicnt" aria-live="polite"></span></div>'+
  '<textarea id="aitext" rows="'+(L.textarea_min_rows||6)+'" maxlength="'+LIM.max_chars+'" placeholder="'+E(T.placeholder)+'"></textarea>'+
  '<div class="aig-lh"><span class="aig-flab">'+E(T.files_label)+'</span></div>'+
  '<label class="aig-drop" id="aidrop"><input type="file" id="aifile" multiple hidden><span class="aig-up" aria-hidden="true"></span><span class="aig-dm">'+E(T.drop_main)+'<u>'+E(T.drop_link)+'</u></span><span class="aig-ds sm">'+E(F(T.drop_sub,{mb:LIM.max_file_mb}))+'</span></label>'+
  '<div id="aifiles" class="aig-files"></div><div class="aig-enc sm"><span class="aig-lock" aria-hidden="true"></span>'+E(T.enc_note)+'</div>'+
  '<div class="aig-fail" id="aifail" role="alert" hidden><span>'+E(T.error)+'</span><button type="button" id="airetry" title="'+E(T.retry_title||'')+'">'+E(T.retry)+'</button></div>'+
  '<div class="aig-send"><span class="sm aig-hint" id="aihint"></span><span class="sm" id="aimsg" aria-live="polite"></span><button type="button" id="aisend" class="aig-btn">'+E(T.send)+'</button></div>'+
  '<div class="aig-ok" id="aiok" role="status" hidden>'+E(T.toast)+'</div></section>'+
  '<section class="aig-side md prc"><h2 class="aig-lt">'+E(T.list_title)+'</h2><div id="ailist" class="aig-list"></div></section></div>';
 (document.querySelector('.page.pmain')||document.body).appendChild(v);R=v;  /* в общей обёртке .page (17–18.10): края как у строки разделов */
 var ta=$('#aitext');ta.addEventListener('input',function(){grow();if(ST.err&&!ST.busy){}draw()});
 $('#aifile').addEventListener('change',function(e){addFiles(e.target.files);e.target.value=''});
 var d=$('#aidrop');['dragenter','dragover'].forEach(function(t){d.addEventListener(t,function(e){e.preventDefault();d.classList.add('over')})});
 ['dragleave','drop'].forEach(function(t){d.addEventListener(t,function(e){e.preventDefault();d.classList.remove('over')})});
 d.addEventListener('drop',function(e){if(!ST.busy&&e.dataTransfer)addFiles(e.dataTransfer.files)});
 v.addEventListener('click',function(e){var x=e.target.closest('[data-rm]');if(x&&!ST.busy){ST.files.splice(+x.dataset.rm,1);draw();return}
  if(e.target.closest('#aisend')||e.target.closest('#airetry')){send();return}
  var o=e.target.closest('[data-open]');if(o){report(o.dataset.open,false);return}var w=e.target.closest('[data-dl]');if(w)report(w.dataset.dl,true)});
 var two=L.two_col_from_px?matchMedia('(min-width:'+L.two_col_from_px+'px)'):null,ap=function(){R.firstChild.classList.toggle('two',!!(two&&two.matches))};if(two){two.addEventListener?two.addEventListener('change',ap):two.addListener(ap)}ap();
 grow();draw()}
/* ---------- навигация ---------- */
function show(){var b=document.querySelector('nav button[data-v="'+C.nav.id+'"]');document.querySelectorAll('nav button[data-v]').forEach(function(x){x.classList.toggle('on',x===b);var e=document.getElementById('v'+x.dataset.v);if(e&&x!==b)e.style.display='none'});
 ['vreg','vman','vmet','vsrc','vrep','vprc','vfin','veval','vprop','vperr','vfav','vdocs','vcp','varch'].forEach(function(i){var e=document.getElementById(i);if(e)e.style.display='none'});R.style.display='';grow();window.scrollTo(0,0);
 if(Date.now()-LT>5000){LT=Date.now();load()}}
function navInit(){var nav=document.querySelector('nav');if(!nav)return false;if(nav.querySelector('button[data-v="'+C.nav.id+'"]'))return true;
 var after=nav.querySelector('button[data-v="arch"]');if(!after)return false;var b=document.createElement('button');b.dataset.v=C.nav.id;b.textContent=C.nav.label;after.after(' ',b);b.onclick=show;
 nav.addEventListener('click',function(e){var x=e.target.closest('button');if(x&&x!==b&&R){R.style.display='none';b.classList.remove('on')}});return true}
shell();(function w(n){if(!navInit()&&n<240)setTimeout(function(){w(n+1)},250)})(0);
setInterval(function(){if(R&&R.style.display!=='none'&&!document.hidden){LT=Date.now();load()}},(C.poll_seconds||60)*1000);
window.ArbAgent={state:function(){return K.state},load:load};
})();
