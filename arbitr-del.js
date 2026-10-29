/* Arbitr: выбор и удаление отчётов (Судебная практика, Финанализ, Оценка).
   17.10: файлы закрытого репозитория НЕ стираются. Удалённые отчёты и их запросы попадают в список ArbHide
   (assets/arbitr-hide.js: хэши на устройстве + arbitr/deleted.json в закрытом репозитории) и скрываются во всех списках,
   счётчиках и «в обработке» — сразу, после перезагрузки и после следующей синхронизации. Строки «в обработке» тоже можно удалить. */
(function(){
var $=function(i){return document.getElementById(i)};
var L={prc:{list:'prcl',attr:'pn',idx:'practice/index.json',reload:function(){return prcList()}},
       fin:{list:'finl',attr:'fc',idx:'finance/index.json',reload:function(){return finList()}},
       eval:{list:'evl',attr:'vk',idx:'valuation/index.json',reload:function(){return window.EVAL_LIST&&window.EVAL_LIST()}}};
var PQ={prc:'pq',fin:'fq'};
var XL={prc:'prqau'};  /* 29.10 (QA 9e6efe2): отчёты Судебной практики из очереди запросов (docs_prq.js, #prqau) тоже выбираются; id — «q:<id запроса>» */
function LS(k){var a=[$(L[k].list)];if(XL[k])a.push($(XL[k]));return a.filter(Boolean)}  /* атрибут id запроса у строк «в обработке» */
var SEL={prc:new Set(),fin:new Set(),eval:new Set()},mode=null,busy=false,CR={},CRT={};
var RET=window.ARB_RET||{retention_days:3,item_line:'Хранится до {until}',item_title:'',list_note:'',soon_hours:24,soon_color:'#FF9500'};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function pl(n){var f=DL.forms||['','',''],a=n%10,b=n%100;return n+' '+(a==1&&b!=11?f[0]:a>=2&&a<=4&&(b<12||b>14)?f[1]:f[2])}
function ok(){return typeof TOKEN!='undefined'&&TOKEN&&typeof REPO!='undefined'&&REPO&&!REPO.startsWith('/*')}
function ts(s){var m=/(\d{4})(\d\d)(\d\d)T?(\d\d)(\d\d)(\d\d)/.exec(s||'');return m?Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5],+m[6]):null}
function msk(t){var d=new Date(t+3*36e5),p=function(n){return (n<10?'0':'')+n};return p(d.getUTCDate())+'.'+p(d.getUTCMonth()+1)+', '+p(d.getUTCHours())+':'+p(d.getUTCMinutes())}
/* 29.10 (QA 9e6efe2, п.5): без practice/index.json не повторять запрос на каждую перерисовку — пауза растёт вдвое после каждой ошибки (cr_backoff: от min_s до max_s) */
async function loadCr(){var B=DL.cr_backoff||{},now=Date.now();if(!ok()||CRT.busy||CRT.next&&now<CRT.next)return;CRT.busy=1;
 try{var ix=JSON.parse(await ghRaw(L.prc.idx));Object.keys(ix).forEach(function(k){CR['prc:'+k]=ts(ix[k]&&ix[k].request_id)});CRT.f=0;CRT.next=Date.now()+(+B.ok_s||60)*1000;paint()}
 catch(e){CRT.f=(CRT.f||0)+1;CRT.next=Date.now()+Math.min((+B.max_s||900),(+B.min_s||30)*Math.pow(2,CRT.f-1))*1000}finally{CRT.busy=0}}
