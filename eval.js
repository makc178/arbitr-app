(function(){
var C=null,TY=null,IDX={},PEND=[],$=function(i){return document.getElementById(i)};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function lab(f){return E(f.label)+(f.req?' '+E(C.required_mark||'*'):'')}
function inp(f,hint){var a=' data-k="'+f.k+'" id="ef_'+f.k+'"',o=f.options||{};
 if(f.type=='select')return '<select'+a+'>'+(f.default?'':'<option value="">— выберите —</option>')+Object.keys(o).map(function(k){return '<option value="'+k+'"'+(f.default==k?' selected':'')+'>'+E(o[k])+'</option>'}).join('')+'</select>';
 if(f.type=='segment')return '<div'+a+' class="eseg" data-val="'+E(f.default||'')+'">'+Object.keys(o).map(function(k){return '<button type="button" data-o="'+k+'"'+(f.default==k?' class="on"':'')+'>'+E(o[k])+'</button>'}).join('')+'</div>';
 if(f.type=='multi')return '<div'+a+' class="emulti echips"'+(f.exclusive?' data-ex="'+f.exclusive+'"':'')+'>'+Object.keys(o).map(function(k){return '<button type="button" data-o="'+k+'">'+E(o[k])+'</button>'}).join('')+'</div>';
 if(0)return '<div'+a+' class="emulti" style="display:flex;flex-wrap:wrap;gap:10px">'+Object.keys(o).map(function(k){return '<label style="display:flex;gap:4px;align-items:center;margin:0"><input type="checkbox" value="'+k+'">'+E(o[k])+'</label>'}).join('')+'</div>';
 if(f.type=='textarea')return '<textarea'+a+' rows="2" style="width:100%;box-sizing:border-box"></textarea>';
 if(f.type=='file')return '<label class="fdrop edrop"><input type="file" multiple accept="'+E((TY&&C.types[TY].accept)||C.accept||'')+'"'+a+'><span>'+E(hint||C.upload_caption_default)+'</span><b class="esel" data-sel="'+f.k+'"></b></label>';
 return '<input'+a+(f.type=='date'?' type="date"':'')+(f.type=='number'||f.type=='inn'?' inputmode="decimal"':'')+'>'}
function block(fs,hint){return '<div class="g2">'+fs.map(function(f){var w=f.type=='textarea'||f.type=='file'||f.type=='multi';var rq=f.k=='files'&&C.types[TY].require_files;return '<div data-w="'+f.k+'"'+(w?' style="grid-column:1/-1"':'')+'><label>'+lab(rq?Object.assign({},f,{req:true}):f)+'</label>'+inp(f,f.k=='files'?hint:'')+'</div>'}).join('')+'</div>'}
function val(k){var el=$('ef_'+k);if(!el)return '';if(el.classList.contains('emulti'))return [].slice.call(el.querySelectorAll('button.on')).map(function(x){return x.dataset.o}).filter(function(x){return x!=el.dataset.ex});if(el.classList.contains('eseg'))return el.dataset.val;if(el.type=='file')return el.files;return el.value.trim()}
function fields(){return C.types[TY].fields.concat(C.common)}
function vis(){fields().forEach(function(f){if(!f.show_if)return;var ok=Object.keys(f.show_if).every(function(k){var v=f.show_if[k];return [].concat(v).indexOf(val(k))>=0});var w=document.querySelector('[data-w="'+f.k+'"]');if(w)w.style.display=ok?'':'none';f._h=!ok});
 var wn=(C.purpose_warnings||{})[val('purpose')],x=$('ewarn');x.style.display=wn?'':'none';x.textContent=wn?'⚠ '+wn:''}
function tkeys(){return Object.keys(C.types).filter(function(k){return !(QON()&&!QC().files&&C.types[k].require_files)})}
function form(t){TY=t;$('etabs').innerHTML=tkeys().map(function(k){return '<button type="button" class="pchip'+(k==t?' on':'')+'" data-t="'+k+'">'+E(C.types[k].label)+'</button>'}).join('');
 $('eobj').innerHTML=block(C.types[t].fields);$('ecom').innerHTML=block(C.common,C.types[t].upload_caption||C.upload_caption_default);
 var p=document.querySelector('[data-w="purpose"]');p.insertAdjacentHTML('afterend','<p class="sm ewarn" id="ewarn" style="display:none;grid-column:1/-1"></p>');
 $('ef').querySelectorAll('input[type=file]').forEach(function(i){i.onchange=function(){document.querySelector('[data-sel="'+i.dataset.k+'"]').innerHTML=[].slice.call(i.files).map(function(x){return E(x.name)+' · '+(x.size/1048576).toFixed(1)+' МБ'}).join('<br>')}});
 if(QON()&&!QC().files){fields().forEach(function(f){if(f.type=='file'){var w=document.querySelector('[data-w="'+f.k+'"]');if(w)w.remove()}});$('ecom').insertAdjacentHTML('beforeend','<p class="sm" id="efnote">'+E(QT('files_note'))+'</p>')}vis()}
function on(){return typeof TOKEN!='undefined'&&TOKEN&&typeof REPO!='undefined'&&REPO&&!REPO.startsWith('/*')}
async function init(){C=window.EVAL_CONFIG;$('evalslot').outerHTML=await (await fetch('eval.html?v='+Date.now())).text();
 var fb=document.querySelector('nav button[data-v="fin"]');if(fb&&!document.querySelector('nav button[data-v="eval"]')){var nb=document.createElement('button');nb.dataset.v='eval';nb.textContent=C.title;fb.after(' ',nb);
  nb.onclick=function(){document.querySelectorAll('nav button[data-v]').forEach(function(x){x.classList.toggle('on',x===nb)});['vreg','vman','vmet','vsrc','vrep','vprc','vfin'].forEach(function(v){var e=$(v);if(e)e.style.display='none'})}}
 $('etl').textContent=C.title;$('eintro').textContent=QON()&&QT('intro')!='intro'?QT('intro'):C.intro;$('edis').textContent=C.disclaimer;$('eltl').textContent=C.doc_title;form(tkeys()[0]);
 $('ef').addEventListener('click',function(e){var b=e.target.closest('.echips button,.eseg button');if(!b)return;var g=b.parentNode;if(g.classList.contains('eseg')){g.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b)});g.dataset.val=b.dataset.o}else{b.classList.toggle('on');var ex=g.dataset.ex;if(ex&&b.classList.contains('on'))g.querySelectorAll('button').forEach(function(x){if(x!==b&&(b.dataset.o==ex||x.dataset.o==ex))x.classList.remove('on')})}vis()});
 $('etabs').onclick=function(e){var b=e.target.closest('[data-t]');if(b)form(b.dataset.t)};$('ef').addEventListener('change',vis);
 $('ef').onsubmit=send;$('eq').oninput=draw;$('evl').onchange=function(e){var q=e.target.closest('[data-qnd]');if(q)return qsupp(q);var i=e.target.closest('[data-nd]');if(i)more(i)};$('evl').onclick=function(e){var qf=e.target.closest('[data-qf]');if(qf)return qdl(qf);if(e.target.closest('[data-f]'))return dlClick(e)};
 document.querySelectorAll('nav button[data-v]').forEach(function(b){b.addEventListener('click',function(){$('veval').style.display=b.dataset.v=='eval'?'':'none';if(b.dataset.v=='eval')list()})})}
