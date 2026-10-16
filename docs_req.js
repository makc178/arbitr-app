/* 1.7g: обязательные поля (index fields.required) и порядок заполнения (fields.fill_order).
   Обязательное поле — точка акцентного цвета после подписи; красная рамка и «Заполните поле» — только после попытки
   «Скачать» / «Подписать» (gate). Поле с fill_order скрыто, пока не заполнен предшественник; затем под последним
   заполненным полем цепочки — кнопка «+ Добавить вопрос»; добавленное поле с ✕ справа. Подписи — docs_config.required_ui. */
window.ArbReq=function(D){
 function C(){return (D.C()||{}).required_ui||{}}
 function UI(k,d,o){var s=C()[k]||d;if(o)for(var x in o)s=s.split('{'+x+'}').join(o[x]);return s}
 function UIk(k,f,d){var p=(C().per_field||{})[f]||{};return p[k]||UI(k,d)}
 function v(x){return String(x==null?'':x).trim()}
 function lab(k){var f=D.F()[k];return (f&&f.label)||k}
 function prevOf(k){var f=D.F()[k];return f&&f.fill_order||''}
 var TRIED={};
 function blocked(k,tid,n){var p=prevOf(k);if(!p||(n|0)>20)return false;return blocked(p,tid,(n|0)+1)||!v(D.raw(p,tid))}
 function reqFields(t){var F=D.F(),off=D.off(t);return (t.fields||[]).filter(function(k){return F[k]&&F[k].required&&off.indexOf(k)<0&&!blocked(k,t.id)}).concat(D.rgReq?D.rgReq(t):[])}
 function empty(t){return reqFields(t).filter(function(k){return !v(D.raw(k,t.id))})}
 function q(k){return document.querySelectorAll('#dform [data-w="'+String(k).replace(/"/g,'\\"')+'"]')}
 function added(t){var d=D.draft(t.id);return d._fo_add||(d._fo_add=[])}
 function shown(t,k){return !blocked(k,t.id)&&(!!v(D.raw(k,t.id))||added(t).indexOf(k)>=0)}
 function el(h){var d=document.createElement('div');d.innerHTML=h;return d.firstElementChild}
 function syncOrder(t){var F=D.F();
  document.querySelectorAll('#dform [data-foadd]').forEach(function(b){b.remove()});
  (t.fields||[]).forEach(function(k){var f=F[k];if(!f||!f.fill_order)return;var p=f.fill_order,pw=q(p)[0];if(!pw)return;
   var w=q(k)[0];if(!w&&D.fld){w=el(D.fld(k,t));if(!w)return;pw.parentNode.insertBefore(w,pw.nextSibling)}
   var on=shown(t,k);w.hidden=!on;w.classList.add('dfo');
   if(on&&!w.querySelector('[data-fodel]')){var x=document.createElement('button');x.type='button';x.className='dfodel';x.dataset.fodel=k;x.textContent='✕';x.title=UIk('remove_title',k,'Удалить');x.setAttribute('aria-label',x.title+' · '+lab(k));w.appendChild(x)}
   if(!on&&!blocked(k,t.id)){var b=document.createElement('button');b.type='button';b.className='btn sec dfoadd';b.dataset.foadd=k;b.textContent=UIk('add',k,'+ Добавить');pw.parentNode.insertBefore(b,pw.nextSibling)}})}
 function syncReq(t){var F=D.F(),bad=empty(t);document.querySelectorAll('#dform .dreqbad').forEach(function(w){if(bad.indexOf(w.dataset.w)<0||!TRIED[t.id]){w.classList.remove('dreqbad');var e=w.querySelector('.dreqe');if(e)e.remove()}});
  reqFields(t).concat((t.fields||[]).filter(function(k){return F[k]&&F[k].required})).forEach(function(k){q(k).forEach(function(w){w.classList.add('dreq');
   var s=w.querySelector('span')||w.querySelector('label');if(s&&!s.querySelector('.dreqm')){var m=document.createElement('i');m.className='dreqm';m.title=UI('mark_title','Обязательное поле');m.setAttribute('aria-label',m.title);s.appendChild(m)}
   w.querySelectorAll('input,textarea,select').forEach(function(i){i.setAttribute('aria-required','true')});
   var b=!!TRIED[t.id]&&bad.indexOf(k)>=0;w.classList.toggle('dreqbad',b);var e=w.querySelector('.dreqe');if(b&&!e){e=document.createElement('span');e.className='dreqe';e.textContent=UI('error','Заполните поле');w.appendChild(e)}else if(!b&&e)e.remove()})})}
 function sync(t){if(!t)return;try{syncOrder(t)}catch(e){}syncReq(t)}
 function click(t,b){if(!t||!b)return false;
  if(b.dataset.foadd){var k=b.dataset.foadd,a=added(t);if(a.indexOf(k)<0)a.push(k);D.save();sync(t);var i=q(k)[0];i=i&&i.querySelector('input,textarea');if(i)i.focus();return true}
  if(b.dataset.fodel){var k2=b.dataset.fodel,a2=added(t),j=a2.indexOf(k2);if(j>=0)a2.splice(j,1);var w=q(k2)[0],ii=w&&w.querySelector('input,textarea,select');if(ii&&ii.value){ii.value='';ii.dispatchEvent(new Event('input',{bubbles:true}))}else D.save();sync(t);return true}
  return false}
 /* перед формированием: true — можно выпускать */
 function gate(t){var bad=empty(t);if(!bad.length){TRIED[t.id]=0;return true}TRIED[t.id]=1;syncReq(t);
  if(D.toast)D.toast(UI('block','Заполните обязательные поля: {list}',{list:bad.map(lab).join(', ')}));
  var w=q(bad[0])[0],i=w&&w.querySelector('input,textarea,select');if(w){w.scrollIntoView({block:'center'});if(i)i.focus()}return false}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-foadd],[data-fodel]');if(b&&D.cur()){e.preventDefault();click(D.cur(),b)}});
 return {blocked:blocked,empty:empty,reqFields:reqFields,sync:sync,gate:gate,click:click}};