function created(k,id){if(id.indexOf('e:')===0)return null;return k=='prc'?CR['prc:'+id]:ts(id)}
var css='.adcb{flex:0 0 22px;width:22px;height:22px;border-radius:50%;border:2px solid var(--mut,#8a9);box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;margin:2px 10px 0 0;cursor:pointer;position:relative}.adcb:before{content:"";position:absolute;inset:-11px}'+
'.adcb.on{background:#14B8A6;border-color:#14B8A6}.adcb.on:after{content:"";width:5px;height:10px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:translateY(-1px) rotate(45deg)}'+
'.lot[data-ad]{display:flex;flex-wrap:wrap;align-items:flex-start}.lot[data-ad]>.row{flex:1 1 0;min-width:0}.lot[data-ad]>:not(.row):not(.adcb){flex:1 1 100%}'+
'.adret{font-size:12px;color:var(--mut,#8a9);display:flex;align-items:center;gap:4px;margin-top:2px}.adret.soon{color:'+RET.soon_color+'}.adnote{font-size:12px;color:var(--mut,#8a9);margin:0 0 8px}'+
'.adh.adwrap{flex-wrap:wrap;row-gap:2px;background:var(--pan)}.adh.adwrap>.adt{white-space:normal;overflow:visible;text-overflow:clip;flex:1 1 180px;overflow-wrap:break-word}.adtop[hidden]{display:none!important}'+
'.adh{display:flex!important;align-items:center;gap:6px;position:sticky;top:var(--adtop,0px);z-index:4;padding:6px 0;margin-top:0;min-height:36px}.adh>.adt{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.adall{flex:0 0 auto;background:transparent!important;border:0!important;box-shadow:none!important;color:var(--acc2,#5EEAD4)!important;font-size:14px;font-weight:600;padding:0 8px;height:36px;min-height:36px;margin:0!important}.adall:disabled{opacity:.4}'+
'.adtop{flex:0 0 auto;height:36px;min-height:36px;padding:0 12px;margin:0!important;border-radius:10px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;cursor:pointer;transition:background .15s,color .15s}'+
'.adtop.off .adi{opacity:.5}.adtop.off{background:transparent!important;border:1px solid rgba(255,59,48,.5)!important;color:rgba(255,59,48,.5)!important;cursor:default}.adtop.on{background:#FF3B30!important;border:1px solid #FF3B30!important;color:#fff!important}.adtop:active{filter:brightness(.85)}'+
'#adbar{position:fixed;left:0;right:0;bottom:0;z-index:50;display:none;align-items:center;gap:10px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:var(--card,#10302a);border-top:1px solid #8884;box-shadow:0 -4px 16px #0004}'+
'#adbar b{flex:1;font-weight:600;min-width:0}#adbar .adred,#addlg .adred{background:transparent!important;color:var(--acc2,#5EEAD4)!important;border:1px solid var(--acc2,#5EEAD4)!important}.adred{background:transparent!important;color:#EF4444!important;border:1px solid #EF444466!important;font-weight:600;display:inline-flex;align-items:center;gap:6px}.adred:disabled{opacity:.45}'+
'#adbar .lbtn,#addlg .lbtn{margin:0;min-height:44px}#adbar .lbtn{padding:0 16px}#addlg{border:1px solid var(--line);border-radius:14px;padding:20px;max-width:400px;width:calc(100% - 40px);background:var(--pan,var(--card,#10302a));color:var(--ink,inherit);box-sizing:border-box}#addlg::backdrop{background:#0008}#addlg h3{margin:0 0 8px;font-size:18px;color:var(--ink)}#addlg p{margin:0 0 10px;line-height:1.45}#addlg .adln{color:var(--mut);font-size:13px;white-space:pre-line}#addlg .adln:empty,#addlg #adm:empty{display:none}#addlg .r{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}#addlg .r .lbtn{min-height:44px;padding:0 18px}#addlg .lbtn:disabled{opacity:.6;cursor:default}#addlg.sheet{inset:auto 0 0 0;margin:0;max-width:none;width:100%;max-height:85vh;border-radius:16px 16px 0 0;border-bottom:0;padding:20px 16px calc(16px + env(safe-area-inset-bottom))}#addlg.sheet .r{flex-direction:column-reverse;gap:8px}#addlg.sheet .r .lbtn{width:100%}'+
'body.adon-any{padding-bottom:72px}body.adon-any.adon-pad{padding-bottom:var(--adbar-h,72px)}'+barLight()+barLift()+cbIn()+bodyIn()+hovIn()+'.lot.adgone{display:none!important}.lot.adfade{transition:opacity var(--adms,200ms),transform var(--adms,200ms);opacity:0;transform:translateX(-12px)}'+'#aderr,#adundo{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));z-index:141;display:none;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;box-shadow:0 6px 24px #0006;max-width:min(520px,calc(100vw - 32px));box-sizing:border-box;font-size:14px}'+'#aderr{background:#7F1D1D;color:#fff;border:1px solid #EF4444}#adundo{background:#0D4F47;color:#fff;border:1px solid #14B8A666}#aderr button,#adundo button{background:transparent!important;border:0!important;color:#fff!important;font-weight:700;font-size:14px;cursor:pointer;padding:6px 4px;margin:0;min-height:36px;text-decoration:underline}'+
'html,body{overflow-x:hidden}#evl,#finl,#prcl{min-width:0;max-width:100%}#evl .lot,#finl .lot,#prcl .lot{min-width:0;max-width:100%;box-sizing:border-box}'+
'.lot[data-ad] .row,.lot[data-ad] .row>*,.lot[data-ad] .row>*>*{min-width:0}.lot[data-ad] .d1,.lot[data-ad] .sm{overflow-wrap:break-word;word-break:normal;hyphens:manual}#prqau .lot[data-ad]{display:block;position:relative;padding-left:48px}#prqau .lot[data-ad]>.adcb{position:absolute;left:14px;top:14px;margin:0}'+
'.lot[data-ad] .evbt{display:flex;flex-wrap:wrap;gap:8px}.lot[data-ad] .evbt .lbtn{margin:0;max-width:100%}.adh>.adt{min-width:0}'+
'#adtoast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));z-index:140;background:#3a1512;color:#fff;border:1px solid #EF444466;padding:12px 16px;border-radius:12px;box-shadow:0 6px 24px #0006;max-width:min(520px,calc(100vw - 32px));box-sizing:border-box;font-size:14px;line-height:1.4;overflow-wrap:anywhere}#adtoast.ok{background:#0D4F47;border-color:#14B8A666}';
var DL=Object.assign({forms:['отчёт','отчёта','отчётов'],confirm_yes:'Скрыть',confirm_no:'Отмена',busy:'Скрываю…',ok:'Скрыто: {n}',err:'Не удалось скрыть',err_retry:'↻ Повторить',err_sep:' · ',err_rights:'',delete_undo:false,undo_anim_ms:200,undo_s:6,undo_text:'Скрыто: {n}',undo_btn:'Отменить',commit_msg:'arbitr: скрыто {n}',commit_undo_msg:'arbitr: отмена скрытия {n}',item_title:'Отметить',pend_title:'Отметить запрос',icon:'',btn:'Скрыть',btn_n:'Скрыть ({n})',hint_empty:'Отметьте отчёты',hint_n:'Скрыть отмеченные отчёты: {n}',login:'Скрывать отчёты можно после входа (PIN).',confirm:'Скрыть {reports}?',select_all:'Выбрать все',unselect_all:'Снять все',bar_count:'Выбрано: {n}',bar_clear:'Снять'},window.ARB_DEL||{});
function F(s,o){return String(s).replace(/\{(\w+)\}/g,function(m,k){return o[k]!=null?o[k]:m})}
var TR='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.1 6.1C4 7.5 2.6 9.6 2 12c1 2.5 5 7 10 7 1.7 0 3.3-.5 4.6-1.3"/></svg>';  /* 29.10: «Скрыть» — значок «глаз зачёркнут», не корзина */
var CK='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
/* 21.10 (Дизайнер): светлая тема нижней полосы «Выбрано: N · Снять · Удалить (N)» — фон карточки, тонкая линия сверху, тень вверх,
   текст основного цвета, «Удалить (N)» — контурная --danger. Значения — arbitr_config.json → delete.bar.colors_light. Тёмная тема — как было. Полоса общая (Практика, Финанализ, Оценка). */