/* 16.10: старый путь «Arbitr App / Оценка» (заглушки …Z-ev-xxxx в общем requests/ Everest + файлы в valuation/V…/input) убран — разделение с Everest.
   21.10: форма снова отправляет запрос — в очередь Arbitr arbitr/appraisal_requests/ ТЕМ ЖЕ форматом, что «Оценить справочно» в «Описи имущества» (docs_appr.js):
   заглушка <id>.json без ПДн {schema,type,id,created_at,status:new,n_items,template,enc,payload_path,response_path}; payload <id>.enc (arbitr/au, ключ из PIN)
   {schema,request_id,rev:0,object_type,template,template_title,valuation_requirement,debtor_type,region,case_no,debtor,valuation_date,items:[{row,table,idx,section,subgroup,fields,name}]}.
   Подхват — tools/appraisal_watch.py (status new → in_progress, eta_minutes), ответ — arbitr/appraisal_results/<id>.enc (appraisal_result_put.py). Настройки и тексты — eval_config.json → queue.
   queue.enabled=false — запасной вариант: только legacy_off_msg. */
var LEGACY_OFF='Запрос оценки отправляется из «Описи имущества» (справочная оценка Arbitr). Эта форма больше не отправляет запросы.';
function QC(){return C.queue||{}}function QON(){return QC().enabled===true}
function QT(k,o){var s=(QC().t||{})[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
function QA(){return window.ArbCP&&ArbCP.qapi?ArbCP.qapi().A:null}
function RQ(){return QC().requests||'arbitr/appraisal_requests/'}function RS(){return QC().results||'arbitr/appraisal_results/'}
function b64(u8){var r='';for(var i=0;i<u8.length;i+=8192)r+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(r)}
function txt64(j){return atob(String(j.content||'').replace(/\s/g,''))}
function stub64(j){return JSON.parse(decodeURIComponent(escape(txt64(j))))}
function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[3]+'.'+m[2]+'.'+m[1]:String(x||'')}
function rid(){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return 'appr_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'_'+Math.random().toString(36).slice(2,6)}
/* список отправленных из «Оценки» запросов — в localStorage только id, тип объекта, время, статус, срок (без ПДн); ответы расшифровываются только в памяти */
var QL=null,QRES={},QTM=null,QBUSY=0;
function qload(){if(QL)return QL;try{QL=JSON.parse(localStorage.getItem(QC().store_key||'arbitr_eval_appr')||'[]')}catch(e){QL=[]}if(!Array.isArray(QL))QL=[];var lim=Date.now()-(+QC().keep_days||30)*864e5;QL=QL.filter(function(x){return x&&x.id&&(x.at||0)>lim});return QL}
function qsave(){try{localStorage.setItem(QC().store_key||'arbitr_eval_appr',JSON.stringify((QL||[]).map(function(x){return {id:x.id,at:x.at,t:x.t,n:x.n,st:x.st,eta:x.eta||null,rsha:x.rsha||null}})))}catch(e){}}
/* значение поля для описания позиции: подписи вариантов, даты ДД.ММ.ГГГГ */
function shown(f){var v=val(f.k),o=f.options||{};if(f.type=='file')return '';if(Array.isArray(v))return v.map(function(k){return o[k]||k}).join(', ');v=String(v||'').trim();if(!v)return '';if(f.type=='select'||f.type=='segment')return o[v]||v;if(f.type=='date')return dmy(v);return v}
function freq(f){return f.type=='file'&&(f.req||(f.k=='files'&&C.types[TY].require_files))}
function missingReq(){return fields().filter(function(f){if(f._h)return false;if(f.type=='file')return QC().files&&freq(f)&&!(val(f.k)||[]).length;return f.req&&!String(shown(f)).trim()}).map(function(f){return f.k=='files'&&C.types[TY].require_files_msg||f.label})}
/* 21.10 (вариант «с файлами»): файлы формы — каждый зашифрован тем же ключом из PIN, что и payload: arbitr/appraisal_requests/<id>/f<N>.enc; список — в payload.files */
function pickFiles(){var L=[];if(!QC().files)return L;fields().forEach(function(f){if(f.type!='file'||f._h)return;[].slice.call(val(f.k)||[]).forEach(function(x){L.push({f:x,field:f.k})})});return L}
/* лимиты на запрос вместе с дозагрузками: extra — сколько файлов уже приложено, extraBytes — их суммарный размер (payload.files[].size) */
function sizeErr(L,extra,extraBytes){var Q=QC(),mb=+(Q.max_file_mb||C.max_file_mb||20),mx=+(Q.max_files||10),tot=+(Q.max_total_mb||50),all=(extra||0)+L.length,sum=(+extraBytes||0)+L.reduce(function(a,x){return a+x.f.size},0);
 var big=L.find(function(x){return x.f.size>mb*1048576});if(big)return QT('file_too_big',{n:big.f.name,mb:mb});if(all>mx)return QT('too_many_files',{n:mx});if(sum>tot*1048576)return QT('total_too_big',{mb:tot});return ''}
async function upFiles(a,id,L,vs,start){var out=[];for(var i=0;i<L.length;i++){var n=start+i+1,x=L[i],path=RQ()+id+'/f'+n+'.enc',en=await a.venc(new Uint8Array(await x.f.arrayBuffer()),vs.s,vs.it);
  await put(path,JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(en.iv),ct:b64(new Uint8Array(en.ct))}),'appraisal file '+id+' f'+n);out.push({n:n,name:x.f.name,size:x.f.size,type:x.f.type||'',field:x.field,path:path})}return out}
