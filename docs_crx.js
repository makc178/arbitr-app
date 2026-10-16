/* Arbitr App · «Контрагенты → Кредиторы»: выгрузка кредиторов из карточек дел (пакеты карточек назначений АУ, блоки creditors
   «Судебной практики») и группировка списка «По должнику (А–Я)» / «По номеру дела». Правила — config/creditor_export.json (→ ARB_DFX_CFG.crx).
   Объединение — только по ИНН (ЮЛ — также ОГРН); без ИНН/ОГРН — отдельная карточка на каждое дело (ключ = дело + id источника).
   Суммы и очередь в карточку контрагента не копируются: строка дела читает их из карточки дела при показе.
   ФЛ/ИП — целиком под PIN (sealed), в списке маска имени. В localStorage — только счётчики плашки и признак «скрыто». */
window.ArbCRX=(function(){
'use strict';
var SRC=(document.currentScript&&document.currentScript.src)||'docs_crx.js',CF=(window.ARB_DFX_CFG||{}).crx||{},U=CF.ui||{},RW=CF.row||{},DD=CF.dedupe||{},BK='arbitr.crx.banner',BUSY=0,LAST='',ASK={};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function T(t,o){return String(t||'').replace(/\{(\w+)\}/g,function(m,k){return o&&o[k]!=null?o[k]:''})}
function fvv(v){return v&&typeof v=='object'&&'value' in v?v.value:v}
function dig(v){return String(fvv(v)||'').replace(/\D/g,'')}
function dmy(s){if(!s)return '';var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(s));if(m)return m[3]+'.'+m[2]+'.'+m[1];var d=new Date(+s||s);return isNaN(d)?String(s):('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()}
function DF(){return window.ArbDFX||{}}
function ckey(n){return DF().ckey?DF().ckey(n):String(n||'')}
function fixNo(n){return DF().fixNo?DF().fixNo(n):n}
function pOpen(){return !!(window.ArbAUDEB&&ArbAUDEB.pOpen&&ArbAUDEB.pOpen())}
function unlocked(){return !!(window.ArbArch&&!ArbArch.locked()&&window.ArbDB&&window.ArbAUDEB&&window.ArbCP&&ArbCP.qapi)}
function bundles(){var B=(window.ArbAUDEB&&ArbAUDEB._bun&&ArbAUDEB._bun())||{},o=[];Object.keys(B).forEach(function(m){if(B[m]&&B[m].b)o.push({mid:m,b:B[m].b})});return o}
/* ключ карточки: ИНН/ОГРН не храним открытым текстом — хеш с солью хранилища (A.vaultSalt) */
function hk(t){var a=window.ArbCP&&ArbCP.qapi().A,sl='';try{sl=(a&&a.vaultSalt&&a.vaultSalt().s)||''}catch(e){}t=sl+'|'+t;var h1=0x811c9dc5,h2=0x01000193^t.length;for(var i=0;i<t.length;i++){var c=t.charCodeAt(i);h1=Math.imul(h1^c,16777619);h2=Math.imul(h2^c,2246822519)^(h2>>>13)}return 'id:'+(h1>>>0).toString(36)+(h2>>>0).toString(36)}
function sealedKind(k){return (CF.sealed_kinds||['fl','ip']).indexOf(k)>=0}
function maskN(n){var p=String(n||'').trim().split(/\s+/);if(!p[0])return '•••••••';return p[0][0]+'••••••'+(p.length>1?' '+p.slice(1,3).map(function(x){return x[0]+'.'}).join(' '):'')}
function innOk(v){return !!v&&new RegExp(DD.inn_re||'^(\\d{10}|\\d{12})$').test(v)}
function ogrnOk(v){return !!v&&new RegExp(DD.ogrn_re||'^(\\d{13}|\\d{15})$').test(v)}
async function unseal(c){if(!c.sealed)return c;try{return JSON.parse(new TextDecoder().decode(await ArbArch.dec(c.sealed)))}catch(e){return {}}}
function isSro(cr,name){var S=CF.sro||{};if((S.kinds||[]).indexOf(cr.kind)>=0)return true;try{return !!S.name_re&&new RegExp(S.name_re,'i').test(name||'')}catch(e){return false}}
/* связи кредитора с делами: debtors[] (карточки «Судебной практики» связаны со всеми должниками), запасной путь — claims[] */
function linksOf(mid,b,cid,cr){var out=[],seen={};function add(a,no){if(!a&&!no)return;var card=(b.cards||{})[a]||{};no=fixNo(card.case_no||no||'');   /* номер — из карточки дела, если она есть */var k=a||ckey(no);if(seen[k])return;seen[k]=1;out.push({mid:mid,a:a||null,no:no,cid:cid})}
 (cr.debtors||[]).forEach(function(d){add(d.appointment_id,d.case_no)});if(!out.length)(cr.claims||[]).forEach(function(c){add(c.appointment_id,c.case_no)});
 if(!out.length)Object.keys(b.cards||{}).forEach(function(a){if((((b.cards[a].creditors||{}).items)||[]).some(function(x){return x.creditor_id==cid}))add(a,null)});return out}   /* блок «Кредиторы» карточки (items[]) */
/* все записи кредиторов из пакетов → единицы выгрузки: с ИНН/ОГРН — одна на ИНН; без — одна на (дело + id источника) */
function units(){var U2={},L=[];bundles().forEach(function(B){var C=B.b.creditors||{};Object.keys(C).forEach(function(cid){var cr=C[cid]||{},name=String(fvv(cr.name)||''),inn=dig(cr.inn),og=dig(cr.ogrn);
  if(!innOk(inn))inn='';if(!ogrnOk(og))og='';var miss=cr.inn_missing===true||(!inn&&!og),lk=linksOf(B.mid,B.b,cid,cr),k0=(CF.kind_in_creditors||{})[cr.kind],
   base={name:name,inn:inn,ogrn:og,kind:k0||(['ul','ip','fl'].indexOf(cr.kind)>=0?cr.kind:'ul'),org:k0?cr.kind:null,sro:isSro(cr,name),birth:String(fvv(cr.birth)||''),passport:fvv(cr.passport)||'',snils:fvv(cr.snils)||'',at:cr.updated_at||cr.added_at||''};
  if(!name&&!inn&&!og)return;
  if(!miss){var key=hk((inn?'inn:'+inn:'ogrn:'+og)),u=U2[key];if(!u){u=U2[key]=Object.assign({key:key,miss:false,links:[]},base);L.push(u)}lk.forEach(function(l){if(!u.links.some(function(x){return x.mid==l.mid&&x.a==l.a&&x.cid==l.cid}))u.links.push(l)});if(base.at>u.at)u.at=base.at;return}
  (lk.length?lk:[{mid:B.mid,a:null,no:'',cid:cid}]).forEach(function(l){L.push(Object.assign({key:'case:'+(l.a||ckey(l.no)||'-')+'|'+cid,miss:true,links:[l]},base))})})});return L}
async function findInn(u,CP){for(var i=0;i<CP.length;i++){var o=CP[i];if(o.crx&&o.crx.key==u.key)return o}
 for(var j=0;j<CP.length;j++){var o2=CP[j],d=o2.sealed?await unseal(o2):o2,inn=dig(d.inn),og=dig(d.ogrn);if(u.inn&&inn&&u.inn==inn)return o2;if(u.ogrn&&og&&u.ogrn==og&&(u.kind=='ul'||!u.inn))return o2}return null}
function findCase(u,CP){var l=u.links[0];for(var i=0;i<CP.length;i++){var o=CP[i];if(o.crx&&o.crx.key==u.key)return o;
  /* карточка, созданная прежним правилом (docs_dfx.js) по тому же делу и тому же id источника — это та же запись (ключ дело + id), а не объединение по имени */
  if(!o.crx&&o.auto&&l&&o.auto.creditor_id==l.cid&&o.auto.appointment_id==l.a&&!dig(o.inn))return o}return null}
function dcases(u){var a=window.ArbCP&&ArbCP.qapi().A,S=a&&a.S(),L=(S&&S.cases)||[],ks=u.links.map(function(l){return ckey(l.no)}).filter(Boolean);return L.filter(function(c){return ks.indexOf(ckey((c.data||{}).НОМЕР_ДЕЛА))>=0}).map(function(c){return c.id})}
function sig(){var a=window.ArbCP&&ArbCP.qapi().A,S=a&&a.S();return JSON.stringify([((S&&S.cases)||[]).map(function(c){return c.id+'='+ckey((c.data||{}).НОМЕР_ДЕЛА)}),bundles().map(function(B){var C=B.b.creditors||{},ks=Object.keys(C);return [B.mid,ks.length,ks.reduce(function(m,k){var t=(C[k]||{}).updated_at||'';return t>m?t:m},'')]})])}
/* выгрузка; повторный проход — только при изменении пакетов (подхватит и дела, кредиторы которых придут позже) */
var CH=Promise.resolve(null);function run(force){var p=CH.then(function(){return run1(force)},function(){return run1(force)});CH=p.catch(function(){return null});return p}   /* проходы по очереди: принудительный (из карточки должника) не теряется, пока идёт фоновый */
async function run1(force){if(CF.enabled===false||!unlocked())return null;var sg=sig();if(!force&&sg==LAST)return null;BUSY=1;var R={found:0,created:0,linked:0,updated:0,skipped:0,why:{},sro:0};
 try{var q=ArbCP.qapi(),CP=q.all(),L=units();R.found=L.length;
  for(var i=0;i<L.length;i++){var u=L[i],ex=u.miss?findCase(u,CP):await findInn(u,CP),dc=dcases(u),role=u.sro?null:'creditor';
   if(ex){var ch=false,X=ex.crx=ex.crx||{key:u.key,links:[],src:'appt'};if(!X.key){X.key=u.key;ch=true}var mine=!!X.made;
    u.links.forEach(function(l){if(!(X.links||[]).some(function(x){return x.mid==l.mid&&x.a==l.a&&x.cid==l.cid})){X.links=(X.links||[]).concat([l]);ch=true}});
    if(u.at&&u.at>(X.at||'')){X.at=u.at;ch=true}if(u.miss&&!X.inn_missing){X.inn_missing=true;ch=true}
    if(role&&(ex.roles||[]).indexOf(role)<0){ex.roles=(ex.roles||[]).concat([role]);ch=true}
    dc.forEach(function(id){if((ex.cases||[]).indexOf(id)<0){ex.cases=(ex.cases||[]).concat([id]);ch=true}});
    if(!ex.created){ex.created=Date.now();ch=true}
    if(ch){await q.save(ex);if(mine)R.updated++;else{R.linked++;X.merged=1}}else{R.skipped++;R.why.unchanged=(R.why.unchanged||0)+1}continue}
   var c={id:ArbDB.uid('cp'),kind:u.kind,roles:role?[role]:['other'],cases:dc,files:[],created:Date.now(),crx:{key:u.key,links:u.links,at:u.at,src:'appt',made:1,inn_missing:u.miss||undefined,org:u.org||undefined}};
   if(u.sro){c.dir_type=(CF.sro||{}).dir_type||'sro_au';c.auto_dir=true;R.sro++}
   if(sealedKind(u.kind)){var P={};(CF.sealed_fields||['name','inn','ogrn','birth','passport','snils']).forEach(function(f){if(u[f])P[f]=u[f]});c.name=maskN(u.name);c.sealed=await ArbArch.enc(new TextEncoder().encode(JSON.stringify(P)))}
   else{c.name=u.name;if(u.inn)c.inn=u.inn;if(u.ogrn)c.ogrn=u.ogrn}
   await q.save(c);CP=q.all();R.created++}
  LAST=sg;if(R.created||R.linked){var bn=banner();bn.n=(bn.n||0)+R.created;bn.m=(bn.m||0)+R.linked;bn.hidden=false;try{localStorage.setItem(BK,JSON.stringify(bn))}catch(e){}}
  window.__crxLast=R;try{q.draw()}catch(e){}return R}finally{BUSY=0}}
function banner(){try{return JSON.parse(localStorage.getItem(BK)||'{}')||{}}catch(e){return {}}}
/* ---- показ: строка дела из карточки дела ---- */
function caseRow(l){var B=(window.ArbAUDEB&&ArbAUDEB._bun&&ArbAUDEB._bun()||{})[l.mid],b=B&&B.b||{},card=(b.cards||{})[l.a]||{},rg=(card.register_from_claims||{}).items,sum=null,qs={};
 if(rg)rg.forEach(function(x){if(x.creditor_id!=l.cid)return;if(x.amount_kop!=null)sum=(sum||0)+(+x.amount_kop);if(x.queue&&x.queue!='unknown')qs[x.queue]=1});
 else{var cr=(b.creditors||{})[l.cid]||{};(cr.claims||[]).forEach(function(c){if(c.appointment_id!=l.a)return;['amount_principal_kop','amount_sanctions_kop','amount_costs_kop'].forEach(function(f){if(c[f]!=null)sum=(sum||0)+(+c[f])});if(c.queue&&c.queue!='unknown')qs[c.queue]=1})}
 var no=fixNo(card.case_no||l.no||''),t=no;if(sum)t+=T(RW.sum,{s:(sum/100).toLocaleString('ru-RU',{maximumFractionDigits:2})});
 Object.keys(qs).sort().forEach(function(q){t+=q=='subordinated'?(RW.queue_sub||''):T(RW.queue,{q:q})});return {t:t,no:no,deb:debName(b,card),card:card}}
function debName(b,card){var s=card.summary||{},ap=card.appointment||{},n=fvv(s.name)||fvv(ap.debtor_name)||fvv((card.fields||{}).ДОЛЖНИК_НАИМЕНОВАНИЕ)||'',k=(card.debtor||{}).kind;return k=='fl'&&!pOpen()&&n?maskN(n):n}
/* блок в карточке контрагента (под реквизитами): «ИНН не указан» + «↻ Подтянуть», «из карточки дела · ДД.ММ.ГГГГ», «дел: N» и строки дел */
function cardBlock(){var q=window.ArbCP&&ArbCP.qapi&&ArbCP.qapi(),c=q&&q.ed&&q.ed(),k=document.getElementById('dcp_kind');if(!c||!c.crx||!k)return;var g=k.closest('.g2');if(!g)return;
 var X=c.crx,L=(X.links||[]).map(caseRow),as=ASK[c.id]||X.asked,h='';
 if(X.inn_missing&&!dig(c.inn))h+='<p class="crxinn"><span class="bdg warn">'+E(U.inn_missing)+'</span> <button type="button" class="lbtn sec" data-crx="pull">'+E(U.pull)+'</button>'+(window.__crxErr&&!as?' <span class="sm ewarn">'+E(U.pull_fail)+'</span>':'')+(as?' <span class="sm">'+E(T(U.pulled,{d:dmy(as.at)}))+'</span>':'')+'</p>';
 h+='<p class="crxsrc" title="'+E(L.map(function(x){return x.no}).join(', '))+'">'+E(T(U.src,{d:dmy(X.at)}))+'</p><h4 class="dsh">'+E(T(U.cases,{n:L.length}))+'</h4><ul class="crxl">'+L.map(function(x,i){var l=X.links[i];return '<li><button type="button" class="crxa" data-crx="open" data-mid="'+E(l.mid)+'" data-a="'+E(l.a||'')+'">'+E(x.t)+'</button></li>'}).join('')+'</ul>';
 var box=g.parentNode.querySelector(':scope > .crxbox');if(!box){box=document.createElement('div');box.className='crxbox';g.parentNode.insertBefore(box,g.nextSibling)}if(box.innerHTML!==h)box.innerHTML=h}
function bannerPaint(){var bn=banner(),bar=document.querySelector('.dcpbar');var ex=document.querySelector('.crxban');
 var cur=document.querySelector('.dnvi.on[data-cpnav],.dsegb.on[data-cpnav]'),sec=cur&&cur.dataset.cpnav;
 if(!bar||sec!='creditors'||bn.hidden||!(bn.n||bn.m)){if(ex)ex.remove();return}
 var h='<span>'+E(T(U.banner,{n:bn.n||0,m:bn.m||0}))+'</span><button type="button" class="lbtn sec" data-crx="hide">'+E(U.hide)+'</button>';
 if(!ex){ex=document.createElement('div');ex.className='crxban';ex.setAttribute('role','status');bar.parentNode.insertBefore(ex,bar)}if(ex.innerHTML!==h)ex.innerHTML=h}
async function pull(c){var A=window.ArbCP&&ArbCP.qapi().A,R=CF.analyst||{};if(typeof ghApi!='function'||!A||!A.venc||!A.vaultSalt)throw new Error('no store');
 var d=new Date(),p=function(n){return ('0'+n).slice(-2)},id=(R.prefix||'arq_')+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'_'+Math.random().toString(36).slice(2,6),Q=R.queue||'arbitr/analyst_requests/',X=c.crx||{},nm=c.sealed?(await unseal(c)).name:c.name;
 var pay={type:'creditor_requisites',want:'creditors',fields:['inn','ogrn'],items:(X.links||[]).map(function(l){return {appointment_id:l.a,case_no:l.no,creditor_id:l.cid,name:nm||'',kind:c.kind}}),format:'docs/appointment_card_format.md §6',reply:'appt_section_put.py creditors <plaintext вне /workspace> --req '+id};
 var vs=A.vaultSalt(),e=await A.venc(new TextEncoder().encode(JSON.stringify(pay)),vs.s,vs.it),b64=function(u){var s='';u=new Uint8Array(u);for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)},u8=function(t){return btoa(unescape(encodeURIComponent(t)))};
 var put=async function(path,text,msg){var r=await ghApi(path,{method:'PUT',body:JSON.stringify({message:msg,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:u8(text)})});if(!r.ok)throw new Error('GitHub '+r.status)};
 await put(Q+id+'.enc',JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(e.iv),ct:b64(e.ct)}),'analyst payload '+id);
 await put(Q+id+'.json',JSON.stringify({schema:R.schema||'arbitr/practice_au_request/v1',type:'au_request',subtype:'creditor_requisites',version:1,id:id,created_at:new Date().toISOString(),status:'new',category:R.category||'creditor_requisites',urgency:R.urgency||'normal',eta_minutes:+R.eta_minutes||120,n_attachments:0,origin:'creditor_card',enc:{format:'arbitr/au',s:vs.s,it:vs.it},payload_path:Q+id+'.enc'},null,1),'analyst request '+id);
 return id}
