window.ARB_UPDLOG_UI={"title": "Обновления: что изменилось в приложении за последние {days} дн.", "aria_label": "Обновления приложения за последние {days} дн.", "tooltip": "Обновления — что нового за {days} дн.", "days_default": 7, "content_pad_bottom_px": 88, "content_pad_max_width_px": 0, "updlog_in_header": false};
/* Подписи кнопки «Обновления» (общий модуль updlog.js) по config/pin_v2.json → updlog_button: title, aria-label, подсказка при наведении на ПК. Модуль updlog.js не меняется. */
(function(){var C=window.ARB_UPDLOG_UI||{};
 /* после входа: запас снизу на телефоне (content_pad_bottom_px) или, по флагу updlog_in_header (выкл.), кнопка в шапке рядом с ⟳ */
 (function(){var px=+C.content_pad_bottom_px||0,mw=+C.content_pad_max_width_px||0,hdr=C.updlog_in_header===true,s=document.createElement('style');
  s.textContent=(px&&!hdr?(mw?'@media (max-width:'+mw+'px){':'')+'body.arb-in{padding-bottom:'+px+'px!important}'+(mw?'}':''):'')+'#updlog-btn.arb-hdr{position:absolute!important;right:auto!important;bottom:auto!important;margin:0!important;box-shadow:none!important}';document.head.appendChild(s);
  function st(){var p=document.getElementById('pin'),on=!p||getComputedStyle(p).display=='none';document.body&&document.body.classList.toggle('arb-in',on);
   if(hdr){var b=document.getElementById('updlog-btn'),r=document.getElementById('rfb');if(b&&r){if(b.nextElementSibling!==r){r.parentNode.insertBefore(b,r);b.classList.add('arb-hdr')}var rp=getComputedStyle(r).position,bw=b.offsetWidth,bh=b.offsetHeight;if(rp!='static'){b.style.setProperty('top',(r.offsetTop+(r.offsetHeight-bh)/2)+'px','important');b.style.setProperty('left',(r.offsetLeft-bw-8)+'px','important')}}}}
  st();setInterval(st,700)})();
 if(!C.title)return;
 function days(){try{return (window.UPDLOG_DATA&&window.UPDLOG_DATA.retention_days)||C.days_default||7}catch(e){return C.days_default||7}}
 function t(s){return String(s||'').replace('{days}',days())}
 var st=document.createElement('style');st.textContent='@media (hover:hover) and (pointer:fine){#updlog-btn.arb-tipped:hover::after,#updlog-btn.arb-tipped:focus-visible::after{content:attr(data-tip);position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);white-space:nowrap;padding:7px 10px;border-radius:8px;background:#E6F4F1;color:#0B2A24;font:12.5px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3);pointer-events:none;z-index:1}}';document.head.appendChild(st);
 var fine=matchMedia('(hover:hover) and (pointer:fine)');
 function fix(b){if(!b||b.dataset.arbLbl)return;b.dataset.arbLbl='1';b.setAttribute('aria-label',t(C.aria_label));b.title=t(C.title);b.setAttribute('data-tip',t(C.tooltip));b.classList.add('arb-tipped');
  if(getComputedStyle(b).position==='static')b.style.position='relative';
  /* на ПК своя подсказка вместо системной: title на время наведения снимается, чтобы не было двух подсказок */
  b.addEventListener('mouseenter',function(){if(fine.matches&&b.title){b.dataset.arbT=b.title;b.removeAttribute('title')}});
  b.addEventListener('mouseleave',function(){if(b.dataset.arbT){b.title=b.dataset.arbT;delete b.dataset.arbT}})}
 function scan(){fix(document.getElementById('updlog-btn'))}
 scan();new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