function item(){var o={};fields().forEach(function(f){if(f._h||f.type=='file'||f.k=='valuation_date'||(f.k=='object_type'&&C.types[TY].mode=='by_document'))return;var v=shown(f);if(v)o[f.label]=v});
 var t=C.types[TY]||{},nm=(t.title_keys||[]).map(function(k){var f=fields().find(function(x){return x.k==k});return f?shown(f):''}).filter(Boolean).join(', ')||t.label||'';
 return {row:1,table:null,idx:null,section:t.label||null,subgroup:null,fields:o,name:nm}}
async function put(path,text,msg,sha){var bo={message:msg,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:typeof text=='string'?u8b64(text):b64(text)};if(sha)bo.sha=sha;var r=await ghApi(path,{method:'PUT',body:JSON.stringify(bo)});if(!r.ok)throw new Error('GitHub '+r.status)}
async function send(e){e.preventDefault();var m=$('emsg');if(!QON()){if(m)m.textContent=C.legacy_off_msg||LEGACY_OFF;return}
 vis();var miss=missingReq();if(miss.length){m.textContent=QT('required',{f:miss.join(', ')});return}
 var a=QA();if(typeof ghApi!='function'||!a||!a.venc||!a.vaultSalt||(a.encOK&&!a.encOK())){m.textContent=QT('no_store');return}
 var FL=pickFiles(),se=sizeErr(FL);if(se){m.textContent=se;return}
 var b=$('esend');if(b.disabled)return;b.disabled=true;m.textContent=QT('sending');
 var id=rid(),it=[item()],vd=val('valuation_date')||new Date().toISOString().slice(0,10),ot=C.types[TY].mode=='by_document'?(val('object_type')||'auto'):TY;
 var pay={schema:'arbitr/appraisal_request/v1',request_id:id,rev:0,object_type:ot,template:QC().template||'eval_form',template_title:(QC().template_title||'')+' · '+((C.types[TY]||{}).label||TY),valuation_requirement:null,debtor_type:null,region:null,case_no:null,debtor:null,valuation_date:vd,items:it};
 try{var vs=a.vaultSalt();if(FL.length){m.textContent=QT('uploading',{n:FL.length});pay.files=await upFiles(a,id,FL,vs,0)};var en=await a.venc(new TextEncoder().encode(JSON.stringify(pay)),vs.s,vs.it);
  await put(RQ()+id+'.enc',JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(en.iv),ct:b64(new Uint8Array(en.ct))}),'appraisal payload '+id);
  await put(RQ()+id+'.json',JSON.stringify(Object.assign({schema:'arbitr/appraisal_request/v1',type:'appraisal',id:id,created_at:new Date().toISOString(),status:'new',n_items:it.length,template:pay.template,enc:{format:'arbitr/au',s:vs.s,it:vs.it},payload_path:RQ()+id+'.enc',response_path:RS()+id+'.enc'},(pay.files&&pay.files.length)?{n_files:pay.files.length}:{}),null,1),'appraisal_request '+id);
  qload().unshift({id:id,at:Date.now(),t:TY,n:it.length,st:'new',eta:null});qsave();
  m.textContent=QT('sent',{m:+QC().eta_default||20});form(TY);draw();qarm(10)}
 catch(x){try{console.error('[Оценка] отправка не удалась:',x)}catch(_){}m.textContent=QT('send_error')}finally{b.disabled=false}}