function barLight(){var c=(((window.ARB_DEL||{}).bar||{}).colors_light)||{},q='html[data-theme=light] ';if(!c.bg)return '';
 return q+'#adbar{background:'+c.bg+';color:'+c.ink+';border-top:1px solid '+c.line+';box-shadow:'+c.shadow+'}'+q+'#adbar b{color:'+c.ink+'}'+q+'#adbar .adred{color:'+c.danger+'!important;border:1px solid '+c.danger+'!important;background:transparent!important}'}
/* 21.10 (Дизайнер): пока видна полоса (разделы delete.bar.lift.sections), от min_w px круглая кнопка «Обновления» и Саныч стоят над ней:
   bottom = высота полосы (--adbar-h, уже с safe-area — полоса сама отступает на env(safe-area-inset-bottom)) + gap_px. Ниже min_w Саныч поднимается сам (helper.json avoid_selectors). */
function barLift(){var f=(((window.ARB_DEL||{}).bar||{}).lift)||{};if(!f.sections||!f.sections.length)return '';var g=(+f.gap_px||0)+'px',v='calc(var(--adbar-h,72px) + '+g+')';
 return '@media (min-width:'+(+f.min_w||700)+'px){body.adon-lift #updlog-btn.updlog-fixed{bottom:'+v+'!important;top:auto!important}body.adon-lift #arbh:not(.hero):not(.pin){bottom:'+v+'!important}}'}
/* 21.10 (Дизайнер по 25e2418): от check.min_w px кружок выбора внутри карточки — check.left_px от левого края; по вертикали — центр первой строки заголовка (check.line_of), отступ сверху считает paint() в --adcb-t */
function CB(){return (((window.ARB_DEL||{}).bar||{}).check)||{}}
function cbIn(){var c=CB();if(!c.sections||!c.sections.length)return '';var q=c.sections.map(function(k){return L[k]?'#'+L[k].list+' .lot[data-ad]>.adcb':''}).filter(Boolean).join(',');if(!q)return '';
 return '@media (min-width:'+(+c.min_w||0)+'px){'+q+'{margin-top:var(--adcb-t,2px);margin-left:'+(+c.left_px||0)+'px}}'}
