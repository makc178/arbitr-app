/* Arbitr App — анимированный помощник. Все правила, тексты, размеры и тайминги — config/helper.json (window.ARB_HELPER_CFG),
   подсказки — documents/hints.json Юридического консультанта (window.ARB_HELPER_HINTS, подгружается только после PIN).
   Чужие модули не правятся: docs.js читается через window.ArbFlow / window.__docsTest, arbitr-del.js — через его кнопки и диалог,
   подтверждения confirm() идут через облачко. До PIN — только нейтральное приветствие и тур, без полей ввода и без данных.
   localStorage: только флажки (вкл/свёрнут/шутки) и даты; sessionStorage: ключи показанных подсказок (id шаблонов/полей). */
(function(){
'use strict';
var CFG=window.ARB_HELPER_CFG;if(!CFG||CFG.enabled===false)return;
var U=CFG.ui||{},TX=CFG.texts||{},EV=CFG.events||{},EMO=CFG.emotions||{},doc=document;
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s,r){try{return (r||doc).querySelector(s)}catch(e){return null}}
function $$(s,r){try{return [].slice.call((r||doc).querySelectorAll(s))}catch(e){return []}}
function vis(e){if(!e)return false;if(e.hidden)return false;var r=e.getBoundingClientRect();if(!r.width&&!r.height)return false;var cs=getComputedStyle(e);return cs.display!='none'&&cs.visibility!='hidden'&&+cs.opacity!==0}
function fill(s,o){var miss=false;s=String(s==null?'':s).replace(/\{([a-z_]+)\}/g,function(m,k){if(o&&o[k]!=null&&o[k]!=='')return String(o[k]);miss=true;return m});return miss?null:s}
function T(k,o){var s=TX[k];if(s==null)return '';return fill(s,o)||String(s).replace(/\{[a-z_]+\}/g,'')}
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function emo(e){if(!e)return CFG.default_emotion||'norma';var l=String(e).toLowerCase();if(EMO[l])return l;for(var k in EMO)if((EMO[k].aliases||[]).map(function(a){return a.toLowerCase()}).indexOf(l)>=0)return k;return CFG.default_emotion||'norma'}
/* ---------- хранилище: только флажки и даты ---------- */
var SK=(CFG.storage||{}).local_key||'arbitr.assistant',SS=(CFG.storage||{}).session_key||'arbitr.assistant.s';
function nnum(v){return typeof v=='number'&&isFinite(v)?v:0}function dstr(v){return typeof v=='string'&&/^\d{4}-\d\d-\d\d$/.test(v)?v:''}
function lsGet(){var o={};try{o=JSON.parse(localStorage.getItem(SK)||'{}')||{}}catch(e){}return {on:o.on!==false,min:!!o.min,jokes:o.jokes!==undefined?!!o.jokes:((CFG.humor||{}).enabled_default!==false),muteUntil:nnum(o.muteUntil),lastJoke:nnum(o.lastJoke),greetedDate:dstr(o.greetedDate)}}
var ST=lsGet();
function lsSet(){try{localStorage.setItem(SK,JSON.stringify({on:!!ST.on,jokes:!!ST.jokes,muteUntil:nnum(ST.muteUntil),lastJoke:nnum(ST.lastJoke),greetedDate:dstr(ST.greetedDate),min:!!ST.min}))}catch(e){}}
var SE=(function(){try{return JSON.parse(sessionStorage.getItem(SS)||'{}')}catch(e){return {}}})();SE.seen=SE.seen||{};
function seSave(){try{sessionStorage.setItem(SS,JSON.stringify(SE))}catch(e){}}
function seen(k){return !!SE.seen[k]}function mark(k){SE.seen[k]=1;seSave()}
function offToday(){return Date.now()<ST.muteUntil}
function midnight(){var d=new Date();d.setHours(24,0,0,0);return d.getTime()}
function active(){return ST.on}
function muted(ev){return offToday()&&(CFG.mute_today_events||[]).indexOf(ev)>=0}
/* ---------- PIN ---------- */
function unlocked(){var p=$((CFG.pin||{}).screen_selector||'#pin');if(p&&vis(p))return false;try{return typeof TOKEN!='undefined'&&!!TOKEN}catch(e){return false}}
/* ---------- DOM ---------- */
var SQU,SQO,FI,R,AV,IA,IB,BUB,TXT,REF,BTN,LST,LOAD,FOOT,TAG,MIN,XB,SETB,SWP,cur=null,face=null,queue=[],hideT=0,retT=0,lastMsg=null;
function mob(){return innerWidth<=(U.mobile_max_w||480)}
function css(){var s=R.style,m=mob();s.setProperty('--a-size',(m?U.avatar_px_mobile||72:U.avatar_px||88)+'px');s.setProperty('--a-edge',(m?U.edge_px_mobile||16:U.edge_px||20)+'px');s.setProperty('--a-gap',(m?U.gap_px_mobile||14:U.gap_px||16)+'px');
 s.setProperty('--a-xf',(U.crossfade_ms||200)+'ms');s.setProperty('--a-pop',(U.spring_ms||420)+'ms');s.setProperty('--a-bobt',(U.bob_ms||3200)+'ms');s.setProperty('--a-ringt',(U.ring_ms||8000)+'ms');
 s.setProperty('--a-bw',(U.bubble_max_w_px||340)+'px');s.setProperty('--a-tab',(U.min_tab_px||30)+'px');s.zIndex=U.z_index||140}
function avpx(){return mob()?U.avatar_px_mobile||72:U.avatar_px||88}
function src(e,sz,dir){var A=CFG.assets||{},f=(EMO[e]||{}).file||e;return (dir||A.path||'helper/')+f+'_'+sz+'.'+(A.ext||'webp')+(CFG._v?'?v='+CFG._v:'')}
function setImg(i,e,file,dir){var A=CFG.assets||{},n=file||e;i.src=src(n,A.size||128,dir);i.srcset=src(n,A.size||128,dir)+' 1x, '+src(n,A.size_2x||256,dir)+' 2x';if(!file){i.alt=(EMO[e]||{}).label||'';i.dataset.e=e}}
function build(){var L=U.labels||{};R=doc.createElement('div');R.id='arbh';R.setAttribute('role','complementary');R.setAttribute('aria-label',L.avatar||'Помощник');
 R.innerHTML='<div class="arbh-bub" role="dialog" aria-live="polite" aria-label="'+esc(L.avatar||'Помощник')+'"><div class="b-head"><span class="b-tag"></span><span class="b-sp"></span><button type="button" class="b-ico set" aria-label="'+esc(L.settings||'Настройки')+'">⚙</button><button type="button" class="b-ico x" aria-label="'+esc(L.close||'Закрыть')+'">×</button></div>'+
  '<div class="arbh-swap"><div class="b-text"></div><div class="b-ref"></div><ul class="b-list"></ul><div class="b-load"><span class="b-spin" aria-hidden="true"></span><span class="b-lt"></span></div><div class="b-act"></div><div class="b-foot"></div></div></div><span class="arbh-tail" aria-hidden="true"></span>'+
  '<button type="button" class="arbh-av" aria-label="'+esc(L.avatar||'Помощник')+'"><span class="a-gap"></span><img class="arbh-i on" alt="" draggable="false"><img class="arbh-i" alt="" draggable="false"><img class="arbh-sq u" alt="" draggable="false" hidden><img class="arbh-sq o" alt="" draggable="false" hidden><img class="arbh-f" alt="" draggable="false" hidden><span class="a-dot" aria-hidden="true"></span><span class="a-spin" aria-hidden="true"></span></button>'+
  '<button type="button" class="arbh-min" aria-label="'+esc(L.minimize||'Свернуть')+'">–</button>';
 doc.body.appendChild(R);css();AV=$('.arbh-av',R);var im=$$('.arbh-i',R);IA=im[0];IB=im[1];FI=$('.arbh-f',R);SQU=$('.arbh-sq.u',R);SQO=$('.arbh-sq.o',R);BUB=$('.arbh-bub',R);SWP=$('.arbh-swap',R);TXT=$('.b-text',R);REF=$('.b-ref',R);BTN=$('.b-act',R);LST=$('.b-list',R);LOAD=$('.b-lt',R);FOOT=$('.b-foot',R);TAG=$('.b-tag',R);MIN=$('.arbh-min',R);XB=$('.b-ico.x',R);SETB=$('.b-ico.set',R);
 setImg(IA,CFG.default_emotion||'norma');face=CFG.default_emotion||'norma';R.classList.add('mood-'+face);
 Object.keys(EMO).forEach(function(e){var p=new Image();p.src=src(e,(CFG.assets||{}).size||128)});  /* предзагрузка для мгновенного кроссфейда */
 AV.addEventListener('click',function(){if(ST.min&&!R.classList.contains('automini')){ST.min=false;lsSet();R.classList.remove('mini');AV.setAttribute('aria-label',L.avatar||'Помощник');place();return}if(cur){close(true);return}
  if(R.classList.contains('has-dot')&&lastMsg){R.classList.remove('has-dot');var m=lastMsg;lastMsg=null;m.once=null;show(m);return}onAvatar()});
 MIN.addEventListener('click',function(e){e.stopPropagation();minimize(true)});
 XB.addEventListener('click',function(){close(true)});
 SETB.addEventListener('click',function(){settings()});
 BUB.addEventListener('pointerenter',function(){clearTimeout(hideT)});BUB.addEventListener('pointerleave',function(){if(cur&&!isSticky(cur))arm(U.hover_resume_ms||3000)});
 BUB.addEventListener('focusin',function(){clearTimeout(hideT)});
 doc.addEventListener('keydown',function(e){if(e.key=='Escape'&&cur){close(true)}});
 if(ST.min)minimize(false);footer();sprites()}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function setFace(e,raw){e=emo(e);if(seqOn){if(e===seqEnd)return;seqStop(e,SQC.end_xfade_ms||200);face=e;moodSet(e);scheduleBlink();return}if(e===face)return;var nm=!raw&&(SQC.on_enter||{})[e];if(nm&&seqCan(nm)){var prev=face;face=e;moodSet(e,prev);seqPlay(nm,prev);return}var on=IA.classList.contains('on')?IA:IB,off=on===IA?IB:IA;setImg(off,e);
 var go=function(){off.onload=off.onerror=null;off.classList.add('on');on.classList.remove('on')};if(off.complete)go();else{off.onload=go;off.onerror=go}var pv=face;face=e;moodSet(e,pv);showFrame(null);scheduleBlink()}
function moodSet(e,pv){if(pv)R.classList.remove('mood-'+pv);['norma','nravouchenie','udivlenie','razdrazhenie','voproshenie'].concat(Object.keys(EMO)).forEach(function(x){if(x!==e)R.classList.remove('mood-'+x)});R.classList.add('mood-'+e);R.dataset.emotion=e}
function minimize(user){ST.min=true;if(user)lsSet();close(false);R.classList.add('mini');AV.setAttribute('aria-label',(U.labels||{}).restore||'Показать помощника');place()}
/* ---------- размещение: не перекрывать нижние панели, тосты и клавиатуру PIN ---------- */
function pinVis(){var p=$((CFG.pin||{}).screen_selector||'#pin');return !!(p&&vis(p))}
function place(){if(!R)return;var hide=(U.hide_when_selectors||[]).some(function(s){return $$(s).some(vis)});R.style.visibility=hide&&!(cur&&cur.top)?'hidden':'';
 var m=mob(),pin=pinVis()&&U.pin_mobile_top!==false&&m;if(R.classList.contains('mob')!==m){R.classList.toggle('mob',m);css()}R.classList.toggle('pin',pin);doc.body.classList.toggle('arbh-pin-mob',pin&&!R.hidden);
 var W=innerWidth,H=innerHeight,av=avpx(),r=m?U.edge_px_mobile||16:U.edge_px||20,b=r,g=m?U.gap_px_mobile||14:U.gap_px||16,x0=W-r-av-8,x1=W-r+8,lift=b;
 if(!pin){(U.avoid_selectors||[]).forEach(function(s){$$(s).forEach(function(e){if(!vis(e)||R.contains(e))return;var q=e.getBoundingClientRect();if(q.right<x0||q.left>x1)return;if(q.bottom<H-(lift+av+g)-2&&q.top<H*0.5)return;if(q.top>=H)return;
   var need=H-q.top+g;if(need>lift)lift=need})});
  var mx=(U.max_lift_ratio||0.55)*H;if(lift>mx)lift=b}
 R.style.bottom=pin?'':'calc('+lift+'px + env(safe-area-inset-bottom,0px))';
 /* круг лёг бы на кнопки (ui.mini_if_overlap) — временно язычок у края, не запоминается */
 var ax=[W-r-av,H-lift-av,W-r,H-lift],ov=!pin&&(U.mini_if_overlap||[]).some(function(s){return $$(s).some(function(e){if(!vis(e))return false;var q=e.getBoundingClientRect();return !(q.right<ax[0]||q.left>ax[2]||q.bottom<ax[1]||q.top>ax[3])})});
 if(ov&&!ST.min){R.classList.add('mini','automini')}else if(R.classList.contains('automini')){R.classList.remove('automini');if(!ST.min)R.classList.remove('mini')}
 if(cur){var top=pin?H-r-8:H-lift-(m?av+g:0)-8;BUB.style.maxHeight=Math.max(120,top)+'px';
  /* низкий экран PIN: пузырь не должен лечь на клавиатуру — компактный вид (без строки ref) */
  if(pin){R.classList.remove('compact');var kb=$$((CFG.pin||{}).keypad||'#kp button').filter(vis).map(function(e){return e.getBoundingClientRect().top});if(kb.length){var kt=Math.min.apply(null,kb),bb=BUB.getBoundingClientRect();if(bb.bottom>kt-6)R.classList.add('compact')}}else R.classList.remove('compact')}}
var pt=0;function placeSoon(){if(pt)return;pt=requestAnimationFrame(function(){pt=0;place()})}
/* ---------- очередь сообщений ---------- */
function prio(m){return m.priority!=null?m.priority:((EV[m.event]||{}).priority||20)}
function say(m){if(!R||!m||!m.text)return false;if(!active()&&!m.force)return false;
 if(m.once){if(seen(m.once))return false}
 if(m.humor&&!humorOk(m))return false;
 if(cur){if(m.key&&cur.key===m.key)return false;if(prio(m)>prio(cur)||(prio(m)===prio(cur)&&!cur.sticky&&m.replace)){if(cur.sticky&&cur.keep!==false)queue.unshift(cur);show(m)}else{if(!queue.some(function(q){return m.key&&q.key===m.key}))queue.push(m);queue.sort(function(a,b){return prio(b)-prio(a)})}return true}
 show(m);return true}
function isSticky(m){return !!(m&&(m.sticky||(U.sticky_events||[]).indexOf(m.event)>=0))}
function cut(t){var n=U.max_text||140;t=String(t||'');return t.length>n?t.slice(0,n-1).replace(/\s+\S*$/,'')+'…':t}
function show(m){clearTimeout(hideT);clearTimeout(retT);if(muted(m.event)&&!m.force)return;var was=cur;cur=m;if(m.once)mark(m.once);R.classList.remove('has-dot');
 if(ST.min&&(m.force||prio(m)>=((CFG.queue||{}).expand_min_priority||85))){R.classList.remove('mini')}
 if(R.classList.contains('mini')&&!R.classList.contains('automini')){cur=null;return}
 var E=EV[m.event]||{},e=m.emotion||E.emotion;setFace(e);R.classList.toggle('loading',!!(m.loader||E.loader));
 var fillB=function(){TAG.textContent=m.tag!=null?m.tag:(E.tag||'');TAG.className='b-tag'+((m.tone||E.tone)?' '+(m.tone||E.tone):'');
  TXT.textContent=cut(m.text);REF.textContent=m.ref||'';LST.innerHTML='';(m.list||[]).forEach(function(x){var li=doc.createElement('li');li.textContent=x;LST.appendChild(li)});
  LOAD.textContent=(m.loader||E.loader)?(m.loader_text||(CFG.loader_text_by_event||{})[m.event]||T('loading_text')):'';
  BTN.innerHTML='';(m.buttons||[]).forEach(function(b){var x=doc.createElement('button');x.type='button';x.textContent=b.label;if(b.cls)x.className=b.cls;x.addEventListener('click',function(ev){ev.stopPropagation();var keep=b.run&&b.run(x);if(!keep&&cur===m)close(false)});BTN.appendChild(x)});
  FOOT.innerHTML='';if((CFG.mute_today_events||[]).indexOf(m.event)>=0&&unlocked()&&!m.nofoot){var f=doc.createElement('button');f.type='button';f.textContent=T('mute_link');f.addEventListener('click',function(){ST.muteUntil=midnight();lsSet();close(false);footer()});FOOT.appendChild(f)}
  SETB.hidden=!!m.noset||!unlocked();  /* до PIN — никаких полей и настроек в облачке */
 };
 if(was&&R.classList.contains('open')&&!RM){BUB.classList.add('swapping');setTimeout(function(){if(cur!==m)return;fillB();BUB.classList.remove('swapping');place()},U.text_swap_ms||150)}else fillB();
 R.classList.add('open');place();
 if(m.buttons&&m.buttons.length&&isSticky(m)&&m.focus!==false){setTimeout(function(){if(cur!==m)return;var ae=doc.activeElement;if(ae&&ae!==doc.body&&!R.contains(ae)&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;var f=$('button',BTN);try{f&&f.focus({preventScroll:true})}catch(x){}},(U.text_swap_ms||150)+20)}
 if(!isSticky(m))arm();if(m.onshow)try{m.onshow()}catch(x){}}
function arm(ms){clearTimeout(hideT);var m=cur;ms=ms||(m&&(m.ms||(U.autohide_by_event||{})[m.event]))||U.autohide_ms||8000;hideT=setTimeout(function(){if(cur===m){if((U.dot_events||[]).indexOf(m.event)>=0){lastMsg=m}close(false);if(lastMsg===m)R.classList.add('has-dot')}},ms)}
function close(user){clearTimeout(hideT);var m=cur;cur=null;if(m&&m.onclose)try{m.onclose(user)}catch(x){}R.classList.remove('open','loading');
 retT=setTimeout(function(){if(!cur)setFace(CFG.default_emotion||'norma')},U.emotion_return_ms||600);
 if(queue.length)setTimeout(function(){if(!cur&&queue.length)show(queue.shift())},(U.queue_gap_ms||400))}
/* ---------- подсказки (после PIN) ---------- */
var HINTS=null,HUMOR=[],DLR={},hl=false;
function loadHints(){if(hl||!unlocked())return;hl=true;var s=doc.createElement('script');s.src=(CFG.hints||{}).script||'helper_hints.js';s.onload=function(){var H=window.ARB_HELPER_HINTS||{};
  HINTS=(H.hints||[]).filter(function(h){return h&&h.text&&h.verify!==true});HUMOR=(H.humor||[]).filter(function(h){return h&&h.text&&h.verify!==true});(H.deadlines||[]).forEach(function(d){if(d&&d.verify!==true)DLR[d.id||(d.template+'.'+d.field)]=d});afterLogin()};
 s.onerror=function(){HINTS=[];afterLogin()};doc.head.appendChild(s)}
function dtype(){try{var d=window.ArbFlow&&ArbFlow.dt&&ArbFlow.dt();return /^(person|citizen|individual)$/.test(String(d))?'person':d||null}catch(e){return null}}
function fieldVal(k){var i=$(((CFG.fields||{}).root||'#ded')+' [data-k="'+cssEsc(k)+'"]');return i?String(i.value||'').trim():''}
function cssEsc(s){return window.CSS&&CSS.escape?CSS.escape(s):String(s).replace(/"/g,'\\"')}
function whenOk(w){if(!w)return true;if(typeof w!='object')return false;var IG=(CFG.when||{}).ignore_keys||['note'];for(var k in w){var v=w[k];if(k.charAt(0)=='_'||IG.indexOf(k)>=0)continue;if(k=='debtor_type'){var d=dtype();if(!d||[].concat(v).indexOf(d)<0)return false}
  else if(k=='procedure'){var p=fieldVal('ПРОЦЕДУРА').toLowerCase();if(!p)return false;if(![].concat(v).some(function(x){return p.indexOf(String(x).toLowerCase())>=0||String(x).toLowerCase().indexOf(p)>=0}))return false}
  else return false}return true}
function daypart(){var h=new Date().getHours(),L=CFG.dayparts||[];for(var i=0;i<L.length;i++)if(h>=L[i].from&&h<L[i].to)return L[i].id;return 'day'}
/* выбор: шаблон+поле → шаблон → «*»+поле → «*»; затем when и time_of_day; среди равных — случайно */
function pick(event,tid,field,ctx,flt){if(!HINTS)return null;ctx=ctx||{};var dp=daypart();
 var lv=[function(h){return tid&&h.template===tid&&field&&h.field===field},function(h){return tid&&h.template===tid&&!h.field},function(h){return (h.template==='*'||!h.template)&&field&&h.field===field},function(h){return (h.template==='*'||!h.template)&&!h.field}];
 if(!field)lv=[lv[1],lv[3]];
 for(var i=0;i<lv.length;i++){var L=HINTS.filter(function(h){return h.event===event&&lv[i](h)&&whenOk(h.when)&&(!flt||flt(h))});
  var tm=L.filter(function(h){return h.time_of_day===dp});if(tm.length)L=tm;else L=L.filter(function(h){return !h.time_of_day});
  var c=L.map(function(h){var t=fill(h.text,ctx);return t?{h:h,text:t,ref:h.ref?(fill(h.ref,ctx)||''):''}:null}).filter(Boolean);
  if(c.length){var x=c[Math.floor(Math.random()*c.length)];return {text:x.text,ref:x.ref,emotion:x.h.emotion,loader:x.h.loader,id:x.h.id}}}
 return null}
function hintMsg(event,tid,field,ctx,o){var p=pick(event,tid,field,ctx,o&&o.flt);if(!p)return null;var m={event:event,text:p.text,ref:p.ref,emotion:p.emotion||(EV[event]||{}).emotion,loader:p.loader||(EV[event]||{}).loader,key:event+'|'+(tid||'')+'|'+(field||'')};for(var k in o||{})if(k!='flt')m[k]=o[k];return m}
/* ---------- шутки: только в «норме», не чаще min_interval_min, не после ошибок/сроков/удаления, без повторов ---------- */
var lastBad=0;function humorOk(m){var H=CFG.humor||{};if(!ST.jokes||!ST.on||offToday())return false;if(!unlocked())return false;var now=Date.now();if(ST.lastJoke&&now-ST.lastJoke<(H.min_interval_min||30)*6e4)return false;if(now-lastBad<(H.quiet_after_bad_ms||120000))return false;if(cur&&(H.never_events||[]).indexOf(cur.event)>=0)return false;return true}
function humor(ev){var H=CFG.humor||{};if((H.triggers||[]).indexOf(ev)<0||!HUMOR.length)return false;var d=new Date();if(ev=='login'&&d.getDay()==5&&HUMOR.some(function(h){return h.event=='friday'}))ev='friday';
 var L=HUMOR.filter(function(h){return h.event===ev});if(!L.length)return false;var nL=L.filter(function(h){return h.text!==SE.hLast});if(nL.length)L=nL;var h=L[Math.floor(Math.random()*L.length)];
 var m={event:'humor',text:h.text,ref:'',emotion:(H.allowed_emotions||['norma']).indexOf(emo(h.emotion))>=0?emo(h.emotion):'norma',humor:true,priority:(EV.humor||{}).priority||10};if(!humorOk(m))return false;
 if(say(m)){ST.lastJoke=Date.now();lsSet();SE.hLast=h.text;seSave();return true}return false}
/* ---------- приветствие ---------- */
function wpick(aud){var W=CFG.welcome||{},A=W[aud]||{},L=A[daypart()]||A.any||[];return L.length?L[Math.floor(Math.random()*L.length)]:''}
function welcome(){if(SE.welcomed)return;var d=today(),back=ST.greetedDate===d;SE.welcomed=1;seSave();ST.greetedDate=d;lsSet();var W=CFG.welcome||{};
 setTimeout(function(){if(unlocked())return;var txt=back?(W.back||T('back')):wpick('guest');if(!txt)return;
  say(back?{event:'welcome_again',text:txt,emotion:'norma',ms:W.back_ms||4000,nofoot:true}:{event:'welcome',text:txt,ref:W.guest_ref||'',emotion:'norma',nofoot:true,buttons:[{label:W.tour_btn||'Что умеет приложение',cls:'pri',run:function(){tour(0);return true}},{label:W.hide_btn||'Скрыть',cls:'ghost'}],ms:Math.max(U.autohide_ms||8000,12000)});wave('welcome')},W.delay_ms||1000)}
function tour(i){var W=CFG.welcome||{},L=W.tour||[];if(!L[i]){close(false);return}var last=i==L.length-1;
 show({event:'tour',text:L[i].text,ref:(i+1)+' / '+L.length,emotion:L[i].emotion||'nravouchenie',sticky:true,priority:60,buttons:[{label:last?(W.tour_done||'Понятно'):(W.tour_next||'Дальше'),cls:'pri',run:function(){if(last)return false;tour(i+1);return true}},{label:W.hide_btn||'Скрыть',cls:'ghost'}]})}
/* спрайты Дизайнера: моргание и взмах рукой; нет кадров или reduced-motion — программная анимация/без неё */
/* спрайты Дизайнера (frames.md, вариант А): третий <img> поверх, кадры без transition; reduced-motion — ничего не анимируется */
var SP=CFG.sprites||{},SQC=SP.seq||{},seqOn=false,seqEnd=null,seqT=[],blinkT=0;
function fsrc(n){return src(n,(CFG.assets||{}).size||128,SP.path||'helper/frames/')}
function showFrame(n){if(!FI)return;if(n){var A=CFG.assets||{};FI.src=fsrc(n);FI.srcset=fsrc(n)+' 1x, '+src(n,A.size_2x||256,SP.path||'helper/frames/')+' 2x';FI.hidden=false}else FI.hidden=true}
function bname(e,f){return String((SP.blink||{}).file||'{e}_blink_{f}').replace('{e}',e).replace('{f}',f)}
function sprites(){var B=SP.blink||{};if(RM)return;Object.keys(EMO).forEach(function(e){(B.seq||[]).forEach(function(f){var p=new Image();p.src=fsrc(bname(e,f[0]))})});
 if(SQC.enabled&&SQC.preload!==false)Object.keys(SQC.sequences||{}).forEach(function(n){var q=SQC.sequences[n],L=[['00']].concat(q.frames||[]);L.forEach(function(f){var p=new Image();p.src=qsrc(n,f[0])})});scheduleBlink();doc.addEventListener('visibilitychange',scheduleBlink)}
function scheduleBlink(){clearTimeout(blinkT);var B=SP.blink||{};if(RM||!B.enabled)return;var o=B.open_ms||[3000,5000];blinkT=setTimeout(blink,o[0]+Math.random()*(o[1]-o[0]))}
function blink(){var B=SP.blink||{};if(RM)return;if(seqOn||doc.hidden||!R||R.hidden||R.classList.contains('mini')||(B.emotions||[]).indexOf(face)<0){scheduleBlink();return}
 var fc=face,q=(B.seq||[]).slice();(function step(){if(face!==fc||seqOn){showFrame(null);return}var f=q.shift();if(!f){showFrame(null);scheduleBlink();return}showFrame(bname(fc,f[0]));blinkT=setTimeout(step,f[1])})()}
/* анимации поз (frames.md v2): два слоя .arbh-sq поверх аватара; U — предыдущий кадр, O — новый, проявляется crossfade xfade_ms */
function qsz(){var A=CFG.assets||{};return (window.devicePixelRatio||1)>1?(A.size_2x||256):(A.size||128)}
function qsrc(n,nn){return src(n+'/'+nn,qsz(),SQC.path||'helper/frames/seq/')}
function seqCan(n){return !!(SQC.enabled&&!RM&&!doc.hidden&&R&&!R.hidden&&!R.classList.contains('mini')&&(SQC.sequences||{})[n]&&SQU&&SQO)}
function seqClr(){seqT.forEach(clearTimeout);seqT=[]}
function seqAt(f,ms){seqT.push(setTimeout(f,ms))}
function fadeTo(el,op,ms){el.style.transition=ms?'opacity '+ms+'ms linear':'none';void el.offsetWidth;el.style.opacity=op}
/* финал/прерывание: под слоями сразу ставим аватар target, слои позы гаснут за ms — это и есть crossfade в эмоцию */
function seqStop(target,ms){seqClr();var on=IA.classList.contains('on')?IA:IB;setImg(on,target);seqOn=false;seqEnd=null;R.classList.remove('seq');
 if(!ms){SQU.hidden=SQO.hidden=true;return}fadeTo(SQU,0,ms);fadeTo(SQO,0,ms);seqAt(function(){SQU.hidden=SQO.hidden=true},ms+20)}
function seqPlay(n,prev,delay){var q=(SQC.sequences||{})[n],xf=SQC.xfade_ms||70,ex=SQC.end_xfade_ms||200,end=q.end_state||face;
 if(SQC.from_other==='skip'&&prev&&prev!=='norma'){seqOn=false;face=prev;setFace(end,true);return}
 seqClr();clearTimeout(blinkT);showFrame(null);seqOn=true;seqEnd=end;R.classList.add('seq');R.dataset.seq=n;
 var pre=(prev&&prev!=='norma')?ex:0;  /* не из нормы — сначала crossfade в seq/<n>/00 (= norma) */
 seqAt(function(){SQO.hidden=true;SQU.src=qsrc(n,'00');SQU.hidden=false;fadeTo(SQU,pre?0:1,0);if(pre)fadeTo(SQU,1,pre);
  var L=q.frames||[],t=pre,k=0;
  L.forEach(function(f){var at=t;seqAt(function(){if(k++)SQU.src=SQO.src;SQO.hidden=false;fadeTo(SQO,0,0);SQO.src=qsrc(n,f[0]);fadeTo(SQO,1,xf);R.dataset.seqFrame=f[0]},at);t+=f[1]});
  seqAt(function(){SQU.src=SQO.src;fadeTo(SQU,1,0);seqStop(end,ex);seqAt(function(){scheduleBlink();R.dataset.seqDone=n},ex+20)},t)},delay||0)}
/* взмах: приветствие гостя и вход (после spring-появления); финал — norma */
function wave(tr){setFace('norma',true);if((SQC.wave_on||[]).indexOf(tr||'welcome')>=0&&seqCan('wave')){face='norma';seqPlay('wave','norma',SQC.wave_delay_ms!=null?SQC.wave_delay_ms:(U.spring_ms||420))}}
var logged=false;
function afterLogin(){if(logged)return;logged=true;var W=CFG.welcome||{};
 setTimeout(function(){var m=hintMsg('welcome_back','*',null,{},{priority:(EV.welcome_back||{}).priority});if(!m){var t=wpick('user');if(t)m={event:'welcome_back',text:t,emotion:'norma'}}
  if(m&&!SE.loginShown){SE.loginShown=1;seSave();say(m);if(emo(m.emotion||'norma')==='norma')wave('login');setTimeout(function(){humor('login')},(U.autohide_ms||8000)+800)}},W.delay_ms||1000)}
/* ---------- разделы ---------- */
function section(){var L=CFG.sections||[];for(var i=0;i<L.length;i++){var s=L[i];if(s.when&&!$$(s.when).some(vis))continue;if(s.visible&&!$$(s.visible).some(vis))continue;return s}return null}
var lastSec=null;function secTick(){if(!unlocked())return;var s=section(),id=s&&s.id;if(id===lastSec)return;lastSec=id;if(!s)return;
 setTimeout(function(){if(section()!==s||cur)return;say(secMsg(s,true))},CFG.section_auto_delay_ms||1500)}
function secMsg(s,auto){var A=CFG.actions||{};return {event:'section_hint',text:s.text,ref:s.ref||'',once:auto?'sec|'+s.id:null,key:'sec|'+s.id,buttons:(s.actions||[]).map(function(a){var x=A[a];return x&&{label:T(x.label_key)||a,cls:'pri',run:function(){act(x);return false}}}).filter(Boolean)}}
function act(x){var b=null;(x.click||[]).some(function(s){var e=$$(s).filter(function(e){return e.offsetParent!==null||vis(e)})[0]||$(s);if(e){b=e;return true}});if(b)b.click();if(x.then_scroll)setTimeout(function(){var t=$(x.then_scroll);if(t&&vis(t))t.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'})},250)}
function onAvatar(){if(queue.length){show(queue.shift());return}if(!unlocked()){var W=CFG.welcome||{};show({event:'welcome',text:wpick('guest')||T('back'),ref:W.guest_ref||'',emotion:'norma',buttons:[{label:W.tour_btn||'Что умеет приложение',cls:'pri',run:function(){tour(0);return true}},{label:W.hide_btn||'Скрыть'}]});return}
 var t=tpl(),f=doc.activeElement&&doc.activeElement.dataset&&doc.activeElement.dataset.k;
 var m=t&&f&&hintMsg('field_focus',t.id,f,ctxF(t,f))||t&&hintMsg('template_open',t.id,null,ctxT(t))||null;
 if(!m){var s=section();if(s)m=secMsg(s,false)}if(!m)m=hintMsg('idle','*',null,{});if(m){m.once=null;show(m)}}
/* ---------- шаблон и поля ---------- */
var lastT=null;
function X(){try{return (window.ArbFlow&&ArbFlow.X())||{}}catch(e){return {}}}
function editing(){var r=$((CFG.fields||{}).root||'#ded');return r&&vis(r)&&$$('[data-k]',r).length?r:null}
function tpl(){var r=editing();if(!r)return null;var L=X().templates||[],ks=$$('[data-k]',r).map(function(i){return i.dataset.k});
 var t=lastT&&L.find(function(x){return x.id===lastT});if(t&&ks.every(function(k){return t.fields.indexOf(k)>=0||k=='ДАТА'||k=='ИСХ_НОМЕР'||!(X().fields||{})[k]}))return t;
 var best=null,bs=-1;L.forEach(function(x){var n=ks.filter(function(k){return x.fields.indexOf(k)>=0}).length;if(n==ks.length&&(bs<0||x.fields.length<best.fields.length)){best=x;bs=n}});return best}
function label(k){var f=(X().fields||{})[k];return (f&&f.label)||k}
function ctxT(t){return {title:t.title||t.id}}
function ctxF(t,k){return {title:t&&t.title,label:label(k)}}
/* проверки формата: ИНН, ОГРН, СНИЛС, номер дела АС, дата */
function digits(v){return String(v).replace(/[\s\-]/g,'')}
function vInn(v){v=digits(v);if(!/^\d{10}$|^\d{12}$/.test(v))return false;var d=v.split('').map(Number),c=function(w){var s=0;for(var i=0;i<w.length;i++)s+=w[i]*d[i];return s%11%10};
 if(v.length==10)return c([2,4,10,3,5,9,4,6,8])===d[9];return c([7,2,4,10,3,5,9,4,6,8])===d[10]&&c([3,7,2,4,10,3,5,9,4,6,8])===d[11]}
function vOgrn(v){v=digits(v);if(!/^\d{13}$|^\d{15}$/.test(v))return false;var n=v.length,b=v.slice(0,n-1),m=n==13?11:13,r=0;for(var i=0;i<b.length;i++)r=(r*10+ +b[i])%m;return r%10===+v[n-1]}
function vSnils(v){v=digits(v);if(!/^\d{11}$/.test(v))return false;var s=0;for(var i=0;i<9;i++)s+=+v[i]*(9-i);var c=s<100?s:s%101;if(c==100)c=0;return c===+v.slice(9)}
function vCase(v){try{return new RegExp(CFG.case_as_re||'^[АA]\\d{2}-\\d+/\\d{4}$').test(String(v).trim().replace(/\s+/g,''))}catch(e){return true}}
function vDate(v){var m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(v).trim());if(!m){return /^\d{4}-\d\d-\d\d$/.test(String(v).trim())}var d=new Date(+m[3],+m[2]-1,+m[1]);return d.getFullYear()==+m[3]&&d.getMonth()==+m[2]-1&&d.getDate()==+m[1]}
var VK={inn:vInn,ogrn:vOgrn,snils:vSnils,case_as:vCase,date:vDate};
function validate(i){var k=i.dataset.k,v=String(i.value||'').trim();if(!v)return null;var L=CFG.validators||[];
 for(var j=0;j<L.length;j++){var r=L[j],hit=false;if(r.date_inputs&&(i.dataset.date!=null||i.type=='date'))hit=true;else if(r.fields){try{hit=new RegExp(r.fields).test(k)}catch(e){}}
  if(hit&&VK[r.kind]&&!VK[r.kind](v))return r}return null}
var FS={};
function onFocus(e){var i=e.target;if(!i||!i.dataset||!i.dataset.k||!unlocked()||!editing()||!editing().contains(i))return;var t=tpl();if(!t)return;var k=i.dataset.k;
 /* выбор варианта: варианты из index.json choice_sets (field_choices шаблона) или из списка поля */
 var ch=choices(t,k,i);if(ch&&!i.value){var m=hintMsg('field_choice',t.id,k,ctxF(t,k),{once:'fc|'+t.id+'|'+k,buttons:ch.slice(0,6).map(function(o){return {label:o.label,run:function(){setVal(i,o.text);return false}}})});if(m){say(m);return}}
 var m2=hintMsg('field_focus',t.id,k,ctxF(t,k),{once:'ff|'+t.id+'|'+k});if(!m2||seen(m2.once)||muted('field_focus')||!active())return;
 if(U.inline_field_tip===false){say(m2);return}mark(m2.once);ftip(i,m2)}
/* совет у поля: под полем, плавающий пузырь не открывается (spec §5.1) */
var FT=null;function ftipOff(){if(FT){FT.remove();FT=null}}
function ftip(i,m){ftipOff();var host=i.closest('label')||i,d=doc.createElement('div');d.className='arbh-ftip';d.setAttribute('role','note');d.dataset.k=i.dataset.k;
 var im=doc.createElement('img');im.alt='';im.src=src(emo(m.emotion||'nravouchenie'),(CFG.assets||{}).size||128);d.appendChild(im);var b=doc.createElement('div');b.textContent=cut(m.text);
 if(m.ref){var r=doc.createElement('span');r.className='r';r.textContent=m.ref;b.appendChild(r)}d.appendChild(b);var x=doc.createElement('button');x.type='button';x.className='x';x.setAttribute('aria-label',(U.labels||{}).close||'Закрыть');x.textContent='×';x.addEventListener('click',ftipOff);d.appendChild(x);
 host.insertAdjacentElement('afterend',d);FT=d;clearTimeout(ftip.t);ftip.t=setTimeout(function(){if(FT===d)ftipOff()},U.inline_tip_ms||9000)}
function choices(t,k,i){var fc=(t.field_choices||{})[k],cs=fc&&(X().choice_sets||{})[fc];if(cs&&cs.options)return cs.options.map(function(o){return {label:o.label||o.text,text:o.text||o.label,norm:o.norm}});
 var l=i&&i.list;if(l&&l.options&&l.options.length&&l.options.length<=6)return [].map.call(l.options,function(o){return {label:o.value,text:o.value}});return null}
doc.addEventListener('input',function(e){var i=e.target;if(i&&i.classList&&i.classList.contains('arbh-warnf')&&String(i.value||'').trim())i.classList.remove('arbh-warnf')},true);
function setVal(i,v){try{i.focus()}catch(e){}i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}
function onBlur(e){var i=e.target;if(!i||!i.dataset||!i.dataset.k||!unlocked()||!editing()||!editing().contains(i))return;var r=validate(i),t=tpl(),k=i.dataset.k,sig=k+'|'+String(i.value).length;
 if(!r){if(cur&&cur.event=='field_invalid'&&cur.field===k)close(false);return}if(FS[k]===sig)return;FS[k]=sig;lastBad=Date.now();
 var ft=i.dataset.date!=null?'date':null,m=hintMsg('field_invalid',t&&t.id,k,{label:label(k),message:String(r.text||'').replace(/\.$/,'').toLowerCase()},{flt:function(h){return !h.field_type||h.field_type===ft}});
 if(!m||(r.kind!='date'&&!m.text.match(/«/)))m={event:'field_invalid',text:r.text,ref:r.ref||''};m.field=k;m.priority=(EV.field_invalid||{}).priority;
 m.buttons=[{label:T('focus_btn')||'Перейти к полю',run:function(){try{i.focus();i.select&&i.select()}catch(x){}return false}}];say(m)}
/* ---------- перед формированием: вопросы о незаполненных полях и выборе варианта ---------- */
var pass=0;
function miss(){try{var L=window.__docsTest&&__docsTest.miss();return Array.isArray(L)?L:null}catch(e){return null}}
function focusField(k){var r=(CFG.fields||{}).root||'#ded',i=$(r+' [data-k="'+cssEsc(k)+'"]');if(!i||!vis(i)){var tb=$((CFG.pregen||{}).form_tab||'[data-fl="tabf"]');if(tb)tb.click();i=$(r+' [data-k="'+cssEsc(k)+'"]')}
 if(i){i.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'});try{i.focus({preventScroll:true})}catch(x){}}return i}
function onGen(e){var P=CFG.pregen||{};if(!active()||!unlocked())return;var b=e.target.closest&&e.target.closest((P.buttons||[]).join(','));if(!b)return;if(pass>Date.now())return;
 var t=tpl(),m=miss();if(!t||!m)return;var skip=P.skip_fields||[];m=m.filter(function(k){return skip.indexOf(k)<0});
 var chq=Object.keys(t.field_choices||{}).filter(function(k){var i=$(((CFG.fields||{}).root||'#ded')+' [data-k="'+cssEsc(k)+'"]');return i&&!String(i.value||'').trim()});
 if(!m.length&&!chq.length){var g=hintMsg('template_generate',t.id,null,ctxT(t),{once:'tg|'+t.id});if(g)setTimeout(function(){say(g)},50);return}
 e.preventDefault();e.stopImmediatePropagation();lastBad=Date.now();
 var go=function(){pass=Date.now()+((CFG.confirm||{}).click_window_ms||2000);approve('missing');b.click()};
 if(chq.length){var k=chq[0],i=$(((CFG.fields||{}).root||'#ded')+' [data-k="'+cssEsc(k)+'"]'),ch=choices(t,k,i)||[];
  var q=hintMsg('field_choice',t.id,k,ctxF(t,k))||{event:'field_choice',text:T('pregen_choice',{label:label(k)})};
  q.event='field_choice';q.sticky=true;q.priority=(EV.choice_question||{}).priority||85;q.ref=q.ref||T('pregen_choice_ref');
  q.buttons=ch.slice(0,6).map(function(o){return {label:o.label,run:function(){setVal(i,o.text);setTimeout(function(){onGen({target:b,preventDefault:function(){},stopImmediatePropagation:function(){}})||0},60);return false}}}).concat([{label:T('pregen_anyway'),run:function(){go();return false}},{label:T('cancel')}]);
  show(q);return}
 var mx=P.max_fields||4,lbl=function(k){return k=='_rows'?T('rows_label'):label(k)},root=(CFG.fields||{}).root||'#ded';
 m.forEach(function(k){var i=$(root+' [data-k="'+cssEsc(k)+'"]');if(i)i.classList.add('arbh-warnf')});
 var q2=hintMsg('field_empty_required',t.id,null,{count:m.length,n:m.length,title:t.title},{flt:function(h){return !/\{label\}/.test(h.text)}})||{event:'field_empty_required',text:T('pregen_missing',{n:m.length})};
 q2.event='field_empty_required';q2.sticky=true;q2.list=m.slice(0,mx).map(lbl).concat(m.length>mx?[T('pregen_more',{n:m.length-mx})]:[]);q2.ref=T('pregen_missing_ref');
 var firstK=m.filter(function(k){return k!='_rows'})[0];
 q2.buttons=[{label:T('to_field'),cls:'pri',run:function(){if(firstK)focusField(firstK);else{var r=$('#dfneed');if(r)r.scrollIntoView({block:'center'})}return false}}].concat(m.length>1?m.slice(0,mx).filter(function(k){return k!='_rows'&&k!==firstK}).map(function(k){return {label:'→ '+lbl(k),cls:'ghost',run:function(){focusField(k);return false}}}):[]).concat([{label:T('pregen_anyway'),cls:'ghost',run:function(){go();return false}},{label:T('cancel'),cls:'ghost'}]);
 show(q2)}
/* ---------- подтверждения: confirm() и диалог arbitr-del.js через облачко; удаление — с «Вернуть» ---------- */
var NC=window.confirm,lastClick={el:null,t:0},AP={};
function approve(kind,msg){AP[kind]={msg:msg||null,t:Date.now()}}
function approved(kind,msg){var a=AP[kind];if(!a||Date.now()-a.t>((CFG.confirm||{}).approve_ms||15000))return false;if(a.msg&&msg&&a.msg!==msg)return false;delete AP[kind];return true}
function kindOf(msg){var L=(CFG.confirm||{}).rules||[];for(var i=0;i<L.length;i++){try{if(new RegExp(L[i].re).test(msg))return L[i]}catch(e){}}return null}
doc.addEventListener('click',function(e){if(R&&R.contains(e.target))return;lastClick={el:e.target,t:Date.now()}},true);
doc.addEventListener('pointerdown',function(e){if(!R||R.contains(e.target)||!cur||cur.sticky||(U.sticky_events||[]).indexOf(cur.event)>=0)return;if(U.close_on_outside!==false)close(false)},true);
window.confirm=function(msg){msg=String(msg==null?'':msg);var r=kindOf(msg),kind=r&&r.kind;
 if(kind&&approved(kind,msg))return true;if(kind=='missing'&&approved('missing'))return true;
 var C=CFG.confirm||{},el=lastClick.el;if(!R||!active()||!unlocked()||!r||kind=='missing'||!el||!doc.contains(el)||Date.now()-lastClick.t>(C.click_window_ms||2000))return NC.call(window,msg);
 ask(r,msg,function(){approve(kind,msg);if(doc.contains(el)){el.click();return true}return false});return false};
function ask(r,msg,run){var kind=r.kind,ev={delete:'before_delete',overwrite:'before_overwrite',send:'before_send'}[kind]||'confirm';
 var text=msg||T('delete_q_default');lastBad=Date.now();
 show({event:ev,text:text,ref:kind=='delete'?(CFG.confirm||{}).delete_ref||'':'',sticky:true,top:true,priority:(EV[ev]||{}).priority||100,nofoot:true,
  buttons:[{label:kind=='delete'?T('delete_yes'):T('yes'),cls:kind=='delete'?'danger':'pri',run:function(){if(kind=='delete'&&+(CFG.confirm||{}).undo_ms>0){undo(run);return false}if(!run())say({event:'delete_undo',text:T('undo_lost'),priority:100,force:true});return false}},{label:T('cancel'),cls:'ghost'}]})}
/* тост «Удалено · Вернуть»: физическое удаление — только по истечении undo_ms (spec §5.2) */
function undo(run){var ms=+(CFG.confirm||{}).undo_ms||5000,t=$('#arbh-toast'),done=false,tm=0;if(!t){t=doc.createElement('div');t.id='arbh-toast';t.setAttribute('role','status');doc.body.appendChild(t)}
 t.innerHTML='';var b=doc.createElement('b');b.textContent=T('undo_toast');var sp=doc.createElement('span');sp.className='sp';var u=doc.createElement('button');u.type='button';u.textContent=T('undo');var bar=doc.createElement('i');bar.className='tm';
 t.appendChild(b);t.appendChild(sp);t.appendChild(u);t.appendChild(bar);t.style.setProperty('--t-ms',ms+'ms');t.classList.remove('on');void t.offsetWidth;t.classList.add('on');
 u.addEventListener('click',function(){if(done)return;done=true;clearTimeout(tm);t.classList.remove('on');say({event:'delete_undo',text:T('undo_done'),emotion:'norma',priority:101,force:true,ms:3000,nofoot:true})});
 tm=setTimeout(function(){if(done)return;done=true;t.classList.remove('on');if(!run())say({event:'delete_undo',text:T('undo_lost'),priority:100,force:true,nofoot:true})},ms)}
/* диалог arbitr-del.js: кнопка «Удалить» открывает его диалог — текст берём из него, вопрос задаём в облачке, по «Да» и после 5 с жмём его «Удалить» */
var dlgPass=0;
doc.addEventListener('click',function(e){var C=CFG.confirm||{};if(!R||!active()||!unlocked())return;(C.dialogs||[]).forEach(function(d){var o=e.target.closest&&e.target.closest(d.open);if(!o||o.disabled||dlgPass>Date.now())return;
  e.preventDefault();e.stopImmediatePropagation();dlgPass=Date.now()+500;o.click();var dl=$(d.dialog),q=$(d.question),y=$(d.yes);var msg=q?q.textContent.trim():'';if(!dl||!dl.open||!y)return;dl.close();
  ask({kind:'delete'},msg.replace(/\s*Действие необратимо\.?$/,'?').replace(/\?\?$/,'?'),function(){var y2=$(d.yes);if(!y2||!doc.contains(y2))return false;y2.click();return true})})},true);
/* ---------- сроки: только из index.json (templates[].computed) через расчёт docs.js; тексты — hints.json ---------- */
function dl(){try{return window.__docsTest&&__docsTest.dl}catch(e){return null}}
function iso2d(s){var a=String(s).split('-');return new Date(+a[0],+a[1]-1,+a[2])}
function dmy(s){var a=String(s).split('-');return a[2]+'.'+a[1]+'.'+a[0]}
function inVal(i){var v=String(i.value||'').trim(),m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v);if(m)return m[3]+'-'+m[2]+'-'+m[1];if(/^\d{4}-\d\d-\d\d$/.test(v))return v;return null}
var dlT=0;function dlScan(){var D=dl(),t=tpl(),r=editing();if(!D||!t||!r||!unlocked())return;var near=+(CFG.deadlines||{}).near_days||7,now=iso2d(today());
 $$((CFG.deadlines||{}).date_inputs||'input[data-k][data-date]',r).forEach(function(i){var k=i.dataset.k,cp=null,b=null;try{cp=D.caption(t.id,k);b=D.block(t.id,k)}catch(e){}if(!cp||!cp.iso||cp.pending||!b)return;
  if(b.verified===false)return;var rule=DLR[t.id+'.'+k];if(rule&&rule.verify===true)return;var dir=b.direction||(rule&&rule.direction),cd=iso2d(cp.iso),v=inVal(i),ev=null,days=Math.round((cd-now)/864e5);
  if(v&&cp.manual){var vd=iso2d(v);if(dir=='not_before'&&vd<cd)ev='deadline_missed';else if(dir=='not_after'&&vd>cd)ev='deadline_missed'}
  else if(dir!='not_before'){if(days<0)ev='deadline_missed';else if(days<=near)ev='deadline_near'}
  if(!ev)return;var ctx={action:rule&&rule.action||label(k),label:label(k),date:dmy(cp.iso),days:Math.max(0,days),n:Math.max(0,days),title:t.title};
  var m=hintMsg(ev,t.id,k,ctx,{once:ev+'|'+t.id+'|'+k});if(!m)m={event:ev,text:T(ev,{label:label(k),date:ctx.date,n:ctx.days}),ref:rule&&rule.ref||'',once:ev+'|'+t.id+'|'+k};
  if(!m.ref&&rule)m.ref=rule.ref||'';lastBad=Date.now();say(m)})}
/* ---------- новое: тосты/плашки на странице (правила — config.watch) ---------- */
var WS={};
function watch(){if(!unlocked())return;(CFG.watch||[]).forEach(function(w,ix){$$(w.selector).forEach(function(e,j){var on=vis(e),tx=(e.textContent||'').trim(),key=ix+'|'+(e.dataset.apl||j)+'|'+(w.state||''),prev=WS[key];
  if(w.on=='appear'){WS[key]=on;if(!on||prev)return}
  else if(w.on=='text_change'){WS[key]=tx;if(!on||prev===undefined||prev===tx)return}
  else{var k2=ix+'|t';if(!on){WS[k2]='';return}if(WS[k2]===tx)return;WS[k2]=tx;if(w.text_re&&!new RegExp(w.text_re).test(tx))return}
  var vars={};for(var v in w.vars||{}){try{var mm=new RegExp(w.vars[v]).exec(tx);if(mm)vars[v]=mm[1].trim()}catch(x){}}
  var ev=w.event,t=tpl(),m=null;
  if(/^appraisal_/.test(ev))m=hintMsg(ev,'appraisal',null,vars,{once:w.state?'ap|'+ev+'|'+(e.dataset.apl||j)+'|'+tx.length:null});
  else if(ev=='new_data'||ev=='cp_updated'||ev=='efrsb_new'||ev=='practice_new'){m=hintMsg('new_data','*',null,vars,{flt:function(h){return !w.source||h.source===w.source}});if(m)m.event=ev}
  else if(ev=='doc_ready'){m=t&&hintMsg('success',t.id,null,ctxT(t),{flt:function(h){return !h.object||h.object=='document'}});if(m)m.event='doc_ready'}
  if(!m)m={event:ev,text:T(w.text_key||ev,vars),emotion:(EV[ev]||{}).emotion};
  if(!m.text)return;m.priority=(EV[ev]||{}).priority;if(say(m)&&ev=='doc_ready')setTimeout(function(){humor('doc_success')},(U.autohide_ms||8000)+800)})})}
/* ---------- уход с несохранёнными изменениями (крючок; docs.js сохраняет черновики сам) ---------- */
var dirty=false;
/* ---------- простой ---------- */
var lastAct=Date.now();['pointerdown','keydown','scroll','touchstart'].forEach(function(n){addEventListener(n,function(){lastAct=Date.now()},{passive:true,capture:true})});
function idleTick(){var H=CFG.humor||{};if(!unlocked()||cur)return;if(Date.now()-lastAct<(H.idle_min||10)*6e4)return;lastAct=Date.now();if(!humor('idle')){var m=hintMsg('idle','*',null,{});if(m){m.once='idle|'+Math.floor(Date.now()/36e5);say(m)}}}
/* ---------- настройки: «Помощник», «Шутки помощника», «Не показывать сегодня» ---------- */
function settings(){var L=doc.createElement('div');L.className='arbh-opts';
 var draw=function(){L.innerHTML='<label><input type="checkbox" data-o="on"'+(ST.on?' checked':'')+'><span>'+esc(T('toggle_helper'))+'</span></label><label><input type="checkbox" data-o="jokes"'+(ST.jokes?' checked':'')+(ST.on?'':' disabled')+'><span>'+esc(T('toggle_humor'))+'</span></label><label><input type="checkbox" data-o="mute"'+(offToday()?' checked':'')+(ST.on?'':' disabled')+'><span>'+esc(T('off_today'))+'</span></label>'};draw();
 show({event:'settings',text:'',tag:T('settings_title'),force:true,sticky:true,noset:true,nofoot:true,priority:200,buttons:[{label:T('done')||'Готово',cls:'pri'}],
  onshow:function(){SWP.insertBefore(L,BTN);L.addEventListener('change',function(e){var o=e.target.dataset.o;if(o=='mute')ST.muteUntil=e.target.checked?midnight():0;else ST[o]=e.target.checked;lsSet();draw();footer()})},onclose:function(){L.remove();apply()}})}
function apply(){if(!R)return;R.hidden=!ST.on;if(!ST.on){clearTimeout(hideT);queue=[];if(cur)close(false)}doc.body.classList.toggle('arbh-pin-mob',false);place();footer()}
function footer(){var host=$((CFG.ui||{}).profile_mount||'footer');if(!host)return;var b=$('#arbhf');if(!b){b=doc.createElement('button');b.type='button';b.id='arbhf';host.appendChild(b);
  b.addEventListener('click',function(){if(ST.on){if(unlocked())settings();else{ST.on=false;lsSet();apply()}}else{ST.on=true;ST.min=false;lsSet();apply();R.classList.remove('mini');if(unlocked())settings()}})}
 b.textContent=ST.on?T('footer_on'):T('footer_off')}
/* ---------- запуск ---------- */
function start(){if(R)return;build();apply();
 if(!RM){R.classList.add('pop');setTimeout(function(){R.classList.remove('pop')},(U.spring_ms||420)+50)}
 doc.addEventListener('pointerdown',function(e){var P=CFG.pin||{};if(cur&&P.collapse_on&&e.target.closest&&e.target.closest(P.collapse_on)&&(P.collapse_events||[]).indexOf(cur.event)>=0)close(false)},true);
 doc.addEventListener('keydown',function(e){var P=CFG.pin||{};if(cur&&/^[0-9]$/.test(e.key)&&pinVis()&&(P.collapse_events||[]).indexOf(cur.event)>=0)close(false)},true);
 if(!unlocked())welcome();
 doc.addEventListener('focusin',onFocus,true);doc.addEventListener('focusout',onBlur,true);doc.addEventListener('click',onGen,true);
 doc.addEventListener('click',function(e){var x=e.target.closest&&e.target.closest('[data-t]');if(x&&x.dataset.t)lastT=x.dataset.t},true);
 addEventListener('resize',placeSoon);addEventListener('scroll',placeSoon,{passive:true});
 var mt=0;new MutationObserver(function(){placeSoon();clearTimeout(mt);mt=setTimeout(function(){watch();secTick();clearTimeout(dlT);dlT=setTimeout(dlScan,400)},250)}).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden','open']});
 setInterval(function(){if(unlocked())loadHints();place();idleTick()},1000);place()}
window.ArbHelper={say:function(ev,o){o=o||{};var m=hintMsg(ev,o.template||'*',o.field||null,o.ctx||{})||(o.text?{event:ev,text:o.text,ref:o.ref}:null);return m?say(m):false},
 emotion:function(e){if(R)setFace(e)},setDirty:function(v){dirty=!!v},state:function(){return {on:ST.on,min:ST.min,humor:ST.jokes,off_today:offToday(),emotion:face,open:!!cur,event:cur&&cur.event,queue:queue.length,hints:HINTS?HINTS.length:null}},
 test:{when:function(w){return whenOk(w)},blinkNow:function(){clearTimeout(blinkT);blink()},show:function(e,t){show({event:'test',text:t||e,emotion:e,ms:600000})},close:function(){close(false)},humor:humor,scan:dlScan,watch:watch,tpl:function(){var t=tpl();return t&&t.id}}};
if(doc.readyState=='loading')doc.addEventListener('DOMContentLoaded',start);else start();
})();