/* опрос статусов: заглушка (status, eta_minutes), при ответе — расшифровка результата в памяти */
async function qpoll(){var a=QA();if(QBUSY||typeof ghApi!='function'||!a||!a.vdec)return;QBUSY=1;var ch=false;
 try{for(var x of qload()){var sc=false;try{var r=await ghApi(RQ()+x.id+'.json');if(r.ok){var b=stub64(await r.json()),stamp=String(b.done_at||'')+'|'+String(b.partial_at||'')+'|'+String(b.need_data_at||'')+'|'+String(b.result_rev==null?'':b.result_rev);if(stamp!==(x.ra||'')){if(x.ra!=null)sc=true;x.ra=stamp};if(b.status!=x.st||(b.eta_minutes||null)!=x.eta){x.st=b.status;x.eta=b.eta_minutes||null;ch=true}}
   /* повторный ответ (Оценщик заменил файлы/значения): отметка времени в заглушке сменилась — ответ перечитывается */
   if(/^(partial|done|error|need_data)$/.test(x.st)&&(!QRES[x.id]||sc)){var r2=await ghApi(RS()+x.id+'.enc');if(r2.ok){var j=await r2.json();if(!(QRES[x.id]&&x.rsha==j.sha)){QRES[x.id]=JSON.parse(new TextDecoder().decode(await a.vdec(txt64(j))));x.rsha=j.sha||'';ch=true}}}}catch(e){}}}
 finally{QBUSY=0}if(ch){qsave();draw()}qarm()}
