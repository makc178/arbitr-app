/* Arbitr App — процедуры для должника-гражданина и ИП (index.json 1.7r).
   Если должник — гражданин или ИП (тип дела person или шаблон только для debtor_types [person]):
   · ПРОЦЕДУРА — только варианты из index.json (templates[i].field_choices → choice_sets, по умолчанию procedure_options.procedure_by_debtor_type.person.choices);
     пусто или недопустимое значение → значение по умолчанию шаблона (default_by_template, иначе default — «реализация имущества гражданина»);
   · ВИД_УПРАВЛЯЮЩЕГО — всегда signer из index.json («Финансовый управляющий», ст. 213.2, 213.9, п. 1 ст. 214.1 127-ФЗ).
   Сопоставление полей, тип должника и запасные значения — docs_config.json → procedure_person (не в коде). Крючок в docs.js: raw() → ArbProc.v. */
(function(){
 function FL(){return window.ArbFlow}
 function C(){return (FL()&&FL().C())||{}}function X(){return (FL()&&FL().X())||{}}
 function K(){return C().procedure_person||{}}
 function T(id){return (X().templates||[]).find(function(t){return t.id===id})}
 function lc(s){return String(s==null?'':s).toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim()}
 function PT(){return K().person_types||['person']}
 function personT(t){var L=t&&t.debtor_types;return Array.isArray(L)&&L.length>0&&L.every(function(x){return PT().indexOf(x)>=0})}
 function caseP(){var d=null;try{d=FL()&&FL().dt&&FL().dt()}catch(e){}return PT().indexOf(d)>=0}
 function isPerson(tid){return personT(T(tid))||caseP()}
 function spec(tid){var k=K(),I=X(),fb=k.fallback||{},po=((I.procedure_options||{})[k.index_key||'procedure_by_debtor_type']||{})[k.debtor_type||'person']||null,t=T(tid),
   ch=((t&&t.field_choices)||{})[k.field||'ПРОЦЕДУРА']||(po&&po.choices)||null,cs=ch&&(I.choice_sets||{})[ch];
  var opts=cs?(cs.options||[]).map(function(o){return {v:o.value!=null?o.value:o.id,text:o.text||o.label||''}}):(fb.options||[]).map(function(s){return {v:s,text:s}});
  var dv=(tid&&po&&po.default_by_template&&po.default_by_template[tid])||(po&&po.default)||(cs&&cs.default)||fb.default;
  var d=opts.find(function(o){return o.v==dv||lc(o.text)==lc(dv)});
  return {opts:opts,def:d?d.text:(fb.default||''),signer:(po&&po.signer)||fb.signer||''}}
 function allowed(s,val){var x=lc(val);if(!x)return false;return s.opts.some(function(o){var y=lc(o.text);return y===x||(x.length>=8&&y.indexOf(x)===0)})}
 function v(k,tid,val){var c=K();if(c.enabled===false||!tid)return val;var pf=c.field||'ПРОЦЕДУРА',sf=c.signer_field||'ВИД_УПРАВЛЯЮЩЕГО';if(k!==pf&&k!==sf)return val;
  if(!isPerson(tid))return val;var s=spec(tid);if(!s.opts.length)return val;if(k===sf)return s.signer||val;return allowed(s,val)?val:(s.def||val)}
 /* выбор в форме: datalist поля ПРОЦЕДУРА — только допустимые варианты, подсказка о значении по умолчанию */
 function picker(e){var el=e.target,c=K();if(c.enabled===false||!el||!el.matches||!el.matches('input[data-k="'+(c.field||'ПРОЦЕДУРА')+'"]'))return;
  if(!caseP())return;var s=spec(null);if(!s.opts.length)return;var id=el.getAttribute('list');var dl=id&&document.getElementById(id);
  if(dl&&!dl.dataset.pp){dl.dataset.pp=dl.innerHTML;}if(dl)dl.innerHTML=s.opts.map(function(o){return '<option value="'+String(o.text).replace(/"/g,'&quot;')+'">'}).join('');
  if(!el.value&&s.def)el.placeholder=s.def;var bad=el.value&&!allowed(s,el.value);el.classList.toggle('dpp_bad',!!bad);el.title=bad?String((c.ui||{}).bad||'Для гражданина и ИП: {list}').replace('{list}',s.opts.map(function(o){return o.text}).join(' / ')):''}
 ['focusin','input','change'].forEach(function(n){document.addEventListener(n,picker,true)});
 window.ArbProc={v:v,spec:spec,isPerson:isPerson,allowed:function(tid,val){return allowed(spec(tid),val)}};
})();
