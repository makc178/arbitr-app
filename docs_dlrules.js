/* Arbitr App — правила из index.json (1.7t), обобщённо для любых шаблонов:
   · templates[].field_when {ПОЛЕ: {условие}} — поле в форме показывается только при выполнении условия
     (ключи условия: procedure → ПРОЦЕДУРА, debtor_type → тип должника; прочие — имя поля; значение — строка или список);
   · templates[].field_print {ПОЛЕ:false} — не печатается (уже в docs.js noPrintF);
   · templates[].deadline_rules {id: {when, from_fields[], from_mode:first_filled, offset, unit, direction, fallback_flag, norm, action}} —
     срок-подсказка без поля-результата: от первого заполненного поля; если сработало не первое — «предварительно».
   Расчёт — общий dlCalc из docs.js (ст. 191–193 ГК, производственный календарь deadlines.calendar). Тексты — docs_config.json → deadlines.rules_ui.
   Крючок: docs.js dlDecorate → ArbDLR.d(t, ed, raw, dlCalc). */
(function(){
 function FL(){return window.ArbFlow}
 function C(){return (FL()&&FL().C())||{}}function X(){return (FL()&&FL().X())||{}}
 function K(){return (C().deadlines||{}).rules_ui||{}}
 function U(k,o){var s=K()[k];if(s==null)s=k;Object.keys(o||{}).forEach(function(x){s=String(s).split('{'+x+'}').join(o[x])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function lc(s){return String(s==null?'':s).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim()}
 function iso(v){v=String(v==null?'':v).trim();if(/^\d{2}\.\d{2}\.\d{4}$/.test(v))v=v.split('.').reverse().join('-');return /^\d{4}-\d\d-\d\d$/.test(v)?v:''}
 function dmy(s){return s.split('-').reverse().join('.')}
 function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
 function diff(a,b){var p=function(s){var x=s.split('-');return Date.UTC(+x[0],+x[1]-1,+x[2])};return Math.round((p(a)-p(b))/864e5)}
 function pl(n,a,b,c){n=Math.abs(n)%100;var m=n%10;return n>10&&n<20?c:m==1?a:m>=2&&m<=4?b:c}
 function unitTxt(n,u){return u=='working_days'?pl(n,'рабочий день','рабочих дня','рабочих дней'):u=='months'?pl(n,'месяц','месяца','месяцев'):u=='years'?pl(n,'год','года','лет'):pl(n,'день','дня','дней')}
 function label(k){var F=(window.__docsTest&&__docsTest.F&&__docsTest.F())||{};return (F[k]&&F[k].label)||k}
 /* условие {ключ: значение|[значения]} — все ключи должны совпасть */
 function okWhen(w,t,raw){if(!w)return true;var map=K().cond_keys||{procedure:'ПРОЦЕДУРА'};return Object.keys(w).every(function(k){var want=[].concat(w[k]).map(lc),v;
  if(k=='debtor_type'){try{v=FL().dt()}catch(e){v=''}}else v=raw(map[k]||k,t.id);v=lc(v);return want.indexOf(v)>=0})}
 /* видимость полей формы */
 function applyWhen(t,ed,raw){var fw=t.field_when||{};Object.keys(fw).forEach(function(k){var show=okWhen(fw[k],t,raw);
  [].forEach.call(ed.querySelectorAll('[data-w="'+k+'"]'),function(w){if(w.hidden!==!show)w.hidden=!show;if(!show)w.setAttribute('data-fw-hidden','');else w.removeAttribute('data-fw-hidden')})})}
 function shown(t,k,raw){var w=(t.field_when||{})[k];return !w||okWhen(w,t,raw)}
 /* расчёт правил шаблона */
 function calc(t,raw,dlCalc){var R=t.deadline_rules||{},out=[];Object.keys(R).forEach(function(id){var r=R[id];if(!r||r.verified===false||!r.direction||!(+r.offset||r.offset===0))return;if(!okWhen(r.when,t,raw))return;
   var ff=r.from_fields||[r.from_field||r.from].concat(r.fallback_field?[r.fallback_field]:[]),mode=r.from_mode||'first_filled',f='',used=-1;
   if(mode=='first_filled')for(var i=0;i<ff.length;i++){if(!shown(t,ff[i],raw))continue;var v=iso(raw(ff[i],t.id));if(v){f=v;used=i;break}}
   if(!f){out.push({id:id,r:r,ff:ff,pending:1});return}
   var x=dlCalc({offset:r.offset,unit:r.unit,direction:r.direction},f);if(!x)return;
   out.push({id:id,r:r,ff:ff,iso:x.iso,raw:x.raw,shift:x.shift,from:f,used:ff[used],prelim:used>0})});return out}
 function tip(c){var by=K().prelim_tip_by_rule||{};return by[c.id]||U('prelim_tip',{label:label(c.ff[0])})}
 function html(c){var r=c.r,ttl=E(r.title||U('title'));if(c.pending)return '<b>'+ttl+':</b> '+E(U('pending',{fields:c.ff.map(label).join(' / ')}));
  var left=diff(c.iso,today()),st=left<0?U('missed',{n:-left,days:pl(-left,'день','дня','дней')}):left==0?U('today'):U('left',{n:left,days:pl(left,'день','дня','дней')});
  return '<b>'+ttl+':</b> '+E(U('line',{action:r.action||'',d:''}))+'<b class="dlrd">'+E(dmy(c.iso))+'</b>'+(c.prelim?' <span class="dlpre" tabindex="0" title="'+E(tip(c))+'" aria-label="'+E(U('prelim_badge')+'. '+tip(c))+'">'+E(U('prelim_badge'))+'</span>':'')+
   ' <span class="dlrst'+(left<0?' late':'')+'">'+E(st)+'</span><div class="dlrsub">'+E(U('basis',{n:r.offset,unit:unitTxt(r.offset,r.unit),from:label(c.used).toLowerCase(),d:dmy(c.from),norm:r.norm||''}))+(c.shift?' · '+E(U('shift',{d:dmy(c.raw)})):'')+'</div>'}
 function d(t,ed,raw,dlCalc){if((C().deadlines||{}).rules_enabled===false||!t)return;try{applyWhen(t,ed,raw)}catch(e){}
  var L=[];try{L=calc(t,raw,dlCalc)}catch(e){}var seen={};
  L.forEach(function(c){var key=c.id+'|'+html(c);seen[c.id]=1;var old=ed.querySelector('[data-dlr="'+CSS.escape(c.id)+'"]');if(old&&old.dataset.k===key)return;if(old)old.remove();
   var el=document.createElement('div');el.className='dlr'+(c.prelim?' pre':'');el.dataset.dlr=c.id;el.dataset.k=key;el.setAttribute('role','note');el.innerHTML=html(c);
   var anc=null;for(var i=0;i<c.ff.length&&!anc;i++){var w=ed.querySelector('[data-w="'+c.ff[i]+'"]:not([hidden])');if(w)anc=w}
   if(!anc){var inp=ed.querySelector('[data-k="'+c.ff[0]+'"],[data-k="'+c.ff[c.ff.length-1]+'"]');anc=inp&&(inp.closest('[data-w]')||inp.closest('.ddate')||inp)}
   if(anc&&anc.parentNode)anc.parentNode.insertBefore(el,anc.nextSibling);else ed.insertBefore(el,ed.firstChild)});
  [].forEach.call(ed.querySelectorAll('[data-dlr]'),function(x){if(!seen[x.dataset.dlr])x.remove()})}
 window.ArbDLR={d:d,calc:calc,okWhen:okWhen,shown:shown}})();