/* ---- группировка списка ---- */
function grouped(sec){var N=window.ArbCpNav;if(!N||!N.sortKey)return false;var k=N.sortKey(sec);return k=='debtor'||k=='case'}
function caseData(id){var a=window.ArbCP&&ArbCP.qapi().A,S=a&&a.S();return ((S&&S.cases)||[]).find(function(c){return c.id==id})}
function memb(x){var o=[],seen={};((x.crx||{}).links||[]).forEach(function(l){var r=caseRow(l),k=ckey(r.no)||('a:'+l.a);if(seen[k])return;seen[k]=1;o.push({k:k,no:r.no,deb:r.deb,row:r.t,mid:l.mid,a:l.a})});
 (x.cases||[]).forEach(function(id){var c=caseData(id),d=c&&c.data||{},k=ckey(d.НОМЕР_ДЕЛА)||('c:'+id);if(seen[k]||!c)return;seen[k]=1;o.push({k:k,no:fixNo(d.НОМЕР_ДЕЛА||''),deb:d.ДОЛЖНИК_НАИМЕНОВАНИЕ||'',row:fixNo(d.НОМЕР_ДЕЛА||'')})});return o}
function groups(L,sec,H){var mode=window.ArbCpNav.sortKey(sec),col=new Intl.Collator('ru',{sensitivity:'base',numeric:true}),sn=function(n){return window.ArbCpNav.sortName?window.ArbCpNav.sortName(n):String(n||'')},
  G={},NO=[],vis=[];
 L.forEach(function(x){var M=memb(x);if(!M.length){NO.push(x);return}M.forEach(function(m){var g=G[m.k]||(G[m.k]={k:m.k,no:m.no,deb:m.deb,items:[]});if(!g.deb&&m.deb)g.deb=m.deb;g.items.push({x:x,row:m.row,more:M.length-1})})});
 var byName=function(p,q){var a=!!(p.x.crx&&p.x.crx.inn_missing&&!p.x.inn),b=!!(q.x.crx&&q.x.crx.inn_missing&&!q.x.inn);return (a-b)||col.compare(sn(p.x.name),sn(q.x.name))};
 function rows(items){return items.sort(byName).slice(0,H.lim||100).map(function(it){vis.push(it.x.id);var r=H.row(it.x),ex='<div class="sm crxrow">'+E(it.row)+(it.more>0?' · <span class="crxmore">'+E(T(U.more_cases,{n:it.more}))+'</span>':'')+'</div>';return '<div class="crxit">'+r+ex+'</div>'}).join('')}
 function grp(id,title,body,sub){var on=document.querySelector('[data-grp="'+id+'"]'),open=on?on.classList.contains('on'):true;var pre=window.__crxOpen=window.__crxOpen||{};if(pre[id]!=null)open=pre[id];
  return '<div class="dcgrp crxg'+(sub?' crxsub':'')+(open?' on':'')+'" data-grp="'+E(id)+'"><button type="button" class="dcgrph crxh" data-crxg="'+E(id)+'" aria-expanded="'+open+'"><span class="dcgrpt">'+E(title)+'</span><span class="dcseca" aria-hidden="true">'+(open?'▴':'▾')+'</span></button>'+(open?'<div class="dcgrpb">'+body+'</div>':'')+'</div>'}
 var gs=Object.keys(G).map(function(k){return G[k]}),h=H.sel();
 if(mode=='case'){gs.sort(function(a,b){return col.compare(a.no,b.no)});gs.forEach(function(g){h+=grp('k:'+g.k,T(U.grp,{d:g.deb||U.unknown_debtor,no:g.no,n:g.items.length}),rows(g.items))})}
 else{var D={};gs.forEach(function(g){var dk=sn(g.deb||'').toLowerCase()||'~';(D[dk]=D[dk]||{d:g.deb,cs:[]}).cs.push(g)});
  Object.keys(D).sort(function(a,b){return a=='~'?1:b=='~'?-1:col.compare(a,b)}).forEach(function(dk){var d=D[dk],ids={};d.cs.sort(function(a,b){return col.compare(a.no,b.no)});d.cs.forEach(function(g){g.items.forEach(function(it){ids[it.x.id]=1})});var n=Object.keys(ids).length,nm=d.d||U.unknown_debtor;
   if(d.cs.length==1){var g=d.cs[0];h+=grp('d:'+dk,T(U.grp,{d:nm,no:g.no,n:n}),rows(g.items))}
   else h+=grp('d:'+dk,T(U.grp_debtor,{d:nm,k:d.cs.length,n:n}),d.cs.map(function(g){return grp('k:'+g.k,T(U.grp_case,{no:g.no,n:g.items.length}),rows(g.items),true)}).join(''))})}
 if(NO.length)h+=grp('none',U.no_case||'Без дела',rows(NO.map(function(x){return {x:x,row:'',more:0}})).replace(/<div class="sm crxrow"><\/div>/g,''));
 H.vis(vis.filter(function(v,i){return vis.indexOf(v)==i}));return h}
