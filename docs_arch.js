/* Arbitr App · Архив (отдельный раздел верхнего меню): документы сгруппированы по должникам.
   Каждый сформированный документ (одиночный и пакетный, каждый адресат отдельно) записывается в архив своего дела.
   Хранение: только это устройство (IndexedDB arbitr_local/archive). Карточка и файл зашифрованы AES-GCM ключом из PIN (PBKDF2, соль устройства). */
(function(){
'use strict';
var A,ROOT,KEY=null,META={},FLT='',Q='',FT='',FA='',SORT='date',OPEN={},UP=null,MSG='',SALT='arbitr_arch_salt',IT=250000;
function E(s){return A.E(s)}function K(){return A.C.archive||{}}function T(k,o){var s=K()[k]||k;if(o)Object.keys(o).forEach(function(n){s=s.split('{'+n+'}').join(o[n])});return s}
function b64(u){var s='';u=new Uint8Array(u);for(var i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)}
function u8(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})}
async function enc(buf){var iv=crypto.getRandomValues(new Uint8Array(12));return {iv:b64(iv),ct:await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},KEY,buf)}}
async function dec(o){return crypto.subtle.decrypt({name:'AES-GCM',iv:u8(o.iv)},KEY,o.ct)}
async function unlock(pin){var s=localStorage.getItem(SALT);if(!s){s=b64(crypto.getRandomValues(new Uint8Array(16)));localStorage.setItem(SALT,s)}
 var k0=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey']);KEY=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:u8(s),iterations:IT},k0,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);await loadAll();draw()}
async function loadAll(){META={};if(!KEY||!window.ArbDB)return;var all=[];try{all=await ArbDB.all('archive')}catch(e){}
 for(var i=0;i<all.length;i++){var r=all[i];try{META[r.id]=Object.assign(JSON.parse(new TextDecoder().decode(await dec(r.m))),{id:r.id,case:r.case})}catch(e){META[r.id]={id:r.id,case:r.case,bad:true,title:T('bad'),date:new Date(r.t||0).toISOString()}}}}
async function add(m,blob,quiet){if(!KEY)throw new Error(T('locked'));var buf=blob?await blob.arrayBuffer():null,id=ArbDB.uid('ar');
 m=Object.assign({date:new Date().toISOString(),size:buf?buf.byteLength:0,type:blob&&blob.type||''},m);if(!m.debtor){var cs=caseOf(m.case);if(cs&&cs.data){m.debtor=cs.data.ДОЛЖНИК_НАИМЕНОВАНИЕ||'';m.debtor_inn=cs.data.ДОЛЖНИК_ИНН||''}}
 if(m.batch&&m.no){var dup=Object.keys(META).find(function(k){var x=META[k];return x.case==m.case&&x.no==m.no&&x.tid==m.tid&&(x.addressee||'')==(m.addressee||'')&&x.batch==m.batch});if(dup){id=dup}}
 var rec={id:id,case:m.case||'',t:Date.now(),m:await enc(new TextEncoder().encode(JSON.stringify(m))),f:buf?await enc(buf):null};await ArbDB.put('archive',rec);META[id]=Object.assign({},m,{id:id,case:rec.case});if(quiet===false)MSG=T('added');draw();return id}
async function file(id){var r=await ArbDB.get('archive',id);if(!r||!r.f)throw new Error('нет файла');return dec(r.f)}
function n0(s){var m=String(s||'').match(/^\s*(\d+)/);return m?+m[1]:0}
function caseOf(id){return id?(A.S().cases||[]).find(function(c){return c.id==id}):null}
function nk(s){return String(s||'').toLowerCase().replace(/[«»"'.,()\s-]+/g,' ').replace(/\b(ооо|ао|пао|зао|оао|ип)\b/g,'').trim()}
function debtorOf(m){var c=caseOf(m.case),d=(c&&c.data)||{},n=d.ДОЛЖНИК_НАИМЕНОВАНИЕ||m.debtor||'',inn=d.ДОЛЖНИК_ИНН||m.debtor_inn||'';return {name:n||(c?A.caseName(c):T('nodebtor')),inn:inn,key:inn?'i:'+inn:n?'n:'+nk(n):c?'c:'+c.id:'none'}}
function all(){return Object.keys(META).map(function(k){return META[k]})}
function groups(){var G={};all().forEach(function(m){var d=debtorOf(m),g=G[d.key]||(G[d.key]={key:d.key,name:d.name,inn:d.inn,items:[],cases:{}});g.items.push(m);if(m.case)g.cases[m.case]=1});
 (A.S().cases||[]).forEach(function(c){var d=debtorOf({case:c.id});if(G[d.key])G[d.key].cases[c.id]=1});
 return Object.keys(G).map(function(k){return G[k]}).sort(function(a,b){return a.key=='none'?1:b.key=='none'?-1:a.name.localeCompare(b.name,'ru')})}
function match(m){var q=Q.trim().toLowerCase();return (!FLT||m.kind==FLT)&&(!FT||(m.title||'')==FT)&&(!FA||(m.addressee||m.party||'')==FA)&&(!q||[m.title,m.no,m.addressee,m.party,m.note,m.fname,m.debtor].join(' ').toLowerCase().indexOf(q)>=0)}
function sorted(L){return L.slice().sort(SORT=='no'?function(a,b){return n0(b.no)-n0(a.no)||String(b.no).localeCompare(String(a.no))||String(b.date).localeCompare(String(a.date))}:function(a,b){return String(b.date).localeCompare(String(a.date))||n0(b.no)-n0(a.no)})}
function dt(s){var d=new Date(s);if(isNaN(d))return ['',''];return [('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear(),('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)]}
function uniq(f){var o={};all().forEach(function(m){var v=f(m);if(v)o[v]=1});return Object.keys(o).sort(function(a,b){return a.localeCompare(b,'ru')})}
function opts(L,v,none){return '<option value="">'+E(none)+'</option>'+L.map(function(x){return '<option value="'+E(x)+'"'+(x==v?' selected':'')+'>'+E(x.length>60?x.slice(0,58)+'…':x)+'</option>'}).join('')}
function upForm(g){var KD=K().kinds||{},cs=A.S().cases||[],cid=g&&Object.keys(g.cases)[0]||(A.curCase()||{}).id||'';
 return '<div class="lot dcard"><div class="g2"><div class="dwide"><label for="daf">'+E(T('up_file'))+'</label><input type="file" id="daf"></div>'+
  '<div class="dwide"><label for="dacase">'+E(T('case'))+'</label><select id="dacase"><option value="">'+E(T('nocase'))+'</option>'+cs.map(function(c){return '<option value="'+E(c.id)+'"'+(c.id==cid?' selected':'')+'>'+E(A.caseName(c))+'</option>'}).join('')+'</select></div>'+
  '<div><label for="dak">'+E(T('up_kind'))+'</label><select id="dak">'+Object.keys(KD).map(function(k){return '<option value="'+k+'"'+(k=='in'?' selected':'')+'>'+E(KD[k])+'</option>'}).join('')+'</select></div><div><label for="dad">'+E(T('up_date'))+'</label><input type="date" id="dad" value="'+new Date().toISOString().slice(0,10)+'"></div><div><label for="dan">'+E(T('up_no'))+'</label><input id="dan"></div><div><label for="dat">'+E(T('up_title'))+'</label><input id="dat"></div><div class="dwide"><label for="dap">'+E(T('up_party'))+'</label><input id="dap"></div><div class="dwide"><label for="dano">'+E(T('up_note'))+'</label><textarea id="dano" rows="2"></textarea></div></div>'+
  '<div class="dact"><button type="button" class="lbtn" data-ar="upsave">'+E(T('up_save'))+'</button><button type="button" class="lbtn sec" data-ar="upcancel">'+E(A.U?A.U('cancel'):'Отмена')+'</button></div><p class="sm ewarn" id="daerr"></p></div>'}
function item(m){var KD=K().kinds||{},d=dt(m.date);if(m.doc_date)d=[m.doc_date,''];return '<div class="lot dar"><div class="d1">'+E(m.title||m.fname||'—')+'</div><div class="sm">'+E([d[0]+(d[1]?' '+d[1]:''),(KD[m.kind]||''),m.no?'№ '+m.no:'',m.addressee||m.party||''].filter(Boolean).join(' · '))+'</div>'+(m.mgr?'<div class="sm">'+E(T('mgr_l'))+': '+E(m.mgr)+'</div>':'')+((m.blank||m.signed)?'<div class="sm dkind">'+E([m.blank?T('blank'):'',m.signed?T('signed'):''].filter(Boolean).join(' · '))+'</div>':'')+(m.note?'<div class="sm">'+E(m.note)+'</div>':'')+'<div class="dact">'+(m.size?'<button type="button" class="lbtn sec" data-ardl="'+E(m.id)+'">'+E(T('dl'))+'</button>':'')+'<button type="button" class="lbtn sec adred" data-ardel="'+E(m.id)+'">'+E(T('del'))+'</button></div></div>'}
function draw(){if(!ROOT)return;if(!KEY){ROOT.innerHTML='<p class="sm">'+E(K().help||'')+'</p><p class="sm ewarn">'+E(T('locked'))+'</p>';return}
 var KD=K().kinds||{},G=groups(),flt=!!(FLT||FT||FA||Q.trim()),tot=all().length;
 var h='<p class="sm">'+E(K().help||'')+'</p>'+(MSG?'<p class="sm dok">'+E(MSG)+'</p>':'')+'<div class="dact"><button type="button" class="lbtn sec" data-ar="up" data-g="">'+E(T('upload'))+'</button></div>'+(UP===''?upForm(null):'');
 if(tot){h+='<div class="pflt dflt"><input type="search" id="daq" placeholder="'+E(T('search'))+'" value="'+E(Q)+'"></div><div class="dchips"><button type="button" class="pchip'+(FLT?'':' on')+'" data-ark="">'+E(T('all'))+'</button>'+Object.keys(KD).map(function(k){return '<button type="button" class="pchip'+(FLT==k?' on':'')+'" data-ark="'+k+'">'+E(KD[k])+'</button>'}).join('')+'</div>'+
  '<div class="dafl"><select id="daft" aria-label="'+E(T('f_tpl'))+'">'+opts(uniq(function(m){return m.title}),FT,T('f_tpl'))+'</select><select id="dafa" aria-label="'+E(T('f_addr'))+'">'+opts(uniq(function(m){return m.addressee||m.party}),FA,T('f_addr'))+'</select><select id="dasort" aria-label="'+E(T('sort'))+'"><option value="date"'+(SORT=='date'?' selected':'')+'>'+E(T('sort_date'))+'</option><option value="no"'+(SORT=='no'?' selected':'')+'>'+E(T('sort_no'))+'</option></select></div>'+
  '<p class="sm">'+E(T('groups_n',{g:G.length,n:tot}))+'</p>';
  var shown=0;G.forEach(function(g){var L=sorted(g.items.filter(match));if(flt&&!L.length)return;shown++;var op=OPEN[g.key]||flt&&L.length<=20;
   h+='<details class="dag"'+(op?' open':'')+' data-g="'+E(g.key)+'" id="dag_'+E(g.key.replace(/[^\w]/g,'_'))+'"><summary><span class="dagn">'+E(g.name)+(g.inn?' <span class="sm">ИНН '+E(g.inn)+'</span>':'')+'</span><span class="dagc" title="'+E(T('n',{n:g.items.length}))+'">'+(flt?L.length+'/':'')+g.items.length+'</span></summary>'+
    '<div class="dact dargrid"><button type="button" class="lbtn sec" data-ar="up" data-g="'+E(g.key)+'">'+E(T('upload'))+'</button><button type="button" class="lbtn sec" data-ar="csv" data-g="'+E(g.key)+'">'+E(T('export_csv'))+'</button><button type="button" class="lbtn sec" data-ar="xlsx" data-g="'+E(g.key)+'">'+E(T('export_xlsx'))+'</button><button type="button" class="lbtn sec" data-ar="zip" data-g="'+E(g.key)+'">'+E(T('zip'))+'</button></div>'+
    (UP===g.key?upForm(g):'')+(L.length?L.map(item).join(''):'<div class="empty">'+E(T('empty'))+'</div>')+'</details>'});
  if(!shown)h+='<div class="empty">'+E(T('nothing'))+'</div>'}
 else h+='<div class="empty">'+E(T('empty'))+'</div>';
 var a=document.activeElement,id=a&&a.id,p=a&&a.selectionStart;ROOT.innerHTML=h;if(id=='daq'){var e=document.getElementById('daq');e.focus();try{e.setSelectionRange(p,p)}catch(x){}}}
function grp(k){return groups().find(function(g){return g.key==k})}
function rows(L){var KD=K().kinds||{};return sorted(L).reverse().map(function(m){var d=dt(m.date);if(m.doc_date)d=[m.doc_date,d[1]];return [d[0],d[1],KD[m.kind]||'',m.no||'',m.title||'',m.addressee||m.party||'',m.blank?T('yes'):'',m.signed?T('yes'):'',m.fname||'',m.note||'']})}
function base(g){return (String(g&&g.name||'arhiv').replace(/[\\\/:*?"<>|«»]+/g,'').replace(/\s+/g,'_').slice(0,60))||'arhiv'}
function stamp(){return new Date().toISOString().slice(0,10)}
function csvText(L){var q=function(s){s=String(s);return /[;"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};return '\uFEFF'+[K().cols].concat(rows(L)).map(function(r){return r.map(q).join(';')}).join('\r\n')}
function csv(g){A.saveBlob(new Blob([csvText(g.items)],{type:'text/csv;charset=utf-8'}),base(g)+'_reestr_'+stamp()+'.csv')}
async function xlsx(g){var R=[K().cols].concat(rows(g.items)),x=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]}).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'')},col=function(i){var s='';i++;while(i){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26}return s};
 var sd='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+[12,7,12,12,48,36,8,8,40,30].map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'}).join('')+'</cols><sheetData>'+R.map(function(r,i){return '<row r="'+(i+1)+'">'+r.map(function(v,j){return '<c r="'+col(j)+(i+1)+'" t="inlineStr"'+(i==0?' s="1"':'')+'><is><t xml:space="preserve">'+x(v)+'</t></is></c>'}).join('')+'</row>'}).join('')+'</sheetData></worksheet>';
 var z=new JSZip();z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 z.file('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Реестр" sheetId="1" r:id="rId1"/></sheets></workbook>');
 z.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 z.file('xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>');
 z.file('xl/worksheets/sheet1.xml',sd);A.saveBlob(await z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),base(g)+'_reestr_'+stamp()+'.xlsx')}
async function zipAll(g){var z=new JSZip(),L=g.items,used={};for(var i=0;i<L.length;i++){var m=L[i];if(!m.size)continue;try{var n=m.fname||('doc_'+i);if(used[n]){n=n.replace(/(\.\w+)?$/,'_'+(++used[n])+'$1')}else used[n]=1;z.file(n,await file(m.id))}catch(e){}}
 z.file('reestr.csv',csvText(L));A.saveBlob(await z.generateAsync({type:'blob'}),base(g)+'_arhiv_'+stamp()+'.zip')}
function bind(){ROOT.addEventListener('input',function(e){if(e.target.id=='daq'){Q=e.target.value;draw()}});
 ROOT.addEventListener('change',function(e){var i=e.target;if(i.id=='daft'){FT=i.value;draw()}else if(i.id=='dafa'){FA=i.value;draw()}else if(i.id=='dasort'){SORT=i.value;draw()}});
 ROOT.addEventListener('toggle',function(e){var d=e.target;if(d.classList&&d.classList.contains('dag')){if(d.open)OPEN[d.dataset.g]=1;else delete OPEN[d.dataset.g]}},true);
 ROOT.addEventListener('click',async function(e){var b=e.target.closest('[data-ar],[data-ark],[data-ardl],[data-ardel]');if(!b)return;var d=b.dataset;
  if(d.ark!=null){FLT=d.ark;draw();return}
  if(d.ardl){var m=META[d.ardl];try{A.saveBlob(new Blob([await file(m.id)],{type:m.type||'application/octet-stream'}),m.fname||'document')}catch(x){MSG=x.message;draw()}return}
  if(d.ardel){var m2=META[d.ardel];if(!confirm(T('del_confirm',{name:(m2.title||m2.fname||'')+(m2.no?' № '+m2.no:'')})))return;await ArbDB.del('archive',m2.id);delete META[m2.id];MSG='';draw();return}
  var a=d.ar,g=d.g!=null?grp(d.g):null;if(a=='up'){UP=d.g||'';if(d.g)OPEN[d.g]=1;MSG='';draw();return}if(a=='upcancel'){UP=null;draw();return}
  if(a=='csv'&&g){csv(g);return}if(a=='xlsx'&&g){await xlsx(g);return}if(a=='zip'&&g){await zipAll(g);return}
  if(a=='upsave'){var f=document.getElementById('daf').files[0];if(!f){document.getElementById('daerr').textContent=T('up_need');return}var dd=document.getElementById('dad').value,now=new Date();
   var iso=dd?new Date(dd+'T'+('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2)+':00').toISOString():now.toISOString(),cid=document.getElementById('dacase').value;
   var id=await add({case:cid,kind:document.getElementById('dak').value,date:iso,no:document.getElementById('dan').value.trim(),title:document.getElementById('dat').value.trim()||f.name,party:document.getElementById('dap').value.trim(),note:document.getElementById('dano').value.trim(),fname:f.name,src:'upload'},new Blob([await f.arrayBuffer()],{type:f.type}),false);
   OPEN[debtorOf(META[id]).key]=1;UP=null;draw();return}})}
function keyFor(cids,name,inn){var G=groups();return (G.find(function(g){return cids.some(function(c){return g.cases[c]})})||G.find(function(g){return inn&&g.inn==inn||name&&nk(g.name)==nk(name)})||{}).key}
function notify(n,err,id){var t=document.getElementById('dartoast');if(!t){t=document.createElement('div');t.id='dartoast';t.setAttribute('role','status');document.body.appendChild(t);
  t.addEventListener('click',function(e){if(!e.target.closest('[data-arto]'))return;t.style.display='none';if(A&&A.showTab)A.showTab('arch');var m=META[t._id];if(m){var c=caseOf(m.case);window.ArbArch.focus(m.case?[m.case]:[],m.debtor||(c&&c.data||{}).ДОЛЖНИК_НАИМЕНОВАНИЕ,m.debtor_inn)}})}
 t._id=id||'';t.className=n?'ok':'err';t.innerHTML=n?E(n>1?T('saved_n',{n:n}):T('saved'))+' <button type="button" data-arto>'+E(T('saved_open'))+'</button>':E(T('save_err'))+(err?': '+E(err):'');t.style.display='block';clearTimeout(t._h);t._h=setTimeout(function(){t.style.display='none'},n?4500:6000)}
window.ArbArch={notify:notify,
 mount:function(el,api){A=api;ROOT=el;bind();draw()},
 unlock:unlock,add:add,draw:draw,enc:function(b){if(!KEY)throw new Error(T('locked'));return enc(b)},dec:function(o){if(!KEY)throw new Error(T('locked'));return dec(o)},
 locked:function(){return !KEY},
 reset:function(){META={};MSG='';UP=null;OPEN={};draw()},
 /* для карточки должника в «Контрагентах»: сколько документов и переход к его группе */
 countFor:function(cids,name,inn){var k=keyFor(cids||[],name,inn);return k?(grp(k)||{items:[]}).items.length:0},
 focus:function(cids,name,inn){var k=keyFor(cids||[],name,inn);Q='';FLT=FT=FA='';if(k)OPEN[k]=1;draw();if(k){var el=document.getElementById('dag_'+k.replace(/[^\w]/g,'_'));if(el)setTimeout(function(){el.scrollIntoView({block:'start'})},60)}},
 /* наибольший автоматически выданный исходящий номер дела — для согласования счётчика */
 maxNo:function(cid){var m=0;all().forEach(function(x){if((x.case||'')==(cid||'')&&x.kind=='out'&&x.auto){var n=n0(x.no);if(n>m)m=n}});return m},
 usedIn:function(cid,a,b,sig){var u=[];all().forEach(function(x){if((x.case||'')==(cid||'')&&x.kind=='out'&&!(sig&&x.batch==sig)){var n=n0(x.no);if(n>=a&&n<=b&&u.indexOf(n)<0)u.push(n)}});return u.sort(function(x,y){return x-y})}
};
})();
