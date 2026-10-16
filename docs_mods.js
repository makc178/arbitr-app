/* Arbitr App — «Что подготовить»: модули раскрываются на месте (список документов модуля из docs_config.json → batch.presets),
   флажки у каждого документа, один общий набор выбранных (тот же, что в «Все шаблоны»), липкая панель «Выбрано N · Подготовить» → обычный путь пакета (ArbBatch, «Архив», исх. №).
   Подходит ли документ типу должника — templates[].debtor_types (index.json), тип — debtor_type_norm (person|citizen|individual → person, иначе legal); нет debtor_types — подходит всем.
   Дизайн-опции (выключены): docs_config.json → docs.expand_anim, docs.single_open. Отдельный модуль: docs.js не трогаем, кроме крючка window.ArbFlow. */
(function(){
 var OPEN={},SEEN={},busy=false;
 function F(){return window.ArbFlow}
 function C(){return (F()&&F().C())||{}}function X(){return (F()&&F().X())||{templates:[]}}
 function M(){return C().docs_mods||{}}function FLG(k){return !!((C().docs||{})[k])}
 function U(k,o){var s=(M().ui||{})[k]||k;o=o||{};Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
 function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function on(){return M().enabled!==false&&F()&&document.getElementById('dflow')}
 function P(){return (C().batch||{}).presets||[]}
 function T(id){return (X().templates||[]).find(function(t){return t.id===id})}
 function ids(i){var p=P()[+i];if(!p)return [];return F().ids(p).filter(function(id){return !!T(id)})}
 /* debtor_type_norm: как в vyvod_autofill.derived (нет/неизвестно → debtor_type_unknown, по умолчанию legal) */
 function norm(t){t=typeof t=='string'?t.trim().toLowerCase():null;var va=X().vyvod_autofill||{};return ({person:'person',citizen:'person',individual:'person',legal:'legal'})[t]||va.debtor_type_unknown||'legal'}
 function fits(id){var t=T(id),L=t&&t.debtor_types;if(!Array.isArray(L)||!L.length)return true;var d=norm(F().dt());return L.some(function(x){return norm(x)===d})}
 function sel(){return F().sel}
 function stateOf(i){var L=ids(i).filter(fits),S=sel(),n=L.filter(function(id){return S.has(id)}).length;return !L.length||!n?'off':n===L.length?'on':'mixed'}
 function panel(i){var L=ids(i),S=sel(),h='<div class="dmx'+(FLG('expand_anim')?' anim':'')+'" data-mx="'+i+'" role="group" aria-label="'+E((P()[+i]||{}).name||'')+'"><div class="dmxh"><span class="sm">'+E(U('docs_n',{n:L.length}))+'</span><span class="sp"></span><button type="button" class="link" data-mall="'+i+'">'+E(U('select_all'))+'</button><button type="button" class="link" data-mnone="'+i+'">'+E(U('select_none'))+'</button></div><div class="dmxl">';
  h+=L.map(function(id){var t=T(id),ok=fits(id),o=S.has(id);return '<div class="dmxr'+(ok?'':' unfit')+(o?' on':'')+'"><span class="adcb'+(o?' on':'')+'" role="checkbox" aria-checked="'+o+'" tabindex="0" data-mdt="'+E(id)+'" aria-label="'+E(U('pick'))+'"></span><div class="tx" role="button" tabindex="0" data-ft="'+E(id)+'"><b>'+E(t.title)+'</b><span class="sm">'+E(t.kind||'')+(t.deadline?' · '+E(t.deadline):'')+(ok?'':' · <i>'+E(U('unfit'))+'</i>')+'</span></div></div>'}).join('');
  return h+'</div></div>'}
 function chev(){return '<svg class="dmchev" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
 function listIc(){return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'}
 function bar(){var b=document.getElementById('dmbar');if(!b){b=document.createElement('div');b.id='dmbar';b.className='dfx dmsel';b.hidden=true;(document.getElementById('vdocs')||document.body).appendChild(b)}
  var st=F().st(),n=sel().size,lb=document.getElementById('dbbar'),lbOn=lb&&lb.style.display!=='none'&&lb.innerHTML;
  var show=n>0&&st==='t'&&!lbOn&&on()&&document.getElementById('dflow').offsetParent!==null;
  var h=show?'<div class="dmbi"><span class="dmbn">'+E(U('picked',{n:n}))+'</span></div><button type="button" class="btn sec" data-mclr="1" aria-label="'+E(U('clear'))+'">'+E(U('clear'))+'</button><button type="button" class="btn pri" data-mgo="1">'+E(U('go'))+'</button>':'';
  if(show){/* на мобильном — над нижним меню (если оно закреплено внизу) */var nb=0;[].forEach.call(document.querySelectorAll('nav,.bnav,#mnav'),function(n){var cs=getComputedStyle(n),r=n.getBoundingClientRect();if((cs.position=='fixed'||cs.position=='sticky')&&r.height&&r.bottom>=innerHeight-2&&r.top>innerHeight/2)nb=Math.max(nb,r.height)});b.style.setProperty('--dmb',nb+'px')}
  if(b.dataset.h!==h){b.innerHTML=h;b.dataset.h=h}b.hidden=!show;document.documentElement.classList.toggle('dmbar-on',show)}
 function deco(){if(!on())return;var fl=document.getElementById('dflow');busy=true;try{
  [].forEach.call(fl.querySelectorAll('.qb.pk[data-fpre]'),function(b){var i=b.dataset.fpre,st=stateOf(i),op=!!OPEN[i];
   b.classList.add('dmod');b.classList.toggle('on',st==='on');b.classList.toggle('mixed',st==='mixed');b.classList.toggle('open',op);b.setAttribute('aria-expanded',op);b.removeAttribute('role');b.removeAttribute('aria-checked');
   var c=b.querySelector('.pkc');if(c){c.setAttribute('role','checkbox');c.setAttribute('aria-checked',st==='on'?'true':st==='mixed'?'mixed':'false');c.setAttribute('aria-label',U('pick_mod'));c.removeAttribute('aria-hidden');c.dataset.mpk=i}
   if(!b.querySelector('.dmchev'))b.insertAdjacentHTML('beforeend',chev());
   var nx=b.nextElementSibling,has=nx&&nx.classList.contains('dmx')&&nx.dataset.mx===i;
   if(op){var ph=panel(i);if(!has||nx.dataset.h!==ph){var w=document.createElement('div');w.innerHTML=ph;w=w.firstChild;w.dataset.h=ph;if(has)nx.replaceWith(w);else b.after(w)}}else if(has)nx.remove()});
  [].forEach.call(fl.querySelectorAll('.dmx'),function(x){var b=fl.querySelector('.qb.pk[data-fpre="'+x.dataset.mx+'"]');if(!b||!OPEN[x.dataset.mx]||b.nextElementSibling!==x)x.remove()});
  /* «Все шаблоны» — заметная кнопка во всю ширину под модулями */
  var a=fl.querySelector('.oth[data-fl="all"]');if(a&&!a.classList.contains('dmall')){var n=(X().templates||[]).length,t2=fl.querySelector('.t2');a.className='btn sec dmall oth';a.innerHTML=listIc()+'<span>'+E(U('all_btn',{n:n}))+'</span>';if(t2)t2.after(a)}
 }finally{busy=false}bar()}
 function toggleIds(L,add){var S=sel();L.forEach(function(id){add?S.add(id):S.delete(id)})}
 function redrawAll(){var f=F();if(document.getElementById('dlist')&&document.getElementById('dlist').style.display!=='none')f.list();deco()}
 document.addEventListener('click',function(e){if(!on()||!e.target.closest)return;var t=e.target,k;
  if((k=t.closest('[data-mpk]'))){e.preventDefault();e.stopPropagation();var i=k.dataset.mpk,L=ids(i).filter(fits);toggleIds(L,stateOf(i)!=='on');redrawAll();return}
  if((k=t.closest('.qb.pk[data-fpre]'))&&k.closest('#dflow')){e.preventDefault();e.stopPropagation();var j=k.dataset.fpre;if(OPEN[j])delete OPEN[j];else{if(FLG('single_open'))OPEN={};OPEN[j]=1;
    /* по умолчанию при первом открытии отмечаются документы, подходящие типу должника */
    if(!SEEN[j]){SEEN[j]=1;if(!ids(j).some(function(id){return sel().has(id)}))toggleIds(ids(j).filter(fits),true)}}redrawAll();return}
  if((k=t.closest('[data-mdt]'))){e.preventDefault();e.stopPropagation();var id=k.dataset.mdt;sel().has(id)?sel().delete(id):sel().add(id);redrawAll();return}
  if((k=t.closest('[data-mall],[data-mnone]'))){e.preventDefault();e.stopPropagation();var m=k.dataset.mall!=null?k.dataset.mall:k.dataset.mnone;toggleIds(k.dataset.mall!=null?ids(m).filter(fits):ids(m),k.dataset.mall!=null);redrawAll();return}
  if((k=t.closest('#dflow [data-fl="pkall"],#dflow [data-fl="pknone"]'))){e.preventDefault();e.stopPropagation();var all=k.dataset.fl==='pkall';[].forEach.call(document.querySelectorAll('#dflow .qb.pk[data-fpre]'),function(b){toggleIds(all?ids(b.dataset.fpre).filter(fits):ids(b.dataset.fpre),all)});redrawAll();return}
  if((k=t.closest('#dmbar [data-mclr]'))){sel().clear();redrawAll();return}
  if((k=t.closest('#dmbar [data-mgo]'))){var L2=Array.from(sel());if(L2.length&&window.ArbBatch){F().go(L2)}bar();return}
 },true);
 document.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&e.target.closest&&e.target.closest('[data-mdt],[data-mpk]')){e.preventDefault();e.target.click()}},true);
 var mo=null,tm=0;function arm(){var fl=document.getElementById('dflow');if(!fl||mo)return;mo=new MutationObserver(function(){if(busy)return;clearTimeout(tm);tm=setTimeout(deco,0)});mo.observe(fl,{childList:true,subtree:true});
  var dl=document.getElementById('dlist'),db=document.getElementById('dbbar');[dl,db].forEach(function(x){if(x)new MutationObserver(function(){clearTimeout(tm);tm=setTimeout(deco,0)}).observe(x,{childList:true,attributes:true,attributeFilter:['style']})});deco()}
 function boot(){if(F()&&document.getElementById('dflow'))arm();else setTimeout(boot,300)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 window.addEventListener('hashchange',function(){setTimeout(deco,50)});document.addEventListener('click',function(){setTimeout(bar,0)});
 window.ArbMods={deco:deco,open:function(i){OPEN[i]=1;deco()},_open:function(){return Object.keys(OPEN)}};
})();