function qarm(s){clearTimeout(QTM);if(!QON()||!qload().length)return;var v=$('veval');if(s==null&&!(v&&v.style.display!='none'))return;if(s==null&&!qload().some(function(x){return !/^(done|error)$/.test(x.st)||!QRES[x.id]}))return;QTM=setTimeout(qpoll,(s!=null?s:(+QC().poll_s||60))*1000)}
function qst(x){var k='st_'+x.st,m=x.eta||(+QC().eta_default||20);if(x.st=='in_progress'&&!x.eta)k='st_in_progress_noeta';return QT(k,{m:m})}
function money(v){var n=+v;return isFinite(n)?Math.round(n).toLocaleString('ru-RU'):String(v||'')}
/* «нужны данные» проверяется ПЕРВЫМ: status need_data в заглушке/ответе ИЛИ хотя бы одна позиция need_data (в т.ч. при partial/done) — значок «Нужны данные», а не «готово» */
function qneed(x,r){return x.st=='need_data'||!!(r&&(r.status=='need_data'||(r.items||[]).some(function(y){return y&&y.status=='need_data'})))}
function qnd(x,missing,note){return '<div class="pcard"><div class="sm ewarn"><b>'+E(QT('need_data'))+'</b><ul style="margin:4px 0">'+(missing||[]).map(function(z){return '<li>'+E(z)+'</li>'}).join('')+'</ul>'+(note?E(note)+'<br>':'')+E(QC().files?QT('need_data_upload_hint'):QT('need_data_hint'))+'</div>'+
  (QC().files&&x.st!='supplement'?'<label class="fdrop"><input type="file" multiple data-qnd="'+E(x.id)+'" accept="'+E(C.accept||'')+'"><span>'+E((C.need_data||{}).upload_label||'')+'</span></label><span class="sm" data-qndm="'+E(x.id)+'"></span>':'')+'</div>'}
