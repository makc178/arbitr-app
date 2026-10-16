/* Проверка контрагентов и поиск АУ по реестрам — очередь arbitr/cp_requests в закрытом хранилище, обработчик tools/counterparty_refresh.py (раз в 10 минут).
   Заглушка <id>.json — без ПДн (вид, число позиций, соль); содержимое (ИНН, наименования) — <id>.enc, AES-GCM ключом из PIN. Ответ — arbitr/cp_results/<id>.enc.
   Ответ заполняет только пустые реквизиты (или ранее заполненные автоматически); итог проверки хранится в карточке на устройстве. Тексты — counterparties.inn_lookup.ui. */
window.ArbCPQ=(function(){
 var LK='arbitr_cpq',TM=null,AUR=[],BUSY=0;
 function Q(){return window.ArbCP&&ArbCP.qapi?ArbCP.qapi():null}
 function A(){return (Q()||{}).A||{}}
 function K(){var C=A().C?A().C():{};return (C.counterparties||{}).inn_lookup||{}}
 function U(k,o){var s=(K().ui||{})[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function D(x){return String(x||'').replace(/\D/g,'')}
 function pend(){try{var L=JSON.parse(localStorage.getItem(LK)||'[]');return Array.isArray(L)?L:[]}catch(e){return []}}
 function setP(L){try{localStorage.setItem(LK,JSON.stringify(L))}catch(e){}}
 function b64(u8){var r='';for(var i=0;i<u8.length;i+=8192)r+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(r)}
 function rid(){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return 'cp_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'_'+Math.random().toString(36).slice(2,6)}
 function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[3]+'.'+m[2]+'.'+m[1]:String(x||'')}
 function toast(m){if(A().toast)A().toast(m)}
 function RQ(){return K().requests||'arbitr/cp_requests/'}function RS(){return K().results||'arbitr/cp_results/'}
 function txt64(j){return atob(String(j.content||'').replace(/\s/g,''))}
 async function put(path,text,msg){var r=await ghApi(path,{method:'PUT',body:JSON.stringify({message:msg,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:u8b64(text)})});if(!r.ok)throw new Error('GitHub '+r.status)}
 async function send(type,payload,meta){
  if(typeof ghApi!='function'||!A().venc||!A().vaultSalt)throw new Error(U('no_store'));
  var vs=A().vaultSalt(),id=rid(),e=await A().venc(new TextEncoder().encode(JSON.stringify(Object.assign({type:type},payload))),vs.s,vs.it);
  var enc=JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(e.iv),ct:b64(new Uint8Array(e.ct))});
  await put(RQ()+id+'.enc',enc,'cp payload '+id);
  await put(RQ()+id+'.json',JSON.stringify({schema:'arbitr/cp_request/v1',id:id,type:type,status:'new',created_at:new Date().toISOString(),n_items:(payload.items||[]).length||1,enc:{format:'arbitr/au',s:vs.s,it:vs.it},payload_path:RQ()+id+'.enc',response_path:RS()+id+'.enc'},null,1),'cp_request '+id);
  var L=pend();L.push(Object.assign({id:id,type:type,at:Date.now(),status:'new'},meta||{}));setP(L);arm(5);return id}
 function arm(s){clearTimeout(TM);if(pend().length)TM=setTimeout(poll,(s!=null?s:(+K().poll_s||30))*1000)}
 async function poll(){if(BUSY)return;BUSY=1;var L=pend(),ch=false;
  try{if(!L.length||typeof ghApi!='function'||!A().vdec)return;
   for(var i=0;i<L.length;i++){var q=L[i];try{
    var r=await ghApi(RS()+q.id+'.enc');
    if(r.ok){var j=await r.json();if(j.sha&&j.sha==q.rsha)continue;var res=JSON.parse(new TextDecoder().decode(await A().vdec(txt64(j))));q.rsha=j.sha||'';q.status=res.status||'done';await apply(q,res);ch=true}
    else{var r2=await ghApi(RQ()+q.id+'.json');if(r2.ok){var b=JSON.parse(decodeURIComponent(escape(txt64(await r2.json()))));if(b.status&&b.status!=q.status){q.status=b.status;q.eta=b.eta_minutes||null;ch=true}}
     else if(r2.status==404&&Date.now()-q.at>864e5){q.status='error';ch=true}}}catch(e){}}
   L=L.filter(function(q){return !/^(done|error)$/.test(q.status)});setP(L);if(ch&&Q())Q().draw();mgrUI()}
  finally{BUSY=0;arm()}}
 /* ---------- применение ответа ---------- */
 function fill(c,u){c.auto=c.auto||{};var n=0;Object.keys(u||{}).forEach(function(k){var v=u[k];if(!v)return;var cur=c[k];if(!cur||(c.auto[k]!=null&&cur===c.auto[k])){if(cur!==v)n++;c[k]=v;c.auto[k]=v}});return n}
 function summ(it){var fd=it.fedresurs||{},b=fd.bankruptcy||{},eg=it.egrul||{},f=eg.fields||{};
  return {at:it.checked_at||new Date().toISOString(),risk:it.risk||null,bank:b.status||null,case_no:b.case_no||'',stage:b.stage||'',status:f.status||f.state||'',liq:!!(eg.risk&&eg.risk.liquidated),summary:String(fd.summary_ru||'').slice(0,400),errors:(it.errors||[]).slice(0,4),reasons:((eg.risk||{}).reasons||[]).slice(0,3)}}
 async function apply(q,res){var P=Q();if(!P)return;
  if(q.type=='au_appointments'){if(window.ArbAUAP)await ArbAUAP.apply(q,res);return}
  if(q.type=='au_search'){AUR=[{at:Date.now(),id:q.id,c:res.candidates||[],err:res.error||''}];toast(res.status=='error'?U('au_error'):U('au_found',{n:(res.candidates||[]).length}));return}
  var ed=P.ed(),all=P.all(),n=0;
  for(var i=0;i<(res.items||[]).length;i++){var it=res.items[i],c=all.find(function(x){return x.id==it.cid});
   [c,ed&&ed.id==it.cid?ed:null].forEach(function(x){if(!x)return;fill(x,it.updates);x.check=summ(it)});if(c){await P.save(c);n++}}
  toast(res.status=='partial'?U('partial',{n:n}):U('done',{n:n}))}
 /* ---------- карточка контрагента ---------- */
 function lvl(r){return {high:U('risk_high'),medium:U('risk_medium'),low:U('risk_low')}[r]||''}
 function btn(c){var inn=D(c.inn),ok=inn.length==10||inn.length==12,L=pend().filter(function(q){return q.type=='refresh'&&(q.cids||[]).indexOf(c.id)>=0}),p=L[0],h='';
  h+='<button type="button" class="lbtn sec dinn" data-cpq="refresh"'+(!ok||p||c._new?' disabled aria-disabled="true"':'')+'>'+E(K().label||U('check'))+'</button>';
  h+='<div class="sm dhint" role="status">'+E(p?(p.status=='in_progress'?U('st_progress',{m:p.eta||10}):U('st_new')):c._new?U('save_first'):!ok?U('need_inn'):K().note||'')+'</div>';
  var k=c.check;if(k){var parts=[U('checked_at',{d:dmy(k.at)})];if(k.bank)parts.push(U('bank_'+k.bank)!='bank_'+k.bank?U('bank_'+k.bank):k.bank);if(k.case_no)parts.push(k.case_no);if(k.status)parts.push(k.status);if(k.risk)parts.push(U('risk',{r:lvl(k.risk)}));
   h+='<div class="sm dcpchk'+(k.risk=='high'?' ewarn':'')+'">'+E(parts.join(' · '))+(k.risk&&k.risk!='low'&&k.reasons&&k.reasons.length?'<br>'+E(k.reasons.join('; ')):'')+(k.errors&&k.errors.length?'<br><span class="dmut">'+E(U('partial_errors'))+'</span>':'')+'</div>'}
  return h}
 document.addEventListener('click',async function(e){var b=e.target.closest&&e.target.closest('[data-cpq]');if(!b||b.disabled)return;e.preventDefault();var P=Q();if(!P)return;
  try{if(b.dataset.cpq=='refresh'){var c=P.ed();if(!c)return;await send('refresh',{items:[{cid:c.id,kind:c.kind||'',inn:D(c.inn),name:c.name||''}]},{cids:[c.id]});P.draw();toast(U('sent'))}
   if(b.dataset.cpq=='au'){var f=mgrVals(),qv=D(f.inn).length==12?D(f.inn):String(f.fio||'').trim();if(!qv){mgrMsg(U('au_need'));return}b.disabled=true;await send('au_search',{q:qv},{});AUR=[];mgrUI();toast(U('sent'))}
   if(b.dataset.cpq=='aupick'){var x=(AUR[0]||{}).c[+b.dataset.i];if(x)mgrSet(x)}}
  catch(err){toast(U('send_error')+': '+(err.message||err))}});
 /* ---------- карточка управляющего: поиск в сводном реестре АУ ---------- */
 function mgrEl(){return document.querySelector('.dmged')}
 function inp(k){return document.getElementById('dm_'+k)}
 function mgrVals(){return {fio:(inp('ФИО_УПРАВЛЯЮЩЕГО')||{}).value||'',inn:(inp('ИНН_УПРАВЛЯЮЩЕГО')||{}).value||''}}
 function mgrMsg(m){var el=document.querySelector('.dauq .dhint');if(el)el.textContent=m}
 function setV(k,v){var i=inp(k);if(!i||!v)return;i.value=i.type=='date'?v:(/^\d{4}-\d\d-\d\d$/.test(v)?dmy(v):v);i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}
 function mgrSet(x){var M=K().au_map||{ФИО_УПРАВЛЯЮЩЕГО:'fio',ИНН_УПРАВЛЯЮЩЕГО:'inn',СРО:'sro',ДАТА_РЕГ_АУ:'date_reg'};Object.keys(M).forEach(function(k){if(!/_СРО$/.test(k)||!(inp(k)||{}).value)setV(k,x[M[k]])});mgrMsg(U('au_filled'));sroFill(true)}
 /* справочник СРО (counterparties.inn_lookup.sro_registry: items из config/sro_registry.json, только проверенные публичные данные):
    по наименованию или ИНН СРО заполняет пустые ИНН/ОГРН/адрес СРО в карточке управляющего */
 function nmS(x){return String(x||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"'“”„]/g,'').replace(/\s+/g,' ').trim()}
 function SR(){return K().sro_registry||{}}
 function sroFind(name,inn){var L=SR().items||[],i=D(inn),n=nmS(name);if(!n&&!i)return null;
  return L.find(function(r){return i&&D(r.inn)==i})||L.find(function(r){return n&&[r.name].concat(r.short||[],r.aliases||[]).some(function(a){return nmS(a)==n})})||null}
 function sroFill(quiet){var s=inp('СРО');if(!s)return 0;var r=sroFind(s.value,(inp('ИНН_СРО')||{}).value),M=SR().map||{ИНН_СРО:'inn',ОГРН_СРО:'ogrn',АДРЕС_СРО:'address'},n=0;
  if(!r){if(!quiet&&s.value.trim()&&Object.keys(M).some(function(k){var i=inp(k);return i&&!i.value}))mgrMsg(U('sro_none'));return 0}
  Object.keys(M).forEach(function(k){var i=inp(k);if(i&&!i.value&&r[M[k]]){setV(k,String(r[M[k]]));n++}});if(n)mgrMsg(U('sro_filled'));return n}
 function sroList(){var s=inp('СРО'),L=SR().items||[];if(!s||!L.length||s.getAttribute('list'))return;var d=document.getElementById('dm_sro_dl');if(!d){d=document.createElement('datalist');d.id='dm_sro_dl';d.innerHTML=L.map(function(r){return '<option value="'+E(r.name)+'">'}).join('');document.body.appendChild(d)}s.setAttribute('list','dm_sro_dl')}
 document.addEventListener('change',function(e){var t=e.target;if(t&&t.id=='dm_СРО'&&t.closest('.dmged'))sroFill()});
 function mgrUI(){var m=mgrEl();if(!m||K().au_search===false)return;var box=m.querySelector('.dauq');if(!box){box=document.createElement('div');box.className='dauq';var h=m.querySelector('h4');if(h)h.after(box);else m.prepend(box)}
  var p=pend().filter(function(q){return q.type=='au_search'})[0],R=AUR[0],h='<button type="button" class="lbtn sec" data-cpq="au"'+(p?' disabled':'')+'>'+E(U('au_btn'))+'</button><div class="sm dhint" role="status">'+E(p?(p.status=='in_progress'?U('st_progress',{m:p.eta||10}):U('st_new')):U('au_note'))+'</div>';
  if(R&&!p){h+=R.c.length?'<div class="dauc" role="list">'+R.c.map(function(x,i){return '<button type="button" class="lot dit dauci" role="listitem" data-cpq="aupick" data-i="'+i+'"><div class="d1">'+E(x.fio)+'</div><div class="sm">'+E(['ИНН '+x.inn,x.sro||(x.in_sro===false?U('au_no_sro'):U('au_sro_unknown')),x.date_reg?U('au_reg',{d:dmy(x.date_reg)}):'',x.active_cases!=null?U('au_cases',{n:x.active_cases}):''].filter(Boolean).join(' · '))+'</div></button>'}).join('')+'</div><p class="sm dmut">'+E(U('au_regno'))+'</p>':'<p class="sm">'+E(R.err?U('au_error'):U('au_none'))+'</p>'}
  if(box.innerHTML!==h)box.innerHTML=h}
 new MutationObserver(function(){var m=mgrEl();if(m&&!m.querySelector('.dauq')){mgrUI();sroList();sroFill(true)}}).observe(document.documentElement,{childList:true,subtree:true});
 setTimeout(function(){arm(3)},4000);
 return {btn:btn,send:send,poll:poll,pending:pend,_apply:apply,_au:function(){return AUR},_sro:sroFind,sroFill:sroFill}})();
