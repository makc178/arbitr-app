/* «Контрагенты → Арбитражный управляющий»: блок «Текущие назначения» в раскрытой карточке АУ.
   Источник — публичная карточка АУ в ЕФРСБ (fedresurs.ru), запрос через очередь arbitr/cp_requests (тип au_appointments, содержимое .enc ключом из PIN),
   обработчик tools/counterparty_refresh.py (раз в 10 мин; не чаще раза в сутки на АУ + сразу после добавления нового). kad.arbitr.ru не используется.
   Хранение — только на устройстве, в IndexedDB рядом с карточкой АУ (запись _ap_<id>, зашифрована ключом из PIN, как сама карточка); в localStorage — только id запросов.
   Спорные строки уходят в «Судебную практику» существующим запросом АУ (arbitr/practice_requests, ArbPRQ.auto). Тексты — docs_config.json → au_appointments. */
window.ArbAUAP=(function(){
 var MID=null,DATA={},LOAD={},ALL={},SENT={},TM=null,BUSY=0,DAY=864e5;
 function Q(){return window.ArbCP&&ArbCP.qapi?ArbCP.qapi():null}
 function A(){return (Q()||{}).A||{}}
 function K(){var C=A().C?A().C():{};return C.au_appointments||{}}
 function on(){return K().enabled!==false}
 function U(k,o){var s=(K().ui||{})[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function D(x){return String(x||'').replace(/\D/g,'')}
 function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[3]+'.'+m[2]+'.'+m[1]:''}
 function encOK(){return !!(window.ArbArch&&!ArbArch.locked()&&window.ArbDB)}
 function mgrs(){return A().MGR?A().MGR():[]}
 function mgr(id){return mgrs().find(function(m){return m.id==id})||null}
 function cno(x){return String(x||'').toUpperCase().replace(/A/g,'А').replace(/\s+/g,'')}
 async function load(mid){if(!encOK())return null;if(!LOAD[mid])LOAD[mid]=(async function(){try{var r=await ArbDB.get('managers','_ap_'+mid);if(r&&r.m)DATA[mid]=JSON.parse(new TextDecoder().decode(await ArbArch.dec(r.m)))}catch(e){}return DATA[mid]||null})();return LOAD[mid]}
 async function store(mid,o){DATA[mid]=o;LOAD[mid]=Promise.resolve(o);await ArbDB.put('managers',{id:'_ap_'+mid,m:await ArbArch.enc(new TextEncoder().encode(JSON.stringify(o)))})}
 function pend(mid){var P=window.ArbCPQ?ArbCPQ.pending():[];return P.filter(function(q){return q.type=='au_appointments'&&(!mid||(q.mids||[]).indexOf(mid)>=0)})[0]||null}
 /* ---------- расписание: раз в сутки на АУ, новый АУ — сразу ---------- */
 function due(m,d){var inn=D(m.f.ИНН_УПРАВЛЯЮЩЕГО);if(inn.length!=12&&!String(m.f.ФИО_УПРАВЛЯЮЩЕГО||'').trim())return false;
  if(pend(m.id)||(SENT[m.id]&&Date.now()-SENT[m.id]<36e5))return false;
  if(!d)return true;var age=Date.now()-(d.at||0);return d.status=='ok'?age>DAY:age>(+K().retry_h||3)*36e5}
 async function tick(force){clearTimeout(TM);TM=setTimeout(tick,(+K().tick_s||120)*1000);if(!force&&navigator.webdriver&&K().auto_in_webdriver===false)return;if(BUSY||!on()||!encOK()||!window.ArbCPQ||typeof ghApi!='function')return;BUSY=1;
  try{var M=mgrs(),L=[];for(var i=0;i<M.length;i++){var m=M[i],d=await load(m.id);if(due(m,d))L.push({mid:m.id,inn:D(m.f.ИНН_УПРАВЛЯЮЩЕГО),fio:String(m.f.ФИО_УПРАВЛЯЮЩЕГО||'').trim(),new:!d})}
   if(L.length){L.forEach(function(x){SENT[x.mid]=Date.now()});await ArbCPQ.send('au_appointments',{items:L},{mids:L.map(function(x){return x.mid})});draw()}}
  catch(e){}finally{BUSY=0}}
 /* ---------- ответ обработчика ---------- */
 async function apply(q,res){var n=0;
  for(var i=0;i<(res.items||[]).length;i++){var it=res.items[i];if(!it||!it.mid)continue;var prev=(await load(it.mid))||{},o;
   if(it.status=='ok')o={at:Date.now(),status:'ok',as_of:it.as_of,rows:it.rows||[],found:it.found||0,truncated:!!it.truncated,prq:prev.prq||{}};
   else o=Object.assign({},prev,{at:Date.now(),status:it.status||'unavailable',err:it.error||'',rows:prev.rows||null,as_of:prev.as_of||null});
   await store(it.mid,o);n++;if(o.status=='ok')try{await disputed(it.mid,o)}catch(e){}}
  draw();return n}
 async function disputed(mid,o){if(K().practice===false||!window.ArbPRQ||!ArbPRQ.auto)return;var m=mgr(mid);
  var rows=(o.rows||[]).filter(function(r){return r.disputed&&r.case_no&&!(o.prq||{})[cno(r.case_no)]});if(!rows.length)return;
  var fio=m?String(m.f.ФИО_УПРАВЛЯЮЩЕГО||''):'',P=K().practice_req||{};
  var id=await ArbPRQ.auto({origin:'au_appointments',category:P.category||'other',urgency:P.urgency||'normal',title:U('prq_title'),source:'Arbitr App / Контрагенты · Текущие назначения АУ',
   question:U('prq_q',{fio:fio,n:rows.length}),case:rows.length==1?{case_no:rows[0].case_no,debtor:{name:rows[0].debtor||null,inn:rows[0].inn||null,type:rows[0].debtor_type||null}}:null,
   items:rows.map(function(r){return {case_no:r.case_no,debtor:r.debtor,inn:r.inn,procedure:r.proc_name,role:r.role,since:r.since,why:r.why}})});
  o.prq=o.prq||{};rows.forEach(function(r){o.prq[cno(r.case_no)]=id});await store(mid,o)}
 /* ---------- блок в карточке АУ ---------- */
 function caseFor(no){var a=A(),S=a.S?a.S():{},k=cno(no);return k?(S.cases||[]).find(function(c){return cno((c.data||{}).НОМЕР_ДЕЛА)==k})||null:null}
 function row(r,o){var c=caseFor(r.case_no),dp=r.disputed,pq=dp&&(o.prq||{})[cno(r.case_no)];
  return '<div class="dapr'+(dp?' disp':'')+'" role="listitem"><div class="dap1"><span class="dapn">'+E(r.debtor||'—')+'</span>'+(r.proc_name?'<span class="dapc">'+E(r.proc_name)+'</span>':'')+(r.role?'<span class="sm dapro">'+E(U('role_'+r.role)!='role_'+r.role?U('role_'+r.role):r.role)+'</span>':'')+'</div>'+
   '<div class="dap2 sm">'+(r.inn?'<span>'+E(U('inn',{v:r.inn}))+'</span>':'')+(r.case_no?(c?'<a href="#" class="dapk" data-apcase="'+E(c.id)+'">'+E(r.case_no)+'</a>':'<span class="dapk">'+E(r.case_no)+'</span>'):'')+
   (dp?'<span class="dapdp" title="'+E((r.why||[]).map(function(w){return U('why_'+w)}).join('; '))+'">'+E(pq?U('disputed_sent'):U('disputed'))+'</span>':'')+(r.since?'<span class="dapd">'+E(U('since',{d:dmy(r.since)}))+'</span>':'')+'</div></div>'}
 function html(mid){var o=DATA[mid],p=pend(mid)||(SENT[mid]&&!o),h='';
  if(!o||!o.rows){var msg=p?U('loading'):(!encOK()?U('locked'):U('no_data'));return '<h4 class="dsh">'+E(U('title'))+'</h4><p class="sm dapem">'+E(msg)+'</p>'}
  var R=o.rows,N=o.found!=null&&o.found>R.length&&o.truncated?o.found:R.length,lim=+K().first||5,all=ALL[mid];
  h='<h4 class="dsh">'+E(U('title_n',{n:N}))+'</h4>';
  if(!R.length)h+='<p class="sm dapem">'+E(U('empty'))+'</p>';
  else h+='<div class="dapl" role="list">'+R.slice(0,all?R.length:lim).map(function(r){return row(r,o)}).join('')+'</div>'+(R.length>lim?'<button type="button" class="lbtn sec dapmore" data-apall="'+E(mid)+'">'+E(all?U('less'):U('more',{n:R.length}))+'</button>':'');
  h+='<p class="sm dapft">'+E(U('footer',{d:dmy(o.as_of)}))+(o.status!='ok'?' · '+E(U('stale')):'')+'</p>';return h}
 function host(){return document.querySelector('.dmged')}
 function guess(m){var i=m.querySelector('#dm_ИНН_УПРАВЛЯЮЩЕГО'),f=m.querySelector('#dm_ФИО_УПРАВЛЯЮЩЕГО'),inn=D(i&&i.value),fio=String(f&&f.value||'').trim().toLowerCase(),L=mgrs().filter(function(x){return inn?D(x.f.ИНН_УПРАВЛЯЮЩЕГО)==inn:fio&&String(x.f.ФИО_УПРАВЛЯЮЩЕГО||'').trim().toLowerCase()==fio});return L.length==1?L[0].id:null}
 async function draw(){var m=host();if(!m||!on())return;if(!MID||!mgr(MID))MID=guess(m);var mid=MID;if(!mid||!mgr(mid)){var old=m.querySelector('.dauap');if(old)old.remove();return}
  await load(mid);m=host();if(!m)return;var box=m.querySelector('.dauap');
  if(!box){box=document.createElement('section');box.className='dauap';box.setAttribute('aria-live','polite');var at=m.querySelector('[data-w="'+(K().after||'EMAIL_АУ')+'"]');if(at)at.after(box);else{var g=m.querySelector('.g2');if(g)g.after(box);else m.appendChild(box)}}
  box.dataset.mid=mid;var h=html(mid);if(box.innerHTML!==h)box.innerHTML=h}
 document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-mgid],[data-mgredit],[data-cp="mgnew"]');if(t){MID=t.dataset.mgid||t.dataset.mgredit||null;setTimeout(draw,0)}},true);
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-apall],[data-apcase]');if(!b)return;e.preventDefault();
  if(b.dataset.apall){ALL[b.dataset.apall]=!ALL[b.dataset.apall];draw();return}
  var id=b.dataset.apcase,cb=document.querySelector('.dmged [data-mg="cancel"]');if(cb)cb.click();
  setTimeout(function(){var el=document.querySelector('[data-debid="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');if(el){el.scrollIntoView({block:'center'});el.click()}else if(A().setCur)A().setCur(id)},60)});
 new MutationObserver(function(){var m=host();if(m&&!m.querySelector('.dauap')&&MID)draw()}).observe(document.documentElement,{childList:true,subtree:true});
 function wrap(){if(window.ArbCP&&ArbCP.editMgr&&!ArbCP.editMgr._ap){var f=ArbCP.editMgr;ArbCP.editMgr=function(id){MID=id||null;var r=f.apply(this,arguments);setTimeout(draw,0);return r};ArbCP.editMgr._ap=1}}
 wrap();setTimeout(wrap,1500);
 setTimeout(tick,(+K().first_tick_s||8)*1000);
 return {apply:apply,draw:draw,tick:tick,_data:function(){return DATA},_mid:function(){return MID},_load:load}})();
