
/* EV_APP: true только в сборке Everest (claims_app/build.py). Arbitr читает шаблон как есть → false: нет удаления valuation/, записи deleted.json, нормализации регионов */
const EV_APP=/*__EVAPP__*/false;
const EMR=null,EMB=/*__DATA__*/null, EMD=/*__MD__*/null, REPO='makc178/claims-registry-data', BRANCH='main';

const IDB=(DB)=>{const ST='kv';let P=null;const db=()=>P||(P=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('no idb'));const o=indexedDB.open(DB,1);o.onupgradeneeded=()=>{if(!o.result.objectStoreNames.contains(ST))o.result.createObjectStore(ST)};o.onsuccess=()=>res(o.result);o.onerror=()=>{P=null;rej(o.error)}}));
const get=async k=>{const d=await db();return new Promise((res,rej)=>{const r=d.transaction(ST).objectStore(ST).get(k);r.onsuccess=()=>res(r.result??null);r.onerror=()=>rej(r.error)})};
const put=async(k,v)=>{const d=await db();return new Promise((res,rej)=>{const t=d.transaction(ST,'readwrite');v==null?t.objectStore(ST).delete(k):t.objectStore(ST).put(v,k);t.oncomplete=()=>res(true);t.onerror=t.onabort=()=>rej(t.error)})};
return {get:k=>get(k).catch(()=>null),set:(k,v)=>put(k,v).catch(()=>false)}};
const KEYDB=IDB('claims-key'),CACHE=IDB('claims-cache'),OLDV=IDB('makc178-vault'); // ключ отдельно от 7 МБ данных
const VAULT={get:k=>k.endsWith('token')?KEYDB.get(k):CACHE.get(k),set:(k,v)=>k.endsWith('token')?KEYDB.set(k,v):CACHE.set(k,v),persist:()=>{try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}}};
let BOOTED=false,TOKEN=null,LERR=null,LOADING=false;const VER='2026-10-29 12:02 UTC · 9e6efe2',VH=(VER.match(/[0-9a-f]{7}$/)||['dev'])[0],PINBLOB={"v": 1, "bv": 1793269363, "kind": "write", "kdf": "PBKDF2-SHA256", "iterations": 600000, "salt": "Uz4XYofE6DghzUdBAcJF7Q==", "iv": "6SrsisxzfaWHIX60", "ct": "grI+t+tGmphtBU0jcZEqA0MiROAgsgmfRW6PbbmBTAAio+rt0iXQVX0LjspQitAW08S46Flgv6hiex3Sy2EBoydyNnyS2tb7HaWhvmv7fz5VjXrOc4dWhRjTd4B6EKnTs9sc7kCBE+XM86QE/Zk4f774YHY="};let PINOK=!PINBLOB;

const LS='cr.data',LM='cr.md',LT='cr.token',$=id=>document.getElementById(id);
let DATA=null,MD=EMD,SRC='',SHOW=100,OPEN=new Set(),SK='score',SD=-1;
const ls={g:k=>{try{return localStorage.getItem(k)}catch(e){return null}},s:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},d:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const fpct=v=>{if(v==null||!isFinite(v))return '—';if(v>0&&v<0.01)return '<0,01%';return v.toLocaleString('ru-RU',{maximumFractionDigits:v<1?2:1}).replace(/\u00a0|\u202f/g,' ')+'%'};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{if(v==null||v==='')return null;const n=typeof v==='number'?v:parseFloat(String(v).replace(/\s/g,'').replace(',','.'));return isFinite(n)?n:null};
const rub=v=>{v=num(v);return v==null?'—':v.toLocaleString('ru-RU',{maximumFractionDigits:v<1000?2:0})};
const dd=s=>{if(!s)return '—';const m=String(s).match(/(\d{4})-(\d\d)-(\d\d)(?:T(\d\d:\d\d))?/);return m?`${m[3]}.${m[2]}.${m[1]}`+(m[4]?' '+m[4]:''):esc(s)};
const g=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const FN={status:'Статус должника',realty:'Недвижимость',movable:'Движимое имущество',shares:'Доли/бизнес',press:'Публикации',spouse:'Супруг(а)',kdl_assets:'Активы КДЛ',enforcement:'Исп. производства',fssp:'ФССП',pledges:'Залоги/обременения',notary_pledges:'Реестр залогов ФНП',notary_pledged:'Заложено (реестр ФНП)'};
const KC=s=>{s=(s||'').toLowerCase();return s.includes('субсидиар')?'Субсидиарная ответственность':s.includes('убытк')?'Убытки':/сделк|реституц/.test(s)?'Оспоренная сделка':s.includes('дебитор')?'Дебиторская задолженность':/кредит|займ/.test(s)?'Кредит/заём':'Прочее'};





/* фильтр «Вид торгов»: EV_UI.auction_filter (texts_config.js) */








let SMIN=0,SMAX=100;






const pbadge=(v,l)=>l&&l.pct_check?`<span class="sc pb" style="background:#e3e7ec;color:#5F857E;font-weight:500" title="Сумма долга пуста или под сомнением">${l.claim_amount?'проверить':'нет суммы'}</span>`:v==null?'—':`<span class="sc pb" style="${pcSt(v)}">${fpct(v)}</span>`;


const scl=s=>'';


/* шильдики в одну строку: EV_UI.card_badges (texts_config.js) */


/* короткая форма шильдика: EV_UI.card_badges.short (точное совпадение), затем short_rules (регулярное выражение, число частей и форма слова) */


/* если подписи не помещаются в ширину колонки — прячем последние видимые в «+N» (минимум одна видна) */
let CBF=0;
addEventListener('resize',()=>CBfit());
let CBI=0;
/* полные названия в строке списка: EV_UI.list_names (texts_config.js) */


