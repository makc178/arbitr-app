/* 1.7h: повторяющиеся группы — нумерация {{@number}} (numbering.start / start_after), подсказки формы (repeat_groups.*.ui),
   поля из другого документа дела (templates[].linked_sources), флаги flag_from {repeat_group, empty} / {field, checked},
   тип boolean, мягкие проверки validations.rule (not_checked, included_without_majority, linked_mismatch).
   Всё по index.json / docs_config.json; названий полей и шаблонов в коде нет. */
window.ArbRG=function(D){
 function E(s){return D.E(s)}
 function U(k,d,o){var s=((D.C().rg_ui||{})[k]);if(s==null)s=d;if(o)for(var x in o)s=String(s).split('{'+x+'}').join(o[x]);return s}
 function v(x){return x===true?'1':x===false||x==null?'':String(x).trim()}
 function truthy(x){return x===true||/^(1|true|да|on|yes)$/i.test(String(x==null?'':x).trim())}
 function G(t){return (t&&t.repeat_groups)||{}}
 function ui(t,g){return (G(t)[g]||{}).ui||{}}
 function flds(t,g){return (G(t)[g]||{}).fields||[]}
 function filled(t,g,it){return !!it&&flds(t,g).some(function(k){var f=D.F()[k]||{};return f.type=='boolean'?false:!!v(it[k])})}
 function skip(t,g,it,n){var mn=+((G(t)[g]||{}).min_items)||0;return n>=mn&&!filled(t,g,it)}
 function pos(t,g,n){var L=D.items(t,g),p=0;for(var i=0;i<n&&i<L.length;i++)if(!skip(t,g,L[i],i))p++;return p}
 function cnt(t,g){var L=D.items(t,g),p=0;L.forEach(function(it,i){if(!skip(t,g,it,i))p++});return p}
 function start(t,g,d){var nb=(G(t)[g]||{}).numbering||{};if(nb.start_after&&G(t)[nb.start_after]&&(d|0)<10)return start(t,nb.start_after,(d|0)+1)+cnt(t,nb.start_after);return nb.start!=null?+nb.start:1}
 function num(t,g,n){return start(t,g)+pos(t,g,n)}
 function numUI(t,g,i){return start(t,g)+i}
 /* ---------- linked_sources ---------- */
 var ST={};
 function LS(t,g){var id=(G(t)[g]||{}).linked_source;if(!id)return null;return (t.linked_sources||[]).find(function(x){return x.id==id||x.field==g})||null}
 function iso(x){x=String(x||'').trim();if(/^\d{2}\.\d{2}\.\d{4}$/.test(x))x=x.split('.').reverse().join('-');return /^\d{4}-\d\d-\d\d$/.test(x)?x:''}
 function dmy(x){var i=iso(x);return i?i.split('-').reverse().join('.'):String(x||'')}
 function cands(t,ls){var c=D.curCase(),cid=c?c.id:'',no=c&&c.data?v(c.data[(ls.match_by||{}).field]):'',o=[];
  (D.metas()||[]).forEach(function(m){if(!m||m.tid!=ls.source_template||!m.rgv||(cid&&m.case!=cid))return;var V=m.rgv;if(no&&V._match&&v(V._match)&&v(V._match)!=no)return;if((V[ls.source_field]||[]).length)o.push({src:'arch',id:m.id,V:V})});
  if(!o.length){var st=D.tpl(ls.source_template);if(st){var sn=snap(st),dr=D.draftOf(ls.source_template)||{};if(sn&&dr._case&&dr._case==cid&&(sn.rgv[ls.source_field]||[]).length)o.push({src:'draft',id:ls.source_template,V:sn.rgv})}}
  return o}
 function pick(t,ls){var o=cands(t,ls);if(!o.length)return null;var P=ls.pick||{},ob=P.order_by||'ДАТА';
  if(P.prefer_equal){var mine=iso(D.raw(P.prefer_equal,t.id))||v(D.raw(P.prefer_equal,t.id));if(mine){var eq=o.filter(function(x){var s=x.V[P.prefer_equal];return s&&(iso(s)||v(s))==mine});if(eq.length)o=eq}}
  o.sort(function(a,b){var x=iso(a.V[ob])||'',y=iso(b.V[ob])||'';return x<y?-1:x>y?1:0});return P.order=='earliest'?o[0]:o[o.length-1]}
 function pull(t,g,L){try{defaults(t,g,L)}catch(e){}var ls=LS(t,g);if(!ls||ls.kind&&ls.kind!='repeat_group')return;var s=pick(t,ls),k=t.id+'|'+g,prev=ST[k]||{};
  if(!s){ST[k]={found:false,ls:ls};return}
  var SI=s.V[ls.source_field]||[],map=ls.item_fields||{},mis=false,ap={};(ls.also_pull||[]).forEach(function(a){ap[a.as||a.source_field]=s.V[a.source_field]});
  if(ls.locked!==false){for(var i=0;i<SI.length;i++){var it=L[i]=L[i]||{};Object.keys(map).forEach(function(h){var nv=v(SI[i][map[h]]);if(v(it[h])&&v(it[h])!=nv)mis=true;it[h]=nv})}
   if(L.length>SI.length){for(var j=SI.length;j<L.length;j++)if(Object.keys(map).some(function(h){return v(L[j][h])}))mis=true;L.length=SI.length}}
  else{mis=SI.length!=L.length||SI.some(function(si,i){return Object.keys(map).some(function(h){return v((L[i]||{})[h])!=v(si[map[h]])})})}
  ST[k]={found:true,ls:ls,src:s,ap:ap,mismatch:mis||prev.mismatch||false}}
 function st(t,g){return ST[t.id+'|'+g]||null}
 function lockedG(t,g){var s=st(t,g);return !!(s&&s.found&&s.ls.locked!==false)}
 function locked(t,g,k){if(!lockedG(t,g))return false;var lf=ui(t,g).locked_fields;return lf?lf.indexOf(k)>=0:Object.keys(st(t,g).ls.item_fields||{}).indexOf(k)>=0}
 /* снимок для архива: шаблон-источник сохраняет значения групп/полей, на которые ссылаются linked_sources других шаблонов */
 function snap(t){var need={},ext={},mb='';(D.X().templates||[]).forEach(function(o){(o.linked_sources||[]).forEach(function(ls){if(ls.source_template!=t.id)return;need[ls.source_field]=ls;(ls.also_pull||[]).forEach(function(a){ext[a.source_field]=1});var P=ls.pick||{};if(P.prefer_equal)ext[P.prefer_equal]=1;ext[P.order_by||'ДАТА']=1;if((ls.match_by||{}).field)mb=ls.match_by.field})});
  if(!Object.keys(need).length)return null;var V={};Object.keys(need).forEach(function(f){var ls=need[f],vals=Object.keys(ls.item_fields||{}).map(function(h){return ls.item_fields[h]});if(G(t)[f]){V[f]=D.items(t,f).filter(function(it,i){return !skip(t,f,it,i)}).map(function(it){var o={};vals.forEach(function(x){o[x]=v(it[x])});return o})}else V[f]=v(D.raw(f,t.id))});
  Object.keys(ext).forEach(function(k){V[k]=v(D.raw(k,t.id))});if(mb)V._match=v(D.raw(mb,t.id));return {rgv:V}}

 /* ---------- 1.7i: вычисляемые поля, база большинства, подписи голосования ---------- */
 function X(){return D.X()||{}}
 function FX(k){return D.F()[k]||(X().fields||{})[k]||{}}
 function CS(k){var f=FX(k);return f.choices&&(X().choice_sets||{})[f.choices]||null}
 function optText(k,val){var cs=CS(k),o=cs&&(cs.options||[]).find(function(o){return o.value==val});return o?(o.text||o.label||''):''}
 function optLabel(k,val){var cs=CS(k),o=cs&&(cs.options||[]).find(function(o){return o.value==val});return o?(o.label||o.text||''):''}
 function chv(it,k){var s=it&&it['_ch_'+k];return s&&Array.isArray(s.v)&&s.v.length?s.v[0]:''}
 function n0(x){var s=String(x==null?'':x).replace(/[\s\u00a0\u202f]/g,'').replace(',','.');if(s===''||isNaN(+s))return null;return +s}
 function nfmt(x){var s=String(Math.round(x*100)/100).split('.');return s[0].replace(/\B(?=(\d{3})+(?!\d))/g,'\u2009')+(s[1]?','+s[1]:'')}
 function gOf(t,k){var g0=null;Object.keys(G(t)).forEach(function(g){if(flds(t,g).indexOf(k)>=0)g0=g});return g0}
 function MRQ(){return X().majority_registry_questions||null}
 /* 1.7j: порт эталона build_templates.py (_suggest, _procedure_options, _apply_option) — сверка на 51 вопросе: arbitr_tests/t17j_suggest */
 function nz(x){return String(x||'').toLowerCase().replace(/ё/g,'е')}
 function rs(p,q){try{return new RegExp(p).test(q)}catch(e){return false}}
 function mdate(t){var M=MRQ()||{},fld=(/^([А-ЯЁA-Z0-9_]+)/.exec(String((M.matching||{}).select_list_by||''))||[])[1]||'ДАТА_СОБРАНИЯ';return iso(D.raw(fld,t.id))||iso(D.raw('ДАТА',t.id))||new Date().toISOString().slice(0,10)}
 function dtype(){var x=D.dt?D.dt():null;return x=='legal'||x=='person'?x:null}
 function mlist(M,d){return M.future&&M.future.valid_from&&d>=M.future.valid_from?M.future:M.current}
 function procOpts(dt,d,PO){PO=PO||X().procedure_options||{};return (((PO.by_debtor_type||{})[dt||'legal'])||[]).filter(function(o){return (!o.valid_from||d>=o.valid_from)&&(!o.valid_until||d<=o.valid_until)})}
 function applyOpt(q,o,PO){PO=PO||X().procedure_options||{};var ap=PO.apply||{},re=new RegExp(ap.replace_pattern||'(о |об )?переход[а-яё]* к следующ[а-яё]* процедур[а-яё]*','i'),m=re.exec(q);
  if(!m)return String(q).replace(/[ .]+$/,'')+(ap.append_separator||' — ')+o.text;var tx=ap.capitalize_if_first!==false&&m.index==0?o.text.charAt(0).toUpperCase()+o.text.slice(1):o.text;return q.slice(0,m.index)+tx+q.slice(m.index+m[0].length)}
 function suggest(q0,d,dt0,M,PO){M=M||MRQ();var R_=function(b,it,w,n,o){return {base:b,item:it?it.id:null,abzac:it?(it.abzac==null?null:it.abzac):null,norm:it?(it.norm==null?null:it.norm):null,norm_short:it?(it.norm_short==null?null:it.norm_short):null,warning:w||null,note:n||null,options:o||[]}};if(!M)return R_('present');
  var q=nz(q0),L=mlist(M,d),dt=dt0||(M.matching||{}).debtor_type_unknown||'legal';
  var it=((L||{}).items||[]).find(function(it){if(it.debtor_types&&it.debtor_types.indexOf(dt)<0)return false;return (it.patterns||[]).some(function(p){return rs(nz(p),q)})&&!(it.exclude_patterns||[]).some(function(x){return rs(nz(x),q)})});
  if(it)return R_('registry',it);var pn=M.procedure_not_named;
  if(pn&&(pn.trigger_patterns||[]).some(function(p){return rs(p,q)})&&!(pn.named_patterns||[]).some(function(p){return rs(p,q)})){var dtp=dt0||pn.debtor_type_unknown;
   if((pn.debtor_types||[]).indexOf(dtp)>=0)return R_(pn.base,null,pn.validation,null,procOpts(dt0,d,PO));
   if(pn.citizen_note&&(pn.citizen_note.debtor_types||[]).indexOf(dtp)>=0)return R_(pn.base,null,null,pn.citizen_note.validation)}
  return R_('present')}
 function sugT(t,text){return suggest(text,mdate(t),dtype())}
 function regQ(t,text){var r=sugT(t,text);return r.base=='registry'?r:null}
 /* гражданин: вопрос о «следующей процедуре» без названия — серая строка (п. 1 ст. 15) */
 function citizenNext(t,text){return !!sugT(t,text).note}
 function normFor(t,it){return nInfo(t,it).norm||''}
/* v1.7l/1.7m: {norm} и {norm_short} — из пункта словаря, совпавшего по тексту вопроса (список по ДАТА_СОБРАНИЯ, тип должника) */
function nInfo(t,it){var qf=(regRule(t)||{}).question_field;if(!t||!it||!qf||it[qf]==null)return {};var rq=regQ(t,it[qf]);return rq?{norm:rq.norm||null,norm_short:rq.norm_short||null}:{}}
var PH=['norm','norm_short'];
function hasN(o){return !!o&&typeof o=='object'&&Object.keys(o).some(function(k){return /_template$/.test(k)&&PH.some(function(p){return String(o[k]).indexOf('{'+p+'}')>=0})})}
function FB(){return U('fill_fallback',{chip:'chip_label'})}
/* точный порт _fill_norm(obj,key,norm,norm_short): шаблон, если все его подстановки есть; иначе запасное поле (chip → chip_label, остальное — поле без _template) */
function fillKey(o,key,v){var tp=o[key+'_template'];if(typeof tp=='string'&&PH.every(function(p){return tp.indexOf('{'+p+'}')<0||v[p]})){PH.forEach(function(p){tp=tp.split('{'+p+'}').join(v[p]||'')});return tp}var fb=FB();return o[(fb&&fb[key])||key]}
function fillN(o,v){if(!hasN(o))return o;v=typeof v=='string'?{norm:v}:(v||{});var r=Object.assign({},o);Object.keys(o).forEach(function(k){var m=/^(.+)_template$/.exec(k);if(m)r[m[1]]=fillKey(o,m[1],v)});return r}
function optF(t,it,o){return hasN(o)?fillN(o,nInfo(t,it)):o}
function msgOf(r,t,it){return (hasN(r)?fillN(r,nInfo(t,it)):r).message||''}
function regRule(t){return (t.validations||[]).map(function(v){return v.rule}).find(function(r){return r&&r.kind=='registry_question_base_present'})||null}
 function genBase(){return ((MRQ()||{}).general_rule||{}).base||'present'}
 function sugOf(t,g,it,k){var r=regRule(t),f=FX(k),cs=CS(k);var def=f.default||(cs&&cs.default)||'';if(r&&r.base_field==k&&flds(t,g).indexOf(r.question_field)>=0){return regQ(t,it[r.question_field])?'registry':(def||genBase())}return def}
 function defaults(t,g,L){flds(t,g).forEach(function(k){if(!CS(k))return;L.forEach(function(it){var c0=chv(it,k);if(c0&&!v(it[k])&&c0!='custom'){var tx=optText(k,c0);if(tx)it[k]=tx}var sg=sugOf(t,g,it,k);if(!sg)return;var cur=chv(it,k),au=(it._auto||{})[k];if(!cur||(au!=null&&cur===au&&cur!==sg)){it['_ch_'+k]={v:[sg],c:''};it[k]=optText(k,sg);(it._auto=it._auto||{})[k]=sg}else if(au==null&&cur===sg)(it._auto=it._auto||{})[k]=sg})})}
 function chosen(t,g,it,k){return chv(it,k)||sugOf(t,g,it,k)}
 function manual(t,g,it,k){var a=(it._auto||{})[k],c=chv(it,k);return !!(c&&a!=null&&c!==a)}
 function baseKeyOf(t,g,it,spec){return spec.base_fixed||(spec.base_by?chosen(t,g,it,spec.base_by.field):'')||''}
 function baseVal(t,g,it,s){var key='',bf='';if(s.base)bf=s.base;else if(s.base_by){key=chosen(t,g,it,s.base_by.field);bf=s.base_by.bases[key]}else if(s.bases){key=s.base_fixed||chosen(t,g,it,s.base_field);bf=s.bases[key]}else if(s.base_field){bf=s.base_field;key=s.base_fixed||''}return {key:key,field:bf,v:bf?n0(D.raw(bf,t.id)):null}}
 function pct(v,b,c){if(v==null||!b)return null;var r=c.round!=null?+c.round:1,m=Math.pow(10,r),x=Math.floor(v*100*m/b+0.5+1e-9)/m;return x.toFixed(r).replace('.',c.decimal_separator||',')}
 function calc(k,tid){var p=String(k).split('#'),t=D.tpl(tid),c=t&&t.calculated_fields&&t.calculated_fields[p[0]];if(!c)return null;
  if(c.formula&&c.formula!='percent')return null;var it=null,g=c.scope&&c.scope!='document'?c.scope:null;if(g){if(p.length<2)return '';it=D.items(t,g)[+p[1]];if(!it)return ''}
  var num=n0(it?it[c.numerator]:D.raw(c.numerator,tid)),bv=baseVal(t,g,it||{},c).v;var r=pct(num,bv,c);return r==null?'':r}
 function isCalc(t,k){return !!(t&&t.calculated_fields&&t.calculated_fields[k])}
 /* правила 1.7i */
 function getv(t,it,k){return it&&it[k]!=null&&String(it[k]).trim()!==''?it[k]:D.raw(k,t.id)}
 function rules2(t,g,it,R){var thr=function(v,b){return v!=null&&b?v*2<=b:false};
  if(R.kind=='adopted_without_majority'){var sel=chv(it,R.field);if(sel!=R.equals)return false;var bv=baseVal(t,g,it,R);return thr(n0(it[R.votes_field]),bv.v)}
  if(R.kind=='included_without_majority'&&R.votes_field){var s2=chv(it,R.field);if(s2!=R.equals&&v(it[R.field])!=R.equals)return false;var b2=R.base_field?n0(D.raw(R.base_field,t.id)):null;return thr(n0(it[R.votes_field]),b2)}
  if(R.kind=='sum_exceeds'){var sm=0,any=false;(R.fields||[]).forEach(function(k){var x=n0(getv(t,it,k));if(x!=null){sm+=x;any=true}});var lim=n0(getv(t,it,R.limit_field));return any&&lim!=null&&sm>lim}
  if(R.kind=='field_exceeds'){var a=n0(getv(t,it,R.field)),b=n0(getv(t,it,R.limit_field));return a!=null&&b!=null&&a>b}
  if(R.kind=='procedure_not_named')return false;
  if(R.kind=='registry_question_base_present'){return !!regQ(t,it[R.question_field])&&chosen(t,g,it,R.base_field)==genBase()}
  if(R.kind=='equals'){var cv=CS(R.field)?chosen(t,g,it,R.field):v(it[R.field]);return cv==R.equals}
  return null}
 function docRules(t){var o=[];(t.validations||[]).forEach(function(r){if(!r.rule||(r.scope&&r.scope!='document'))return;if(rules2(t,null,{},r.rule))o.push(r)});return o}
 /* миграция: проценты → голоса (deprecated_aliases_map.convert, deprecated_item_aliases_map) */
 function conv(m,d,it,to,val){var c=m.convert||{},pv=n0(val),bf=null;
  if(c.base_fixed){var cs=(X().choice_sets||{}).majority_base;var o=cs&&(cs.options||[]).find(function(x){return x.value==c.base_fixed});bf=o&&o.base_field}
  else if(c.base_by){var cs2=CS(c.base_by),dv=chv(it,c.base_by)||FX(c.base_by).default||(cs2&&cs2.default);var o2=cs2&&(cs2.options||[]).find(function(x){return x.value==dv});bf=o2&&o2.base_field}
  var bv=null;if(bf){bv=n0(d[bf]);if(bv==null)((X().fields||{})[bf]||{}).deprecated_alias&&(X().fields[bf].deprecated_alias||[]).forEach(function(a){if(bv==null&&d[a.field]!=null)bv=n0(d[a.field])})}
  (it[c.legacy_key||'_legacy']=it[c.legacy_key||'_legacy']||{})[m.from||to]=val;if(pv!=null&&bv)it[to]=String(Math.floor(pv*bv/100+0.5));
  if(c.needs_check!==false||m.needs_check)(it._needs_check=it._needs_check||[]).indexOf(to)<0&&(it._needs_check=it._needs_check||[]).push(to)}
 function migItems(tid,d){var M=((X().field_meta||{}).deprecated_item_aliases_map||{})[tid];if(!M||!d||!d._rg)return;Object.keys(M).forEach(function(g){(d._rg[g]||[]).forEach(function(it){Object.keys(M[g]).forEach(function(old){var m=M[g][old];if(it&&!m.convert&&it['_ch_'+old]&&it['_ch_'+m.to]==null){it['_ch_'+m.to]=it['_ch_'+old];delete it['_ch_'+old]}if(!it||it[old]==null||m.to==old)return;var val=it[old];delete it[old];if(!String(val).trim())return;if(it[m.to]!=null&&String(it[m.to]).trim()){(it._legacy=it._legacy||{})[old]=val;return}if(m.convert)conv(Object.assign({from:old},m),d,it,m.to,val);else{it[m.to]=val;if(it['_ch_'+old]){it['_ch_'+m.to]=it['_ch_'+old];delete it['_ch_'+old]}if(it._auto&&it._auto[old]!=null){it._auto[m.to]=it._auto[old];delete it._auto[old]}if(m.needs_check)(it._needs_check=it._needs_check||[]).push(m.to)}})})})}
 /* ---------- флаги и проверки ---------- */
 function flag(t,ff,src){if(!ff)return null;if(ff.repeat_group){var n=G(t)[ff.repeat_group]?D.items(t,ff.repeat_group).filter(function(it){return filled(t,ff.repeat_group,it)}).length:0;return ff.empty===false?n>0:n==0}
  if(ff.field&&ff.checked!=null){var x=src&&src[ff.field]!=null?src[ff.field]:D.raw(ff.field,t.id);return truthy(x)==!!ff.checked}return null}
 function rules(t,g,it){var o=[];(t.validations||[]).forEach(function(r){var R=r.rule;if(!R||r.scope&&r.scope!=g)return;
  if(R.kind=='not_checked'&&!truthy(it[R.field]))o.push({id:r.id,msg:msgOf(r,t,it)});
  var r2=rules2(t,g,it,R);if(r2!=null){if(r2)o.push({id:r.id,msg:msgOf(r,t,it)});return}
  if(R.kind=='included_without_majority'){var ch=D.chVals(it,R.field,t),p=parseFloat(String(it[R.percent_field]||'').replace(',','.'));if((ch.indexOf(R.equals)>=0||v(it[R.field])==R.equals)&&!isNaN(p)&&p<=+R.max)o.push({id:r.id,msg:r.message||''})}});return o}
 function gRules(t,g){var o=[],s=st(t,g);(t.validations||[]).forEach(function(r){var R=r.rule;if(R&&R.kind=='linked_mismatch'&&(r.scope||g)==g&&s&&s.found&&s.mismatch)o.push(r.message||(s.ls.on_mismatch||{}).message||'')});if(s&&s.found&&s.mismatch&&!o.length&&s.ls.on_mismatch)o.push(s.ls.on_mismatch.message||'');return o}
 function reqItems(t){var o=[],F=D.F();Object.keys(G(t)).forEach(function(g){D.items(t,g).forEach(function(it,i){if(skip(t,g,it,i))return;flds(t,g).forEach(function(k){if(F[k]&&F[k].required&&!locked(t,g,k)&&D.fieldOn(t,g,it,k))o.push(k+'#'+i)})})});return o}
 /* ---------- форма ---------- */
 function head(t,g){var u=ui(t,g),s=st(t,g),h='';
  if(s&&s.found&&s.ls.locked!==false){var dt=dmy((s.ap||{}).source_date||s.src.V[(s.ls.pick||{}).order_by||'ДАТА']||'');h+='<div class="drglock sm" role="note">'+E(String(u.lock_note||U('lock_note','Из документа от {{ДАТА}} · изменить можно только там')).split('{{ДАТА}}').join(dt))+(u.link_to_source?' · <button type="button" class="link" data-rglink="'+E(s.ls.source_template)+'">'+E(U('open_source','Открыть {t}',{t:(D.tpl(s.ls.source_template)||{}).title||''}))+'</button>':'')+'</div>'}
  else if(s&&!s.found&&s.ls.on_missing)h+='<div class="dlw drgw" role="status">'+E(s.ls.on_missing.message||'')+'</div>';
  gRules(t,g).forEach(function(m){h+='<div class="dlw drgw" role="status">'+E(m)+'</div>'});
  if(u.hint)h+='<p class="sm drghint">'+E(u.hint)+'</p>';return h}
 function addBtn(t,g,dflt){var u=ui(t,g);if(u.add_button===null&&u.hasOwnProperty('add_button'))return '';if(lockedG(t,g))return '';var hide=u.show_add_after=='first_item_filled'&&!firstOk(t,g);
  return '<button type="button" class="btn ghost drgadd" data-rgadd="'+E(g)+'"'+(u.show_add_after?' data-rgshow="'+E(u.show_add_after)+'"':'')+(hide?' hidden':'')+'>'+E(u.add_button||dflt||'+ Добавить')+'</button>'}
 function firstOk(t,g){var L=D.items(t,g);return !!(L[0]&&v(L[0][flds(t,g)[0]]))}
 function removable(t,g,i){var u=ui(t,g);if(u.removable_items===false||lockedG(t,g))return false;return true}
 function dom(t){if(!t)return;try{if(window.ArbExt&&ArbExt.prefill)ArbExt.prefill(t,D)}catch(e){}Object.keys(G(t)).forEach(function(g){var pa=(((D.C().v17||{}).groups||{})[g]||{}).place_after_first||[];if(pa.length)document.querySelectorAll('#drg_'+CSS.escape(g)+' .drgi').forEach(function(it){var fs=it.querySelector('.drgfs');if(!fs)return;var f0=fs.firstElementChild;pa.slice().reverse().forEach(function(k){var w=fs.querySelector('[data-w^="'+k+'#"]');if(w&&f0&&w!==f0&&f0.nextElementSibling!==w)f0.after(w)})});document.querySelectorAll('[data-rgadd="'+g+'"][data-rgshow="first_item_filled"]').forEach(function(b){b.hidden=!firstOk(t,g)})});
  try{votesDom(t)}catch(e){if(window.console)console.warn(e)}
  try{procDom(t)}catch(e){if(window.console)console.warn(e)}
  var mu=(t.validations||[]).filter(function(v){return v.level=='info'||(v.ui||{}).style=='muted'}).map(function(v){return String(v.message||'').trim()}).filter(Boolean);if(mu.length)document.querySelectorAll('#dform .drgw,#dform .dlw').forEach(function(x){if(mu.indexOf(x.innerText.trim())>=0)x.classList.add('dmuted')});
  var sn=snap(t),c=D.curCase();if(sn&&c){var d=D.draftOf(t.id);if(d&&d._case!=c.id){d._case=c.id;D.save()}}}

 /* ---------- 1.7i: подписи голосования на форме (только экран) ---------- */
 var TRY={};document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-fl="dl"],[data-fl="signsave"]');if(b&&D.cur()){TRY[D.cur().id]=1;setTimeout(function(){dom(D.cur())},0)}},true);
 function P(){return (D.C().protocol)||{}}
 function W(k,i){return document.querySelector('#dform [data-w="'+k+(i!=null?'#'+i:'')+'"]')}
 function bars(t,g){var u=ui(t,g),o=[];['majority_bar','majority_bar_merits'].forEach(function(n){if(u[n])o.push(u[n])});return o}
 function majOk(v,b,thr){return v*100>(thr==null?50:+thr)*b}
 function votesDom(t){var CF=t.calculated_fields||{},hide=U('hide_calculated',true)!==false;
  document.querySelectorAll('#dform .dvcap,#dform .dvdoc').forEach(function(x){x.remove()});
  Object.keys(CF).forEach(function(ck){var c=CF[ck];if(!c.scope||c.scope=='document'){var w=W(ck);if(w)w.querySelectorAll('input').forEach(function(i){i.readOnly=true;var cv=calc(ck,t.id);if(i.value!==cv)i.value=cv})}});
  Object.keys(G(t)).forEach(function(g){var L=D.items(t,g),B=bars(t,g),mv=U('move_into_group',{})[g]||[];
   if(mv.length){var card=document.getElementById('drg_'+g);if(card){var box=card.querySelector('.dvpair');if(!box){box=document.createElement('div');box.className='dvpair g2';var h3=card.querySelector('h3');var after=card.querySelector('.drglock')||h3;after.after(box)}mv.forEach(function(k){var w=W(k);if(w&&w.parentNode!==box)box.appendChild(w)})}}
   L.forEach(function(it,i){var byBase={},SUM=[];
    Object.keys(CF).forEach(function(ck){var c=CF[ck];if(c.scope!=g)return;var cw=W(ck,i);if(cw)cw.style.display=hide?'none':'';var w=W(c.numerator,i);if(!w)return;
     var bv=baseVal(t,g,it,c),vv=n0(it[c.numerator]),pc=pct(vv,bv.v,c),bar=B.find(function(b){return b.votes_field==c.numerator}),h='';
     (byBase[JSON.stringify(c.base_by||c.base)]=byBase[JSON.stringify(c.base_by||c.base)]||[]).push(w);
     
     var lab0='',key0='';if(bar){key0=bv.key||bar.base_fixed||'';lab0=bar['label_'+key0]||optLabel(bar.base_field,key0)||''}
     h+='<span class="dvp">'+E((pc!=null?pc:'—')+' %')+'</span>';
     if(vv!=null&&bv.v!=null)h+=' <span class="dvraw">· '+E(nfmt(vv))+' '+E(U('of','из'))+' '+E(nfmt(bv.v))+'</span>';
     var sm='';if(bar){var lb=lab0.replace(/^%\s*/,''),bo=!bar.base_fixed&&bar.base_field?(CS(bar.base_field)&&(CS(bar.base_field).options||[]).find(function(o){return o.value==key0})):null,full='';if(bo&&hasN(bo)){var bf=optF(t,it,bo);if(bf.chip)lb=bf.chip;if(bo.label_template&&bf.label!==bo.label)full=bf.label}
      sm+=bar.base_field&&!bar.base_fixed?'<button type="button" class="dvchip" data-rgbase="'+E(bar.base_field)+'" data-gg="'+E(g)+'" data-gi="'+i+'" title="'+E(full?U('chip_title','{full}. {toggle}').split('{full}').join(full).split('{toggle}').join(U('base_toggle','Сменить базу')):U('base_toggle','Сменить базу'))+'">'+E(U('base_prefix','База: ')+lb)+'</button>':'<span class="dvchip fixed">'+E(U('base_prefix','База: ')+lb)+'</span>';
      if(bar.base_field&&manual(t,g,it,bar.base_field))sm+='<span class="dvman"><i class="dreqm"></i>'+E(U('manual','Изменено вручную'))+'</span>';
      if(vv!=null&&bv.v){var ok=majOk(vv,bv.v,bar.threshold_pct);sm+='<span class="dvres '+(ok?'ok':'no')+'">'+E(ok?U('majority_yes','Большинство есть'):(bar.base_fixed?U('majority_no_fixed','Нет большинства от реестра · п. 2 ст. 15'):U('majority_no','Нет большинства')))+'</span>';
       if(P().majority_bar){var x=Math.max(0,Math.min(100,vv*100/bv.v));sm+='<div class="dmbar" role="img" aria-label="'+E(pc+' %')+'"><i style="width:'+x.toFixed(1)+'%"></i><b style="left:'+(+bar.threshold_pct||50)+'%"></b><span>'+E(U('bar_tick','> 50 %'))+'</span></div>'}}
      SUM.push({w:w,h:sm,f:bar&&full||''})}
     var d=document.createElement('div');d.className='dvcap sm';d.innerHTML=h;w.appendChild(d)});
    Object.keys(byBase).forEach(function(k){var ws=byBase[k];if(ws.length<2||ws[0].parentNode.classList.contains('dvotes'))return;var box=document.createElement('div');box.className='dvotes dwide';ws[0].before(box);ws.forEach(function(w){box.appendChild(w)})});
    SUM.forEach(function(x){var host=x.w.parentNode&&x.w.parentNode.classList.contains('dvotes')?x.w.parentNode:x.w,d=document.createElement('div');d.className='dvcap dvsum';d.innerHTML=x.h;host.after(d);if(x.f&&U('full_line',true)!==false){var fl=document.createElement('div');fl.className='dvcap dvfull';fl.textContent=x.f;d.after(fl)}});
    var bad=TRY[t.id]&&(t.validations||[]).some(function(r){return r.rule&&r.rule.kind=='sum_exceeds'&&r.scope==g&&rules2(t,g,it,r.rule)});
    (t.validations||[]).forEach(function(r){if(!r.rule||r.rule.kind!='sum_exceeds'||r.scope!=g)return;var hit=TRY[t.id]&&rules2(t,g,it,r.rule);(r.rule.fields||[]).forEach(function(k){var w=W(k,i);if(w)w.classList.toggle('dvbad',!!hit)})})})});
  docRules(t).forEach(function(r){var w=W((r.fields||[])[0]);if(!w)return;var d=document.createElement('div');d.className='dvdoc dlw';d.setAttribute('role','status');d.textContent=r.message||'';w.after(d)})}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-rgbase]');if(!b||!D.cur())return;e.preventDefault();var t=D.cur(),g=b.dataset.gg,it=D.items(t,g)[+b.dataset.gi],k=b.dataset.rgbase;if(!it)return;var bar=bars(t,g).find(function(x){return x.base_field==k})||{},keys=Object.keys(bar.bases||{});if(keys.length<2)return;var cur=chosen(t,g,it,k),nv=keys[(keys.indexOf(cur)+1)%keys.length];it['_ch_'+k]={v:[nv],c:''};it[k]=optText(k,nv);D.save();if(D.redraw)D.redraw();else dom(t)});

 /* 1.7j: «следующая процедура» без названия — строка с ⓘ под вопросом, чипы procedure_options (validations[].ui) */
 function procDom(t){document.querySelectorAll('#dform .dpnn').forEach(function(x){x.remove()});
  var seen={};(t.validations||[]).forEach(function(v){var R=v.rule;if(!R||R.kind!='procedure_not_named'||seen[v.scope])return;seen[v.scope]=1;if(v.level=='info'){var w0=(t.validations||[]).find(function(x){return x.rule&&x.rule.kind=='procedure_not_named'&&x.scope==v.scope&&x.level!='info'});if(w0)v=w0,R=v.rule}var g=v.scope,qf=R.question_field||'ВОПРОС',u=v.ui||{};if(!G(t)[g])return;
   D.items(t,g).forEach(function(it,i){var w=W(qf,i);if(!w)return;var q=v_(it[qf]);if(!q)return;var r=sugT(t,q),h='';
    if(r.warning){var ed=u.chips_editable!==false&&!locked(t,g,qf);h='<div class="dpnn dpwarn" role="status"><span class="dpi" aria-hidden="true">ⓘ</span><span>'+E(v.message||'')+'</span></div>';
     if(r.options.length)h+='<div class="dpnn dpchips" role="group" aria-label="'+E(U('chips_label','Процедура'))+'">'+r.options.map(function(o,k){return '<button type="button" class="dvchip dpchip" data-rgchip="'+k+'" data-gg="'+E(g)+'" data-gi="'+i+'" data-qf="'+E(qf)+'"'+(ed?'':' disabled')+' title="'+E(o.norm||'')+'">'+E(o.label||o.text)+'</button>'}).join('')+(!ed&&u.edit_in?' <button type="button" class="link sm" data-rglink="'+E(u.edit_in)+'">'+E(U('chips_edit_in','Указать в уведомлении'))+'</button>':'')+'</div>'}
    else if(r.note){var pn=(MRQ()||{}).procedure_not_named||{},cn=pn.citizen_note||{},nv=(t.validations||[]).find(function(x){return x.id==r.note})||{},txt=cn.text||nv.message||'';if(txt)h='<div class="dpnn dpgrey sm" role="note">'+(cn.icon?'<span class="dpi" aria-hidden="true">ⓘ</span>':'')+'<span>'+E(txt)+'</span></div>'}
    if(h)w.insertAdjacentHTML('beforeend',h)})})}
 function v_(x){return String(x==null?'':x).trim()}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-rgchip]');if(!b||b.disabled||!D.cur())return;e.preventDefault();var t=D.cur(),g=b.dataset.gg,it=D.items(t,g)[+b.dataset.gi],qf=b.dataset.qf;if(!it)return;var r=sugT(t,it[qf]),o=r.options[+b.dataset.rgchip];if(!o)return;it[qf]=applyOpt(String(it[qf]||''),o);D.items(t,g);D.save();if(D.redraw)D.redraw();else dom(t)});
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-rglink]');if(b){e.preventDefault();D.open(b.dataset.rglink)}});
 return {fillN:fillN,optF:optF,normFor:normFor,msgOf:msgOf,suggest:suggest,procOpts:procOpts,applyOpt:applyOpt,calc:calc,conv:conv,migItems:migItems,docRules:docRules,regQ:regQ,isCalc:isCalc,numUI:numUI,num:num,skip:skip,pull:pull,snap:snap,flag:flag,rules:rules,reqItems:reqItems,head:head,addBtn:addBtn,removable:removable,locked:locked,dom:dom,truthy:truthy,state:st}};
