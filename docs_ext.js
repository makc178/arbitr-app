/* Arbitr App — вынесено из docs.js (лимит 200 КБ на файл): иконки и строка «авто-флага» условного блока */
window.ArbIC={chk:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',chev:'<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',down:'<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',srch:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',doc:'<svg viewBox="0 0 24 24"><path d="M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6"/></svg>',dl:'<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',pen:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>',star:'<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z"/></svg>',warn:'<svg viewBox="0 0 24 24"><path d="M12 4l9 16H3zM12 10v4M12 17.5v.01"/></svg>',bld:'<svg viewBox="0 0 24 24"><path d="M4 20V8l8-4 8 4v12M4 20h16M9 20v-6h6v6M8 11h.01M16 11h.01"/></svg>',user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',arch:'<svg viewBox="0 0 24 24"><path d="M3 4h18v4H3zM5 8v12h14V8M10 12h4"/></svg>',sig:'<svg viewBox="0 0 24 24"><path d="M3 17c3-1 4-9 6-9s-1 9 1 9 3-5 4-5 0 4 2 4 2-2 5-2M3 21h18"/></svg>',book:'<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7"/></svg>'};
window.ArbExt={cond:function(b,auto,E,U){var p=function(x){return x?'<p class="sm">'+E(x)+'</p>':''};return '<div class="dcond dcauto'+(auto?' on':'')+'"><span class="dcai" aria-hidden="true">'+(auto?'\u2713':'\u2013')+'</span><b>'+E(b.label||b.flag)+'</b><span class="sm">'+E(U(auto?'cond_auto_on':'cond_auto_off',auto?'да, по заполненным данным':'нет, включится автоматически'))+'</span></div>'+p(b.hint)+p(b.norm)}};
/* Предзаполнение полей из данных Arbitr App (docs_config.json → prefill[], строки — prefill_ui). Общая схема для всех правил:
   заполнено из источника — серая подпись справа «из финанализа»; изменено вручную — точка + «Изменено вручную» + ↺ (вернуть значение источника);
   источник пересчитан и расходится с полем — серая строка «В финанализе: ДД.ММ.ГГГГ · Подставить». Ручное значение никогда не перезаписывается.
   Черновик: d._pf[поле] = {v: значение источника, принятое в поле; src; date; at; manual: true|false; latest: текущее значение источника}.
   finanalysis: finance/index.json (закрытое хранилище) → запись с ИНН текущего должника (самая поздняя по date) → result.json → поле value. */
(function(){var MEMO={},BUSY={},LAST=null;
 function cfg(D){return ((D.C()||{}).prefill)||[]}
 function UI(D,k,o){var u=((D.C()||{}).prefill_ui)||{},s=u[k];if(s==null)s=k;return o?fmt(s,o):s}
 function iso(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[0]:''}
 function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[3]+'.'+m[2]+'.'+m[1]:String(x||'')}
 function fmt(s,o){s=String(s||'');Object.keys(o).forEach(function(k){s=s.split('{'+k+'}').join(o[k]==null?'':o[k])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function nz(x){x=String(x||'').trim();var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(x);return m?m[3]+'-'+m[2]+'-'+m[1]:x}
 function same(a,b){return nz(a)===nz(b)}
 function out(P,v){/* в поле — в формате поля (даты ДД.ММ.ГГГГ), в _pf — ISO */return /^\d{4}-\d\d-\d\d$/.test(v)&&P.format!='iso'?dmy(v):v}
 async function gj(p){if(typeof ghApi!='function')return null;var r=await ghApi(p);if(!r.ok)return null;var j=await r.json();return JSON.parse(decodeURIComponent(escape(atob(String(j.content||'').replace(/\s/g,'')))))}
 async function finLookup(P,inn){var k='fin|'+inn;if(MEMO[k]!==undefined)return MEMO[k];MEMO[k]=null;try{var ix=await gj(P.index||'finance/index.json')||{},best=null;Object.keys(ix).forEach(function(id){var e=ix[id]||{};if(String(e.inn||'').replace(/\D/g,'')!==inn||e.sample)return;if(!best||String(e.date||'')>String(best.e.date||''))best={id:id,e:e}});
   if(best){var res=await gj(best.e[P.result_key||'result']||('finance/'+best.id+'/result.json'));var v=res&&iso(res[P.value]);if(v)MEMO[k]={v:v,date:best.e.date||'',id:best.id}}}catch(e){MEMO[k]=undefined}return MEMO[k]}
 function srcU(D,P,k){var u=((D.C()||{}).prefill_ui)||{};return ((u.sources||{})[P.source]||{})[k]||UI(D,k)}
 /* оформление поля по состоянию */
 function deco(D,P,d){var k=P.field,w=document.querySelector('#dform [data-w="'+k+'"]');if(!w)return;var pf=d&&d._pf&&d._pf[k],lb=w.tagName=='LABEL'?w.querySelector(':scope > span'):w.querySelector('label'),c=w.querySelector('.dpfc'),h=w.querySelector('.dpfh');
  if(!pf){if(c)c.remove();if(h)h.remove();w.classList.remove('dpfman');return}
  var man=!!pf.manual,ch='';
  if(man)ch='<span class="dpfdot" aria-hidden="true"></span>'+E(UI(D,'manual'))+' <button type="button" class="dpfr" data-pfr="'+E(k)+'" title="'+E(srcU(D,P,'restore_title').split('{v}').join(dmy(pf.latest||pf.v)))+'" aria-label="'+E(srcU(D,P,'restore_title').split('{v}').join(dmy(pf.latest||pf.v)))+'">\u21ba</button>';
  else ch=E(srcU(D,P,'caption'));
  if(!c){c=document.createElement('span');c.className='dpfc';if(lb){lb.classList.add('dpfl');lb.appendChild(c)}else w.insertBefore(c,w.firstChild)}
  if(c.innerHTML!==ch)c.innerHTML=ch;c.title=man?'':fmt(P.note||'',{v:dmy(pf.v),d:dmy(pf.date)});c.classList.toggle('man',man);w.classList.toggle('dpfman',man);
  var ht='';
  if(pf.latest&&!same(pf.latest,pf.v)&&!same(pf.latest,d[k]))ht=E(srcU(D,P,'recalc').split('{v}').join(dmy(pf.latest)))+' · <button type="button" class="dpfs" data-pfs="'+E(k)+'">'+E(UI(D,'apply'))+'</button>';
  if(!ht){if(h)h.remove();return}
  if(!h){h=document.createElement('div');h.className='sm dpfh';var fi=w.querySelector('.ddate')||w.querySelector('input,select,textarea');if(fi&&fi.parentNode===w)fi.after(h);else{var hi=w.querySelector('.dhint');if(hi)w.insertBefore(h,hi);else w.appendChild(h)}}if(h.innerHTML!==ht)h.innerHTML=ht}
 function sync(D,t,P,d){/* ручная правка: значение поля отличается от принятого значения источника */var k=P.field,pf=d&&d._pf&&d._pf[k];if(!pf)return false;var m=!same(d[k],pf.v);if(m!==!!pf.manual){pf.manual=m;return true}return false}
 function draft(D,t){return D.dra?D.dra(t.id):D.draftOf(t.id)}
 window.ArbExt=window.ArbExt||{};
 ArbExt.prefill=function(t,D){if(!t||!D)return;LAST={t:t,D:D};var L=cfg(D);if(!L.length)return;var d=D.draftOf(t.id),c=D.curCase&&D.curCase();if(!c)return;
  L.forEach(function(P){var k=P.field;if((t.fields||[]).indexOf(k)<0)return;var pf=d&&d._pf&&d._pf[k];
   if(pf&&sync(D,t,P,d))D.save();
   setTimeout(function(){deco(D,P,D.draftOf(t.id))},0);
   if(pf==null&&d&&d[k])return;if(P.source!='finanalysis')return;var inn=String((c.data||{})[(P.match||{}).inn||'ДОЛЖНИК_ИНН']||'').replace(/\D/g,'');if(inn.length!=10&&inn.length!=12)return;
   var bk=t.id+'|'+c.id+'|'+k;if(BUSY[bk])return;BUSY[bk]=1;
   finLookup(P,inn).then(function(r){if(!r)return;var cur=D.cur&&D.cur();if(!cur||cur.id!==t.id)return;var dd=draft(D,t);if(!dd)return;var p=dd._pf&&dd._pf[k],ch=false;
    if(!p){if(dd[k])return;dd[k]=out(P,r.v);(dd._pf=dd._pf||{})[k]={v:r.v,src:P.source,date:r.date,at:Date.now(),manual:false,latest:r.v};ch=true}
    else{if(!same(p.latest,r.v)||!same(p.date,r.date)){p.latest=r.v;p.date=r.date;ch=true}
     /* источник пересчитан: только строка «В финанализе: … · Подставить», поле не перезаписывается */}
    if(ch){D.save();D.redraw()}else deco(D,P,dd)}).finally(function(){BUSY[bk]=0})})};
 function act(k,mode){if(!LAST)return;var D=LAST.D,t=LAST.t,P=cfg(D).find(function(x){return x.field==k});if(!P)return;var d=draft(D,t),pf=d&&d._pf&&d._pf[k];if(!pf)return;var v=mode=='restore'?(pf.latest||pf.v):pf.latest;if(!v)return;d[k]=out(P,v);pf.v=v;pf.manual=false;pf.at=Date.now();D.save();D.redraw()}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pfr],[data-pfs]');if(!b)return;e.preventDefault();e.stopPropagation();act(b.dataset.pfr||b.dataset.pfs,b.dataset.pfr?'restore':'apply')},true);
 function onEdit(e){if(!LAST||!e.target.closest)return;var w=e.target.closest('#dform [data-w]');if(!w)return;var k=w.getAttribute('data-w'),D=LAST.D,t=LAST.t,P=cfg(D).find(function(x){return x.field==k});if(!P)return;setTimeout(function(){var d=D.draftOf(t.id);if(sync(D,t,P,d))D.save();deco(D,P,d)},0)}
 document.addEventListener('input',onEdit);document.addEventListener('change',onEdit);
})();
