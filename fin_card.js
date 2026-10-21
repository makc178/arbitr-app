window.ARB_FINCARD_CFG={"enabled": true, "date_format": "DD.MM.YYYY", "level_map": {"high": "high", "medium": "mid", "mid": "mid", "low": "low"}, "ops_kinds": ["bank", "osv", "card"], "causes_visible": 3, "limits_visible": 3, "legacy_fetch_max": 30, "legend_open_from_px": 1100, "palette": {"risk_high": "#F87171", "risk_high_bg": "rgba(248,113,113,.12)", "risk_high_line": "rgba(248,113,113,.45)", "risk_mid": "#E0A020", "risk_mid_bg": "rgba(224,160,32,.14)", "risk_mid_line": "rgba(224,160,32,.45)", "risk_low": "#5EEAD4", "risk_low_bg": "rgba(20,184,166,.16)", "risk_low_line": "rgba(94,234,212,.40)", "risk_none": "#C9D6D3", "risk_none_bg": "rgba(230,244,241,.05)", "risk_none_line": "rgba(230,244,241,.30)"}, "palette_light": {"risk_high": "#a8483f", "risk_high_bg": "#fbeeec", "risk_high_line": "rgba(168,72,63,.45)", "risk_mid": "#8a5d10", "risk_mid_bg": "#fbf3e3", "risk_mid_line": "rgba(138,93,16,.45)", "risk_low": "#0D6E66", "risk_low_bg": "#DDF3EC", "risk_low_line": "rgba(13,110,102,.40)", "risk_none": "#5F857E", "risk_none_bg": "rgba(15,46,42,.04)", "risk_none_line": "rgba(15,46,42,.30)"}, "layout": {"card_radius_px": 18, "card_pad_px": 24, "card_pad_mobile_px": 16, "btn_h_px": 44, "btn_radius_px": 12, "chip_h_px": 26, "mobile_from_px": 700}, "icons": {"pdf": "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6", "doc": "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M8 13h8 M8 17h5", "play": "M12 5v14 M5 12h14", "info": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01", "dash": "M5 12h14", "check": "M20 6L9 17l-5-5", "alert": "M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z", "chev": "M6 9l6 6 6-6"}, "t": {"form_badge": {"simple": "Упрощённый · по бухотчётности", "full": "Полный"}, "prelim_chip": "Предварительный", "prepared_tpl": "Подготовлен {d}", "meta_inn": "ИНН {v}", "meta_case": "Дело возбуждено {d}", "meta_years": "Отчётность {v}", "risk_label": "Риск вывода активов", "risk_levels": {"high": "Высокий риск", "mid": "Повышенный риск", "low": "Низкий риск", "none": "Риск не оценивался"}, "risk_basis_tpl": "Оценён по {n} признакам операций: выписки, ОСВ, карточки счетов", "risk_none_reason_title": "Почему не оценивался", "run_btn": "Запустить полный анализ", "run_hint": "Добавьте выписки, ОСВ или карточки счетов — отчёт пересчитается в полной форме, риск и признаки по ПП № 855 будут проверены.", "insolv_label": "Признаки неплатёжеспособности", "insolv_tpl": "не позднее {d}", "insolv_note_simple": "по годовой отчётности, точность — до отчётной даты", "insolv_note_full": "первая неисполненная обязанность по реестру требований", "insuff_label": "Недостаточность имущества", "causes_title_simple": "Вероятные причины утраты платёжеспособности", "causes_title_full": "Причины утраты платёжеспособности", "causes_more_tpl": "Ещё {n} — в отчёте", "pp855_label": "Признаки фиктивного и преднамеренного банкротства (ПП № 855)", "pp855_status": {"found": "Выявлены", "not_found": "Не выявлены", "not_checked": "Не проверялись"}, "pp855_note_not_checked": "Нет документов по сделкам (п. 2 Временных правил). Вывод делается только в полной форме.", "pp855_basis_tpl": "Проверено по документам: {v}", "limits_title": "Ограничения анализа", "limits_show_tpl": "Показать все ({n})", "limits_hide": "Свернуть", "pdf_btn": "PDF", "docx_btn": "DOCX", "pdf_title": "Открыть PDF (после ввода PIN)", "docx_title": "Скачать DOCX для правки (после ввода PIN)", "footnote": "Аналитическая справка для арбитражного управляющего, не заменяет его заключение о финансовом состоянии должника.", "legend_title": "Как читать статус", "legend": [{"kind": "high", "title": "Высокий / повышенный риск", "text": "Полная форма. Операции проанализированы, найдены признаки вывода активов."}, {"kind": "low", "title": "Низкий риск", "text": "Полная форма. Операции проанализированы, значимых признаков нет."}, {"kind": "none", "title": "Риск не оценивался", "text": "Упрощённая форма: загружена только бухотчётность, операции не анализировались. Это не «низкий риск»."}], "legend_pp_title": "ПП № 855", "legend_pp": [{"kind": "not_found", "text": "«Не выявлены» — только в полной форме, с перечнем проверенных документов."}, {"kind": "not_checked", "text": "«Не проверялись» — в упрощённой форме всегда. Слова «не выявлены» здесь запрещены."}], "risk_none_reason_fs_tpl": "Загружена только бухгалтерская отчётность ({n} {files}). Операции должника — выписки, ОСВ, карточки счетов — не анализировались, поэтому уровень риска не определён. Это не «низкий риск».", "risk_none_reason_nofs": "Выписки, ОСВ и карточки счетов не загружались, операции должника не анализировались, поэтому уровень риска не определён. Это не «низкий риск».", "risk_none_reason_legacy": "Отчёт подготовлен до разделения на упрощённую и полную форму, анализа операций в нём нет, поэтому уровень риска не определён. Это не «низкий риск».", "files_plural": ["файл", "файла", "файлов"], "list_badge": {"high": "высокий", "mid": "средний", "low": "низкий", "none": "не оценивался", "pending": "…"}, "list_badge_title": {"none": "Риск не оценивался: операции должника не анализировались", "pending": "Проверяю форму отчёта"}, "list_sub_none_tpl": "ИНН {inn} · {date} · {form}", "list_sub_form": {"simple": "упрощённая форма, по бухотчётности", "full": "полная форма", "legacy": "операции не анализировались"}, "filter_none": "не оценивался", "loading": "Загружаю отчёт…", "load_err_tpl": "Не удалось загрузить отчёт: {e}", "run_scroll_note": "Добавьте выписки, ОСВ или карточки счетов в форму «Новый анализ» выше — отчёт будет подготовлен в полной форме.", "data_error_log": "Финанализ: ошибка данных отчёта", "file_pdf_tpl": "{n} — финанализ.pdf", "file_docx_tpl": "{n} — финанализ.docx", "err_result_tpl": "result.json: {e}", "err_pp_nobasis": "полная форма: pp855=not_found без перечня документов"}, "nbsp_units": ["тыс", "млн", "руб", "%", "₽", "г."]};
/* Arbitr App · Финанализ — карточка отчёта и состояние «Риск не оценивался» (макет Дизайнера, утверждён 21.10.2026 20:37 МСК).
   Правило: form=simple или risk_assessed=false → всегда «Риск не оценивался» и ПП 855 «Не проверялись», даже если движок прислал
   risk_level=low / pp855=not_found (такое пишется в консоль как ошибка данных). Старые отчёты без form/risk_assessed: смотрим result.json —
   нет анализа операций (выписки/ОСВ/карточки) → тоже «не оценивался»; пока result.json не загружен — нейтральный «…», не «низкий».
   Тексты, цвета, лимиты — config/fin_card.json → window.ARB_FINCARD_CFG (без хардкода). Персональные данные не пишутся ни в консоль, ни в localStorage. */
(function(root){
'use strict';
var CF=(root&&root.ARB_FINCARD_CFG)||{},TT=CF.t||{},LOGGED={},FETCHING={},OPEN_LIM={};
function T(k){var s=TT[k];return s==null?k:s}
function F(s,o){s=String(s==null?'':s);Object.keys(o||{}).forEach(function(n){s=s.split('{'+n+'}').join(o[n])});return s}
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var _UN=null;function UNR(){if(!(CF.nbsp_units||[]).length)return /$^/g;if(!_UN)_UN=new RegExp('(\\d) (?=('+(CF.nbsp_units||[]).map(function(u){return u.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+'))','g');_UN.lastIndex=0;return _UN}
function NB(s){return String(s==null?'':s).replace(/(\d) (?=\d{3}(?!\d))/g,'$1\u00a0').replace(UNR(),'$1\u00a0').replace(/№ (?=\d)/g,'№\u00a0')}
function D(iso){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||''));if(!m)return '';return (CF.date_format||'DD.MM.YYYY').replace('DD',m[3]).replace('MM',m[2]).replace('YYYY',m[1])}
function plural(n,f){f=f||['','',''];var a=Math.abs(n)%100,b=a%10;return a>10&&a<20?f[2]:b>1&&b<5?f[1]:b===1?f[0]:f[2]}
function ic(k){var p=(CF.icons||{})[k];return p?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+E(p)+'"/></svg>':''}
function kinds(r){return ((r&&r.files)||[]).map(function(f){return f&&f.kind})}
function hasOps(r){if(!r)return false;var ok=CF.ops_kinds||['bank','osv','card'];return (r.tx_count>0)||((r.operations||[]).length>0)||kinds(r).some(function(k){return ok.indexOf(k)>=0})}
function pp855(e,r){var p=(r&&(r.pp855||(r.fs_analysis||{}).pp855))||null;if(p)return p;return e&&e.pp855?(typeof e.pp855==='string'?{status:e.pp855}:e.pp855):null}
/* Главное: статус карточки. e — строка finance/index.json, r — result.json (может быть ещё не загружен). */
function status(e,r){
  e=e||{};var rr=r&&!r.err?r:null;var form=e.form||(rr&&rr.form)||null;
  var ra=e.risk_assessed!=null?e.risk_assessed:(rr&&rr.risk_assessed!=null?rr.risk_assessed:null);
  var lvl=e.risk_level||(rr&&rr.risk_level)||null,p=pp855(e,rr),ps=p&&p.status||null,errs=[];
  if(form==='simple'||ra===false){
    if(form==='simple'&&ra===true)errs.push('form=simple, risk_assessed=true');
    if(ps&&ps!=='not_checked')errs.push((form||'?')+': pp855='+ps);
    return {state:'none',form:form||'simple',legacy:false,pp:'not_checked',errors:errs,fs:kinds(rr).filter(function(k){return k==='fs'}).length,loaded:!!rr}}
  if(!form&&ra==null){
    if(!r)return {state:'pending',form:null,legacy:true,pp:'not_checked',errors:[],loaded:false};
    if(!rr||!hasOps(rr))return {state:'none',form:null,legacy:true,pp:'not_checked',errors:r&&r.err?[F(T('err_result_tpl'),{e:r.err})]:[],fs:kinds(rr).filter(function(k){return k==='fs'}).length,loaded:!!rr}}
  var lv=(CF.level_map||{})[lvl];
  if(!lv){errs.push('risk_level='+lvl);return {state:'none',form:form,legacy:!form,pp:'not_checked',errors:errs,loaded:!!rr}}
  var pst='not_checked',basis=p&&(p.basis||p.checked_docs);
  if(ps==='found')pst='found';else if(ps==='not_found'){if(basis)pst='not_found';else errs.push(T('err_pp_nobasis'))}
  return {state:lv,form:form||'full',legacy:!form,pp:pst,ppBasis:Array.isArray(basis)?basis.join(', '):basis,errors:errs,loaded:!!rr}}
function logErr(cid,s){if(!s.errors.length||LOGGED[cid])return;LOGGED[cid]=1;try{(root.__finDataErrors=root.__finDataErrors||[]).push({id:cid,errors:s.errors.slice()});console.warn(T('data_error_log'),cid,s.errors.join('; '))}catch(_){}}
function key(cid,e,r){var s=status(e,r);logErr(cid,s);return s.state==='mid'?'medium':s.state}
function badge(cid,e,r){var s=status(e,r);logErr(cid,s);var lb=T('list_badge'),tt=T('list_badge_title');
  return '<span class="rk fcb '+E(s.state)+'"'+(tt[s.state]?' title="'+E(tt[s.state])+'"':'')+'>'+E(lb[s.state]||'—')+'</span>'}
function assessed(s){return s.state==='high'||s.state==='mid'||s.state==='low'}
function sub(cid,e,r,dflt){var s=status(e,r);if(assessed(s)||s.state==='pending')return dflt;var lf=T('list_sub_form');
  return E(F(T('list_sub_none_tpl'),{inn:e.inn||'—',date:D(e.date)||'—',form:s.legacy?lf.legacy:(lf[s.form]||'')}))}
function years(r){var fa=(r&&r.fs_analysis)||{},y=fa.years||((r&&r.financial_state)||{}).years||[];if(!y.length)return '';y=y.map(Number).sort();return y[0]===y[y.length-1]?String(y[0]):y[0]+'\u2060–\u2060'+y[y.length-1]}
function card(cid,e,r){
  e=e||{};var s=status(e,r);logErr(cid,s);
  if(!r)return '<div class="fcard"><p class="sm">'+E(T('loading'))+'</p></div>';
  var rr=r.err?null:r,ok=assessed(s),fb=T('form_badge'),h=[],deb=(rr&&rr.debtor)||{};
  h.push('<div class="fcard" data-fcard="'+E(cid)+'">');
  if(r.err)h.push('<p class="sm">'+E(F(T('load_err_tpl'),{e:r.err}))+'</p>');
  h.push('<div class="fc-top">');
  if(s.form&&!s.legacy)h.push('<span class="fc-chip form-'+E(s.form)+'">'+ic(s.form==='simple'?'doc':'pdf')+E(fb[s.form]||'')+'</span>');
  if(s.form==='simple')h.push('<span class="fc-chip prelim">'+E(T('prelim_chip'))+'</span>');
  if(e.date)h.push('<span class="fc-dt">'+E(F(T('prepared_tpl'),{d:D(e.date)}))+'</span>');
  h.push('</div><div class="fc-meta">');
  var inn=e.inn||deb.inn;if(inn)h.push('<span>'+E(F(T('meta_inn'),{v:inn}))+'</span>');
  if(rr&&rr.bankruptcy_date&&rr.bankruptcy_date_given!==false)h.push('<span>'+E(F(T('meta_case'),{d:D(rr.bankruptcy_date)}))+'</span>');
  var yy=years(rr);if(yy)h.push('<span>'+E(F(T('meta_years'),{v:yy}))+'</span>');
  h.push('</div>');
  var lv=T('risk_levels');
  if(ok){var n=Object.keys((rr&&rr.signs)||{}).length;
    h.push('<div class="fc-risk lv-'+E(s.state)+'"><div class="rl">'+E(T('risk_label'))+'</div><div class="rv"><span class="dot"></span>'+E(lv[s.state])+'</div>'+(n?'<div class="rs">'+E(F(T('risk_basis_tpl'),{n:n}))+'</div>':'')+'</div>')}
  else{var why=s.legacy?T('risk_none_reason_legacy'):(s.fs?F(T('risk_none_reason_fs_tpl'),{n:s.fs,files:plural(s.fs,T('files_plural'))}):T('risk_none_reason_nofs'));
    h.push('<div class="fc-risk lv-none"><div class="rl">'+E(T('risk_label'))+'</div><div class="rv"><span class="ic">'+ic('dash')+'</span>'+E(lv.none)+'</div>'+
      '<div class="why"><b>'+E(T('risk_none_reason_title'))+'</b><p>'+E(why)+'</p></div>'+
      '<div class="runrow"><div class="h">'+E(T('run_hint'))+'</div><button type="button" class="fc-btn pri" data-fcrun="'+E(cid)+'">'+ic('play')+E(T('run_btn'))+'</button></div>'+
      '<div class="fc-runnote" hidden>'+E(T('run_scroll_note'))+'</div></div>')}
  var fa=(rr&&rr.fs_analysis)||{},facts=[];
  if(fa.insolvency_year)facts.push([T('insolv_label'),F(T('insolv_tpl'),{d:D(fa.insolvency_year+'-12-31')}),T('insolv_note_simple')]);
  if(fa.insufficiency_year)facts.push([T('insuff_label'),F(T('insolv_tpl'),{d:D(fa.insufficiency_year+'-12-31')}),T('insolv_note_simple')]);
  if(facts.length)h.push('<div class="fc-facts">'+facts.map(function(f){return '<div class="fact"><div class="k">'+E(f[0])+'</div><div class="v">'+E(f[1])+'</div><div class="n">'+E(f[2])+'</div></div>'}).join('')+'</div>');
  var cs=(rr&&rr.causes)||e.causes||[],cv=CF.causes_visible||3;
  if(cs.length)h.push('<div class="fc-blk"><div class="fc-blk-t">'+E(T(ok?'causes_title_full':'causes_title_simple'))+'</div><ol class="fc-causes">'+cs.slice(0,cv).map(function(c){return '<li><span>'+E(NB(c))+'</span></li>'}).join('')+'</ol>'+(cs.length>cv?'<div class="more">'+E(F(T('causes_more_tpl'),{n:cs.length-cv}))+'</div>':'')+'</div>');
  var pst=T('pp855_status');
  h.push('<div class="fc-pp"><div class="t">'+E(T('pp855_label'))+'</div><span class="fc-chip pp-'+E(s.pp)+'">'+(s.pp==='not_checked'?ic('dash'):s.pp==='found'?ic('alert'):ic('check'))+E(pst[s.pp])+'</span>'+
    '<div class="s">'+E(s.pp==='not_checked'?T('pp855_note_not_checked'):s.ppBasis?F(T('pp855_basis_tpl'),{v:s.ppBasis}):'')+'</div></div>');
  var lim=(rr&&rr.limitations)||[],lvv=CF.limits_visible||3,op=!!OPEN_LIM[cid];
  if(lim.length){var shown=op?lim:lim.slice(0,lvv);
    h.push('<div class="fc-lim'+(op?' open':'')+'"><div class="fc-lim-h">'+ic('info')+'<span>'+E(T('limits_title'))+'</span>'+
      (lim.length>lvv?'<button type="button" class="c" data-fclim="'+E(cid)+'">'+E(op?T('limits_hide'):F(T('limits_show_tpl'),{n:lim.length}))+ic('chev')+'</button>':'')+'</div>'+
      '<ul>'+shown.map(function(x){return '<li>'+E(NB(x))+'</li>'}).join('')+'</ul></div>')}
  var nm=String(e.debtor||cid).replace(/[\\/:*?"<>|«»]+/g,'');
  h.push('<div class="fc-acts">');
  if(e.report)h.push('<button type="button" class="fc-btn" title="'+E(T('pdf_title'))+'" data-f="'+E(F(T('file_pdf_tpl'),{n:nm}))+'" data-p="'+E(e.report)+'">'+E(T('pdf_btn'))+'</button>');
  if(e.report_docx)h.push('<button type="button" class="fc-btn" title="'+E(T('docx_title'))+'" data-f="'+E(F(T('file_docx_tpl'),{n:nm}))+'" data-p="'+E(e.report_docx)+'">'+E(T('docx_btn'))+'</button>');
  h.push('</div>');
  if(!ok)h.push('<div class="fc-fn">'+E(T('footnote'))+'</div>');
  h.push('</div>');return h.join('')}
function legend(){var L=T('legend'),P=T('legend_pp');if(!Array.isArray(L))return '';
  return '<details class="fc-legend" id="fclegend"><summary>'+E(T('legend_title'))+'</summary><div class="lg">'+
    L.map(function(x){return '<div class="lg-i"><span class="sw '+E(x.kind)+'"></span><div><b>'+E(x.title)+'</b><span>'+E(x.text)+'</span></div></div>'}).join('')+
    '<h3>'+E(T('legend_pp_title'))+'</h3>'+(P||[]).map(function(x){return '<div class="lg-i"><span class="sw pp-'+E(x.kind)+'"></span><div><span>'+E(x.text)+'</span></div></div>'}).join('')+'</div></details>'}
/* старые отчёты без form/risk_assessed: подгрузить result.json, чтобы решить «оценён / не оценивался» (не больше legacy_fetch_max) */
function need(FIN,FRES,get,redraw){if(typeof get!=='function')return;var n=0,max=CF.legacy_fetch_max||30;
  Object.keys(FIN||{}).forEach(function(c){var e=FIN[c]||{};if(e.form||e.risk_assessed!=null||FRES[c]||FETCHING[c]||!e.result||n>=max)return;n++;FETCHING[c]=1;
    Promise.resolve().then(function(){return get(e.result)}).then(function(t){FRES[c]=typeof t==='string'?JSON.parse(t):t},function(x){FRES[c]={err:(x&&x.message)||String(x)}}).then(function(){delete FETCHING[c];try{redraw&&redraw()}catch(_){}})})}
function init(doc,redraw){if(!doc||CF.enabled===false)return;
  var sel=doc.getElementById('frisk');if(sel&&!sel.querySelector('option[value=none]')){var o=doc.createElement('option');o.value='none';o.textContent=T('filter_none');sel.appendChild(o)}
  var pal=CF.palette||{},pl=CF.palette_light||{},css=[],ly=CF.layout||{};
  function vars(p){return Object.keys(p).map(function(k){return '--'+k.replace(/_/g,'-')+':'+p[k]}).join(';')}
  css.push('#vfin{'+vars(pal)+';--fc-r:'+(ly.card_radius_px||18)+'px;--fc-pad:'+(ly.card_pad_px||24)+'px;--fc-pad-m:'+(ly.card_pad_mobile_px||16)+'px;--fc-btn-h:'+(ly.btn_h_px||44)+'px;--fc-btn-r:'+(ly.btn_radius_px||12)+'px;--fc-chip-h:'+(ly.chip_h_px||26)+'px}');
  css.push('html[data-theme=light] #vfin{'+vars(pl)+'}');
  var st=doc.createElement('style');st.id='fincard-vars';st.textContent=css.join('\n');doc.head.appendChild(st);
  var fl=doc.getElementById('finl');
  if(fl&&!doc.getElementById('fclegend')){fl.insertAdjacentHTML('beforebegin',legend());var lg=doc.getElementById('fclegend');if(lg&&root.innerWidth>=(CF.legend_open_from_px||1100))lg.open=true}
  if(fl)fl.addEventListener('click',function(ev){
    var b=ev.target.closest&&ev.target.closest('[data-fclim]');if(b){ev.stopPropagation();var c=b.getAttribute('data-fclim');OPEN_LIM[c]=!OPEN_LIM[c];redraw&&redraw();return}
    var r=ev.target.closest&&ev.target.closest('[data-fcrun]');if(r){ev.stopPropagation();run(doc,r)}},true)}
function run(doc,btn){var c=btn.getAttribute('data-fcrun'),F0=root.__arbFinGet?root.__arbFinGet(c):null,e=(F0&&F0.e)||{},rr=(F0&&F0.r&&!F0.r.err)?F0.r:{};
  var nt=btn.closest('.fc-risk')&&btn.closest('.fc-risk').querySelector('.fc-runnote');if(nt)nt.hidden=false;
  var fm=doc.getElementById('fform');if(fm)fm.open=true;
  function setv(id,v){var x=doc.getElementById(id);if(x&&!x.value&&v){x.value=v;x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}))}}
  setv('fdn',e.debtor||(rr.debtor||{}).name);setv('finn',e.inn||(rr.debtor||{}).inn);if(rr.bankruptcy_date_given!==false)setv('fbd',rr.bankruptcy_date);
  var tg=doc.getElementById('fdrop')||fm;if(tg&&tg.scrollIntoView)tg.scrollIntoView({behavior:'smooth',block:'center'})}
var API={status:status,key:key,badge:badge,sub:sub,card:card,legend:legend,need:need,init:init,assessed:function(cid,e,r){return assessed(status(e,r))},_D:D,_plural:plural};
if(typeof module!=='undefined'&&module.exports)module.exports=function(cfg){CF=cfg||{};TT=CF.t||{};LOGGED={};return API};
if(root)root.ArbFinCard=API;
})(typeof window!=='undefined'?window:null);

addEventListener("load",function(){ArbFinCard.init(document,function(){try{finRender()}catch(_){}})});