/* ---- события ---- */
document.addEventListener('click',async function(e){var b=e.target.closest&&e.target.closest('[data-crx],[data-crxg]');if(!b)return;var d=b.dataset;
 if(d.crxg){e.preventDefault();e.stopPropagation();var w=b.closest('[data-grp]'),pre=window.__crxOpen=window.__crxOpen||{};pre[d.crxg]=!(w&&w.classList.contains('on'));try{ArbCP.qapi().draw()}catch(x){}return}
 if(d.crx=='hide'){var bn=banner();bn.hidden=true;try{localStorage.setItem(BK,JSON.stringify(bn))}catch(x){}bannerPaint();return}
 if(d.crx=='open'&&window.ArbAUDEB){e.preventDefault();if(d.a)ArbAUDEB.open(d.mid,d.a);return}
 if(d.crx=='pull'){e.preventDefault();var q=ArbCP.qapi(),c=q.ed();if(!c||!c.crx)return;var R=CF.analyst||{},prev=c.crx.asked;if(prev&&Date.now()-prev.at<(+R.retry_h||24)*3600000){cardBlock();return}
  b.disabled=true;try{var id=await pull(c);c.crx.asked={id:id,at:Date.now()};ASK[c.id]=c.crx.asked;if(!c._new)try{await q.save(c)}catch(x){}}catch(x){b.disabled=false;window.__crxErr=String(x&&x.message||x);try{console.warn('crx pull',window.__crxErr)}catch(y){}}cardBlock()}},true);
var MT=null;function tick(){if(MT)return;MT=setTimeout(function(){MT=null;cardBlock();bannerPaint();run().catch(function(e){try{console.warn('crx',e&&e.message)}catch(x){}})},120)}
function init(){if(window.__crx)return;window.__crx=1;var l=document.createElement('link');l.rel='stylesheet';l.href=SRC.replace(/docs_crx\.js/,'docs_crx.css');document.head.appendChild(l);new MutationObserver(function(m){for(var i=0;i<m.length;i++){var t=m[i].target;if(t&&t.closest&&t.closest('.crxbox,.crxban'))continue;tick();return}}).observe(document.body,{childList:true,subtree:true});setInterval(function(){run().catch(function(){})},30000);tick()}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',init);else init();
return {run:run,units:units,groups:groups,grouped:grouped,caseRow:caseRow,banner:banner,_pull:pull}})();