function cbTop(k,c,cb){var o=CB();if(!o.sections||o.sections.indexOf(k)<0)return;var wide=innerWidth>=(+o.min_w||0),d=wide&&c.querySelector(o.line_of||'.d1'),v='';
 if(d){var cr=c.getBoundingClientRect(),dr=d.getBoundingClientRect(),lh=parseFloat(getComputedStyle(d).lineHeight)||dr.height,bt=parseFloat(getComputedStyle(c).borderTopWidth)||0;v=Math.max(0,Math.round(dr.top+lh/2-cb.offsetHeight/2-cr.top-bt))+'px'}
 if(c.style.getPropertyValue('--adcb-t')!==v){if(v)c.style.setProperty('--adcb-t',v);else c.style.removeProperty('--adcb-t')}}
/* 21.10 (Дизайнер по 25e2418): от align_content.min_w px содержимое полосы — в границах карточки раздела (align_content.to), полоса во всю ширину */
function barAlign(bar,k){var a=(((window.ARB_DEL||{}).bar||{}).align_content)||{},pl='',pr='';
 if(a.sections&&a.sections.indexOf(k)>=0&&innerWidth>=(+a.min_w||0)){var l=$(L[k].list),t=l&&(l.closest(a.to||'.md')||l);if(t){var r=t.getBoundingClientRect(),br=bar.getBoundingClientRect(),p=+a.pad_px||0;pl=Math.max(p,Math.round(r.left-br.left))+'px';pr=Math.max(p,Math.round(br.right-r.right))+'px'}}
 if(bar.style.paddingLeft!==pl)bar.style.paddingLeft=pl;if(bar.style.paddingRight!==pr)bar.style.paddingRight=pr}
/* 21.10 (Дизайнер, QA 8f54707, C): у карточек с выбором блоки под строкой заголовка — с отступами delete.bar.body: слева по краю заголовка (--adbody-l, считает paint()), справа right_px, у последнего снизу bottom_px */
function BD(){return (((window.ARB_DEL||{}).bar||{}).body)||{}}
function sq(o,tail){return (o.sections||[]).map(function(k){return L[k]?'#'+L[k].list+' .lot[data-ad]'+tail:''}).filter(Boolean).join(',')}
function bodyIn(){var b=BD(),q=sq(b,'>:not(.row):not(.adcb)');if(!q)return '';
 return q+'{box-sizing:border-box;padding-left:var(--adbody-l,'+(+b.left_px||0)+'px);padding-right:'+(+b.right_px||0)+'px}'+sq(b,'>:not(.row):not(.adcb):last-child')+'{padding-bottom:'+(+b.bottom_px||0)+'px}'}
function bodyL(k,c){var b=BD();if(!b.sections||b.sections.indexOf(k)<0||!b.left_to)return;var d=c.querySelector(':scope>.row '+b.left_to),v='';
 if(d){var bl=parseFloat(getComputedStyle(c).borderLeftWidth)||0;v=Math.max(0,Math.round(d.getBoundingClientRect().left-c.getBoundingClientRect().left-bl))+'px'}
 if(c.style.getPropertyValue('--adbody-l')!==v){if(v)c.style.setProperty('--adbody-l',v);else c.style.removeProperty('--adbody-l')}}
/* 21.10 (Дизайнер, QA 8f54707, D): подсветка при наведении — на всю карточку (delete.bar.hover.sections), цвет colors_light.hover / colors_dark.hover */
function hovIn(){var B=((window.ARB_DEL||{}).bar||{}),h=B.hover||{},lc=(B.colors_light||{}).hover,dc=(B.colors_dark||{}).hover,r=sq(h,'>.row:hover');if(!r)return '';
 var g=function(c){return 'background-image:linear-gradient('+c+','+c+')'},o=r+'{background:transparent!important}',hs=sq(h,':has(>.row:hover)');
 if(lc)o+='html[data-theme=light] '+hs.split(',').join(',html[data-theme=light] ')+'{'+g(lc)+'}';
 if(dc)o+='html:not([data-theme=light]) '+hs.split(',').join(',html:not([data-theme=light]) ')+'{'+g(dc)+'}';
 return '@supports selector(:has(*)){'+o+'}'}