let LNI=0;
/* раскладка списка (шильдики, полные названия, выдвижные «Фильтры» до list_names.filters_drawer_bp) и фильтр «Вид торгов» — сразу при загрузке страницы, до PIN и данных: без сдвига после загрузки */
/* «Площадка» второй строкой в ячейке «Торги»: EV_UI.list_platform; «Причины» в «Реестр ?» не длиннее N строк: EV_UI.man_reasons (Дизайнер 21.10.2026) */



/* в --cols колонки «Торги» и следующая за ней «Площадка» → одна LP().torgi_col; позиция «Торгов» — по видимым заголовкам .th (учитывает колонку выбора в «Избранном») */





let LPI=0;

document.addEventListener('DOMContentLoaded',()=>{LNearly();setTimeout(LNearly,0)});addEventListener('load',LNearly);

const FSN='<span class="tag fsspn" title="Не ошибка: ФССП не проверен"><svg width=11 height=11 viewBox="0 0 16 16" fill=none stroke=currentColor stroke-width=1.6><circle cx=8 cy=8 r=6.5 /><path d="M8 4.5V8l2.5 1.6"/></svg> ФССП: не проверено</span>';
const kv=(o)=>'<dl class="kv">'+o.filter(x=>x[1]!=null&&x[1]!=='').map(x=>`<dt>${x[0]}</dt><dd${CLnw(x[0])?' class="nw"':''}>${x[2]?x[1]:esc(x[1])}</dd>`).join('')+'</dl>';
/* раскладка раскрытой карточки лота (Дизайнер 21.10.2026): EV_UI.lot_card_layout — по центру области списка, сетка «подпись/значение», без разрывов слов, суммы/ИНН/дело/даты без переноса, до stack_bp — подпись над значением. on:false — прежний вид */



/* таблицы .mini в карточке (EV_UI.lot_card_layout.mini): дата без разрыва (время — второй строкой), до stack_bp — строки «подпись / значение» (data-l из заголовка) */



let CLI=0;

const npKey=l=>['ok','ok_by_name','no_data'].includes(l.notary_pledges_status)?l.notary_pledges_status:'nc';
const NPST=st=>!st?'не проверено':st==='ok'?'действующие залоги найдены (по ИНН)':st==='ok_by_name'?'найдено по наименованию — сверить':st==='no_data'?'действующих залогов нет':st==='not_checked'?'не проверено':st==='skipped:no_inn'?'не проверено: нет ИНН должника':st==='skipped:fl_needs_fio_birthdate'?'не проверено: для ФЛ нужны ФИО и дата рождения':st.startsWith('error')?'ошибка проверки, повторим позже':st;


/* блок активов: «Статус» — правовой статус должника (assets.status); сводка об активах — assets.summary (строка «Активы» ниже) или запасные поля (EVFD.assetsRows, config/lot_fold.json → fields.assets.summary; QA Дизайнера 21.10.2026, п. 1) */








$('L').onclick=e=>{const rx=e.target.closest('.rsn[data-rx]');if(rx){e.stopPropagation();rx.classList.toggle('open');return}if(e.target.closest('.c-sel')&&!e.target.closest('[data-sel]'))return;const sc=e.target.closest('[data-sel]');if(sc){e.stopPropagation();const id=sc.dataset.sel;sc.checked?SEL.add(id):SEL.delete(id);favUI();return}const fc=e.target.closest('[data-fc]');if(fc){e.stopPropagation();const l=DATA.lots.find(x=>String(x.id)===fc.dataset.fc);if(l)sendReq(fullReq(l),'Запрос на полную проверку (ПЦ «Эверест»)',fc);return}
const rc=e.target.closest('[data-rep]');if(rc){e.stopPropagation();goTab('rep');return}const st=e.target.closest('.star');if(st){e.stopPropagation();favToggle(st.dataset.fid);return}if(e.target.closest('a')||e.target.closest('.card'))return;const el=e.target.closest('.lot');if(!el)return;const id=el.dataset.id,was=OPEN.has(id);for(const o of [...OPEN]){OPEN.delete(o);if(o!==id){const oe=el.parentNode.querySelector(`.lot[data-id="${CSS.escape(o)}"]`),ol=DATA.lots.find(x=>x.id==o);if(oe&&ol)oe.outerHTML=row(ol)}}if(!was)OPEN.add(id);const l=DATA.lots.find(x=>x.id==id),nx=el.nextSibling,par=el.parentNode;el.outerHTML=row(l);if(!was){const ne=nx?nx.previousSibling:par.lastElementChild;if(ne)lotScroll(ne)}};





segInit();

const MSIDS=['fnp','cat','stg','reg','pl','mst2','mrs2','mst','mrs','fcat','fins','freg','fout'];
const msSel=id=>{const e=$(id);return e&&e._ms?e._ms:null};






