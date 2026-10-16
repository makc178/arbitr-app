/* Arbitr App · таблицы разделов (index 1.7f: templates[i].table_mode = "sections", templates[i].tables[])
   Строки хранятся в черновике: drafts[id]._tbl[tableId] = [{поле: значение, _nc: 1 — требует проверки}]
   Печать: строки-шаблоны md/docx размножаются под заголовком своей подгруппы (numbering subgroup → 1), 2) …)
   или сквозной нумерацией раздела (numbering section → 3.1, 3.2 …); пустой раздел — таблица «Не имеется» (флаги empty_flag / rows_flag). */
window.ArbTables=function(D){
 function C(){return D.C()||{}}function UI(k,d,o){var s=((C().tables_ui||{})[k])||d;if(o)for(var x in o)s=s.split('{'+x+'}').join(o[x]);return s}
 function E(s){return D.E(s)}
 function TS(t){return t&&t.table_mode=='sections'&&Array.isArray(t.tables)?t.tables.filter(function(b){return b&&b.mode=='rows'&&Array.isArray(b.row_fields)}):[]}
 function on(t){return TS(t).length>0}
 function tb(t,id){return TS(t).find(function(b){return b.id==id})||null}
 function single(b){return (b.subgroups||[]).filter(function(s){return (s.single_row_fields||[]).length})}
 function sgRows(b){return (b.subgroups||[]).filter(function(s){return !(s.single_row_fields||[]).length})}
 function sgl(b){var o=[];single(b).forEach(function(s){o=o.concat(s.single_row_fields)});return o}
 function own(t){var o=[];TS(t).forEach(function(b){o=o.concat(b.row_fields,b.subgroup_field?[b.subgroup_field]:[],sgl(b))});return o}
 function optional(t){var F=D.F();own(t).forEach(function(k){if(F[k])F[k].optional=true});(t.tables||[]).forEach(function(b){if(b.mode=='fields')(b.rows||[]).forEach(function(r){if(r.field&&r.required===false&&F[r.field])F[r.field].optional=true})})}
 function v(x){return String(x==null?'':x).trim()}
 function store(t){var d=D.DRA(t.id);if(!d._tbl||typeof d._tbl!='object'){d._tbl={};migrate(t,d)}return d._tbl}
 function list(t,id){var S=store(t);if(!Array.isArray(S[id]))S[id]=[];return S[id]}
 function isFilled(b,r){return b.row_fields.some(function(k){return v(r[k])})}
 function filled(t,b){return list(t,b.id).filter(function(r){return isFilled(b,r)})}
 function count(t,id){var b=tb(t,id);if(!b)return 0;var n=filled(t,b).length;sgl(b).forEach(function(k){if(v(D.raw(k,t.id)))n++});return n}
 function codeOk(b,c){return sgRows(b).some(function(s){return s.code==c})}
 function rowsFor(t,b,code){var R=filled(t,b);if(!b.subgroup_field||b.numbering!='subgroup')return R;var L=sgRows(b),last=L.length?L[L.length-1].code:null;
  return R.filter(function(r){var c=v(r[b.subgroup_field]);if(!codeOk(b,c))c=last;return c==code})}
 function num(b,n){return String(b.number_format||'{n}').split('{n}').join(n)}
 function rowTable(B,s){return B.find(function(b){return b.row_fields.some(function(k){return s.indexOf('{{'+k+'}}')>=0})})||null}
 function sgSeen(B,c0,sg){B.forEach(function(b){(b.subgroups||[]).forEach(function(s){if(s.code==c0)sg[b.id]=s.code})})}
 /* md: строка-шаблон «| 1) | {{…}} |» */
 function md(s,t){if(!on(t))return s;optional(t);var B=TS(t),sg={},out=[];String(s).split('\n').forEach(function(l){var m=/^\|\s*([^|]*?)\s*\|/.exec(l),c0=m?m[1]:'',b=m?rowTable(B,l):null;
   if(!b){if(m)sgSeen(B,c0,sg);out.push(l);return}
   rowsFor(t,b,b.numbering=='subgroup'?sg[b.id]:null).forEach(function(r,i){out.push(l.replace(/^(\|\s*)[^|]*?(\s*\|)/,'$1'+num(b,i+1)+'$2').replace(/\{\{([^{}]+)\}\}/g,function(mm,k){return b.row_fields.indexOf(k)>=0?String(D.fmt(k,r[k]||'')).replace(/\|/g,'/').replace(/\s*\n\s*/g,' '):mm}))})});
  return out.join('\n')}
 function tx(x){return (x.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(y){return y.replace(/<[^>]+>/g,'')}).join('')}
 /* docx: строка таблицы с полями раздела */
 function xml(x,t){if(!on(t))return x;optional(t);var B=TS(t),sg={};return x.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g,function(tr){var full=tx(tr),tc=/<w:tc>[\s\S]*?<\/w:tc>/.exec(tr),c0=tc?tx(tc[0]).trim():'',b=rowTable(B,full);
   if(!b){sgSeen(B,c0,sg);return tr}
   return rowsFor(t,b,b.numbering=='subgroup'?sg[b.id]:null).map(function(r,i){var c=tr.replace(/(<w:tc>[\s\S]*?<w:t(?:\s[^>]*)?>)[^<]*(<\/w:t>)/,'$1'+D.xe(num(b,i+1))+'$2');
    return c.replace(/\{\{([^{}]+)\}\}/g,function(mm,k){return b.row_fields.indexOf(k)>=0?D.xe(String(D.fmt(k,r[k]||'')).replace(/\s*\n\s*/g,' ')):mm})}).join('')})}
 /* миграция старой описи (одна таблица с графой РАЗДЕЛ или строки 1.7e с полями ОПИСЬ_*) — field_meta.deprecated_aliases_map.РАЗДЕЛ + deprecated_alias полей */
 function migrate(t,d){var old=Array.isArray(d._rows)?d._rows.filter(function(r){return r&&Object.keys(r).some(function(k){return v(r[k])})}):[];if(!old.length||!on(t))return;
  var X=D.X()||{},F=D.F(),AM=(((X.field_meta||{}).deprecated_aliases_map||{}).РАЗДЕЛ||{}),MAP=AM.map||{},nc=0,S=d._tbl;
  old.forEach(function(r){var sec=v(r.РАЗДЕЛ),dest=MAP[sec]||'',m=/^(\w+)(?:\s*\(([\d.]+)\))?/.exec(dest),tid=m&&m[1],sub=m&&m[2];
   if(!tid){TS(t).forEach(function(b){if(!tid&&b.row_fields.some(function(k){return v(r[k])}))tid=b.id})}
   var b=tid&&tb(t,tid);if(!b){(d._tbl_lost=d._tbl_lost||[]).push(r);nc++;return}
   var val=function(k){if(v(r[k]))return v(r[k]);var A=((F[k]||{}).deprecated_alias||[]),hit=A.filter(function(a){return a.when&&sec&&a.when.indexOf('«'+sec+'»')>=0});if(!hit.length)hit=A.filter(function(a){return !a.when||/до v1\.7f/.test(a.when)});
    return hit.map(function(a){return a.field=='РАЗДЕЛ'?'':v(r[a.field])}).filter(Boolean).filter(function(x,i,L){return L.indexOf(x)==i}).join(', ')};
   if(sub){single(b).forEach(function(s){if(s.code!=sub)return;s.single_row_fields.forEach(function(k){var x=val(k);if(x&&!v(d[k]))d[k]=x})});return}
   var n={};b.row_fields.forEach(function(k){var x=val(k);if(x)n[k]=x});if(!isFilled(b,n))return;
   if(b.subgroup_field){var c=v(r[b.subgroup_field]);if(codeOk(b,c))n[b.subgroup_field]=c;else{n._nc=1;nc++}}
   (S[b.id]=S[b.id]||[]).push(n)});
  d._tbl_mig=1;d._rows_v17e=d._rows;delete d._rows;if(nc)(d._needs_check=d._needs_check||[]).push('_tbl')}
 function needsCheck(t){var n=0;TS(t).forEach(function(b){list(t,b.id).forEach(function(r){if(r._nc&&isFilled(b,r))n++})});return n}
 /* форма */
 function html(t){if(!on(t))return '';optional(t);var F=D.F(),d=D.DRA(t.id);store(t);
  var h=d._tbl_mig?'<div class="card dtbmig"><p class="sm">'+E(UI('migrated','Строки старой описи перенесены в таблицы разделов. Проверьте строки, отмеченные жёлтым: подгруппу по старой графе «Раздел» определить нельзя.'))+'</p></div>':'';
  return h+TS(t).map(function(b){var L=list(t,b.id),sf=b.subgroup_field,n=count(t,b.id),TSC={};(b.table_schema||[]).forEach(function(c){if(c.field)TSC[c.field]=c});
   var lab=function(k){return (TSC[k]||{}).label||(F[k]||{}).label||k},req=function(k){return !!(TSC[k]||{}).required};
   var s='<div class="card dtb" data-tbid="'+E(b.id)+'"><h3>'+E(b.title||b.id)+' <span class="sm">'+E(n?UI('count','строк: {n}',{n:n}):UI('none','не имеется'))+'</span></h3>';
   single(b).forEach(function(sg){s+='<div class="dtbr dtbs"><div class="dtbrh"><b>'+E(sg.code+' '+String(sg.label||'').replace(/:$/,''))+'</b></div><div class="g2">'+sg.single_row_fields.map(function(k){var f=Object.assign({k:k,label:lab(k),type:'text'},F[k]||{});return '<div><label for="df_'+E(k)+'">'+E(f.label||k)+'</label>'+D.inp(f,D.raw(k,t.id)||'','df')+'</div>'}).join('')+'</div></div>'});
   L.forEach(function(r,i){var bad=sf&&isFilled(b,r)&&(r._nc||!codeOk(b,v(r[sf])));
    s+='<div class="dtbr'+(bad?' dnc':'')+'"><div class="dtbrh"><b>'+E(UI('row','Строка {n}',{n:i+1}))+'</b>'+(bad?'<span class="dncb">'+E(UI('check','проверить подгруппу'))+'</span>':'')+'<span class="sp"></span><button type="button" class="lbtn sec" data-tbdel="'+E(b.id)+'" data-tbr="'+i+'">'+E(UI('del','Удалить строку'))+'</button></div><div class="g2">';
    if(sf)s+='<div class="dwide"><label for="dt_'+E(b.id)+'_'+i+'_'+E(sf)+'">'+E(lab(sf))+'</label><select id="dt_'+E(b.id)+'_'+i+'_'+E(sf)+'" data-tb="'+E(b.id)+'" data-tbr="'+i+'" data-tbk="'+E(sf)+'"><option value="">'+E(UI('pick','— выберите подгруппу —'))+'</option>'+sgRows(b).map(function(g){return '<option value="'+E(g.code)+'"'+(v(r[sf])==g.code?' selected':'')+'>'+E(g.code+' '+String(g.label||'').replace(/:$/,'').replace(/\*\(\d+\)/g,''))+'</option>'}).join('')+'</select></div>';
    s+=b.row_fields.map(function(k){var c=TSC[k]||{},f=Object.assign({k:k,label:lab(k),type:c.type=='date'?'date':'text'},F[k]&&F[k].type=='textarea'?{type:'textarea'}:{});
     return '<div'+(req(k)&&isFilled(b,r)&&!v(r[k])?' class="empty"':'')+'><label for="dt_'+E(b.id)+'_'+i+'_'+E(k)+'">'+E(f.label)+'</label>'+D.inp(f,r[k]||'','dt_'+b.id+'_'+i).replace('data-k=','data-tb="'+E(b.id)+'" data-tbr="'+i+'" data-tbk=')+'</div>'}).join('');
    s+='</div></div>'});
   if(!n)s+='<p class="sm">'+E(UI('empty','Раздел пуст — в описи будет строка «{t}».',{t:b.empty_row_text||'Не имеется'}))+'</p>';
   return s+'<p><button type="button" class="lbtn sec" data-tbadd="'+E(b.id)+'">'+E(UI('add','Добавить строку'))+'</button></p></div>'}).join('')}
 function set(t,el){var L=list(t,el.dataset.tb),r=L[+el.dataset.tbr];if(!r)return;r[el.dataset.tbk]=el.value;var b=tb(t,el.dataset.tb);if(b&&el.dataset.tbk==b.subgroup_field&&codeOk(b,el.value)){delete r._nc;var d=D.DRA(t.id);if(d._needs_check&&!needsCheck(t))d._needs_check=d._needs_check.filter(function(x){return x!='_tbl'});return true}}
 function add(t,id){list(t,id).push({})}
 function del(t,id,i){list(t,id).splice(+i,1)}
 /* предпросмотр: подряд идущие строки «| … |» → таблица (первая строка — заголовок, строка «|---|» пропускается) */
 function htmlTables(h){return String(h).replace(/(?:<div(?: class="[^"]*")?>\|[^\n]*?\|\s*<\/div>)+/g,function(run){var R=run.match(/<div(?: class="[^"]*")?>\|[^\n]*?\|\s*<\/div>/g)||[],rows=R.map(function(d){return d.replace(/^<div[^>]*>\|/,'').replace(/\|\s*<\/div>$/,'').split('|')});
   if(rows.length<2)return run;var hd=rows[1]&&rows[1].every(function(c){return /^\s*:?-{3,}:?\s*$/.test(c)}),out='<div class="dtbw"><table class="dtbl">';rows.forEach(function(r,i){if(hd&&i==1)return;var tg=hd&&i==0?'th':'td';out+='<tr>'+r.map(function(c){return '<'+tg+'>'+c.trim()+'</'+tg+'>'}).join('')+'</tr>'});return out+'</table></div>'})}
 return {htmlTables:htmlTables,on:on,own:own,count:count,md:md,xml:xml,html:html,set:set,add:add,del:del,needsCheck:needsCheck,store:store}};