function setup(){
 if(!$('adcss')){var s=document.createElement('style');s.id='adcss';s.textContent=css;document.head.appendChild(s)}
 if(!$('adbar')){document.body.insertAdjacentHTML('beforeend','<div id="adbar"><b id="adn">Выбрано: 0</b><button class="lbtn sec" id="adcan">Снять</button><button class="lbtn adred" id="addel" disabled>'+TR+'<span id="addt">Скрыть</span></button></div><dialog id="addlg" aria-labelledby="adq" aria-describedby="adtx"><h3 id="adq"></h3><p id="adtx"></p><p class="adln" id="adln"></p><p class="sm" id="adm" role="alert"></p><div class="r"><button type="button" class="lbtn sec" id="adno"></button><button type="button" class="lbtn" id="adyes"></button></div></dialog><div id="aderr" role="alert"><span id="adet"></span><button type="button" id="adretry"></button></div><div id="adundo" role="status"><span id="adut"></span><button type="button" id="adub"></button></div>');
  $('adno').textContent=DL.confirm_no;$('adyes').textContent=DL.confirm_yes;$('adretry').textContent=DL.err_retry;$('adub').textContent=DL.undo_btn;$('adretry').onclick=retry;$('adub').onclick=undo;
  $('adcan').onclick=function(){if(mode)SEL[mode].clear();paint()};$('addel').onclick=ask;$('adno').onclick=function(){if(!busy)$('addlg').close()};$('adyes').onclick=go;
  $('addlg').addEventListener('click',function(e){var d=$('addlg');if(e.target!==d||busy)return;var r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()})}
 Object.keys(XL).forEach(function(k){var x=$(XL[k]);if(x&&!x.dataset.adw){x.dataset.adw=1;x.addEventListener('click',function(e){var cb=e.target.closest('.adcb');if(!cb)return;e.preventDefault();e.stopPropagation();var id=cb.parentNode.dataset.ad;selk(k);SEL[k].has(id)?SEL[k].delete(id):SEL[k].add(id);paint()},true)}});
 Object.keys(L).forEach(function(k){var l=$(L[k].list);if(!l)return;var h=null,n=l;
  while(n&&!h){n=n.previousElementSibling;if(n&&n.tagName=='H3')h=n}
  if(h&&!h.querySelector('.adall')){h.classList.add('adh');h.dataset.adk=k;if((DL.wrap_title||[]).indexOf(k)>=0)h.classList.add('adwrap');if(!h.querySelector('.adt')){var sp=document.createElement('span');sp.className='adt';while(h.firstChild)sp.appendChild(h.firstChild);h.appendChild(sp)}var b=document.createElement('button');b.type='button';b.className='lbtn sec adall';b.dataset.ad=k;b.textContent=DL.select_all;b.onclick=function(){if(ua(k)&&mode===k&&SEL[k].size){SEL[k].clear();mode=null;paint();return}var ids=allIds(k).filter(nq);var all=ids.length&&ids.every(function(i){return SEL[k].has(i)});if(!all)selk(k);ids.forEach(function(i){all?SEL[k].delete(i):SEL[k].add(i)});paint()};h.appendChild(b);if((DL.no_top_btn||[]).indexOf(k)<0){var d=document.createElement('button');d.type='button';d.className='lbtn adtop off';d.dataset.ad=k;d.setAttribute('aria-disabled','true');d.onclick=function(){ask(k)};h.appendChild(d)}}
  if(!l.dataset.adw){l.dataset.adw=1;l.addEventListener('click',function(e){var cb=e.target.closest('.adcb');if(!cb)return;e.preventDefault();e.stopPropagation();var id=cb.parentNode.dataset.ad;selk(k);SEL[k].has(id)?SEL[k].delete(id):SEL[k].add(id);paint()},true)}});
 loadCr();paint()}