function qcard(x){var t=(C.types[x.t]||{}).label||x.t||'',r=QRES[x.id],h='<div class="lot pend" data-eq="'+E(x.id)+'"><div class="row" style="grid-template-columns:1fr auto;cursor:default"><div><div class="d1">'+E(QT('pend_title',{t:t}))+'</div><div class="sm">'+E(QT('sent_at',{d:dmy(new Date(x.at-new Date(x.at).getTimezoneOffset()*6e4).toISOString())}))+(r?'':' · <b>'+E(qst(x))+'</b>')+'</div></div><span class="tag">'+E(st(qneed(x,r)?'need_data':(x.st=='done'||x.st=='partial'?'done':'pending')))+'</span></div>';
 if(r){var dt=r.date||'';(r.items||[]).forEach(function(y){if(y.status=='valued')h+='<div class="sm"><b>'+E(QT('value',{v:money(y.value)}))+'</b>'+((y.date||dt)?' '+E(QT('on_date',{d:y.date||dt})):'')+(y.method?' · '+E(y.method):'')+(y.note?'<div>'+E(y.note)+'</div>':'')+'</div>';
   else if(y.status=='need_data')h+=qnd(x,y.missing,y.note)});
  if(r.status=='need_data'&&!(r.items||[]).some(function(y){return y&&y.status=='need_data'}))h+=qnd(x,r.missing,r.note);
  /* полный ответ: справка PDF, расчёт XLSX, «Описание методики» — зашифрованы тем же ключом (arbitr/appraisal_results/<id>/…), расшифровка только в памяти; кнопки и предупреждение — eval_config.json → card_files */
  var F=r.files||{},bt='',wr='';(C.card_files||[]).forEach(function(cf){var f=F[cf.key];if(f&&f.path)bt+='<button type="button" class="lbtn" data-qf="'+E(f.path)+'" data-qn="'+E(f.name||cf.name)+'">'+E(cf.label)+'</button> ';else if(cf.required&&(r.status=='done'||Object.keys(F).length))wr+='<div class="sm ewarn">'+E(cf.missing_warning)+'</div>'});
  if(bt)h+='<div class="evbt">'+bt+'</div>';h+=wr+'<span class="sm" data-qfm="'+E(x.id)+'"></span>';
  h+='<p class="sm">'+E(QT('reference_only'))+'</p>'}
 return h+'</div>'}
async function rawJ(path){var r=await ghApi(path,{headers:{Accept:'application/vnd.github.raw+json'}});if(!r.ok)throw new Error('GitHub '+r.status);return await r.text()}
async function qdl(b){var a=QA(),m=b.closest('.lot').querySelector('[data-qfm]');try{if(!a||!a.vdec)throw new Error('no key');if(m)m.textContent=QT('decrypting');var pl=await a.vdec(await rawJ(b.dataset.qf));
  var u=URL.createObjectURL(new Blob([pl])),l=document.createElement('a');l.href=u;l.download=b.dataset.qn||'file';document.body.appendChild(l);l.click();setTimeout(function(){URL.revokeObjectURL(u);l.remove()},2000);if(m)m.textContent=''}
 catch(x){try{console.error('[Оценка] файл не открылся:',x)}catch(_){}if(m)m.textContent=QT('file_error')}}
/* «Дозагрузить файлы» по «нужны данные»: тот же id, rev+1, reason supplement, новые файлы дописываются к payload.files (f<N+1>…), заглушка status=supplement → appraisal_watch снова берёт в работу */
async function qsupp(inp){var id=inp.dataset.qnd,m=document.querySelector('[data-qndm="'+CSS.escape(id)+'"]'),a=QA(),L=[].slice.call(inp.files||[]).map(function(f){return {f:f,field:'need_data'}});if(!L.length)return;
 try{if(!a||!a.vdec||!a.venc)throw new Error('no key');var rs=await ghApi(RQ()+id+'.json');if(!rs.ok)throw new Error('stub '+rs.status);var sj=await rs.json(),stub=stub64(sj),e=stub.enc||{};
  var re=await ghApi(RQ()+id+'.enc');if(!re.ok)throw new Error('payload '+re.status);var ej=await re.json(),pay=JSON.parse(new TextDecoder().decode(await a.vdec(txt64(ej))));
  var have=(pay.files||[]),se=sizeErr(L,have.length,have.reduce(function(a,f){return a+(+f.size||0)},0));if(se){if(m)m.textContent=se;inp.value='';return}if(m)m.textContent=QT('uploading',{n:L.length});
  var nr=(+pay.rev||0)+1,res=QRES[id]||{},need=(res.items||[]).filter(function(y){return y.status=='need_data'}).map(function(y){return y.row});if(!need.length&&res.status=='need_data')need=(pay.items||[]).map(function(y){return y.row});var start=have.reduce(function(mx,f){return Math.max(mx,+f.n||0)},0);
  var nf=await upFiles(a,id,L,{s:e.s,it:e.it},start);pay.files=have.concat(nf);pay.rev=nr;pay.reason='supplement';pay.supplement={rev:nr,reason:'supplement',rows:need,prev_status:res.status||stub.status||null,files:nf.map(function(f){return f.n})};
  var en=await a.venc(new TextEncoder().encode(JSON.stringify(pay)),e.s,e.it);await put(RQ()+id+'.enc',JSON.stringify({v:1,s:e.s,it:e.it,iv:b64(en.iv),ct:b64(new Uint8Array(en.ct))}),'appraisal payload '+id+' rev '+nr,ej.sha);
  stub.rev=nr;stub.status='supplement';stub.reason='supplement';stub.supplemented_at=new Date().toISOString();stub.n_supplement=need.length;stub.n_files=pay.files.length;delete stub.eta_minutes;
  await put(RQ()+id+'.json',JSON.stringify(stub,null,1),'appraisal_request '+id+': supplement rev '+nr,sj.sha);
  var x=qload().find(function(y){return y.id==id});if(x){x.st='supplement';x.eta=null;x.rsha=null}delete QRES[id];qsave();draw();qarm(10)}
 catch(x){try{console.error('[Оценка] дозагрузка не удалась:',x)}catch(_){}if(m)m.textContent=QT('send_error')}inp.value=''}
