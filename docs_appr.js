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
 function txt64(j){return atob(String(j.content||'').replace(/\s/g,''))}
 function RQ(D){return K(D).requests||'arbitr/appraisal_requests/'}function RS(D){return K(D).results||'arbitr/appraisal_results/'}
 function meta(D){return ((D.X()||{}).file_input_meta||{}).appraiser_db||{}}
 function on(D,t){return K(D).enabled!==false&&t&&(meta(D).applies_to_valuation||[]).indexOf(t.valuation_requirement)>=0}
 function rid(){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return 'appr_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'_'+Math.random().toString(36).slice(2,6)}
 function filled(r){return Object.keys(r).some(function(k){return k[0]!='_'&&String(r[k]||'').trim()})}
 /* позиции: описание строки по колонкам (label: значение) */
 function items(D,t){var d=D.dra(t.id)||{},F=D.F()||{},out=[],n=0;
  function row(cols,r,tbl,title){var o={};cols.forEach(function(c){var v=String(r[c.field]==null?'':r[c.field]).trim();if(v)o[c.label||(F[c.field]||{}).label||c.field]=v});n++;out.push({row:n,table:tbl,section:title||null,subgroup:null,fields:o,name:o[Object.keys(o).find(function(k){return true})]||''})}
  if(t.table_mode=='sections'&&Array.isArray(t.tables))t.tables.forEach(function(b){if(!b||b.mode!='rows'||!Array.isArray(b.table_schema))return;((d._tbl||{})[b.id]||[]).filter(filled).forEach(function(r){row(b.table_schema.filter(function(c){return c.role!='subgroup'}),r,b.id,b.title);var sg=b.subgroup_field&&r[b.subgroup_field],s=(b.subgroups||[]).find(function(x){return x.code==sg});if(s)out[out.length-1].subgroup=s.code+' '+String(s.label||'').replace(/[*:]|\(\d+\)/g,'').trim()})});
  else if(Array.isArray(t.table_schema)&&Array.isArray(d._rows))d._rows.filter(filled).forEach(function(r){row(t.table_schema,r,'_rows',null)});
  if(!out.length){var o={};(meta(D).fields||[]).forEach(function(k){var v=String(d[k]||'').trim();if(v)o[(F[k]||{}).label||k]=v});if(Object.keys(o).length)out.push({row:1,table:null,section:null,subgroup:null,fields:o,name:o[Object.keys(o)[0]]})}
  return out}
 async function put(path,text,msg){var r=await ghApi(path,{method:'PUT',body:JSON.stringify({message:msg,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:u8b64(text)})});if(!r.ok)throw new Error('GitHub '+r.status)}
 async function send(D,t){var a=A(),d=D.dra(t.id);if(typeof ghApi!='function'||!a||!a.venc||!a.vaultSalt){d._appr={msg:U(D,'no_store')};return redraw(D,t)}
  var it=items(D,t);if(!it.length){d._appr={msg:U(D,'no_items')};return redraw(D,t)}
  var c=D.curCase&&D.curCase(),cd=(c&&c.data)||{},id=rid(),dt=D.dt?D.dt():null;
  var pay={schema:'arbitr/appraisal_request/v1',request_id:id,template:t.id,template_title:t.title,valuation_requirement:t.valuation_requirement,debtor_type:dt,region:cd.РЕГИОН||null,case_no:cd.НОМЕР_ДЕЛА||null,debtor:cd.ДОЛЖНИК_НАИМЕНОВАНИЕ||null,valuation_date:new Date().toISOString().slice(0,10),items:it};
  d._appr={id:id,status:'sending',at:Date.now(),n:it.length};redraw(D,t);
  try{var vs=a.vaultSalt(),e=await a.venc(new TextEncoder().encode(JSON.stringify(pay)),vs.s,vs.it);
   await put(RQ(D)+id+'.enc',JSON.stringify({v:1,s:vs.s,it:vs.it,iv:b64(e.iv),ct:b64(new Uint8Array(e.ct))}),'appraisal payload '+id);
   await put(RQ(D)+id+'.json',JSON.stringify({schema:'arbitr/appraisal_request/v1',type:'appraisal',id:id,created_at:new Date().toISOString(),status:'new',n_items:it.length,template:t.id,enc:{format:'arbitr/au',s:vs.s,it:vs.it},payload_path:RQ(D)+id+'.enc',response_path:RS(D)+id+'.enc'},null,1),'appraisal_request '+id);
   d._appr={id:id,status:'new',at:Date.now(),n:it.length};D.save();arm(D,t,10)}
  catch(x){d._appr={msg:U(D,'send_error')+': '+(x.message||x)}}redraw(D,t)}
 function arm(D,t,s){clearTimeout(TM);var d=D.draftOf(t.id),q=d&&d._appr;if(q&&q.id&&/^(new|in_progress|partial|sending)$/.test(q.status))TM=setTimeout(function(){poll(D,t)},(s!=null?s:(+K(D).poll_s||60))*1000)}
 async function poll(D,t){var d=D.draftOf(t.id),q=d&&d._appr,a=A();if(!q||!q.id||BUSY[q.id]||typeof ghApi!='function'||!a||!a.vdec)return;BUSY[q.id]=1;
  try{var r=await ghApi(RS(D)+q.id+'.enc');if(r.ok){var j=await r.json();if(!(j.sha&&q.rsha==j.sha&&RES[q.id])){RES[q.id]=JSON.parse(new TextDecoder().decode(await a.vdec(txt64(j))));q.rsha=j.sha||''}q.status=RES[q.id].status||q.status}
   else{var r2=await ghApi(RQ(D)+q.id+'.json');if(r2.ok){var b=JSON.parse(decodeURIComponent(escape(txt64(await r2.json()))));q.status=b.status;q.eta=b.eta_minutes||null}}D.save()}catch(e){}finally{BUSY[q.id]=0}
  redraw(D,t);arm(D,t)}
 function money(v){var n=+v;return isFinite(n)&&String(v)!==''?n.toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽':String(v||'')}
 function html(D,t){var d=D.draftOf(t.id)||{},q=d._appr||{},m=meta(D),vm=((D.X()||{}).valuation_requirement_meta||{})[t.valuation_requirement]||{},h='<div id="dappr" class="dimp"><div class="d1">'+E(U(D,'title'))+'</div><p class="sm">'+E(U(D,"help"))+'</p>';
  if(vm.label)h+='<p class="sm">'+E(vm.label)+(vm.norm?' ('+E(vm.norm)+')':'')+'</p>';
  var it=items(D,t);
  if(q.id){var st=q.status=='in_progress'?(q.eta?U(D,'st_progress',{m:q.eta}):U(D,'st_progress_noeta')):U(D,'st_'+q.status);h+='<p><b>'+E(U(D,'req',{n:q.n}))+'</b> · '+E(st)+'</p>';
   var res=RES[q.id];if(res&&Array.isArray(res.items)){var byRow={};it.forEach(function(x){byRow[x.row]=x});h+='<div class="dapprl">'+res.items.map(function(x){var src=byRow[x.row]||{};return '<div class="dappri"><div><b>'+E(x.row+'. '+(src.name||''))+'</b>'+(src.subgroup?' <span class="sm">'+E(src.subgroup)+'</span>':'')+'</div>'+(x.status=='valued'?'<div>'+E(U(D,'value'))+': <b>'+E(money(x.value))+'</b>'+(x.date?' · '+E(U(D,'on_date',{d:x.date})):'')+(x.method?' · <span class="sm">'+E(x.method)+'</span>':'')+'</div>':'<div class="dimpw sm">'+E(U(D,'need_data'))+(x.missing&&x.missing.length?': '+E(x.missing.join(', ')):'')+'</div>')+(x.note?'<div class="sm">'+E(x.note)+'</div>':'')+'</div>'}).join('')+'</div><p class="sm">'+E(U(D,'reference_only'))+'</p>'}}
  if(q.msg)h+='<p class="sm dimpw">'+E(q.msg)+'</p>';
  var busy=q.id&&/^(new|in_progress|sending)$/.test(q.status);
  h+='<div class="dact"><button type="button" class="lbtn'+(q.id?' sec':'')+'" data-appr="send"'+(busy||!it.length?' disabled':'')+'>'+E(U(D,q.id?'resend':'send',{n:it.length}))+'</button></div>'+(it.length?'':'<p class="sm">'+E(U(D,'no_items'))+'</p>');
  return h+'</div>'}
 function redraw(D,t){var f=document.getElementById('dform');if(!f)return;var ex=document.getElementById('dappr');if(!on(D,t)){if(ex)ex.remove();return}var hh=html(D,t);if(ex&&ex.dataset.h===hh)return;var el=document.createElement('div');el.innerHTML=hh;el=el.firstChild;el.dataset.h=hh;if(ex){ex.replaceWith(el);return}
  var a=document.getElementById('dimp');if(a)a.after(el);else{a=f.querySelector('#drows')||f.querySelector('.dtbw');if(a&&a.parentNode)a.parentNode.insertBefore(el,a);else f.appendChild(el)}}
 window.ArbAppr={mount:function(t,D){var c=D.cur&&D.cur();if(c&&c.id==t.id)t=c;var first=!LAST||LAST.t.id!==t.id;LAST={t:t,D:D};redraw(D,t);var d=D.draftOf(t.id),q=d&&d._appr;if(first&&q&&q.id&&!RES[q.id])poll(D,t);else arm(D,t)},_items:items,_poll:function(){if(LAST)return poll(LAST.D,LAST.t)}};
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-appr]');if(!b||!LAST)return;e.preventDefault();if(b.dataset.appr=='send')send(LAST.D,LAST.t)},true);
 new MutationObserver(function(){if(!LAST)return;if(document.getElementById('dform')&&!document.getElementById('dappr')){var c=LAST.D.cur&&LAST.D.cur();if(c&&c.id==LAST.t.id)redraw(LAST.D,c)}}).observe(document.documentElement,{childList:true,subtree:true});
})();