function ua(k){return (DL.unselect_any||{})[k]||''}  /* «Снять выбор» при любом выборе (21.10, «Оценка») */
function nq(i){return i.indexOf('q:')!==0}  /* «Выбрать все» — только готовые отчёты, не запросы в работе */
function selk(k){if(mode&&mode!==k)SEL[mode].clear();mode=k}
function allIds(k){var o=[];LS(k).forEach(function(l){[].forEach.call(l.querySelectorAll('.lot[data-ad]:not(.adgone)'),function(c){o.push(c.dataset.ad)})});return o}
function stop(){Object.keys(SEL).forEach(function(k){SEL[k].clear()});mode=null;paint()}
function paint(){var now=Date.now(),D=RET.retention_days*864e5;
 Object.keys(L).forEach(function(k){var l=$(L[k].list);if(!l)return;
  var ids=new Set(allIds(k));
  var NP=(DL.no_select_pend||[]).indexOf(k)>=0,xl=XL[k]&&$(XL[k]),cs=[].slice.call(l.querySelectorAll('.lot'));if(xl)cs=cs.concat([].slice.call(xl.querySelectorAll('.lot.prqi[data-prqopen]')));
  cs.forEach(function(c){var px=c.classList.contains('prqi'),eq=k=='eval'&&c.getAttribute('data-eq'),pd=!px&&c.classList.contains('pend')&&!eq,id=px?'q:'+c.getAttribute('data-prqopen'):eq?'e:'+eq:pd?(PQ[k]&&c.getAttribute('data-'+PQ[k])?'q:'+c.getAttribute('data-'+PQ[k]):''):c.getAttribute('data-'+L[k].attr);if(!id)return;
   if(pd&&NP){var ob=c.querySelector(':scope>.adcb');if(ob)ob.remove();if(c.dataset.ad)delete c.dataset.ad;SEL[k].delete(id);c.title=DL.pend_busy_title||'';return}   /* 29.10 (QA, п.3): запрос «В работе» в Финанализе не выбирается */
   if(gone(k,id)){c.classList.add('adgone');return}if(c.classList.contains('adgone'))c.classList.remove('adgone');ids.add(id);
   c.dataset.ad=id;var cb=c.querySelector(':scope>.adcb');if(!cb){cb=document.createElement('span');cb.className='adcb';cb.setAttribute('role','checkbox');cb.title=pd?DL.pend_title:DL.item_title;c.insertBefore(cb,c.firstChild)}if(!px){cbTop(k,c,cb);bodyL(k,c)}
   var on=SEL[k].has(id);if(cb.classList.contains('on')!==on)cb.classList.toggle('on',on);if(cb.getAttribute('aria-checked')!=String(on))cb.setAttribute('aria-checked',String(on));if(!cb.hasAttribute('tabindex'))cb.setAttribute('tabindex','0');if(pd||px)return;   /* 29.10 (QA, п.3): отметка (класс on + aria-checked) — и у строк «в обработке» */
   var t=created(k,id),d1=c.querySelector('.d1');if(t&&d1){var u=t+D,txt=RET.item_line.replace('{until}',msk(u)),r=c.querySelector('.adret'),soon=u-now<RET.soon_hours*36e5;
    if(!r||r.dataset.t!=txt||r.classList.contains('soon')!==soon){if(!r){r=document.createElement('div');r.className='adret';d1.insertAdjacentElement('afterend',r)}r.dataset.t=txt;r.className='adret'+(soon?' soon':'');r.title=(RET.item_title||'').replace('{until}',msk(u));r.innerHTML=CK+'<span>'+E(txt)+'</span>'}}});
  SEL[k].forEach(function(i){if(!ids.has(i))SEL[k].delete(i)});
  var nt=l.previousElementSibling;if(RET.list_note&&ids.size&&!(nt&&nt.classList.contains('adnote'))){var p=document.createElement('p');p.className='adnote';p.textContent=RET.list_note.replace('{days}',RET.retention_days);l.parentNode.insertBefore(p,l)}
  var b=document.querySelector('.adall[data-ad="'+k+'"]');if(b){var rd=[...ids].filter(nq),all=rd.length&&rd.every(function(i){return SEL[k].has(i)});var tx=ua(k)&&mode===k&&SEL[k].size?ua(k):all?DL.unselect_all:DL.select_all;if(b.textContent!=tx)b.textContent=tx;b.disabled=!rd.length}
  var d=document.querySelector('.adtop[data-ad="'+k+'"]');if(d){var c=mode===k?SEL[k].size:0,lb=DL.icon+' '+(c?F(DL.btn_n,{n:c}):DL.btn),ti=c?F(DL.hint_n,{n:c}):DL.hint_empty;if(d.dataset.lb!=lb){d.dataset.lb=lb;d.innerHTML='<span class="adi">'+E(DL.icon)+'</span>'+E(c?F(DL.btn_n,{n:c}):DL.btn)}d.classList.toggle('on',!!c);d.classList.toggle('off',!c);if(d.getAttribute('aria-disabled')!=String(!c))d.setAttribute('aria-disabled',String(!c));if(d.title!=ti){d.title=ti;d.setAttribute('aria-label',ti)}
   var h=d.parentNode;if(h&&!h.dataset.adbg){var e=h.parentNode;while(e&&e!==document.documentElement){var bg=getComputedStyle(e).backgroundColor;if(bg&&bg!='transparent'&&!/rgba\([^)]*,\s*0\)$/.test(bg))break;e=e.parentNode}h.style.background=e&&e!==document.documentElement?getComputedStyle(e).backgroundColor:getComputedStyle(document.body).backgroundColor;h.dataset.adbg=1}}});
 var hd=document.querySelector('header'),ht=hd&&/sticky|fixed/.test(getComputedStyle(hd).position)?Math.round(hd.getBoundingClientRect().height):0;if(document.documentElement.style.getPropertyValue('--adtop')!=ht+'px')document.documentElement.style.setProperty('--adtop',ht+'px');
 var n=mode?SEL[mode].size:0,bar=$('adbar');if(bar){var vis=n&&LS(mode).some(function(x){return x.offsetParent!==null});bar.style.display=vis?'flex':'none';if(vis)barAlign(bar,mode);document.body.classList.toggle('adon-any',!!vis);var bp=!!vis&&(DL.bar_pad||[]).indexOf(mode)>=0,lf=!!vis&&((DL.bar||{}).lift||{}).sections&&DL.bar.lift.sections.indexOf(mode)>=0;document.body.classList.toggle('adon-pad',bp);document.body.classList.toggle('adon-lift',!!lf);if(bp||lf){var bh=Math.ceil(bar.getBoundingClientRect().height)+'px';if(document.documentElement.style.getPropertyValue('--adbar-h')!==bh)document.documentElement.style.setProperty('--adbar-h',bh)}$('adn').textContent=F(DL.bar_count,{n:n});$('adcan').textContent=DL.bar_clear;$('addel').disabled=!n;$('addt').textContent=n?F(DL.btn_n,{n:n}):DL.btn;if($('addlg')&&$('addlg').open&&!n)$('addlg').close()}}
