window.ARB_UPDLOG_UI={"title": "Обновления: что изменилось в приложении за последние {days} дн.", "aria_label": "Обновления приложения за последние {days} дн.", "tooltip": "Обновления — что нового за {days} дн.", "days_default": 7, "content_pad_bottom_px": 88, "content_pad_max_width_px": 0, "updlog_in_header": false, "hide_on_form": {"enabled": true, "bp": 700, "views": ["ai", "eval", "prc", "fin", "docs"], "overlays": [".apx.apxc"], "body_class": "arb-fab-form"}};
/* Подписи кнопки «Обновления» (общий модуль updlog.js) по config/pin_v2.json → updlog_button: title, aria-label, подсказка при наведении на ПК. Модуль updlog.js не меняется. */
(function(){var C=window.ARB_UPDLOG_UI||{};
 /* 21.10: на узком экране (ниже hide_on_form.bp) круглая кнопка «Обновления» скрыта на экранах с формой ввода (views — data-v разделов) и при открытой модальной форме (overlays),
    чтобы не закрывать кнопку отправки; на списках и шире bp — видна. Только после входа (body.arb-in). Значения — config/layout.json → updates_fab.hide_on_form.
    Правила с :has() — в отдельном <style>: браузер без :has() отбрасывает правило целиком, поэтому запасной вариант (класс на body, ставится JS при смене экрана) — отдельно. */
 (function(){var H=C.hide_on_form;if(!H||H.enabled===false||!(+H.bp>0))return;
  var V=(H.views||[]).filter(function(v){return /^[\w-]+$/.test(v)}),O=(H.overlays||[]).filter(Boolean),K=/^[\w-]+$/.test(H.body_class||'')?H.body_class:'arb-fab-form',
      MQ='@media (max-width:'+(+H.bp-0.02)+'px){',B=' #updlog-btn.updlog-fixed',T='{display:none!important}}';
  var sel=V.map(function(v){return 'nav button.on[data-v="'+v+'"]'}).concat(O);if(!sel.length)return;
  var s1=document.createElement('style');s1.id='arb-fabhide-has';s1.textContent=MQ+sel.map(function(x){return 'body.arb-in:has('+x+')'+B}).join(',')+T;
  var s2=document.createElement('style');s2.id='arb-fabhide-cls';s2.textContent=MQ+'body.arb-in.'+K+B+T;
  document.head.appendChild(s1);document.head.appendChild(s2);
  function vis(e){return !!e&&!e.hidden&&getComputedStyle(e).display!=='none'}
  function sync(){var b=document.body;if(!b)return;var on=document.querySelector('nav button.on'),f=!!on&&V.indexOf(on.dataset.v)>=0;
   for(var i=0;!f&&i<O.length;i++){try{f=vis(document.querySelector(O[i]))}catch(e){}}
   if(b.classList.contains(K)!==f)b.classList.toggle(K,f)}
  var tm=0;function later(){clearTimeout(tm);tm=setTimeout(sync,0)}
  document.addEventListener('click',later,true);addEventListener('resize',later);addEventListener('hashchange',later);
  function obs(){sync();if(!window.MutationObserver)return;var n=document.querySelector('nav');
   if(n)new MutationObserver(later).observe(n,{subtree:true,attributes:true,attributeFilter:['class']});
   if(O.length)new MutationObserver(later).observe(document.body,{childList:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',obs);else obs();setInterval(sync,700)})();
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
