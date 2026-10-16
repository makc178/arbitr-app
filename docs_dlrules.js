/* Arbitr App — правила из index.json (1.7t), обобщённо для любых шаблонов:
   · templates[].field_when {ПОЛЕ: {условие}} — поле в форме показывается только при выполнении условия
     (ключи условия: procedure → ПРОЦЕДУРА, debtor_type → тип должника; прочие — имя поля; значение — строка или список);
   · templates[].field_print {ПОЛЕ:false} — не печатается (уже в docs.js noPrintF);
   · templates[].deadline_rules {id: {when, from_fields[], from_mode:first_filled, offset, unit, direction, fallback_flag, norm, action}} —
     срок-подсказка без поля-результата: от первого заполненного поля; если сработало не первое — «предварительно».
   Расчёт — dlCalc (с 1.7v в этом файле, docs.js вызывает ArbDLR.dlCalc) (ст. 191–193 ГК, производственный календарь deadlines.calendar). Тексты — docs_config.json → deadlines.rules_ui.
   Крючок: docs.js dlDecorate → ArbDLR.d(t, ed, raw, dlCalc).
   1.7v (computed в index.json; числа и нормы — только из JSON, в коде смещений нет):
   · when {flag: имя} — истинно, если включён условный блок шаблона с этим flag (ArbFlow.cb);
   · computed[ПОЛЕ].when_variants [{when, offset, unit, direction, norm}] — первый вариант с выполненным when заменяет offset/unit/direction/norm (ArbDLR.eff ← docs.js dlBlock);
   · computed[ПОЛЕ].same_as — поле равно другому полю шаблона (та же дата, без сдвига; расхождение — предупреждение);
   · from_fields + from_mode max_all_required — наибольшая из дат, только если заполнены все (ArbDLR.from ← docs.js dlFrom); first_filled — первое заполненное;
   · docs_config.json flag_fields {ПОЛЕ: {flag, on, off}} — значение поля по флагу условного блока (ОЧНАЯ_ЗАОЧНАЯ ← absentee_voting), только в шаблонах с этим блоком (ArbDLR.ff ← docs.js raw). */
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
 function flagOn(t,f){try{return !!(FL()&&FL().cb&&FL().cb(t,f))}catch(e){return false}}
 function okWhen(w,t,raw){if(!w)return true;var map=K().cond_keys||{procedure:'ПРОЦЕДУРА'};return Object.keys(w).every(function(k){if(k=='flag')return [].concat(w[k]).every(function(f){return flagOn(t,f)});var want=[].concat(w[k]).map(lc),v;
  if(k=='debtor_type'){try{v=FL().dt()}catch(e){v=''}}else v=raw(map[k]||k,t.id);v=lc(v);return want.indexOf(v)>=0})}
 /* видимость полей формы */
 function applyWhen(t,ed,raw){var fw=t.field_when||{};Object.keys(fw).forEach(function(k){var show=okWhen(fw[k],t,raw);
  [].forEach.call(ed.querySelectorAll('[data-w="'+k+'"]'),function(w){if(w.hidden!==!show)w.hidden=!show;if(!show)w.setAttribute('data-fw-hidden','');else w.removeAttribute('data-fw-hidden')})})}
 function shown(t,k,raw){var w=(t.field_when||{})[k];return !w||okWhen(w,t,raw)}
 /* расчёт правил шаблона */
 function calc(t,raw,dlCalc){var R=t.deadline_rules||{},out=[];Object.keys(R).forEach(function(id){var r=R[id];if(!r||r.verified===false||!r.direction||!(+r.offset||r.offset===0))return;if(!okWhen(r.when,t,raw))return;
   var ff=r.from_fields||[r.from_field||r.from].concat(r.fallback_field?[r.fallback_field]:[]),mode=r.from_mode||'first_filled',f='',used=-1;
   if(mode=='first_filled')for(var i=0;i<ff.length;i++){if(!shown(t,ff[i],raw))continue;var v=iso(raw(ff[i],t.id));if(v){f=v;used=i;break}}
   else if(mode=='max_all_required'){f=from(t,{from_mode:mode,from_fields:ff},raw)||'';if(f)for(var j=0;j<ff.length;j++)if(shown(t,ff[j],raw)&&iso(raw(ff[j],t.id))==f){used=j;break}}
   if(!f){out.push({id:id,r:r,ff:ff,pending:1});return}
   var x=dlCalc({offset:r.offset,unit:r.unit,direction:r.direction},f);if(!x)return;
   out.push({id:id,r:r,ff:ff,iso:x.iso,raw:x.raw,shift:x.shift,from:f,used:ff[used],prelim:mode=='first_filled'&&used>0})});return out}
 function tip(c){var by=K().prelim_tip_by_rule||{};return by[c.id]||U('prelim_tip',{label:label(c.ff[0])})}
 function html(c){var r=c.r,ttl=E(r.title||U('title'));if(c.pending)return '<b>'+ttl+':</b> '+E(U('pending',{fields:c.ff.map(label).join(' / ')}));
  var left=diff(c.iso,today()),st=left<0?U('missed',{n:-left,days:pl(-left,'день','дня','дней')}):left==0?U('today'):U('left',{n:left,days:pl(left,'день','дня','дней')});
  return '<b>'+ttl+':</b> '+E(U('line',{action:r.action||'',d:''}))+'<b class="dlrd">'+E(dmy(c.iso))+'</b>'+(c.prelim?' <span class="dlpre" tabindex="0" title="'+E(tip(c))+'" aria-label="'+E(U('prelim_badge')+'. '+tip(c))+'">'+E(U('prelim_badge'))+'</span>':'')+
   ' <span class="dlrst'+(left<0?' late':'')+'">'+E(st)+'</span><div class="dlrsub">'+E(U('basis',{n:r.offset,unit:unitTxt(r.offset,r.unit),from:label(c.used).toLowerCase(),d:dmy(c.from),norm:r.norm||''}))+(c.shift?' · '+E(U('shift',{d:dmy(c.raw)})):'')+'</div>'}
 function d(t,ed,raw,dlCalc){if(!t)return;try{syncFF(t,ed)}catch(e){}if((C().deadlines||{}).rules_enabled===false)return;try{applyWhen(t,ed,raw)}catch(e){}
  var L=[];try{L=calc(t,raw,dlCalc)}catch(e){}var seen={};
  L.forEach(function(c){var key=c.id+'|'+html(c);seen[c.id]=1;var old=ed.querySelector('[data-dlr="'+CSS.escape(c.id)+'"]');if(old&&old.dataset.k===key)return;if(old)old.remove();
   var el=document.createElement('div');el.className='dlr'+(c.prelim?' pre':'');el.dataset.dlr=c.id;el.dataset.k=key;el.setAttribute('role','note');el.innerHTML=html(c);
   var anc=null;for(var i=0;i<c.ff.length&&!anc;i++){var w=ed.querySelector('[data-w="'+c.ff[i]+'"]:not([hidden])');if(w)anc=w}
   if(!anc){var inp=ed.querySelector('[data-k="'+c.ff[0]+'"],[data-k="'+c.ff[c.ff.length-1]+'"]');anc=inp&&(inp.closest('[data-w]')||inp.closest('.ddate')||inp)}
   if(anc&&anc.parentNode)anc.parentNode.insertBefore(el,anc.nextSibling);else ed.insertBefore(el,ed.firstChild)});
  [].forEach.call(ed.querySelectorAll('[data-dlr]'),function(x){if(!seen[x.dataset.dlr])x.remove()})}
 /* ===== 1.7v: computed — when_variants, same_as, from_mode, поля по флагу ===== */
 function hasF(t,k){return !!(t&&t.fields&&t.fields.indexOf(k)>=0)}
 function eff(t,k,b,raw){if(!b||typeof b!='object'||!t)return b;
  if(b.same_as&&b.same_as!==k&&hasF(t,b.same_as))return Object.assign({},b,{from:b.same_as,from_fields:null,from_mode:null,offset:0,unit:'calendar_days',direction:'exact',when_variants:null,_same:b.same_as,_base:b});
  var V=b.when_variants;if(Array.isArray(V))for(var i=0;i<V.length;i++){var v=V[i];if(!v||!v.when||v.verified===false)continue;if(!okWhen(v.when,t,raw))continue;
   var o=Object.assign({},b,{_variant:i,_base:b});['offset','unit','direction','norm','quote','source_url','note'].forEach(function(x){if(v[x]!=null)o[x]=v[x]});if(v.norm!=null){delete o.short;delete o.basis}return o}
  return b}
 function from(t,b,raw){var m=b&&b.from_mode,ff=b&&b.from_fields;if(!m||!Array.isArray(ff)||!ff.length)return null;
  var ks=ff.filter(function(k){return shown(t,k,raw)}),vs=ks.map(function(k){return iso(raw(k,t.id))});
  if(m=='max_all_required'){if(!vs.length||vs.some(function(v){return !v}))return '';return vs.slice().sort().pop()}
  if(m=='first_filled'){for(var i=0;i<vs.length;i++)if(vs[i])return vs[i];return ''}
  return null}
 function missing(t,b,raw){var ff=(b&&b.from_fields)||[];return ff.filter(function(k){return shown(t,k,raw)&&!iso(raw(k,t.id))})}
 /* подпись под полем (docs.js dlCaption): pending — каких дат не хватает; cap — «от более поздней даты» / «= поле»; warn — расхождение same_as */
 function pend(t,b,raw){if(!b)return '';if(b._same){return U('same_pending',{label:label(b._same)})}if(b.from_mode!='max_all_required')return '';var m=missing(t,b,raw);return m.length?U('pending',{fields:m.map(label).join(' и ')}):''}
 function cap(t,b,f,raw){if(!b)return '';if(b._same)return U('same_as',{label:label(b._same),norm:b.norm||''});
  if(b.from_mode=='max_all_required'&&f)return U('from_max',{d:dmy(f),labels:(b.from_fields||[]).map(label).join(', ')});
  if(b.from_mode=='first_filled'&&f&&raw){var ff=(b.from_fields||[]).filter(function(k){return shown(t,k,raw)});if(ff.length>1&&iso(raw(ff[0],t.id))!==f)return U('prelim_badge')+': '+U('prelim_tip',{label:label(ff[0])})}return ''}
 function sameWarn(t,b,v,target){if(!b||!b._same||!v||!target||v===target)return '';return U('same_warn',{label:label(b._same),d:dmy(target)})}
 /* значение поля по флагу условного блока */
 function ffCfg(){return C().flag_fields||{}}
 function tpl(tid){var T=(X().templates||[]);for(var i=0;i<T.length;i++)if(T[i].id==tid)return T[i];return null}
 function blk(t,fl){return ((t&&t.conditional_blocks)||[]).some(function(b){return b&&(b.flag==fl||b.id==fl)})}
 function ff(k,tid){var c=ffCfg()[k];if(!c||!c.flag)return null;var t=tpl(tid);if(!t||!hasF(t,k)||!blk(t,c.flag))return null;return flagOn(t,c.flag)?(c.on==null?null:c.on):(c.off==null?null:c.off)}
 function syncFF(t,ed){var cfg=ffCfg();Object.keys(cfg).forEach(function(k){var c=cfg[k];if(!c||!c.flag||!hasF(t,k)||!blk(t,c.flag))return;var val=ff(k,t.id);if(val==null)return;
  [].forEach.call(ed.querySelectorAll('[data-k="'+k+'"]'),function(i){if(i.value!==val){i.value=val}if(!i.disabled)i.disabled=true;i.setAttribute('data-ff',c.flag);var w=i.closest('[data-w]')||i.parentNode,n=w&&w.querySelector('.dlff');var txt=U('flag_field',{label:c.label||c.flag});
   if(w&&!n){n=document.createElement('div');n.className='dlff sm';w.appendChild(n)}if(n&&n.textContent!==txt)n.textContent=txt})})}
 /* расчёт дат (перенесён из docs.js: лимит размера файла публичной проверки); календарь — docs_config.json deadlines.calendar */
 function DLC(){return C().deadlines||{}}
 function dISOd(s){var a=String(s).split('-');return new Date(Date.UTC(+a[0],+a[1]-1,+a[2]))}
 function dISOs(d){return d.getUTCFullYear()+'-'+('0'+(d.getUTCMonth()+1)).slice(-2)+'-'+('0'+d.getUTCDate()).slice(-2)}
 function dlWork(iso){var c=DLC().calendar||{};if((c.workdays||[]).indexOf(iso)>=0)return true;if((c.holidays||[]).indexOf(iso)>=0)return false;var w=dISOd(iso).getUTCDay();return w!=0&&w!=6}
 function dlAddDays(iso,n){var d=dISOd(iso);d.setUTCDate(d.getUTCDate()+n);return dISOs(d)}
 function dlAddMonths(iso,n){var a=iso.split('-').map(Number),m=a[1]-1+n,y=a[0]+Math.floor(m/12);m=((m%12)+12)%12;var last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return dISOs(new Date(Date.UTC(y,m,Math.min(a[2],last))))}
 function dlAddWork(iso,n){var s=n<0?-1:1,c=Math.abs(n),d=iso;while(c>0){d=dlAddDays(d,s);if(dlWork(d))c--}return d}
 function dlStep(iso,off,unit){off=+off||0;return unit=='calendar_days'?dlAddDays(iso,off):unit=='working_days'?dlAddWork(iso,off):unit=='months'?dlAddMonths(iso,off):unit=='years'?dlAddMonths(iso,12*off):null}
 /* ст. 191–193 ГК: срок начинается на следующий день после события; «не позднее» +N → перенос на следующий рабочий; «за N дней до» (−N, not_after) → назад; «не ранее» → вперёд (не нарушение); exact — без переноса */
 function dlCalc(b,fromISO){if(!b||!fromISO||!/^\d{4}-\d\d-\d\d$/.test(fromISO))return null;var r=fromISO,sgn=0;
  if(b.unit=='chain'){if(!Array.isArray(b.offset))return null;for(var i=0;i<b.offset.length;i++){var o=b.offset[i];r=dlStep(r,o.offset,o.unit);if(!r)return null;sgn=sgn||(+o.offset<0?-1:+o.offset>0?1:0)}}
  else{r=dlStep(r,b.offset,b.unit);if(!r)return null;sgn=+b.offset<0?-1:+b.offset>0?1:0}
  var raw0=r,sh=null;if(b.direction!='exact'&&sgn!==0&&b.unit!='working_days'&&!dlWork(r)){var back=b.direction=='not_after'&&sgn<0;while(!dlWork(r))r=dlAddDays(r,back?-1:1);sh=back?'back':'fwd'}
  return {iso:r,raw:raw0,shift:sh,dir:b.direction}}
 window.ArbDLR={dlCalc:dlCalc,d:d,calc:calc,okWhen:okWhen,shown:shown,flag:flagOn,eff:eff,from:from,pend:pend,cap:cap,sameWarn:sameWarn,ff:ff}})();