function ask(k){if(typeof k!='string')k=mode;if(!k||mode!==k||!SEL[k].size){toast(DL.hint_empty,3000);return}if(!ok()){toast(DL.login,4000);return}if(k=='eval'&&window.EVAL_BULK){var kk=k;EVAL_BULK.ask(Array.from(SEL[k]),function(old){return quiet(kk,old)},function(done){done.forEach(function(i){SEL[kk].delete(i)});if(!SEL[kk].size&&mode===kk)mode=null;paint()});return}
 var n=SEL[mode].size,ids=Array.from(SEL[mode]),d=$('addlg'),m=+DL.list_max||3,nm=rows(mode,ids).map(rowName).filter(Boolean),more=nm.length-m;
 $('adq').textContent=F(DL.confirm,{reports:pl(n),n:n});$('adtx').textContent=F(fi(n)==0?DL.confirm_text:DL.confirm_text_many,{reports:cap(pl(n)),n:n});
 $('adln').textContent=nm.slice(0,m).join('\n')+(more>0?'\n'+F(DL.list_more,{n:pl(more)}):'');
 d.classList.toggle('sheet',innerWidth<=(+DL.sheet_max_px||699));$('aderr').style.display='none';$('adm').textContent='';$('adyes').disabled=false;$('adno').disabled=false;$('adyes').textContent=DL.confirm_yes;if(!d.open)d.showModal();$('adno').focus()}
/* название строки для списка в окне: первая строка заголовка карточки (.d1) */
function rowName(c){var e=c.querySelector('.d1');return e?e.textContent.replace(/\s+/g,' ').trim():''}
function fi(n){var a=n%10,b=n%100;return a==1&&b!=11?0:a>=2&&a<=4&&(b<12||b>14)?1:2}
function cap(s){s=String(s);return s.charAt(0).toUpperCase()+s.slice(1)}
async function gh(path,o){o=o||{};var r=await fetch('https://api.github.com/repos/'+REPO+'/'+path,Object.assign({},o,{headers:{Authorization:'Bearer '+clean(TOKEN),Accept:'application/vnd.github+json','Content-Type':'application/json'},cache:'no-store'}));
 if(!r.ok){var t='';try{t=(await r.json()).message||''}catch(e){}var er=new Error('GitHub '+r.status+(t?': '+t:''));er.status=r.status;throw er}return r.json()}
