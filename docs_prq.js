/* Судебная практика в Arbitr App: запрос подборки от АУ (au_request) — только в зашифрованном виде.
   Заглушка arbitr/practice_requests/<id>.json — без ПДн (тип, категория, срочность, соль); вопрос, дело, вложения (PDF ≤ лимита) — <id>.enc (AES-GCM, ключ из PIN).
   Ответ — arbitr/practice_results/<id>.enc. Открытая отправка в requests/ из этой формы в Arbitr App не выполняется. Тексты — docs_config.json → practice_au. */
window.ArbPRQ=(function(){
 var LK='arbitr_prq',TM=null,RES={},BUSY=0,FILES=[];
 function A(){return window.ArbCP&&ArbCP.qapi?ArbCP.qapi().A:null}
 function K(){var a=A(),C=a&&a.C?a.C():{};return C.practice_au||{}}
 function U(k,o){var s=(K().ui||{})[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function $(i){return document.getElementById(i)}
 function pend(){try{var L=JSON.parse(localStorage.getItem(LK)||'[]');return Array.isArray(L)?L:[]}catch(e){return []}}
 function setP(L){try{localStorage.setItem(LK,JSON.stringify(L))}catch(e){}}
 function b64(u8){var r='';for(var i=0;i<u8.length;i+=8192)r+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(r)}
 function RQ(){return K().requests||'arbitr/practice_requests/'}function RS(){return K().results||'arbitr/practice_results/'}
 function rid(){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return 'prq_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'_'+Math.random().toString(36).slice(2,6)}
 function pv(k){return [].slice.call(document.querySelectorAll('.pills[data-p="'+k+'"] button.on')).map(function(b){return b.dataset.x})}
 function txt64(j){return atob(String(j.content||'').replace(/\s/g,''))}
 async function put(path,text,msg){var r=await ghApi(path,{method:'PUT',body:JSON.stringify({message:msg,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:u8b64(text)})});if(!r.ok)throw new Error('GitHub '+r.status)}
 function enabled(){return K().enabled!==false&&!!$('pf')}
 /* ---- форма: «Дело» вместо «Привязка к лоту», вложения PDF ---- */
 function cases(){var a=A();return a&&a.S?(a.S().cases||[]):[]}
 function caseName(c){var a=A();return a&&a.caseName?a.caseName(c):((c.data||{}).ДОЛЖНИК_НАИМЕНОВАНИЕ||c.id)}
 function form(){var f=$('pf');if(!f||!enabled())return;var pl=$('plot');
  if(pl&&!$('prqcase')){var w=pl.parentNode,lb=w.querySelector('label');if(lb)lb.id='prqcasel';pl.style.display='none';w.hidden=false;w.style.display='';var s=document.createElement('select');s.id='prqcase';w.appendChild(s)}if($('prqcasel'))$('prqcasel').textContent=U('case_label');
  var s=$('prqcase');if(s){var cur=(A()&&A().S().cur)||'',v=s.dataset.touched?s.value:cur,h='<option value="">'+E(U('case_none'))+'</option>'+cases().map(function(c){return '<option value="'+E(c.id)+'"'+(c.id==v?' selected':'')+'>'+E(caseName(c))+'</option>'}).join('');if(s.innerHTML!==h)s.innerHTML=h;var pc=$('pcase'),cc=cases().find(function(x){return x.id==s.value});if(pc&&!pc.value&&cc&&cc.data&&cc.data.НОМЕР_ДЕЛА)pc.value=cc.data.НОМЕР_ДЕЛА}
  if(!$('prqatt')){var p=$('psend')&&$('psend').closest('p');if(p){var d=document.createElement('div');d.id='prqatt';d.innerHTML='<label id="prqattlb"></label><label class="fdrop dlhdrop"><input type="file" id="prqfiles" accept="application/pdf,.pdf" multiple><span id="prqattbt"></span></label><div class="sm" id="prqattl"></div><p class="sm" id="prqatth"></p>';p.before(d)}}
  var a=$('prqatt');if(a){a.dataset.k=K().ui?1:0;$('prqattlb').textContent=U('att_label');$('prqattbt').textContent=U('att_btn');$('prqatth').textContent=U('att_help',{mb:lim()/1048576})}
  attList()}
 function lim(){return (+K().attach_max_mb||10)*1048576}
 function attList(){var el=$('prqattl');if(!el)return;var tot=FILES.reduce(function(a,f){return a+f.size},0);el.innerHTML=FILES.map(function(f,i){return '<div class="dlhit"><span>'+E(f.name)+' <span class="sm">'+Math.max(1,Math.ceil(f.size/1024))+' КБ</span></span><button type="button" class="lbtn sec" data-prqdel="'+i+'">'+E(U('att_del'))+'</button></div>'}).join('')+(FILES.length?'<div class="sm">'+E(U('att_total',{kb:Math.max(1,Math.ceil(tot/1024))}))+'</div>':'')}
 function addFiles(L){var msg='';[].slice.call(L).forEach(function(f){if(!/\.pdf$/i.test(f.name)&&f.type!='application/pdf'){msg=U('att_pdf_only',{n:f.name});return}var tot=FILES.reduce(function(a,x){return a+x.size},0);if(tot+f.size>lim()){msg=U('att_too_big',{mb:lim()/1048576});return}FILES.push(f)});attList();if(msg)setMsg(msg)}
 function setMsg(m){var e=$('pmsg');if(e)e.textContent=m}
 async function submit(){var q=($('prq')||{}).value||'';q=q.trim();if(!q){$('prq').focus();setMsg(U('need_q'));return}
  var a=A();if(typeof ghApi!='function'||!a||!a.venc||!a.vaultSalt){setMsg(U('no_store'));return}
  var cs=cases().find(function(c){return c.id==(($('prqcase')||{}).value||'')}),d=cs&&cs.data||{},per=($('pper')||{}).value||'3',ins=pv('inst');
  var att=[];for(var i=0;i<FILES.length;i++){var f=FILES[i];att.push({name:f.name,type:'application/pdf',size:f.size,data:b64(new Uint8Array(await f.arrayBuffer()))})}
  var cat=($('prcat')||{}).value||'',urg=pv('urg')[0]||'normal',id=rid();
  var pay={type:'court_practice',version:1,source:'Arbitr App / Судебная практика',role:'au',question:q,
   case:cs?{case_id:cs.id,case_no:d.НОМЕР_ДЕЛА||(($('pcase')||{}).value||'').trim()||null,court:d.СУД||null,procedure:d.ПРОЦЕДУРА||null,debtor:{name:d.ДОЛЖНИК_НАИМЕНОВАНИЕ||null,inn:d.ДОЛЖНИК_ИНН||null,type:a.debtorType?a.debtorType(cs):null}}:{case_no:(($('pcase')||{}).value||'').trim()||null},
   position:pv('pos')[0]||'neutral',category:cat,parties:pv('parties'),court_type:pv('court')[0]||'arb',instances:ins.length?ins:['vs','cass'],region:($('prreg')||{}).value||'все',
   period:per==='custom'?{from:($('prp0')||{}).value||null,to:($('prp1')||{}).value||null}:{years:+per},outcome:pv('out')[0]||'both',urgency:urg,attachments:att};
  setMsg(U('sending'));
  try{var vs=a.vaultSalt(),e=await a.venc(new TextEncoder().encode(JSON.stringify(pay)),vs.s,vs.it);
   await put(RQ()+id+'.enc',JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(e.iv),ct:b64(new Uint8Array(e.ct))}),'practice payload '+id);
   await put(RQ()+id+'.json',JSON.stringify({schema:'arbitr/practice_au_request/v1',type:'au_request',subtype:'court_practice',version:1,id:id,created_at:new Date().toISOString(),status:'new',category:cat,urgency:urg,n_attachments:att.length,enc:{format:'arbitr/au',s:vs.s,it:vs.it},payload_path:RQ()+id+'.enc',response_path:RS()+id+'.enc'},null,1),'practice_request '+id);
   var L=pend();L.unshift({id:id,at:Date.now(),status:'new',category:cat,cat_title:(($('prcat')||{}).selectedOptions||[{}])[0].text||cat});setP(L);
   $('prq').value='';FILES=[];attList();setMsg(U('sent'));draw();arm(10)}
  catch(err){setMsg(U('send_error')+': '+(err.message||err))}}
 /* ---- опрос и показ ---- */
 function arm(s){clearTimeout(TM);if(pend().some(function(q){return /^(new|in_progress|partial)$/.test(q.status)}))TM=setTimeout(poll,(s!=null?s:(+K().poll_s||60))*1000)}
 async function fetchRes(q){var a=A();var r=await ghApi(RS()+q.id+'.enc');if(!r.ok)return null;var j=await r.json();if(j.sha&&q.rsha==j.sha&&RES[q.id])return RES[q.id];q.rsha=j.sha||'';var res=JSON.parse(new TextDecoder().decode(await a.vdec(txt64(j))));RES[q.id]=res;return res}
 async function poll(){if(BUSY||typeof ghApi!='function'||!A()||!A().vdec)return;BUSY=1;var L=pend(),ch=false;
  try{for(var i=0;i<L.length;i++){var q=L[i];if(!/^(new|in_progress|partial)$/.test(q.status)&&RES[q.id])continue;try{
    var res=await fetchRes(q);if(res){if(q.status!=res.status){q.status=res.status;ch=true}}
    else{var r2=await ghApi(RQ()+q.id+'.json');if(r2.ok){var b=JSON.parse(decodeURIComponent(escape(txt64(await r2.json()))));if(b.status!=q.status||(b.eta_minutes||null)!=(q.eta||null)){q.status=b.status;q.eta=b.eta_minutes||null;q.picked=b.picked_at||null;ch=true}}}}catch(e){}}
   setP(L);draw()}finally{BUSY=0;arm()}}
 function stTxt(q){if(q.status=='in_progress')return q.eta?U('st_progress',{m:q.eta}):U('st_progress_noeta');return U('st_'+q.status)}
 function caseHtml(c){return '<div class="lot dit prqc"><div class="d1">'+E([c.case_no,c.court].filter(Boolean).join(' · '))+'</div><div class="sm">'+E([U('inst_'+(c.instance||'')),(/^(\d{4})-(\d\d)-(\d\d)$/.test(c.date||'')?c.date.split('-').reverse().join('.'):c.date),U('out_'+(c.outcome||''))].filter(function(x){return x&&!/^(inst_|out_)/.test(x)}).join(' · '))+'</div>'+(c.thesis?'<p>'+E(c.thesis)+'</p>':'')+'<blockquote class="prqq">'+E(c.quote)+'</blockquote>'+(c.url?'<a href="'+E(c.url)+'" target="_blank" rel="noopener">'+E(U('open_act'))+'</a>':'')+'</div>'}
 function draw(){var host=$('prcl');if(!host||!enabled())return;var box=$('prqau');if(!box){box=document.createElement('div');box.id='prqau';host.before(box)}
  var L=pend();if(!L.length){box.innerHTML='';return}
  box.innerHTML='<h4 class="dsh">'+E(U('list_title'))+'</h4>'+L.map(function(q){var r=RES[q.id],open=box.dataset.open==q.id;return '<div class="lot dit prqi" data-prqopen="'+E(q.id)+'" role="button" tabindex="0"><div class="d1">'+E(q.cat_title||q.category||U('practice'))+'</div><div class="sm">'+E(new Date(q.at).toLocaleString('ru-RU',{dateStyle:'short',timeStyle:'short'})+' · '+stTxt(q))+'</div>'+
   (open&&r?'<div class="prqr">'+(r.summary?'<p>'+E(r.summary)+'</p>':'')+(r.cases||[]).filter(function(c){return c&&c.quote}).map(caseHtml).join('')+(r.status=='not_found'?'<p class="sm">'+E(U('st_not_found'))+'</p>':'')+'</div>':'')+'</div>'}).join('')}
 document.addEventListener('submit',function(e){if(e.target&&e.target.id=='pf'&&enabled()){e.preventDefault();e.stopImmediatePropagation();submit()}},true);
 document.addEventListener('change',function(e){if(e.target.id=='prqfiles'){addFiles(e.target.files);e.target.value=''}if(e.target.id=='prqcase'){e.target.dataset.touched=1;var c=cases().find(function(x){return x.id==e.target.value});if(c&&c.data&&c.data.НОМЕР_ДЕЛА&&$('pcase'))$('pcase').value=c.data.НОМЕР_ДЕЛА}},true);
 document.addEventListener('click',async function(e){var d=e.target.closest&&e.target.closest('[data-prqdel],[data-prqopen]');if(!d)return;if(d.dataset.prqdel!=null){FILES.splice(+d.dataset.prqdel,1);attList();return}
  if(e.target.closest('a'))return;var box=$('prqau'),id=d.dataset.prqopen;box.dataset.open=box.dataset.open==id?'':id;var q=pend().find(function(x){return x.id==id});if(box.dataset.open&&q&&!RES[id]&&/^(done|partial|not_found)$/.test(q.status)){try{await fetchRes(q)}catch(x){}}draw()});
 new MutationObserver(function(){if($('pf')&&(!$('prqcase')||!$('prqatt')||($('prqatt').dataset.k!=(K().ui?1:0))))form();if($('prcl')&&!$('prqau')&&pend().length)draw()}).observe(document.documentElement,{childList:true,subtree:true});
 setTimeout(function(){form();arm(5)},4000);
 return {submit:submit,poll:poll,pending:pend,form:form,draw:draw,_res:function(){return RES},_files:function(){return FILES}}})();
