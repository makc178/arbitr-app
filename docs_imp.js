/* Arbitr App · импорт описи из файла (xlsx/csv) в таблицы шаблона. Конфигурация: docs_config.json → inventory_import.
   Цели: templates[i].table_mode = "sections" → tables[].table_schema (строки в drafts[id]._tbl[tableId]); иначе templates[i].table_schema → drafts[id]._rows.
   Колонки файла сопоставляются по label / header / synonyms из index.json; строки с кодом подгруппы («1.3», «2.1») уходят в свой раздел. */
(function(){var ST=null;
 function K(D){return (D.C()||{}).inventory_import||{}}
 function U(D,k,o){var s=(K(D).ui||{})[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function nm(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]/g,'')}
 function on(D,t){var k=K(D);return k.enabled!==false&&t&&(t.file_inputs||[]).indexOf(k.file_input||'inventory')>=0&&targets(t).length>0}
 function targets(t){if(t.table_mode=='sections'&&Array.isArray(t.tables))return t.tables.filter(function(b){return b&&b.mode=='rows'&&Array.isArray(b.table_schema)&&b.table_schema.length}).map(function(b){return {id:b.id,title:b.title||b.id,cols:b.table_schema,codes:(b.subgroups||[]).filter(function(s){return !(s.single_row_fields||[]).length}).map(function(s){return s.code}),sub:b.subgroup_field||null}});
  return Array.isArray(t.table_schema)&&t.table_schema.length?[{id:'_rows',title:t.title,cols:t.table_schema,codes:[],sub:null}]:[]}
 function sc(cell,col){var c=nm(cell);if(!c)return 0;var L=[col.label,col.header].concat(col.synonyms||[]).filter(Boolean).map(nm);if(L.indexOf(c)>=0)return 3;return L.some(function(x){return x.length>=4&&c.length>=4&&(c.indexOf(x)>=0||x.indexOf(c)>=0)})?1:0}
 function mapOf(hdr,cols){var m={},used={};hdr.forEach(function(h,i){var best=null,bs=0;cols.forEach(function(c){var s=sc(h,c);if(s>bs&&!used[c.field]){bs=s;best=c}});if(best){m[i]=best;used[best.field]=1}});return m}
 function hdrRow(rows,T){var bi=0,bs=-1;rows.slice(0,15).forEach(function(r,i){var s=0;T.forEach(function(tg){var m=mapOf(r,tg.cols);s=Math.max(s,Object.keys(m).length)});if(s>bs){bs=s;bi=i}});return bi}
 function xlDate(v){var n=+v;if(/^\d{5}(\.\d+)?$/.test(String(v))&&n>20000&&n<80000){var d=new Date(Math.round((n-25569)*864e5));return ('0'+d.getUTCDate()).slice(-2)+'.'+('0'+(d.getUTCMonth()+1)).slice(-2)+'.'+d.getUTCFullYear()}var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(v));return m?m[3]+'.'+m[2]+'.'+m[1]:v}
 function val(c,v){v=String(v==null?'':v).trim();if(!v)return '';if(c.type=='date')return xlDate(v);if((c.type=='number'||c.type=='money')&&/^-?\d+(\.\d+)?$/.test(v))return c.type=='money'?String(+(+v).toFixed(2)).replace('.',','):v.replace('.',',');return v}
 function codeOf(v,tg){var m=/^\s*(\d+\.\d+)\b/.exec(String(v||''));if(m&&tg.codes.indexOf(m[1])>=0)return m[1];var n=nm(v);return null}
 /* разбор файла → план импорта */
 function plan(D,t,rows){var T=targets(t),hi=hdrRow(rows,T),hdr=rows[hi]||[],skip=(K(D).skip_rows||['^итого','^всего']).map(function(x){return new RegExp(x,'i')});
  var M=T.map(function(tg){return mapOf(hdr,tg.cols)}),def=0,bs=-1;M.forEach(function(m,i){var n=Object.keys(m).length;if(n>bs){bs=n;def=i}});
  var out=T.map(function(){return []}),data=rows.slice(hi+1);
  data.forEach(function(r){if(!r.some(function(x){return String(x||'').trim()}))return;if(skip.some(function(re){return re.test(String(r.find(function(x){return String(x||'').trim()})||'').trim())}))return;
   var ti=def,code=null;T.forEach(function(tg,i){if(code||!tg.sub)return;r.forEach(function(x){if(!code){var c=codeOf(x,tg);if(c){code=c;ti=i}}})});
   var tg=T[ti],m=M[ti],o={},n=0;Object.keys(m).forEach(function(ci){var c=m[ci],v=val(c,r[ci]);if(v!==''){o[c.field]=v;n++}});
   if(tg.sub){if(code)o[tg.sub]=code;else if(!tg.codes.length||tg.codes.indexOf(o[tg.sub])<0)o._nc=1}
   if(n)out[ti].push(o)});
  return {T:T,M:M,def:def,out:out,hdr:hdr,hi:hi}}
 async function readF(f){var P=window.ArbCP&&ArbCP.parse;if(!P)throw new Error('parser');var b=await f.arrayBuffer();return /\.xlsx$/i.test(f.name)?await P.xlsx(b):P.csv(P.dec(b))}
 function box(D,t){var h='<div id="dimp" class="dimp"><div class="d1">'+E(U(D,'title'))+'</div><p class="sm">'+E(U(D,'help'))+'</p><label class="fdrop dlhdrop"><input type="file" id="dimpf" accept=".xlsx,.csv,text/csv"><span>'+E(U(D,'btn'))+'</span></label>';
  if(ST&&ST.t==t.id&&ST.p){var p=ST.p,tot=p.out.reduce(function(a,x){return a+x.length},0);
   h+='<div class="dimpr"><p><b>'+E(ST.name)+'</b> · '+E(U(D,'found',{n:tot}))+'</p>'+p.T.map(function(tg,i){if(!p.out[i].length)return '';var m=p.M[i];return '<div class="dimpt"><div><b>'+E(tg.title)+'</b> — '+E(U(D,'rows',{n:p.out[i].length}))+'</div><div class="sm">'+p.hdr.map(function(h,ci){return h?E(h)+' → '+(m[ci]?E(m[ci].label||m[ci].field):'<i>'+E(U(D,'skip_col'))+'</i>'):''}).filter(Boolean).join(' · ')+'</div>'+(p.out[i].some(function(r){return r._nc})?'<div class="sm dimpw">'+E(U(D,'need_check',{n:p.out[i].filter(function(r){return r._nc}).length}))+'</div>':'')+'</div>'}).join('')+
   (tot?'<div class="dact"><button type="button" class="lbtn" data-imp="add">'+E(U(D,'add',{n:tot}))+'</button><button type="button" class="lbtn sec" data-imp="replace">'+E(U(D,'replace'))+'</button><button type="button" class="lbtn sec" data-imp="cancel">'+E(U(D,'cancel'))+'</button></div>':'<p class="sm dimpw">'+E(U(D,'nothing'))+'</p><div class="dact"><button type="button" class="lbtn sec" data-imp="cancel">'+E(U(D,'cancel'))+'</button></div>')+'</div>'}
  if(ST&&ST.msg&&ST.t==t.id)h+='<p class="sm">'+E(ST.msg)+'</p>';return h+'</div>'}
 function apply(D,t,mode){var p=ST.p,d=D.dra(t.id);p.T.forEach(function(tg,i){var R=p.out[i];if(!R.length)return;if(tg.id=='_rows'){var L=Array.isArray(d._rows)?d._rows:[];L=L.filter(function(r){return Object.keys(r).some(function(k){return k[0]!='_'&&String(r[k]||'').trim()})});d._rows=mode=='replace'?R.slice():L.concat(R)}else{d._tbl=d._tbl||{};var L2=(d._tbl[tg.id]||[]).filter(function(r){return Object.keys(r).some(function(k){return k[0]!='_'&&String(r[k]||'').trim()})});d._tbl[tg.id]=mode=='replace'?R.slice():L2.concat(R)}});
  var n=p.out.reduce(function(a,x){return a+x.length},0);ST={t:t.id,msg:U(D,'done',{n:n})};D.save();D.redraw()}
 var LAST=null;
 window.ArbImp={mount:function(t,D){LAST={t:t,D:D};var f=document.getElementById('dform');if(!f)return;var ex=document.getElementById('dimp');if(!on(D,t)){if(ex)ex.remove();return}
   var html=box(D,t);if(ex&&ex.dataset.h===html)return;var el=document.createElement('div');el.innerHTML=html;el=el.firstChild;el.dataset.h=html;
   if(ex){ex.replaceWith(el);return}var a=f.querySelector('#drows');a=a&&a.previousElementSibling&&a.previousElementSibling.matches('h4')?a.previousElementSibling:a;if(!a)a=f.querySelector('.dtbw');if(!a)a=f.querySelector('.dtbl');
   if(a&&a.parentNode)a.parentNode.insertBefore(el,a);else f.appendChild(el)},
  _plan:plan,_targets:targets};
 document.addEventListener('change',async function(e){if(e.target.id!='dimpf'||!LAST)return;var f=e.target.files[0],D=LAST.D,t=LAST.t;e.target.value='';if(!f)return;
  try{var rows=await readF(f);ST={t:t.id,name:f.name,p:plan(D,t,rows)}}catch(x){ST={t:t.id,msg:U(D,'error')+': '+(x&&x.message||x)}}ArbImp.mount(t,D)},true);
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-imp]');if(!b||!LAST)return;e.preventDefault();var m=b.dataset.imp;if(m=='cancel'){ST=null;ArbImp.mount(LAST.t,LAST.D);return}if(ST&&ST.p)apply(LAST.D,LAST.t,m)},true);
 var MO=null;function watch(){if(MO||!window.MutationObserver)return;MO=new MutationObserver(function(){if(!LAST)return;var f=document.getElementById('dform');if(f&&!document.getElementById('dimp')){var c=LAST.D.cur&&LAST.D.cur();if(c&&c.id==LAST.t.id)ArbImp.mount(c,LAST.D)}});MO.observe(document.body,{childList:true,subtree:true})}
 var _m=ArbImp.mount;ArbImp.mount=function(t,D){watch();var c=D.cur&&D.cur();return _m(c&&c.id==t.id?c:t,D)};
})();
