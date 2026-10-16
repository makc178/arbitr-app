/* Arbitr App · автозаполнение групп из контрагентов дела, реестр документов-источников дела, неактивный слот «Контур.Фокус».
   Конфигурация: docs_config.json → autofill (groups[]), source_docs, focus_slot. Данные только с этого устройства (контрагенты — IndexedDB, реестр — карточка дела). */
(function(){var LAST=null,CPS=null,CPT=0;
 function E(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function C(D){return D.C()||{}}
 function U(D,sec,k,o){var s=((C(D)[sec]||{}).ui||{})[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function filled(it,keys){return keys.some(function(k){return String(it[k]||'').trim()})}
 function nInn(x){return String(x||'').replace(/\D/g,'')}
 async function cps(force){if(CPS&&!force&&Date.now()-CPT<5000)return CPS;try{CPS=window.ArbDB?await ArbDB.all('counterparties'):[]}catch(e){CPS=[]}CPT=Date.now();return CPS}
 /* ---- 1. группы из контрагентов дела ---- */
 function rules(D,t){return ((C(D).autofill||{}).groups||[]).filter(function(r){return t.repeat_groups&&t.repeat_groups[r.group]})}
 function cand(D,t,r,L,c){var d=D.draftOf(t.id)||{},items=((d._rg||{})[r.group])||[],keys=Object.keys(r.map),have={};
  items.forEach(function(it){var i=nInn(it[r.inn_field||'']),n=String(it[r.name_field||keys[0]]||'').trim().toLowerCase();if(i)have['i'+i]=1;if(n)have['n'+n]=1});
  return L.filter(function(x){return (x.cases||[]).indexOf(c.id)>=0&&(x.roles||[]).indexOf(r.role)>=0&&!have['i'+nInn(x.inn)]&&!have['n'+String(x.name||'').trim().toLowerCase()]})}
 function val(x,src){return (Array.isArray(src)?src:[src]).map(function(s){return x[s]}).find(function(v){return v!=null&&String(v).trim()})||''}
 async function groups(D,t){var c=D.curCase&&D.curCase();if(!c)return;var R=rules(D,t);if(!R.length)return;var L=await cps();
  R.forEach(function(r){var add=document.querySelector('#dform [data-rgadd="'+r.group+'"]');var host=add?add.parentNode:null;if(!host)return;var ex=host.querySelector('.dafg[data-afg="'+r.group+'"]'),cs=cand(D,t,r,L,c);
   if(!cs.length){if(ex)ex.remove();return}var h='<button type="button" class="btn ghost dafg" data-afg="'+E(r.group)+'" title="'+E(cs.map(function(x){return x.name}).join(', '))+'">'+E(U(D,'autofill','from_cp',{n:cs.length,role:((C(D).counterparties||{}).roles||{})[r.role]||r.role}))+'</button>';
   if(ex&&ex.outerHTML===h)return;var el=document.createElement('div');el.innerHTML=h;el=el.firstChild;if(ex)ex.replaceWith(el);else add.after(el)})}
 async function fillG(D,t,g){var c=D.curCase&&D.curCase(),r=rules(D,t).find(function(x){return x.group==g});if(!c||!r)return;var cs=cand(D,t,r,await cps(true),c);if(!cs.length)return;
  var d=D.dra(t.id);d._rg=d._rg||{};var L=d._rg[g]=d._rg[g]||[],keys=Object.keys(r.map);
  var allK=(t.repeat_groups[g].fields||[]);L=d._rg[g]=L.filter(function(it){return filled(it,allK)||Object.keys(it).some(function(k){return k[0]=='_'&&k!='_af'})});
  cs.forEach(function(x){var it={};keys.forEach(function(k){var v=val(x,r.map[k]);if(v)it[k]=v});it._af={src:'counterparty',id:x.id,at:Date.now()};L.push(it)});D.save();D.redraw()}
 /* ---- 2. реестр документов-источников (по file_inputs шаблона; отметки — в карточке дела, только метаданные) ---- */
 function fim(D){return (D.X()||{}).file_input_meta||{}}
 function cov(D,t,key){var m=fim(D)[key]||{},d=D.draftOf(t.id)||{},c=D.curCase&&D.curCase(),cd=(c&&c.data)||{},fs=(m.fields||[]).filter(function(k){return (t.fields||[]).indexOf(k)>=0}),ok=fs.filter(function(k){return String(d[k]!=null&&d[k]!==''?d[k]:(cd[k]||'')).trim()});return {fs:fs,ok:ok}}
 function srcHtml(D,t){var S=C(D).source_docs||{};if(S.enabled===false)return '';var keys=(t.file_inputs||[]).filter(function(k){return fim(D)[k]&&!(fim(D)[k].reference_only)});var c=D.curCase&&D.curCase();if(!keys.length||!c)return '';
  var reg=((c.data||{})._srcdocs)||{},F=D.F()||{},open=LAST&&LAST.open;
  var rows=keys.map(function(k){var m=fim(D)[k],r=reg[k]||{},cv=cov(D,t,k),miss=cv.fs.filter(function(x){return cv.ok.indexOf(x)<0});
   return '<div class="dsrc'+(r.date||r.note?' got':'')+'" data-src="'+E(k)+'"><div class="dsrch"><b>'+E(m.label||k)+'</b>'+(m.formats&&m.formats.length?' <span class="sm">'+E(m.formats.join(', '))+'</span>':'')+'<span class="sm dsrcc">'+E(cv.fs.length?U(D,'source_docs','coverage',{ok:cv.ok.length,n:cv.fs.length}):U(D,'source_docs','no_fields'))+'</span></div>'+
    '<div class="g2"><label class="f"><span>'+E(U(D,'source_docs','date'))+'</span><input class="inp" data-srcf="date" data-srck="'+E(k)+'" placeholder="ДД.ММ.ГГГГ" maxlength="10" value="'+E(r.date||'')+'"></label><label class="f"><span>'+E(U(D,'source_docs','note'))+'</span><input class="inp" data-srcf="note" data-srck="'+E(k)+'" value="'+E(r.note||'')+'"></label></div>'+
    (miss.length?'<p class="sm">'+E(U(D,'source_docs','missing'))+' '+E(miss.map(function(x){return (F[x]||{}).label||x}).join(', '))+'</p>':'')+'</div>'}).join('');
  return '<details id="dsrcreg" class="dimp"'+(open?' open':'')+'><summary class="d1">'+E(U(D,'source_docs','title',{n:keys.filter(function(k){return reg[k]&&(reg[k].date||reg[k].note)}).length,m:keys.length}))+'</summary><p class="sm">'+E(U(D,'source_docs','help'))+'</p>'+rows+focusHtml(D,t)+'</details>'}
 /* ---- 3. слот «Контур.Фокус» (неактивный) ---- */
 function focusHtml(D,t){var S=C(D).focus_slot||{};if(S.show===false)return '';var F=(D.X()||{}).fields||{},fl=(t.fields||[]).filter(function(k){var f=F[k]||{};return (f.sources||[]).indexOf('focus')>=0||JSON.stringify(f.sources_by_debtor||{}).indexOf('focus')>=0});
  var rg=Object.keys(t.repeat_groups||{}).reduce(function(a,g){return a.concat((t.repeat_groups[g].fields||[]).filter(function(k){return ((F[k]||{}).sources||[]).indexOf('focus')>=0}))},[]);fl=fl.concat(rg.filter(function(k){return fl.indexOf(k)<0}));if(!fl.length)return '';
  var FF=D.F()||{};return '<div class="dsrc dfocus"><div class="dsrch"><b>'+E(S.label||'Контур.Фокус')+'</b><span class="sm dsrcc">'+E(S.enabled?S.on||'':S.off||'не подключено')+'</span></div><p class="sm">'+E(S.note||'')+'</p><p class="sm">'+E(S.fields_label||'')+' '+E(fl.map(function(k){return ((FF[k]||F[k]||{}).label)||k}).join(', '))+'</p><button type="button" class="lbtn sec" disabled aria-disabled="true">'+E(S.button||'Подключить')+'</button></div>'}
 function regMount(D,t){var f=document.getElementById('dform');if(!f)return;var ex=document.getElementById('dsrcreg'),h=srcHtml(D,t);if(!h){if(ex)ex.remove();return}
  if(ex&&ex.dataset.h===h)return;if(ex&&ex.contains(document.activeElement))return;var el=document.createElement('div');el.innerHTML=h;el=el.firstChild;el.dataset.h=h;el.addEventListener('toggle',function(){if(LAST)LAST.open=el.open});if(ex)ex.replaceWith(el);else f.appendChild(el)}
 function nd(v){v=String(v||'').trim();var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(v);return m?m[3]+'.'+m[2]+'.'+m[1]:v}
 window.ArbAF={mount:function(t,D){var c=D.cur&&D.cur();if(c&&c.id==t.id)t=c;var op=LAST&&LAST.t.id==t.id?LAST.open:false;LAST={t:t,D:D,open:op};groups(D,t);regMount(D,t)}};
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-afg]');if(!b||!LAST)return;e.preventDefault();e.stopPropagation();fillG(LAST.D,LAST.t,b.dataset.afg)},true);
 document.addEventListener('change',function(e){var i=e.target;if(!i.dataset||!i.dataset.srcf||!LAST)return;e.stopPropagation();var D=LAST.D,c=D.curCase&&D.curCase();if(!c)return;c.data=c.data||{};var R=c.data._srcdocs=c.data._srcdocs||{},r=R[i.dataset.srck]=R[i.dataset.srck]||{};r[i.dataset.srcf]=i.dataset.srcf=='date'?nd(i.value):i.value.trim();r.at=Date.now();if(!r.date&&!r.note)delete R[i.dataset.srck];D.save();regMount(D,LAST.t)},true);
 document.addEventListener('input',function(e){if(e.target.dataset&&e.target.dataset.srcf)e.stopPropagation()},true);
 new MutationObserver(function(){if(!LAST)return;var f=document.getElementById('dform');if(!f)return;if(!document.getElementById('dsrcreg')||(rules(LAST.D,LAST.t).length&&!document.querySelector('.dafg')&&document.querySelector('[data-rgadd]'))){var c=LAST.D.cur&&LAST.D.cur();if(c&&c.id==LAST.t.id){regMount(LAST.D,c);groups(LAST.D,c)}}}).observe(document.documentElement,{childList:true,subtree:true});
})();
