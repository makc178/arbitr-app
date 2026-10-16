/* Arbitr App — поля карточки должника и даты (отдельный модуль, docs.js не трогаем). Настройки — assets/docs_dfx_cfg.js (tools/gen_dfx_cfg.py ← config/).
   1) «Сегодня» у поля даты: кнопки нет там, где она неприменима (config/date_fields.json: today_button:false, no_today_patterns).
   2) Суд по индексу в номере дела («А56-…» → полное наименование, config/court_codes.json): только в пустое поле или поверх прежней автоподстановки;
      ручной ввод не перезаписывается — показывается «По номеру дела: … · Подставить». Метка источника «по номеру дела · справочник от ДД.ММ.ГГГГ».
   3) Кредиторы должника в «Контрагентах» (config/debtor_creditors.json): из блока «Кредиторы» карточки назначения АУ (пакет под PIN) — карточка на каждого
      кредитора с ролью «Кредитор», привязанная к делу; без дублей; ручные карточки не меняются (только привязка и роль). Граждане/ИП — целиком под PIN (sealed).
      Назначения по делу нет — заявка «Судебной практике» (ArbPRQ.auto, заглушка без ПДн). Статус — в карточке должника. */
window.ArbDFX=(function(){
 var CF=window.ARB_DFX_CFG||{},DC=CF.dates||{},CC=CF.courts||{},CR=CF.creditors||{},CU=CR.ui||{},UI=CF.ui||{};
 var RQK='arbitr_dfx_crq',LAST={},BUSY=0,BT={},STAT={},MISS={};
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function T(s,o){s=String(s==null?'':s);o=o||{};Object.keys(o).forEach(function(n){s=s.split('{'+n+'}').join(o[n])});return s}
 function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));if(m)return m[3]+'.'+m[2]+'.'+m[1];var d=new Date(x);if(x&&!isNaN(d)){var p=function(n){return ('0'+n).slice(-2)};return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()}return String(x||'')}
 function digits(x){return String(x||'').replace(/\D/g,'')}
 function norm(x){return String(x||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"'.,]/g,' ').replace(/\s+/g,' ').trim()}
 function canon(no){return String(no||'').trim().toUpperCase().replace(/A/g,'А').replace(/\s+/g,'')}
 /* ключ дела для сверки: «№ А56–97144/21 (з-1)», «A56-97144/2021», неразрывные/длинные тире → «А56-97144/2021» */
 function ckey(no){var t=String(no||'').toUpperCase().replace(/[\u2010-\u2015\u2212\u00AD]/g,'-').replace(/\u00A0/g,' '),m=/[АA][А-ЯA-Z]?\s*(\d{2}П?)\s*-\s*(\d+)\s*\/\s*(\d{2,4})/.exec(t);if(!m)return '';var y=m[3].length==2?'20'+m[3]:m[3];return 'А'+m[1]+'-'+(+m[2])+'/'+y}
 function fvv(o){return o&&typeof o=='object'?o.value:o}
 /* ---------- 1. «Сегодня» ---------- */
 var NRE=(DC.no_re||[]).map(function(r){try{return new RegExp(r)}catch(e){return null}}).filter(Boolean);
 function keyOf(i){var d=i&&i.dataset||{};return d.k||d.dk||d.clk||d.apf||''}
 function today(k){if(!k)return DC['default']!==false;if((DC.yes||[]).indexOf(k)>=0)return true;if((DC.no||[]).indexOf(k)>=0)return false;if(NRE.some(function(r){return r.test(k)}))return false;return DC['default']!==false}
 function cssToday(){var ks=(DC.no||[]),sel=[];['k','dk','clk','apf'].forEach(function(a){ks.forEach(function(k){sel.push('.ddate:has([data-'+a+'="'+k.replace(/"/g,'')+'"]) .ddtoday')})});
  if(!sel.length)return;var st=document.createElement('style');st.id='dfx_css';st.textContent=sel.join(',')+'{display:none!important}.dfxsrc{display:block;font-size:12px;color:var(--mut,#7a8a86);margin-top:3px}.dfxalt{display:flex;gap:8px;align-items:center;font-size:12px;margin-top:4px;flex-wrap:wrap}.dfxalt button{font-size:12px;padding:2px 10px}.dfxcr{margin:12px 0;padding:10px 12px;border:1px solid var(--line,#2c4a43);border-radius:10px}.dfxcr h4{margin:0 0 6px}.dfxcr .st{font-size:13px}.dfxcr ul{list-style:none;margin:8px 0 0;padding:0}.dfxcr li{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid var(--line,#2c4a43);font-size:13px}.dfxcr li span.sm{color:var(--mut,#7a8a86)}';document.head.appendChild(st)}
 function stripToday(root){(root||document).querySelectorAll('.ddate .ddtoday').forEach(function(b){var w=b.closest('.ddate'),i=w&&w.querySelector('[data-date]');if(i&&!today(keyOf(i)))b.remove()})}
 /* ---------- 2. суд по номеру дела ---------- */
 function codes(){if(CC.codes)return CC.codes;var B=(window.ArbAUDEB&&ArbAUDEB._bun&&ArbAUDEB._bun())||{};for(var k in B){var c=B[k]&&B[k].b&&B[k].b.court_codes;if(c&&c.codes){CC.codes=c.codes;if(c.src)CC.src=c.src;return c.codes}}return null}   /* справочник судов приходит в пакете назначений (под PIN) */
 function court(no){var re;try{re=new RegExp(CC.re||'^[АA]\\s*(\\d{2}П?)\\s*-\\s*\\d+')}catch(e){return null}var m=re.exec(String(no||'').trim().toUpperCase());if(!m)return null;var k='А'+m[1];var M=codes();return {k:k,name:(M||{})[k]||null,ready:!!M}}
 function setV(i,v){i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}
 function pair(no){var a=no.dataset.dk?'dk':'k',scope=no.closest('#vdocs,.dcard,form,.lot,body')||document;return scope.querySelector('[data-'+a+'="СУД"]')}
 function srcBox(i,cls){var w=i.closest('div,label')||i.parentNode,x=w.querySelector(':scope > .'+cls);if(!x){x=document.createElement('span');x.className=cls;w.appendChild(x)}return x}
 function courtSync(no,force){var su=pair(no);if(!su)return;var c=court(no.value),sb=srcBox(su,'dfxsrc'),ab=srcBox(su,'dfxalt');ab.innerHTML='';
  if(c&&!c.ready)return;if(!c||!c.name){sb.textContent=c&&c.k&&no.value.length>5&&!su.value?T(UI.court_unknown,{k:c.k}):(su.dataset.dfxAuto&&su.value===su.dataset.dfxAuto?'':sb.textContent);if(!su.value)sb.textContent=c&&c.k?T(UI.court_unknown,{k:c.k}):'';return}
  var lbl=T(UI.court_src,{d:dmy((CC.src||{}).checked)}),cur=su.value.trim();
  if(!cur||cur===su.dataset.dfxAuto||force){if(cur!==c.name)setV(su,c.name);su.dataset.dfxAuto=c.name;sb.textContent=lbl;return}
  if(norm(cur)==norm(c.name)){sb.textContent=lbl;return}
  sb.textContent='';ab.innerHTML='<span>'+E(T(UI.court_alt,{v:c.name}))+'</span><button type="button" class="lbtn sec" data-dfx="court">'+E(UI.court_use||'Подставить')+'</button>'}
 function courtScan(root){if(!codes())return;(root||document).querySelectorAll('[data-dk="НОМЕР_ДЕЛА"],[data-k="НОМЕР_ДЕЛА"]').forEach(function(no){if(no.dataset.dfxSeen==no.value)return;no.dataset.dfxSeen=no.value;courtSync(no)})}
 /* ---------- 3. кредиторы ---------- */
 function A(){return (window.ArbCP&&ArbCP.qapi&&ArbCP.qapi().A)||null}
 function cases(){var a=A();try{return (a&&a.S().cases)||[]}catch(e){return []}}
 function unlocked(){return !!(window.ArbArch&&!ArbArch.locked()&&window.ArbDB&&window.ArbAUDEB)}
 function bundles(){var B=(window.ArbAUDEB&&ArbAUDEB._bun&&ArbAUDEB._bun())||{},out=[];Object.keys(B).forEach(function(mid){if(B[mid]&&B[mid].b)out.push({mid:mid,b:B[mid].b})});return out}
 function cardInn(c){var ap=c.appointment||{},f=c.fields||{};return digits(fvv(ap.inn)||fvv(f.ДОЛЖНИК_ИНН)||fvv((c.debtor||{}).inn))}
 function apptOf(cs){var d=cs.data||{},no=ckey(d.НОМЕР_ДЕЛА),inn=digits(d.ДОЛЖНИК_ИНН),L=bundles(),byInn=null;if(!no&&!inn)return null;
  for(var i=0;i<L.length;i++){var cards=L[i].b.cards||{};for(var a in cards){var c=cards[a],k=ckey(c.case_no)||ckey(fvv((c.fields||{}).НОМЕР_ДЕЛА));
   if(no&&k==no)return {mid:L[i].mid,b:L[i].b,a:a,card:c};
   if(!byInn&&inn&&inn.length>=10&&cardInn(c)==inn&&(!no||!k))byInn={mid:L[i].mid,b:L[i].b,a:a,card:c}}}
  return byInn}
 /* требования из пакета по делу (claims[].case_no / appointment_id), даже если блок «Кредиторы» карточки ещё не собран */
 function claimsFor(b,a,no){var out=[],C=b.creditors||{};Object.keys(C).forEach(function(id){var cr=C[id];if((cr.claims||[]).some(function(c){return (a&&c.appointment_id==a)||(no&&ckey(c.case_no)==no)}))out.push(id)});return out}
 function anyClaims(no){if(!no)return false;return bundles().some(function(x){return claimsFor(x.b,null,no).length>0})}
 function ensureBundles(){if(!window.ArbAUDEB||!ArbAUDEB.ensure)return;var a=A(),M=(a&&a.MGR&&a.MGR())||[],t=Date.now(),per=(+CR.bundle_refresh_min||10)*60000;M.forEach(function(m){if(m.id=='au_builtin'||!(m.f||{}).ИНН_УПРАВЛЯЮЩЕГО)return;if(BT[m.id]&&t-BT[m.id]<per)return;BT[m.id]=t;try{ArbAUDEB.ensure(m.id)}catch(e){}})}
 function allFresh(){var a=A(),M=((a&&a.MGR&&a.MGR())||[]).filter(function(m){return m.id!='au_builtin'&&(m.f||{}).ИНН_УПРАВЛЯЮЩЕГО});if(!M.length)return true;if(!window.ArbAUDEB||!ArbAUDEB.fresh)return false;return M.every(function(m){return ArbAUDEB.fresh(m.id)>0})}
 function credList(ap){var it=(((ap.card.creditors||{}).items)||[]).slice(),C=ap.b.creditors||{},seen={};it.forEach(function(x){seen[x.creditor_id]=1});claimsFor(ap.b,ap.a,ckey(ap.card.case_no)).forEach(function(id){if(!seen[id]){seen[id]=1;it.push({creditor_id:id,kind:(C[id]||{}).kind,added_from:(C[id].claims||[])[0]&&C[id].claims[0].source})}});return it.map(function(x){var c=C[x.creditor_id]||{};return {cid:x.creditor_id,kind:c.kind||x.kind||'ul',name:fvv(c.name)||x.name||'',inn:digits(fvv(c.inn)||x.inn),ogrn:digits(fvv(c.ogrn)),birth:String(fvv(c.birth)||''),sum:x.sum_kop,status:x.status,src:x.added_from||(ap.card.creditors||{}).source||'kad'}})}
 function maskN(n){var p=String(n||'').trim().split(/\s+/);if(!p[0])return '•••••••';return p[0][0]+'••••••'+(p.length>1?' '+p.slice(1,3).map(function(x){return x[0]+'.'}).join(' '):'')}
 function sealedKind(k){return (CR.sealed_kinds||['fl','ip']).indexOf(k)>=0}
 async function unseal(cp){if(!cp.sealed)return cp;try{return JSON.parse(new TextDecoder().decode(await ArbArch.dec(cp.sealed)))}catch(e){return {}}}
 async function findDup(x,CP){for(var i=0;i<CP.length;i++){var c=CP[i];if(c.auto&&c.auto.creditor_id&&c.auto.creditor_id==x.cid)return c}
  for(var j=0;j<CP.length;j++){var o=CP[j],d=o.sealed?await unseal(o):o,inn=digits(d.inn),og=digits(d.ogrn);
   if(x.inn&&inn&&x.inn==inn)return o;if(x.ogrn&&og&&x.ogrn==og)return o;
   if(sealedKind(x.kind)&&!x.inn&&x.name&&norm(d.name)==norm(x.name)&&(!x.birth||!d.birth||String(d.birth)==x.birth))return o;
   if(!sealedKind(x.kind)&&!x.inn&&!x.ogrn&&x.name&&norm(d.name)==norm(x.name))return o}return null}
 async function syncCase(cs,ap){var q=ArbCP.qapi(),CP=q.all(),L=credList(ap),made=0,linked=0,src=(ap.card.creditors||{}).source||'kad',at=(ap.card.creditors||{}).updated_at||'';
  for(var i=0;i<L.length;i++){var x=L[i];if(!x.name&&!x.inn)continue;var ex=await findDup(x,CP);
   if(ex){var ch=false;if((ex.cases||[]).indexOf(cs.id)<0){ex.cases=(ex.cases||[]).concat([cs.id]);ch=true}if((ex.roles||[]).indexOf('creditor')<0){ex.roles=(ex.roles||[]).concat(['creditor']);ch=true}if(ch){await q.save(ex);linked++}continue}
   var c={id:ArbDB.uid('cp'),kind:['ul','ip','fl','gov','bank'].indexOf(x.kind)>=0?x.kind:'ul',roles:['creditor'],cases:[cs.id],files:[],created:Date.now(),auto:{source:src,at:at,creditor_id:x.cid,appointment_id:ap.a},note:T(CU.note_auto,{'case':(cs.data||{}).НОМЕР_ДЕЛА||'',s:(CU.src||{})[src]||src,d:dmy(at)})};
   if(sealedKind(x.kind)){c.name=maskN(x.name);c.sealed=await ArbArch.enc(new TextEncoder().encode(JSON.stringify({name:x.name,inn:x.inn,ogrn:x.ogrn,birth:x.birth})))}else{c.name=x.name;c.inn=x.inn;c.ogrn=x.ogrn}
   await q.save(c);made++}
  STAT[cs.id]={n:L.length,src:src,at:at,made:made,linked:linked,mid:ap.mid,a:ap.a,items:L};return {made:made,linked:linked}}
 function rqMap(){try{return JSON.parse(localStorage.getItem(RQK)||'{}')}catch(e){return {}}}
 async function ask(cs){var R=CR.request||{};if(R.enabled===false||!window.ArbPRQ||!ArbPRQ.auto)return;var M=rqMap(),r=M[cs.id];if(r&&Date.now()-r.at<(+R.retry_h||24)*3600000)return;
  var id=await ArbPRQ.auto({origin:'debtor_creditors',category:R.category||'creditors_refresh',urgency:R.urgency||'normal',title:CU.title||'Кредиторы',source:'Arbitr App / Контрагенты · Должник',
   question:'Кредиторы должника по делу: наименование/ФИО, ИНН/ОГРН, сумма, очередь, статус (включено/заявлено). Ответ — блок creditors (docs/appointment_card_format.md §6).',case:{НОМЕР_ДЕЛА:(cs.data||{}).НОМЕР_ДЕЛА,ДОЛЖНИК_НАИМЕНОВАНИЕ:(cs.data||{}).ДОЛЖНИК_НАИМЕНОВАНИЕ||'',ДОЛЖНИК_ИНН:(cs.data||{}).ДОЛЖНИК_ИНН||''}});
  M[cs.id]={id:id,at:Date.now()};localStorage.setItem(RQK,JSON.stringify(M))}
 async function fromResult(cs){var r=rqMap()[cs.id];if(!r||!window.ArbPRQ||!ArbPRQ._res)return null;var res=ArbPRQ._res()[r.id];if(!res)return null;var L=res.creditors||(res.result||{}).creditors||(res.answer||{}).creditors;if(!Array.isArray(L))return null;
  var items=L.map(function(c,i){return {creditor_id:'prq_'+r.id+'_'+i,name:fvv(c.name),inn:fvv(c.inn),kind:c.kind,added_from:'kad'}}),C={};L.forEach(function(c,i){C['prq_'+r.id+'_'+i]={kind:c.kind||(digits(fvv(c.inn)).length==12?'fl':'ul'),name:c.name,inn:c.inn,ogrn:c.ogrn,birth:c.birth}});
  return {mid:null,a:null,b:{creditors:C},card:{creditors:{source:'kad',updated_at:res.updated_at||new Date().toISOString(),items:items}}}}
 async function scan(){if(BUSY||CR.enabled===false||!unlocked())return;BUSY=1;try{ensureBundles();var L=cases();
  for(var i=0;i<L.length;i++){var cs=L[i];if(!(cs.data||{}).НОМЕР_ДЕЛА)continue;var ap=apptOf(cs)||await fromResult(cs);
   var cl=ap?credList(ap):[],sig=ap?JSON.stringify([ap.a,(ap.card.creditors||{}).updated_at,cl.length]):'none';if(LAST[cs.id]==sig&&STAT[cs.id])continue;
   if(ap&&cl.length){LAST[cs.id]=sig;await syncCase(cs,ap)}
   else if(ap){LAST[cs.id]=sig;STAT[cs.id]={n:0,wait:1,mid:ap.mid,a:ap.a,src:'kad',at:(ap.card.creditors||{}).updated_at||''}}
   else{if(!allFresh()||anyClaims(ckey((cs.data||{}).НОМЕР_ДЕЛА))){STAT[cs.id]=STAT[cs.id]||{n:0,wait:1};continue}   /* пакеты назначений ещё не получены из репозитория — не спрашиваем */
    MISS[cs.id]=(MISS[cs.id]||0)+1;if(MISS[cs.id]<2){STAT[cs.id]={n:0,wait:1};continue}   /* «нет назначения» — только если так два прохода подряд */
    LAST[cs.id]=sig;try{await ask(cs)}catch(e){}var r=rqMap()[cs.id];STAT[cs.id]=r?{n:0,asked:r}:{n:0,wait:1}}
   if(ap)MISS[cs.id]=0}
  try{ArbCP.qapi().draw()}catch(e){}}finally{BUSY=0}apFill();paint()}
 function caseOfView(){var no=document.querySelector('[data-dk="НОМЕР_ДЕЛА"]');if(!no)return null;var v=ckey(no.value)||canon(no.value);if(!v)return null;return cases().find(function(c){var d=(c.data||{}).НОМЕР_ДЕЛА;return (ckey(d)||canon(d))==v})||null}
 function etaTxt(min){min=+min||0;return min>=60?Math.round(min/60)+' ч':min+' мин'}
 function paint(){var no=document.querySelector('[data-dk="НОМЕР_ДЕЛА"]');if(!no)return;var g=no.closest('.g2');if(!g)return;var box=g.parentNode.querySelector(':scope > .dfxcr');
  var cs=caseOfView(),st=cs&&STAT[cs.id],h;
  if(!unlocked())h='<p class="st sm">'+E(CU.locked)+'</p>';
  else if(!cs||!st)h='<p class="st sm">'+E(CU.waiting)+'</p>';
  else if(st.asked){var R=CR.request||{},left=Math.max(0,(+R.eta_minutes||180)-Math.round((Date.now()-st.asked.at)/60000));h='<p class="st" data-dfx-st="asked">'+E(T(CU.asked,{s:R.provider||'Судебная практика',eta:etaTxt(left||R.eta_minutes)}))+'</p>'}
  else if(st.wait)h='<p class="st sm" data-dfx-st="wait">'+E(CU.waiting)+'</p>';
  else{var sN=(CU.src||{})[st.src]||st.src;h='<p class="st" data-dfx-st="found">'+E(T(st.n?CU.found:CU.none,{n:st.n,s:sN,d:dmy(st.at)}))+(st.made?' · '+E(T(CU.created,{n:st.made})):'')+'</p><ul>'+(st.items||[]).map(function(x){var sl=sealedKind(x.kind),open=window.ArbAUDEB&&ArbAUDEB.pOpen&&ArbAUDEB.pOpen();
    return '<li><span>'+E(sl&&!open?maskN(x.name):x.name)+(sl&&!open?' <span class="sm">· '+E(CU.sealed)+'</span>':'')+'</span>'+(st.mid?'<button type="button" class="lbtn sec" data-dfx="cred" data-mid="'+E(st.mid)+'" data-cid="'+E(x.cid)+'">'+E(CU.open)+'</button>':'')+'</li>'}).join('')+'</ul>'}
  h='<h4 class="dsh">'+E(CU.title||'Кредиторы')+'</h4>'+h;
  if(!box){box=document.createElement('div');box.className='dfxcr';g.parentNode.insertBefore(box,g.nextSibling)}if(box.innerHTML!==h)box.innerHTML=h}
 /* карточка должника в «Контрагентах»: пустые поля — из карточки назначения по тому же делу */
 function apFill(){var no=document.querySelector('[data-dk="НОМЕР_ДЕЛА"]');if(!no||!unlocked())return;var cs=caseOfView();if(!cs)return;var ap=apptOf(cs);if(!ap)return;var F=ap.card.fields||{};
  (CR.fill_from_appointment||[]).forEach(function(k){var i=document.querySelector('[data-dk="'+k+'"]'),v=F[k];if(!i||!v||v.value==null||v.value==='')return;var val=String(v.value);if(i.dataset.date||/^ДАТА_/.test(k))val=dmy(val);
   if(i.dataset.dfxAp&&i.value!==i.dataset.dfxAp)return;if(!i.value.trim()){setV(i,val);i.dataset.dfxAp=val}
   if(i.dataset.dfxAp&&i.value===i.dataset.dfxAp){var sb=srcBox(i,'dfxsrc');sb.textContent=T(CU.src_from,{s:(CU.src_names||{})[v.source]||v.source,d:dmy(v.updated_at)})}})}
 /* ---------- общее ---------- */
 var MT=null;function onMut(){clearTimeout(MT);MT=setTimeout(function(){stripToday();apFill();courtScan();paint()},60)}
 function init(){if(window.__dfx)return;window.__dfx=1;cssToday();stripToday();courtScan();
  new MutationObserver(function(m){for(var i=0;i<m.length;i++){var t=m[i].target;if(t&&t.closest&&t.closest('.dfxcr,.dfxsrc,.dfxalt'))continue;onMut();return}}).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('input',function(e){var i=e.target;if(i&&i.dataset&&(i.dataset.dk=='НОМЕР_ДЕЛА'||i.dataset.k=='НОМЕР_ДЕЛА')){i.dataset.dfxSeen=i.value;courtSync(i)}},true);
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-dfx]');if(!b)return;e.preventDefault();
   if(b.dataset.dfx=='court'){var w=b.closest('div,label'),su=w&&w.querySelector('[data-dk="СУД"],[data-k="СУД"]'),sc=su&&(su.closest('#vdocs,.dcard,form,.lot,body')||document),no=sc&&sc.querySelector(su.dataset.dk?'[data-dk="НОМЕР_ДЕЛА"]':'[data-k="НОМЕР_ДЕЛА"]');if(no)courtSync(no,true)}
   if(b.dataset.dfx=='cred'&&window.ArbAUDEB)ArbAUDEB.openCred(b.dataset.mid,b.dataset.cid)});
  setInterval(scan,(+CR.scan_s||20)*1000);setTimeout(scan,3000)}
 if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',init);else init();
 return {today:today,court:court,scan:scan,ckey:ckey,_apptOf:apptOf,stat:function(){return STAT},_findDup:findDup,_paint:paint}})();