window.__evalQ=function(){return {list:qload(),res:QRES,poll:qpoll}};
function title(q){var t=C.types[q.object_type],o=q.object||{};return (t?t.title_keys.map(function(k){return o[k]}).filter(Boolean).join(', '):'')||q.title||q.case_id}
async function list(){var m=$('evm');if(!on()){m.textContent='Доступно в онлайн-версии после входа.';return}m.textContent='Загрузка…';
 try{try{IDX=norm(JSON.parse(await ghRaw('valuation/index.json')))}catch(e){IDX={}}
  if(window.ArbHide){await ArbHide.load();hide()}
  var done=new Set(Object.values(IDX).map(function(x){return x&&x.request_id}).filter(Boolean));PEND=[];
  draw();if(QON()&&qload().length)qpoll()}catch(e){m.textContent='Не удалось получить список: '+e.message}}
function hide(){if(!window.ArbHide)return;Object.keys(IDX).forEach(function(k){var e=IDX[k]||{};if(ArbHide.hidden('eval',k,e.request_id)||ArbHide.has('eval',e.request_id))delete IDX[k]})}
window.EVAL_LIST=function(){return list()};window.EVAL_REFILTER=function(){hide();try{draw()}catch(e){}};window.EVAL_IDX=function(){return IDX};
function opt(k,v){var f=C.common.find(function(x){return x.k==k});return f&&f.options[v]||''}
function draw(){var q=$('eq').value.trim().toLowerCase(),T=function(k){return (C.types[k]||{}).label||''};
 var L=Object.entries(IDX).filter(function(a){return a[1]&&(!q||JSON.stringify(a[1]).toLowerCase().indexOf(q)>=0)}).sort(function(a,b){return (b[1].date||'').localeCompare(a[1].date||'')});
 var Pn=PEND.filter(function(p){return !q||JSON.stringify(p).toLowerCase().indexOf(q)>=0}),QQ=QON()?qload().filter(function(x){return !q||((C.types[x.t]||{}).label||'').toLowerCase().indexOf(q)>=0}):[],QP=QQ.filter(function(x){return !QRES[x.id]}).length;
 $('evm').textContent='Справок: '+L.length+(PEND.length?' · в обработке: '+PEND.length:'')+(QP?' · '+QT('pending_n',{n:QP}):'')+(QQ.length-QP?' · '+QT('answered_n',{n:QQ.length-QP}):'');
 $('evl').innerHTML=QQ.map(qcard).join('')+Pn.map(function(p){return '<div class="lot pend"><div class="row" style="grid-template-columns:1fr auto;cursor:default"><div><div class="d1">'+E(title(p))+'</div><div class="sm">'+E(T(p.object_type))+' · '+E(opt('purpose',p.purpose))+' · '+E(opt('value_type',p.value_type))+' · на '+E(p.valuation_date)+' · файлов: '+(p.files||[]).length+(p.status!='need_data'&&typeof etaStatus=='function'?' · <b>'+E(etaStatus(p))+'</b>':'')+'</div></div><span class="tag">'+E(st(p.status||'pending'))+'</span></div>'+nd(p,p.case_id,p._path)+'</div>'}).join('')+
 (L.length||Pn.length||QQ.length?L.map(function(a){var c=a[0],e=a[1],nm=(e.title||c).replace(/[\\/:*?"<>|«»]+/g,''),wr='';
  var bt=C.card_files.map(function(cf){if(e[cf.key])return '<button class="lbtn" data-f="'+E(nm+' — '+cf.name)+'" data-p="'+E(e[cf.key])+'">'+E(cf.label)+'</button>';if(cf.required)wr+='<div class="sm ewarn">'+E(cf.missing_warning)+'</div>';return ''}).join(' ');
  return '<div class="lot" data-vk="'+E(c)+'"><div class="row" style="grid-template-columns:1fr;gap:6px;cursor:default"><div><div class="d1">'+E(C.doc_title)+': '+E(e.title||c)+'</div><div class="sm">'+E(T(e.object_type))+' · '+E(opt('value_type',e.value_type))+' · на '+E(e.valuation_date||e.date||'')+(e.value!=null?' · <b>'+Math.round(e.value).toLocaleString('ru-RU')+' ₽</b>':'')+(e.range?' ('+e.range.map(function(x){return Math.round(x).toLocaleString('ru-RU')}).join(' – ')+' ₽)':'')+'</div></div><div class="evbt">'+bt+'</div>'+wr+'</div>'+(e.status=='need_data'?nd(e,c,null):'')+'</div>'}).join(''):'<div class="empty">Справок пока нет. Отправьте запрос выше.</div>')}
function norm(x){var o={},a=Array.isArray(x)?x:x&&typeof x=='object'?(Array.isArray(x.items)?x.items:Array.isArray(x.reports)?x.reports:Object.keys(x).map(function(k){var v=x[k];if(v&&typeof v=='object'&&!v.id)v.id=k;return v})):[];
 a.forEach(function(e,i){if(!e||typeof e!='object')return;var r=Object.assign({},e),k=r.request_id||r.case_id||r.id||('i'+i);
  r.report=r.report||r.pdf||r.report_pdf||(r.files&&r.files.pdf);r.xlsx=r.xlsx||r.calc||r.calc_xlsx||(r.files&&r.files.xlsx);r.methodology=r.methodology||r.method||r.methodology_pdf||(r.files&&r.files.methodology);
  var g=r.range;if(g&&!Array.isArray(g)&&typeof g=='object'){r.likely=g.most_likely!=null?g.most_likely:g.likely;r.range=[g.min!=null?g.min:g.low,g.max!=null?g.max:g.high].filter(function(v){return v!=null})}
  if(r.value==null&&r.likely!=null)r.value=r.likely;['report','xlsx','methodology'].forEach(function(f){if(typeof r[f]=='string')r[f]=r[f].replace(/^\/+/,'')});
  r.date=r.date||r.created_at||r.valuation_date;o[k]=r});return o}
function st(k){return (C.statuses||{})[k]||k}
function nd(o,cid,rq){if(o.status!='need_data')return '';var N=C.need_data||{};return '<div class="pcard"><div class="sm ewarn"><b>'+E(st('need_data'))+'.</b> '+E(N.missing_title)+'<ul style="margin:4px 0">'+(o.missing||[]).map(function(x){return '<li>'+E(x)+'</li>'}).join('')+'</ul></div><label class="fdrop"><input type="file" multiple data-nd="'+E(cid)+'"'+(rq?' data-rq="'+E(rq)+'"':'')+'><span>'+E(N.upload_label)+'</span></label><span class="sm" data-ndm="'+E(cid)+'"></span></div>'}
/* «Дозагрузить файлы» в старых карточках need_data: файлов в очереди Arbitr нет — подсказка (queue.t.need_data_hint), иначе legacy_off_msg */
async function more(i){var m=document.querySelector('[data-ndm="'+CSS.escape(i.dataset.nd||'')+'"]');if(m)m.textContent=QON()?QT('need_data_hint'):(C.legacy_off_msg||LEGACY_OFF);i.value=''}
window.__evalDraw=function(i,p){IDX=norm(i);PEND=p||[];draw()};
if(document.readyState=='loading')addEventListener('DOMContentLoaded',init);else init();
})();
