window.ARB_LOCK_CFG={"enabled": true, "size_px": 36, "size_px_mobile": 40, "mobile_below_w": 700, "mobile_right_px": 56, "mobile_top_px": 10, "gap_px": 8, "placement": "header", "header_top_px": 12, "header_right_px": 56, "gap_to_refresh_px": 8, "max_attempts_before_pause": 3, "texts": {"tip_locked": "Открыть скрытые данные (PIN)", "tip_open": "Скрытые данные открыты", "aria_locked": "Открыть скрытые данные: ввести PIN", "aria_open": "Скрытые данные открыты. Меню блокировки", "t_enter": "PIN приложения", "sub": "После входа откроется окно PIN скрытых данных", "wait": "Проверка…", "wrong": "Неверный PIN", "left": "Осталось попыток: {n}", "blocked": "Слишком много попыток. Повторите через {s} с", "no_crypto": "Браузер не поддерживает проверку PIN", "cancel": "Отмена", "backspace": "Стереть последнюю цифру", "ok": "PIN приложения принят", "menu_lock": "Заблокировать", "menu_lock_hint": "Бланки, подписи и карточки граждан снова скрыты", "menu_icon_tip": "Раздел под PIN", "tip_unset": "PIN скрытых данных не задан", "tip_nomain": "Скрытые данные: сначала вход по PIN приложения", "aria_unset": "PIN скрытых данных не задан. Подробнее", "aria_nomain": "Скрытые данные закрыты. Подробнее", "menu_main": "Ввести PIN приложения", "info_nomain": "Скрытые данные (бланки, подписи, карточки граждан) открываются PIN скрытых данных — после входа по PIN приложения.", "info_unset": "PIN скрытых данных не задан. Задать: «Документы» → карточка управляющего → «Скрыть бланки и подписи под PIN»."}, "menu_icons": {"enabled": false, "sections": ["docs", "cp", "arch", "ai"]}, "auto_lock": {"enabled": false, "idle_min": 15, "check_s": 30}, "main_pin_fallback": true, "chain_after_main": true};
/* Arbitr App — кнопка с замком (18.10, config/pin_lock.json → window.ARB_LOCK_CFG).
   С 18.10 16:28 (команда пользователя) замок привязан к PIN скрытых данных — PIN раздела «Служебные материалы» (ArbUAL, docs_ualock.js):
   бланки, подписи и карточки граждан. Закрыт → существующее окно PIN раздела (солёный PBKDF2-хеш в arbitr/ua/lock.enc), данные открываются на месте;
   открыт → меню «Заблокировать» (ArbUAL.lock — снова скрыты, без перезагрузки). Состояние замка = состояние ArbUAL.
   Пока не было входа по PIN приложения, скрытые данные открыть нельзя (внешний слой — основной PIN): в меню — «Ввести PIN приложения» (окно ниже).
   Прежнее описание (окно основного PIN):
   · Закрыт (основной PIN в этой сессии не вводился, напр. «Вход по ключу») → окно PIN поверх текущего раздела, без перехода.
   · Проверка — та же, что на странице PIN: unpin() расшифровывает PINBLOB (PBKDF2 → AES-GCM). Затем тот же крючок window.__arbPin(pin):
     docs.js (карточки АУ, бланки, архив, дела), agent.js (ключ пользователя «ИИ Агента»). Новой криптографии нет, PIN нигде не сохраняется и не выводится.
   · Неверные попытки и пауза — общий счётчик со страницей PIN (localStorage cr.pinfail / cr.pinwait, та же формула паузы 5→300 с).
   · Открыт → меню «Заблокировать» (перезагрузка на страницу PIN — все ключи в памяти стираются) и, если задан PIN раздела «Бланки и подписи», пункт для его ввода.
   · Значки на кнопках разделов и автоблокировка — за флагами menu_icons.enabled / auto_lock.enabled (по умолчанию выкл.). */
