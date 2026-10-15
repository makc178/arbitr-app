/* Arbitr App — раздел «Документы». Шаблоны: window.ARB_DOCS (documents/index.json), настройки: window.ARB_DOCS_CFG.
   Персональные данные (профиль управляющего, дела, черновики) хранятся ТОЛЬКО в localStorage этого устройства и никуда не отправляются. */
(function(){
var C,X,F={},S,CUR=null,FLT='',Q='',LS='arbitr_docs_v1';
var $=function(i){return document.getElementById(i)};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function U(k,o){var s=(C.ui||{})[k]||k;if(o)Object.keys(o).forEach(function(n){s=s.split('{'+n+'}').join(o[n])});return s}
function load(){var s={};try{s=JSON.parse(localStorage.getItem(LS))||{}}catch(e){}s.profile=s.profile||{};s.cases=s.cases||[];s.drafts=s.drafts||{};return s}
function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
/* Хук для будущего фирменного бланка (шапка/подвал/реквизиты): будет храниться только на устройстве (IndexedDB), в репозиторий не попадает. Сейчас бланка нет. */
function letterhead(){return null}
function re(list,k){return (list||[]).some(function(p){return p.charAt(0)=='^'?new RegExp(p).test(k):p==k})}
function initFields(){var src=Object.assign({},X.fields||{},C.extra_fields||{});
 Object.keys(src).forEach(function(k){var f=Object.assign({},src[k]);f.k=k;if((C.labels||{})[k])f.label=C.labels[k];if((C.scope_override||{})[k])f.scope=C.scope_override[k];
  f.type=re(C.date_fields,k)?'date':re(C.time_fields,k)?'time':re(C.textarea_fields,k)?'textarea':re(C.inn_fields,k)?'inn':'text';f.opt=(C.options||{})[k];f.optional=(C.optional||[]).indexOf(k)>=0;F[k]=f});
 X.templates.forEach(function(t){t.fields.forEach(function(k){if(!F[k])F[k]={k:k,label:k.replace(/_/g,' ').toLowerCase().replace(/^./,function(c){return c.toUpperCase()}),scope:'document',type:'text'}})})}
function ofScope(sc,order){var a=(order||[]).filter(function(k){return F[k]&&F[k].scope==sc});Object.keys(F).forEach(function(k){if(F[k].scope==sc&&a.indexOf(k)<0)a.push(k)});return a}
function curCase(){return S.cases.find(function(c){return c.id==S.cur})||null}
function caseName(c){var d=c.data||{};return [d.ДОЛЖНИК_НАИМЕНОВАНИЕ,d.НОМЕР_ДЕЛА].filter(Boolean).join(' · ')||U('case_unnamed')}
function raw(k,tid){var f=F[k]||{},d=(S.drafts[tid]||{}),c=curCase(),v;
 if(d[k]!=null&&d[k]!=='')return d[k];
 if(f.scope=='profile')v=S.profile[k];else if(f.scope=='case'&&c)v=c.data[k];
 if((v==null||v==='')&&k=='ВИД_УПРАВЛЯЮЩЕГО'){var p=raw('ПРОЦЕДУРА',tid);v=(C.procedure_manager||{})[p]||''}
 return v==null?'':v}
function fmt(k,v){if(!v)return '';var f=F[k]||{};if(f.type=='date'&&/^\d{4}-\d\d-\d\d$/.test(v)){var a=v.split('-');return a[2]+'.'+a[1]+'.'+a[0]}return String(v)}
function setVal(k,v,tid){var f=F[k]||{},c=curCase();
 if(f.scope=='profile'){S.profile[k]=v;if(tid&&S.drafts[tid])delete S.drafts[tid][k]}
 else if(f.scope=='case'&&c){c.data[k]=v;if(tid&&S.drafts[tid])delete S.drafts[tid][k]}
 else if(tid){(S.drafts[tid]=S.drafts[tid]||{})[k]=v}save()}
function inp(f,v,pre){var id=pre+'_'+f.k,a=' data-k="'+E(f.k)+'" id="'+E(id)+'"',dl='';
 if(f.opt){dl='<datalist id="'+E(id)+'_l">'+f.opt.map(function(o){return '<option value="'+E(o)+'">'}).join('')+'</datalist>';a+=' list="'+E(id)+'_l"'}
 if(f.type=='textarea')return '<textarea'+a+' rows="3">'+E(v)+'</textarea>';
 return '<input'+a+(f.type=='date'?' type="date"':f.type=='time'?' type="time"':'')+(f.type=='inn'?' inputmode="numeric"':'')+(f.type=='text'&&/EMAIL/.test(f.k)?' type="email"':'')+(/ТЕЛ_/.test(f.k)?' type="tel"':'')+' value="'+E(v)+'" autocomplete="off">'+dl}
function grid(keys,get,pre){return '<div class="g2">'+keys.map(function(k){var f=F[k];return '<div data-w="'+E(k)+'"'+(f.type=='textarea'?' class="dwide"':'')+'><label for="'+E(pre+'_'+k)+'">'+E(f.label)+(f.optional?' <span class="sm">(необязательно)</span>':'')+'</label>'+inp(f,get(k),pre)+'</div>'}).join('')+'</div>'}
function shell(){var v=document.createElement('div');v.id='vdocs';v.style.display='none';
 v.innerHTML='<div class="md prc fin dwrap"><h2 id="dtl"></h2><p class="sm" id="dintro"></p><p class="sm edis" id="ddis"></p>'+
 '<details class="pfold" id="dprof"><summary>'+E(U('profile'))+'</summary><div id="dprofb"></div></details>'+
 '<details class="pfold" id="dcases"><summary>'+E(U('cases'))+'</summary><div id="dcasesb"></div></details>'+
 '<p class="sm dpriv"><span id="dpriv"></span> <button type="button" class="lbtn sec" id="dclear"></button> <span class="sm" id="dclm"></span></p>'+
 '<div id="dlist"></div><div id="ded" style="display:none"></div></div>';
 var a=$('veval')||$('vsrc');if(a&&a.parentNode)a.parentNode.insertBefore(v,a.nextSibling);else document.body.appendChild(v)}
function caseSel(id){return '<select id="'+id+'">'+'<option value="">'+E(U('case_none'))+'</option>'+S.cases.map(function(c){return '<option value="'+E(c.id)+'"'+(c.id==S.cur?' selected':'')+'>'+E(caseName(c))+'</option>'}).join('')+'</select>'}
function drawProfile(){$('dprofb').innerHTML=grid(ofScope('profile',C.profile_order),function(k){return S.profile[k]||''},'dp')+'<p class="sm">'+E(C.letterhead_note||'')+'</p>'}
function drawCases(){var c=curCase();$('dcasesb').innerHTML='<div class="dcrow">'+caseSel('dcsel')+' <button type="button" class="lbtn sec" id="dcnew">'+E(U('case_new'))+'</button>'+(c?' <button type="button" class="lbtn sec" id="dcdel">'+E(U('case_del'))+'</button>':'')+'</div>'+
 (c?grid(ofScope('case',C.case_order),function(k){return c.data[k]||''},'dc')+'<p class="sm">'+E(U('procedure_hint'))+'</p>':'')}
function groups(){return X.groups||[]}
function drawList(){var g=groups(),q=Q.trim().toLowerCase(),n=0,h='<div class="pflt dflt"><input type="search" id="dq" placeholder="'+E(U('search'))+'" value="'+E(Q)+'"></div><div class="dchips" id="dchips"><button type="button" class="pchip'+(FLT?'':' on')+'" data-g="">'+E(U('all'))+'</button>'+g.map(function(x){return '<button type="button" class="pchip'+(FLT==x?' on':'')+'" data-g="'+E(x)+'">'+E(x)+'</button>'}).join('')+'</div>';
 g.forEach(function(gr){if(FLT&&FLT!=gr)return;var ts=X.templates.filter(function(t){return t.group==gr&&(!q||(t.title+' '+t.norm+' '+t.kind+' '+t.deadline+' '+(TXT[t.id]||'').replace(/\{\{[^{}]+\}\}/g,' ')).toLowerCase().indexOf(q)>=0)});if(!ts.length)return;n+=ts.length;
  h+='<h3 class="dgh">'+E(gr)+' <span class="sm">'+ts.length+'</span></h3>'+ts.map(function(t){return '<div class="lot dit" data-t="'+E(t.id)+'" role="button" tabindex="0"><div class="d1">'+E(t.title)+'</div><div class="sm"><b>'+E(U('norm'))+':</b> '+E(t.norm)+'</div>'+(t.deadline?'<div class="sm"><b>'+E(U('deadline'))+':</b> '+E(t.deadline)+'</div>':'')+'<div class="sm dkind">'+E(t.kind)+'</div></div>'}).join('')});
 h+=n?'':'<div class="empty">'+E(U('empty'))+'</div>';
 var L=$('dlist');var foc=document.activeElement&&document.activeElement.id=='dq',pos=foc?document.activeElement.selectionStart:0;L.innerHTML=h;if(foc){var i=$('dq');i.focus();try{i.setSelectionRange(pos,pos)}catch(e){}}}
var TXT={},PF=0;
function prefetch(){if(PF)return;PF=1;Promise.all(X.templates.map(function(t){return md(t).catch(function(){})})).then(function(){if(Q)drawList()})}
async function md(t){if(TXT[t.id]==null){var r=await fetch('docs/'+t.md+'?v='+(window.ARB_DOCS_VH||''));if(!r.ok)throw new Error('шаблон не загрузился ('+r.status+')');TXT[t.id]=await r.text()}return TXT[t.id]}
function missing(t){return t.fields.filter(function(k){return !raw(k,t.id)&&!(F[k]&&F[k].optional)})}
function fill(s,t,mode){return s.replace(/\{\{([^{}]+)\}\}/g,function(m,k){var v=fmt(k,raw(k,t.id));if(v)return mode=='html'?E(v):v;if(F[k]&&F[k].optional)return '';var l='['+((F[k]||{}).label||k)+']';return mode=='html'?'<mark>'+E(l)+'</mark>':l})}
function plain(s){return s.split('\n').map(function(l){return l.replace(/^#+\s+/,'')}).join('\n')}
function htmlPrev(s,t){return s.split('\n').map(function(l){var hd=/^#+\s+/.test(l);l=l.replace(/^#+\s+/,'');var x=fill(l,t,'html');return hd?'<div class="dhd">'+x+'</div>':'<div>'+(x||'&nbsp;')+'</div>'}).join('')}
async function openT(id){var t=X.templates.find(function(x){return x.id==id});if(!t)return;CUR=t;$('dlist').style.display='none';$('vdocs').classList.add('editing');var ed=$('ded');ed.style.display='';ed.innerHTML='<p class="sm">…</p>';
 try{await md(t)}catch(e){ed.innerHTML='<p class="sm ewarn">'+E(e.message)+'</p><button type="button" class="lbtn sec" data-back>'+E(U('back'))+'</button>';return}
 var by={profile:[],case:[],document:[]};t.fields.forEach(function(k){(by[(F[k]||{}).scope]||by.document).push(k)});
 var ord=function(a,o){return a.sort(function(x,y){var i=(o||[]).indexOf(x),j=(o||[]).indexOf(y);return (i<0?999:i)-(j<0?999:j)})};ord(by.profile,C.profile_order);ord(by.case,C.case_order);
 var st=C.scope_titles||{},sec=function(sc){return by[sc].length?'<h4 class="dsh">'+E(st[sc]||sc)+'</h4>'+grid(by[sc],function(k){return raw(k,t.id)},'df'):''};
 ed.innerHTML='<button type="button" class="lbtn sec" data-back>'+E(U('back'))+'</button><h3 class="dth">'+E(t.title)+'</h3><div class="sm"><b>'+E(U('norm'))+':</b> '+E(t.norm)+'</div>'+(t.deadline?'<div class="sm"><b>'+E(U('deadline'))+':</b> '+E(t.deadline)+'</div>':'')+
  '<p class="sm edis">'+E(X.disclaimer)+'</p>'+(t.kind=='в суд'?'<p class="sm ewarn">'+E(U('court_note'))+'</p>':'')+
  '<div class="dcrow"><label for="dfcase">'+E(U('case_pick'))+'</label>'+caseSel('dfcase')+'</div><p class="sm">'+E(U('save_to_profile'))+'</p>'+
  '<form id="dform" autocomplete="off" onsubmit="return false">'+sec('profile')+sec('case')+sec('document')+'</form>'+
  '<div class="dact"><button type="button" class="lbtn" id="ddocx">'+E(U('dl_docx'))+'</button><button type="button" class="lbtn sec" id="dtxt">'+E(U('dl_txt'))+'</button><button type="button" class="lbtn sec" id="dcopy">'+E(U('copy'))+'</button></div><p class="sm" id="dmiss"></p>'+
  '<h4 class="dsh">'+E(U('preview'))+'</h4><div class="dprev" id="dprev"></div>';
 prev();window.scrollTo(0,$('vdocs').offsetTop-60)}
function prev(){if(!CUR||!$('dprev'))return;$('dprev').innerHTML=htmlPrev(TXT[CUR.id],CUR);var m=missing(CUR),el=$('dmiss');if(el&&!el.dataset.warn){el.textContent=m.length?'':U('all_filled');el.className='sm'}
 if(el&&el.dataset.warn&&!m.length){el.dataset.warn='';el.textContent=U('all_filled');el.className='sm'}
 document.querySelectorAll('#dform [data-k]').forEach(function(i){var w=i.closest('[data-w]');if(w)w.classList.toggle('dempty',!i.value&&!(F[i.dataset.k]&&F[i.dataset.k].optional))})}
function sig(t){return t.id+'|'+missing(t).join(',')}
function gate(btn){var m=missing(CUR),el=$('dmiss');if(!m.length)return true;if(btn.dataset.ok==sig(CUR))return true;btn.dataset.ok=sig(CUR);el.dataset.warn=1;el.className='sm ewarn';el.textContent=U('missing',{n:m.length,list:m.map(function(k){return (F[k]||{}).label||k}).join(', ')});return false}
function fname(t,ext){var d=raw('ДОЛЖНИК_НАИМЕНОВАНИЕ',t.id);return ((t.title+(d?' — '+d:'')).replace(/[\\/:*?"<>|«»\n\r]+/g,' ').replace(/\s+/g,' ').trim().slice(0,120))+'.'+ext}
function saveBlob(b,n){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000)}
function xe(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function runXml(xml,t){return xml.replace(/<w:r>([\s\S]*?)<\/w:r>/g,function(all,inner){if(inner.indexOf('{{')<0)return all;
 var rp=(inner.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)||[''])[0],body=inner.replace(rp,''),out='';
 var parts=body.split(/(<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>)/);
 parts.forEach(function(p){var m=p.match(/^<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>$/);if(!m){if(p)out+='<w:r>'+rp+p+'</w:r>';return}
  m[1].split(/(\{\{[^{}]+\}\})/).forEach(function(seg){if(!seg)return;var k=(seg.match(/^\{\{([^{}]+)\}\}$/)||[])[1],r=rp,txt;
   if(k){var v=fmt(k,raw(k,t.id));if(v)txt=xe(v);else if(F[k]&&F[k].optional)return;else{txt=xe('['+((F[k]||{}).label||k)+']');r=rp?rp.replace('</w:rPr>','<w:highlight w:val="yellow"/></w:rPr>'):'<w:rPr><w:highlight w:val="yellow"/></w:rPr>'}}else txt=seg;
   out+='<w:r>'+r+'<w:t xml:space="preserve">'+txt.split(/\r?\n/).join('</w:t><w:br/><w:t xml:space="preserve">')+'</w:t></w:r>'})});return out})}
async function docx(t){var r=await fetch('docs/'+t.docx+'?v='+(window.ARB_DOCS_VH||''));if(!r.ok)throw new Error('шаблон Word не загрузился ('+r.status+')');var z=await JSZip.loadAsync(await r.arrayBuffer());
 var names=Object.keys(z.files).filter(function(n){return /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)});
 for(var i=0;i<names.length;i++){z.file(names[i],runXml(await z.file(names[i]).async('string'),t))}
 /* letterhead(): здесь будет подстановка локального фирменного бланка */
 return z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
function bind(){var v=$('vdocs');
 v.addEventListener('input',function(e){var i=e.target;if(i.id=='dq'){Q=i.value;drawList();return}var k=i.dataset&&i.dataset.k;if(!k)return;
  var pre=i.id.split('_')[0];if(pre=='dp'){S.profile[k]=i.value;save()}else if(pre=='dc'){var c=curCase();if(c){c.data[k]=i.value;save()}}else if(pre=='df'&&CUR){setVal(k,i.value,CUR.id);if(k=='ПРОЦЕДУРА'){var w=$('df_ВИД_УПРАВЛЯЮЩЕГО');if(w&&!w.value)w.placeholder=raw('ВИД_УПРАВЛЯЮЩЕГО',CUR.id)}prev()}});
 v.addEventListener('change',function(e){var i=e.target;if(i.id=='dcsel'||i.id=='dfcase'){S.cur=i.value||null;save();drawCases();if(CUR)openT(CUR.id)}else if(i.dataset&&i.dataset.k&&i.id.indexOf('dc_')==0){var o=$('dcsel').selectedOptions[0],c=curCase();if(o&&c)o.textContent=caseName(c)}});
 v.addEventListener('click',async function(e){var b=e.target.closest('button,[data-t]');if(!b)return;
  if(b.dataset.g!=null&&b.classList.contains('pchip')){FLT=b.dataset.g;drawList();return}
  if(b.dataset.t){openT(b.dataset.t);return}
  if(b.hasAttribute('data-back')){CUR=null;$('vdocs').classList.remove('editing');$('ded').style.display='none';$('ded').innerHTML='';$('dlist').style.display='';return}
  if(b.id=='dcnew'){var c={id:'c'+Date.now().toString(36),data:{}};S.cases.push(c);S.cur=c.id;save();drawCases();$('dcases').open=true;return}
  if(b.id=='dcdel'){var cc=curCase();if(cc&&confirm(U('case_del_confirm',{name:caseName(cc)}))){S.cases=S.cases.filter(function(x){return x!==cc});S.cur=null;save();drawCases()}return}
  if(b.id=='dclear'){if(confirm(U('clear_confirm'))){localStorage.removeItem(LS);S=load();drawProfile();drawCases();if(CUR)openT(CUR.id);$('dclm').textContent=U('cleared')}return}
  if(!CUR)return;
  try{if(b.id=='ddocx'){if(!gate(b))return;saveBlob(await docx(CUR),fname(CUR,'docx'))}
   else if(b.id=='dtxt'){if(!gate(b))return;saveBlob(new Blob([plain(fill(TXT[CUR.id],CUR,'text'))],{type:'text/plain;charset=utf-8'}),fname(CUR,'txt'))}
   else if(b.id=='dcopy'){var s=plain(fill(TXT[CUR.id],CUR,'text'));try{await navigator.clipboard.writeText(s)}catch(x){var ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}$('dmiss').dataset.warn='';$('dmiss').className='sm';$('dmiss').textContent=U('copied')}}
  catch(x){$('dmiss').className='sm ewarn';$('dmiss').textContent='Не удалось: '+x.message}});
 v.addEventListener('keydown',function(e){var t=e.target.closest&&e.target.closest('[data-t]');if(t&&(e.key=='Enter'||e.key==' ')){e.preventDefault();openT(t.dataset.t)}})}
function nav(force){var ex=document.querySelector('nav button[data-v="docs"]');if(ex)return true;var after=document.querySelector('nav button[data-v="eval"]')||(force&&document.querySelector('nav button[data-v="fin"]'));if(!after)return false;
 var nb=document.createElement('button');nb.dataset.v='docs';nb.textContent=C.title;after.after(' ',nb);
 nb.onclick=function(){document.querySelectorAll('nav button[data-v]').forEach(function(x){x.classList.toggle('on',x===nb)});['vreg','vman','vmet','vsrc','vrep','vprc','vfin','veval','vprop','vperr','vfav'].forEach(function(i){var e=$(i);if(e)e.style.display='none'});$('vdocs').style.display='';prefetch()};
 document.querySelector('nav').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(b&&b.dataset.v!='docs'){var d=$('vdocs');if(d)d.style.display='none'}});return true}
function init(){C=window.ARB_DOCS_CFG;X=window.ARB_DOCS;if(!C||!X)return;S=load();initFields();shell();
 $('dtl').textContent=C.title;$('dintro').textContent=C.intro||'';$('ddis').textContent=X.disclaimer||'';$('dpriv').textContent=C.privacy||'';$('dclear').textContent=U('clear');
 drawProfile();drawCases();drawList();bind();var n=0,iv=setInterval(function(){n++;if(nav(n>40))clearInterval(iv)},250)}
window.__docsTest={fill:function(id){var t=X.templates.find(function(x){return x.id==id});return md(t).then(function(s){return plain(fill(s,t,'text'))})},docx:function(id){return docx(X.templates.find(function(x){return x.id==id}))},missing:function(id){return missing(X.templates.find(function(x){return x.id==id}))}};
if(document.readyState=='loading')addEventListener('DOMContentLoaded',init);else init();
})();
