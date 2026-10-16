/* Arbitr App — должники из «Текущих назначений» АУ в мастере документа + карточка назначения (макет arbitr_app_design/au_private_debtor, утверждён).
   Данные — пакет карточек назначений arbitr/appt_cards/<au_id>.enc закрытого репозитория (tools/appt_cards.py внутри counterparty_refresh.py, раз в 10 мин),
   зашифрован ключом из PIN; на устройстве — IndexedDB 'managers' _apc_<mid> (зашифровано, как карточка АУ), правки «Сохранить в Контрагенты» — _apu_<mid>.
   Ничего из этого не пишется в localStorage. СНИЛС и номер документа в дело не записываются (дела лежат в localStorage, хоть и зашифрованы).
   Карточки граждан целиком под PIN раздела (ArbUAL, тот же PIN-лист); в списках до PIN — маска «П•••••• И. И.»; СНИЛС/паспорт/рождение — «Показать» на 30 с.
   Сведения из открытых источников справочные: НОМЕР_ДЕЛА, ДАТА_СУДЕБНОГО_АКТА, ДАТА_УТВЕРЖДЕНИЯ_АУ подтверждаются явно, иначе формирование документа не начнётся.
   Настройки и тексты — config/au_debtors.json → assets/docs_audeb_cfg.js (tools/gen_audeb_cfg.py). */
