window.ARB_FINDEB_CFG={"enabled": true, "section": "debtors", "list_limit": 40, "save_default": true, "lookup_poll_s": 30, "lookup_wait_min": 15, "fill": {"fdn": "ДОЛЖНИК_НАИМЕНОВАНИЕ", "finn": "ДОЛЖНИК_ИНН", "fbd": "ДАТА_ПРИНЯТИЯ_ЗАЯВЛЕНИЯ"}, "extra": {"ogrn": "ДОЛЖНИК_ОГРН", "address": "ДОЛЖНИК_АДРЕС", "case_no": "НОМЕР_ДЕЛА"}, "lookup_map": {"name": "ДОЛЖНИК_НАИМЕНОВАНИЕ", "ogrn": "ДОЛЖНИК_ОГРН", "addr_legal": "ДОЛЖНИК_АДРЕС"}, "lookup_case_from": "fedresurs.bankruptcy.case_no", "src_names": {"egrul": "ЕГРЮЛ/ЕГРИП (ФНС)", "fedresurs": "ЕФРСБ"}, "t": {"title": "Должник", "tab_cp": "Из контрагентов", "tab_man": "Вручную", "search": "Наименование / ФИО, ИНН или № дела", "clear": "Очистить", "open": "Открыть карточку ›", "found": "Найдено: {n}", "all": "Должники: {n}", "shown": "Показано {a} из {b} — уточните поиск", "none": "В «Контрагентах» пока нет должников — введите вручную", "nf": "Ничего не найдено по «{q}» — введите вручную", "locked": "Карточки должников зашифрованы — войдите по PIN или введите вручную.", "pick": "Выбрать должника", "pick_need": "Отметьте должника в списке", "cancel": "Отмена", "inn": "ИНН", "name": "Наименование", "case": "Номер дела", "opt": "необязательно", "inn_ph": "10 или 12 цифр", "name_ph": "ООО «Ромашка»", "case_ph": "А56-12345/2026", "inn_bad": "ИНН — 10 или 12 цифр, контрольная сумма не сходится", "need": "Укажите ИНН (10 или 12 цифр) и наименование", "exists": "Уже есть в «Контрагенты → Должники»: {n}", "exists_pick": "Выбрать эту карточку", "lk_sent": "Запрос в ФНС отправлен — реквизиты подтянутся в течение {m} мин. Можно заполнить вручную.", "lk_progress": "Запрос в работе — реквизиты подтянутся в течение {m} мин. Можно заполнить вручную.", "lk_done": "Реквизиты подтянуты — проверьте", "lk_fail": "Не удалось подтянуть — заполните вручную", "lk_wait_over": "Ответ не пришёл — заполните вручную", "src": "{s} · {d}", "manual_src": "введено вручную", "save": "Сохранить в Контрагенты → Должники", "save_locked": "Сохранить можно после входа по PIN — должник будет выбран без сохранения", "saved": "Карточка сохранена в «Контрагенты → Должники»", "save_dup": "Карточка с этим ИНН уже есть — выбрана она, новая не создана", "banner": "Должник: {n} · ИНН {i}", "banner_case": "Дело {c}", "change": "Изменить", "from_card": "из карточки контрагента", "from_manual": "введён вручную"}};
/* Arbitr App · Финанализ → «Должник»: из «Контрагенты → Должники» или вручную (макет Дизайнера 16.10.2026).
   Поиск и строка карточки — те же, что в шаге «Должник» в «Документах» (window.ArbDocsPick из docs.js), сортировка — как в разделе (ArbCpNav, arbitr.sort.<раздел>).
   «Вручную»: ИНН → реквизиты через существующую очередь проверки контрагентов (ArbCPQ, ЕГРЮЛ/ЕГРИП + ЕФРСБ), новых источников нет.
   Карточки должников — данные под PIN (A.save() → зашифрованное хранилище «Документов»); выбор держится только в памяти страницы, в localStorage не пишется.
   Настройки и тексты — config/fin_debtor.json → window.ARB_FINDEB_CFG. */
