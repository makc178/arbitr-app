window.ARB_DATES_CFG={"enabled": true, "skip_selector": ".ddnat,[data-date],[data-nodm]", "inputs": {"fbd": {"key": "ДАТА_ПРИНЯТИЯ_ЗАЯВЛЕНИЯ"}, "fid": {"key": "ДАТА_ПРИЗНАКОВ_БАНКРОТСТВА", "today": false}, "ffd0": {"today": false, "label": "с даты"}, "fd0": {"today": false, "label": "с даты"}, "prp0": {"today": false, "label": "период с"}, "prp1": {"label": "период по"}, "d0": {"today": false}, "a0": {"today": false}, "dad": {}}};
/* Arbitr App · даты ДД.ММ.ГГГГ во всём приложении, независимо от языка браузера.
   Оставшиеся нативные <input type=date> (шаблон Эверест: Финанализ, Судебная практика; Оценка; архив; формы модулей, в т.ч. модулей ЮК — их файлы не меняются)
   оборачиваются снаружи общим компонентом даты «Документов» (dateInp: маска, проверка реальной даты, календарь с понедельника, «Сегодня» по правилам).
   Исходное поле остаётся в DOM скрытым и хранит ISO ГГГГ-ММ-ДД: код, читающий .value, работает как раньше; запись .value из кода отображается в поле.
   Настройки — config/date_inputs.json → window.ARB_DATES_CFG. */
window.ArbDates=(function(){
'use strict';
var CF=window.ARB_DATES_CFG||{},IN=CF.inputs||{},SK=CF.skip_selector||'.ddnat,[data-date],[data-nodm]',N=0;
var VD=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
function dmyOk(v){var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(v);if(!m)return false;var d=new Date(+m[3],+m[2]-1,+m[1]);return d.getFullYear()==+m[3]&&d.getMonth()==+m[2]-1&&d.getDate()==+m[1]}
function toDMY(v){var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(String(v||'').trim());return m?m[3]+'.'+m[2]+'.'+m[1]:''}
function toISO(v){var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(String(v||'').trim());return m&&dmyOk(v)?m[3]+'-'+m[2]+'-'+m[1]:''}
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function dateInp(){var q=window.ArbCP&&ArbCP.qapi&&ArbCP.qapi(),a=q&&q.A;return a&&a.dateInp?a.dateInp:null}
function today(o){var c=IN[o.id]||{};if(c.today===true||c.today===false)return c.today;if(window.ArbDFX&&ArbDFX.today)return ArbDFX.today(c.key||null);return true}
function lbl(o){var c=IN[o.id]||{};if(c.label)return c.label;if(o.getAttribute('aria-label'))return o.getAttribute('aria-label');if(o.title)return o.title;
 if(o.id){var l=document.querySelector('label[for="'+o.id+'"]');if(l)return l.textContent.trim()}var p=o.previousElementSibling;if(p&&p.tagName=='LABEL')return p.textContent.trim();
 var w=o.closest('.two,div');p=w&&w.previousElementSibling;return p&&p.tagName=='LABEL'?p.textContent.trim():''}
function show(o){var t=o.__dmT;if(!t)return;var v=toDMY(VD.get.call(o));if(t.value!==v&&!(document.activeElement===t&&!v&&t.value)){VD.set.call(t,v)}var w=t.closest('.ddate'),b=w&&w.querySelector('.ddbad');t.classList.remove('dbad');t.setAttribute('aria-invalid','false');if(b)b.hidden=true}
function wrap(o){var mk=dateInp();if(!mk||o.__dmT)return false;
 var id='dm'+(++N),L=lbl(o),h=mk(' id="'+id+'" data-dmof="'+E(o.id||'')+'"'+(L?' aria-label="'+E(L)+'"':'')+(o.title?' title="'+E(o.title)+'"':'')+(o.disabled?' disabled':''),toDMY(VD.get.call(o)),'');
 var box=document.createElement('span');box.innerHTML=h;var w=box.firstElementChild;if(!w)return false;w.classList.add('dmw');
 if(!today(o)){var tb=w.querySelector('.ddtoday');if(tb)tb.remove()}
 o.parentNode.insertBefore(w,o.nextSibling);o.classList.add('dmsrc');o.setAttribute('tabindex','-1');o.setAttribute('aria-hidden','true');
 var t=w.querySelector('input[data-date]');o.__dmT=t;t.__dmSrc=o;if(o.required){o.required=false;t.required=true}
 /* запись .value из кода → в видимое поле */
 Object.defineProperty(o,'value',{configurable:true,get:function(){return VD.get.call(o)},set:function(v){VD.set.call(o,v);show(o)}});
 var sync=function(){var iso=toISO(t.value);if(VD.get.call(o)===iso)return;VD.set.call(o,iso);o.dispatchEvent(new Event('input',{bubbles:true}));o.dispatchEvent(new Event('change',{bubbles:true}))};
 t.addEventListener('input',sync);t.addEventListener('change',sync);
 var f=o.form;if(f&&!f.__dmR){f.__dmR=1;f.addEventListener('reset',function(){setTimeout(function(){[].forEach.call(f.querySelectorAll('input.dmsrc'),show)},0)})}
 return true}
function scan(root){if(CF.enabled===false||!dateInp())return;[].forEach.call((root||document).querySelectorAll('input[type=date]:not(.dmsrc)'),function(o){if(o.matches(SK))return;wrap(o)})}
var T=null;function soon(){if(T)return;T=setTimeout(function(){T=null;scan()},30)}
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var a=ms[i].addedNodes;for(var j=0;j<a.length;j++){var n=a[j];if(n.nodeType==1&&(n.matches&&n.matches('input[type=date]')||n.querySelector&&n.querySelector('input[type=date]:not(.dmsrc)'))){soon();return}}}}).observe(document.documentElement,{childList:true,subtree:true});
var tries=0,iv=setInterval(function(){scan();if(dateInp()&&++tries>3)clearInterval(iv)},250);
return {scan:scan,toISO:toISO,toDMY:toDMY,ok:dmyOk}})();