window.ArbAUDEB=(function(){
 var CF=window.ARB_AUDEB_CFG||{},UI=CF.ui||{},TT=UI.t||{};
 var BUN={},LD={},FT={},UO={},SEL={},PH={},ED={},CK={},REV={},AUTO={},OTH={},OV=null,PO=null,BYP=0,KEYS={};
 function Q(){return window.ArbCP&&ArbCP.qapi?ArbCP.qapi():null}
 function A(){return (Q()||{}).A||{}}
 function on(){return CF.enabled!==false&&UI.enabled!==false}
 function T(k,o){var s=TT[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function D(x){return String(x||'').replace(/\D/g,'')}
 function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d):(\d\d))?/.exec(String(x||''));return m?m[3]+'.'+m[2]+'.'+m[1]:String(x||'')}
 function dmyt(x){var d=new Date(x);if(isNaN(d))return dmy(x);var p=function(n){return ('0'+n).slice(-2)};return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes())}
 function rub(k){if(k==null||k==='')return '—';var v=(+k)/100;return v.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})}
 function canon(no){return String(no||'').trim().toUpperCase().replace(/A/g,'А').replace(/\s+/g,'')}
 function encOK(){return !!(window.ArbArch&&!ArbArch.locked()&&window.ArbDB)}
 function casesEnc(){try{return JSON.parse(localStorage.getItem('arbitr_docs_v1')||'{}').casesEnc==1}catch(e){return false}}
 function mgrs(){return A().MGR?A().MGR():[]}
 function mgr(id){return mgrs().find(function(m){return m.id==id})||null}
 function S(){return A().S?A().S():{}}
 function ual(){return window.ArbUAL&&ArbUAL.state?ArbUAL.state():'none'}
 var OPN=0;function pOpen(){var s=ual();return s=='open'||(s!='locked'&&OPN>Date.now())}
 function sv(p){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>'}
 var I={chk:sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),chev:'<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',lock:sv('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  unlock:sv('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>'),ref:sv('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),ext:sv('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  bld:sv('<path d="M4 20V8l8-4 8 4v12M4 20h16M9 20v-6h6v6M8 11h.01M16 11h.01"/>'),user:sv('<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),pen:sv('<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>'),
  warn:sv('<path d="M12 4l9 16H3zM12 10v4M12 17.5v.01"/>'),clock:sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),doc:sv('<path d="M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6"/>'),arch:sv('<path d="M3 4h18v4H3zM5 8v12h14V8M10 12h4"/>'),
  shield:sv('<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>'),info:sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.01"/>'),scale:sv('<path d="M12 3v18M5 7h14M7 7l-3 7h6zM17 7l-3 7h6z"/>'),
  eye:sv('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),home:sv('<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6"/>'),car:sv('<path d="M4 16V11l2-5h12l2 5v5M4 16h16M4 16v3M20 16v3M7.5 13.5h.01M16.5 13.5h.01"/>'),
  box:sv('<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>'),x:sv('<path d="M6 6l12 12M18 6L6 18"/>')};
 var AIC={real_estate:'home',land:'home',flat:'home',building:'bld',vehicle:'car',receivable:'box',other:'box'};
 /* ---------- ключи и хранение ---------- */
 async function sha(s){var b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(function(x){return ('0'+x.toString(16)).slice(-2)}).join('')}
 async function auKey(mid){var m=mgr(mid),inn=D(m&&m.f.ИНН_УПРАВЛЯЮЩЕГО);if(!inn)return null;if(!KEYS[inn])KEYS[inn]=(await sha('arbitr-au:'+inn)).slice(0,16);return KEYS[inn]}
 async function dget(id){try{var r=await ArbDB.get('managers',id);if(r&&r.m)return JSON.parse(new TextDecoder().decode(await ArbArch.dec(r.m)))}catch(e){}return null}
 async function dput(id,o){await ArbDB.put('managers',{id:id,m:await ArbArch.enc(new TextEncoder().encode(JSON.stringify(o)))})}
 async function load(mid){if(!encOK()||!mid)return null;if(!LD[mid])LD[mid]=(async function(){var o=await dget('_apc_'+mid);if(o)BUN[mid]=o;UO[mid]=(await dget('_apu_'+mid))||{};return BUN[mid]||null})();return LD[mid]}
 async function fetchB(mid,force){if(!encOK()||typeof ghApi!='function'||!A().vdec)return;var poll=(+UI.card_poll_s||600)*1000;if(!force&&FT[mid]&&Date.now()-FT[mid]<poll)return;FT[mid]=Date.now();
  var k=await auKey(mid);if(!k)return;
  try{var r=await ghApi((CF.repo_dir||'arbitr/appt_cards/')+k+'.enc',{headers:{Accept:'application/vnd.github.raw'}});
   if(r.status==404){if(!BUN[mid]){BUN[mid]={at:Date.now(),missing:1}}return}
   if(!r.ok)return;var txt=await r.text();if(/^\s*\{\s*"(name|sha|content)"/.test(txt)){var j=JSON.parse(txt);txt=atob(String(j.content||'').replace(/\s/g,''))}
   var b=JSON.parse(new TextDecoder().decode(await A().vdec(txt)));if(BUN[mid]&&BUN[mid].b&&BUN[mid].b.updated_at==b.updated_at)return;
   BUN[mid]={at:Date.now(),b:b};await dput('_apc_'+mid,BUN[mid]);draw();redrawOV();try{ArbAUAP.draw()}catch(x){}}catch(e){}}
 function bun(mid){var o=BUN[mid];return o&&o.b?o.b:null}
 function cards(mid){var b=bun(mid);if(!b)return [];return Object.keys(b.cards||{}).map(function(a){return b.cards[a]})}
 function active(mid){return cards(mid).filter(function(c){return c.status!='archived'}).sort(function(x,y){return String((y.summary||{}).since||'').localeCompare(String((x.summary||{}).since||''))})}
 function card(mid,a){var b=bun(mid);return b&&b.cards?b.cards[a]:null}
 function person(c){return ((c&&c.debtor)||{}).kind=='fl'}
 function mask(n){var p=String(n||'').trim().split(/\s+/);if(!p[0])return '•••••••';return p[0][0]+'••••••'+(p.length>1?' '+p.slice(1,3).map(function(x){return x[0]+'.'}).join(' '):'')}
 function nm(c){var s=c.summary||{};return person(c)&&!pOpen()?(s.mask||mask(s.name)):(s.name||'—')}
 /* ---------- поля: источник, правки, подтверждения ---------- */
 function srcName(s){return ({appointment:'карточка АУ',manual:'вручную',au_card:'карточка АУ',efrsb:'ЕФРСБ',kad:'kad.arbitr.ru',egrul:'ЕГРЮЛ',egrip:'ЕГРИП',analyst:'ЕГРЮЛ'})[s]||s||''}
 function fval(mid,a,f){var e=(ED[a]||{})[f];if(e!=null)return {value:e.value,edited:1,source:'manual',updated_at:e.at};var u=((UO[mid]||{})[a]||{})[f];if(u)return {value:u.value,source:'manual',saved:1,updated_at:u.edited_at};
  var c=card(mid,a),v=c&&(c.fields||{})[f];return v||null}
 function groups(c){var G=UI.groups||{};return [{t:T('g_debtor'),f:(person(c)?G.debtor_fl:G.debtor_ul)||[]},{t:T('g_case'),f:G['case']||[]}]}
 function label(f){return (UI.labels||{})[f]||((CF.field_meta||{})[f]||{}).label||f}
 function needConf(){return CF.confirm_required||['НОМЕР_ДЕЛА','ДАТА_СУДЕБНОГО_АКТА','ДАТА_УТВЕРЖДЕНИЯ_АУ']}
 function isMask(f){return (CF.mask_reveal||[]).indexOf(f)>=0}
 function maskV(v){return String(v||'').replace(/[0-9A-Za-zА-Яа-яЁё]/g,'•')}
 function fx(mid,a,f,key){var v=fval(mid,a,f),val=v?String(v.value==null?'':v.value):'',w=(UI.wide||[]).indexOf(f)>=0,ed=v&&v.edited,mk=isMask(f)&&!(REV[a+f]>Date.now()),hint=key&&(UI.hints||{})[f];
  var bd=ed?'<i class="bdg ed">'+I.pen+E(T('edited'))+'</i>':(v?'<i class="bdg">'+E(v.saved?T('saved_cp'):T('src',{d:dmy(v.updated_at)}))+(v.source&&!v.saved?' · '+E(srcName(v.source)):'')+'</i>':'');
  var alt=v&&!ed&&v.alt&&v.alt.length?'<div class="alt">'+E(T('alt',{v:v.alt[0].value,s:srcName(v.alt[0].source)}))+'</div>':'';
  var nl=(UI.never_local||[]).indexOf(f)>=0?'<div class="hint">'+I.info+E(T('not_local'))+'</div>':'';
  return '<label class="fx'+(ed?' edited':'')+(key?' key':'')+(w?' w':'')+'"><span>'+E(label(f))+bd+'</span>'+(mk&&val?'<span style="display:flex;gap:6px;align-items:center"><input class="inp" value="'+E(maskV(val))+'" disabled><button type="button" class="opn" data-apx="rev" data-f="'+E(f)+'">'+I.eye+E(T('show'))+'</button></span>':
   '<input class="inp" data-apf="'+E(f)+'" value="'+E(val)+'">')+(hint?'<div class="hint">'+I.clock+E(T(hint))+'</div>':'')+alt+nl+'</label>'}
 function fieldsHTML(mid,a,key){var c=card(mid,a);return groups(c).map(function(g){var fs=g.f.filter(function(f){return fval(mid,a,f)||needConf().indexOf(f)>=0});if(!fs.length)return '';
  var src=Array.from(new Set(fs.map(function(f){var v=fval(mid,a,f);return v&&!v.edited?srcName(v.source):''}).filter(Boolean))).join(' · ');
  return '<div class="card"><h3>'+E(g.t)+'<span class="sp"></span><span class="sm" style="font-weight:400">'+E(src)+'</span></h3><div class="g2f">'+fs.map(function(f){return fx(mid,a,f,key&&needConf().indexOf(f)>=0)}).join('')+'</div></div>'}).join('')}
 /* сроки-примеры */
 function pd(s){var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(String(s||'').trim())||null;if(m)return new Date(+m[3],+m[2]-1,+m[1]);m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(s||''));return m?new Date(+m[1],+m[2]-1,+m[3]):null}
 function fd(d){var p=function(n){return ('0'+n).slice(-2)};return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()}
 function deadlines(mid,a){var c=card(mid,a),pr=((c.appointment||{}).procedure||{}).value,out=[],pre=false;
  (UI.deadlines||[]).forEach(function(x){if(x.procs&&x.procs.indexOf(pr)<0)return;var v=fval(mid,a,x.base),d=pd(v&&v.value),p=false;if(!d&&x.fallback){var w=fval(mid,a,x.fallback);d=pd(w&&w.value);p=!!d}if(!d)return;
   d=new Date(d);if(x.days)d.setDate(d.getDate()+x.days);if(x.months)d.setMonth(d.getMonth()+x.months);if(p)pre=true;out.push('<div class="dli"><div class="tx"><b>'+E(x.label)+'</b>'+E(x.sub||'')+(p?' · '+E(T('prelim')):'')+'</div><span class="d">'+fd(d)+'</span></div>')});
  return (out.length?'<div class="dl2">'+out.join('')+'</div>':'')+(pre?'<p class="sm">'+E(T('prelim_note'))+'</p>':'')}
 /* ---------- шаг «Должник» ---------- */
 function stepD(){var q=document.getElementById('dfdq');return q&&!q.closest('.apx')?q:null}
 function curMid(){return S().mgr||null}
 function apCard(c,sel){var s=c.summary||{},fl=person(c);return '<button type="button" class="ap'+(sel?' sel':'')+'" data-apx="pick" data-a="'+E(c.id)+'"><span class="rad"></span><div class="tx"><div class="nm">'+(fl&&!pOpen()?'<span class="mask">'+E(nm(c))+'</span>':E(nm(c)))+' <span class="pc'+(fl?' n':'')+'">'+E(s.proc_short||'')+'</span></div>'+
  '<div class="kv"><span>'+E(T('f_case'))+'</span><b>'+E(s.case_no||'—')+'</b><span>'+E(T('f_court'))+'</span><b>'+E(s.court||'—')+'</b><span>'+E(T('f_proc'))+'</span><b class="wr">'+E(s.procedure_label||'—')+'</b><span>'+E(T('f_since'))+'</span><b>'+E(dmy(s.since)||'—')+'</b></div></div></button>'}
 function bar(info,sub,btn,dis,act){return '<div class="lbar"><div class="info"><b>'+info+'</b><span class="sm">'+E(sub)+'</span></div><button type="button" class="btn pri" data-apx="'+act+'"'+(dis?' disabled':'')+'>'+E(btn)+'</button></div>'}
 function selmini(mid,a){var c=card(mid,a),s=c.summary||{};return '<div class="selmini"><span class="ki" style="width:34px;height:34px;border-radius:10px;background:var(--soft);color:var(--acc2);display:flex;align-items:center;justify-content:center">'+(person(c)?I.user:I.bld)+'</span><div class="tx"><b>'+E(nm(c))+'</b><span class="sm">'+E([s.case_no,s.proc_short,s.court].filter(Boolean).join(' · '))+'</span></div><button type="button" class="link" data-apx="card" data-a="'+E(a)+'">'+E(T('open_card'))+'</button><button type="button" class="link" data-apx="back">'+E(T('change'))+'</button></div>'}
 function lockedPanel(){var lk=ual()=='locked';return '<div class="lkp">'+I.shield+'<div class="tx"><b>'+E(T('card_locked'))+'</b>'+E(lk?T('card_locked_t'):T('card_locked_nopin'))+'</div><button type="button" class="btn pri" '+(lk?'data-ual="open"':'data-apx="popen"')+'>'+I.lock+E(lk?T('pin_open'):T('p_open'))+'</button></div>'}
 function htmlD(mid){var m=mgr(mid),o=BUN[mid];
  if(!encOK())return '<p class="sm intro">'+E(T('locked'))+'</p>';
  if(!o)return '<p class="sm intro">'+E(T('loading'))+'</p>';
  var L=active(mid);if(!L.length)return o.b||o.missing?'<p class="sm intro">'+E(T('no_cards'))+'</p>':'';
  var a=SEL[mid],ph=PH[mid]||'list';
  if(a&&card(mid,a)&&ph!='list'){var c=card(mid,a);
   if(person(c)&&!pOpen())return selmini(mid,a)+lockedPanel();
   var fs=[].concat.apply([],groups(c).map(function(g){return g.f})).filter(function(f){return fval(mid,a,f)}),ne=Object.keys(ED[a]||{}).length;
   if(ph=='fill')return '<div class="dbg"><div class="side"><p class="sm intro">'+E(T('picked_intro'))+'</p>'+(AUTO[mid]==a?'<div class="auto">'+I.chk+E(T('d_auto'))+'</div>':'')+selmini(mid,a)+'<div class="note">'+I.info+'<span>'+E(T('note'))+'</span></div></div>'+
    '<div>'+fieldsHTML(mid,a,false)+'<div class="savecp"><button type="button" class="btn ghost" data-apx="savecp"'+(ne?'':' disabled')+'>'+E(T('save_cp'))+'</button></div></div></div>'+
    bar(E(nm(c)),T('fields_n',{n:fs.length})+(ne?' · '+T('edited_n',{n:ne}):''),T('next'),0,'next');
   var NC=needConf(),k=NC.filter(function(f){return (CK[a]||{})[f]}).length;
   return '<div class="dbg"><div class="side"><h2 style="margin-top:4px">'+E(T('confirm_h'))+'</h2><div class="cf"><h3>'+I.warn+E(T('confirm_t'))+'</h3><p class="lead">'+E(T('confirm_lead'))+'</p>'+deadlines(mid,a)+
    NC.map(function(f){var v=fval(mid,a,f),fem=/ДАТА/.test(f);return '<div class="ck'+((CK[a]||{})[f]?' on':'')+'" role="checkbox" tabindex="0" aria-checked="'+((CK[a]||{})[f]?'true':'false')+'" data-apx="ck" data-f="'+E(f)+'"><i></i><span>'+E(label(f))+' <b>'+E(v&&v.value||'—')+'</b> '+E(fem?T('ok_suffix_f'):T('ok_suffix'))+'</span></div>'}).join('')+'</div></div>'+
    '<div>'+fieldsHTML(mid,a,true)+'</div></div>'+bar(E(T('marked',{k:k,n:NC.length})),T('marked_sub'),T('confirm_go'),k<NC.length,'go')}
  var sel=L.length==1&&UI.auto_single!==false&&!OTH[mid]?L[0].id:(a||null);if(sel&&L.length==1)AUTO[mid]=sel;
  var au=m?String(m.f.ФИО_УПРАВЛЯЮЩЕГО||'').trim().split(/\s+/):[],aus=au[0]?au[0]+(au[1]?' '+au[1][0]+'.':'')+(au[2]?' '+au[2][0]+'.':''):'',b=o.b||{};
  var h='<p class="sm intro">'+E(T('d_intro',{au:aus,n:L.length,d:dmy(b.updated_at)}))+'</p>'+(sel&&L.length==1?'<div class="auto">'+I.chk+E(T('d_auto'))+'</div>':'')+'<div class="apl">'+L.map(function(c){return apCard(c,c.id==sel)}).join('')+'</div>'+
   '<button type="button" class="oth2" data-apx="other"><span class="ki">'+I.pen+'</span><span class="tx"><b>'+E(T('other'))+'</b><span class="sm">'+E(T('other_sub'))+'</span></span>'+I.chev+'</button>';
  var sc=sel&&card(mid,sel);h+=sc?bar(E(nm(sc)),[(sc.summary||{}).case_no,(sc.summary||{}).proc_short].filter(Boolean).join(' · '),T('next'),0,'pick1'):bar(E(T('nosel')),T('nosel_sub'),T('next'),1,'pick1');return h}
 function draw(){if(!on())return;var q=stepD();if(!q)return;var mid=curMid();if(!mid)return;
  var cb=q.closest('.cb');if(!cb)return;var host=document.querySelector('.apx.apxd');
  if(!host){host=document.createElement('section');host.className='apx apxd';host.setAttribute('aria-live','polite');cb.parentNode.insertBefore(host,cb)}
  if(host.dataset.mid!=mid){host.dataset.mid=mid}
  if(!LD[mid]){load(mid).then(function(){draw();fetchB(mid)});}
  else fetchB(mid);
  var h=htmlD(mid),show=!!h&&!OTH[mid];if(OTH[mid]&&BUN[mid]&&active(mid).length)h='<button type="button" class="link" data-apx="lists">'+E(T('to_list',{n:active(mid).length}))+'</button>';
  if(host.innerHTML!==h)host.innerHTML=h;cb.style.display=show?'none':''}
 /* ---------- дело из назначения ---------- */
 async function commit(mid,a){var c=card(mid,a);if(!c)return;var Ap=A(),St=S();
  if(!casesEnc()||!encOK()){Ap.toast&&Ap.toast(T('need_enc'));return}
  var no=(fval(mid,a,'НОМЕР_ДЕЛА')||{}).value||c.case_no,k=canon(no),cs=(St.cases||[]).find(function(x){return canon((x.data||{}).НОМЕР_ДЕЛА)==k});
  if(!cs){cs={id:'c'+Date.now().toString(36),data:{}};St.cases.push(cs)}
  cs.mgr=mid;if(!cs.data._dtype)cs.data._dtype=person(c)?'person':'legal';cs.apc={id:a,kind:(c.debtor||{}).kind,at:new Date().toISOString()};cs.apf=cs.apf||{};cs.apconf=cs.apconf||{};
  var fs=[].concat.apply([],groups(c).map(function(g){return g.f}));Object.keys(c.fields||{}).forEach(function(f){if(fs.indexOf(f)<0)fs.push(f)});
  fs.forEach(function(f){if((UI.never_local||[]).indexOf(f)>=0)return;var v=fval(mid,a,f);if(!v||v.value==null||String(v.value).trim()==='')return;cs.data[f]=String(v.value);cs.apf[f]={s:v.source,d:v.updated_at,v:String(v.value),e:v.edited?1:0}});
  needConf().forEach(function(f){cs.apconf[f]=String(cs.data[f]||'')});
  if(Ap.save)Ap.save();ED[a]={};CK[a]={};PH[mid]='list';SEL[mid]=null;
  go(cs.id,no)}
 function go(id,no){var q=document.getElementById('dfdq');OTH[curMid()]=0;
  if(q){var cb=q.closest('.cb');if(cb)cb.style.display='';q.value=no;q.dispatchEvent(new Event('input',{bubbles:true}));
   var n=0;(function tr(){var el=document.querySelector('[data-fdeb="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');if(el){el.click();return}if(++n<20){setTimeout(tr,100);return}if(A().setCur)A().setCur(id)})()}
  else if(A().setCur)A().setCur(id)}
 async function saveCP(mid,a){var e=ED[a]||{},ks=Object.keys(e);if(!ks.length){A().toast&&A().toast(T('saved_none'));return}
  UO[mid]=UO[mid]||{};UO[mid][a]=UO[mid][a]||{};ks.forEach(function(f){UO[mid][a][f]={value:e[f].value,edited_at:new Date().toISOString(),source:'manual'}});
  await dput('_apu_'+mid,UO[mid]);ED[a]={};A().toast&&A().toast(T('saved_cp'));draw()}
 /* ---------- метки источника в форме и проверка перед формированием ---------- */
 function curCase(){var St=S();return (St.cases||[]).find(function(x){return x.id==St.cur})||null}
 function badges(){var c=curCase();if(!c||!c.apf)return;Object.keys(c.apf).forEach(function(f){var el=document.querySelector('[data-w="'+f+'"]');if(!el||el.closest('.apx'))return;var p=c.apf[f],cur=String((c.data||{})[f]||''),ed=p.e||cur!==p.v,t=ed?T('edited'):T('src',{d:dmy(p.d)})+' · '+srcName(p.s);
  var nx=el.nextElementSibling;if(nx&&nx.classList.contains('apbdg')){if(nx.textContent!==t){nx.textContent=t;nx.classList.toggle('ed',!!ed)}return}
  var b=document.createElement('i');b.className='apbdg'+(ed?' ed':'');b.textContent=t;el.insertAdjacentElement('afterend',b)})}
 function stale(c){return needConf().filter(function(f){return String((c.data||{})[f]||'')!==String((c.apconf||{})[f]||'')})}
 function gate(btn){var c=curCase(),L=stale(c),ck={};var g=document.createElement('div');g.className='apx apxgate';
  function h(){var k=L.filter(function(f){return ck[f]}).length;g.innerHTML='<div class="apxin"><div class="cf"><h3>'+I.warn+E(T('gate_title'))+'</h3><p class="lead">'+E(T('gate_sub'))+'</p>'+L.map(function(f){return '<div class="ck'+(ck[f]?' on':'')+'" role="checkbox" tabindex="0" aria-checked="'+(ck[f]?'true':'false')+'" data-gk="'+E(f)+'"><i></i><span>'+E(label(f))+' <b>'+E((c.data||{})[f]||'—')+'</b> '+E(/ДАТА/.test(f)?T('ok_suffix_f'):T('ok_suffix'))+'</span></div>'}).join('')+'</div>'+
   '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button type="button" class="btn sec" data-gx="0">'+E(T('cancel'))+'</button><button type="button" class="btn pri" data-gx="1"'+(k<L.length?' disabled':'')+'>'+E(T('gate_btn'))+'</button></div></div>'}
  h();document.body.appendChild(g);g.addEventListener('click',function(e){var t=e.target.closest('[data-gk],[data-gx]');if(!t)return;if(t.dataset.gk){ck[t.dataset.gk]=!ck[t.dataset.gk];h();return}
   if(t.dataset.gx=='1'){L.forEach(function(f){c.apconf[f]=String((c.data||{})[f]||'')});A().save&&A().save();g.remove();BYP=Date.now();btn.click()}else g.remove()})}
 document.addEventListener('click',function(e){if(!on())return;var b=e.target.closest&&e.target.closest('[data-fl="dl"],[data-fl="signsave"],[data-fl="pkgo"]');if(!b||Date.now()-BYP<1500)return;var c=curCase();if(!c||!c.apc)return;
  if(stale(c).length){e.preventDefault();e.stopImmediatePropagation();gate(b)}},true);
 /* ---------- карточка назначения ---------- */
 function bk(t,src,cnt,body,o){o=o||{};return '<section class="bk"><div class="bh"><div class="tx"><h3>'+E(t)+(cnt!=null&&cnt!==''?' <span class="c">· '+E(cnt)+'</span>':'')+'</h3><span class="src2">'+E(src||'')+'</span></div></div>'+body+'</section>'}
 function fvv(x){return x&&typeof x=='object'?x.value:x}
 function r(l,v,s){return v==null||v===''?'':'<div class="r"><span>'+E(l)+'</span><b>'+E(v)+'</b>'+(s?'<i>'+E(s)+'</i>':'')+'</div>'}
 function rs(l,x){return x&&x.value!=null&&x.value!==''?r(l,x.value,srcName(x.source)+' · '+dmy(x.updated_at)):''}
 function rmask(id,l,x){if(!x||x.value==null||x.value==='')return '';var v=x.value;if(typeof v=='object')v=Object.keys(v).map(function(k){return v[k]}).filter(Boolean).join(' · ');var open=REV[id]>Date.now();
  return '<div class="r"><span>'+E(l)+'</span>'+(open?'<b>'+E(v)+'</b><i>'+E(srcName(x.source))+'</i>':'<b class="mask">'+E(maskV(v))+'</b><button type="button" class="opn" data-apx="revc" data-k="'+E(id)+'">'+I.eye+E(T('show'))+'</button>')+'</div>'}
 function more(id,n,lim){return n>lim?'<button type="button" class="more" data-apx="more" data-k="'+E(id)+'">'+E(OV&&OV.more[id]?T('less'):T('all_n',{n:n}))+I.chev+'</button>':''}
 function lim(id,L,n){return OV&&OV.more[id]?L:L.slice(0,n)}
 function cardHTML(mid,a){var c=card(mid,a);if(!c)return '';var s=c.summary||{},fl=person(c),arch=c.status=='archived',d=c.debtor||{},ca=c['case']||{},rf=c.refresh||{},m=mgr(mid);
  var aush=m?String(m.f.ФИО_УПРАВЛЯЮЩЕГО||'').trim():'';
  var head='<div class="crumb"><a data-apx="close">Контрагенты</a>›<span>'+E(T('card_title'))+'</span></div>';
  if(fl&&!pOpen())return head+'<div class="chd"><div class="t1"><div class="ki" style="width:44px;height:44px;border-radius:12px;background:rgba(127,163,156,.16);color:var(--mut);display:flex;align-items:center;justify-content:center;flex:0 0 auto">'+I.lock+'</div><div class="tx"><h2><span class="mask" style="color:var(--ink)">'+E(nm(c))+'</span></h2><div class="pills"><span class="pc'+(arch?' g':'')+'">'+E(arch?T('archived'):T('active'))+'</span><span class="pc n">'+E(T('person'))+'</span></div></div></div>'+lockedPanel()+'</div>'+
   '<div class="cgrid">'+['b_req','b_case','b_cred','b_reg','b_assets','b_acts','b_disp','b_pubs'].map(function(k){return '<section class="bk"><div class="bh"><div class="tx"><h3>'+E(T(k))+'</h3><span class="src2">•••••• · ••.••.••••</span></div><span class="ib" style="border:0">'+I.lock+'</span></div><div class="skl"><i></i><i class="s"></i><i></i></div></section>'}).join('')+'</div>';
  var h=head;
  if(fl)h+='<div class="unl"><span class="ico">'+I.unlock+'</span><div class="tx"><b>'+E(T('card_open'))+'</b><span class="sm">'+E(T('card_open_t'))+'</span></div>'+(ual()=='open'?'<button type="button" class="btn sec" data-ual="close">'+E(T('hide'))+'</button>':'<button type="button" class="btn sec" data-apx="phide">'+E(T('hide'))+'</button>')+'</div>';
  if(arch)h+='<div class="arb">'+I.arch+'<div class="tx"><b>'+E(T('arch_note'))+'</b>'+(c.archived_at?E(dmy(c.archived_at)):'')+'</div></div>';
  var F=c.fields||{},g=function(k){return (F[k]||{}).value};
  h+='<div class="chd"><div class="t1"><div class="ki" style="width:44px;height:44px;border-radius:12px;background:var(--soft);color:var(--acc2);display:flex;align-items:center;justify-content:center;flex:0 0 auto">'+(fl?I.user:I.bld)+'</div><div class="tx"><h2>'+E(nm(c))+'</h2>'+
   '<div class="pills"><span class="pc'+(arch?' g':'')+'">'+E(arch?T('archived'):T('active'))+'</span><span class="pc n">'+E(s.procedure_label||'')+'</span>'+(fl?'<span class="pc n">'+E(T('person'))+'</span>':'')+'</div></div></div>'+
   '<div class="kv"><div><span>'+E(T('k_case'))+'</span><b>'+E(s.case_no||'—')+'</b></div><div><span>'+E(T('k_court'))+'</span><b>'+E(s.court||'—')+'</b></div><div><span>'+E(T('k_since'))+'</span><b>'+E(dmy(s.since)||'—')+'</b></div><div><span>'+E(T('k_au'))+'</span><b>'+E([dmy(s.au_approval_date),aush].filter(Boolean).join(' · ')||'—')+'</b></div></div>'+
   '<div class="acts"><button type="button" class="btn '+(arch?'sec':'pri')+'" data-apx="mkdoc" data-a="'+E(a)+'">'+I.doc+E(T('create_doc'))+'</button>'+(ca.url&&/^https:\/\//.test(ca.url)?'<a class="btn sec" href="'+E(ca.url)+'" target="_blank" rel="noopener noreferrer">'+I.ext+E(T('kad'))+'</a>':'')+'<span class="sm">'+E(T('updated',{d:dmyt(c.updated_at)}))+'</span></div></div>';
  var blocks=[];
  /* реквизиты */
  if(fl){var ap=c.appointment||{};blocks.push(bk(T('b_req'),'ЕФРСБ · '+dmy((c.efrsb||{}).updated_at||ap.updated_at),'','<div class="kvl">'+rs(T('fio'),d.name||ap.debtor)+rs(T('inn'),d.inn||ap.inn)+rmask(a+'s',T('snils'),d.snils)+rmask(a+'p',T('passport'),d.id_document)+rmask(a+'b',T('birth'),d.birth)+rs(T('region'),d.region)+'</div><div class="pdn">'+I.shield+'<span>'+E(T('pdn'))+'</span></div>'))}
  else blocks.push(bk(T('b_req'),'ЕГРЮЛ · '+dmy(rf.egrul_at),'','<div class="kvl">'+rs(T('full_name'),d.full_name||d.name)+(fvv(d.inn)?r(T('inn_kpp'),[fvv(d.inn),fvv(d.kpp)].filter(Boolean).join(' / '),srcName((d.inn||{}).source)+' · '+dmy((d.inn||{}).updated_at)):'')+rs(T('ogrn'),d.ogrn)+rs(T('address'),d.address)+rs(T('head'),d.head)+rs(T('head_former'),d.head_former)+rs(T('okved'),d.okved)+'</div>'));
  /* дело */
  if(UI.kad_blocks!==false){var nh=fvv(ca.next_hearing),nd=pd(nh&&String(nh).slice(0,10));
   blocks.push(bk(T('b_case'),ca.updated_at?srcName(ca.source)+' · '+dmyt(ca.updated_at):T('waiting_kad'),'','<div class="kvl">'+r(T('filed'),dmy(fvv(ca.filed_date)))+r(T('intro'),dmy(g('ДАТА_СУДЕБНОГО_АКТА')))+r(T('au_appr'),dmy(g('ДАТА_УТВЕРЖДЕНИЯ_АУ')))+r(T('judge'),fvv(ca.judge))+(fvv(ca.ended_date)?r(T('ended'),dmy(fvv(ca.ended_date))):'')+'</div>'+
    (nd&&!arch?'<div class="nxt"><div class="dd2"><b>'+('0'+nd.getDate()).slice(-2)+'</b><span>'+['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'][nd.getMonth()]+'</span></div><div class="tx"><b>'+E(T('next_hearing'))+(String(nh).length>10?' · '+E(String(nh).slice(11,16)):'')+'</b>'+E(fvv(ca.next_hearing_note)||'')+'</div></div><div style="height:10px"></div>':'')))}
  /* кредиторы */
  if(UI.creditors_block!==false){var cr=c.creditors||{},CL=cr.items||[];
   blocks.push(bk(T('b_cred'),cr.updated_at?T('creditors_upd',{d:dmy(cr.updated_at)}):T('waiting_kad')+' · '+T('every3'),CL.length||'',
    lim('cr',CL,6).map(function(x){var pf=x.kind=='fl';return '<button type="button" class="crr" data-apx="cred" data-c="'+E(x.creditor_id)+'"><span class="ki'+(pf?' g':'')+'">'+(pf?I.lock:I.bld)+'</span><span class="tx"><b>'+(pf&&!pOpen()?'<span class="mask">'+E(mask(fvv(x.name)))+'</span> <span class="pc g">'+E(T('person'))+'</span>':E(fvv(x.name)||'—'))+(x.is_new?' <span class="pc nw">'+E(T('new'))+'</span>':'')+'</b>'+
     '<span class="m"><span class="s">'+rub(x.sum_kop)+' ₽</span>'+(x.queue?'<span>'+E(T('queue',{q:x.queue}))+'</span>':'')+(x.secured?'<span class="pc w">'+E(T('secured'))+'</span>':'')+(x.status&&x.status!='included'?'<span>'+E(((CF.claim_statuses||{})[x.status]||{}).label||x.status)+'</span>':'')+(x.changed_at?'<span>'+E(T('changed',{d:dmy(x.changed_at)}))+'</span>':'')+vcr(cr,x.creditor_id)+'</span></span>'+I.chev+'</button>'}).join('')+more('cr',CL.length,6)+
    (CL.length?votesHTML(cr):'')+
    (cr.new_count&&!arch?'<div class="crn">'+I.info+'<span>'+E(T('new_cr',{n:cr.new_count}))+'</span></div>':'')))}
  /* реестр */
  if(UI.kad_blocks!==false){var rg=c.claims_register||{},RL=rg.items||[],b=bun(mid)||{},crn=function(id){var x=(b.creditors||{})[id];if(!x)return '—';return x.kind=='fl'&&!pOpen()?mask(fvv(x.name)):(fvv(x.name)||'—')};
   blocks.push(bk(T('b_reg'),rg.updated_at?srcName(rg.source)+' · '+dmy(rg.updated_at):T('waiting_kad'),RL.length||'',RL.length?'<div class="rqsum"><span>'+E(T('total'))+' <b>'+rub(rg.total_kop)+' ₽</b></span><span>'+E(T('secured_sum'))+' <b>'+rub(rg.secured_kop)+' ₽</b></span>'+(rg.closed_date?'<span>'+E(T('registry_closed',{d:dmy(rg.closed_date)}))+'</span>':'')+'</div>'+
    '<table class="rqt"><colgroup><col style="width:31%"><col style="width:22%"><col style="width:12%"><col style="width:12%"><col></colgroup><thead><tr><th>'+E(T('th_cr'))+'</th><th class="n">'+E(T('th_sum'))+'</th><th>'+E(T('th_q'))+'</th><th>'+E(T('th_sec'))+'</th><th>'+E(T('th_act'))+'</th></tr></thead><tbody>'+
    lim('rg',RL,8).map(function(x){var dt=x.determination||{};return '<tr><td>'+E(crn(x.creditor_id))+'</td><td class="n">'+rub((+x.amount_principal_kop||0)+(+x.amount_sanctions_kop||0))+'</td><td>'+E(x.queue||'—')+'</td><td>'+(x.secured?'<span class="pc w">'+E(T('secured'))+'</span>':'—')+'</td><td>'+(dt.url?'<a href="'+E(dt.url)+'" target="_blank" rel="noopener noreferrer">'+E(T('act_from',{d:dmy(dt.date)}))+I.ext+'</a>':E(dmy(dt.date)))+'</td></tr>'}).join('')+'</tbody></table>'+more('rg',RL.length,8):'<p class="sm" style="padding:0 14px 12px">'+E(T('none'))+'</p>'))}
  /* имущество */
  if(UI.assets_block!==false){var as=c.assets||{},AL=as.items||[],nap=AL.filter(function(x){return x.appraised_value_kop!=null}).length,ar=(OV&&OV.appr)||null;
   blocks.push(bk(T('b_assets'),'ЕФРСБ · '+dmy(as.updated_at),AL.length||'',(AL.length?'<div class="rqsum"><span>'+E(T('book'))+' <b>'+rub(as.book_total_kop)+' ₽</b></span><span>'+E(T('appr'))+' <b>'+rub(as.appraised_total_kop)+' ₽</b> ('+nap+' / '+AL.length+')</span></div>':'')+
    lim('as',AL,6).map(function(x){var ef=x.efrsb||{};return '<div class="as"><span class="ki">'+I[AIC[x.type]||'box']+'</span><div class="tx"><b>'+E(x.label||'—')+'</b>'+(x.address?'<span class="sm">'+E(x.address)+'</span>':'')+(x.cadastral||x.area_m2?'<span class="sm">'+E([x.cadastral?T('cad',{v:x.cadastral}):'',x.area_m2?String(x.area_m2).replace('.',',')+' м²':''].filter(Boolean).join(' · '))+'</span>':'')+
     '<div class="m"><span>'+E(T('book'))+' <b>'+rub(x.book_value_kop)+'</b></span><span>'+E(T('appr'))+' <b>'+rub(x.appraised_value_kop)+'</b></span></div>'+(ef.url?'<a class="efl" href="'+E(ef.url)+'" target="_blank" rel="noopener noreferrer">ЕФРСБ '+E(ef.no?'№ '+ef.no:'')+' · '+E(dmy(ef.date))+I.ext+'</a>':'')+'</div></div>'}).join('')+more('as',AL.length,6)+
    (!AL.length?'<p class="sm" style="padding:0 14px 12px">'+E(T('none'))+'</p>':'')+(arch||!AL.length?'':'<div class="asf"><button type="button" class="btn sec" data-apx="appr" data-a="'+E(a)+'">'+I.scale+E(T('appraise'))+'</button><span class="sm">'+E(ar?ar:T('appraise_note'))+'</span></div>')))}
  /* акты, споры, ЕФРСБ */
  if(UI.kad_blocks!==false){var ja=c.judicial_acts||{},JL=ja.items||[];
   blocks.push(bk(T('b_acts'),ja.updated_at?srcName(ja.source)+' · '+dmy(ja.updated_at):T('waiting_kad'),ja.total||JL.length||'',lim('ja',JL,4).map(function(x){return '<div class="ev"><span class="d">'+E(dmy(x.date))+'</span><div class="tx">'+E(x.title||x.type||'')+'<span class="sm">'+E(x.note||'')+'</span></div>'+(x.url?'<a href="'+E(x.url)+'" target="_blank" rel="noopener noreferrer">'+E(T('pdf'))+I.ext+'</a>':'')+'</div>'}).join('')+more('ja',JL.length,4)));
   var dp=c.disputes||{},DL=dp.items||[];
   blocks.push(bk(T('b_disp'),dp.updated_at?srcName(dp.source)+' · '+dmy(dp.updated_at):T('waiting_kad'),DL.length||'',lim('dp',DL,4).map(function(x){var st=String(x.status||''),k=/рассм|идёт|active|pending/i.test(st)?'disp_going':/заверш|итог|done|closed/i.test(st)?'disp_done':'disp_pause';return '<div class="ev"><span class="d" style="flex-basis:auto"><span class="pc'+(k=='disp_going'?'':' g')+'">'+E(T(k))+'</span></span><div class="tx">'+E(x.title||x.type||'')+'<span class="sm">'+E([x.parties,st,dmy(x.next_hearing)].filter(Boolean).join(' · '))+'</span></div>'+(x.url?'<a href="'+E(x.url)+'" target="_blank" rel="noopener noreferrer">'+E(T('k_case'))+I.ext+'</a>':'')+'</div>'}).join('')+more('dp',DL.length,4)))}
  var em=c.efrsb_messages||{},EL=em.items||[];
  blocks.push(bk(T('b_pubs'),'fedresurs.ru · '+dmy(em.updated_at),em.total||EL.length||'',lim('em',EL,4).map(function(x){return '<div class="ev"><span class="d">'+E(dmy(x.date))+'</span><div class="tx">'+E(x.type||'')+'<span class="sm">'+E(x.no?'№ '+x.no:'')+'</span></div>'+(x.url?'<a href="'+E(x.url)+'" target="_blank" rel="noopener noreferrer">'+E(T('open'))+I.ext+'</a>':'')+'</div>'}).join('')+more('em',EL.length,4)+(!EL.length?'<p class="sm" style="padding:0 14px 12px">'+E(T('none'))+'</p>':'')));
  var ord=[0,1,2,3,4,5,6,7];return h+'<div class="cgrid">'+blocks.join('')+'</div>'}

 /* голоса: правила documents/voting_rules.json считаются на сервере (tools/voting.py) по каждому вопросу повестки; здесь — выбор вопроса и показ */
 function nfmt(n){return (+n||0).toLocaleString('ru-RU')}
 function agOf(cr){var V=cr.votes||{},A=V.agenda_codes||{},k=OV&&OV.ag;return k&&A[k]?k:((CF.votes||{}).default_agenda||Object.keys(A)[0]||'other')}
 function vcr(cr,id){var V=cr.votes||{},d=(V.by_agenda||{})[agOf(cr)];if(!d)return '';var n=(d.voters||{})[id];return '<span>'+E(n?T('v_n',{n:nfmt(n)}):T('v_none'))+'</span>'}
 function votesHTML(cr){var V=cr.votes||{},A=V.agenda_codes||{},ag=agOf(cr),d=(V.by_agenda||{})[ag]||{},q=V.quorum||null,sr=V.secured_rule||null;
  if(!V.by_agenda)return '<div class="rqsum"><span>'+E(T('votes'))+' <span class="pc g">'+E(T('votes_prelim'))+'</span></span></div>';
  var h='<div class="apvote"><label class="sm">'+E(T('agenda'))+' <select class="inp" data-apag>'+Object.keys(A).map(function(k){return '<option value="'+E(k)+'"'+(k==ag?' selected':'')+'>'+E(A[k])+'</option>'}).join('')+'</select></label>'+
   '<div class="rqsum"><span>'+E(T('votes'))+' <b>'+nfmt(d.total_votes)+'</b>'+(d.preliminary?' <span class="pc g">'+E(T('votes_prelim'))+'</span>':'')+'</span>';
  if(q&&q.first_pct!=null)h+='<span>'+E(T('quorum',{p:q.first_pct,n:nfmt(q.first_need)}))+(q.repeat_pct!=null?' · '+E(T('quorum2',{p:q.repeat_pct,n:nfmt(q.repeat_need)})):'')+(q.preliminary?' <span class="pc g" title="'+E(T('quorum_prelim_t'))+'">'+E(T('votes_prelim'))+'</span>':'')+'</span>';
  h+='</div>'+(sr&&sr.condition?'<p class="sm" style="padding:0 14px 10px">'+E(T('secured_rule'))+': '+E(sr.condition)+(sr.ref?' ('+E(sr.ref)+')':'')+'</p>':'')+'<p class="sm" style="padding:0 14px 10px">'+E(T('rules_v',{v:V.rules_version||'—'}))+'</p></div>';return h}
 function credHTML(mid,cid){var b=bun(mid)||{},x=(b.creditors||{})[cid];if(!x)return '';var fl=x.kind=='fl',lk=fl&&!pOpen(),DS=x.debtors||[],tot=0,sec=0;DS.forEach(function(d){tot+=+d.sum_kop||0;sec+=+d.secured_kop||0});
  var h='<div class="crumb"><a data-apx="close">Контрагенты</a>›<span>'+E(T('creditor'))+'</span></div><div class="chd"><div class="t1"><div class="ki" style="width:44px;height:44px;border-radius:12px;background:var(--soft);color:var(--acc2);display:flex;align-items:center;justify-content:center;flex:0 0 auto">'+(fl?I.lock:I.bld)+'</div><div class="tx"><h2>'+(lk?'<span class="mask">'+E(mask(fvv(x.name)))+'</span>':E(fvv(x.name)||'—'))+'</h2>'+
   '<div class="pills"><span class="pc">'+E(T('creditor'))+'</span>'+(fvv(x.inn)&&!lk?'<span class="pc n">ИНН '+E(fvv(x.inn))+'</span>':'')+(x.is_new?'<span class="pc nw">'+E(T('new'))+(x.added_at?' · '+E(dmy(x.added_at)):'')+'</span>':'')+'</div></div></div>'+(lk?lockedPanel():'')+
   '<div class="sub" style="margin-top:14px">'+E(T('debtors',{n:DS.length}))+'</div><div class="dbch">'+DS.map(function(d){var dc=card(mid,d.appointment_id),dl=dc&&person(dc)&&!pOpen();return '<button type="button" class="dbc'+(OV&&OV.from==d.appointment_id?' on':'')+'" data-apx="card" data-a="'+E(d.appointment_id)+'">'+(dl?I.lock+'<span class="mask">'+E(nm(dc))+'</span>':'<span>'+E(dc?nm(dc):(d.case_no||'—'))+'</span>')+'<b>'+rub(d.sum_kop)+' ₽</b></button>'}).join('')+'</div>'+
   '<div class="kv"><div><span>'+E(T('total_claims'))+'</span><b>'+rub(tot)+' ₽</b></div><div><span>'+E(T('of_secured'))+'</span><b>'+rub(sec)+' ₽</b></div><div><span>'+E(T('added'))+'</span><b>'+E(dmy(x.added_at||x.created_at))+'</b></div><div><span>'+E(T('src_k'))+'</span><b>'+E(Array.from(new Set((x.claims||[]).map(function(c){return srcName(c.source)}))).join(' · '))+'</b></div></div></div>';
  if(lk)return h;
  h+='<div class="cgrid">'+DS.map(function(d){var dc=card(mid,d.appointment_id),cl=(x.claims||[]).filter(function(c){return c.appointment_id==d.appointment_id});
   return bk(T('claims_to',{n:dc?nm(dc):d.case_no}),'',cl.length,'<div class="rqsum"><span>'+E([d.case_no,dc&&(dc.summary||{}).procedure_label].filter(Boolean).join(' · '))+'</span></div><div class="rqc" style="display:block">'+cl.map(function(c){return '<div class="rq"><div class="t"><b>'+E(c.basis||((CF.claim_statuses||{})[c.status]||{}).label||'')+'</b><span class="s">'+rub((+c.amount_principal_kop||0)+(+c.amount_sanctions_kop||0))+' ₽</span></div><div class="m">'+(c.queue?'<span>'+E(T('queue',{q:c.queue}))+'</span>':'')+(c.secured?'<span class="pc w">'+E(T('secured'))+'</span>':'')+'<span>'+E(((CF.claim_statuses||{})[c.status]||{}).label||c.status||'')+'</span>'+(c.act_url?'<a href="'+E(c.act_url)+'" target="_blank" rel="noopener noreferrer">'+E(T('act_from',{d:dmy(c.act_date)}))+I.ext+'</a>':'')+'</div></div>'}).join('')+'</div>'+(dc?'<button type="button" class="more" data-apx="card" data-a="'+E(d.appointment_id)+'">'+E(T('open_appt'))+I.chev+'</button>':''))}).join('')+'</div>';return h}
 function openOV(mid,view,id){if(!OV){var el=document.createElement('div');el.className='apx apxc';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');document.body.appendChild(el);OV={el:el,more:{}};el.addEventListener('click',onClick)}
  if(view=='card'&&OV.view=='cred')OV.from=id;OV.mid=mid;OV.view=view;OV.id=id;OV.appr=null;OV.pin=pOpen();redrawOV();OV.el.scrollTop=0;
  clearInterval(PO);PO=setInterval(function(){if(!OV){clearInterval(PO);return}if(OV.pin!==pOpen()){OV.pin=pOpen();redrawOV()}},1000);load(mid).then(function(){fetchB(mid);redrawOV()})}
 function redrawOV(){if(!OV)return;var h='<div class="apxin"><button type="button" class="btn sec apxx" data-apx="close" aria-label="'+E(T('close'))+'">'+I.x+E(T('close'))+'</button>'+(OV.view=='cred'?credHTML(OV.mid,OV.id):cardHTML(OV.mid,OV.id))+'</div>';if(OV.el.innerHTML!==h)OV.el.innerHTML=h}
 function closeOV(){if(OV){OV.el.remove();OV=null;clearInterval(PO)}}
 /* «Оценить справочно»: перечень из блока «Имущество», тот же механизм arbitr/appraisal_requests (заглушка без ПДн + .enc) */
 async function appraise(mid,a){var c=card(mid,a),Ap=A(),P=UI.appraisal||{};if(!c||typeof ghApi!='function'||!Ap.venc||!Ap.vaultSalt){OV.appr=T('appraise_err');return redrawOV()}
  var AL=(c.assets||{}).items||[];if(!AL.length){OV.appr=T('appraise_none');return redrawOV()}
  var items=AL.map(function(x,i){var o={};if(x.label)o['Вид']=x.label;if(x.address)o['Адрес / описание']=x.address;if(x.cadastral)o['Кадастровый номер']=x.cadastral;if(x.area_m2)o['Площадь, м²']=String(x.area_m2);if(x.book_value_kop!=null)o['Балансовая стоимость, ₽']=rub(x.book_value_kop);if(x.appraised_value_kop!=null)o['Оценка (ЕФРСБ), ₽']=rub(x.appraised_value_kop);return {row:i+1,table:'assets',idx:i,section:null,subgroup:null,fields:o,name:x.label||''}});
  var d=new Date(),p=function(n){return ('0'+n).slice(-2)},id='appr_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'_'+Math.random().toString(36).slice(2,6);
  var pay={schema:'arbitr/appraisal_request/v1',request_id:id,template:P.template,template_title:P.template_title,valuation_requirement:P.valuation_requirement,debtor_type:person(c)?'person':'company',region:(c.fields&&c.fields.РЕГИОН||{}).value||null,case_no:null,debtor:null,valuation_date:d.toISOString().slice(0,10),items:items,origin:'appointment_card'};
  function b64(u8){var s='';for(var i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(s)}
  async function put(path,text,msg){var r=await ghApi(path,{method:'PUT',body:JSON.stringify({message:msg,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:u8b64(text)})});if(!r.ok)throw new Error('GitHub '+r.status)}
  try{var vs=Ap.vaultSalt(),e=await Ap.venc(new TextEncoder().encode(JSON.stringify(pay)),vs.s,vs.it);var RQ=P.requests||'arbitr/appraisal_requests/';
   await put(RQ+id+'.enc',JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(e.iv),ct:b64(new Uint8Array(e.ct))}),'appraisal payload '+id);
   await put(RQ+id+'.json',JSON.stringify({schema:'arbitr/appraisal_request/v1',type:'appraisal',id:id,created_at:d.toISOString(),status:'new',n_items:items.length,template:P.template,enc:{format:'arbitr/au',s:vs.s,it:vs.it},payload_path:RQ+id+'.enc',response_path:(P.results||'arbitr/appraisal_results/')+id+'.enc'},null,1),'appraisal_request '+id);
   UO[mid]=UO[mid]||{};UO[mid]._appr=UO[mid]._appr||{};UO[mid]._appr[a]={id:id,at:Date.now()};await dput('_apu_'+mid,UO[mid]);OV.appr=T('appraise_sent')+' · '+id}
  catch(x){OV.appr=T('appraise_err')+': '+(x.message||x)}redrawOV()}
 /* ---------- события ---------- */
 function onClick(e){var b=e.target.closest&&e.target.closest('[data-apx]');if(!b)return;var k=b.dataset.apx,mid=OV&&OV.el.contains(b)?OV.mid:curMid(),a=b.dataset.a;e.preventDefault();
  if(k=='pick'){SEL[mid]=a;PH[mid]='fill';AUTO[mid]=null;draw();return}
  if(k=='pick1'){var L=active(mid),s=SEL[mid]||(L.length==1?L[0].id:null);if(s){SEL[mid]=s;PH[mid]='fill';draw()}return}
  if(k=='next'){PH[mid]='confirm';draw();return}
  if(k=='back'){PH[mid]='list';SEL[mid]=null;OTH[mid]=0;draw();return}
  if(k=='other'){OTH[mid]=1;SEL[mid]=null;PH[mid]='list';draw();var q=document.getElementById('dfdq');if(q)q.focus();return}
  if(k=='lists'){OTH[mid]=0;draw();return}
  if(k=='ck'){var s2=SEL[mid];CK[s2]=CK[s2]||{};CK[s2][b.dataset.f]=!CK[s2][b.dataset.f];draw();return}
  if(k=='go'){var s3=SEL[mid];if(needConf().every(function(f){return (CK[s3]||{})[f]}))commit(mid,s3);return}
  if(k=='savecp'){saveCP(mid,SEL[mid]);return}
  if(k=='rev'){var s4=SEL[mid];REV[s4+b.dataset.f]=Date.now()+(+CF.reveal_s||30)*1000;draw();setTimeout(draw,(+CF.reveal_s||30)*1000+50);return}
  if(k=='revc'){REV[b.dataset.k]=Date.now()+(+CF.reveal_s||30)*1000;redrawOV();setTimeout(redrawOV,(+CF.reveal_s||30)*1000+50);return}
  if(k=='card'){openOV(mid,'card',a);return}
  if(k=='cred'){openOV(mid,'cred',b.dataset.c);return}
  if(k=='close'){closeOV();return}
  if(k=='popen'){OPN=Date.now()+(+CF.person_open_min||5)*60000;draw();redrawOV();return}
  if(k=='phide'){OPN=0;draw();redrawOV();return}
  if(k=='more'){OV.more[b.dataset.k]=!OV.more[b.dataset.k];redrawOV();return}
  if(k=='appr'){appraise(mid,a);return}
  if(k=='mkdoc'){closeOV();var nav=document.querySelector('nav button[data-v="docs"],nav button[data-v="d"],nav button[data-v="doc"]');if(nav)nav.click();SEL[mid]=a;PH[mid]='fill';OTH[mid]=0;setTimeout(draw,120);return}}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.apxd [data-apx],[data-apcard]');if(!b)return;if(b.dataset.apcard){e.preventDefault();openOV(b.dataset.apmid,'card',b.dataset.apcard);return}onClick(e)});
 document.addEventListener('change',function(e){var t=e.target;if(t.matches&&t.matches('.apxc [data-apag]')&&OV){OV.ag=t.value;redrawOV()}});
 document.addEventListener('keydown',function(e){if((e.key==' '||e.key=='Enter')&&e.target.matches&&e.target.matches('.apx [role=checkbox]')){e.preventDefault();e.target.click()}if(e.key=='Escape'&&OV)closeOV()});
 document.addEventListener('input',function(e){var t=e.target;if(!t.matches||!t.matches('.apxd [data-apf]'))return;var mid=curMid(),a=SEL[mid];if(!a)return;var f=t.dataset.apf,c=card(mid,a),base=((UO[mid]||{})[a]||{})[f]||((c&&c.fields)||{})[f]||{};
  ED[a]=ED[a]||{};if(String(t.value)===String(base.value==null?'':base.value))delete ED[a][f];else ED[a][f]={value:t.value,at:new Date().toISOString()};if(CK[a])delete CK[a][f];
  var pos=t.selectionStart;draw();var n=document.querySelector('.apxd [data-apf="'+f+'"]');if(n&&n!==t){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}});
 ['pointerdown','keydown'].forEach(function(n){document.addEventListener(n,function(){if(OPN>Date.now())OPN=Math.max(OPN,Date.now()+(+CF.person_open_min||5)*60000)},{passive:true,capture:true})});
 document.addEventListener('visibilitychange',function(){if(document.hidden&&OPN){OPN=0;draw();redrawOV()}});window.addEventListener('pagehide',function(){OPN=0});
 setInterval(function(){if(OPN&&OPN<=Date.now()){OPN=0;draw();redrawOV()}},15000);
 var MT=0;new MutationObserver(function(){if(MT)return;MT=setTimeout(function(){MT=0;if(!on())return;if(stepD())draw();badges()},120)}).observe(document.documentElement,{childList:true,subtree:true});
 return {ensure:function(mid){if(!mid||!encOK())return;if(!LD[mid])load(mid).then(function(){fetchB(mid);try{ArbAUAP.draw()}catch(e){}});else fetchB(mid)},draw:draw,open:function(mid,a){openOV(mid,'card',a)},openCred:function(mid,c){openOV(mid,'cred',c)},_bun:function(){return BUN},_set:function(mid,o){BUN[mid]=o;LD[mid]=Promise.resolve(o);UO[mid]=UO[mid]||{};draw();redrawOV()},_fetch:fetchB,cards:cards,active:active,mask:mask,pOpen:pOpen}})();
