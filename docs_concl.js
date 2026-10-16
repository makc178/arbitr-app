/* Arbitr App — подсказки ВЫВОД_* из финанализа (docs_config.json → conclusions; строки состояний — prefill_ui).
   Правила (спецификация Юридического консультанта 16.10.2026): нет данных → пусто; неизвестный тип должника = юрлицо;
   неблагоприятные варианты — только по явному признаку в данных; ручной выбор не перезаписывается.
   ArbConcl.evaluate(result, ctx, vyvod_autofill, cfg) — чистая функция (юнит-тесты); ArbConcl.mount(t, D) — UI. */
(function(){var MEMO={},BUSY={},LAST=null;
 function A(x){return Array.isArray(x)}
 function N(x){return typeof x=='number'&&isFinite(x)?x:(typeof x=='string'&&x.trim()!==''&&isFinite(+x)?+x:null)}
 function iso(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[0]:''}
 function fmtN(v){return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
 function no(id,step){return {v:null,why:id||'no_data',step:step||''}}
 function nodata(r){return !r||!Object.keys(r).length}
 /* 1.7q: общий интерпретатор vyvod_autofill — условия шагов when (все — И), операторы ops, комбинаторы any/not, ключи key_syntax, порядок поиска resolve, вычисляемые derived.
    Логики правил в коде нет: всё — из documents/index.json. Эталон — _eval_autofill (build_templates.py), проверка — tests/vyvod_autofill_fixtures.json. */
 var MISS={},HOP=function(o,k){return Object.prototype.hasOwnProperty.call(o,k)};
 function anum(v){if(v===null||v===undefined||typeof v=='boolean')return null;if(typeof v=='number')return isFinite(v)?v:null;if(typeof v=='string'&&v.trim()){var t=v.trim();if(!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t))return null;var x=+t;return isFinite(x)?x:null}return null}
 function isoD(v){var m=typeof v=='string'&&/^(\d{4})-(\d\d)-(\d\d)/.exec(v);return m?m[0]:null}
 function minusY(d,y){var Y=+d.slice(0,4)-y,M=d.slice(5,7),Dd=d.slice(8,10);if(M=='02'&&Dd=='29'&&!(Y%4==0&&(Y%100!=0||Y%400==0)))Dd='28';return ('000'+Y).slice(-4)+'-'+M+'-'+Dd}
 function isObj(o){return o!==null&&typeof o=='object'&&!A(o)}
 function eq(a,b){if((typeof a=='boolean')!==(typeof b=='boolean')||(typeof a=='string')!==(typeof b=='string'))return false;if(a!==null&&b!==null&&typeof a=='object'&&typeof b=='object')return JSON.stringify(a)===JSON.stringify(b);return a===b}
 function walk(o,segs){for(var i=0;i<segs.length;i++){var p=segs[i];if(isObj(o)){if(!HOP(o,p))return MISS;o=o[p]}else if(A(o)&&/^\d+$/.test(p)&&+p<o.length)o=o[+p];else return MISS}return o}
 function View(r,ctx,va){this.r=isObj(r)?r:{};this.x=isObj(ctx)?ctx:{};this.va=va||{};this.cf=((this.va.resolve||{}).ctx_first)||[];
  var t=this.raw(['debtor_type']);t=typeof t=='string'?t.trim().toLowerCase():null;this.derived={debtor_type_norm:({person:'person',citizen:'person',individual:'person',legal:'legal'})[t]||this.va.debtor_type_unknown||'legal'};
  var st={},S=this.va.settings||{};Object.keys(S).forEach(function(k){var v=S[k];st[k]=isObj(v)?v.value:v});var xs=this.x.settings;if(isObj(xs))Object.keys(xs).forEach(function(k){var v=xs[k];st[k]=isObj(v)?v.value:v});this.settings=st}
 View.prototype.raw=function(segs){var h=segs[0];if(this.cf.indexOf(h)>=0&&HOP(this.x,h))return walk(this.x,segs);if(HOP(this.r,h))return walk(this.r,segs);if(HOP(this.x,h))return walk(this.x,segs);return MISS};
 View.prototype.lastYear=function(){var ys=this.get('financial_state.years');if(!A(ys)||!ys.length)return MISS;var a=ys.map(String).sort();return a[a.length-1]};
 View.prototype.get=function(key){var segs=String(key||'').split('.');if(segs.indexOf('<last_year>')>=0){var ly=this.lastYear();if(ly===MISS)return MISS;segs=segs.map(function(x){return x=='<last_year>'?ly:x})}
  var v=HOP(this.derived,segs[0])?walk(this.derived,segs):this.raw(segs);return v===null||v===undefined?MISS:v};
 function emptyV(v){return v===MISS||(A(v)&&!v.length)||(typeof v=='string'&&!v.trim())}
 var OPS={
  exists:function(v){return v!==MISS},missing:function(v){return v===MISS},empty:function(v){return emptyV(v)},
  not_empty:function(v){return !emptyV(v)},'==':function(v,c){return eq(v,c.value)},'!=':function(v,c){return !eq(v,c.value)},
  'in':function(v,c){return (c.value||[]).some(function(e){return eq(v,e)})},not_in:function(v,c){return !(c.value||[]).some(function(e){return eq(v,e)})},
  is_number:function(v){return anum(v)!=null},
  is_iso_date:function(v){var m=typeof v=='string'&&/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);if(!m)return false;var y=+m[1],mo=+m[2],d=+m[3];if(y<1||mo<1||mo>12||d<1)return false;return d<=[31,(y%4==0&&(y%100!=0||y%400==0))?29:28,31,30,31,30,31,31,30,31,30,31][mo-1]},
  any_eq:function(v,c){if(!A(v))return false;var f=c.field;return v.some(function(e){return isObj(e)&&HOP(e,f)&&eq(e[f],c.value)})},
  none_in:function(v,c){if(!A(v))return false;var f=c.field;return !v.some(function(e){return isObj(e)&&HOP(e,f)&&(c.value||[]).some(function(x){return eq(e[f],x)})})},
  date_before_minus_years:function(v,c,w){var a=isoD(v),b=isoD(w.get(c.ref||''));if(!a||!b||typeof c.years!='number'||c.years%1)return false;return a<=minusY(b,c.years)},
  last_year_ratio_lt:function(v,c,w){var ly=w.lastYear();if(!isObj(v)||ly===MISS||!isObj(v[ly]))return false;var a=anum(v[ly][c.name]),b=HOP(c,'value')?anum(c.value):anum(w.settings[c.value_setting]);return a!=null&&b!=null&&a<b}};
 ['>','>=','<','<='].forEach(function(o){OPS[o]=function(v,c,w){var a=anum(v),b=HOP(c,'ref')?anum(w.get(c.ref)):anum(c.value);if(a==null||b==null)return false;return o=='>'?a>b:o=='>='?a>=b:o=='<'?a<b:a<=b}});
 var ON_MISS={exists:1,missing:1,empty:1};
 function op(c,w){var f=OPS[c.op];if(!f)return false;var v=w.get(c.key||'');if(v===MISS&&!ON_MISS[c.op])return false;return !!f(v,c,w)}
 function cond(c,w){if(!isObj(c))return false;if('any' in c)return A(c.any)&&c.any.some(function(x){return cond(x,w)});if('not' in c)return !cond(c.not,w);return op(c,w)}
 function isElse(s){return /^\s*иначе/i.test(String(s.if||''))}
 function stepHit(s,w){return A(s.when)?s.when.every(function(c){return cond(c,w)}):isElse(s)}
 /* как _eval_autofill: {step, v|null, why|null} — первый шаг, у которого выполнены все условия when */
 function evalField(k,r,ctx,va){va=va||{};var fr=(va.fields||{})[k];if(!fr)return {step:null,v:null,why:null};var w=new View(r,ctx,va),S=fr.steps||[];
  for(var i=0;i<S.length;i++){var s=S[i];if(!stepHit(s,w))continue;
   if(s.then=='empty')return {step:s.id,v:null,why:s.reason||null};
   /* в документ — только строка/число (эталон напечатал бы repr списка/bool) */
   if(s.then=='text'){var t=w.get(s.text_from||'');t=(typeof t=='string'||typeof t=='number')?String(t).trim():'';return t?{step:s.id,v:t,text:true,why:null}:{step:s.id,v:null,why:s.reason||'no_conclusion'}}
   if((fr.never_auto||[]).indexOf(s.then)>=0)return {step:s.id,v:null,why:'finding_manager_decides'};
   return {step:s.id,v:s.then,why:null,hint:s.hint||''}}
  return {step:null,v:null,why:null}}
 function evaluate(r,ctx,VA,CF){var out={};VA=VA||{};CF=CF||{};ctx=ctx||{};var sf=CF.sufficiency_field||'ВЫВОД_ДОСТАТОЧНОСТЬ',th=(VA.settings||{}).fiktivnoe_ratio_threshold||{},noRes=!isObj(r)||!Object.keys(r).length;
  Object.keys(VA.fields||{}).forEach(function(k){var x=evalField(k,r||{},ctx,VA);
   if(x.v==null&&!x.why)x.why='no_data';
   /* нет result.json вовсе — «нет результата финанализа» (кроме достаточности и шагов, решённых по ctx) */
   if(noRes&&k!=sf&&x.v==null&&!ctx.applicant)x.why='no_data';
   if(k==sf&&x.v!=null){var w=new View(r||{},ctx,VA),a=anum(w.get('assets_liquid')),e=anum(w.get('expenses_estimate')),H=(CF.ui||{}).suff_hint||{};if(a!=null&&e!=null&&H[x.v])x.hint=String(H[x.v]).split('{a}').join(fmtN(a)).split('{x}').join(fmtN(e))}
   /* подпись порога «по практике» — у результата, до которого дошли через шаг с last_year_ratio_lt */
   var SS=VA.fields[k].steps||[],ri=SS.findIndex(function(s){return JSON.stringify(s.when||[]).indexOf('last_year_ratio_lt')>=0}),xi=SS.findIndex(function(s){return s.id==x.step});
   if(x.v!=null&&th.label&&ri>=0&&xi>ri&&!x.hint)x.hint=String((CF.ui||{}).threshold_hint||'{l}').split('{l}').join(th.label);
   out[k]=x});return out}
 window.ArbConcl={evaluate:evaluate,_field:evalField,_cond:function(c,r,ctx,va){return cond(c,new View(r,ctx,va))},_ops:OPS};
 if(typeof document=='undefined')return;
 /* ---- UI ---- */
 function CF(D){return ((D.C()||{}).conclusions)||{}}
 /* поля ВЫВОД_* и наборы вариантов — из index.json → vyvod_autofill.fields */
 function FLD(D){var VA=(D.X()||{}).vyvod_autofill||{},sf=CF(D).sufficiency_field||'ВЫВОД_ДОСТАТОЧНОСТЬ',o={};Object.keys(VA.fields||{}).forEach(function(k){var f=VA.fields[k]||{};o[k]={choices:f.kind=='text'?null:(f.choice_set||null),rule:k==sf?'sufficiency':''}});return o}
 function neutral(D,c,v){var o=c.choices&&opt(D,c.choices,v);return !!(o&&o.ui&&o.ui.style=='neutral')}
 function PU(D,k){var u=((D.C()||{}).prefill_ui)||{};return ((u.sources||{}).finanalysis||{})[k]||u[k]||k}
 function CU(D,k,o){var s=(CF(D).ui||{})[k]||k;o=o||{};Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n]==null?'':o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[3]+'.'+m[2]+'.'+m[1]:String(x||'')}
 async function gj(p){if(typeof ghApi!='function')return null;var r=await ghApi(p);if(!r.ok)return null;var j=await r.json();return JSON.parse(decodeURIComponent(escape(atob(String(j.content||'').replace(/\s/g,'')))))}
 async function fin(C,inn){var k=inn;if(MEMO[k]!==undefined)return MEMO[k];MEMO[k]=null;try{var ix=await gj(C.index||'finance/index.json')||{},best=null;Object.keys(ix).forEach(function(id){var e=ix[id]||{};if(String(e.inn||'').replace(/\D/g,'')!==inn||e.sample)return;if(!best||String(e.date||'')>String(best.e.date||''))best={id:id,e:e}});
   if(best){var res=await gj(best.e[C.result_key||'result']||('finance/'+best.id+'/result.json'));if(res)MEMO[k]={r:res,date:best.e.date||''}}}catch(e){MEMO[k]=undefined}return MEMO[k]}
 function opt(D,cs,v){var X=D.X()||{},S=(X.choice_sets||{})[cs];return S&&(S.options||[]).find(function(o){return (o.value!=null?o.value:o.id)==v})||null}
 function cur(d,k,c){if(c.choices){var s=d['_ch_'+k];return s&&A(s.v)?(s.v.length==1?s.v[0]:s.v.join('|')):(String(d[k]||'').trim()?'custom':'')}return String(d[k]||'')}
 function lab(D,c,v){if(!c.choices)return v.length>80?v.slice(0,78)+'…':v;var o=opt(D,c.choices,v);return o?(o.label||v):(((CF(D).ui||{}).option_labels||{})[v]||v)}
 function put(D,d,k,c,v){if(c.choices){var o=opt(D,c.choices,v);if(!o)return false;d['_ch_'+k]={v:[v],c:''};d[k]=o.text||''}else d[k]=v;return true}
 function caseOf(D){return D.curCase&&D.curCase()}
 function exp(cs){var e=((cs||{}).data||{})._exp||{},P=e.parts||{},B=e.bad||{},bad=Object.keys(B).length>0,ks=Object.keys(P).filter(function(k){return N(P[k])!=null});/* нечисловой ввод в любом поле расходов → сумма не задана (no_expenses_estimate) */return {total:bad?null:ks.length?ks.reduce(function(a,k){return a+N(P[k])},0):N(e.total),parts:P,bad:B,auto:ks.length>0||Object.keys(B).some(function(k){return k!='total'})}}
 /* справочная оценка текущего дела: сводка d._appr.sum из docs_appr (только сумма/количество/дата, без описаний) — последняя по времени среди шаблонов */
 function apprSum(D){var cs=caseOf(D),X=D.X()||{},best=null;(X.templates||[]).forEach(function(t){var d=D.draftOf(t.id),q=d&&d._appr;if(!q||!q.id||!cs||q.case!==cs.id)return;if(!best||q.at>best.q.at)best={q:q,t:t.id}});
  if(!best)return null;var q=best.q,s=q.sum||{n:q.n||0,valued:0,total:0,date:''},qr=+q.rev||0,fr=s.fresh!==undefined?s.fresh:((+s.rev||0)===qr),pend=/^(new|in_progress|sending|supplement)$/.test(q.status);
  /* полной оценка считается только если все позиции valued И ответ на текущий rev запроса (устаревший partial при дополнении — не полная) */
  if(pend||!fr){try{if(window.ArbAppr&&ArbAppr.pollFor)ArbAppr.pollFor(D,best.t)}catch(_){}}/* ответ опрашивается и из этого шаблона */
  return {n:s.n,valued:s.valued,total:s.total,date:s.date,tpl:best.t,rev:qr,fresh:fr,dateWhy:s.dateWhy===undefined?(s.date?'':'appraisal_no_date'):s.dateWhy,complete:!pend&&fr&&s.n>0&&s.valued===s.n&&!(s.dateWhy===undefined?!s.date:s.dateWhy),busy:pend||!fr,eta:q.eta||null}}
 function apprTpl(D){var X=D.X()||{},ap=(((X.file_input_meta||{}).appraiser_db||{}).applies_to_valuation)||[],t=(X.templates||[]).find(function(t){return ap.indexOf(t.valuation_requirement)>=0});return t&&t.id}
 function hasF(D,t,k){var T=((D.X()||{}).templates||[]).find(function(x){return x.id==t.id})||t;return (T.fields||[]).indexOf(k)>=0||(t.fields||[]).indexOf(k)>=0}
 function BF(D){return CF(D).basis_field||'ОСНОВА_ДОСТАТОЧНОСТИ'}function DF(D){return CF(D).appraisal_date_field||'ДАТА_СПРАВОЧНОЙ_ОЦЕНКИ'}
 function basis(D,t){var d=D.draftOf(t.id)||{},s=d['_ch_'+BF(D)],b=s&&A(s.v)&&s.v[0];return b=='appraisal_ref'?'appraisal_ref':'balance'}
 /* основа достаточности — поле шаблона ОСНОВА_ДОСТАТОЧНОСТИ (choice_set sufficiency_basis, по умолчанию balance); при appraisal_ref — ДАТА_СПРАВОЧНОЙ_ОЦЕНКИ = date из ответа Оценщика (дата оценки, не дата запроса). Сумма оценки в документ не пишется. */
 function setBasis(D,t,v){if(v=='appraisal_ref'){var ap1=apprSum(D);if(!ap1||!ap1.complete)return}var d=D.dra(t.id),bf=BF(D),df=DF(D),X=D.X()||{},cs=((X.fields||{})[bf]||{}).choices||'sufficiency_basis',o=opt(D,cs,v);if(!o)return;d['_ch_'+bf]={v:[v],c:''};d[bf]=o.text||'';
  var ap=apprSum(D);if(hasF(D,t,df)){if(v=='appraisal_ref'&&ap&&ap.complete&&ap.date){if(!d[df]||d[df]===d._cxdate){d[df]=dmy(ap.date);d._cxdate=d[df]}d._cxbref=ap.rev||0}else if(v=='balance'&&d._cxdate&&d[df]===d._cxdate){d[df]='';delete d._cxdate}}}
 /* ctx для vyvod_autofill.resolve: expenses_estimate — только ввод АУ (ключ есть всегда; не число → null → no_expenses_estimate, без подстановки из result.json — D08);
    basis — основа достаточности; при appraisal_ref: assets_liquid (сумма, если оценены все позиции, иначе null), appraisal_complete, valued, total; при balance assets_liquid не передаётся (берётся result.json). */
 function ctxOf(D,cs,t){var x=(cs&&cs.data)||{},inn=String(x.ДОЛЖНИК_ИНН||'').replace(/\D/g,''),b=basis(D,t),o={expenses_estimate:N(exp(cs).total),basis:b},dt=x._dtype=='person'||x._dtype=='legal'?x._dtype:(inn.length==12?'person':inn.length==10?'legal':null);
  if(dt)o.debtor_type=dt;if(x._applicant)o.applicant=x._applicant;var ap=apprSum(D);if(ap){o.valued=ap.valued;o.total=ap.n}
  if(b=='appraisal_ref'){o.appraisal_complete=!!(ap&&ap.complete);o.assets_liquid=ap&&ap.complete?ap.total:null}return o}
 function memo(D){var cs=caseOf(D);return MEMO[String(((cs||{}).data||{})[CF(D).match_inn||'ДОЛЖНИК_ИНН']||'').replace(/\D/g,'')]}
 function apply(D,t){var d=D.dra(t.id),cs=caseOf(D),C=CF(D),m=memo(D);if(!d||!cs)return false;var ch0=false;if(hasF(D,t,BF(D))&&!(d['_ch_'+BF(D)]&&A(d['_ch_'+BF(D)].v)&&d['_ch_'+BF(D)].v.length)){var df0=((D.X()||{}).fields||{})[BF(D)]||{};if(df0.default){setBasis(D,t,df0.default);ch0=true}}if(basis(D,t)=='appraisal_ref'){var ap0=apprSum(D),df=DF(D),auto=(!d[df]&&!d._cxdate)||(!!d._cxdate&&d[df]===d._cxdate);
   /* ДАТА_СПРАВОЧНОЙ_ОЦЕНКИ — только из того же полного ответа (rev совпадает, все valued); пока нет — авто-дата снимается, в документ не идёт */
   if(ap0&&ap0.complete&&ap0.date){if(hasF(D,t,df)&&auto&&d[df]!==dmy(ap0.date)){d[df]=dmy(ap0.date);d._cxdate=d[df];ch0=true}if(d._cxbref==null){d._cxbref=ap0.rev||0;ch0=true}}
   else{if(hasF(D,t,df)&&d._cxdate&&d[df]===d._cxdate){d[df]='';delete d._cxdate;ch0=true}
    /* выбрана в форме, когда полной оценки не было (никогда не была доступна) → обратно balance; выбрана при полной, затем дополнение — основа остаётся, ждём ответ */
    if(d._cxbref==null&&!(ap0&&ap0.busy)){var o0=d['_ch_'+BF(D)];delete d['_ch_'+BF(D)];setBasis(D,t,'balance');ch0=true}}}var ev=evaluate(m?m.r:{},ctxOf(D,cs,t),(D.X()||{}).vyvod_autofill,C),ch=ch0;d._cx=d._cx||{};
  Object.keys(FLD(D)).forEach(function(k){if((t.fields||[]).indexOf(k)<0)return;var c=FLD(D)[k],x=ev[k]||{v:null,why:'no_data'};if(!m&&c.rule!='sufficiency')x={v:null,why:'no_data'};var pf=(d._pf=d._pf||{})[k],now=cur(d,k,c),miss=x.v!=null&&!x.text&&c.choices&&!opt(D,c.choices,x.v);
   var nx={v:x.v!=null&&!miss?x.v:null,miss:miss?x.v:null,hint:x.hint||'',why:x.v==null?x.why||'no_data':'',neutral:x.v!=null?neutral(D,c,x.v):false,date:m?m.date:''};if(JSON.stringify(d._cx[k])!==JSON.stringify(nx)){d._cx[k]=nx;ch=true}
   var lt=nx.v;
   if(!pf){if(lt==null||now)return;if(put(D,d,k,c,lt)){d._pf[k]={v:lt,src:'finanalysis',date:nx.date,at:Date.now(),manual:false,latest:lt,concl:1};ch=true}return}
   if(!pf.concl)return;var man=now!==pf.v;if(man!==!!pf.manual){pf.manual=man;ch=true}
   if(pf.latest!==lt||pf.date!==nx.date){pf.latest=lt;pf.date=nx.date;ch=true}
   /* достаточность пересчитывается вживую от введённых расходов/основы: своё (не ручное) значение обновляется, ручное — никогда */
   if(c.rule=='sufficiency'&&!pf.manual&&pf.v!==lt){if(lt==null){if(c.choices)delete d['_ch_'+k];d[k]='';delete d._pf[k]}else{put(D,d,k,c,lt);pf.v=lt}ch=true}});
  return ch}
 /* причина пустого поля — index.json → autofill_reasons[{id,text,text_template,placeholders,action}] (запасной — conclusions.ui.reasons); шаблон заполняется из ctx, если есть все плейсхолдеры */
 /* причина неполной оценки по датам → действие дополнения (тот же id запроса, rev+1, reason redate|no_date) */
 var DATEACT={appraisal_dates_differ:'appraisal_redate',appraisal_no_date:'appraisal_no_date'},ACTWHY={appraisal_redate:'redate',appraisal_no_date:'no_date'};
 function reasonObj(D,id,ctx){var X=D.X()||{},L=X.autofill_reasons,r=A(L)?L.find(function(x){return x&&x.id==id}):(L||{})[id],fb=((CF(D).ui||{}).reasons||{})[id];if(!r||typeof r!='object')r={text:typeof r=='string'?r:''};if(fb&&typeof fb=='object'){r=Object.assign({},fb,r)}else if(!r.text&&fb)r.text=fb;
  var t=r.text||CU(D,'reason_generic');if(r.text_template){var ph=r.placeholders||(r.text_template.match(/\{(\w+)\}/g)||[]).map(function(x){return x.slice(1,-1)});if(ph.every(function(k){return ctx&&ctx[k]!=null&&ctx[k]!==''}))t=r.text_template.replace(/\{(\w+)\}/g,function(m,k){return ctx[k]})}
  var pre=CU(D,'not_suggested',{r:''}).trim();if(t.indexOf(pre)!==0)t=CU(D,'not_suggested',{r:t});var act=r.action&&r.action.id?r.action:null,ap=act&&/^appraisal_/.test(act.id)?apprSum(D):null;if(id=='appraisal_incomplete'){var apd=ap||apprSum(D);if(apd&&apd.n>0&&apd.valued===apd.n&&apd.dateWhy&&(apd.busy||apd.fresh)){t=CU(D,'not_suggested',{r:CU(D,apd.dateWhy)});act={id:DATEACT[apd.dateWhy],label:CU(D,apd.dateWhy+'_btn')}}}var busy=ap&&ap.busy?CU(D,'basis_busy',{m:ap.eta||CF(D).appraisal_eta_default||20}):'';return {t:t,act:busy?null:act,busy:busy}}
 function reason(D,id){return reasonObj(D,id,{}).t}
 function deco(D,t){try{vDeco(D,t)}catch(e){}var d=D.draftOf(t.id)||{},C=CF(D);Object.keys(FLD(D)).forEach(function(k){var w=document.querySelector('#dform [data-w="'+k+'"]');if(!w)return;var c=FLD(D)[k],pf=(d._pf||{})[k],cx=(d._cx||{})[k]||{},lb=w.querySelector(':scope > .dchl')||w.querySelector(':scope > span'),h='',cap='',now=cur(d,k,c);
   if(pf&&pf.concl){var man=!!pf.manual,bc=c.rule=='sufficiency'?' · '+((C.ui||{}).basis_caption||{})[basis(D,t)]:'';cap=man?'<span class="dpfdot" aria-hidden="true"></span>'+E(PU(D,'manual'))+(pf.latest?' <button type="button" class="dpfr" data-cfr="'+E(k)+'" title="'+E(PU(D,'restore_title').split('{v}').join(lab(D,c,pf.latest)))+'" aria-label="'+E(PU(D,'restore_title').split('{v}').join(lab(D,c,pf.latest)))+'">\u21ba</button>':''):E(PU(D,'caption')+(bc&&bc!=' · undefined'?bc:''));
    if(pf.latest&&pf.latest!==pf.v&&pf.latest!==now)h+='<div class="sm dpfh">'+E(PU(D,'recalc').split('{v}').join(lab(D,c,pf.latest)))+' · <button type="button" class="dpfs" data-cfs="'+E(k)+'">'+E(PU(D,'apply'))+'</button></div>';
    if(!man&&cx.hint)h+='<div class="sm dcxn">'+E(cx.hint)+'</div>'}
   if(cx.miss&&!(pf&&pf.manual))h+='<div class="sm dcxn'+(cx.neutral?' neu':'')+'">'+(cx.neutral?'<span class="dcxchip">'+E(lab(D,c,cx.miss))+'</span> ':'')+E(CU(D,'missing_option',{v:lab(D,c,cx.miss)}))+'</div>';
   else if(!now&&cx.why&&!cx.miss){var ro=reasonObj(D,cx.why,ctxOf(D,caseOf(D),t));h+='<div class="sm dcxn dcxwhy" data-why="'+E(cx.why)+'">'+E(ro.t)+(ro.act?' · <button type="button" class="dapb" data-cxact="'+E(ro.act.id)+'">'+E(ro.act.label||ro.act.id)+'</button>':'')+(ro.busy?' · <span class="dcxbusy"><span class="dspin" aria-hidden="true"></span> '+E(ro.busy)+'</span>':'')+'</div>'}
   if(c.rule=='sufficiency')h+=card(D,t);
   w.classList.toggle('dcxneu',neutral(D,c,now));
   var ce=lb&&lb.querySelector('.dpfc');if(cap){if(!ce&&lb){ce=document.createElement('span');ce.className='dpfc';lb.classList.add('dpfl');lb.appendChild(ce)}if(ce&&ce.innerHTML!==cap)ce.innerHTML=cap;if(ce)ce.classList.toggle('man',!!pf.manual)}else if(ce)ce.remove();
   var bx=w.querySelector(':scope > .dcx');if(!h){if(bx)bx.remove();return}if(!bx){bx=document.createElement('div');bx.className='dcx';if(lb&&lb.parentNode===w)lb.after(bx);else w.insertBefore(bx,w.firstChild)}if(bx.innerHTML!==h&&!bx.contains(document.activeElement))bx.innerHTML=h})}
 /* проверки шаблона вида required_if_equals (index.json → templates[].validations): ошибка под обязательным полем; блокировку формирования даёт docs.js (missing) */
 function vReq(D,t){var d=D.draftOf(t.id)||{},o=[];(t.validations||[]).forEach(function(v){var r=v.rule||{};if(r.kind!='required_if_equals')return;var s=d['_ch_'+r.field],val=s&&A(s.v)?s.v:[];if(val.indexOf(r.equals)<0||String(d[r.required_field]||'').trim())return;o.push({id:v.id,f:r.required_field,msg:v.message||CU(D,'date_required'),level:v.level||'error'})});return o}
 function vDeco(D,t){var L=vReq(D,t);[].forEach.call(document.querySelectorAll('#dform .dvreq'),function(e){if(e.closest('.dcxcard'))return;if(!L.some(function(x){return e.dataset.vid==x.id}))e.remove()});
  L.forEach(function(x){var w=document.querySelector('#dform [data-w="'+x.f+'"]');if(!w||w.querySelector('.dvreq[data-vid="'+x.id+'"]'))return;var e=document.createElement('div');e.className='sm dvreq';e.setAttribute('role','alert');e.dataset.vid=x.id;e.textContent=x.msg;w.appendChild(e);w.classList.add('dverr')});
  [].forEach.call(document.querySelectorAll('#dform .dverr'),function(w){if(!w.querySelector('.dvreq'))w.classList.remove('dverr')})}
 /* действия по id (index.json → autofill_reasons[].action.id, тот же обработчик у переключателя основы):
    appraisal_complete — открыть шаблон с текущей справочной оценкой в режиме дополнения (тот же запрос, rev+1); appraisal_start — шаблон для новой оценки */
 function action(D,t,id){var ap=apprSum(D);if(/^appraisal_/.test(id)&&ap&&ap.busy)return;if(ACTWHY[id]){if(ap&&ap.dateWhy&&window.ArbAppr&&ArbAppr.supplementFor)ArbAppr.supplementFor(D,ap.tpl,ACTWHY[id]);return}/* дополнение уже в работе — без второго rev */var tpl=id=='appraisal_complete'&&ap?ap.tpl:apprTpl(D);if(!tpl)return;try{sessionStorage.setItem('arb_appr_focus',id=='appraisal_complete'?'supplement':'new')}catch(_){}D.open(tpl)}
 ArbConcl.action=function(id){if(LAST)action(LAST.D,LAST.t,id)};
 function rubS(v){return v==null?'—':fmtN(v)}
 /* карточка достаточности: расходы (₽, сумма из «Из чего складывается»), основа расчёта (баланс / справочная оценка). Сумма оценки в документ не попадает. */
 function card(D,t){var cs=caseOf(D),C=CF(D),e=exp(cs),money=function(k,val,extra){return '<span class="dcxin"><input id="dcxe_'+E(k)+'" type="text" inputmode="numeric" autocomplete="off" data-cxe="'+E(k)+'" value="'+E(val)+'"'+extra+'><span class="dcxcur" aria-hidden="true">'+E(CU(D,'currency_suffix'))+'</span></span>'},badL=function(k){return e.bad[k]!=null?'<div class="sm dvreq dcxbad" role="alert" data-cxbad="'+E(k)+'">'+E(CU(D,'expenses_not_number'))+'</div>':''},m=memo(D),r=m&&m.r||{},a=N(r.assets_liquid),ap=apprSum(D),b=basis(D,t),P=C.expense_parts||[],u=function(k,o){return E(CU(D,k,o))};
  var h='<div class="dcxcard"><div class="dcxr"><label class="dcxl" for="dcxe_total">'+u('expenses_label')+'</label>'+money('total',e.bad.total!=null?e.bad.total:(e.total==null?'':fmtN(e.total)),' placeholder="'+u('expenses_ph')+'"'+(e.auto?' readonly title="'+u('expenses_auto')+'"':''))+'</div>'+badL('total');
  h+='<details class="dcxx"'+(e.auto?' open':'')+'><summary>'+u('expenses_parts')+'</summary>'+P.map(function(p){var v=e.parts[p.key];return '<div class="dcxr"><label class="dcxl" for="dcxe_'+E(p.key)+'">'+E(p.label)+'</label>'+money(p.key,e.bad[p.key]!=null?e.bad[p.key]:(N(v)==null?'':fmtN(N(v))),'')+'</div>'+badL(p.key)}).join('')+'</details>';
  h+='<div class="dcxtg" role="radiogroup" aria-label="'+u('basis_label')+'"><button type="button" role="radio" class="dcxo'+(b=='balance'?' on':'')+'" aria-checked="'+(b=='balance')+'" data-cxb="balance">'+u('basis_balance',{a:rubS(a)})+'</button>';
  if(ap&&ap.complete)h+='<button type="button" role="radio" class="dcxo'+(b=='appraisal_ref'?' on':'')+'" aria-checked="'+(b=='appraisal_ref')+'" data-cxb="appraisal_ref">'+u('basis_appraisal',{a:rubS(ap.total),d:dmy(ap.date)})+'</button>';
  else if(ap&&ap.busy)h+='<span class="dcxo dis" aria-disabled="true"><span class="dspin" aria-hidden="true"></span> '+u('basis_busy',{m:ap.eta||((C.appraisal_eta_default)||20)})+'</span>';
  else if(ap&&!ap.busy&&ap.fresh&&ap.n>0&&ap.valued===ap.n&&ap.dateWhy)h+='<span class="dcxo dis" data-cxwhy="'+E(ap.dateWhy)+'">'+u(ap.dateWhy)+' · <button type="button" class="dapb" data-cxact="'+E(DATEACT[ap.dateWhy])+'">'+u(ap.dateWhy+'_btn')+'</button></span>';
  else h+='<span class="dcxo dis">'+(ap&&ap.n?u('basis_partial',{n:ap.valued,m:ap.n})+' · <button type="button" class="dapb" data-cxact="appraisal_complete">'+u('basis_partial_btn')+'</button>':u('basis_none')+' · <button type="button" class="dapb" data-cxact="appraisal_start">'+u('basis_none_btn')+'</button>')+'</span>';
  h+='</div><div class="sm dcxa">'+u('assets_label')+': '+(b=='appraisal_ref'&&ap&&ap.complete?u('assets_appraisal',{a:rubS(ap.total),d:dmy(ap.date)}):(a==null?u('assets_none'):u('assets_line',{a:rubS(a),d:r.assets_liquid_date?' на '+dmy(r.assets_liquid_date):''})))+'</div>'+vReq(D,t).map(function(x){return '<div class="sm dvreq" role="alert" data-vid="'+E(x.id)+'c">'+E(x.msg)+'</div>'}).join('')+'</div>';return h}
 function mount(t,D){if(!t||!D||CF(D).enabled===false)return;var C=CF(D),ks=Object.keys(FLD(D)).filter(function(k){return (t.fields||[]).indexOf(k)>=0});if(!ks.length)return;LAST={t:t,D:D};var cs=D.curCase&&D.curCase();if(!cs)return;
  var inn=String((cs.data||{})[C.match_inn||'ДОЛЖНИК_ИНН']||'').replace(/\D/g,'');setTimeout(function(){deco(D,t)},0);if(inn.length!=10&&inn.length!=12)return;
  if(MEMO[inn]!==undefined&&MEMO[inn]!==null||BUSY[inn]===2){if(apply(D,t)){D.save();D.redraw()}else deco(D,t);return}var bk=inn;if(BUSY[bk])return;BUSY[bk]=1;
  fin(C,inn).then(function(m){var c=D.cur&&D.cur();if(!c||c.id!==t.id)return;if(apply(D,t)){D.save();D.redraw()}else deco(D,t)}).finally(function(){BUSY[bk]=2})}
 function act(k,mode){if(!LAST)return;var D=LAST.D,t=LAST.t,c=FLD(D)[k],d=D.dra(t.id),pf=d&&d._pf&&d._pf[k];if(!c||!pf||!pf.latest)return;if(!put(D,d,k,c,pf.latest))return;pf.v=pf.latest;pf.manual=false;pf.at=Date.now();D.save();D.redraw()}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-cfr],[data-cfs]');if(!b)return;e.preventDefault();e.stopPropagation();act(b.dataset.cfr||b.dataset.cfs,b.dataset.cfr?'restore':'apply')},true);
 var TM=0;function num(v){v=String(v||'').replace(/[\s\u00a0₽]/g,'').replace(',','.');return v===''||!isFinite(+v)?null:+v}
 /* маска суммы: только цифры, пробелы между тысячами, ₽ справа; иное (вставка текста) → строка «Введите сумму числом» и причина no_expenses_estimate */
 function digitsRight(str,pos){return String(str).slice(pos).replace(/\D/g,'').length}
 function caretFor(str,dr){var n=0;for(var i=str.length;i>0;i--){if(n>=dr)return i;if(/\d/.test(str[i-1]))n++}return n>=dr?0:str.length}
 document.addEventListener('input',function(e){if(!LAST||!e.target.matches||!e.target.matches('[data-cxe]'))return;var D=LAST.D,t=LAST.t,cs=caseOf(D);if(!cs)return;cs.data=cs.data||{};var X=cs.data._exp=cs.data._exp||{parts:{}},k=e.target.dataset.cxe,el=e.target,raw=el.value;X.parts=X.parts||{};X.bad=X.bad||{};
  var v=null;if(/[^\d\s\u00a0₽]/.test(raw)){X.bad[k]=raw}else{delete X.bad[k];var dg=raw.replace(/\D/g,''),dr=digitsRight(raw,el.selectionStart||raw.length),f=dg?fmtN(+dg):'';if(f!==raw){el.value=f;try{var cp=caretFor(f,dr);el.setSelectionRange(cp,cp)}catch(_){}}v=dg?+dg:null}
  if(!Object.keys(X.bad).length)delete X.bad;
  if(k=='total'){if(v==null)delete X.total;else X.total=v}else{if(v==null)delete X.parts[k];else X.parts[k]=v}
  clearTimeout(TM);TM=setTimeout(function(){var id=el.id,pos=el.selectionStart,val=el.value;apply(D,t);D.save();D.redraw();setTimeout(function(){var n=document.getElementById(id);if(n){if(n.value!==val&&!n.readOnly)n.value=val;n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}deco(D,t)},60)},350)},true);
 document.addEventListener('click',function(e){if(!LAST||!e.target.closest)return;var D=LAST.D,t=LAST.t,b=e.target.closest('[data-cxb]'),o=e.target.closest('[data-cxact]');if(b){e.preventDefault();e.stopPropagation();setBasis(D,t,b.dataset.cxb);apply(D,t);D.save();D.redraw();return}
  if(o){e.preventDefault();e.stopPropagation();action(D,t,o.dataset.cxact)}},true);
 /* ручной выбор варианта / правка текста — пересчитать отметку «Изменено вручную» после обработки docs.js */
 function later(){if(!LAST)return;var D=LAST.D,t=LAST.t;setTimeout(function(){var c=D.cur&&D.cur();if(!c||c.id!==t.id)return;if(MEMO[String(((D.curCase()||{}).data||{})[CF(D).match_inn||'ДОЛЖНИК_ИНН']||'').replace(/\D/g,'')]&&apply(D,t))D.save();deco(D,t)},30)}
 document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#dform [data-chv]'))later()});document.addEventListener('input',function(e){if(e.target.closest&&e.target.closest('#dform [data-w^="ВЫВОД_"]'))later()});
 ArbConcl.mount=mount;ArbConcl._memo=MEMO;
})();