(function(){
 var C=window.ARB_LOCK_CFG||{};if(C.enabled===false)return;
 var X=C.texts||{},UNL=false,BTN=null,PADE=null,MENU=null,LAST=Date.now();
 var FK='cr.pinfail',FT='cr.pinwait';
 function t(k,o){var s=X[k]==null?k:String(X[k]);o=o||{};Object.keys(o).forEach(function(n){s=s.split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function lg(k){try{return localStorage.getItem(k)}catch(e){return null}}function ls(k,v){try{localStorage.setItem(k,v)}catch(e){}}function ld(k){try{localStorage.removeItem(k)}catch(e){}}
 function wait(){return Math.max(0,(+lg(FT)||0)-Date.now())}
 var SV='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
 var IC={lock:SV+'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2.5"/></svg>',
  open:SV+'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/><path d="M12 14.5v2.5"/></svg>',
  mini:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>'};
 function unlocked(){return UNL||!!(window.ArbArch&&ArbArch.locked&&!ArbArch.locked())}
 function ual(){try{return window.ArbUAL&&ArbUAL.state?ArbUAL.state():'none'}catch(e){return 'none'}}
 /* состояние замка: open — скрытые данные открыты; locked — PIN скрытых данных задан, не введён; unset — вход по PIN был, PIN скрытых данных не задан; nomain — не было входа по PIN приложения */
 function lst(){var u=ual();if(u=='open')return 'open';if(u=='locked')return 'locked';return unlocked()?'unset':'nomain'}
 /* учёт входа по PIN: обёртка над общим крючком (docs.js/agent.js уже повесили свои — вызываются как раньше) */
 var prev=window.__arbPin;window.__arbPin=function(pin){UNL=true;LAST=Date.now();setTimeout(draw,0);if(typeof prev=='function')return prev.apply(this,arguments)};
 function mob(){return innerWidth<(+C.mobile_below_w||700)}
 function hdr(){return (C.placement||'nav')==='header'}
 /* 21.10: placement=header — кнопка в шапке слева от ⟳ на всех ширинах (по ⟳: зазор gap_to_refresh_px, центр по вертикали); placement=nav — прежнее место на ПК */
 function mount(){var nav=document.querySelector('header>.page.pnav>nav'),hd=document.querySelector('header');if(!nav||!hd)return false;
  if(!BTN){BTN=document.createElement('button');BTN.type='button';BTN.id='arblk';BTN.className='arblk';BTN.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var q=lst();if(q=='locked'&&typeof ArbUAL.open=='function'){closeMenu();ArbUAL.open()}else menu()})}
  var m=mob(),top=m||hdr(),host=top?hd:nav.parentNode;if(BTN.parentNode!==host||(!top&&BTN.previousElementSibling!==nav)){if(top)hd.appendChild(BTN);else nav.parentNode.insertBefore(BTN,nav.nextSibling)}
  BTN.classList.toggle('m',m);BTN.classList.toggle('hd',top);var sz=(m?+C.size_px_mobile:+C.size_px)||36;BTN.style.setProperty('--lk-sz',sz+'px');
  var r=m?(+C.mobile_right_px||56):(+C.header_right_px||56),tp=m?(+C.mobile_top_px||10):(+C.header_top_px||12),rf=document.getElementById('rfb');
  var rfOk=!!(top&&rf&&rf.offsetParent!==null&&rf.offsetWidth);
  if(rfOk){var hr=hd.getBoundingClientRect(),fr=rf.getBoundingClientRect(),g=C.gap_to_refresh_px!=null?+C.gap_to_refresh_px:(+C.gap_px||8);r=Math.round(hr.right-fr.left+g);tp=Math.round(fr.top-hr.top+(fr.height-sz)/2)}
  BTN.style.setProperty('--lk-r',r+'px');/* 21.10 (QA Дизайнера, п.1): без ⟳ запасной top — с отступом выреза iPhone */BTN.style.setProperty('--lk-t',rfOk?tp+'px':'calc(env(safe-area-inset-top,0px) + '+tp+'px)');BTN.style.setProperty('--lk-gap',(+C.gap_px||8)+'px');
  nav.parentNode.classList.toggle('arblk-host',!top);var fb=nav.querySelector('button:not(.hid)');if(fb&&fb.offsetHeight)BTN.style.setProperty('--navb-h',fb.offsetHeight+'px');return true}
 var DS='';function draw(){if(!mount())return;var q=lst(),u=q=='open',k=q+':'+(mob()?1:0);icons(u);if(k===DS&&BTN.firstChild)return;DS=k;BTN.classList.toggle('on',u);BTN.classList.toggle('unset',q=='unset');BTN.innerHTML=u||q=='unset'?IC.open:IC.lock;BTN.title=t('tip_'+q);BTN.setAttribute('aria-label',t('aria_'+q));BTN.setAttribute('aria-haspopup',q=='locked'?'dialog':'menu');BTN.dataset.state=q}
 function icons(u){var M=C.menu_icons||{},on=M.enabled===true&&!u;(M.sections||[]).forEach(function(v){var b=document.querySelector('header nav button[data-v="'+v+'"]');if(!b)return;var i=b.querySelector('.arblk-mi');if(on&&!i){i=document.createElement('span');i.className='arblk-mi';i.title=t('menu_icon_tip');i.innerHTML=IC.mini;b.appendChild(i)}else if(!on&&i)i.remove()})}
 /* ---------- окно PIN (разметка и стили — как у окна PIN раздела, .dualm) ---------- */
 function pad(){if(PADE||document.querySelector('.dualm'))return;closeMenu();var v='',busy=false;
  var el=document.createElement('div');el.className='dualm arblk-m';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','arblkt');PADE=el;
  var keys=[1,2,3,4,5,6,7,8,9,'',0,'⌫'];
  el.innerHTML='<div class="dualbox"><div class="arblk-hi">'+IC.lock+'</div><b class="dualt" id="arblkt">'+E(t('t_enter'))+'</b>'+(X.sub?'<p class="sm dualsub">'+E(t('sub'))+'</p>':'')+
   '<div class="dualdots" aria-live="polite">'+[0,1,2,3].map(function(){return '<i></i>'}).join('')+'</div><p class="dualmsg" role="status"></p><div class="dualkeys">'+
   keys.map(function(k){return k===''?'<span></span>':'<button type="button" data-k="'+k+'"'+(k==='⌫'?' aria-label="'+E(t('backspace'))+'"':'')+'>'+k+'</button>'}).join('')+'</div><button type="button" class="lbtn sec" data-k="x">'+E(t('cancel'))+'</button></div>';
  var D=el.querySelector('.dualdots'),M=el.querySelector('.dualmsg'),KB=el.querySelectorAll('.dualkeys button'),tk=null,blk=false;
  function dots(){for(var i=0;i<4;i++)D.children[i].className=i<v.length?'on':''}
  function msg(s,err){M.textContent=s||'';M.className='dualmsg'+(err?' err arblk-err':'');M.setAttribute('role',err?'alert':'status')}
  function st(){var w=wait();for(var i=0;i<KB.length;i++)KB[i].disabled=!!w||busy;if(w){blk=true;msg(t('blocked',{s:Math.ceil(w/1000)}),1);clearTimeout(tk);tk=setTimeout(function(){if(PADE===el)st()},500)}else if(blk){blk=false;msg('')}}
  async function go(){busy=true;st();msg(t('wait'));var pin=v;v='';
   try{if(typeof unpin!='function'||!window.crypto||!crypto.subtle)throw new Error('nc');var tok=await unpin(pin);ld(FK);ld(FT);
    var had=typeof TOKEN!='undefined'&&!!TOKEN;try{if(typeof saveTok=='function')saveTok(tok)}catch(e){}
    try{window.__arbPin(pin)}finally{pin=null}
    if(!had){try{if(typeof sync=='function')sync()}catch(e){}}
    close();toast(t('ok'));chain()}
   catch(e){pin=null;busy=false;if(e&&e.message=='nc'){msg(t('no_crypto'),1);return}var n=(+lg(FK)||0)+1,mx=+C.max_attempts_before_pause||3;ls(FK,n);ls(FT,Date.now()+(n<mx?0:Math.min(300,Math.pow(2,n-2)*5))*1000);
    dots();D.classList.remove('shake');void D.offsetWidth;D.classList.add('shake');if(navigator.vibrate)try{navigator.vibrate(150)}catch(_){}
    msg(t('wrong')+(n<mx?'. '+t('left',{n:mx-n}):''),1);st()}}
  function press(k){if(busy||wait())return;if(k=='⌫'){v=v.slice(0,-1);dots();return}if(v.length<4&&/^\d$/.test(String(k))){if(M.classList.contains('err'))msg('');v+=k;dots();if(v.length==4)requestAnimationFrame(function(){setTimeout(go,0)})}}
  el.addEventListener('click',function(e){var b=e.target.closest('[data-k]');if(!b||b.disabled){if(e.target===el)close();return}e.preventDefault();if(b.dataset.k=='x'){close();return}press(b.dataset.k)});
  el._kd=function(e){if(PADE!==el)return;if(e.key=='Escape'){e.preventDefault();close();return}var k=e.key;if(/^Numpad\d$/.test(e.code)&&!/^\d$/.test(k))k=e.code.slice(6);
   if(/^\d$/.test(k)){e.preventDefault();e.stopPropagation();press(k)}else if(k=='Backspace'||k=='Delete'){e.preventDefault();e.stopPropagation();press('⌫')}};
  document.addEventListener('keydown',el._kd,true);el.tabIndex=-1;document.body.appendChild(el);dots();st();el.focus()}
 /* после входа по PIN приложения: если PIN скрытых данных задан — сразу его окно (флаг chain_after_main) */
 function chain(){if(C.chain_after_main===false)return;var n=0,iv=setInterval(function(){n++;var q=ual();if(q=='locked'&&window.ArbUAL&&typeof ArbUAL.open=='function'){clearInterval(iv);draw();ArbUAL.open()}else if(q=='open'||n>40){clearInterval(iv);draw()}},250)}
 function close(){if(!PADE)return;document.removeEventListener('keydown',PADE._kd,true);PADE.remove();PADE=null;if(BTN)try{BTN.focus({preventScroll:true})}catch(e){}}
 /* ---------- меню открытого замка ---------- */
 function menu(){if(MENU){closeMenu();return}var q=lst(),h='';
  if(q=='open')h='<button type="button" role="menuitem" data-lkm="lock">'+IC.lock+'<span>'+E(t('menu_lock'))+'<small>'+E(t('menu_lock_hint'))+'</small></span></button>';
  else if(q=='unset')h='<p class="arblk-info">'+E(t('info_unset'))+'</p>';
  else if(q=='nomain')h='<p class="arblk-info">'+E(t('info_nomain'))+'</p>'+(C.main_pin_fallback!==false?'<button type="button" role="menuitem" data-lkm="main">'+IC.lock+'<span>'+E(t('menu_main'))+'</span></button>':'');
  MENU=document.createElement('div');MENU.className='arblk-menu';MENU.setAttribute('role','menu');MENU.innerHTML=h;
  document.body.appendChild(MENU);var r=BTN.getBoundingClientRect(),w=MENU.offsetWidth;MENU.style.top=(r.bottom+6+scrollY)+'px';MENU.style.left=Math.max(8,Math.min(innerWidth-w-8,r.right-w))+'px';
  MENU.addEventListener('click',function(e){var b=e.target.closest('[data-lkm]');if(!b)return;var a=b.dataset.lkm;closeMenu();if(a=='lock')lockNow('manual');else if(a=='main')pad()});
  BTN.setAttribute('aria-expanded','true');var f=MENU.querySelector('button');if(f)f.focus();else{MENU.tabIndex=-1;MENU.focus()}}
 function closeMenu(){if(MENU){MENU.remove();MENU=null;if(BTN)BTN.setAttribute('aria-expanded','false')}}
 document.addEventListener('click',function(e){if(MENU&&!MENU.contains(e.target)&&e.target!==BTN)closeMenu()},true);
 document.addEventListener('keydown',function(e){if(MENU&&e.key=='Escape'){closeMenu();try{BTN.focus()}catch(_){}}});
 /* «Заблокировать»: скрытые данные снова скрыты (ArbUAL.lock стирает ключ раздела и расшифрованные бланки/подписи из памяти), без перезагрузки */
 function lockNow(why){try{if(window.ArbUAL)ArbUAL.lock(why)}catch(e){}window.__arbLockWhy=why;setTimeout(draw,300);setTimeout(draw,1500)}
 var AL=C.auto_lock||{};if(AL.enabled===true){['pointerdown','keydown','wheel','touchstart'].forEach(function(n){document.addEventListener(n,function(){LAST=Date.now()},{passive:true,capture:true})});
  setInterval(function(){if(ual()=='open'&&Date.now()-LAST>(+AL.idle_min||15)*60000)lockNow('idle')},(+AL.check_s||30)*1000)}
 function toast(m){try{var d=window.ArbCP&&ArbCP.qapi&&ArbCP.qapi().A;if(d&&d.toast){d.toast(m);return}}catch(e){}}
 var rt=null;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){draw();closeMenu()},120)});
 setInterval(draw,700);if(document.readyState!='loading')draw();else document.addEventListener('DOMContentLoaded',draw);
 window.ArbLock={state:lst,open:pad,lock:lockNow,_draw:draw};
})();