document.addEventListener('click',()=>document.querySelectorAll('.msp').forEach(x=>x.style.display='none'));
msInit();
document.querySelectorAll('aside input,aside select').forEach(x=>x.addEventListener('input',()=>{SHOW=100;render()}));
$('rst').onclick=()=>{ls.s('cr.atp','');document.querySelectorAll('aside input').forEach(x=>x.type==='checkbox'?x.checked=false:x.value='');document.querySelectorAll('aside select').forEach(x=>x.value='');['fdt','fct'].forEach(k=>ls.s('cr.'+k,''));segInit();msReset('aside');render()};
$('so').onchange=()=>{SK=$('so').value;render()};$('dir').onchange=()=>{SD=+$('dir').value;render()};
document.querySelectorAll('.th span[data-k]').forEach(s=>s.onclick=()=>{if(SK===s.dataset.k)SD=-SD;else{SK=s.dataset.k;SD=['debtor','category','platform','region'].includes(SK)?1:-1}render()});
$('tog').onclick=()=>$('flt').classList.toggle('open');
document.querySelectorAll('nav button[data-v]').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button[data-v]').forEach(x=>x.classList.toggle('on',x===b));FAVMODE=b.dataset.v==='fav';$('vreg').classList.toggle('fav',FAVMODE);MANMODE=b.dataset.v==='man';$('vreg').classList.toggle('man',MANMODE);$('manf').style.display=MANMODE?'':'none';$('vman').style.display='none';if(b.dataset.v!=='reg'||!b._keep){FOCUS=null;window.FOCSRC=null}b._keep=0;$('vreg').style.display=(b.dataset.v==='reg'||FAVMODE||MANMODE)?'':'none';if(FAVMODE&&REPS===null)repLoad();if(b.dataset.v==='reg'||FAVMODE||MANMODE){SHOW=100;render()}$('vmet').style.display=b.dataset.v==='met'?'':'none';$('vsrc').style.display=b.dataset.v==='src'?'':'none';$('vrep').style.display=b.dataset.v==='rep'?'':'none';$('vprc').style.display=b.dataset.v==='prc'?'':'none';$('vfin').style.display=b.dataset.v==='fin'?'':'none';if(b.dataset.v==='fin')finOpen();if(b.dataset.v==='prc')prcOpen();if(b.dataset.v==='rep')repList();if(b.dataset.v==='src')srcList();if(b.dataset.v==='met')$('md').innerHTML='<div class="tnote"><b>Термины.</b> <b>Кредитор</b> — банкрот, который продаёт право требования (в данных: «должник», «должник-банкрот»). <b>Должник</b> — лицо, к которому предъявлено требование (в данных: «контрагент», «требование к …»). Имущество, ФССП и залоги проверяются у должника.</div>'+md(MD||'# Методика\n\nМетодика ещё не загружена.')});




document.querySelectorAll('nav button[data-v]').forEach(b=>b.addEventListener('click',othSync));
$('oth').onclick=()=>{document.querySelector('nav button[data-v="met"]').click()};
$('othbar').onclick=e=>{const b=e.target.closest('button[data-o]');if(!b)return;if(b.dataset.o==='cfg')$('cfg').click();else document.querySelector(`nav button[data-v="${b.dataset.o}"]`).click()};
$('cfg').onclick=()=>{$('dsrc').textContent=DATA?`Сейчас: ${SRC}, данные на ${dd(DATA.data_date||DATA.generated_at)}.`+srcSt():'Данных нет.';$('rp').textContent=REPO;$('ghbox').style.display=REPO&&!REPO.startsWith('/*')?'':'none';$('tok').value=TOKEN?'••••••••':'';$('tok').placeholder=TOKEN?'ключ сохранён — вставьте новый, чтобы заменить':'github_pat_…';$('dlg').showModal()};
$('cls').onclick=()=>$('dlg').close();$('ld').onclick=()=>$('file').click();
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{setData(JSON.parse(await f.text()),'файл '+f.name,true);$('dmsg').textContent='Загружено: '+DATA.lots.length+' лотов'}catch(err){$('dmsg').textContent='Ошибка: '+err.message}e.target.value=''};
const clean=t=>String(t||'').replace(/[\s\u200b-\u200d\ufeff]/g,'');


$('con').onclick=()=>{const v=clean($('tok').value);if(v==='••••••••'||/^•+$/.test(v)){sync(true);return}if(!/^(github_pat_|gh[pou]_)/.test(v)){$('dmsg').textContent='Ключ должен начинаться с github_pat_';return}saveTok(v);$('tok').value='••••••••';sync(true)};
$('syn').onclick=()=>sync(true);$('dis').onclick=()=>{if(!confirm('Удалить ключ GitHub с этого устройства?'))return;const o=ls.g(LT);VAULT.get('shared:token').then(t=>{if(t&&t===o)VAULT.set('shared:token',null)});VAULT.set('claims:token',null);OLDV.set('claims:token',null);ls.d(LT);TOKEN=null;opts&&DATA&&opts();keyInd();$('tok').value='';$('dmsg').textContent='Ключ удалён с устройства'};
const fsz=n=>n>1048576?(n/1048576).toFixed(1)+' МБ':Math.max(1,Math.round(n/1024))+' КБ';



const fnC=()=>(window.EV_UI||{}).file_names||{};
const fnFmt=(t,o)=>String(t==null?'':t).replace(/\{(\w+)\}/g,(_,k)=>o[k]!=null?o[k]:'');





