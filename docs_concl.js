/* Arbitr App — подсказки ВЫВОД_* из финанализа (docs_config.json → conclusions; строки состояний — prefill_ui).
   Правила (спецификация Юридического консультанта 16.10.2026): нет данных → пусто; неизвестный тип должника = юрлицо;
   неблагоприятные варианты — только по явному признаку в данных; ручной выбор не перезаписывается.
   ArbConcl.evaluate(result, ctx, vyvod_autofill, cfg) — чистая функция (юнит-тесты); ArbConcl.mount(t, D) — UI. */
(function(){var MEMO={},BUSY={},LAST=null;
 function A(x){return Array.isArray(x)}
 function N(x){return typeof x=='number'&&isFinite(x)?x:(typeof x=='string'&&x.trim()!==''&&isFinite(+x)?+x:null)}
 function iso(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));return m?m[0]:''}
 function minus(d,y){var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(d);if(!m)return '';var Y=+m[1]-y,M=m[2],Dd=m[3];if(M=='02'&&Dd=='29'&&!(Y%4==0&&(Y%100!=0||Y%400==0)))Dd='28';return Y+'-'+M+'-'+Dd}
 function startOk(r,y){var bd=iso(r.bankruptcy_date),st=iso(A(r.period)?r.period[0]:(r.statements_start||''));if(!bd||!st)return false;return st<=minus(bd,y)}
 function dtype(r,ctx,CF){var t=r.debtor_type||ctx.debtor_type;t=t=='citizen'||t=='individual'?'person':t;return t=='person'||t=='legal'?t:(CF.debtor_type_default||'legal')}
 function empty0(x){return A(x)&&x.length==0}
 function fmtN(v){return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
 function no(id,step){return {v:null,why:id||'no_data',step:step||''}}
 function nodata(r){return !r||!Object.keys(r).length}
 /* Данные правил — documents/index.json → vyvod_autofill (1.7o): поля, шаги по порядку (первый подходящий), then/reason/hint, never_auto, settings, debtor_type_unknown.
    Здесь — только словарь условий шага (id шага → проверка ключей result.json), сам порядок и исходы берутся из индекса.
    Шаг «иначе» срабатывает всегда; шаг с неизвестным id не срабатывает (и пишется в журнал). Отсутствующий ключ = условие для предложения не выполнено. */
 function lastYearRatios(r){var fs=r.financial_state||{},ys=A(fs.years)?fs.years.slice().map(String).sort():[];return ys.length?((fs.ratios||{})[ys[ys.length-1]]||{}):{}}
 function hasMedium(r){if(A(r.operations))return r.operations.some(function(o){return o&&o.level=='medium'});var s=r.summary||{};return N(s.medium)==null?true:N(s.medium)>0}
 function noPeriod(r){return !(A(r.period)&&iso(r.period[0]))}
 function short(r,y){return !startOk(r,y)}
 var APPL=['debtor','creditor','fns','other'];
 var COND={
  /* ВЫВОД_СДЕЛКИ */
  sdelki_exist:function(r){return N((r.summary||{}).high)>0},
  sdelki_no_tx:function(r){return !(N(r.tx_count)>0)},
  sdelki_flagged:function(r){var f=N((r.summary||{}).flagged);return f==null||f>0},
  sdelki_balance_flags:function(r){return !empty0(r.balance_flags)},
  sdelki_unchecked:function(r){return !empty0(r.unchecked_counterparties)},
  sdelki_no_period:noPeriod,
  sdelki_no_bd:function(r){return !iso(r.bankruptcy_date)},
  sdelki_period_short:function(r){return short(r,3)},
  sdelki_bd_source:function(r){return r.bankruptcy_date_source!=='case'},
  /* ВЫВОД_ПРЕДНАМЕРЕННОЕ */
  prednam_nonmarket:function(r){var n=(r.p855||{}).nonmarket_deals;return A(n)&&n.length>0},
  prednam_no_tx:function(r){return !(N(r.tx_count)>0)},
  prednam_flagged:function(r){var h=N((r.summary||{}).high);return h==null||h>0||hasMedium(r)},
  prednam_balance_flags:function(r){return !empty0(r.balance_flags)},
  prednam_no_period:noPeriod,
  prednam_no_bd:function(r){return !iso(r.bankruptcy_date)},
  prednam_period_short:function(r){return short(r,2)},
  prednam_no_accounting:function(r,x){var y=(r.financial_state||{}).years;return x.type=='legal'&&!(A(y)&&y.length)},
  /* ВЫВОД_ФИКТИВНОЕ */
  fikt_not_applicable:function(r,x){return ['creditor','fns','other'].indexOf(x.applicant)>=0},
  fikt_no_applicant:function(r,x){return APPL.indexOf(x.applicant)<0},
  fikt_person:function(r,x){return x.type=='person'},
  fikt_no_accounting:function(r){var y=(r.financial_state||{}).years;return !(A(y)&&y.length)},
  fikt_no_ratios:function(r,x){var R=lastYearRatios(r);return x.ratios.some(function(k){return N(R[k])==null})},
  fikt_ratios_ok:function(r,x){var R=lastYearRatios(r);return x.ratios.some(function(k){return N(R[k])>=x.threshold})},
  /* ВЫВОД_ДОСТАТОЧНОСТЬ (основа: баланс assets_liquid / справочная оценка — сумма из приложения, в документ не печатается) */
  suff_no_assets:function(r,x){return x.assets==null},
  suff_no_expenses:function(r,x){return x.expenses==null},
  suff_sufficient:function(r,x){return x.assets>=x.expenses},
  /* ВЫВОД_ПЛАТЁЖЕСПОСОБНОСТЬ */
  platezh_no_accounting:function(r){var y=(r.financial_state||{}).years;return !(A(y)&&y.length)},
  platezh_no_conclusion:function(r){return !String((r.financial_state||{}).conclusion||'').trim()}};
 function isElse(s){return /^\s*иначе/i.test(String(s.if||''))}
 function evaluate(r,ctx,VA,CF){var out={};r=r||{};ctx=ctx||{};VA=VA||{};CF=CF||{};var FS=VA.fields||{},ST=VA.settings||{},th=ST.fiktivnoe_ratio_threshold||{},none=nodata(r);
  var tp=r.debtor_type||ctx.debtor_type;tp=tp=='citizen'||tp=='individual'?'person':tp;if(tp!='person'&&tp!='legal')tp=VA.debtor_type_unknown||'legal';
  var apb=ctx.basis=='appraisal_ref',x={type:tp,applicant:r.applicant||ctx.applicant||null,threshold:N(th.value)==null?1:N(th.value),ratios:th.ratios||[],
   assets:apb?N(ctx.assets_appraisal):N(r.assets_liquid),expenses:N(ctx.expenses_estimate)!=null?N(ctx.expenses_estimate):N(r.expenses_estimate)};
  Object.keys(FS).forEach(function(k){var f=FS[k]||{},steps=f.steps||[],res=null,usesCtx=k==(CF.sufficiency_field||'ВЫВОД_ДОСТАТОЧНОСТЬ');
   if(none&&!usesCtx&&!(f.steps||[]).some(function(s){return s.id=='fikt_not_applicable'&&x.applicant}))res=no('no_data');
   if(f.debtor_types&&f.debtor_types.indexOf(tp)<0)res=no('no_data');
   for(var i=0;!res&&i<steps.length;i++){var s=steps[i],hit=false;if(isElse(s))hit=true;else if(COND[s.id]){try{hit=!!COND[s.id](r,x)}catch(e){hit=false}}else{if(typeof console!='undefined')console.warn('vyvod_autofill: нет условия для шага',s.id);continue}
    if(!hit)continue;
    if(s.then=='empty'||s.then==null)res=no(s.reason||'no_data',s.id);
    else if(s.then=='text'){var tv=String((s.text_from||'').split('.').reduce(function(o,p){return o==null?o:o[p]},r)||'').trim();res=tv?{v:tv,text:true,step:s.id}:no(s.reason||'no_data',s.id)}
    else res={v:s.then,step:s.id,hint:s.hint||''}}
   if(!res)res=no('no_data');
   if(res.v!=null&&!res.text&&(f.never_auto||[]).indexOf(res.v)>=0)res=no('finding_manager_decides',res.step);
   if(apb&&usesCtx&&res.v==null&&res.why=='no_assets_liquid')res.why='appraisal_incomplete';
   if(res.v!=null&&k==(CF.sufficiency_field||'ВЫВОД_ДОСТАТОЧНОСТЬ')&&x.assets!=null&&x.expenses!=null)res.hint=((CF.ui||{}).suff_hint||{})[res.v]?String(CF.ui.suff_hint[res.v]).split('{a}').join(fmtN(x.assets)).split('{x}').join(fmtN(x.expenses)):res.hint;
   if(res.v=='not_found'&&k=='ВЫВОД_ФИКТИВНОЕ'&&th.label)res.hint=String((CF.ui||{}).threshold_hint||'Порог показателей — {l}').split('{l}').join(th.label);
   out[k]=res});return out}
 window.ArbConcl={evaluate:evaluate,_cond:COND};
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
 function exp(cs){var e=((cs||{}).data||{})._exp||{},P=e.parts||{},ks=Object.keys(P).filter(function(k){return N(P[k])!=null});return {total:ks.length?ks.reduce(function(a,k){return a+N(P[k])},0):N(e.total),parts:P,auto:ks.length>0}}
 /* справочная оценка текущего дела: сводка d._appr.sum из docs_appr (только сумма/количество/дата, без описаний) — последняя по времени среди шаблонов */
 function apprSum(D){var cs=caseOf(D),X=D.X()||{},best=null;(X.templates||[]).forEach(function(t){var d=D.draftOf(t.id),q=d&&d._appr;if(!q||!q.id||!cs||q.case!==cs.id)return;if(!best||q.at>best.q.at)best={q:q,t:t.id}});
  if(!best)return null;var s=best.q.sum||{n:best.q.n||0,valued:0,total:0,date:''};return {n:s.n,valued:s.valued,total:s.total,date:s.date,tpl:best.t,complete:s.n>0&&s.valued===s.n,busy:/^(new|in_progress|sending)$/.test(best.q.status)}}
 function apprTpl(D){var X=D.X()||{},ap=(((X.file_input_meta||{}).appraiser_db||{}).applies_to_valuation)||[],t=(X.templates||[]).find(function(t){return ap.indexOf(t.valuation_requirement)>=0});return t&&t.id}
 function hasF(D,t,k){var T=((D.X()||{}).templates||[]).find(function(x){return x.id==t.id})||t;return (T.fields||[]).indexOf(k)>=0||(t.fields||[]).indexOf(k)>=0}
 function BF(D){return CF(D).basis_field||'ОСНОВА_ДОСТАТОЧНОСТИ'}function DF(D){return CF(D).appraisal_date_field||'ДАТА_СПРАВОЧНОЙ_ОЦЕНКИ'}
 function basis(D,t){var d=D.draftOf(t.id)||{},s=d['_ch_'+BF(D)],b=s&&A(s.v)&&s.v[0];return b=='appraisal_ref'?'appraisal_ref':'balance'}
 /* основа достаточности — поле шаблона ОСНОВА_ДОСТАТОЧНОСТИ (choice_set sufficiency_basis, по умолчанию balance); при appraisal_ref — ДАТА_СПРАВОЧНОЙ_ОЦЕНКИ = date из ответа Оценщика (дата оценки, не дата запроса). Сумма оценки в документ не пишется. */
 function setBasis(D,t,v){var d=D.dra(t.id),bf=BF(D),df=DF(D),X=D.X()||{},cs=((X.fields||{})[bf]||{}).choices||'sufficiency_basis',o=opt(D,cs,v);if(!o)return;d['_ch_'+bf]={v:[v],c:''};d[bf]=o.text||'';
  var ap=apprSum(D);if(hasF(D,t,df)){if(v=='appraisal_ref'&&ap&&ap.complete&&ap.date){if(!d[df]||d[df]===d._cxdate){d[df]=dmy(ap.date);d._cxdate=d[df]}}else if(v=='balance'&&d._cxdate&&d[df]===d._cxdate){d[df]='';delete d._cxdate}}}
 function ctxOf(D,cs,t){var x=(cs&&cs.data)||{},inn=String(x.ДОЛЖНИК_ИНН||'').replace(/\D/g,''),b=basis(D,t),ap=apprSum(D);return {debtor_type:x._dtype=='person'||x._dtype=='legal'?x._dtype:(inn.length==12?'person':inn.length==10?'legal':null),applicant:x._applicant||null,expenses_estimate:exp(cs).total,basis:b,assets_appraisal:ap&&ap.complete?ap.total:null}}
 function memo(D){var cs=caseOf(D);return MEMO[String(((cs||{}).data||{})[CF(D).match_inn||'ДОЛЖНИК_ИНН']||'').replace(/\D/g,'')]}
 function apply(D,t){var d=D.dra(t.id),cs=caseOf(D),C=CF(D),m=memo(D);if(!d||!cs)return false;var ch0=false;if(hasF(D,t,BF(D))&&!(d['_ch_'+BF(D)]&&A(d['_ch_'+BF(D)].v)&&d['_ch_'+BF(D)].v.length)){var df0=((D.X()||{}).fields||{})[BF(D)]||{};if(df0.default){setBasis(D,t,df0.default);ch0=true}}if(basis(D,t)=='appraisal_ref'&&hasF(D,t,DF(D))&&!d[DF(D)]&&!d._cxdate){var ap0=apprSum(D);if(ap0&&ap0.complete&&ap0.date){d[DF(D)]=dmy(ap0.date);d._cxdate=d[DF(D)];ch0=true}}var ev=evaluate(m?m.r:{},ctxOf(D,cs,t),(D.X()||{}).vyvod_autofill,C),ch=ch0;d._cx=d._cx||{};
  Object.keys(FLD(D)).forEach(function(k){if((t.fields||[]).indexOf(k)<0)return;var c=FLD(D)[k],x=ev[k]||{v:null,why:'no_data'};if(!m&&c.rule!='sufficiency')x={v:null,why:'no_data'};var pf=(d._pf=d._pf||{})[k],now=cur(d,k,c),miss=x.v!=null&&!x.text&&c.choices&&!opt(D,c.choices,x.v);
   var nx={v:x.v!=null&&!miss?x.v:null,miss:miss?x.v:null,hint:x.hint||'',why:x.v==null?x.why||'no_data':'',neutral:x.v!=null?neutral(D,c,x.v):false,date:m?m.date:''};if(JSON.stringify(d._cx[k])!==JSON.stringify(nx)){d._cx[k]=nx;ch=true}
   var lt=nx.v;
   if(!pf){if(lt==null||now)return;if(put(D,d,k,c,lt)){d._pf[k]={v:lt,src:'finanalysis',date:nx.date,at:Date.now(),manual:false,latest:lt,concl:1};ch=true}return}
   if(!pf.concl)return;var man=now!==pf.v;if(man!==!!pf.manual){pf.manual=man;ch=true}
   if(pf.latest!==lt||pf.date!==nx.date){pf.latest=lt;pf.date=nx.date;ch=true}
   /* достаточность пересчитывается вживую от введённых расходов/основы: своё (не ручное) значение обновляется, ручное — никогда */
   if(c.rule=='sufficiency'&&!pf.manual&&pf.v!==lt){if(lt==null){if(c.choices)delete d['_ch_'+k];d[k]='';delete d._pf[k]}else{put(D,d,k,c,lt);pf.v=lt}ch=true}});
  return ch}
 function reason(D,id){var X=D.X()||{},L=X.autofill_reasons,r=A(L)?(L.find(function(x){return x&&x.id==id})||{}).text:(L||{})[id];if(r&&typeof r=='object')r=r.text||r.label;r=r||((CF(D).ui||{}).reasons||{})[id]||CU(D,'reason_generic');var pre=CU(D,'not_suggested',{r:''});return r.indexOf(pre.trim())===0?r:CU(D,'not_suggested',{r:r})}
 function deco(D,t){try{vDeco(D,t)}catch(e){}var d=D.draftOf(t.id)||{},C=CF(D);Object.keys(FLD(D)).forEach(function(k){var w=document.querySelector('#dform [data-w="'+k+'"]');if(!w)return;var c=FLD(D)[k],pf=(d._pf||{})[k],cx=(d._cx||{})[k]||{},lb=w.querySelector(':scope > .dchl')||w.querySelector(':scope > span'),h='',cap='',now=cur(d,k,c);
   if(pf&&pf.concl){var man=!!pf.manual,bc=c.rule=='sufficiency'?' · '+((C.ui||{}).basis_caption||{})[basis(D,t)]:'';cap=man?'<span class="dpfdot" aria-hidden="true"></span>'+E(PU(D,'manual'))+(pf.latest?' <button type="button" class="dpfr" data-cfr="'+E(k)+'" title="'+E(PU(D,'restore_title').split('{v}').join(lab(D,c,pf.latest)))+'" aria-label="'+E(PU(D,'restore_title').split('{v}').join(lab(D,c,pf.latest)))+'">\u21ba</button>':''):E(PU(D,'caption')+(bc&&bc!=' · undefined'?bc:''));
    if(pf.latest&&pf.latest!==pf.v&&pf.latest!==now)h+='<div class="sm dpfh">'+E(PU(D,'recalc').split('{v}').join(lab(D,c,pf.latest)))+' · <button type="button" class="dpfs" data-cfs="'+E(k)+'">'+E(PU(D,'apply'))+'</button></div>';
    if(!man&&cx.hint)h+='<div class="sm dcxn">'+E(cx.hint)+'</div>'}
   if(cx.miss&&!(pf&&pf.manual))h+='<div class="sm dcxn'+(cx.neutral?' neu':'')+'">'+(cx.neutral?'<span class="dcxchip">'+E(lab(D,c,cx.miss))+'</span> ':'')+E(CU(D,'missing_option',{v:lab(D,c,cx.miss)}))+'</div>';
   else if(!now&&cx.why&&!cx.miss)h+='<div class="sm dcxn dcxwhy" data-why="'+E(cx.why)+'">'+E(reason(D,cx.why))+'</div>';
   if(c.rule=='sufficiency')h+=card(D,t);
   w.classList.toggle('dcxneu',neutral(D,c,now));
   var ce=lb&&lb.querySelector('.dpfc');if(cap){if(!ce&&lb){ce=document.createElement('span');ce.className='dpfc';lb.classList.add('dpfl');lb.appendChild(ce)}if(ce&&ce.innerHTML!==cap)ce.innerHTML=cap;if(ce)ce.classList.toggle('man',!!pf.manual)}else if(ce)ce.remove();
   var bx=w.querySelector(':scope > .dcx');if(!h){if(bx)bx.remove();return}if(!bx){bx=document.createElement('div');bx.className='dcx';if(lb&&lb.parentNode===w)lb.after(bx);else w.insertBefore(bx,w.firstChild)}if(bx.innerHTML!==h&&!bx.contains(document.activeElement))bx.innerHTML=h})}
 /* проверки шаблона вида required_if_equals (index.json → templates[].validations): ошибка под обязательным полем; блокировку формирования даёт docs.js (missing) */
 function vReq(D,t){var d=D.draftOf(t.id)||{},o=[];(t.validations||[]).forEach(function(v){var r=v.rule||{};if(r.kind!='required_if_equals')return;var s=d['_ch_'+r.field],val=s&&A(s.v)?s.v:[];if(val.indexOf(r.equals)<0||String(d[r.required_field]||'').trim())return;o.push({id:v.id,f:r.required_field,msg:v.message||CU(D,'date_required'),level:v.level||'error'})});return o}
 function vDeco(D,t){var L=vReq(D,t);[].forEach.call(document.querySelectorAll('#dform .dvreq'),function(e){if(e.closest('.dcxcard'))return;if(!L.some(function(x){return e.dataset.vid==x.id}))e.remove()});
  L.forEach(function(x){var w=document.querySelector('#dform [data-w="'+x.f+'"]');if(!w||w.querySelector('.dvreq[data-vid="'+x.id+'"]'))return;var e=document.createElement('div');e.className='sm dvreq';e.setAttribute('role','alert');e.dataset.vid=x.id;e.textContent=x.msg;w.appendChild(e);w.classList.add('dverr')});
  [].forEach.call(document.querySelectorAll('#dform .dverr'),function(w){if(!w.querySelector('.dvreq'))w.classList.remove('dverr')})}
 function rubS(v){return v==null?'—':fmtN(v)}
 /* карточка достаточности: расходы (₽, сумма из «Из чего складывается»), основа расчёта (баланс / справочная оценка). Сумма оценки в документ не попадает. */
 function card(D,t){var cs=caseOf(D),C=CF(D),e=exp(cs),m=memo(D),r=m&&m.r||{},a=N(r.assets_liquid),ap=apprSum(D),b=basis(D,t),P=C.expense_parts||[],u=function(k,o){return E(CU(D,k,o))};
  var h='<div class="dcxcard"><div class="dcxr"><label class="dcxl" for="dcxe_total">'+u('expenses_label')+'</label><input id="dcxe_total" type="text" inputmode="decimal" data-cxe="total" value="'+E(e.total==null?'':fmtN(e.total))+'" placeholder="'+u('expenses_ph')+'"'+(e.auto?' readonly title="'+u('expenses_auto')+'"':'')+'></div>';
  h+='<details class="dcxx"'+(e.auto?' open':'')+'><summary>'+u('expenses_parts')+'</summary>'+P.map(function(p){var v=e.parts[p.key];return '<div class="dcxr"><label class="dcxl" for="dcxe_'+E(p.key)+'">'+E(p.label)+'</label><input id="dcxe_'+E(p.key)+'" type="text" inputmode="decimal" data-cxe="'+E(p.key)+'" value="'+E(N(v)==null?'':fmtN(N(v)))+'"></div>'}).join('')+'</details>';
  h+='<div class="dcxtg" role="radiogroup" aria-label="'+u('basis_label')+'"><button type="button" role="radio" class="dcxo'+(b=='balance'?' on':'')+'" aria-checked="'+(b=='balance')+'" data-cxb="balance">'+u('basis_balance',{a:rubS(a)})+'</button>';
  if(ap&&ap.complete)h+='<button type="button" role="radio" class="dcxo'+(b=='appraisal_ref'?' on':'')+'" aria-checked="'+(b=='appraisal_ref')+'" data-cxb="appraisal_ref">'+u('basis_appraisal',{a:rubS(ap.total),d:dmy(ap.date)})+'</button>';
  else h+='<span class="dcxo dis" aria-disabled="true">'+(ap&&ap.n?u('basis_partial',{n:ap.valued,m:ap.n})+' · <button type="button" class="dapb" data-cxa="'+E(ap.tpl)+'">'+u('basis_partial_btn')+'</button>':u('basis_none')+' · <button type="button" class="dapb" data-cxa="'+E(apprTpl(D)||'')+'">'+u('basis_none_btn')+'</button>')+'</span>';
  h+='</div><div class="sm dcxa">'+u('assets_label')+': '+(b=='appraisal_ref'&&ap&&ap.complete?u('assets_appraisal',{a:rubS(ap.total),d:dmy(ap.date)}):(a==null?u('assets_none'):u('assets_line',{a:rubS(a),d:r.assets_liquid_date?' на '+dmy(r.assets_liquid_date):''})))+'</div>'+vReq(D,t).map(function(x){return '<div class="sm dvreq" role="alert" data-vid="'+E(x.id)+'c">'+E(x.msg)+'</div>'}).join('')+'</div>';return h}
 function mount(t,D){if(!t||!D||CF(D).enabled===false)return;var C=CF(D),ks=Object.keys(FLD(D)).filter(function(k){return (t.fields||[]).indexOf(k)>=0});if(!ks.length)return;LAST={t:t,D:D};var cs=D.curCase&&D.curCase();if(!cs)return;
  var inn=String((cs.data||{})[C.match_inn||'ДОЛЖНИК_ИНН']||'').replace(/\D/g,'');setTimeout(function(){deco(D,t)},0);if(inn.length!=10&&inn.length!=12)return;
  if(MEMO[inn]!==undefined&&MEMO[inn]!==null||BUSY[inn]===2){if(apply(D,t)){D.save();D.redraw()}else deco(D,t);return}var bk=inn;if(BUSY[bk])return;BUSY[bk]=1;
  fin(C,inn).then(function(m){var c=D.cur&&D.cur();if(!c||c.id!==t.id)return;if(apply(D,t)){D.save();D.redraw()}else deco(D,t)}).finally(function(){BUSY[bk]=2})}
 function act(k,mode){if(!LAST)return;var D=LAST.D,t=LAST.t,c=FLD(D)[k],d=D.dra(t.id),pf=d&&d._pf&&d._pf[k];if(!c||!pf||!pf.latest)return;if(!put(D,d,k,c,pf.latest))return;pf.v=pf.latest;pf.manual=false;pf.at=Date.now();D.save();D.redraw()}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-cfr],[data-cfs]');if(!b)return;e.preventDefault();e.stopPropagation();act(b.dataset.cfr||b.dataset.cfs,b.dataset.cfr?'restore':'apply')},true);
 var TM=0;function num(v){v=String(v||'').replace(/[\s\u00a0₽]/g,'').replace(',','.');return v===''||!isFinite(+v)?null:+v}
 document.addEventListener('input',function(e){if(!LAST||!e.target.matches||!e.target.matches('[data-cxe]'))return;var D=LAST.D,t=LAST.t,cs=caseOf(D);if(!cs)return;cs.data=cs.data||{};var X=cs.data._exp=cs.data._exp||{parts:{}},k=e.target.dataset.cxe,v=num(e.target.value);X.parts=X.parts||{};
  if(k=='total'){if(v==null)delete X.total;else X.total=v}else{if(v==null)delete X.parts[k];else X.parts[k]=v}
  clearTimeout(TM);TM=setTimeout(function(){var id=e.target.id,pos=e.target.selectionStart,val=e.target.value;apply(D,t);D.save();D.redraw();setTimeout(function(){var n=document.getElementById(id);if(n){if(n.value!==val&&!n.readOnly)n.value=val;n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}deco(D,t)},60)},350)},true);
 document.addEventListener('click',function(e){if(!LAST||!e.target.closest)return;var D=LAST.D,t=LAST.t,b=e.target.closest('[data-cxb]'),o=e.target.closest('[data-cxa]');if(b){e.preventDefault();e.stopPropagation();setBasis(D,t,b.dataset.cxb);apply(D,t);D.save();D.redraw();return}
  if(o&&o.dataset.cxa){e.preventDefault();e.stopPropagation();D.open(o.dataset.cxa)}},true);
 /* ручной выбор варианта / правка текста — пересчитать отметку «Изменено вручную» после обработки docs.js */
 function later(){if(!LAST)return;var D=LAST.D,t=LAST.t;setTimeout(function(){var c=D.cur&&D.cur();if(!c||c.id!==t.id)return;if(MEMO[String(((D.curCase()||{}).data||{})[CF(D).match_inn||'ДОЛЖНИК_ИНН']||'').replace(/\D/g,'')]&&apply(D,t))D.save();deco(D,t)},30)}
 document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#dform [data-chv]'))later()});document.addEventListener('input',function(e){if(e.target.closest&&e.target.closest('#dform [data-w^="ВЫВОД_"]'))later()});
 ArbConcl.mount=mount;ArbConcl._memo=MEMO;
})();
