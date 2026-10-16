/* Судебная практика в Arbitr App: запрос подборки от АУ (au_request) — только в зашифрованном виде.
   Заглушка arbitr/practice_requests/<id>.json — без ПДн (тип, категория, срочность, соль); вопрос, дело, вложения (PDF ≤ лимита) — <id>.enc (AES-GCM, ключ из PIN).
   Ответ — arbitr/practice_results/<id>.enc. Открытая отправка в requests/ из этой формы в Arbitr App не выполняется. Тексты — docs_config.json → practice_au. */
window.ArbPRQ=(function(){
 var LK='arbitr_prq',TM=null,RES={},PAY={},PAYQ={},BUSY=0,FILES=[],RTR={};
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
 /* автоматический запрос (спорные строки «Текущие назначения АУ») — та же очередь, тот же формат заглушки и .enc; без вложений */
 async function auto(o){var a=A();if(typeof ghApi!='function'||!a||!a.venc||!a.vaultSalt)throw new Error(U('no_store'));
  var cat=o.category||'other',urg=o.urgency||'normal',id=rid(),pay={type:'court_practice',version:1,source:o.source||'Arbitr App',origin:o.origin||null,role:'au',question:o.question,case:o.case||null,items:o.items||[],
   position:'neutral',category:cat,parties:['au'],court_type:'arb',instances:['first','appeal','cass'],region:'все',period:{years:3},outcome:'both',urgency:urg,attachments:[]};
  var vs=a.vaultSalt(),e=await a.venc(new TextEncoder().encode(JSON.stringify(pay)),vs.s,vs.it);
  await put(RQ()+id+'.enc',JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(e.iv),ct:b64(new Uint8Array(e.ct))}),'practice payload '+id);
  await put(RQ()+id+'.json',JSON.stringify({schema:'arbitr/practice_au_request/v1',type:'au_request',subtype:'court_practice',version:1,id:id,created_at:new Date().toISOString(),status:'new',category:cat,urgency:urg,n_attachments:0,origin:o.origin||null,enc:{format:'arbitr/au',s:vs.s,it:vs.it},payload_path:RQ()+id+'.enc',response_path:RS()+id+'.enc'},null,1),'practice_request '+id);
  var L=pend();L.unshift({id:id,at:Date.now(),status:'new',category:cat,cat_title:o.title||cat});setP(L);if($('prcl'))draw();arm(10);return id}
 /* ---- опрос и показ ---- */
 function arm(s){clearTimeout(TM);if(pend().some(function(q){return /^(new|in_progress|partial)$/.test(q.status)}))TM=setTimeout(poll,(s!=null?s:(+K().poll_s||60))*1000)}
 async function fetchRes(q){var a=A();var r=await ghApi(RS()+q.id+'.enc');if(!r.ok)return null;var j=await r.json();if(j.sha&&q.rsha==j.sha&&RES[q.id])return RES[q.id];q.rsha=j.sha||'';var res=JSON.parse(new TextDecoder().decode(await a.vdec(txt64(j))));RES[q.id]=res;return res}
 /* список: отчёты (не служебные категории) и «Ожидают ответа»; правила — docs_config.json → practice_au.list */
 function LC(){return K().list||{}}
 function isSvc(q){return (LC().service_categories||[]).indexOf(q.category)>=0}
 function hiddenRes(q){return (LC().hide_resolutions||[]).indexOf(q.res)>=0}
 function isReport(q){return (LC().report_statuses||[]).indexOf(q.status)>=0}
 function isWait(q){return (LC().wait_statuses||[]).indexOf(q.status)>=0}
 function final(q){return isReport(q)||(LC().final_statuses||[]).indexOf(q.status)>=0}
 /* срок — только собственный срок Судебной практики: eta_minutes в заглушке вместе с eta_by == list.eta_by (наблюдатель срок не ставит) */
 function meta(q,b){var ch=false,set=function(k,v){if((q[k]==null?null:q[k])!==(v==null?null:v)){q[k]=v;ch=true}};var L=LC();
  set('status',b.status||q.status);set('category',b.category||q.category);set('picked',b.picked_at||null);set('done',b.done_at||b.partial_at||null);set('res',b.resolution||null);
  var own=!!(L.eta_by&&b.eta_by==L.eta_by&&+b.eta_minutes>0);set('beta',own?+b.eta_minutes:null);set('beta_at',own?(b.eta_at||b.picked_at||null):null);if('eta' in q){delete q.eta;ch=true}return ch}
 async function poll(){if(BUSY||typeof ghApi!='function'||!A()||!A().vdec)return;BUSY=1;var L=pend(),ch=false;
  try{for(var i=0;i<L.length;i++){var q=L[i];if(final(q)&&q.metaOk&&(RES[q.id]||isSvc(q)||hiddenRes(q)))continue;try{
    var r2=await ghApi(RQ()+q.id+'.json');if(r2.ok){var b=JSON.parse(decodeURIComponent(escape(txt64(await r2.json()))));if(meta(q,b))ch=true;if(final(q)&&!q.metaOk){q.metaOk=1;ch=true}}
    var res=await fetchRes(q);if(res&&res.status&&!final(q)&&q.status!=res.status){q.status=res.status;ch=true}}catch(e){}}
   setP(L);draw()}finally{BUSY=0;arm()}}
 /* дело и должник — из зашифрованной части запроса (<id>.enc), только после PIN; в памяти, не в localStorage */
 async function loadPay(q){if(PAY[q.id]||PAYQ[q.id])return;var a=A();if(typeof ghApi!='function'||!a||!a.vdec||(a.encOK&&!a.encOK()))return;PAYQ[q.id]=1;
  try{var r=await ghApi(RQ()+q.id+'.enc');if(!r.ok)return;var j=await r.json(),p=JSON.parse(new TextDecoder().decode(await a.vdec(txt64(j)))),c=p.case||{};PAY[q.id]={no:c.case_no||'',debtor:((c.debtor||{}).name)||''};draw()}catch(e){}finally{delete PAYQ[q.id]}}
 function two(n){return ('0'+n).slice(-2)}
 function dt(v){var d=new Date(typeof v=='number'?v:Date.parse(v||''));if(isNaN(d))return '';return two(d.getDate())+'.'+two(d.getMonth()+1)+'.'+d.getFullYear()+' '+two(d.getHours())+':'+two(d.getMinutes())}
 function left(q){if(!q.beta)return null;var t0=Date.parse(q.beta_at||q.picked||'')||q.at;return Math.ceil((t0+q.beta*60000-Date.now())/60000)}
 function stTxt(q){if(q.status=='in_progress'){var m=left(q);if(m==null)return U('st_progress_noeta');return m>0?U('st_progress',{m:m}):''}return U('st_'+q.status)}
 function overdue(q){var m=left(q);return isWait(q)&&m!=null&&m<=0}
 /* повтор: та же заявка (тот же id) снова в очередь — статус new в заглушке; без ПДн, без новой заявки */
 async function retry(id){if(RTR[id]===1||RTR[id]=='ok'||typeof ghApi!='function')return;RTR[id]=1;draw();var L=pend(),q=L.find(function(x){return x.id==id});
  try{var r=await ghApi(RQ()+id+'.json');if(!r.ok)throw new Error('GitHub '+r.status);var j=await r.json(),b=JSON.parse(decodeURIComponent(escape(txt64(j))));
   if(b.status!='new'){(LC().retry_drop||[]).forEach(function(k){delete b[k]});b.status='new';b.retry=(+b.retry||0)+1;b.retry_at=new Date().toISOString();
    var w=await ghApi(RQ()+id+'.json',{method:'PUT',body:JSON.stringify({message:'practice_request retry '+id,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:u8b64(JSON.stringify(b,null,1)),sha:j.sha})});if(!w.ok)throw new Error('GitHub '+w.status)}
   if(q){meta(q,b);setP(L)}RTR[id]='ok'}catch(e){RTR[id]='err'}draw();arm(10)}
 function caseHtml(c){return '<div class="lot dit prqc"><div class="d1">'+E([c.case_no,c.court].filter(Boolean).join(' · '))+'</div><div class="sm">'+E([U('inst_'+(c.instance||'')),(/^(\d{4})-(\d\d)-(\d\d)$/.test(c.date||'')?c.date.split('-').reverse().join('.'):c.date),U('out_'+(c.outcome||''))].filter(function(x){return x&&!/^(inst_|out_)/.test(x)}).join(' · '))+'</div>'+(c.thesis?'<p>'+E(c.thesis)+'</p>':'')+'<blockquote class="prqq">'+E(c.quote)+'</blockquote>'+(c.url?'<a href="'+E(c.url)+'" target="_blank" rel="noopener">'+E(U('open_act'))+'</a>':'')+'</div>'}
 /* ---- отчёт: шапка, вывод, акты карточками; «Скачать PDF» (report.report_pdf) и фильтр «Все · ВС · Кассация» (report.report_court_filter) — флаги в docs_config.json → practice_au.report ---- */
 var RFLT={};
 function RC(){return K().report||{}}
 function dmy(v){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(v||''));return m?m[3]+'.'+m[2]+'.'+m[1]:String(v||'')}
 function badge(c){var L=RC().court_badges||[],s=String(c.court||'');for(var i=0;i<L.length;i++){try{var m=new RegExp(L[i].rx,'i').exec(s);if(m)return String(L[i].label).replace('{1}',m[1]||'')}catch(e){}}var t=U('inst_'+(c.instance||''));return /^inst_/.test(t)?s:t}
 function acts(r){return (r.cases||[]).filter(function(c){return c&&c.quote})}
 function fltOf(id){var F=RC().filters||[],k=RFLT[id]||((F[0]||{}).id);return F.find(function(f){return f.id==k})||null}
 function inFlt(f,c){return !f||!f.instances||f.instances.indexOf(c.instance)>=0}
 function metaLine(q){var p=PAY[q.id]||{};return [p.debtor,p.no,U('rep_done',{d:dd(q.done||q.at)})].filter(Boolean).join(' · ')}
 function dd(v){return dt(v).slice(0,10)}
 function actHtml(c){return '<article class="prqact"><div class="prqah"><span class="prqbdg">'+E(badge(c))+'</span><span class="prqano">'+E(c.case_no||'')+'</span>'+(c.date?'<span class="prqadt">'+E(U('act_date',{d:dmy(c.date)}))+'</span>':'')+'</div>'+
   (c.thesis?'<p class="prqth">'+E(c.thesis)+'</p>':'')+'<blockquote class="prqq">'+E(c.quote)+'</blockquote>'+(c.url?'<a class="prqlnk" href="'+E(c.url)+'" target="_blank" rel="noopener">'+E(U('act_open'))+'</a>':'')+'</article>'}
 function repHtml(q,r){var R=RC(),A2=acts(r),f=R.report_court_filter?fltOf(q.id):null,V=A2.filter(function(c){return inFlt(f,c)});
  var h='<div class="prqrep"><h4 class="prqrt">'+E(topic(q))+'</h4><div class="sm prqrm">'+E(metaLine(q))+'</div>';
  if(r.summary)h+='<section class="prqsum"><div class="prqsumh">'+E(U('conclusion'))+'</div>'+String(r.summary).split(/\n\s*\n|\n/).filter(Boolean).map(function(x){return '<p>'+E(x)+'</p>'}).join('')+'</section>';
  if(R.report_pdf||(R.report_court_filter&&A2.length))h+='<div class="prqtools">'+(R.report_court_filter&&A2.length?'<div class="prqseg" role="tablist" aria-label="'+E(U('filter_aria'))+'">'+(R.filters||[]).map(function(x){var on=f&&f.id==x.id;return '<button type="button" role="tab" aria-selected="'+on+'" class="prqsegb'+(on?' on':'')+'" data-prqflt="'+E(q.id+'|'+x.id)+'">'+E(x.label)+'</button>'}).join('')+'</div>':'')+
   (R.report_pdf?'<button type="button" class="lbtn sec prqpdf" data-prqpdf="'+E(q.id)+'">'+E(U('pdf_btn'))+'</button>':'')+'</div>';
  h+=V.length?V.map(actHtml).join(''):(A2.length?'<p class="sm">'+E(U('no_acts_filter'))+'</p>':'');
  if(r.status=='not_found')h+='<p class="sm">'+E(U('st_not_found'))+'</p>';
  return h+'<p class="sm prqmsg" id="prqmsg_'+E(q.id)+'"></p></div>'}
 async function pdf(id){var q=pend().find(function(x){return x.id==id}),r=RES[id],R=RC(),el=$('prqmsg_'+id);if(!q||!r||!R.report_pdf)return;
  try{if(!window.ArbPDF||!ArbPDF.newDoc)throw new Error('PDF');var doc=await ArbPDF.newDoc({unit:'pt',format:'a4'}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=R.pdf_margin_pt||48,y=M,tw=W-2*M;
   var put=function(t,o){o=o||{};doc.setFont('ArbSans',o.st||'normal');doc.setFontSize(o.fs||11);doc.setTextColor.apply(doc,o.col||[0,0,0]);var L=doc.splitTextToSize(String(t||''),tw-(o.ind||0)),lh=(o.fs||11)*1.35;
    L.forEach(function(s){if(y+lh>H-M){doc.addPage();y=M}doc.text(s,M+(o.ind||0),y+lh*0.8);y+=lh});y+=(o.after||4)};
   put(topic(q),{fs:16,st:'bold',after:2});put(metaLine(q),{fs:10,col:[110,110,110],after:12});
   if(r.summary){put(U('conclusion'),{st:'bold',fs:12});String(r.summary).split(/\n+/).filter(Boolean).forEach(function(x){put(x,{after:6})});y+=6}
   acts(r).forEach(function(c){put([badge(c),c.case_no,c.date?U('act_date',{d:dmy(c.date)}):''].filter(Boolean).join(' · '),{st:'bold',fs:11,after:2});if(c.thesis)put(c.thesis,{after:3});put('«'+c.quote+'»',{st:'italic',ind:12,col:[60,60,60],after:3});if(c.url)put(c.url,{fs:9,col:[20,110,100],after:10})});
   var b=doc.output('blob'),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=String(R.pdf_name||'{id}.pdf').replace('{id}',id);document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000);if(el)el.textContent=''}
  catch(e){if(el)el.textContent=U('pdf_err')}}
 function topic(q){return q.cat_title||q.category||U('practice')}
 function waitRow(g){var q=g[0],p=PAY[q.id]||{},od=overdue(q),st=od?'':stTxt(q),r=RTR[q.id];
  return '<div class="lot dit prqw" data-prqw="'+E(q.id)+'"><div class="d1">'+E([topic(q),p.no].filter(Boolean).join(' · '))+(g.length>1?' <span class="prqn">'+E(U('dup',{n:g.length}))+'</span>':'')+'</div><div class="sm prqs">'+E([U('sent_on',{d:dt(q.at)}),st].filter(Boolean).join(' · '))+
   (od?' · <span class="ewarn">'+E(U('st_overdue'))+'</span> · '+(r=='ok'?'<span>'+E(U('retry_sent'))+'</span>':'<button type="button" class="link prqre" data-prqretry="'+E(q.id)+'"'+(r===1?' disabled':'')+'>'+E(U('retry'))+'</button>'+(r=='err'?' <span class="ewarn">'+E(U('retry_err'))+'</span>':'')):'')+'</div></div>'}
 function draw(){var host=$('prcl');if(!host||!enabled())return;var box=$('prqau');if(!box){box=document.createElement('div');box.id='prqau';host.before(box)}
  var L=pend().filter(function(q){return !isSvc(q)&&!hiddenRes(q)}),R=L.filter(isReport),W=L.filter(isWait);
  if(!R.length&&!W.length){box.innerHTML='';return}
  R.sort(function(a,b){return (Date.parse(b.done||'')||b.at)-(Date.parse(a.done||'')||a.at)});R.concat(W).forEach(loadPay);
  var G=[],GK={};W.slice().sort(function(a,b){return b.at-a.at}).forEach(function(q){var k=q.category+'|'+((PAY[q.id]||{}).no||'')+'|'+topic(q);if(GK[k])GK[k].push(q);else{GK[k]=[q];G.push(GK[k])}});
  var h='<h4 class="dsh">'+E(U('list_title'))+'</h4>'+(R.length?R.map(function(q){var r=RES[q.id],p=PAY[q.id]||{},open=box.dataset.open==q.id;return '<div class="lot dit prqi" data-prqopen="'+E(q.id)+'" role="button" tabindex="0" aria-expanded="'+open+'"><div class="d1">'+E([topic(q),p.debtor,p.no].filter(Boolean).join(' · '))+'</div><div class="sm prqs">'+E(U('got_'+q.status,{d:dt(q.done||q.at)}))+'</div>'+
   (open&&r?repHtml(q,r):'')+'</div>'}).join(''):'<p class="sm">'+E(U('no_reports'))+'</p>');
  if(W.length)h+='<details class="prqwait"'+(box.dataset.wopen?' open':'')+'><summary>'+E(U('waiting',{n:W.length}))+'</summary>'+G.map(waitRow).join('')+'</details>';
  box.innerHTML=h;var d=box.querySelector('.prqwait');if(d)d.addEventListener('toggle',function(){box.dataset.wopen=d.open?'1':''})}
 document.addEventListener('submit',function(e){if(e.target&&e.target.id=='pf'&&enabled()){e.preventDefault();e.stopImmediatePropagation();submit()}},true);
 document.addEventListener('change',function(e){if(e.target.id=='prqfiles'){addFiles(e.target.files);e.target.value=''}if(e.target.id=='prqcase'){e.target.dataset.touched=1;var c=cases().find(function(x){return x.id==e.target.value});if(c&&c.data&&c.data.НОМЕР_ДЕЛА&&$('pcase'))$('pcase').value=c.data.НОМЕР_ДЕЛА}},true);
 document.addEventListener('click',async function(e){var rt=e.target.closest&&e.target.closest('[data-prqretry]');if(rt){e.preventDefault();retry(rt.dataset.prqretry);return}
  var fl=e.target.closest&&e.target.closest('[data-prqflt]');if(fl){e.preventDefault();var pp=fl.dataset.prqflt.split('|');RFLT[pp[0]]=pp[1];draw();return}
  var pf=e.target.closest&&e.target.closest('[data-prqpdf]');if(pf){e.preventDefault();pdf(pf.dataset.prqpdf);return}
  if(e.target.closest&&e.target.closest('.prqrep')&&!e.target.closest('a'))return;
  var d=e.target.closest&&e.target.closest('[data-prqdel],[data-prqopen]');if(!d)return;if(d.dataset.prqdel!=null){FILES.splice(+d.dataset.prqdel,1);attList();return}
  if(e.target.closest('a'))return;var box=$('prqau'),id=d.dataset.prqopen;box.dataset.open=box.dataset.open==id?'':id;var q=pend().find(function(x){return x.id==id});if(box.dataset.open&&q&&!RES[id]&&isReport(q)){try{await fetchRes(q)}catch(x){}}draw()});
 new MutationObserver(function(){if($('pf')&&(!$('prqcase')||!$('prqatt')||($('prqatt').dataset.k!=(K().ui?1:0))))form();if($('prcl')&&!$('prqau')&&pend().length)draw()}).observe(document.documentElement,{childList:true,subtree:true});
 setTimeout(function(){form();arm(5)},4000);
 return {submit:submit,auto:auto,poll:poll,retry:retry,pdf:pdf,_pay:function(){return PAY},pending:pend,form:form,draw:draw,_res:function(){return RES},_files:function(){return FILES}}})();