window.ArbFinDeb=(function(){
'use strict';
var CF=window.ARB_FINDEB_CFG||{},TT=CF.t||{};
var ST={tab:'cp',q:'',hl:null,sel:null,open:true,man:{inn:'',name:'',case:''},src:{},edited:{},lk:null,save:CF.save_default!==false,msg:''},PT=null;
function T(k,o){var s=TT[k];if(s==null)s=k;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function D(x){return String(x||'').replace(/\D/g,'')}
function $(id){return document.getElementById(id)}
function dmy(x){var m=/^(\d{4})-(\d\d)-(\d\d)/.exec(String(x||''));if(m)return m[3]+'.'+m[2]+'.'+m[1];var d=new Date(x);if(!x||isNaN(d))return String(x||'');var p=function(n){return ('0'+n).slice(-2)};return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()}
function iso(x){x=String(x||'').trim();var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(x);if(m)return m[3]+'-'+m[2]+'-'+m[1];return /^\d{4}-\d\d-\d\d/.test(x)?x.slice(0,10):''}
function Q(){return window.ArbCP&&ArbCP.qapi?ArbCP.qapi():null}
function A(){return (Q()||{}).A||null}
function cases(){var a=A();try{return (a&&a.S&&a.S().cases)||[]}catch(e){return []}}
function encOK(){var a=A();return !!(a&&a.encOK&&a.encOK())}
function innOK(v){var q=Q(),d=D(v);if(d.length!=10&&d.length!=12)return false;return q&&q.innOK?!!q.innOK(d):true}
function byInn(inn){inn=D(inn);return inn?cases().find(function(c){return D((c.data||{}).ДОЛЖНИК_ИНН)==inn})||null:null}
function sec(){return CF.section||'debtors'}
function nameOf(c){return (c.data||{}).ДОЛЖНИК_НАИМЕНОВАНИЕ||''}
function list(){var L=cases().slice(),N=window.ArbCpNav;if(N&&N.sort)L=N.sort(sec(),L,function(c){return N.caseTs(c)},nameOf);
 var q=ST.q.trim(),P=window.ArbDocsPick,M={};if(q&&P&&P.match){L=L.filter(function(c){var r=P.match(c,q);if(r)M[c.id]=r;return !!r})}
 return {L:L,M:M}}
function row(c,mt,i){var P=window.ArbDocsPick,h=P&&P.row?P.row(c,mt,false,i):'<div class="dr"><div class="tx"><div class="nm">'+E(nameOf(c))+'</div></div></div>';
 h=h.replace(/ id="dfdr\d+"/,'').replace(/ data-fdeb="[^"]*"/,'').replace(/ role="option"/,'');
 var on=ST.hl==c.id;h=h.replace(/^<div class="dr( hl)?"/,'<div class="dr fdr'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" tabindex="0" data-fdsel="'+E(c.id)+'"');
 return h.replace(/<\/div>$/,'<button type="button" class="fdopen" data-fdopen="'+E(c.id)+'">'+E(T('open'))+'</button></div>')}
function vCp(){var R=list(),all=cases().length,lim=+CF.list_limit||40,L=R.L.slice(0,lim),q=ST.q.trim(),N=window.ArbCpNav,h='';
 h+='<div class="fdsrow"><div class="fdcbi"><input id="fdq" type="search" autocomplete="off" enterkeyhint="search" value="'+E(ST.q)+'" placeholder="'+E(T('search'))+'" aria-label="'+E(T('search'))+'"></div>'+(N&&N.sortBtn&&all?N.sortBtn(sec()):'')+'</div>';
 if(!encOK()&&!all)return h+'<p class="sm fdwarn">'+E(T('locked'))+'</p>';
 h+='<div class="fddd" role="radiogroup" aria-label="'+E(T('title'))+'"><div class="fddh">'+E(q?T('found',{n:R.L.length}):T('all',{n:all}))+'</div>';
 h+=L.map(function(c,i){return row(c,R.M[c.id],i)}).join('');
 if(!L.length)h+='<div class="dr"><div class="tx"><div class="nm fdnone">'+E(q?T('nf',{q:q}):T('none'))+'</div></div></div>';
 if(R.L.length>L.length)h+='<div class="fddh">'+E(T('shown',{a:L.length,b:R.L.length}))+'</div>';
 return h+'</div>'}
function srcLine(k){var s=ST.src[k];return '<div class="fdsrc" id="fds_'+k+'">'+(s?E(s):'')+'</div>'}
function fld(k,lab,ph,opt,mode){return '<label class="fdfl"><span class="fdlab">'+E(lab)+(opt?' <i>('+E(T('opt'))+')</i>':'')+'</span>'+srcLine(k)+'<input id="fdm_'+k+'" value="'+E(ST.man[k])+'" placeholder="'+E(ph)+'" autocomplete="off"'+(mode?' inputmode="'+mode+'"':'')+'></label>'}
function lkLine(){var l=ST.lk;if(!l)return '';var m=+CF.lookup_wait_min||15,t=l.st=='sent'?T('lk_sent',{m:m}):l.st=='progress'?T('lk_progress',{m:m}):l.st=='done'?T('lk_done'):l.st=='timeout'?T('lk_wait_over'):T('lk_fail');return '<p class="sm fdlk'+(l.st=='fail'||l.st=='timeout'?' fdwarn':'')+'" role="status">'+E(t)+'</p>'}
function vMan(){var ex=byInn(ST.man.inn),h='<div class="fdman">'+fld('inn',T('inn'),T('inn_ph'),false,'numeric');
 var d=D(ST.man.inn);if(d.length>=10&&!innOK(d))h+='<p class="sm fdwarn">'+E(T('inn_bad'))+'</p>';
 if(ex)h+='<div class="fdex"><span class="sm">'+E(T('exists',{n:nameOf(ex)||d}))+'</span> <button type="button" class="link" data-fdexp="'+E(ex.id)+'">'+E(T('exists_pick'))+'</button></div>';
 else h+=lkLine();
 h+=fld('name',T('name'),T('name_ph'))+fld('case',T('case'),T('case_ph'),true);
 var lockSave=!encOK();h+='<label class="fdck"><input type="checkbox" id="fdsave"'+(ST.save&&!lockSave&&!ex?' checked':'')+(lockSave||ex?' disabled':'')+'> <span>'+E(T('save'))+'</span></label>'+(lockSave?'<p class="sm fdmut">'+E(T('save_locked'))+'</p>':'');
 return h+'</div>'}
function banner(){var s=ST.sel,d=s.data||{},sub=[d.НОМЕР_ДЕЛА?T('banner_case',{c:d.НОМЕР_ДЕЛА}):'',s.cid?T('from_card'):T('from_manual')].filter(Boolean).join(' · ');
 return '<div class="fdban" role="status"><div class="fdbt"><b>'+E(T('banner',{n:d.ДОЛЖНИК_НАИМЕНОВАНИЕ||'—',i:d.ДОЛЖНИК_ИНН||'—'}))+'</b><span class="sm">'+E(sub)+'</span></div><button type="button" class="link fdchg" data-fd="change">'+E(T('change'))+'</button></div>'}
function html(){if(ST.sel&&!ST.open)return banner();
 var h='<div class="fdbox"><div class="fdhd"><b>'+E(T('title'))+'</b><div class="fdseg" role="tablist">'+['cp','man'].map(function(k){var on=ST.tab==k;return '<button type="button" role="tab" aria-selected="'+on+'" class="'+(on?'on':'')+'" data-fdtab="'+k+'">'+E(T(k=='cp'?'tab_cp':'tab_man'))+'</button>'}).join('')+'</div></div>';
 h+=ST.tab=='cp'?vCp():vMan();
 h+='<div class="fdact"><button type="button" class="lbtn" data-fd="ok">'+E(T('pick'))+'</button>'+(ST.sel?' <button type="button" class="lbtn sec" data-fd="cancel">'+E(T('cancel'))+'</button>':'')+' <span class="sm fdmsg" role="status">'+E(ST.msg)+'</span></div>';
 return h+'</div>'}
function draw(keep){var el=$('fdpick');if(!el)return;var a=document.activeElement,id=a&&el.contains(a)?a.id:null,pos=id&&a.selectionStart!=null?a.selectionStart:null;el.innerHTML=html();
 if(id){var n=$(id);if(n){n.focus();try{if(pos!=null)n.setSelectionRange(pos,pos)}catch(e){}}}}
/* ---- заполнение полей анализа ---- */
function setF(id,v){var i=$(id);if(!i)return;if(i.type=='date')v=iso(v);i.value=v||'';i.dispatchEvent(new Event('input',{bubbles:true}))}
function apply(){var d=(ST.sel||{}).data||{},F=CF.fill||{};Object.keys(F).forEach(function(id){var v=d[F[id]];if(v||id=='fdn'||id=='finn')setF(id,v||'')})}
function extra(inn){var s=ST.sel;if(!s||D((s.data||{}).ДОЛЖНИК_ИНН)!=D(inn))return null;var X=CF.extra||{},o={};Object.keys(X).forEach(function(k){var v=(s.data||{})[X[k]];if(v)o[k]=String(v)});if(s.cid)o.card_id=s.cid;return o}
/* ---- выбор ---- */
function pickCard(id){var c=cases().find(function(x){return x.id==id});if(!c)return;ST.sel={cid:c.id,data:Object.assign({},c.data||{})};ST.open=false;ST.msg='';apply();draw()}
async function confirmMan(){var m=ST.man,inn=D(m.inn),nm=String(m.name||'').trim();if(!innOK(inn)||!nm){ST.msg=T('need');draw();return}
 var ex=byInn(inn);if(ex){pickCard(ex.id);toast(T('save_dup'));return}
 var data={ДОЛЖНИК_НАИМЕНОВАНИЕ:nm,ДОЛЖНИК_ИНН:inn};if(String(m.case||'').trim())data.НОМЕР_ДЕЛА=String(m.case).trim();
 Object.keys(ST.lkx||{}).forEach(function(k){if(!data[k]&&ST.lkx[k])data[k]=ST.lkx[k]});
 var cid=null,box=$('fdsave');if(box&&box.checked&&!box.disabled&&encOK()){var a=A();if(a&&a.save){var c={id:'c'+Date.now().toString(36),data:Object.assign({},data)};a.S().cases.push(c);a.save();cid=c.id;try{ArbCP.draw()}catch(e){}toast(T('saved'))}}
 ST.sel={cid:cid,data:data};ST.open=false;ST.msg='';stopLk();apply();draw()}
function toast(m){var a=A();if(a&&a.toast){try{a.toast(m);return}catch(e){}}if(typeof window.toast=='function')try{window.toast(m)}catch(e){}}
function openCard(id){var a=A();if(a&&a.showTab)a.showTab('cp');else{var b=document.querySelector('nav button[data-v="cp"]');if(b)b.click()}
 if(window.ArbCP&&ArbCP.openSec)ArbCP.openSec(sec());var n=0,t=setInterval(function(){var el=document.querySelector('[data-debid="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]');if(el||++n>20){clearInterval(t);if(el)el.click()}},100)}
/* ---- реквизиты по ИНН: существующая очередь ArbCPQ (ЕГРЮЛ/ЕГРИП + ЕФРСБ) ---- */
function K(){var a=A(),C=a&&a.C?a.C():{};return (C.counterparties||{}).inn_lookup||{}}
function stopLk(){clearTimeout(PT);PT=null}
async function lookup(inn){stopLk();ST.lk=null;ST.lkx={};if(!window.ArbCPQ||!ArbCPQ.send){ST.lk={st:'fail'};draw();return}
 var tag='fin_'+Date.now().toString(36),kind=inn.length==12?'fl':'ul',id;
 try{id=await ArbCPQ.send('refresh',{items:[{cid:tag,kind:kind,inn:inn,name:''}]},{cids:[tag]});
  try{var L=JSON.parse(localStorage.getItem('arbitr_cpq')||'[]').filter(function(q){return q.id!=id});localStorage.setItem('arbitr_cpq',JSON.stringify(L))}catch(e){}/* ответ разбирает этот модуль, не карточки контрагентов */
 }catch(e){if(D(ST.man.inn)==inn){ST.lk={st:'fail'};draw()}return}
 if(D(ST.man.inn)!=inn)return;ST.lk={st:'sent',id:id,inn:inn,at:Date.now()};draw();PT=setTimeout(poll,8000)}
async function poll(){var l=ST.lk;if(!l||!l.id||l.st=='done')return;var a=A();
 if(Date.now()-l.at>(+CF.lookup_wait_min||15)*60000){l.st='timeout';draw();return}
 try{var rs=K().results||'arbitr/cp_results/',r=await ghApi(rs+l.id+'.enc');
  if(r.ok&&a&&a.vdec){var j=await r.json(),res=JSON.parse(new TextDecoder().decode(await a.vdec(atob(String(j.content||'').replace(/\s/g,'')))));got(l,res);return}
  var rq=K().requests||'arbitr/cp_requests/',r2=await ghApi(rq+l.id+'.json');if(r2.ok){var b=JSON.parse(decodeURIComponent(escape(atob(String((await r2.json()).content||'').replace(/\s/g,'')))));if(b.status=='in_progress'&&l.st!='progress'){l.st='progress';draw()}}
 }catch(e){}
 if(ST.lk===l)PT=setTimeout(poll,(+CF.lookup_poll_s||30)*1000)}
function path(o,p){return String(p||'').split('.').reduce(function(x,k){return x&&x[k]},o)}
function got(l,res){if(ST.lk!==l)return;var it=(res.items||[])[0]||{},u=it.updates||{},M=CF.lookup_map||{},S=CF.src_names||{},d=dmy(it.checked_at||new Date().toISOString()),n=0;ST.lkx={};
 Object.keys(M).forEach(function(k){if(u[k]){ST.lkx[M[k]]=String(u[k]);n++}});
 if(u.name&&!ST.edited.name){ST.man.name=String(u.name);ST.src.name=T('src',{s:S.egrul||'egrul',d:d})}
 var cn=path(it,CF.lookup_case_from);if(cn&&!ST.edited.case&&!String(ST.man.case||'').trim()){ST.man.case=String(cn);ST.src.case=T('src',{s:S.fedresurs||'fedresurs',d:d});n++}
 if(n||u.ogrn)ST.src.inn=T('src',{s:S.egrul||'egrul',d:d});
 l.st=n?'done':'fail';draw()}
/* ---- события ---- */
function bind(root){
 root.addEventListener('click',function(e){var t=e.target;
  var op=t.closest('[data-fdopen]');if(op){e.preventDefault();e.stopPropagation();openCard(op.dataset.fdopen);return}
  var s=t.closest('[data-fdsel]');if(s){ST.hl=s.dataset.fdsel;ST.msg='';draw();return}
  var ex=t.closest('[data-fdexp]');if(ex){pickCard(ex.dataset.fdexp);return}
  var tb=t.closest('[data-fdtab]');if(tb){ST.tab=tb.dataset.fdtab;ST.msg='';draw();return}
  var b=t.closest('[data-fd]');if(!b)return;e.preventDefault();var k=b.dataset.fd;
  if(k=='change'){ST.open=true;ST.hl=ST.sel&&ST.sel.cid||null;draw();return}
  if(k=='cancel'){ST.open=false;ST.msg='';draw();return}
  if(k=='ok'){if(ST.tab=='cp'){if(!ST.hl){ST.msg=T('pick_need');draw();return}pickCard(ST.hl)}else confirmMan()}});
 root.addEventListener('keydown',function(e){var s=e.target.closest&&e.target.closest('[data-fdsel]');if(s&&(e.key==' '||e.key=='Enter')){e.preventDefault();ST.hl=s.dataset.fdsel;if(e.key=='Enter')pickCard(ST.hl);else draw()}
  if(e.target.id=='fdq'&&e.key=='Enter')e.preventDefault();if(/^fdm_/.test(e.target.id||'')&&e.key=='Enter')e.preventDefault()});
 root.addEventListener('input',function(e){var i=e.target;if(i.id=='fdq'){ST.q=i.value;clearTimeout(draw.t);draw.t=setTimeout(function(){draw()},150);return}
  var m=/^fdm_(\w+)$/.exec(i.id||'');if(!m)return;var k=m[1];ST.man[k]=i.value;ST.edited[k]=true;
  if(k!='inn'){if(ST.src[k]){ST.src[k]=T('manual_src');var sl=$('fds_'+k);if(sl)sl.textContent=ST.src[k]}return}
  var d=D(i.value),mn=T('manual_src');['inn','name','case'].forEach(function(x){if(ST.src[x]&&ST.src[x]!=mn)delete ST.src[x]});ST.lkx={};if((d.length==10||d.length==12)&&innOK(d)&&!byInn(d)){if(!ST.lk||ST.lk.inn!=d)lookup(d)}else{stopLk();ST.lk=null}
  clearTimeout(draw.t);draw.t=setTimeout(function(){draw()},250)});
 root.addEventListener('change',function(e){if(e.target.id=='fdsave')ST.save=e.target.checked});
 /* меню сортировки ArbCpNav перерисовывает свой раздел; здесь — свой список (тот же ключ arbitr.sort.<раздел>) */
 document.addEventListener('click',function(e){var it=e.target.closest&&e.target.closest('[data-cpsort]');if(it&&root.contains(it))setTimeout(function(){draw()},0)},true)}
function mount(){if(CF.enabled===false)return false;var f=$('ff'),n=$('fdn');if(!f||!n)return false;if($('fdpick'))return true;
 var row=n.closest('.g2');var el=document.createElement('div');el.id='fdpick';el.className='fdpick';(row||n).parentNode.insertBefore(el,row||n);
 if(row){row.classList.add('fdhid');row.hidden=true}['fdn','finn'].forEach(function(id){var i=$(id);if(i)i.removeAttribute('required')});
 bind(el);f.addEventListener('reset',function(){setTimeout(function(){ST.sel=null;ST.open=true;ST.hl=null;ST.q='';ST.man={inn:'',name:'',case:''};ST.src={};ST.edited={};ST.lk=null;ST.lkx={};stopLk();draw()},0)});
 draw();var v=$('vfin');if(v)new MutationObserver(function(){if(v.style.display!='none'&&!ST.sel&&ST.tab=='cp')draw()}).observe(v,{attributes:true,attributeFilter:['style']});return true}
if(!mount()){var tries=0,iv=setInterval(function(){if(mount()||++tries>100)clearInterval(iv)},200)}
return {extra:extra,state:function(){return {tab:ST.tab,sel:ST.sel?{cid:ST.sel.cid}:null,open:ST.open,lk:ST.lk&&ST.lk.st}},draw:draw,_got:function(res){if(ST.lk)got(ST.lk,res)}};
})();