function btoast(msg,ok){var t=$('adtoast');if(!t){t=document.createElement('div');t.id='adtoast';t.setAttribute('role','status');document.body.appendChild(t)}t.className=ok?'ok':'';t.textContent=msg;t.style.display='block';clearTimeout(t._h);t._h=setTimeout(function(){t.style.display='none'},ok?4000:3500)}
/* что скрыть: сам отчёт + id его запроса (чтобы запрос не вернулся строкой «в обработке») */
function reqOf(k,id){try{var e=k=='prc'?(typeof PRIDX!='undefined'?PRIDX:{})[id]:k=='fin'?(typeof FIN!='undefined'?FIN:{})[id]:(window.EVAL_IDX?EVAL_IDX():{})[id];return e&&e.request_id||''}catch(x){return ''}}
function items(k,ids){var at=new Date().toISOString(),o=[];ids.forEach(function(id){if(id.indexOf('q:')===0){o.push({k:'req',id:id.slice(2),at:at});return}o.push({k:k,id:id,at:at});var r=reqOf(k,id);if(r)o.push({k:'req',id:r,at:at,of:k})});return o}
function gone(k,id){var H=window.ArbHide;if(!H||id.indexOf('e:')===0)return false;return id.indexOf('q:')===0?H.req(id.slice(2)):H.hidden(k,id,reqOf(k,id))}
function rows(k,ids){var S=new Set(ids),o=[];LS(k).forEach(function(l){[].forEach.call(l.querySelectorAll('.lot[data-ad]'),function(c){if(S.has(c.dataset.ad))o.push(c)})});return o}
function refilter(k){try{if(k=='eval'){window.EVAL_REFILTER&&EVAL_REFILTER()}else if(window.__arbRefilter)__arbRefilter()}catch(e){}try{if(k=='prc'&&window.ArbPRQ&&ArbPRQ.draw)ArbPRQ.draw()}catch(e){}paint()}
var LAST=null;
function strip(id,show){var e=$(id);if(e)e.style.display=show?'flex':'none'}
async function go(){if(busy||!mode||!SEL[mode].size)return;if(!ok()){$('addlg').close();btoast(DL.login);return}
 var k=mode,ids=Array.from(SEL[mode]);$('addlg').close();await run(k,ids)}
async function run(k,ids){if(busy||!window.ArbHide)return;busy=true;strip('aderr',false);strip('adundo',false);
 var it=items(k,ids),n=ids.length,rw=rows(k,ids),ms=DL.delete_undo?(+DL.undo_anim_ms||0):0;LAST={k:k,ids:ids,it:it};
 if(ms){document.documentElement.style.setProperty('--adms',ms+'ms');rw.forEach(function(c){c.classList.add('adfade')});await new Promise(function(r){setTimeout(r,ms)})}
 ArbHide.addLocal(it);rw.forEach(function(c){c.classList.remove('adfade');c.classList.add('adgone')});SEL[k].clear();mode=null;refilter(k);   /* сразу: строки и счётчики */
 try{await ArbHide.push(it,null,F(DL.commit_msg,{n:pl(n)}));
  if(DL.delete_undo){$('adut').textContent=F(DL.undo_text,{n:pl(n)});strip('adundo',true);clearTimeout(run._u);run._u=setTimeout(function(){strip('adundo',false)},(+DL.undo_s||6)*1000)}
  else btoast(F(DL.ok,{n:pl(n)}),true)}
 catch(e){ArbHide.removeLocal(it);rw.forEach(function(c){c.classList.remove('adgone','adfade')});SEL[k]=new Set(ids);mode=k;
  var m=e.status==403||e.status==404?DL.err_rights:'';$('adet').textContent=DL.err+(m?': '+m:'')+(DL.err_sep||'');strip('aderr',true);
  try{await L[k].reload()}catch(x){}}
 finally{busy=false;paint()}}
async function quiet(k,ids){if(!window.ArbHide)throw new Error('ArbHide');var it=items(k,ids),rw=rows(k,ids);ArbHide.addLocal(it);rw.forEach(function(c){c.classList.add('adgone')});refilter(k);
 try{await ArbHide.push(it,null,F(DL.commit_msg,{n:pl(ids.length)}))}catch(e){ArbHide.removeLocal(it);rw.forEach(function(c){c.classList.remove('adgone')});try{await L[k].reload()}catch(x){}throw e}finally{paint()}}
function retry(){strip('aderr',false);if(LAST)run(LAST.k,LAST.ids)}
async function undo(){if(!LAST||busy)return;strip('adundo',false);clearTimeout(run._u);var L0=LAST;busy=true;
 try{ArbHide.removeLocal(L0.it);await ArbHide.push(null,L0.it,F(DL.commit_undo_msg,{n:pl(L0.ids.length)}))}
 catch(e){ArbHide.addLocal(L0.it);$('adet').textContent=DL.err;strip('aderr',true)}
 finally{busy=false;try{await L[L0.k].reload()}catch(x){}paint()}}
function tick(){setup()}document.addEventListener('click',function(e){if(e.target.closest('nav button'))setTimeout(paint,50)});
var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(tick,80)}).observe(document.body,{childList:true,subtree:true});
addEventListener('load',tick);addEventListener('resize',function(){paint()});setTimeout(tick,500);
})();
