window.ARB_FINREQ_CFG={"queue": "arbitr/fin_requests/", "id_tag": "fa", "source": "Arbitr App / Финанализ", "t": {"fail_saved": "Не удалось отправить запрос на анализ. Файлы сохранены ({n}), повторите попытку.", "fail_partial": "Не удалось отправить запрос на анализ. Загружено файлов: {n} из {m}, повторите попытку.", "fail_none": "Не удалось отправить запрос на анализ. Файлы не загружены, повторите попытку.", "retry": "↻ Повторить", "retry_title": "Повторить отправку: уже загруженные файлы повторно не загружаются"}};
/* Финанализ → «Запустить анализ»: очередь Arbitr (config/fin_request.json → queue, не общий requests/ Эвереста),
   повтор без повторной загрузки файлов, понятная ошибка под кнопкой (подробности — только в консоль). */
(function(){
 var C=window.ARB_FINREQ_CFG||{},T=C.t||{},S=null;
 function key(f){return [f.name,f.size,f.lastModified].join('|')}
 function sig(files){return files.map(key).join('\n')}
 function fmt(s,o){return String(s||'').replace(/\{(\w+)\}/g,function(_,k){return o[k]!=null?o[k]:''})}
 function strip(){var e=document.getElementById('ffail');if(e)return e;var b=document.getElementById('fsend');if(!b)return null;var p=b.closest('p')||b.parentNode;
  e=document.createElement('div');e.id='ffail';e.className='ffail';e.setAttribute('role','alert');e.hidden=true;
  e.innerHTML='<span class="ffail-t"></span><button type="button" class="ffail-r"></button>';p.parentNode.insertBefore(e,p.nextSibling);
  var r=e.querySelector('.ffail-r');r.textContent=T.retry||'↻ Повторить';if(T.retry_title)r.title=T.retry_title;
  r.onclick=function(){var f=document.getElementById('ff');if(!f)return;e.hidden=true;if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event('submit',{cancelable:true}))};return e}
 function hide(){var e=document.getElementById('ffail');if(e)e.hidden=true}
 window.ArbFinSend={
  /* та же попытка (тот же набор файлов) — те же id и уже загруженные файлы; другой набор — новая попытка */
  begin:function(files){var g=sig(files);if(!S||S.sig!==g){var t=new Date(),tag=C.id_tag||'fa',rid=t.toISOString().replace(/[-:]/g,'').slice(0,15)+'Z-'+tag+'-'+Math.random().toString(36).slice(2,6);
    S={sig:g,t:t,rid:rid,cid:'F'+rid.slice(0,15).replace('T','')+'-'+rid.slice(-4),up:[],keys:{},reqDone:false}}hide();return S},
  done:function(f){return !!(S&&S.keys[key(f)])},
  mark:function(f){if(S)S.keys[key(f)]=1},
  reqPath:function(rid){return (C.queue||'arbitr/fin_requests/')+rid+'.json'},
  queueDir:function(){return String(C.queue||'arbitr/fin_requests/').replace(/\/+$/,'')},
  source:function(){return C.source||'Arbitr App / Финанализ'},
  ok:function(){S=null;hide()},
  fail:function(x,n,m){try{console.error('[Финанализ] отправка не удалась:',x)}catch(_){}var e=strip(),t=n>0&&n>=m?fmt(T.fail_saved,{n:n}):n>0?fmt(T.fail_partial,{n:n,m:m}):fmt(T.fail_none,{});
   if(!e){var ms=document.getElementById('fmsg');if(ms)ms.textContent=t;return}e.querySelector('.ffail-t').textContent=t;e.hidden=false;var ms2=document.getElementById('fmsg');if(ms2)ms2.textContent=''},
  reset:function(){S=null;hide()}
 };
})();