const dlClick=async e=>{const b=e.target.closest('button[data-f]');if(!b)return;const n=dlName(b),o=b.textContent;b.textContent='…';b.disabled=true;
try{const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${(b.dataset.p||'sources/'+b.dataset.f).split('/').map(encodeURIComponent).join('/')}?ref=${BRANCH}&_=${Date.now()}`,{headers:{Authorization:'Bearer '+clean(TOKEN),Accept:'application/vnd.github.raw+json'},cache:'no-store'});
  if(!r.ok)throw new Error('GitHub '+r.status);const bl=await r.blob(),file=new File([bl],n,{type:bl.type||'application/octet-stream'});
  if(navigator.canShare&&navigator.canShare({files:[file]})&&/iPhone|iPad|Android/.test(navigator.userAgent)){try{await navigator.share({files:[file],title:n})}catch(x){if(x.name!=='AbortError')throw x}}
  else{const u=URL.createObjectURL(file),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}
  b.textContent='Готово'}catch(x){b.textContent='Ошибка';alert('Не удалось скачать '+n+': '+x.message)}setTimeout(()=>{b.textContent=o;b.disabled=false},2500)};
$('srcl').onclick=dlClick;$('repl').onclick=e=>{const d=e.target.closest('[data-del]');if(d){e.preventDefault();return repAsk([{path:d.dataset.del,name:d.dataset.nm}])}if(e.target.closest('[data-rs]'))return rselUI();return dlClick(e)};
const DEL_OK=p=>/^reports\/[^/]+$/.test(p)&&p!=='reports/index.json'||(EV_APP&&/^valuation\/[\w.\-]+\/[^/]+$/.test(p))||/^arbitr\/au\/(lh|sig)\d+\.enc$/.test(p)||/^arbitr\/ua\/f_\w+\.enc$/.test(p)||/^arbitr\/appraisal_requests\/appr_[\w\-]+(\.enc|\/f\d{1,3}\.enc)$/.test(p)||/^arbitr\/appraisal_results\/appr_[\w\-]+(\.enc|\/[a-z_]{1,32}\.enc)$/.test(p);
const encP=p=>p.split('/').map(encodeURIComponent).join('/');
const ghH=()=>({Authorization:'Bearer '+clean(TOKEN),Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'});



$('rall').onchange=()=>{document.querySelectorAll('#repl [data-rs]').forEach(x=>x.checked=$('rall').checked);rselUI()};
$('rdel').onclick=()=>repAsk([...document.querySelectorAll('#repl [data-rs]:checked')].map(x=>({path:x.dataset.rs,name:x.dataset.nm})));


let PRIDX={},PRO=null;const PCAT={subsidiary:'Субсидиарная ответственность',challenge:'Оспаривание сделок',director_losses:'Убытки директора',claims_register:'Включение в реестр',succession:'Правопреемство / цессия',auction:'Торги',enforcement:'Исполнительное производство',other:'Другое'},PINS={vs:'ВС РФ',cass:'Кассация',appeal:'Апелляция',first:'Первая'},POUT={for:'в пользу позиции',against:'против',both:'оба'};
document.querySelectorAll('.prc .pills').forEach(g=>g.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(g.classList.contains('m'))b.classList.toggle('on');else g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))});
const pv=k=>[...document.querySelectorAll(`.pills[data-p="${k}"] button.on`)].map(b=>b.dataset.x);
$('pper').onchange=()=>$('pperc').style.display=$('pper').value==='custom'?'':'none';

$('plot').onchange=()=>{const l=DATA&&DATA.lots.find(x=>String(x.id)===$('plot').value);if(l&&l.case)$('pcase').value=l.case};
$('pf').onsubmit=e=>{e.preventDefault();const q=$('prq').value.trim();if(!q){$('prq').focus();$('pmsg').textContent='Укажите суть вопроса';return}$('pmsg').textContent='';
const l=DATA&&DATA.lots.find(x=>String(x.id)===$('plot').value),t=new Date(),id=t.toISOString().replace(/[-:]/g,'').slice(0,15)+'Z-cp-'+Math.random().toString(36).slice(2,6);
const per=$('pper').value,ins=pv('inst');
const req={type:'court_practice',version:1,id,created_at:t.toISOString(),source:'ПЦ «Эверест» / Судебная практика',question:q,
  lot:l?{id:l.id,debtor:{name:l.debtor?.name||null,inn:l.debtor?.inn||null},case:l.case||null,lot_no:l.lot_no??null,counterparty:{name:l.counterparty?.name||null,inn:l.counterparty?.inn||null}}:null,
  lot_id:l?l.id:null,debtor:l?l.debtor?.name||null:null,case_no:$('pcase').value.trim()||null,position:pv('pos')[0]||'neutral',category:$('prcat').value,category_title:PCAT[$('prcat').value],
  parties:pv('parties'),court_type:pv('court')[0]||'arb',instances:ins.length?ins:['vs','cass'],region:$('prreg').value,
  period:per==='custom'?{from:$('prp0').value||null,to:$('prp1').value||null}:{years:+per},outcome:pv('out')[0]||'both',urgency:pv('urg')[0]||'normal',lots:[]};
const T='Запрос подборки судебной практики (ПЦ «Эверест»)';
if(EMB||!TOKEN||FAVRO===true||!REPO||REPO.startsWith('/*'))return deepShow(req,'Отправить напрямую нельзя. Скопируйте запрос и отправьте в чат с ботом.',T);
toast('Отправляю запрос…');
ghApi(`requests/${req.id}.json`,{method:'PUT',body:JSON.stringify({message:'court_practice '+req.id,branch:BRANCH,content:u8b64(JSON.stringify(req,null,1))})}).then(r=>{
  if(r.ok){toast(`✓ ${esc(etaAccepted(req))}. Подборка появится в разделе <a href="#" data-go="prc" style="color:#99F6E4;text-decoration:underline">«Судебная практика»</a>.`,15000);$('prq').value='';prcList()}
  else{$('toast')&&($('toast').style.display='none');deepShow(req,'Отправить напрямую нельзя (GitHub '+r.status+'). Скопируйте запрос.',T)}}).catch(()=>{$('toast')&&($('toast').style.display='none');deepShow(req,'Нет сети. Скопируйте запрос.',T)})};
let PRC=[],PPEND=[];


['fq','fcat','fins','freg','fout','fd0','fdeb'].forEach(k=>$(k).addEventListener('input',prcRender));
$('prcl').onclick=e=>{if(e.target.closest('[data-f]'))return dlClick(e);const el=e.target.closest('[data-pn]');if(!el||e.target.closest('.pcard'))return;const n=el.dataset.pn,was=PRO===n;PRO=was?null:n;prcRender();if(!was){const ne=$('prcl').querySelector(`[data-pn="${CSS.escape(n)}"]`);if(ne)lotScroll(ne)}};


const b64=x=>Uint8Array.from(atob(x),c=>c.charCodeAt(0));


let FAVMISS=[],SEL=new Set(),FAV=new Map(),FAVUP=0,FAVMODE=false,FAVRO=null,FAVMSG='',CUR=[],favT=null;
const star=(id,big)=>{const on=FAV.has(String(id));return `<button class="star${on?' on':''}" data-fid="${esc(id)}" title="${on?'Убрать из избранного':'В избранное'}" aria-pressed="${on}"${big?' style="font-size:24px;margin-right:6px"':''}>${on?'★':'☆'}</button>`};



const WRITE_OK=p=>p==='favorites.json'||(EV_APP&&p==='deleted.json')||(EV_APP&&/^valuation\/[\w.\-]+\/input\/[^/]+$/.test(decodeURIComponent(p)))||/^(finance\/F)[\w\-]+\/input\/[^/]+$/.test(decodeURIComponent(p))||/^arbitr\/fin_requests\/[\w\-]+\.json$/.test(p)||/^arbitr\/agent_requests\/ag_\d{8}T\d{6}Z_[a-z0-9]{4,8}\.json$/.test(p)||/^arbitr\/agent_requests\/files\/ag_\d{8}T\d{6}Z_[a-z0-9]{4,8}\/f\d{1,3}\.enc$/.test(p)||/^arbitr\/agent_keys\/user\.json$/.test(p)||/^arbitr\/debtor_requests\/case_[\w\-]+\.json$/.test(p)||/^arbitr\/cp_requests\/cp_[\w\-]+\.(json|enc)$/.test(p)||/^arbitr\/practice_requests\/prq_[\w\-]+\.(json|enc)$/.test(p)||/^arbitr\/analyst_requests\/arq_[\w\-]+\.(json|enc)$/.test(p)||/^arbitr\/appraisal_requests\/appr_[\w\-]+\.(json|enc)$/.test(p)||/^arbitr\/appraisal_requests\/appr_[\w\-]+\/f\d{1,3}\.enc$/.test(p)||/^arbitr\/ua\/(lock|f_\w+)\.enc$/.test(p);
const ghApi=(path,opt={})=>(opt.method&&opt.method!=='GET'&&!WRITE_OK(path))?Promise.reject(new Error('запись запрещена: '+path)):fetch(`https://api.github.com/repos/${REPO}/contents/${path}`+(opt.method?'':`?ref=${BRANCH}&_=${Date.now()}`),{...opt,headers:{Authorization:'Bearer '+clean(TOKEN),Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(opt.headers||{})},cache:'no-store'});
const u8b64=s=>{const b=new TextEncoder().encode(s);let r='';for(let i=0;i<b.length;i+=8192)r+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(r)};


const loadJs=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('не загрузился '+src));document.head.appendChild(s)});
const ab64=buf=>{const b=new Uint8Array(buf);let r='';for(let i=0;i<b.length;i+=8192)r+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(r)};

