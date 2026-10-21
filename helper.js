/* Arbitr App — анимированный помощник. Все правила, тексты, размеры и тайминги — config/helper.json (window.ARB_HELPER_CFG),
   подсказки — documents/hints.json Юридического консультанта (window.ARB_HELPER_HINTS, подгружается только после PIN).
   Чужие модули не правятся: docs.js читается через window.ArbFlow / window.__docsTest, arbitr-del.js — через его кнопки и диалог,
   подтверждения confirm() идут через облачко. До PIN — только нейтральное приветствие и тур, без полей ввода и без данных.
   localStorage: только флажки (вкл/свёрнут/шутки) и даты; sessionStorage: ключи показанных подсказок (id шаблонов/полей). */
(function(){
'use strict';
var CFG=window.ARB_HELPER_CFG;if(!CFG||CFG.enabled===false)return;
var U=CFG.ui||{},TX=CFG.texts||{},EV=CFG.events||{},EMO=CFG.emotions||{},doc=document;
/* имя (arbitr_config.json → helper_name через helper_build.py): подпись под аватаром, заголовок окна, подсказка при наведении */
var HN=U.name||{},NM=HN.name||'';
var RM0=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;function NA(){return !!(RM0||(typeof ST!=='undefined'&&ST&&ST.anim===false))}
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
function lsGet(){var V=((CFG.ui||{}).assistant_v2||{}).sheet||{},o={};try{o=JSON.parse(localStorage.getItem(SK)||'{}')||{}}catch(e){}
 var b=function(k,old,d){return o[k]!==undefined?!!o[k]:(old&&o[old]!==undefined?!!o[old]:d)},sz=((V.size||{}).options||[]).map(function(x){return x.id});
 var dis=Array.isArray(o.dismissed)?o.dismissed.filter(function(x){return typeof x=='string'&&x.length<=80&&!/\d{8,}/.test(x)}).slice(-(((CFG.ui||{}).assistant_v2||{}).dismissed_max||200)):[];
 return {v:2,on:o.on!==false,hints:b('hints','ftips',true),confirmDelete:b('confirmDelete','confirm',true),greet:(o.v===2&&o.greet===false)?false:true,jokes:o.jokes!==undefined?!!o.jokes:((CFG.humor||{}).enabled_default!==false),anim:b('anim',null,true),
  size:(o.v===2&&sz.indexOf(o.size)>=0)?o.size:((V.size||{}).default||'large'),side:o.side==='left'?'left':((V.side||{}).default||'right'),hiddenUntil:nnum(o.hiddenUntil),muteUntil:nnum(o.muteUntil),dismissed:dis,lastJoke:nnum(o.lastJoke),greetedDate:dstr(o.greetedDate),min:!!o.min}}
var ST=lsGet();
function lsSet(){try{localStorage.setItem(SK,JSON.stringify({v:2,on:!!ST.on,hints:ST.hints!==false,confirmDelete:ST.confirmDelete!==false,greet:ST.greet!==false,jokes:!!ST.jokes,anim:ST.anim!==false,size:String(ST.size||'large').slice(0,12),side:ST.side==='left'?'left':'right',hiddenUntil:nnum(ST.hiddenUntil),muteUntil:nnum(ST.muteUntil),dismissed:(ST.dismissed||[]).slice(-200),lastJoke:nnum(ST.lastJoke),greetedDate:dstr(ST.greetedDate),min:!!ST.min}))}catch(e){}}
var SE=(function(){try{return JSON.parse(sessionStorage.getItem(SS)||'{}')}catch(e){return {}}})();SE.seen=SE.seen||{};
function seSave(){try{sessionStorage.setItem(SS,JSON.stringify(SE))}catch(e){}}
function seen(k){return !!SE.seen[k]}function mark(k){SE.seen[k]=1;seSave()}
function offToday(){return Date.now()<ST.muteUntil}
function midnight(){var d=new Date();d.setHours(24,0,0,0);return d.getTime()}
function active(){return ST.on}
/* состояния v2 (spec §2): on / off (выключен) / snooze (скрыт на сегодня); tempOn — важное событие в состоянии snooze показывается в обычном размере */
var A2=(CFG.ui||{}).assistant_v2||{},tempOn=false;
function mode(){return !ST.on?'off':(nnum(ST.hiddenUntil)>Date.now()?'snooze':'on')}
function iconMode(){var m=mode();return m=='off'||(m=='snooze'&&!tempOn)}
function important(m){var Z=A2.snooze||{},e=m&&m.event;if(!e)return false;if((Z.allow_events||[]).indexOf(e)>=0)return true;return prio(m)>=(Z.allow_min_priority||70)}
function allowMsg(m){if(m.force)return true;var md=mode();if(md=='off')return false;if(md=='snooze')return important(m);return true}
function muted(ev){return offToday()&&(CFG.mute_today_events||[]).indexOf(ev)>=0}
/* ---------- PIN ---------- */
function unlocked(){var p=$((CFG.pin||{}).screen_selector||'#pin');if(p&&vis(p))return false;try{return typeof TOKEN!='undefined'&&!!TOKEN}catch(e){return false}}
/* ---------- DOM ---------- */
var SQU,SQO,FI,R,AV,IA,IB,BUB,TXT,REF,BTN,LST,LOAD,FOOT,TAG,MIN,XB,SETB,SWP,cur=null,face=null,queue=[],hideT=0,retT=0,lastMsg=null;
function mob(){return innerWidth<=(U.mobile_max_w||480)}
var DK=U.desktop||{},ffocus=false;
function fixedAnc(e){for(var i=0;e&&e!==doc.body&&i<10;i++,e=e.parentElement){var p=getComputedStyle(e).position;if(p=='fixed'||p=='sticky')return e}return null}
function desk(){return DK.enabled!==false&&innerWidth>=(DK.min_w||1024)}
/* ПК: пока заполняется форма и подсказки нет — уменьшенный аватар (ui.desktop.rest_px) */
function resting(){return !iconMode()&&desk()&&!cur&&ffocus&&DK.rest_when!=='never'&&!R.classList.contains('mini')}
var ST0=U.start||{},SD=ST0.desktop||{},SM=ST0.mobile||{},heroMob=0,heroBw=0,wasHero=null;
/* стартовая страница = экран PIN виден; ПК и телефон (планшет — как раньше) */
var heroNo='';function vkey(){return innerWidth+'x'+innerHeight}
function hero(){return ST0.enabled!==false&&R&&mode()=='on'&&ST.greet!==false&&pinVis()}
function tab(){return !mob()&&!desk()}
function TB(){var T0=U.size_table||{};return T0[ST.size]||T0.large||{}}
function heroDesk(){var t0,W=innerWidth,H=innerHeight,E=SD.edge_px||24,g=SD.gap_px||24,G=SD.content_gap_px||32,cw=SD.content_w_px||420,
  t0=TB(),px=W<((U.size_table||{}).start_narrow_below_w||1280)?(t0.start_dn||280):(t0.start_d||352);px=Math.min(px,H-2*E);
  g=ringFor(px)[2];var bw=Math.min(SD.bubble_max_w_px||360,W-E-px-g-G-cw-E),mn=SD.bubble_min_w_px||200;if(bw<mn){px=Math.max(Math.min(SD.min_px||160,px),px-(mn-bw));g=ringFor(px)[2];bw=Math.min(SD.bubble_max_w_px||360,W-E-px-g-G-cw-E)}
  return {px:px,bw:Math.max(160,bw),E:E,g:g,G:G}}
function ringFor(px){var L=(U.ring_by_size||{}).steps||[[300,10,24,28,-8],[150,6,14,18,-6],[100,5,10,16,-5],[60,3,8,14,-4],[0,2,0,12,0]];for(var i=0;i<L.length;i++)if(px>=L[i][0])return L[i].slice(1);return L[L.length-1].slice(1)}
function fullpx(){var t=TB();if(hero())return mob()?(heroMob||t.start_m||144):tab()?(heroMob||t.start_t||220):heroDesk().px;return mob()?t.work_m||72:tab()?t.work_t||88:t.work_d||176}
/* файл кадра: ближайший больший из assets.sizes по полному размеру аватара × DPR */
function pz(){var A=CFG.assets||{},L=(A.sizes||[A.size||128,A.size_2x||256]).slice().sort(function(a,b){return a-b}),need=fullpx()*(window.devicePixelRatio||1);for(var i=0;i<L.length;i++)if(L[i]>=need)return L[i];return L[L.length-1]}
var PZ=0,MODE='';
function css(){var s=R.style,m=mob(),d=!m&&desk(),rs=resting();R.classList.toggle('desk',d);R.classList.toggle('pinpg',pinPg());doc.body.classList.toggle('arbh-pinpg-m',pinPg()&&m);doc.body.style.setProperty('--arbh-pinpad',(PP.mobile_pad_px||88)+'px');R.style.setProperty('--arbh-pbw',(PP.bubble_max_w_px||280)+'px');R.classList.toggle('rest',rs);MODE=modeKey();var hz=hero(),HC=hz?(m?SM:SD):d?DK:null;R.classList.toggle('hero',hz);R.classList.toggle('hc',hz&&(m||tab()));var md=mode(),ic=iconMode();R.classList.toggle('off',md=='off');R.classList.toggle('snooze',md=='snooze'&&!tempOn);R.classList.toggle('left',!hz&&ST.side==='left'&&((A2.sheet||{}).side||{}).enabled!==false);R.classList.toggle('noanim',!!(ST.anim===false));doc.documentElement.classList.toggle('arbh-noanim',NA());
 setAria();
 s.setProperty('--a-size',avpx()+'px');s.setProperty('--a-full',fullpx()+'px');s.setProperty('--a-edge',edgepx()+'px');/* 21.10: размер и отступ Саныча для раскладки разделов (--fab-size, --fab-right; слева или выключен — 0) */var de=doc.documentElement.style,fo=R.hidden||md=='off'||R.classList.contains('left');de.setProperty('--fab-size',fo?'0px':avpx()+'px');de.setProperty('--fab-right',fo?'0px':'calc('+edgepx()+'px + env(safe-area-inset-right,0px))');s.setProperty('--a-gap',gappx()+'px');s.setProperty('--a-szt',(DK.size_ms||200)+'ms');
 var rg=ringFor(avpx());s.setProperty('--a-ring',rg[0]+'px');s.setProperty('--a-glowb',rg[1]+'px');s.setProperty('--a-bob',rg[3]+'px');s.setProperty('--a-dot',(avpx()>=150?20:14)+'px');s.setProperty('--a-glow',rg[1]?'':'0');if(hz&&!m)s.setProperty('--a-hfont',(SD.font_px||15)+'px');
 if(IA&&PZ&&PZ!==pz()){PZ=pz();var on=IA.classList.contains('on')?IA:IB;setImg(on,face)}PZ=pz();
 s.setProperty('--a-xf',(U.crossfade_ms||200)+'ms');s.setProperty('--a-pop',(U.spring_ms||420)+'ms');s.setProperty('--a-bobt',(U.bob_ms||3200)+'ms');s.setProperty('--a-ringt',(U.ring_ms||8000)+'ms');
 s.setProperty('--a-bw',((desk()&&!mob()&&DK.bubble_max_w_px)||U.bubble_max_w_px||340)+'px');void HC;s.setProperty('--a-tab',(U.min_tab_px||30)+'px');s.zIndex=U.z_index||140}
function avpx(){if(iconMode())return (U.size_table||{}).icon_px||32;if(hero())return fullpx();var t=TB();if(R&&pinVis()&&PP.enabled!==false&&!pinHidden())return mob()?(PP.mobile_px||64):(innerWidth<(PP.narrow_below_w||1024)||PPN)?(PP.narrow_px||88):(t.work_d||176);return mob()?t.work_m||72:tab()?t.work_t||88:dcomp()?Math.min(DK.compact.px||88,resting()?t.rest_d||120:t.work_d||176):(resting()?t.rest_d||120:t.work_d||176)}
/* ПК, узкое окно (ui.desktop.compact): аватар меньше, полоса под него уже — формы не сжимаются */
function dcomp(){var C=DK.compact;return !!(C&&C.enabled!==false&&desk()&&!mob()&&!hero()&&innerWidth<(C.below_w||1280))}
function edgepx(){if(hero())return mob()?SM.edge_px||16:tab()?(ST0.tablet||{}).edge_px||24:SD.edge_px||24;return mob()?U.edge_px_mobile||16:desk()?DK.edge_px||24:U.edge_px||20}
function gappx(){return ringFor(avpx())[2]}
function modeKey(){return (pinPg()?'P':'')+(mob()?'m':desk()?'d':'t')+(resting()?'r':'')+(hero()?'h':'')+avpx()+mode()+(tempOn?'t':'')+ST.side+(NA()?'n':'')}
function src(e,sz,dir){var A=CFG.assets||{},f=(EMO[e]||{}).file||e;return (dir||A.path||'helper/')+f+'_'+sz+'.'+(A.ext||'webp')+(CFG._v?'?v='+CFG._v:'')}
function setImg(i,e,file,dir){var A=CFG.assets||{},n=file||e;i.src=src(n,pz(),dir);i.removeAttribute('srcset');if(!file){i.alt=(EMO[e]||{}).label||'';i.dataset.e=e}}
function build(){var L=U.labels||{};R=doc.createElement('div');R.id='arbh';R.setAttribute('role','complementary');R.setAttribute('aria-label',L.avatar||NM);
 R.innerHTML='<div class="arbh-bub" role="dialog" aria-live="polite" aria-label="'+esc(L.avatar||NM)+'"><div class="b-head"><span class="b-tag"></span><span class="b-sp"></span><button type="button" class="b-ico set" aria-label="'+esc(L.settings||'Настройки')+'">⚙</button><button type="button" class="b-ico x" aria-label="'+esc(L.close||'Закрыть')+'">×</button></div>'+
  '<div class="arbh-swap"><div class="b-text"></div><div class="b-ref"></div><ul class="b-list"></ul><div class="b-load"><span class="b-spin" aria-hidden="true"></span><span class="b-lt"></span></div><div class="b-act"></div><div class="b-foot"></div><div class="b-bar" hidden></div></div></div><span class="arbh-tail" aria-hidden="true"></span>'+
  '<button type="button" class="arbh-av" aria-label="'+esc(L.avatar||NM)+'" title="'+esc(NM)+'"><span class="a-gap"></span><img class="arbh-i on" alt="" draggable="false"><img class="arbh-i" alt="" draggable="false"><img class="arbh-sq u" alt="" draggable="false" hidden><img class="arbh-sq o" alt="" draggable="false" hidden><img class="arbh-f" alt="" draggable="false" hidden><span class="a-dot" aria-hidden="true"></span><span class="a-spin" aria-hidden="true"></span></button>'+
  '<button type="button" class="arbh-min" aria-label="'+esc(L.minimize||'Свернуть')+'">–</button>'+(NM&&HN.caption!==false?'<span class="a-name" aria-hidden="true">'+esc(NM)+'</span>':'');
 doc.body.appendChild(R);if(HN.caption_px)R.style.setProperty('--a-cap',HN.caption_px+'px');if(HN.caption_weight)R.style.setProperty('--a-capw',String(HN.caption_weight));css();AV=$('.arbh-av',R);var im=$$('.arbh-i',R);IA=im[0];IB=im[1];FI=$('.arbh-f',R);SQU=$('.arbh-sq.u',R);SQO=$('.arbh-sq.o',R);BUB=$('.arbh-bub',R);if(window.ResizeObserver)new ResizeObserver(function(){placeSoon()}).observe(BUB);SWP=$('.arbh-swap',R);TXT=$('.b-text',R);REF=$('.b-ref',R);BTN=$('.b-act',R);LST=$('.b-list',R);LOAD=$('.b-lt',R);FOOT=$('.b-foot',R);TAG=$('.b-tag',R);MIN=$('.arbh-min',R);XB=$('.b-ico.x',R);SETB=$('.b-ico.set',R);
 setImg(IA,CFG.default_emotion||'norma');face=CFG.default_emotion||'norma';R.classList.add('mood-'+face);
 Object.keys(EMO).forEach(function(e){var p=new Image();p.src=src(e,pz())});  /* предзагрузка для мгновенного кроссфейда */
 AV.addEventListener('click',function(){if(sheetOpen())return;var md=mode();if(md=='off'){enable();return}if(md=='snooze'&&!tempOn){if(cur){close(true);return}snoozeWin();return}if(ST.min&&!R.classList.contains('automini')){ST.min=false;lsSet();R.classList.remove('mini');AV.setAttribute('aria-label',L.avatar||NM);place();return}if(cur){close(true);return}
  if(!DLQ.length&&greetTap())return;  /* сначала непрочитанные предупреждения о сроках (красная точка), потом приветствие */
  if(DLQ.length){var d0=DLQ.shift();dlDot();d0.once=null;d0.user=true;show(d0);return}
  if(R.classList.contains('has-dot')&&lastMsg){R.classList.remove('has-dot');var m=lastMsg;lastMsg=null;m.once=null;m.user=true;show(m);return}onAvatar()});
 AV.setAttribute('aria-haspopup','dialog');AV.setAttribute('aria-controls','arbh-pop');AV.setAttribute('aria-expanded','false');BUB.id='arbh-pop';BUB.setAttribute('aria-labelledby','arbh-pt');BUB.setAttribute('aria-describedby','arbh-px');TAG.id='arbh-pt';TXT.id='arbh-px';R.insertAdjacentHTML('beforeend','<span class="a-tip" aria-hidden="true"></span><span class="a-badge" aria-hidden="true"></span>');
 MIN.addEventListener('click',function(e){e.stopPropagation();minimize(true)});
 XB.addEventListener('click',function(){close(true)});
 SETB.addEventListener('click',function(){settings()});
 BUB.addEventListener('pointerenter',function(){clearTimeout(hideT)});BUB.addEventListener('pointerleave',function(){if(cur&&!isSticky(cur))arm(U.hover_resume_ms||3000)});
 BUB.addEventListener('focusin',function(){clearTimeout(hideT)});
 doc.addEventListener('keydown',function(e){if(e.key=='Escape'){if(sheetOpen()){e.preventDefault();closeSheet();return}if(cur){close(true);try{AV.focus({preventScroll:true})}catch(x){}}}else if(e.key=='Tab'&&cur&&cur.user&&R.contains(doc.activeElement))trap(e,[AV].concat($$('.arbh-bub button',R).filter(vis)))});
 if(ST.min)minimize(false);footer();sprites()}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function setFace(e,raw){e=emo(e);if(seqOn){if(e===seqEnd)return;seqStop(e,SQC.end_xfade_ms||200);face=e;moodSet(e);scheduleBlink();return}if(e===face)return;var nm=!raw&&(SQC.on_enter||{})[e];if(nm&&seqCan(nm)){var prev=face;face=e;moodSet(e,prev);seqPlay(nm,prev);return}var on=IA.classList.contains('on')?IA:IB,off=on===IA?IB:IA;setImg(off,e);
 var go=function(){off.onload=off.onerror=null;off.classList.add('on');on.classList.remove('on')};if(off.complete)go();else{off.onload=go;off.onerror=go}var pv=face;face=e;moodSet(e,pv);showFrame(null);scheduleBlink()}
function moodSet(e,pv){if(pv)R.classList.remove('mood-'+pv);['norma','nravouchenie','udivlenie','razdrazhenie','voproshenie'].concat(Object.keys(EMO)).forEach(function(x){if(x!==e)R.classList.remove('mood-'+x)});R.classList.add('mood-'+e);R.dataset.emotion=e}
function minimize(user){ST.min=true;if(user)lsSet();close(false);R.classList.add('mini');AV.setAttribute('aria-label',(U.labels||{}).restore||'Показать помощника');place()}
/* ---------- размещение: не перекрывать нижние панели, тосты и клавиатуру PIN ---------- */
var HO=U.hidden_on||{};function pinHidden(){if(HO.pin===false)return false;return (HO.selectors||['#pin']).some(function(q){return $$(q).some(vis)})}
var MOB=U.mobile||{},PP=U.pin_page||{},PPN=false;function pinPg(){return PP.enabled!==false&&!!R&&!hero()&&pinVis()&&!pinHidden()}
function focHide(){var q=PP.focus_hide_selectors,e=doc.activeElement;return !!(q&&e&&e.matches&&!R.contains(e)&&e.matches(q))}
function kbOpen(){var v=window.visualViewport;return !!(v&&v.height<innerHeight*(MOB.keyboard_ratio||0.78))}
function mobHide(){if(window.ARBH_E2E_AUTOOPEN||!mob()||MOB.hide_on_focus===false||sheetOpen())return false;if(ffocus||kbOpen())return true;if(cur)return false;var r=AV&&AV.getBoundingClientRect();if(!r||!r.width)return false;
 var P=[[r.left+4,r.top+4],[r.right-4,r.top+4],[(r.left+r.right)/2,(r.top+r.bottom)/2],[r.left+4,r.bottom-4],[r.right-4,r.bottom-4]],FQ=MOB.field_selectors||'input,textarea,select,[contenteditable=true]';
 return P.some(function(pt){var L=doc.elementsFromPoint?doc.elementsFromPoint(pt[0],pt[1]):[];/* только верхний элемент под аватаром: поле под непрозрачным экраном PIN не считается */var e=null;for(var i=0;i<L.length;i++){if(!R.contains(L[i])&&!(SHE&&SHE.contains(L[i]))){e=L[i];break}}return !!(e&&e.closest&&e.closest(FQ))})}
/* телефон: полоска приветствия над нижним меню вместо окна (ui.mobile.greeting_strip, по умолчанию выкл.): текст по времени суток, ms мс, высота ≤ max_h_px; не ложится на поля, прячется при фокусе/клавиатуре; нажатие — полный текст */
var GS=null,gsT=0;function gsC(){return MOB.greeting_strip_cfg||{}}
function gsOff(){clearTimeout(gsT);if(GS){GS.remove();GS=null}}
function gsHit(){if(!GS)return false;var q=GS.getBoundingClientRect();if(!q.width)return false;var FQ=MOB.field_selectors||'input,textarea,select,[contenteditable=true]';
 return $$(FQ).some(function(e){if(R.contains(e)||!vis(e))return false;var r=e.getBoundingClientRect();return r.width>0&&!(r.right<=q.left||r.left>=q.right||r.bottom<=q.top||r.top>=q.bottom)})}
function gsChk(){if(GS&&(!mob()||ffocus||kbOpen()||cur||R.hidden||R.classList.contains('kbhide')||gsHit()))gsOff()}
function gsShow(m){var C=gsC();if(MOB.greeting_strip!==true||(C.events||[]).indexOf(m.event)<0||!mob()||ffocus||kbOpen()||R.hidden||R.classList.contains('kbhide')||R.style.visibility=='hidden')return;var t=(C.texts||{})[daypart()];if(!t)return;gsOff();
 var h=C.max_h_px||56;GS=doc.createElement('div');GS.className='arbh-gs';GS.setAttribute('role','status');GS.textContent=t;GS.style.maxHeight=h+'px';GS.style.setProperty('--gs-h',h+'px');if(C.gap_px!=null)GS.style.setProperty('--gs-gap',C.gap_px+'px');
 GS.addEventListener('click',function(e){e.stopPropagation();gsOff();AV.click()});R.appendChild(GS);
 if(gsHit()){gsOff();return}gsT=setTimeout(gsOff,C.ms||3000)}
/* ПК: полоса под помощника у страницы (ui.desktop.gutter) — аватар не ложится на поля */
function gutApply(){var G=DK.gutter||{},on=G.enabled!==false&&!!R&&!R.hidden&&!mob()&&desk()&&!hero()&&!pinVis(),side=R&&R.classList.contains('left')?'left':'right',px=0;
 if(on){var t=TB();var cp=dcomp();px=(iconMode()?((U.size_table||{}).icon_px||32):cp?avpx():(t.work_d||176))+edgepx()+(cp&&DK.compact.extra_px!=null?DK.compact.extra_px:(G.extra_px!=null?G.extra_px:48))}var val=on?side+':'+px:'';
 var done=[];if(on)(G.selectors||[]).forEach(function(q){$$(q).forEach(function(e){if(done.some(function(x){return x.contains(e)}))return;done.push(e)})});
 $$('[data-arbh-gut]').forEach(function(e){if(done.indexOf(e)<0||e.dataset.arbhGut!==val){var sd=e.dataset.arbhGut.split(':')[0];e.style.removeProperty('padding-'+sd);delete e.dataset.arbhGut}});
 done.forEach(function(e){if(e.dataset.arbhGut===val)return;e.dataset.arbhGut=val;e.style.setProperty('padding-'+side,px+'px','important')})}
/* ПК: окно сбоку легло бы на поля/предупреждения (ui.desktop.bubble_avoid) — открываем над аватаром в свободной полосе */
function stackChk(W,H,lift,av,g){var A=DK.bubble_avoid||{},Q=A.selectors,mg=A.margin_px!=null?A.margin_px:12;R.classList.remove('stk');if(!Q||R.classList.contains('hero'))return;
 var els=$$(Q).filter(function(e){return !R.contains(e)&&!(SHE&&SHE.contains(e))&&vis(e)}).map(function(e){return e.getBoundingClientRect()}).filter(function(q){return q.width&&q.bottom>0&&q.top<H});
 var b=BUB.getBoundingClientRect();if(!els.some(function(q){return !(q.right<=b.left-mg||q.left>=b.right+mg||q.bottom<=b.top||q.top>=b.bottom)}))return;
 var lf=R.classList.contains('left'),e=edgepx(),fr=lf?W:0;els.forEach(function(q){fr=lf?Math.min(fr,q.left):Math.max(fr,q.right)});
 var w=Math.max(A.min_w_px||200,Math.min(DK.bubble_max_w_px||360,Math.floor((lf?fr:W-fr)-e-mg)));R.style.setProperty('--arbh-stkw',w+'px');R.classList.add('stk');BUB.style.maxHeight=Math.max(120,H-lift-av-g-16)+'px'}
/* экран PIN: пауза после неверных попыток — текст из того же элемента карточки (ui.pin_page.pause_source) */
var PZM=null,PBS=null;function pauseTick(){if(!R||!pinPg()){if(PZM){if(cur===PZM)close(false);if(lastMsg===PZM){lastMsg=null;R&&R.classList.remove('has-dot')}PZM=null}return}var on=!!$(PP.pause_when||'#pin.lock'),src=$(PP.pause_source||'#lockt'),t=src?src.textContent.trim():'';
 if(on&&t){if(!PZM){PZM={event:'pin_pause',key:'pin_pause',text:t,emotion:PP.pause_emotion||'nravouchenie',nofoot:true,sticky:true};show(PZM)}else{PZM.text=t;if(cur===PZM&&TXT&&TXT.textContent!==t)TXT.textContent=t}}
 else if(PZM){if(cur===PZM)close(false);if(lastMsg===PZM){lastMsg=null;R.classList.remove('has-dot')}PZM=null}}
setInterval(function(){try{pauseTick()}catch(e){}},PP.pause_tick_ms||500);
function pinVis(){var p=$((CFG.pin||{}).screen_selector||'#pin');return !!(p&&vis(p))}
var SAWPIN=false;
function place(){if(!R)return;if(pinVis())SAWPIN=true;var ph=pinHidden();if(R.hidden!==ph){R.hidden=ph;if(ph&&cur)close(false)}if(ph)return;R.classList.toggle('kbhide',mobHide()||focHide());gsChk();if(!R)return;var hide=(U.hide_when_selectors||[]).some(function(s){return $$(s).some(vis)});R.style.visibility=hide&&!(cur&&cur.top)?'hidden':'';
 var m=mob(),hz=hero(),pin=!hz&&pinVis()&&U.pin_mobile_top!==false&&m,r0=null;
 if(wasHero!==null&&wasHero!==hz&&!NA()&&!R.hidden){r0=R.getBoundingClientRect()}
 if(!hz&&wasHero){['left','top','width','height'].forEach(function(k){R.style[k]=''});['left','top','width'].forEach(function(k){BUB.style[k]=''});doc.body.classList.remove('arbh-hero-d');doc.body.style.removeProperty('--arbh-hpad')}if(R.classList.contains('mob')!==m){R.classList.toggle('mob',m);css()}else if(modeKey()!==MODE)css();R.classList.toggle('pin',pin);doc.body.classList.toggle('arbh-pin-mob',(pin||(hz&&(m||tab())))&&!R.hidden);
 if(hz){placeHero(m||tab());flip(r0);wasHero=hz;return}
 var W=innerWidth,H=innerHeight,av=avpx(),r=edgepx(),b=r,g=gappx(),x0=W-r-av-8,x1=W-r+8,lift=b;if(R.classList.contains('left')){x0=r-8;x1=r+av+8}
 if(!pin){(U.avoid_selectors||[]).forEach(function(s){$$(s).forEach(function(e){if(!vis(e)||R.contains(e))return;var q=e.getBoundingClientRect();if(q.right<x0||q.left>x1)return;if(q.bottom<H-(lift+av+g)-2&&q.top<H*0.5)return;if(q.top>=H)return;
   var need=H-q.top+g;if(need>lift)lift=need})});
  /* кнопки действий под аватаром (любая нижняя панель, не только из списка): поднимаемся над ними */
  for(var it=0;it<3;it++){var y0=H-lift-av,hit=null;[[x0+12,y0+4],[x1-12,y0+4],[(x0+x1)/2,y0+av/2],[x0+12,H-lift-4],[x1-12,H-lift-4],[(x0+x1)/2,H-lift-4]].some(function(pt){var L=doc.elementsFromPoint?doc.elementsFromPoint(Math.max(0,Math.min(W-1,pt[0])),Math.max(0,Math.min(H-1,pt[1]))):[];
     for(var i=0;i<L.length;i++){var e=L[i];if(R.contains(e)||(SHE&&SHE.contains(e)))continue;var c=e.closest&&e.closest('button,a[href],[role=button]');if(c&&vis(c)){var bar=fixedAnc(c);if(bar){hit=bar;return true}}}return false});
   if(!hit)break;var q=hit.getBoundingClientRect();if(q.top<H*0.4)break;var need=H-q.top+g;if(need<=lift)break;lift=need}
  var mx=(U.max_lift_ratio||0.55)*H;if(lift>mx)lift=mx}
 if(pinPg()){if(m){var ub=$(PP.align_selector||'#updlog-btn');if(ub&&vis(ub)){var uq=ub.getBoundingClientRect();lift=Math.max(0,Math.round(H-(uq.top+uq.bottom)/2-av/2))}}
  else if(W>=(PP.narrow_below_w||1024)){var cd=$(PP.card_selector||'#pin .glass'),cq=cd&&cd.getBoundingClientRect(),nn=!!(cq&&cq.width&&W-edgepx()-(TB().work_d||176)<cq.right+(PP.card_gap_px!=null?PP.card_gap_px:24));if(nn!==PPN){PPN=nn;css();av=avpx()}}}
 R.style.bottom=pin?'':'calc('+lift+'px + env(safe-area-inset-bottom,0px))';
 /* круг лёг бы на кнопки (ui.mini_if_overlap) — временно язычок у края, не запоминается */
 var ax=R.classList.contains('left')?[r,H-lift-av,r+av,H-lift]:[W-r-av,H-lift-av,W-r,H-lift],ov=!pin&&(U.mini_if_overlap||[]).some(function(s){return $$(s).some(function(e){if(!vis(e))return false;var q=e.getBoundingClientRect();return !(q.right<ax[0]||q.left>ax[2]||q.bottom<ax[1]||q.top>ax[3])})});
 if(ov&&!ST.min){R.classList.add('mini','automini')}else if(R.classList.contains('automini')){R.classList.remove('automini');if(!ST.min)R.classList.remove('mini')}
 if(BUB&&BUB.style.top){BUB.style.top='';BUB.style.bottom=''}
 if(cur){var top=pin?H-r-8:H-lift-(m?av+g:0)-8;if(m)top=Math.min(top,Math.round(H*(MOB.bubble_max_h_ratio||0.4)));BUB.style.maxHeight=Math.max(120,top)+'px';
  /* низкий экран PIN: пузырь не должен лечь на клавиатуру — компактный вид (без строки ref) */
  if(pinPg()){R.classList.remove('stk');if(PBS!==cur){PBS=cur;setTimeout(function(){if(BUB)BUB.scrollTop=0},80)}var kq=$$(PP.keys_selector||'#kp button').filter(vis).map(function(e){return e.getBoundingClientRect()}),bt=H-lift-av-g;var lim=bt-16;kq.forEach(function(q){if(q.right>W-edgepx()-Math.min(PP.bubble_max_w_px||280,W-2*edgepx())-2&&q.top<bt)lim=Math.min(lim,bt-q.bottom-(PP.keys_gap_px||8))});BUB.style.maxHeight=Math.max(0,Math.floor(lim))+'px';R.classList.toggle('pbtight',lim<48)}
  else if(!m&&!pin&&desk())stackChk(W,H,lift,av,g);else R.classList.remove('stk');
  if(pin){R.classList.remove('compact');var kb=$$((CFG.pin||{}).keypad||'#kp button').filter(vis).map(function(e){return e.getBoundingClientRect().top});if(kb.length){var kt=Math.min.apply(null,kb),bb=BUB.getBoundingClientRect();if(bb.bottom>kt-6)R.classList.add('compact')}}else R.classList.remove('compact')}
 gutApply();flip(r0);wasHero=hz}
/* стартовая: ПК — аватар слева, пузырь справа, форма входа сдвинута вправо; телефон — по центру сверху, размер подстраивается, чтобы не лечь на клавиатуру */
function placeHero(m){var W=innerWidth,H=innerHeight;R.classList.remove('compact');R.style.bottom='';
 if(!m){var q=heroDesk(),av=q.px;if(modeKey()!==MODE)css();var top=Math.max(q.E,Math.round((H-av)/2));R.style.left=q.E+'px';R.style.top=top+'px';
  doc.body.classList.add('arbh-hero-d');doc.body.style.setProperty('--arbh-hpad',(q.E+av+q.g+q.bw+q.G)+'px');
  BUB.style.width=q.bw+'px';BUB.style.left=(av+q.g)+'px';BUB.style.maxHeight=(H-2*q.E)+'px';
  if(cur){var bh=BUB.offsetHeight,T=Math.round((av-bh)/2),lo=H-q.E-top;if(T+bh>lo)T=lo-bh;if(T<q.E-top)T=q.E-top;BUB.style.top=T+'px'}return}
 var tb=tab(),t0=TB(),E=tb?((ST0.tablet||{}).edge_px||24):SM.edge_px||16,g=ringFor(tb?(t0.start_t||220):(t0.start_m||144))[2],bw=tb?Math.min((ST0.tablet||{}).bubble_max_w_px||360,W-2*E):W-2*E,kb=[].concat.apply([],(SM.bound_selectors||[(CFG.pin||{}).keypad||'#kp button']).map(function(q){return $$(q)})).filter(vis).map(function(e){return e.getBoundingClientRect().top}),kt=kb.length?Math.min.apply(null,kb)-(SM.keypad_gap_px||8):H;
 BUB.style.width=bw+'px';var bh=cur?BUB.offsetHeight:0;if(cur&&!cur.user&&kt-E-Math.min(SM.min_px||72,tb?t0.start_t:t0.start_m)-g<bh){/* низкий экран: приветствие не помещается над PIN — не закрываем форму, ждём нажатия (точка на аватаре) */var wm=cur;close(false);lastMsg=wm;R.classList.add('has-dot');bh=0}var px=Math.floor(Math.max(Math.min(SM.min_px||72,tb?t0.start_t:t0.start_m),Math.min(tb?(t0.start_t||220):(t0.start_m||144),kt-E-(cur?bh+g:0))));
 if(px!==heroMob){heroMob=px}if(modeKey()!==MODE)css();
 R.style.left=Math.round((W-px)/2)+'px';R.style.top='calc('+E+'px + env(safe-area-inset-top,0px))';BUB.style.left=Math.round((px-bw)/2)+'px';BUB.style.top=(px+g)+'px';BUB.style.maxHeight=Math.max(120,(cur&&cur.user&&kt-E-px-g<bh?H-E:kt)-E-px-g)+'px';
 if(cur&&!cur.user){var bb=BUB.getBoundingClientRect();if(bb.bottom>kt+2)R.classList.add('compact')}}
/* плавный переход стартовая ↔ рабочая (FLIP, ui.start.transition_ms) */
function flip(r0){if(!r0)return;var r1=R.getBoundingClientRect();if(!r1.width)return;var ms=ST0.transition_ms||200;
 R.style.transition='none';R.style.transformOrigin='0 0';R.style.transform='translate('+(r0.left-r1.left)+'px,'+(r0.top-r1.top)+'px) scale('+(r0.width/r1.width)+')';void R.offsetWidth;
 R.style.transition='transform '+ms+'ms ease';R.style.transform='';setTimeout(function(){R.style.transition='';R.style.transformOrigin=''},ms+40)}
var pt=0;function placeSoon(){if(pt)return;pt=requestAnimationFrame(function(){pt=0;place()})}
/* ---------- очередь сообщений ---------- */
function prio(m){return m.priority!=null?m.priority:((EV[m.event]||{}).priority||20)}
function say(m){if(!R||!m||!m.text)return false;if(!allowMsg(m))return false;if(isDis(m))return false;
 if(m.once){if(seen(m.once))return false}
 if(m.humor&&!humorOk(m))return false;
 if(cur){if(m.key&&cur.key===m.key)return false;if(prio(m)>prio(cur)||(prio(m)===prio(cur)&&!cur.sticky&&m.replace)){if(cur.sticky&&cur.keep!==false)queue.unshift(cur);show(m)}else{if(!queue.some(function(q){return m.key&&q.key===m.key}))queue.push(m);queue.sort(function(a,b){return prio(b)-prio(a)})}return true}
 show(m);return true}
function isSticky(m){return !!(m&&(m.sticky||(U.sticky_events||[]).indexOf(m.event)>=0))}
function cut(t){var n=U.max_text||140;t=String(t||'');return t.length>n?t.slice(0,n-1).replace(/\s+\S*$/,'')+'…':t}
/* узкий экран (ui.deadline_dot_under_1280, порог ui.deadline_dot.below_w): предупреждения о сроках не открывают окно сами — красная точка со счётчиком на аватаре, текст по нажатию */
var DLQ=[];function dlDotOn(m){var D=U.deadline_dot||{};return U.deadline_dot_under_1280===true&&!m.user&&!m.force&&new RegExp(D.events_re||'^deadline_').test(m.event||'')&&innerWidth<(D.below_w||1280)&&!pinPg()}
function dlDot(){if(!R)return;var b=$('.a-dlc',R);if(!b){b=doc.createElement('span');b.className='a-dlc';b.setAttribute('aria-hidden','true');R.appendChild(b)}var n=DLQ.length;b.textContent=n>99?'99+':String(n);R.classList.toggle('has-dl',n>0);var L=U.labels||{};if(AV)AV.setAttribute('aria-label',n?((U.deadline_dot||{}).aria||NM+': {n}').replace('{n}',n):(L.avatar||NM))}
function show(m){clearTimeout(hideT);clearTimeout(retT);if(R&&R.hidden&&!m.user)return;if(dlDotOn(m)){var kq=m.key||m.id||m.once||m.text;DLQ=DLQ.filter(function(q){return (q.key||q.id||q.once||q.text)!==kq});DLQ.push(m);if(m.once)mark(m.once);dlDot();return}if(((mob()&&MOB.bubble_on_tap_only!==false)||(pinPg()&&PP.tap_only!==false))&&!window.ARBH_E2E_AUTOOPEN&&(MOB.auto_open_events||[]).indexOf(m.event)<0&&!m.user&&!m.force&&prio(m)<(MOB.auto_open_min_priority||100)){if(lastMsg&&lastMsg!==m&&R.classList.contains('has-dot')&&prio(m)<prio(lastMsg)){/* точка держит более важное непрочитанное (приветствие), остальное — в очередь до следующего нажатия */if(!queue.some(function(q){return q===m||(m.key&&q.key===m.key)}))queue.push(m);queue.sort(function(a,b){return prio(b)-prio(a)});return}lastMsg=m;m.user=true;R.classList.add('has-dot');gsShow(m);if(m.once)mark(m.once);return}if(muted(m.event)&&!m.force)return;if(!allowMsg(m)&&!m.user)return;if(mode()=='snooze'&&!m.user&&!tempOn){tempOn=true;css()}if(m.event!=='settings'&&!m.user0){LASTM=m;m.t=m.t||Date.now()}var was=cur;cur=m;if(/^welcome/.test(m.event||''))gsMark();placeSoon();if(m.once)mark(m.once);R.classList.remove('has-dot');
 if(ST.min&&(m.force||prio(m)>=((CFG.queue||{}).expand_min_priority||85))){R.classList.remove('mini')}
 if(R.classList.contains('mini')&&!R.classList.contains('automini')){cur=null;return}
 var E=EV[m.event]||{},e=m.emotion||E.emotion;setFace(e);R.classList.toggle('loading',!!(m.loader||E.loader));
 var fillB=function(){TAG.textContent=m.tag!=null?m.tag:(E.tag||(/^welcome/.test(m.event||'')?NM:''));TAG.className='b-tag'+((m.tone||E.tone)?' '+(m.tone||E.tone):'');
  TXT.textContent=cut(m.text);setJoke(m.joke||'');REF.textContent=m.ref||'';LST.innerHTML='';(m.list||[]).forEach(function(x){var li=doc.createElement('li');li.textContent=x;LST.appendChild(li)});
  LOAD.textContent=(m.loader||E.loader)?(m.loader_text||(CFG.loader_text_by_event||{})[m.event]||T('loading_text')):'';
  BTN.innerHTML='';(m.buttons||[]).forEach(function(b){var x=doc.createElement('button');x.type='button';x.textContent=b.label;if(b.cls)x.className=b.cls;x.addEventListener('click',function(ev){ev.stopPropagation();var keep=b.run&&b.run(x);if(!keep&&cur===m)close(false)});BTN.appendChild(x)});
  FOOT.innerHTML='';if(canDis(m)&&unlocked()&&!m.nofoot){var f=doc.createElement('button');f.type='button';f.className='b-dis';f.textContent=PT.dismiss||'Больше не показывать';f.addEventListener('click',function(ev){ev.stopPropagation();dismiss(m);close(false)});FOOT.appendChild(f)}
  SETB.hidden=true;XB.hidden=barIds(m).indexOf('close')>=0;$('.b-head',R).hidden=!TAG.textContent&&XB.hidden;  /* до PIN — никаких полей и настроек в облачке */
  bar(m);
 };
 if(was&&R.classList.contains('open')&&!NA()){BUB.classList.add('swapping');setTimeout(function(){if(cur!==m)return;fillB();BUB.classList.remove('swapping');place()},U.text_swap_ms||150)}else{BUB.classList.remove('swapping');fillB()}
 R.classList.add('open');place();setAria();
 if(m.user)setTimeout(function(){if(cur!==m)return;var f=$('.b-bar .b-bb',R)||$('button',BTN);try{f&&f.focus({preventScroll:true})}catch(x){}},(U.text_swap_ms||150)+20);
 if(m.buttons&&m.buttons.length&&isSticky(m)&&m.focus!==false){setTimeout(function(){if(cur!==m)return;var ae=doc.activeElement;if(ae&&ae!==doc.body&&!R.contains(ae)&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;var f=$('button',BTN);try{f&&f.focus({preventScroll:true})}catch(x){}},(U.text_swap_ms||150)+20)}
 if(!isSticky(m)&&!m.user)arm();if(m.onshow)try{m.onshow()}catch(x){}}
function arm(ms){clearTimeout(hideT);var m=cur;ms=ms||(m&&(m.ms||(U.autohide_by_event||{})[m.event]))||U.autohide_ms||8000;hideT=setTimeout(function(){if(cur===m){if((U.dot_events||[]).indexOf(m.event)>=0){lastMsg=m}close(false);if(lastMsg===m)R.classList.add('has-dot')}},ms)}
function close(user){clearTimeout(hideT);var m=cur;cur=null;if(tempOn&&!queue.length){tempOn=false;css()}placeSoon();if(m&&m.onclose)try{m.onclose(user)}catch(x){}R.classList.remove('open','loading');BUB.classList.remove('swapping');setAria();
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
var lastBad=0;function humorOk(m){var H=CFG.humor||{};if(!ST.jokes||mode()!='on'||offToday())return false;if(!unlocked())return false;var now=Date.now();if(ST.lastJoke&&now-ST.lastJoke<(H.min_interval_min||30)*6e4)return false;if(now-lastBad<(H.quiet_after_bad_ms||120000))return false;if(cur&&(H.never_events||[]).indexOf(cur.event)>=0)return false;return true}
function humor(ev){var H=CFG.humor||{};if((H.triggers||[]).indexOf(ev)<0||!HUMOR.length)return false;var d=new Date();if(ev=='login'&&d.getDay()==5&&HUMOR.some(function(h){return h.event=='friday'}))ev='friday';
 var L=HUMOR.filter(function(h){return h.event===ev});if(!L.length)return false;var nL=L.filter(function(h){return h.text!==SE.hLast});if(nL.length)L=nL;var h=L[Math.floor(Math.random()*L.length)];
 var m={event:'humor',text:h.text,ref:'',emotion:(H.allowed_emotions||['norma']).indexOf(emo(h.emotion))>=0?emo(h.emotion):'norma',humor:true,priority:(EV.humor||{}).priority||10};if(!humorOk(m))return false;
 if(say(m)){ST.lastJoke=Date.now();lsSet();SE.hLast=h.text;seSave();return true}return false}
/* ---------- приветствие ---------- */
function wpick(aud){var W=CFG.welcome||{},A=W[aud]||{},L=A[daypart()]||A.any||[];return L.length?L[Math.floor(Math.random()*L.length)]:''}
/* 17.10: приветствие — первое сообщение при первом открытии окна за сеанс (sessionStorage), в т. ч. на странице PIN; ниже greet_tap_below_w окно само не открывается — приветствие по первому нажатию */
function gsOn(){return HN.greet_once_per_session!==false}
function gsDone(){if(!gsOn())return true;return !!SE.greeted}
function gsMark(){if(!SE.greeted){SE.greeted=1;seSave()}}
function gsNarrow(){return innerWidth<(HN.greet_tap_below_w||0)}
/* узкий экран: окно не открывается само — точка и взмах на аватаре (как на телефоне), текст приветствия по первому нажатию */
function gsCue(){if(!R||gsDone()||ST.greet===false||mode()!='on')return;R.classList.add('has-dot');if(!NA())try{wave(unlocked()?'login':'welcome')}catch(e){}}
function greetMsg(){if(unlocked()){var m=hintMsg('welcome_back','*',null,{},{priority:(EV.welcome_back||{}).priority});if(!m){var t=wpick('user');if(t)m={event:'welcome_back',text:t,emotion:'norma'}}return m}
 var W=CFG.welcome||{},tx=wpick('guest');return tx?{event:'welcome',text:tx,ref:W.guest_ref||'',emotion:'norma',nofoot:true,buttons:[{label:W.tour_btn||'Что умеет приложение',cls:'pri',run:function(){tour(0);return true}}]}:null}
function greetTap(){if(gsDone()||ST.greet===false||mode()!='on'||cur)return false;var m=greetMsg();if(!m){gsMark();return false}m.user=true;m.once=null;R.classList.remove('has-dot');show(m);if(emo(m.emotion||'norma')==='norma')wave(unlocked()?'login':'welcome');return true}
var welcomedNow=false;function welcome(){if(welcomedNow)return;welcomedNow=true;if(ST.greet===false||mode()!='on'||pinHidden())return;if(gsOn()&&gsNarrow()){gsCue();return}var d=today(),wv=!(pinVis()&&PP.wave_once_per_day!==false&&ST.greetedDate===d);ST.greetedDate=d;lsSet();var W=CFG.welcome||{};
 setTimeout(function(){if(unlocked())return;var txt=wpick('guest');if(!txt)return;
  say({event:'welcome',text:txt,ref:W.guest_ref||'',emotion:'norma',nofoot:true,buttons:[{label:W.tour_btn||'Что умеет приложение',cls:'pri',run:function(){tour(0);return true}}],ms:Math.max(U.autohide_ms||8000,12000)});if(wv)wave('welcome')},W.delay_ms||1000)}
function tour(i){var W=CFG.welcome||{},L=W.tour||[];if(!L[i]){close(false);return}var last=i==L.length-1;
 show({event:'tour',text:L[i].text,ref:(i+1)+' / '+L.length,emotion:L[i].emotion||'nravouchenie',sticky:true,priority:60,buttons:[{label:last?(W.tour_done||'Понятно'):(W.tour_next||'Дальше'),cls:'pri',run:function(){if(last)return false;tour(i+1);return true}},{label:W.hide_btn||'Скрыть',cls:'ghost'}]})}
/* спрайты Дизайнера: моргание и взмах рукой; нет кадров или reduced-motion — программная анимация/без неё */
/* спрайты Дизайнера (frames.md, вариант А): третий <img> поверх, кадры без transition; reduced-motion — ничего не анимируется */
var SP=CFG.sprites||{},SQC=SP.seq||{},seqOn=false,seqEnd=null,seqT=[],blinkT=0;
function fsrc(n){return src(n,pz(),SP.path||'helper/frames/')}
function showFrame(n){if(!FI)return;if(n){var A=CFG.assets||{};FI.src=fsrc(n);FI.removeAttribute('srcset');FI.hidden=false}else FI.hidden=true}
function bname(e,f){return String((SP.blink||{}).file||'{e}_blink_{f}').replace('{e}',e).replace('{f}',f)}
function sprites(){var B=SP.blink||{};if(NA())return;Object.keys(EMO).forEach(function(e){(B.seq||[]).forEach(function(f){var p=new Image();p.src=fsrc(bname(e,f[0]))})});
 if(SQC.enabled&&SQC.preload!==false)Object.keys(SQC.sequences||{}).forEach(function(n){var q=SQC.sequences[n],L=[['00']].concat(q.frames||[]);L.forEach(function(f){var p=new Image();p.src=qsrc(n,f[0])})});scheduleBlink();doc.addEventListener('visibilitychange',scheduleBlink)}
function scheduleBlink(){clearTimeout(blinkT);var B=SP.blink||{};if(NA()||!B.enabled)return;var o=B.open_ms||[3000,5000];blinkT=setTimeout(blink,o[0]+Math.random()*(o[1]-o[0]))}
function blink(){var B=SP.blink||{};if(NA())return;if(seqOn||doc.hidden||!R||R.hidden||R.classList.contains('mini')||(B.emotions||[]).indexOf(face)<0){scheduleBlink();return}
 var fc=face,q=(B.seq||[]).slice();(function step(){if(face!==fc||seqOn){showFrame(null);return}var f=q.shift();if(!f){showFrame(null);scheduleBlink();return}showFrame(bname(fc,f[0]));blinkT=setTimeout(step,f[1])})()}
/* анимации поз (frames.md v2): два слоя .arbh-sq поверх аватара; U — предыдущий кадр, O — новый, проявляется crossfade xfade_ms */
function qsz(){return pz()}
function qsrc(n,nn){return src(n+'/'+nn,qsz(),SQC.path||'helper/frames/seq/')}
function seqCan(n){return !!(SQC.enabled&&!NA()&&!doc.hidden&&R&&!R.hidden&&!R.classList.contains('mini')&&(SQC.sequences||{})[n]&&SQU&&SQO)}
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
function afterLogin(){if(logged)return;logged=true;var W=CFG.welcome||{};if(gsOn()&&gsNarrow()){if(W.login_once!==false&&!SAWPIN&&ST.greetedDate===today()){gsMark();return}if(SAWPIN){SE.greeted=0;seSave()}ST.greetedDate=today();lsSet();gsCue();return}  /* новый вход по PIN — новое приветствие; перезагрузка или новая вкладка без PIN в тот же день — нет (login_once) */if(W.login_once!==false){if(!SAWPIN&&ST.greetedDate===today())return;ST.greetedDate=today();lsSet()}
 setTimeout(function(){var m=hintMsg('welcome_back','*',null,{},{priority:(EV.welcome_back||{}).priority});if(!m){var t=wpick('user');if(t)m={event:'welcome_back',text:t,emotion:'norma'}}
  if(m){say(m);if(emo(m.emotion||'norma')==='norma')wave('login');setTimeout(function(){humor('login')},(U.autohide_ms||8000)+800)}},W.delay_ms||1000)}
/* ---------- разделы ---------- */
function section(){var L=CFG.sections||[];for(var i=0;i<L.length;i++){var s=L[i];if(s.when&&!$$(s.when).some(vis))continue;if(s.visible&&!$$(s.visible).some(vis))continue;return s}return null}
var lastSec=null;function secTick(){if(!unlocked())return;var s=section(),id=s&&s.id;if(id===lastSec)return;lastSec=id;if(!s)return;
 setTimeout(function(){if(section()!==s||cur)return;say(secMsg(s,true))},CFG.section_auto_delay_ms||1500)}
function secMsg(s,auto){var A=CFG.actions||{};return {event:'section_hint',text:s.text,ref:s.ref||'',once:auto?'sec|'+s.id:null,key:'sec|'+s.id,buttons:(s.actions||[]).map(function(a){var x=A[a];return x&&{label:T(x.label_key)||a,cls:'pri',run:function(){act(x);return false}}}).filter(Boolean)}}
function act(x){var b=null;(x.click||[]).some(function(s){var e=$$(s).filter(function(e){return e.offsetParent!==null||vis(e)})[0]||$(s);if(e){b=e;return true}});if(b)b.click();if(x.then_scroll)setTimeout(function(){var t=$(x.then_scroll);if(t&&vis(t))t.scrollIntoView({block:'start',behavior:NA()?'auto':'smooth'})},250)}
function onAvatar(){if(queue.length){var q=queue.shift();q.user=true;show(q);return}if(!unlocked()){var W=CFG.welcome||{};show({event:'welcome',user:true,tag:PT.start_tag||'',text:fill(PT.start_text||'{tod}',{tod:tod()})||wpick('guest'),emotion:'norma',buttons:[{label:W.tour_btn||'Что умеет приложение',cls:'pri',run:function(){tour(0);return true}}]});return}
 var TJ=tapJoke();if(TJ){var W0=LASTM&&/^(deadline_|field_invalid|field_empty_required|error)/.test(LASTM.event)&&(Date.now()-(LASTM.t||0)<6e5)?LASTM:null;
  var mm={event:'avatar_tap',user:true,user0:true,tag:W0?(W0.tag||(EV[W0.event]||{}).tag||''):'',text:W0?W0.text:TJ,ref:W0?W0.ref:'',joke:W0?TJ:'',emotion:W0?(W0.emotion||(EV[W0.event]||{}).emotion):(HT.emotion||'norma'),
   buttons:[{label:HT.more_label||'Ещё шутку',cls:'ghost',run:function(){var n=tapJoke();if(n){if(W0)setJoke(n);else TXT.textContent=n;placeSoon()}return true}}]};show(mm);return}
 if(LASTM&&LASTM.event!=='welcome'&&LASTM.event!=='settings'&&unlocked()){var c={};for(var k in LASTM)c[k]=LASTM[k];c.once=null;c.user=true;c.onclose=null;c.onshow=null;show(c);return}
 show({event:'tip',user:true,user0:true,tag:PT.work_tag||'',text:PT.work_text||'',emotion:'norma'})}
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
function onFocus(e){var i=e.target;if(ST.hints===false||mode()!='on')return;if(!i||!i.dataset||!i.dataset.k||!unlocked()||!editing()||!editing().contains(i))return;var t=tpl();if(!t)return;var k=i.dataset.k;
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
 if(i){i.scrollIntoView({block:'center',behavior:NA()?'auto':'smooth'});try{i.focus({preventScroll:true})}catch(x){}}return i}
function onGen(e){var P=CFG.pregen||{};if(mode()=='off'||!unlocked())return;var b=e.target.closest&&e.target.closest((P.buttons||[]).join(','));if(!b)return;if(pass>Date.now())return;
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
 var C=CFG.confirm||{},el=lastClick.el;if(!R||mode()=='off'||ST.confirmDelete===false||!unlocked()||!r||kind=='missing'||!el||!doc.contains(el)||Date.now()-lastClick.t>(C.click_window_ms||2000))return NC.call(window,msg);
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
doc.addEventListener('click',function(e){var C=CFG.confirm||{};if(!R||mode()=='off'||ST.confirmDelete===false||!unlocked())return;(C.dialogs||[]).forEach(function(d){var o=e.target.closest&&e.target.closest(d.open);if(!o||o.disabled||dlgPass>Date.now())return;
  e.preventDefault();e.stopImmediatePropagation();dlgPass=Date.now()+500;o.click();var dl=$(d.dialog),q=$(d.question),y=$(d.yes);var msg=q?q.textContent.trim():'';if(!dl||!dl.open||!y)return;dl.close();
  ask({kind:'delete'},msg.replace(/\s*Действие необратимо\.?$/,'?').replace(/\?\?$/,'?'),function(){var y2=$(d.yes);if(!y2||!doc.contains(y2))return false;y2.click();return true})})},true);
/* ---------- сроки: только из index.json (templates[].computed) через расчёт docs.js; тексты — hints.json ---------- */
function dl(){try{return window.__docsTest&&__docsTest.dl}catch(e){return null}}
function iso2d(s){var a=String(s).split('-');return new Date(+a[0],+a[1]-1,+a[2])}
function dmy(s){var a=String(s).split('-');return a[2]+'.'+a[1]+'.'+a[0]}
function inVal(i){var v=String(i.value||'').trim(),m=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v);if(m)return m[3]+'-'+m[2]+'-'+m[1];if(/^\d{4}-\d\d-\d\d$/.test(v))return v;return null}
/* неотключаемые предупреждения у поля даты (config.always_show_hints) — не зависят от настроек, скрытия и «не показывать сегодня» */
var ALW=CFG.always_show_hints||[];
var DLN=0;function dlNote(i,m){var host=i.closest('label')||i,n=host.nextElementSibling;while(n&&n.classList&&n.classList.contains('arbh-ftip'))n=n.nextElementSibling;var ex=(n&&n.classList&&n.classList.contains('arbh-dlf')&&n.dataset.k===i.dataset.k)?n:null;
 if(!m){if(ex){dlUn(i,ex);ex.remove()}return}if(!ex){ex=doc.createElement('div');ex.className='arbh-dlf dlw';ex.id='arbh-dlw'+(++DLN);ex.setAttribute('role','status');ex.dataset.k=i.dataset.k;ex.innerHTML='<span class="dlw-i" aria-hidden="true"></span><div class="dlw-b"></div>';host.insertAdjacentElement('afterend',ex)}
 var miss=m.event==='deadline_missed',av=mode()=='on';ex.dataset.ev=m.event;ex.classList.toggle('missed',miss);ex.classList.toggle('near',!miss);ex.classList.toggle('noav',!av);
 var ic=ex.querySelector('.dlw-i');ic.innerHTML=av?'<img alt="" src="'+esc(src(emo('udivlenie'),128))+'">':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
 var bx=ex.querySelector('.dlw-b');bx.textContent='';var t=doc.createElement('b');t.textContent=cut(m.text);bx.appendChild(t);if(m.ref){var r=doc.createElement('span');r.className='r';r.textContent=' · '+m.ref;bx.appendChild(r)}
 var d=(i.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);if(d.indexOf(ex.id)<0){d.push(ex.id);i.setAttribute('aria-describedby',d.join(' '))}i.classList.add('arbh-dlw-f');i.classList.toggle('arbh-dlw-miss',miss)}
function dlUn(i,ex){var d=(i.getAttribute('aria-describedby')||'').split(/\s+/).filter(function(x){return x&&x!==ex.id});if(d.length)i.setAttribute('aria-describedby',d.join(' '));else i.removeAttribute('aria-describedby');i.classList.remove('arbh-dlw-f','arbh-dlw-miss')}
var dlT=0;function dlScan(){var D=dl(),t=tpl(),r=editing();if(!D||!t||!r||!unlocked())return;var near=+(CFG.deadlines||{}).near_days||7,now=iso2d(today());
 $$('.arbh-dlf',r).forEach(function(n){n.dataset.keep=''});
 $$((CFG.deadlines||{}).date_inputs||'input[data-k][data-date]',r).forEach(function(i){var k=i.dataset.k,cp=null,b=null;try{cp=D.caption(t.id,k);b=D.block(t.id,k)}catch(e){}if(!cp||!cp.iso||cp.pending||!b)return;
  if(b.verified===false)return;var rule=DLR[t.id+'.'+k];if(rule&&rule.verify===true)return;var dir=b.direction||(rule&&rule.direction),cd=iso2d(cp.iso),v=inVal(i),ev=null,days=Math.round((cd-now)/864e5);
  if(v&&cp.manual){var vd=iso2d(v);if(dir=='not_before'&&vd<cd)ev='deadline_missed';else if(dir=='not_after'&&vd>cd)ev='deadline_missed'}
  else if(dir!='not_before'){if(days<0)ev='deadline_missed';else if(days<=near)ev='deadline_near'}
  if(!ev)return;var ctx={action:rule&&rule.action||label(k),label:label(k),date:dmy(cp.iso),days:Math.max(0,days),n:Math.max(0,days),title:t.title};
  var m=hintMsg(ev,t.id,k,ctx,{once:ev+'|'+t.id+'|'+k});if(!m)m={event:ev,text:T(ev,{label:label(k),date:ctx.date,n:ctx.days}),ref:rule&&rule.ref||'',once:ev+'|'+t.id+'|'+k};
  if(!m.ref&&rule)m.ref=rule.ref||'';lastBad=Date.now();if(ALW.indexOf(ev)>=0){var mm=m.text?m:{event:ev,text:T(ev,{label:label(k),date:ctx.date,n:ctx.days}),ref:m.ref};mm.event=ev;dlNote(i,mm);var nn=(i.closest('label')||i).parentNode.querySelector('.arbh-dlf[data-k="'+k+'"]');if(nn)nn.dataset.keep='1'}say(m)});
 $$('.arbh-dlf',r).forEach(function(n){if(!n.dataset.keep){var i=$('[data-k="'+cssEsc(n.dataset.k)+'"]',r);if(i)dlUn(i,n);n.remove()}})}
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
/* ---------- окно, панель настроек, тост, значок 32 px (макет Дизайнера assistant_settings/spec.md, утверждён 16.10) ---------- */
var PT=(A2.popover||{}).texts||{},SH=A2.sheet||{},STT=A2.states||{},LASTM=null,SHE=null,toastT=0,savedT=0,shRet=null;
var HT=CFG.humor_on_tap||{};
function jokePool(){var ev=(HT.events||['doc_success','idle']).slice();if(new Date().getDay()==5&&HT.friday_event!==null)ev.push(HT.friday_event||'friday');var mx=HT.max_len||140;return HUMOR.filter(function(h){return ev.indexOf(h.event)>=0&&String(h.text).length<=mx})}
function tapJoke(){if(HT.enabled===false||!ST.jokes||mode()!='on'||!unlocked())return '';var P=jokePool();if(!P.length)return '';var L=SE.tj||[],ids=P.map(function(h){return h.id||h.text.slice(0,40)}),av=ids.filter(function(i){return L.indexOf(i)<0});
 if(!av.length){var last=L[L.length-1];L=[];av=ids.filter(function(i){return i!==last});if(!av.length)av=ids}var id=av[Math.floor(Math.random()*av.length)];L.push(id);SE.tj=L.slice(-200);seSave();return P[ids.indexOf(id)].text}
function setJoke(t){var j=$('.b-joke',R);if(!j){j=doc.createElement('div');j.className='b-joke';TXT.insertAdjacentElement('afterend',j)}j.textContent=t||'';j.hidden=!t}
function tod(){var g=(PT.tod||{})[daypart()];return g||''}
function trap(e,L){L=L.filter(function(x){return x&&!x.disabled});if(!L.length)return;var i=L.indexOf(doc.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();L[L.length-1].focus()}else if(!e.shiftKey&&i==L.length-1){e.preventDefault();L[0].focus()}}
function dkey(m){return String(m.event||'')+':'+String(m.id||m.key||m.once||'').replace(/^[^|]*\|/,'').slice(0,60)}
function canDis(m){return !!m&&!/^deadline_/.test(m.event)&&(A2.dismiss_events||['field_focus','template_open','section_hint','tip','idle','cp_updated','efrsb_new','practice_new','doc_ready']).indexOf(m.event)>=0&&!m.user0&&!!(m.id||m.key||m.once)}
function isDis(m){return canDis(m)&&(ST.dismissed||[]).indexOf(dkey(m))>=0}
function dismiss(m){if(!canDis(m))return;var k=dkey(m);if(ST.dismissed.indexOf(k)<0)ST.dismissed.push(k);ST.dismissed=ST.dismissed.slice(-(A2.dismissed_max||200));lsSet()}
function hiddenN(){return (ST.dismissed||[]).length+(nnum(ST.muteUntil)>Date.now()?1:0)}
function setAria(){if(!AV)return;var md=mode(),ic=iconMode();AV.setAttribute('aria-label',md=='off'?(STT.aria_off||NM):(md=='snooze'&&ic)?(STT.aria_snooze||NM):(STT.aria_on||NM));if(NM)AV.setAttribute('title',md=='off'?(STT.tip_off||NM):NM);
 AV.setAttribute('aria-expanded',cur&&R.classList.contains('open')?'true':'false');if(md=='off')AV.removeAttribute('aria-haspopup');else AV.setAttribute('aria-haspopup','dialog');
 var tp=$('.a-tip',R);if(tp)tp.textContent=md=='off'?(STT.tip_off||NM):(STT.tip_snooze||'Скрыт до 00:00')}
var GEAR='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
/* низ окна: «⚙ Настройки» · «Скрыть на сегодня» · «Закрыть» */
function barIds(m){var P=A2.popover||{};if(P.enabled===false||m.nobar||m.event==='settings'||(prio(m)>=100&&!m.user)||m.event==='tour')return [];if(m.bar)return m.bar;var L=[];if(P.settings_btn!==false&&SH.enabled!==false)L.push('settings');if(P.snooze_btn!==false&&mode()=='on')L.push('snooze');if(P.close_btn!==false)L.push('close');return L}
function barHas(id){return !!cur&&barIds(cur).indexOf(id)>=0}
function bar(m){var el=$('.b-bar',R);if(!el)return;el.innerHTML='';var L=barIds(m);el.hidden=!L.length;
 L.forEach(function(id){var x=doc.createElement('button');x.type='button';x.className='b-bb'+(id=='settings'?' set':'');x.dataset.bar=id;if(id=='settings')x.innerHTML=GEAR+'<span></span>';(id=='settings'?x.lastChild:x).textContent=PT[id]||id;
  ['pointerdown','mousedown','touchstart'].forEach(function(t){x.addEventListener(t,function(ev){ev.stopPropagation()},{passive:true})});x.addEventListener('click',function(ev){ev.stopPropagation();ev.preventDefault();if(id==='settings'){openSheet()}else if(id==='snooze')snooze();else{close(true);try{AV.focus({preventScroll:true})}catch(e){}}});el.appendChild(x)})}
function toast(t,bl,fn){var el=$('#arbhs .toast');if(!el)return;$('span',el).textContent=t;var b=$('button',el);b.textContent=bl||'';b.hidden=!bl;b.onclick=function(){el.classList.remove('on');fn&&fn()};el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('on')},STT.toast_ms||5000)}
function enable(){ST.on=true;ST.hiddenUntil=0;ST.min=false;lsSet();R.classList.remove('mini');apply();if(!NA()){R.classList.add('pop');setTimeout(function(){R.classList.remove('pop')},(U.spring_ms||420)+50)}toast(STT.toast_on||NM,STT.toast_on_btn||'Настройки',openSheet);sync()}
function snooze(){var t=midnight();ST.hiddenUntil=t;ST.muteUntil=t;lsSet();queue=queue.filter(important);close(false);tempOn=false;apply();toast(STT.toast_snooze||NM+' скрыт до 00:00',STT.toast_snooze_btn||'Вернуть',unsnooze);sync()}
function unsnooze(){ST.hiddenUntil=0;ST.muteUntil=0;lsSet();if(cur)close(false);tempOn=false;apply();sync()}
function snoozeWin(){show({event:'snooze',user:true,user0:true,force:true,tag:PT.snooze_tag||'',text:PT.snooze_text||'',emotion:'norma',bar:['settings','close'],buttons:[{label:PT.snooze_show||'Показать сейчас',cls:'pri',run:function(){unsnooze();return true}}]})}
/* панель настроек: ПК — справа 400 px, телефон — снизу; всё сохраняется сразу */
function sheetOpen(){return doc.body.classList.contains('arbh-sheet-open')}
function swRow(k,ic,lab,sub,extra){var o=SH[k]||{};if(o.enabled===false)return '';return '<div class="row'+(k=='on'?' master':'')+'"><span class="ic">'+ic+'</span><div class="t" id="arbhs-l-'+k+'">'+esc(lab||o.label)+'<small'+(k=='on'?' class="onsub"':'')+'>'+esc(sub!=null?sub:o.sub||'')+'</small>'+(extra||'')+'</div><button type="button" class="sw" role="switch" data-k="'+k+'" aria-labelledby="arbhs-l-'+k+'"'+(extra?' aria-describedby="arbhs-always"':'')+'></button></div>'}
function segRow(k){var o=SH[k]||{};if(o.enabled===false)return '';return '<div class="row stack"><div class="t" id="arbhs-l-'+k+'">'+esc(o.label)+(o.sub?'<small>'+esc(o.sub)+'</small>':'')+'</div><div class="seg" role="radiogroup" aria-labelledby="arbhs-l-'+k+'" data-k="'+k+'">'+(o.options||[]).map(function(x){return '<button type="button" role="radio" data-v="'+esc(x.id)+'">'+esc(x.label)+'</button>'}).join('')+'</div></div>'}
var SVG=function(p){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>'},CLK='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
function buildSheet(){if(SHE)return SHE;var W=doc.createElement('div');W.id='arbhs';var R0=SH.reset||{};
 W.innerHTML='<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="arbhs-t" aria-describedby="arbhs-s" tabindex="-1"><div class="sh-grab" aria-hidden="true"></div><div class="sh-head"><h2 id="arbhs-t">'+esc(SH.title)+'</h2><button type="button" class="sh-x" aria-label="'+esc(SH.close_aria||'Закрыть')+'">×</button></div><div class="sh-body">'+
  '<p class="sh-sub"><span id="arbhs-s">'+esc(SH.sub)+'</span> <span class="sh-saved" role="status" aria-live="polite">'+SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>')+'<span></span></span></p>'+
  '<div class="grp" data-g="m">'+swRow('on','<img alt="" src="'+esc(src('norma',128))+'">',null,'')+'</div>'+
  '<h3 class="sh-cap" id="arbhs-c1">'+esc(SH.cap_show)+'</h3><div class="grp dep" role="group" aria-labelledby="arbhs-c1">'+
   swRow('hints',SVG('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),null,null,'<small class="always" id="arbhs-always">'+SVG(CLK)+esc((SH.hints||{}).always||'')+'</small>')+
   swRow('confirmDelete',SVG('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'))+swRow('greet',SVG('<path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M19 12h2M17 7l1.4-1.4"/><path d="M7 16a5 5 0 0 1 10 0"/><path d="M3 20h18"/>'))+
   swRow('jokes',SVG('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2M9 9.5h.01M15 9.5h.01"/>'))+'</div>'+
  '<h3 class="sh-cap" id="arbhs-c2">'+esc(SH.cap_look)+'</h3><div class="grp dep" role="group" aria-labelledby="arbhs-c2">'+swRow('anim',SVG('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/>'))+segRow('size')+segRow('side')+'</div>'+
  (R0.enabled===false?'':'<h3 class="sh-cap">'+esc(SH.cap_reset)+'</h3><div class="grp dep"><div class="row stack"><div class="t">'+esc(R0.text)+'<small id="arbhs-rs"></small></div><button type="button" class="rst" aria-describedby="arbhs-rs">'+esc(R0.label)+'</button></div></div>')+
  '<p class="sh-note">'+esc(SH.note)+'</p></div></div><div class="toast" role="status" aria-live="polite"><span></span><button type="button"></button></div>';
 doc.body.appendChild(W);SHE=W;
 $('.scrim',W).addEventListener('click',closeSheet);$('.sh-x',W).addEventListener('click',closeSheet);
 W.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled||!$('.sheet',W).contains(b))return;
  if(b.classList.contains('sw')){var k=b.dataset.k,v=b.getAttribute('aria-checked')!=='true';if(k=='on'){ST.on=v;if(v)ST.hiddenUntil=0}else ST[k]=v;changed();return}
  if(b.getAttribute('role')=='radio'){setSeg(b);return}
  if(b.classList.contains('rst')){ST.dismissed=[];ST.muteUntil=0;ST.hiddenUntil=0;SE.seen={};seSave();tempOn=false;changed(R0.done||'Подсказки сброшены')}});
 W.addEventListener('keydown',function(e){var b=e.target;if(b.getAttribute&&b.getAttribute('role')=='radio'&&/^Arrow(Left|Right|Up|Down)$/.test(e.key)){e.preventDefault();var L=$$('button',b.parentNode).filter(function(x){return !x.disabled}),i=L.indexOf(b),n=L[(i+(/Right|Down/.test(e.key)?1:L.length-1))%L.length];setSeg(n);n.focus()}
  else if(e.key=='Tab'&&sheetOpen())trap(e,$$('.sheet button',W).filter(vis))});
 return W}
function setSeg(b){var g=b.parentNode;ST[g.dataset.k]=b.dataset.v;changed()}
function changed(msg){lsSet();apply();sync();var sv=$('#arbhs .sh-saved');if(sv){$('span',sv).textContent='✓ '+(msg||SH.saved||'Сохранено');sv.classList.add('on');clearTimeout(savedT);savedT=setTimeout(function(){sv.classList.remove('on')},1400)}}
function sync(){if(!SHE)return;var md=mode();$$('.sw',SHE).forEach(function(b){var k=b.dataset.k;b.setAttribute('aria-checked',String(k=='on'?ST.on:ST[k]!==false));b.disabled=k!='on'&&!ST.on});
 $$('.seg',SHE).forEach(function(g){var k=g.dataset.k;$$('button',g).forEach(function(b){var on=b.dataset.v===ST[k];b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1;b.disabled=!ST.on})});
 $$('.grp.dep',SHE).forEach(function(g){g.classList.toggle('dis',!ST.on)});var O=SH.on||{},os=$('.onsub',SHE);if(os)os.textContent=md=='off'?O.sub_off:md=='snooze'?O.sub_snooze:O.sub_on;
 var R0=SH.reset||{},n=hiddenN(),w=R0.words||['подсказка','подсказки','подсказок'],n10=n%10,n100=n%100,wi=(n10==1&&n100!=11)?0:(n10>=2&&n10<=4&&(n100<12||n100>14))?1:2,rs=$('#arbhs-rs');
 if(rs)rs.textContent=n?fill(R0.count||'{n} {w}',{n:n,w:w[wi]}):R0.none;var rb=$('.rst',SHE);if(rb)rb.disabled=!n||!ST.on}
function openSheet(){if(SH.enabled===false)return;buildSheet();if(!doc.body.contains(SHE))doc.body.appendChild(SHE);var sw=(mob()?0:(SH.width_px||360));SHE.style.setProperty('--sheet-w',(SH.width_px||360)+'px');R.style.setProperty('--arbh-shoff',(sw+12)+'px');sync();shRet=AV;doc.body.classList.add('arbh-sheet-open');if(cur)close(false);
 $$('body > *').forEach(function(e){if(e!==SHE&&e!==R&&!e.hasAttribute('aria-hidden')&&!/^(SCRIPT|STYLE|LINK)$/.test(e.tagName)){e.setAttribute('aria-hidden','true');e.dataset.arbhAh='1'}});
 setTimeout(function(){var f=$('.sw[data-k="on"]',SHE);try{f&&f.focus({preventScroll:true})}catch(x){}},30);place()}
function closeSheet(){if(!sheetOpen())return;doc.body.classList.remove('arbh-sheet-open');$$('[data-arbh-ah]').forEach(function(e){e.removeAttribute('aria-hidden');delete e.dataset.arbhAh});place();try{(shRet||AV).focus({preventScroll:true})}catch(x){}}
function settings(){openSheet()}
function apply(){if(!R)return;R.hidden=pinHidden();var md=mode();if(md!='on'&&cur&&!cur.user&&!(md=='snooze'&&important(cur)))close(false);if(md=='off'){clearTimeout(hideT);queue=[];if(cur&&!cur.force)close(false)}css();doc.body.classList.toggle('arbh-pin-mob',false);place();footer();setAria();try{dlScan()}catch(e){}}
function footer(){var host=$((CFG.ui||{}).profile_mount||'footer');if(!host)return;var b=$('#arbhf');if(!b){b=doc.createElement('button');b.type='button';b.id='arbhf';host.appendChild(b);
  b.addEventListener('click',function(){openSheet()})}
 b.textContent=ST.on?T('footer_on'):T('footer_off')}
/* ---------- запуск ---------- */
function start(){if(R)return;build();buildSheet();apply();try{var o0=JSON.parse(localStorage.getItem(SK)||'null');if(o0&&o0.v!==2)lsSet()}catch(e){}if(window.visualViewport)visualViewport.addEventListener('resize',placeSoon);addEventListener('scroll',function(){if(mob())placeSoon()},{passive:true});doc.addEventListener('focusin',function(){setTimeout(placeSoon,0)});doc.addEventListener('focusout',function(){setTimeout(placeSoon,60)});var lm=mode();setInterval(function(){var x=mode();if(x!==lm){lm=x;tempOn=false;apply();sync()}},30000);
 if(!NA()){R.classList.add('pop');setTimeout(function(){R.classList.remove('pop')},(U.spring_ms||420)+50)}
 doc.addEventListener('pointerdown',function(e){var P=CFG.pin||{};if(cur&&P.collapse_on&&e.target.closest&&e.target.closest(P.collapse_on)&&(P.collapse_events||[]).indexOf(cur.event)>=0)close(false)},true);
 doc.addEventListener('keydown',function(e){var P=CFG.pin||{};if(cur&&/^[0-9]$/.test(e.key)&&pinVis()&&(P.collapse_events||[]).indexOf(cur.event)>=0)close(false)},true);
 if(!unlocked())welcome();
 doc.addEventListener('focusin',onFocus,true);doc.addEventListener('focusout',onBlur,true);doc.addEventListener('click',onGen,true);
 doc.addEventListener('click',function(e){var x=e.target.closest&&e.target.closest('[data-t]');if(x&&x.dataset.t)lastT=x.dataset.t},true);
 addEventListener('resize',placeSoon);
 var FF='input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea,select,[contenteditable=""],[contenteditable=true]';function ffchk(){var e=doc.activeElement;var v=!!(e&&e.matches&&e.matches(FF)&&!(R&&R.contains(e)));if(v!==ffocus){ffocus=v;placeSoon()}}
 doc.addEventListener('focusin',ffchk);doc.addEventListener('focusout',function(){setTimeout(ffchk,0)});addEventListener('scroll',placeSoon,{passive:true});
 doc.addEventListener('change',function(e){if(e.target&&e.target.dataset&&e.target.dataset.k){clearTimeout(dlT);dlT=setTimeout(dlScan,300)}},true);
 var mt=0;new MutationObserver(function(){placeSoon();clearTimeout(mt);mt=setTimeout(function(){watch();secTick();clearTimeout(dlT);dlT=setTimeout(dlScan,400)},250)}).observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden','open']});
 setInterval(function(){if(unlocked())loadHints();place();idleTick()},1000);place()}
window.ArbHelper={say:function(ev,o){o=o||{};var m=hintMsg(ev,o.template||'*',o.field||null,o.ctx||{})||(o.text?{event:ev,text:o.text,ref:o.ref}:null);return m?say(m):false},
 emotion:function(e){if(R)setFace(e)},setDirty:function(v){dirty=!!v},state:function(){return {on:ST.on,min:ST.min,humor:ST.jokes,off_today:offToday(),emotion:face,open:!!cur,event:cur&&cur.event,queue:queue.length,hints:HINTS?HINTS.length:null}},
 test:{when:function(w){return whenOk(w)},blinkNow:function(){clearTimeout(blinkT);blink()},show:function(e,t){show({event:'test',text:t||e,emotion:e,ms:600000})},close:function(){close(false)},humor:humor,scan:dlScan,watch:watch,tpl:function(){var t=tpl();return t&&t.id}}};
if(doc.readyState=='loading')doc.addEventListener('DOMContentLoaded',start);else start();
})();
