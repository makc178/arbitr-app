/* Arbitr App · справочная оценка имущества Оценщиком из базы Arbitr (file_input appraiser_db, reference_only).
   Шаблоны с valuation_requirement из file_input_meta.appraiser_db.applies_to_valuation. Позиции — строки таблиц шаблона (_tbl / _rows) или поля appraiser_db.fields.
   Заглушка arbitr/appraisal_requests/<id>.json без ПДн (число позиций, шаблон, соль); позиции, адреса, дело — <id>.enc (ключ из PIN). Ответ — arbitr/appraisal_results/<id>.enc.
   Результат справочный: в поля документа не подставляется. Строки — docs_config.json → appraisal_ui. */
(function(){var RES={},BUSY={},TM=null,LAST=null;
 function A(){return window.ArbCP&&ArbCP.qapi?ArbCP.qapi().A:null}
 function K(D){return (D.C()||{}).appraisal_ui||{}}
 function U(D,k,o){var s=(K(D).ui||{})[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function b64(u8){var r='';for(var i=0;i<u8.length;i+=8192)r+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(r)}
 /* дополнение запроса (rev): тот же id, rev+1, статус supplement; ответ Оценщика несёт rev, на который отвечает. Ответ старого rev — устаревший: не считается полным, показывается «Оценщик считает». Нет rev = 0. */
 var PEND=/^(new|in_progress|sending|supplement)$/;function qrev(q){return +(q&&q.rev)||0}function rrev(r){return +(r&&r.rev)||0}function fresh(q,r){return !!r&&rrev(r)===qrev(q)}function curRes(q){var r=q&&RES[q.id];return fresh(q,r)?r:null}
 function txt64(j){return atob(String(j.content||'').replace(/\s/g,''))}
 function RQ(D){return K(D).requests||'arbitr/appraisal_requests/'}function RS(D){return K(D).results||'arbitr/appraisal_results/'}
 function meta(D){return ((D.X()||{}).file_input_meta||{}).appraiser_db||{}}
 function on(D,t){return K(D).enabled!==false&&t&&(meta(D).applies_to_valuation||[]).indexOf(t.valuation_requirement)>=0}
 function rid(){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return 'appr_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'_'+Math.random().toString(36).slice(2,6)}
 function filled(r){return Object.keys(r).some(function(k){return k[0]!='_'&&String(r[k]||'').trim()})}
 /* позиции: описание строки по колонкам (label: значение) */
 function items(D,t){var d=D.dra(t.id)||{},F=D.F()||{},out=[],n=0;
  function row(cols,r,tbl,title,ix){var o={};cols.forEach(function(c){var v=String(r[c.field]==null?'':r[c.field]).trim();if(v)o[c.label||(F[c.field]||{}).label||c.field]=v});n++;out.push({row:n,table:tbl,idx:ix,section:title||null,subgroup:null,fields:o,name:o[Object.keys(o).find(function(k){return true})]||''})}
  if(t.table_mode=='sections'&&Array.isArray(t.tables))t.tables.forEach(function(b){if(!b||b.mode!='rows'||!Array.isArray(b.table_schema))return;((d._tbl||{})[b.id]||[]).forEach(function(r,ix){if(!filled(r))return;row(b.table_schema.filter(function(c){return c.role!='subgroup'}),r,b.id,b.title,ix);var sg=b.subgroup_field&&r[b.subgroup_field],s=(b.subgroups||[]).find(function(x){return x.code==sg});if(s)out[out.length-1].subgroup=s.code+' '+String(s.label||'').replace(/[*:]|\(\d+\)/g,'').trim()})});
  else if(Array.isArray(t.table_schema)&&Array.isArray(d._rows))d._rows.forEach(function(r,ix){if(filled(r))row(t.table_schema,r,'_rows',null,ix)});
  if(!out.length){var o={};(meta(D).fields||[]).forEach(function(k){var v=String(d[k]||'').trim();if(v)o[(F[k]||{}).label||k]=v});if(Object.keys(o).length)out.push({row:1,table:null,idx:null,section:null,subgroup:null,fields:o,name:o[Object.keys(o)[0]]})}
  return out}
 async function put(path,text,msg,sha){var bo={message:msg,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:u8b64(text)};if(sha)bo.sha=sha;var r=await ghApi(path,{method:'PUT',body:JSON.stringify(bo)});if(!r.ok)throw new Error('GitHub '+r.status)}
 async function send(D,t){var a=A(),d=D.dra(t.id);if(typeof ghApi!='function'||!a||!a.venc||!a.vaultSalt){d._appr={msg:U(D,'no_store')};return redraw(D,t)}
  var it=items(D,t);if(!it.length){d._appr={msg:U(D,'no_items')};return redraw(D,t)}
  var c=D.curCase&&D.curCase(),cd=(c&&c.data)||{},id=rid(),dt=D.dt?D.dt():null;
  var pay={schema:'arbitr/appraisal_request/v1',request_id:id,template:t.id,template_title:t.title,valuation_requirement:t.valuation_requirement,debtor_type:dt,region:cd.РЕГИОН||null,case_no:cd.НОМЕР_ДЕЛА||null,debtor:cd.ДОЛЖНИК_НАИМЕНОВАНИЕ||null,valuation_date:new Date().toISOString().slice(0,10),items:it};
  d._appr={id:id,status:'sending',at:Date.now(),n:it.length,case:(D.curCase&&D.curCase()||{}).id||null,map:it.map(function(x){return [x.table,x.idx]})};redraw(D,t);
  try{var vs=a.vaultSalt(),e=await a.venc(new TextEncoder().encode(JSON.stringify(pay)),vs.s,vs.it);
   await put(RQ(D)+id+'.enc',JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(e.iv),ct:b64(new Uint8Array(e.ct))}),'appraisal payload '+id);
   await put(RQ(D)+id+'.json',JSON.stringify({schema:'arbitr/appraisal_request/v1',type:'appraisal',id:id,created_at:new Date().toISOString(),status:'new',n_items:it.length,template:t.id,enc:{format:'arbitr/au',s:vs.s,it:vs.it},payload_path:RQ(D)+id+'.enc',response_path:RS(D)+id+'.enc'},null,1),'appraisal_request '+id);
   d._appr={id:id,status:'new',at:Date.now(),n:it.length,case:(D.curCase&&D.curCase()||{}).id||null,map:it.map(function(x){return [x.table,x.idx]})};D.save();arm(D,t,10)}
  catch(x){d._appr={msg:U(D,'send_error')+': '+(x.message||x)}}redraw(D,t)}
 /* «Дополнить данные»: тот же запрос (id), rev+1, все позиции с новыми данными + supplement.rows (позиции need_data прошлого ответа); заглушка status=supplement → appraisal_watch снова берёт в работу и уведомляет Оценщика (id@rN) */
 async function supplement(D,t){var a=A(),d=D.dra(t.id),q=d&&d._appr;if(!q||!q.id||typeof ghApi!='function'||!a||!a.venc)return;if(PEND.test(q.status))return;/* дополнение уже в работе — rev не увеличиваем */var res=curRes(q);if(!res)return;
  var it=items(D,t);if(!it.length)return;var nr=qrev(q)+1,need=(res.items||[]).filter(function(x){return x.status=='need_data'}).map(function(x){return x.row});
  var c=D.curCase&&D.curCase(),cd=(c&&c.data)||{},dt=D.dt?D.dt():null,id=q.id,prev=q.status;
  q.status='sending';redraw(D,t);
  try{var rs=await ghApi(RQ(D)+id+'.json');if(!rs.ok)throw new Error('stub '+rs.status);var sj=await rs.json(),stub=JSON.parse(decodeURIComponent(escape(txt64(sj)))),e=stub.enc||{};
   var pay={schema:'arbitr/appraisal_request/v1',request_id:id,rev:nr,supplement:{rev:nr,rows:need,prev_status:res.status||prev||null},template:t.id,template_title:t.title,valuation_requirement:t.valuation_requirement,debtor_type:dt,region:cd.РЕГИОН||null,case_no:cd.НОМЕР_ДЕЛА||null,debtor:cd.ДОЛЖНИК_НАИМЕНОВАНИЕ||null,valuation_date:new Date().toISOString().slice(0,10),items:it};
   var en=await a.venc(new TextEncoder().encode(JSON.stringify(pay)),e.s,e.it);var re=await ghApi(RQ(D)+id+'.enc'),esha=re.ok?(await re.json()).sha:null;
   await put(RQ(D)+id+'.enc',JSON.stringify({v:1,s:e.s,it:e.it,iv:b64(en.iv),ct:b64(new Uint8Array(en.ct))}),'appraisal payload '+id+' rev '+nr,esha);
   stub.rev=nr;stub.status='supplement';stub.supplemented_at=new Date().toISOString();stub.n_items=it.length;stub.n_supplement=need.length;delete stub.eta_minutes;
   await put(RQ(D)+id+'.json',JSON.stringify(stub,null,1),'appraisal_request '+id+': supplement rev '+nr,sj.sha);
   q.rev=nr;q.status='supplement';q.at=Date.now();q.n=it.length;q.map=it.map(function(x){return [x.table,x.idx]});q.sum=summ(RES[id],q.n,nr);D.save();arm(D,t,10)}
  catch(x){q.status=prev;q.msg=U(D,'send_error')+': '+(x.message||x)}redraw(D,t)}
 function arm(D,t,s){clearTimeout(TM);var d=D.draftOf(t.id),q=d&&d._appr;if(q&&q.id&&(/^(new|in_progress|partial|sending|supplement)$/.test(q.status)||(RES[q.id]&&!fresh(q,RES[q.id]))))TM=setTimeout(function(){poll(D,t)},(s!=null?s:(+K(D).poll_s||60))*1000)}
 async function poll(D,t){var d=D.draftOf(t.id),q=d&&d._appr,a=A();if(!q||!q.id||BUSY[q.id]||typeof ghApi!='function'||!a||!a.vdec)return;BUSY[q.id]=1;
  try{var r=await ghApi(RS(D)+q.id+'.enc');if(r.ok){var j=await r.json();if(!(j.sha&&q.rsha==j.sha&&RES[q.id])){RES[q.id]=JSON.parse(new TextDecoder().decode(await a.vdec(txt64(j))));q.rsha=j.sha||''}if(fresh(q,RES[q.id]))q.status=RES[q.id].status||q.status;else{var r3=await ghApi(RQ(D)+q.id+'.json');if(r3.ok){var b3=JSON.parse(decodeURIComponent(escape(txt64(await r3.json()))));q.status=b3.status;q.eta=b3.eta_minutes||null}}q.sum=summ(RES[q.id],q.n,qrev(q))}
   else{var r2=await ghApi(RQ(D)+q.id+'.json');if(r2.ok){var b=JSON.parse(decodeURIComponent(escape(txt64(await r2.json()))));q.status=b.status;q.eta=b.eta_minutes||null}}D.save()}catch(e){}finally{BUSY[q.id]=0}
  redraw(D,t);arm(D,t)}

 /* ---- плашки под полем стоимости строки: справочно / нужны данные / считает; «Перенести в поле» ---- */
 function vf(D,t,tbl){var V=K(D).value_fields||{},T=(V.by_template||{})[t.id]||{},x=T[tbl||'_doc']||V[tbl||'_doc'];if(!x)return null;return typeof x=='string'?{field:x}:x}
 function pd(s){var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(String(s||''));return m?new Date(+m[3],+m[2]-1,+m[1]):null}
 function rub(v){var n=+v;return isFinite(n)?n.toLocaleString('ru-RU',{maximumFractionDigits:2}).replace(/\u00a0/g,' '):String(v||'')}
 function cell(t,tbl,idx,f){var sel=tbl==null?'#dform [data-w="'+f+'"] input':tbl=='_rows'?'#dr_'+idx+'_'+f:'#dform [data-tb="'+tbl+'"][data-tbr="'+idx+'"][data-tbk="'+f+'"]';try{return document.querySelector(sel)}catch(e){return null}}
 function rowObj(D,t,tbl,idx){var d=D.dra(t.id);if(tbl==null)return d;if(tbl=='_rows')return (d._rows||[])[idx];return ((d._tbl||{})[tbl]||[])[idx]}
 function PU(D,k){var u=((D.C()||{}).prefill_ui)||{};return u[k]||k}
 function plates(D,t){var d=D.draftOf(t.id)||{},q=d._appr;[].forEach.call(document.querySelectorAll('#dform .daplate'),function(e){e.dataset.keep=''});
  if(!q||!q.id||!Array.isArray(q.map)){[].forEach.call(document.querySelectorAll('#dform .daplate'),function(e){e.remove()});return}
  var res=curRes(q),prev=!res&&RES[q.id]||null,ox,busy=PEND.test(q.status)||(!!RES[q.id]&&!res),stale=+K(D).stale_days||30;
  q.map.forEach(function(mp,i){var tbl=mp[0],idx=mp[1],c=vf(D,t,tbl);if(!c)return;var inp=cell(t,tbl,idx,c.field);if(!inp)return;var host=inp.parentNode,h='',r=rowObj(D,t,tbl,idx)||{},x=res&&(res.items||[]).find(function(y){return y.row==i+1});
   if(x&&x.status=='valued'){var dt=pd(x.date),old=dt&&(Date.now()-dt.getTime())>stale*864e5,txt=fmtV(c,x.value),done=r._apt&&r._apt[c.field]&&String(r[c.field]||'')===r._apt[c.field].v;
    h='<div class="daplate'+(old?' old':'')+'" data-apl="'+i+'"><span>'+E(U(D,'plate_value',{v:rub(x.value)})).replace(/(\d) (?=[\d₽])/g,'$1\u00a0')+' <span class="dapd">'+E(U(D,'plate_on',{d:x.date||'—'}))+'</span> · '+E(U(D,'plate_not_in_doc'))+'</span>'+
     (done?'<span class="dapm"><span class="dpfdot"></span>'+E(PU(D,'manual'))+'</span>':'<button type="button" class="dapb" data-apt="'+i+'"'+(old?' data-old="'+E(x.date)+'"':'')+'>'+E(U(D,'plate_transfer'))+'</button>')+
     (old?'<button type="button" class="dapb" data-appr="send">'+E(U(D,'plate_refresh'))+'</button>':'')+(x.note?'<div class="dapn">'+E(x.note)+'</div>':'')+'</div>'}
   else if(x&&x.status=='need_data')h='<div class="daplate apnd" data-apl="'+i+'"><i>'+E(U(D,'plate_need',{m:(x.missing||[]).join(', ')||'—'}))+'</i>'+(x.note?'<div class="dapn">'+E(x.note)+'</div>':'')+'</div>';
   else if(busy&&(ox=prev&&(prev.items||[]).find(function(y){return y.row==i+1&&y.status=='valued'})))h='<div class="daplate prev" data-apl="'+i+'"><span>'+E(U(D,'plate_value',{v:rub(ox.value)})).replace(/(\d) (?=[\d₽])/g,'$1\u00a0')+' <span class="dapd">'+E(U(D,'plate_on',{d:ox.date||'—'}))+'</span> · '+E(U(D,'plate_prev'))+'</span><div class="dapn"><span class="dspin" aria-hidden="true"></span>'+E(U(D,'plate_busy',{m:q.eta||K(D).eta_default||20}))+'</div></div>';
   else if(busy||(q.status=='partial'&&!x))h='<div class="daplate busy" data-apl="'+i+'"><span class="dspin" aria-hidden="true"></span>'+E(U(D,'plate_busy',{m:q.eta||K(D).eta_default||20}))+'</div>';
   var ex=host.querySelector(':scope > .daplate');if(!h){if(ex)ex.remove();return}if(ex&&ex.outerHTML===h){ex.dataset.keep=1;return}var el=document.createElement('div');el.innerHTML=h;el=el.firstChild;el.dataset.keep=1;if(ex)ex.replaceWith(el);else host.appendChild(el)});
  [].forEach.call(document.querySelectorAll('#dform .daplate'),function(e){if(!e.dataset.keep)e.remove()})}
 function fmtV(c,v){return String(c.fmt||'{v}').split('{v}').join(rub(v))}
 function transfer(D,t,i,old){var d=D.draftOf(t.id),q=d&&d._appr,res=q&&RES[q.id];if(!res)return;var x=(res.items||[]).find(function(y){return y.row==i+1});var mp=q.map[i];if(!x||!mp)return;var c=vf(D,t,mp[0]);if(!c)return;
  if(old&&!confirm(U(D,'plate_confirm_old',{d:old})))return;var r=rowObj(D,t,mp[0],mp[1]);if(!r)return;var nv=fmtV(c,x.value);
  if(c.mode=='append'){var cur=String(r[c.field]||'').trim();nv=cur?cur+String(c.sep||'; ')+nv:nv}
  r[c.field]=nv;r._apt=r._apt||{};r._apt[c.field]={v:nv,src:'appraisal',date:x.date||'',at:Date.now(),manual:true};D.save();D.redraw()}
 /* сводка для карточки достаточности (без описаний имущества): оценено N из M, сумма, самая ранняя дата оценки */
 function summ(r,n,qr){var it=(r&&r.items)||[],v=it.filter(function(x){return x.status=='valued'&&isFinite(+x.value)}),dd=v.map(function(x){var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(String(x.date||''));return m?m[3]+'-'+m[2]+'-'+m[1]:''}).filter(Boolean).sort();var rd=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(String(r&&r.date||'')),ri=/^\d{4}-\d\d-\d\d/.exec(String(r&&r.date||''));/* дата оценки — date из ответа Оценщика (не дата запроса); нет — самая ранняя дата позиций */
  return {rev:rrev(r),fresh:rrev(r)===(+qr||0),n:Math.max(n||0,it.length),valued:v.length,total:v.reduce(function(a,x){return a+(+x.value)},0),date:rd?rd[3]+'-'+rd[2]+'-'+rd[1]:ri?ri[0]:(dd[0]||'')}}
 function money(v){var n=+v;return isFinite(n)&&String(v)!==''?n.toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽':String(v||'')}
 function html(D,t){var d=D.draftOf(t.id)||{},q=d._appr||{},m=meta(D),vm=((D.X()||{}).valuation_requirement_meta||{})[t.valuation_requirement]||{},h='<div id="dappr" class="dimp"><div class="d1">'+E(U(D,'title'))+'</div><p class="sm">'+E(U(D,"help"))+'</p>';
  if(vm.label)h+='<p class="sm">'+E(vm.label)+(vm.norm?' ('+E(vm.norm)+')':'')+'</p>';
  var it=items(D,t);
  if(q.id){var st=q.status=='in_progress'?(q.eta?U(D,'st_progress',{m:q.eta}):U(D,'st_progress_noeta')):U(D,'st_'+q.status);h+='<p><b>'+E(U(D,'req',{n:q.n}))+'</b> · '+E(st)+'</p>';
   var res=curRes(q);if(!res&&RES[q.id])h+='<p class="sm">'+E(U(D,'stale_wait',{r:qrev(q)}))+'</p>';if(res&&Array.isArray(res.items)){var byRow={};it.forEach(function(x){byRow[x.row]=x});h+='<div class="dapprl">'+res.items.map(function(x){var src=byRow[x.row]||{};return '<div class="dappri"><div><b>'+E(x.row+'. '+(src.name||''))+'</b>'+(src.subgroup?' <span class="sm">'+E(src.subgroup)+'</span>':'')+'</div>'+(x.status=='valued'?'<div>'+E(U(D,'value'))+': <b>'+E(money(x.value))+'</b>'+(x.date?' · '+E(U(D,'on_date',{d:x.date})):'')+(x.method?' · <span class="sm">'+E(x.method)+'</span>':'')+'</div>':'<div class="dimpw sm">'+E(U(D,'need_data'))+(x.missing&&x.missing.length?': '+E(x.missing.join(', ')):'')+'</div>')+(x.note?'<div class="sm">'+E(x.note)+'</div>':'')+'</div>'}).join('')+'</div><p class="sm">'+E(U(D,'reference_only'))+'</p>'}}
  if(q.msg)h+='<p class="sm dimpw">'+E(q.msg)+'</p>';
  var busy=q.id&&(PEND.test(q.status)||(RES[q.id]&&!curRes(q))),cr=curRes(q),nd=cr&&(cr.items||[]).filter(function(x){return x.status=='need_data'}).length;
  h+='<div class="dact">'+(nd&&!busy?'<button type="button" class="lbtn" data-appr="supplement">'+E(U(D,'supplement',{n:nd}))+'</button> ':'')+'<button type="button" class="lbtn'+(q.id?' sec':'')+'" data-appr="send"'+(busy||!it.length?' disabled':'')+'>'+E(U(D,q.id?'resend':'send',{n:it.length}))+'</button></div>'+(it.length?'':'<p class="sm">'+E(U(D,'no_items'))+'</p>');
  return h+'</div>'}
 function redraw(D,t){var f=document.getElementById('dform');if(!f)return;try{if(on(D,t))plates(D,t)}catch(e){}var ex=document.getElementById('dappr');if(!on(D,t)){if(ex)ex.remove();return}var hh=html(D,t);if(ex&&ex.dataset.h===hh)return;var el=document.createElement('div');el.innerHTML=hh;el=el.firstChild;el.dataset.h=hh;if(ex){ex.replaceWith(el);return}
  var a=document.getElementById('dimp');if(a)a.after(el);else{a=f.querySelector('#drows')||f.querySelector('.dtbw');if(a&&a.parentNode)a.parentNode.insertBefore(el,a);else f.appendChild(el)}}
 window.ArbAppr={mount:function(t,D){var c=D.cur&&D.cur();if(c&&c.id==t.id)t=c;var first=!LAST||LAST.t.id!==t.id;LAST={t:t,D:D};redraw(D,t);try{if(sessionStorage.getItem('arb_appr_focus')){sessionStorage.removeItem('arb_appr_focus');setTimeout(function(){var x=document.getElementById('dappr');if(x){x.scrollIntoView({block:'center'});var b=x.querySelector('[data-appr=supplement]')||x.querySelector('[data-appr=send]');if(b)b.focus()}},300)}}catch(_){}var d=D.draftOf(t.id),q=d&&d._appr;if(first&&q&&q.id&&!RES[q.id])poll(D,t);else arm(D,t)},_items:items,_summ:summ,_fresh:fresh,_supplement:function(){if(LAST)return supplement(LAST.D,LAST.t)},_poll:function(){if(LAST)return poll(LAST.D,LAST.t)}};
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-apt]');if(a&&LAST){e.preventDefault();e.stopPropagation();transfer(LAST.D,LAST.t,+a.dataset.apt,a.dataset.old||'');return}var b=e.target.closest&&e.target.closest('[data-appr]');if(!b||!LAST)return;e.preventDefault();if(b.dataset.appr=='send')send(LAST.D,LAST.t);else if(b.dataset.appr=='supplement')supplement(LAST.D,LAST.t)},true);
 var PT=0;new MutationObserver(function(){if(!LAST)return;clearTimeout(PT);PT=setTimeout(function(){var c=LAST.D.cur&&LAST.D.cur();if(c&&c.id==LAST.t.id&&document.getElementById('dform')&&on(LAST.D,c))try{plates(LAST.D,c)}catch(e){}},60);if(document.getElementById('dform')&&!document.getElementById('dappr')){var c=LAST.D.cur&&LAST.D.cur();if(c&&c.id==LAST.t.id)redraw(LAST.D,c)}}).observe(document.documentElement,{childList:true,subtree:true});
})();