const today=()=>{const d=new Date();return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`};
const R0=v=>v==null?'—':Math.round(v).toLocaleString('ru-RU').replace(/\u00a0|\u202f/g,' ');

const clean2=rows=>rows.filter(r=>r[1]!=null&&r[1]!==''&&r[1]!=='—').map(r=>[String(r[0]),String(r[1])]);
const SUMH=['№','Кредитор / лот','Должник','ФЛ/ЮЛ','Требование, ₽','Цена, ₽','Разница, ₽','%','Балл','Категория','Регион','Приём / торги'];
const sumRow=(l,i)=>[i+1,(l.debtor.name||'—')+(l.case?'\n'+l.case:'')+(l.lot_no!=null?', лот '+l.lot_no:''),l.counterparty.name||'—',l.counterparty.type||'—',R0(l.claim_amount),R0(l.start_price),R0(l.difference),l.pct_check?'требует проверки':fpct(l.pct),l._s??'—',l.category||'—',l.region||'—',(l.application_start?dd(l.application_start).slice(0,10):'—')+' / '+(l.auction_date?dd(l.auction_date).slice(0,10):'—')];


$('pdf').onclick=exportPdf;const selAll=v=>{v=!(CUR.length&&CUR.every(l=>SEL.has(String(l.id))));CUR.forEach(l=>v?SEL.add(String(l.id)):SEL.delete(String(l.id)));render()};$('selall').onchange=()=>selAll($('selall').checked);$('selall2').onchange=()=>selAll($('selall2').checked);

let REPIDX={};



let REPS=null;

const normId=v=>String(v||'').toLowerCase().replace(/[^0-9a-zа-я]/gi,'');
const repFor=l=>{if(!REPS)return null;const ix=Object.entries(REPIDX).find(([n,e])=>e&&String(e.lot_id)===String(l.id)&&REPS.includes(n));if(ix)return ix[0];const k=normId(l.id);return k?REPS.find(n=>normId(n).includes(k)):null};






$('deep').onclick=()=>{let list=CUR.filter(l=>SEL.has(String(l.id)));if(!list.length)list=CUR.slice();if(!list.length){alert('В избранном пока нет лотов — отметьте ☆ в реестре');return}const req=deepReq(list),T='Запрос на углублённый анализ (ПЦ «Эверест»)';
if(EMB||!TOKEN||FAVRO===true||!REPO||REPO.startsWith('/*'))return deepShow(req,FAVRO===true?'Ключ GitHub только для чтения — отправить запрос напрямую нельзя. Скопируйте запрос или отправьте его через «Поделиться» в чат с ботом.':'Нет подключения к GitHub. Скопируйте запрос и отправьте в чат с ботом.',T);
sendReq(req,T)};
let ALLL=[],HIDDEN=new Set(),MRSTATS=null,MR=null,MRSRC='',MRO=new Set(),FOCUS=null;
const KEYF=[['claim_amount','сумма требования'],['start_price','начальная цена'],['debtor.name','должник'],['case','номер дела'],['counterparty.name','лицо по требованию'],['auction_date','дата торгов']];
let FIN={},FPEND=[],FRES={},FO=null,FOP=null;window.__arbRefilter=function(){const H=window.ArbHide;if(!H)return;PRC=PRC.filter(x=>!H.hidden('prc',x.name,(x._m||{}).request_id));PPEND=PPEND.filter(x=>!H.req(x.id));for(const c of Object.keys(FIN))if(H.hidden('fin',c,(FIN[c]||{}).request_id))delete FIN[c];FPEND=FPEND.filter(x=>!H.req(x.id));try{prcRender()}catch(e){}try{finRender()}catch(e){}};const RKN={high:'высокий',medium:'средний',low:'низкий'},frub=v=>v==null?'—':Math.round(v).toLocaleString('ru-RU')+' ₽';
window.__arbFinGet=c=>({e:FIN[c],r:FRES[c]});
$('ffiles').onchange=()=>{const f=[...$('ffiles').files];$('fsel').innerHTML=f.map(x=>esc(x.name)+' · '+(x.size/1048576).toFixed(1)+' МБ').join('<br>')};
['dragenter','dragover'].forEach(k=>$('fdrop').addEventListener(k,e=>{e.preventDefault();$('fdrop').classList.add('on')}));['dragleave','drop'].forEach(k=>$('fdrop').addEventListener(k,()=>$('fdrop').classList.remove('on')));
$('fdrop').addEventListener('drop',e=>{e.preventDefault();$('ffiles').files=e.dataTransfer.files;$('ffiles').onchange()});
$('ff').onsubmit=async e=>{e.preventDefault();const m=$('fmsg'),files=[...$('ffiles').files],inn=$('finn').value.replace(/\D/g,''),name=$('fdn').value.trim();
if(!name||!/^(\d{10}|\d{12})$/.test(inn)){m.textContent='Укажите должника и ИНН (10 или 12 цифр)';return}if(!files.length){m.textContent='Добавьте файлы';return}
const big=files.find(f=>f.size>20*1048576);if(big){m.textContent='Файл больше 20 МБ: '+big.name;return}
if(EMB||!TOKEN||!REPO||REPO.startsWith('/*')){m.textContent='Загрузка доступна в онлайн-версии после входа.';return}
const S=ArbFinSend.begin(files),t=S.t,rid=S.rid,cid=S.cid,b=$('fsend');b.disabled=true;const up=S.up;
try{for(const [i,f] of files.entries()){if(ArbFinSend.done(f))continue;m.textContent=`Загружаю ${i+1} из ${files.length}: ${f.name}…`;const nm=f.name.replace(/[\\/:*?"<>|#%]+/g,'_'),path=`finance/${cid}/input/${nm}`;
   const r=await ghApi(path.split('/').map(encodeURIComponent).join('/'),{method:'PUT',body:JSON.stringify({message:'fin upload '+cid,branch:BRANCH,content:ab64(await f.arrayBuffer())})});if(!r.ok)throw new Error(f.name+': GitHub '+r.status);up.push({path,name:nm,size:f.size});ArbFinSend.mark(f)}
  const req={type:'fin_analysis',version:1,id:rid,case_id:cid,created_at:t.toISOString(),source:ArbFinSend.source(),status:'new',debtor:Object.assign({name,inn},(window.ArbFinDeb&&ArbFinDeb.extra(inn))||{}),bankruptcy_date:$('fbd').value||null,insolvency_date:$('fid').value||null,
   affiliates:$('faff').value.split(/[,;\s]+/).map(x=>x.replace(/\D/g,'')).filter(x=>/^(\d{10}|\d{12})$/.test(x)),files:up,lots:[]};
  const r=await ghApi(ArbFinSend.reqPath(rid),{method:'PUT',body:JSON.stringify({message:'fin_analysis '+rid,branch:BRANCH,content:u8b64(JSON.stringify(req,null,1))})});if(!r.ok)throw new Error('запрос: GitHub '+r.status);
  m.textContent='';ArbFinSend.ok();toast(`✓ ${esc(etaAccepted(req))}. Файлов: ${up.length}. Заключение появится в разделе <a href="#" data-go="fin" style="color:#99F6E4;text-decoration:underline">«Финанализ»</a>.`,15000);$('ff').reset();$('fsel').textContent='';finList()}
catch(x){ArbFinSend.fail(x,up.length,files.length)}finally{b.disabled=false}};



['frisk','ffd0','ffq'].forEach(k=>$(k).addEventListener('input',finRender));
$('finl').onclick=async e=>{if(e.target.closest('[data-f]'))return dlClick(e);const o=e.target.closest('[data-op]');if(o){if(!e.target.closest('.h'))return;FOP=FOP===o.dataset.op?null:o.dataset.op;finRender();return}
const el=e.target.closest('[data-fc]');if(!el||e.target.closest('.pcard'))return;const c=el.dataset.fc,was=FO===c;FO=was?null:c;FOP=null;finRender();if(was)return;const ne=$('finl').querySelector(`[data-fc="${CSS.escape(c)}"]`);if(ne)lotScroll(ne);
if(!FRES[c]){try{FRES[c]=JSON.parse(await ghRaw(FIN[c].result))}catch(x){FRES[c]={err:x.message}}if(FO===c)finRender()}};

/* «Календарь торгов» (src/tradecal.js): уже загруженные лоты (только чтение) и переход в карточку лота */
window.EV_LOTS=()=>({reg:DATA?DATA.lots:[],prop:PROP?PROP.lots:[]});
window.EV_GOTO=(sc,id,src)=>{id=String(id);if(sc==='prop'){goTab('prop');const f=()=>{if(!PROP)return setTimeout(f,200);POPEN=id;propRender();const q=()=>document.querySelector(`.plot[data-pid="${CSS.escape(id)}"]`);if(!q()){PSHOW=1e6;propRender()}const n=q();if(n)lotScroll(n)};setTimeout(f,0);return}
 window.FOCSRC=src||null;FOCUS=id;OPEN.add(id);goTab('reg');const n=document.querySelector(`.lot[data-id="${CSS.escape(id)}"]`);if(n)lotScroll(n)};


const DSM={liquidated_kdl:['dsr','⊘','ликвидирован · КДЛ','должник ликвидирован, взыскание только через КДЛ'],in_procedure:['dsa','⏳','в процедуре','взыскание через реестр требований или ликвидационную комиссию']};


const mcls=s=>s==='проверено'?'d':s==='в работе'?'w':s==='снято автоматически'?'x':'n';

const isInnR=r=>(/ИНН/i.test(r)&&/пуст|нет\b|отсутств|не указан|empty|missing/i.test(r))||/долг\s*\/\s*цена|кратно|аномально\s+низк|низк\S*\s+цен|ratio/i.test(r);

let MANMODE=false,MANMISS=0;

const PGTD=l=>!!(l&&l.claim_amount&&l.start_price!=null&&l.start_price>l.claim_amount);
const lMiss=l=>Array.isArray(l&&l.missing_fields)?l.missing_fields.filter(x=>!/ОГРН|ФССП|fssp|ogrn/i.test(x)):[];

const PMF=[['title','объект'],['type','тип'],['category','категория'],['region','регион'],['stage','этап'],['debtor','должник'],['creditor','кредитор'],['current_price','текущая цена'],['start_price','начальная цена'],['trade_no','№ торгов'],['score','балл']],PMN={address:'адрес',creditor_inn:'ИНН кредитора',debtor_inn:'ИНН должника'};
const pEmp=v=>v==null||(typeof v==='string'&&/^\s*(|—|-|–|null|None)\s*$/.test(v))||(Array.isArray(v)&&!v.length)||(typeof v==='object'&&!Array.isArray(v)&&!Object.keys(v).length);

const pNA=l=>{const x=[pEmp(l.address)&&'без адреса',pEmp(l.region)&&'без региона'].filter(Boolean);return x.length?' <i class=sm>'+x.join(', ')+'</i>':''};
const PGN={'кредитор':'кредитора','регион':'региона','адрес':'адреса','должник':'должника','объект':'объекта','тип':'типа','категория':'категории','этап':'этапа','текущая цена':'текущей цены','начальная цена':'начальной цены','№ торгов':'№ торгов','балл':'балла','ИНН кредитора':'ИНН кредитора','ИНН должника':'ИНН должника'};const pHid=l=>!!(EV_APP&&window.EVLot&&EVLot.hidden&&EVLot.hidden(l));const pMissL=()=>PROP?PROP.lots.filter(l=>!pHid(l)&&pMiss(l).length):[];


$('mL').onclick=e=>{const o=e.target.closest('[data-open]');if(o){e.preventDefault();FOCUS=o.dataset.open;window.FOCSRC=null;OPEN.add(FOCUS);goTab('reg');return}if(e.target.closest('a')||e.target.closest('.card'))return;
const el=e.target.closest('.lot');if(!el)return;const id=el.dataset.mid,was=MRO.has(id);MRO.clear();if(!was)MRO.add(id);manRender();if(!was){const ne=$('mL').querySelector(`.lot[data-mid="${CSS.escape(id)}"]`);if(ne)lotScroll(ne)}};
['mq','mst','mrs','mso','mreg'].forEach(k=>$(k).addEventListener('input',manRender));['mst2','mrs2','mreg2'].forEach(k=>$(k).addEventListener('input',()=>{SHOW=100;render()}));

{const _r0=render;render=function(){const x=_r0.apply(this,arguments);try{mpropRender()}catch(e){console.error(e)}return x}}


/* подвал: «версия ДД.ММ.ГГГГ ЧЧ:ММ МСК · хеш» (QA Дизайнера 21.10.2026, п. 9); VER из build.py — «ГГГГ-ММ-ДД ЧЧ:ММ UTC · хеш» (version.json и сверка версий не меняются). EV_UI.footer_ver.on:false — как было */

$('ver').textContent=VER.startsWith('/*')?'dev':verMsk(VER);if(!VER.startsWith('/*'))document.addEventListener('DOMContentLoaded',()=>{$('ver').textContent=verMsk(VER)});  /* EV_UI (nav2.js, defer) — после этого скрипта */
if(EMB){BOOTED=true;if(EMR){MR=Array.isArray(EMR)?EMR:(EMR.items||[]);MRSTATS=EMR.statuses||null}(async()=>{const f=await CACHE.get('claims:fav');if(f){FAV=new Map(Object.entries(f.ids||{}));FAVUP=f.updated||0}setData(EMB,'встроенные данные',false)})()}else (async()=>{
render();
let t=clean(ls.g(LT))||await KEYDB.get('claims:token')||await OLDV.get('claims:token');
if(!t){const sh=await OLDV.get('shared:token');if(sh)t=sh}
if(t)saveTok(clean(t));
BOOTED=true;render();
await pinGate();render();
try{const c=ls.g(LS);if(c){await CACHE.set('claims:data',JSON.parse(c))}}catch(e){}ls.d(LS);
let c=await CACHE.get('claims:data');if(!c){c=await OLDV.get('claims:data');if(c){CACHE.set('claims:data',c);OLDV.set('claims:data',null)}}
MR=await CACHE.get('claims:mr')||null;MRSTATS=await CACHE.get('claims:mrst')||null;{const f=await CACHE.get('claims:fav');if(f){FAV=new Map(Object.entries(f.ids||{}));FAVUP=f.updated||0}}
if(c)try{setData(c,'кэш устройства',false)}catch(e){}
MD=MD||ls.g(LM);render();sync(false)})();
if(!EMB){verCheck();setInterval(verCheck,10*60*1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){sync(false);verCheck()}})}

document.addEventListener('click',async e=>{if(!e.target.closest||!e.target.closest('#rfb'))return;const b=$('rfb');if(b.classList.contains('spin'))return;b.classList.add('spin');try{await sync(true);for(const f of [repLoad,repList,prcList,finList,favPull,mrPull,propLoad]){try{await f()}catch(_){}}render()}finally{b.classList.remove('spin')}});
let PFSNAP={};try{PFSNAP=JSON.parse(localStorage.getItem('cr.pfavsnap')||'{}')}catch(_){}let PCH='',PERR=0,PROP=/*__PROP__*/null,PROPSRC='',POPEN=null,PSHOW=60,PFAV=new Set(JSON.parse(localStorage.getItem('cr.pfav')||'[]'));
const PCOMP=[['discount','Скидка от цены',35],['liquidity','Ликвидность',20],['encumbrances','Обременения',20],['risk','Риск оспаривания и документы',15],['region_stage','Регион и стадия',10]];
const pNum=v=>{if(v==null||v==='')return null;if(typeof v==='number')return isFinite(v)?v:null;let s=String(v).replace(/[\u2212\u2013]/g,'-').replace(/[^\d.,-]/g,'').replace(/^[.,]+|[.,]+$/g,'');if(!/\d/.test(s))return null;const c=s.lastIndexOf(','),d=s.lastIndexOf('.');if(c>-1&&d>-1){const x=c>d?',':'.';s=s.split(x===','?'.':',').join('').replace(x,'.')}else if(c>-1)s=s.split(',').length>2?s.split(',').join(''):s.replace(',','.');else if(s.split('.').length>2)s=s.split('.').join('');const n=parseFloat(s);return isFinite(n)?n:null};
const pKind=(name,inn)=>{const i=String(inn||'').replace(/\D/g,'');if(i.length===12)return 'ФЛ';if(i.length===10)return 'ЮЛ';const s=String(name||'');return /\b(ООО|АО|ПАО|ЗАО|ОАО|ГУП|МУП|ТОО|Банк|банк|КБ|фонд)\b|«/.test(s)?'ЮЛ':s?'ФЛ':''};
const pNm=x=>x&&typeof x==='object'?(x.name||''):(x||'');
const pInn=(l,k)=>l[k+'_inn']||(l[k]&&typeof l[k]==='object'?l[k].inn:'')||'';



const pF=(l,...k)=>{for(const x of k){const v=x.split('.').reduce((o,y)=>o&&o[y],l);if(v!=null&&v!=='')return v}return null};
const pMP=l=>pNum(pF(l,'market_price','market.price','market.median','market_value','market_estimate'));
const pSrc=l=>{const s=pF(l,'market_sources','market.sources','analogs','market_analogs');return Array.isArray(s)?s:[]};
const pCosts=l=>{const s=pF(l,'costs','extra_costs','expenses','net.costs','market.costs');return Array.isArray(s)?s:s&&typeof s==='object'?Object.entries(s).map(([name,amount])=>({name,amount})):[]};



const pMB=l=>pBd(pMk(l),'к рынку'),pNB=l=>pBd(pNt(l),'с затратами');

const PSTGT=(window.EV_CFG||{}).stage_unconfirmed_tip||'по тексту сообщения, не подтверждено';



let PLD=null,PLT=0;const PTTL=((window.EV_CFG||{}).prop_ttl_min??10)*6e4;



const pCUrl=l=>pF(l,'creditor_source_url','creditor_url','creditor.source_url','creditor.url','creditor_source_link');

const pMs=id=>{const e=$(id);return e._ms&&e._ms.size?e._ms:null};

const pSnapSave=()=>{try{localStorage.setItem('cr.pfavsnap',JSON.stringify(PFSNAP))}catch(_){}};






const PSC=()=>(window.EV_UI||{}).prop_sort||null;let PSSEC=null,PSOPEN=0;
const pSortLS=()=>((PSC()||{}).ls_prefix||'cr.psort.')+(PERR?'perr':'prop');



const pArr=on=>{const A=(PSC()||{}).arrows||{};return on?(+$('pdir').value>0?A.asc:A.desc):A.none};



addEventListener('resize',pHH);


document.addEventListener('click',e=>{const v=$('vprop');if(PSOPEN&&!e.target.closest('.psort-m')){PSOPEN=0;propRender()}if(!v||!v.contains(e.target))return;
const sk=e.target.closest('[data-psk]');if(sk){PSOPEN=0;return pSortSet(sk.dataset.psk)}if(e.target.closest('#pschip')){PSOPEN=+!PSOPEN;return propRender()}
const f=e.target.closest('[data-pfav]');if(f){e.stopPropagation();const id=f.dataset.pfav;PFAV.has(id)?PFAV.delete(id):PFAV.add(id);pSnapAll();localStorage.setItem('cr.pfav',JSON.stringify([...PFAV]));return propRender()}
const dp=e.target.closest('[data-pdeep]');if(dp){const l=PROP.lots.find(x=>String(x.id)===dp.dataset.pdeep);if(l)sendReq(propReq(l),'Глубокий анализ имущества',dp);return}
const ch=e.target.closest('[data-pch]');if(ch){PCH=PCH===ch.dataset.pch?'':ch.dataset.pch;PSHOW=60;return propRender()}if(e.target.id==='pmb'){PSHOW+=60;return propRender()}if(e.target.id==='ptog'){$('pflt2').classList.toggle('open');return}
if(e.target.id==='prst'){if($('patp')){$('patp').value='';ls.s('cr.patp','')}v.querySelectorAll('aside input').forEach(x=>x.type==='checkbox'?x.checked=false:x.value='');msReset('#pflt2');return propRender()}
const r=e.target.closest('.prow');if(r&&!e.target.closest('a,button')){const id=r.parentNode.dataset.pid;POPEN=POPEN===id?null:id;propRender();const n=v.querySelector(`.plot[data-pid="${CSS.escape(id)}"]`);if(n&&POPEN)n.scrollIntoView({block:'nearest'})}});
['ptyp','pcat','preg','pstg','pdt','pcr','pcro'].forEach(k=>MSIDS.push(k));msInit();
document.querySelectorAll('#pflt2 input,#pflt2 select').forEach(x=>x.addEventListener('input',()=>{PSHOW=60;propRender()}));
['pso','pdir'].forEach(k=>$(k).onchange=()=>{pSortSave();propRender()});
document.querySelectorAll('nav button[data-v]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.v,on=v==='prop'||v==='perr';$('vprop').style.display=on?'':'none';if(on){if(PERR!=(v==='perr')){PERR=+(v==='perr');POPEN=null;PSHOW=60}propLoad()}}));
