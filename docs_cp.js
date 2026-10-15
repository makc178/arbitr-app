/* Arbitr App · Документы → Контрагенты и загрузка дел/контрагентов из файлов.
   Всё хранится только на этом устройстве (IndexedDB arbitr_local: counterparties, cp_files). Никаких сетевых запросов с данными. */
(function(){
'use strict';
var A,C,CP=[],FM={},V='list',ED=null,MAP=null,FLT='',KF='',Q='',ONLY=false,MSG='',ROOT=null,PEND=[],LIM=100;
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function K(){return (A.C().counterparties)||{}}
function U(k,o){var s=(K().ui||{})[k]||k;if(o)Object.keys(o).forEach(function(n){s=s.split('{'+n+'}').join(o[n])});return s}
function norm(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9/]+/g,' ').trim()}
function digits(s){return String(s||'').replace(/\D/g,'')}
function innOK(s){var d=digits(s).split('').map(Number),c=function(w){return w.reduce(function(a,x,i){return a+x*d[i]},0)%11%10};
 if(d.length==10)return c([2,4,10,3,5,9,4,6,8])==d[9];if(d.length==12)return c([7,2,4,10,3,5,9,4,6,8])==d[10]&&c([3,7,2,4,10,3,5,9,4,6,8])==d[11];return false}
async function load(){if(!window.ArbDB)return;try{CP=await ArbDB.all('counterparties');var fs=await ArbDB.all('cp_files');FM={};fs.forEach(function(f){FM[f.id]={id:f.id,name:f.name,size:f.size,type:f.type}})}catch(e){CP=[]}draw()}
function save1(c){c.updated=Date.now();if(!CP.some(function(x){return x.id==c.id}))CP.push(c);return ArbDB.put('counterparties',c)}
function caseOf(id){return A.S().cases.find(function(c){return c.id==id})}
function kinds(){return K().kinds||{}}function roles(){return K().roles||{}}
function guessKind(c){var n=norm(c.name);if(/банк/.test(n)&&(c.bik||/банк/.test(n)))return 'bank';if(/инспекц|ифнс|фнс|росреестр|управлени|министерств|служб|фонд|гибдд|мвд|загс/.test(n))return 'gov';if(/^ип\b|индивидуальн/.test(n)||digits(c.inn).length==12&&digits(c.ogrn).length==15)return 'ip';if(digits(c.inn).length==12)return 'fl';return 'ul'}
/* ---------- список ---------- */
function visible(){var q=norm(Q),cur=A.S().cur;return CP.filter(function(c){if(FLT&&(c.roles||[]).indexOf(FLT)<0)return false;if(KF&&c.kind!=KF)return false;if(ONLY&&cur&&(c.cases||[]).indexOf(cur)<0)return false;
 if(q){var h=norm([c.name,c.inn,c.bik,c.ogrn,c.kpp,c.addr_legal,c.addr_post,c.head,c.email,c.phone,c.note].join(' '));if(h.indexOf(q)<0&&digits(Q)&&digits([c.inn,c.bik,c.ks,c.ogrn,c.phone].join(' ')).indexOf(digits(Q))<0)return false;if(h.indexOf(q)<0&&!digits(Q))return false}return true}).sort(function(a,b){return String(a.name).localeCompare(String(b.name),'ru')})}
function archLink(c){if(!window.ArbArch||ArbArch.locked()||(c.roles||[]).indexOf('debtor_main')<0)return '';var n=ArbArch.countFor(c.cases||[],c.name,c.inn);return '<button type="button" class="lbtn sec darl" data-cparch="'+E(c.id)+'">'+E(U('arch_link',{n:n}))+'</button>'}
function MU(k,o){var x=((A.C().manager||{}).ui||{})[k]||k;if(o)Object.keys(o).forEach(function(n){x=x.split('{'+n+'}').join(o[n])});return x}
function mgrBlock(){var M=A.MGR?A.MGR():[],q=norm(Q);if(KF&&KF!='au')return '';if(FLT)return '';M=M.filter(function(m){return !q||norm([m.f.ФИО_УПРАВЛЯЮЩЕГО,m.f.ИНН_УПРАВЛЯЮЩЕГО,m.f.СРО,m.f.РЕГ_НОМЕР_АУ].join(' ')).indexOf(q)>=0});
 return '<h4 class="dsh">'+E(kinds().au||MU('kind'))+' <span class="sm">'+M.length+'</span></h4>'+(A.encOK&&!A.encOK()?'<p class="sm ewarn">'+E(MU('locked'))+'</p>':'')+M.map(function(m){var f=m.f,todo=Object.keys(f).some(function(k){return String(f[k]||'').indexOf('[__]')>=0});return '<div class="lot dit dcp dmgc" data-mgid="'+E(m.id)+'" role="button" tabindex="0"><div class="d1">'+E(A.mgrName(m))+'</div><div class="sm">'+E([f.ИНН_УПРАВЛЯЮЩЕГО?'ИНН '+f.ИНН_УПРАВЛЯЮЩЕГО:'',f.РЕГ_НОМЕР_АУ?'рег. № '+f.РЕГ_НОМЕР_АУ:'',f.СРО||''].filter(Boolean).join(' · '))+'</div><div class="sm dkind">'+E(MU('assets',{l:m.lh.length,s:m.sig.length}))+'</div>'+(todo?((A.C().manager||{}).todo_blocking===false?'<div class="sm">'+E(MU('addr_todo_hint'))+'</div>':'<div class="sm ewarn">'+E(MU('addr_todo'))+'</div>'):'')+'</div>'}).join('')+
  (A.encOK&&A.encOK()?'<p><button type="button" class="lbtn sec" data-cp="mgnew">'+E(MU('add'))+'</button></p>':'')+(KF=='au'?'':'<h4 class="dsh">'+E(U('others'))+'</h4>')}
function vList(){var R=roles(),vs=visible(),cur=A.S().cur;
 var h='<p class="sm">'+E(K().help||'')+'</p><div class="dact dcpbar"><button type="button" class="lbtn" data-cp="new">'+E(U('add'))+'</button><label class="lbtn sec dfile">'+E(U('import'))+'<input type="file" id="dcpup" accept=".csv,.xlsx,.json,.vcf,.pdf,.docx,.txt,text/csv,application/json,text/vcard" multiple hidden></label>'+((window.ARB_DIR||{}).banks?'<button type="button" class="lbtn sec" data-cp="banks">'+E(U('banks_dir'))+'</button>':'')+((window.ARB_DIR||{}).addressees?'<button type="button" class="lbtn sec" data-cp="adir">'+E(AU_('title'))+'</button>':'')+'<label class="lbtn sec dfile">'+E(U('bik_import'))+'<input type="file" id="dcpbik" accept=".xml,.zip,.csv,text/xml,application/zip,text/csv" hidden></label>'+
  (CP.length?'<button type="button" class="lbtn sec" data-cp="exj">'+E(U('export_json'))+'</button><button type="button" class="lbtn sec" data-cp="exc">'+E(U('export_csv'))+'</button>':'')+'</div><p class="sm">'+E(U('import_help'))+'</p><p class="sm">'+E(U('bik_help'))+'</p>'+(MSG?'<p class="sm dok" id="dcpmsg">'+E(MSG)+'</p>':'');
 var MB=mgrBlock();if(CP.length||MB){h+='<div class="pflt dflt"><input type="search" id="dcpq" placeholder="'+E(U('search'))+'" value="'+E(Q)+'"></div><div class="dchips"><button type="button" class="pchip'+(FLT?'':' on')+'" data-cpr="">'+E(U('all'))+'</button>'+Object.keys(R).filter(function(r){return CP.some(function(c){return (c.roles||[]).indexOf(r)>=0})}).map(function(r){return '<button type="button" class="pchip'+(FLT==r?' on':'')+'" data-cpr="'+E(r)+'">'+E(R[r])+'</button>'}).join('')+'</div>'+
  (function(){var nm=A.MGR?A.MGR().length:0,ks=Object.keys(kinds()).filter(function(k){return k=='au'?nm>0:CP.some(function(c){return c.kind==k})});return ks.length>1?'<div class="dchips"><button type="button" class="pchip'+(KF?'':' on')+'" data-cpk="">'+E(U('kinds_all'))+'</button>'+ks.map(function(k){var n=k=='au'?nm:CP.filter(function(c){return c.kind==k}).length;return '<button type="button" class="pchip'+(KF==k?' on':'')+'" data-cpk="'+k+'">'+E((K().kinds_short||{})[k]||kinds()[k])+' <b>'+n+'</b></button>'}).join('')+'</div>':''})()+
  (cur?'<label class="dchk"><input type="checkbox" id="dcponly"'+(ONLY?' checked':'')+'> '+E(U('this_case'))+'</label>':'');
  h+=MB;if(KF=='au')return h;var all=vs.length;vs=vs.slice(0,LIM);h+=all>LIM||all>20?'<p class="sm">'+E(U('shown',{a:vs.length,b:all}))+'</p>':'';h+=vs.length?vs.map(function(c){var rs=(c.roles||[]).map(function(r){return R[r]||r}).join(', ');return '<div class="lot dit dcp" data-cpid="'+E(c.id)+'" role="button" tabindex="0"><div class="d1">'+E(c.name||'—')+'</div><div class="sm">'+E([(kinds()[c.kind]||''),c.kind=='bank'&&c.bik?'БИК '+c.bik:'',c.inn?'ИНН '+c.inn:'',rs].filter(Boolean).join(' · '))+'</div><div class="sm dkind">'+E([U('n_cases',{n:(c.cases||[]).length}),(c.files||[]).length?U('n_files',{n:c.files.length}):''].filter(Boolean).join(' · '))+'</div>'+archLink(c)+'</div>'}).join('')+(all>LIM?'<button type="button" class="lbtn sec" data-cp="more">'+E(U('more',{n:Math.min(100,all-LIM)}))+'</button>':''):'<div class="empty">'+E(U('nothing'))+'</div>'}
 else h+='<div class="empty">'+E(U('empty'))+'</div>';
 return h}
/* ---------- карточка ---------- */
function vEdit(){var c=ED,R=roles(),KD=kinds(),L=K().inn_lookup||{},cs=A.S().cases;
 var h='<h4 class="dsh">'+E(c._new?U('new'):U('edit'))+'</h4>'+(c._extract?'<p class="sm dok">'+E(U('extract_title',{name:c._extract}))+'</p><p class="sm">'+E(c._found?U('extract_help'):U('extract_none'))+'</p>':'')+
 '<div class="g2"><div><label for="dcp_kind">'+E(U('kind'))+'</label><select id="dcp_kind" data-cf="kind">'+Object.keys(KD).filter(function(k){return k!='au'}).map(function(k){return '<option value="'+k+'"'+(c.kind==k?' selected':'')+'>'+E(KD[k])+'</option>'}).join('')+'</select></div>'+
 '<div><label>&nbsp;</label><button type="button" class="lbtn sec dinn" disabled aria-disabled="true" title="'+E(L.note||'')+'">'+E(L.label||'')+'</button><div class="sm dhint">'+E(L.note||'')+'</div></div>'+
 (K().fields||[]).map(function(f){var id='dcp_'+f.k,v=c[f.k]||'',bad=f.k=='inn'&&v&&!innOK(v);return '<div'+(f.wide?' class="dwide"':'')+(f.req&&!v?' data-w="1" class="'+(f.wide?'dwide ':'')+'dempty"':'')+'><label for="'+id+'">'+E(f.label)+'</label>'+(f.type=='textarea'?'<textarea id="'+id+'" data-cf="'+f.k+'" rows="3">'+E(v)+'</textarea>':'<input id="'+id+'" data-cf="'+f.k+'" value="'+E(v)+'" autocomplete="off"'+(f.type=='inn'?' inputmode="numeric"':f.type=='tel'?' type="tel"':f.type=='email'?' type="email"':'')+'>')+(bad?'<div class="sm ewarn">ИНН не прошёл проверку контрольной суммы</div>':'')+'</div>'}).join('')+'</div>'+
 '<h4 class="dsh">'+E(U('roles'))+'</h4><div class="dchks">'+Object.keys(R).map(function(r){return '<label class="dchk"><input type="checkbox" data-crole="'+r+'"'+((c.roles||[]).indexOf(r)>=0?' checked':'')+'> '+E(R[r])+'</label>'}).join('')+'</div>'+
 '<h4 class="dsh">'+E(U('cases'))+'</h4>'+(cs.length?'<div class="dchks">'+cs.map(function(x){return '<label class="dchk"><input type="checkbox" data-ccase="'+E(x.id)+'"'+((c.cases||[]).indexOf(x.id)>=0?' checked':'')+'> '+E(A.caseName(x))+'</label>'}).join('')+'</div>':'<p class="sm">'+E(U('no_cases'))+'</p>')+
 '<h4 class="dsh">'+E(U('files'))+'</h4>'+((c.files||[]).map(function(id){var f=FM[id]||{name:'?'};return '<div class="dlhit"><span>'+E(f.name)+' <span class="sm">'+Math.round((f.size||0)/1024)+' КБ</span></span><span><button type="button" class="lbtn sec" data-cpfget="'+E(id)+'">Скачать</button> <button type="button" class="lbtn sec" data-cpfdel="'+E(id)+'">'+E(U('delete'))+'</button></span></div>'}).join('')+PEND.map(function(f){return '<div class="dlhit"><span>'+E(f.name)+' <span class="sm">будет прикреплён</span></span></div>'}).join(''))+
 '<label class="lbtn sec dfile">'+E(U('attach'))+'<input type="file" id="dcpatt" multiple hidden></label>'+
 '<div class="dact"><button type="button" class="lbtn" data-cp="save">'+E(U('save'))+'</button><button type="button" class="lbtn sec" data-cp="cancel">'+E(U('cancel'))+'</button>'+(c._new?'':'<button type="button" class="lbtn sec adred" data-cp="del">'+E(U('delete'))+'</button>')+'</div><p class="sm ewarn" id="dcperr"></p>';
 return h}
/* ---------- сопоставление колонок ---------- */
function targets(){if(MAP.kind=='case'){var F=A.F();return (A.C().case_order||[]).map(function(k){return [k,(F[k]||{}).label||k]})}
 var t=(K().fields||[]).map(function(f){return [f.k,f.label]});t.push(['role','Роль'],['case','Номер дела (привязка)'],['amount','Сумма (в заметки)']);return t}
function guessMap(hd){var syn=MAP.kind=='case'?K().case_columns||{}:K().columns||{},used={};return hd.map(function(h){var n=norm(h),best='';Object.keys(syn).forEach(function(k){if(best||used[k])return;if(syn[k].some(function(s){return norm(s)==n}))best=k});
 if(!best)Object.keys(syn).forEach(function(k){if(best||used[k])return;if(syn[k].some(function(s){var a=norm(s);return a.length>2&&n.indexOf(a)>=0}))best=k});if(best)used[best]=1;return best})}
function vMap(){var T=targets(),hd=MAP.head,rows=MAP.rows,R=roles(),cur=A.S().cur;
 var h='<h4 class="dsh">'+E(MAP.kind=='case'?U('case_map_title'):U('map_title'))+' · '+E(MAP.name)+'</h4><p class="sm">'+E(U('map_help'))+' '+E(U('map_rows',{n:rows.length}))+'</p><div class="dmap">'+
 hd.map(function(x,i){var ex=rows.slice(0,3).map(function(r){return r[i]}).filter(Boolean).join(' · ');return '<div class="dmaprow"><div><b>'+E(x||('Колонка '+(i+1)))+'</b><div class="sm">'+E(ex.slice(0,90))+'</div></div><select data-map="'+i+'" aria-label="'+E(x)+'"><option value="">'+E(U('map_skip'))+'</option>'+T.map(function(t){return '<option value="'+t[0]+'"'+(MAP.map[i]==t[0]?' selected':'')+'>'+E(t[1])+'</option>'}).join('')+'</select></div>'}).join('')+'</div>';
 if(MAP.kind!='case')h+='<div class="g2"><div><label for="dcpmrole">'+E(U('map_role'))+'</label><select id="dcpmrole"><option value="">—</option>'+Object.keys(R).map(function(r){return '<option value="'+r+'"'+(MAP.role==r?' selected':'')+'>'+E(R[r])+'</option>'}).join('')+'</select></div>'+(cur?'<div><label>&nbsp;</label><label class="dchk"><input type="checkbox" id="dcpmlink"'+(MAP.link?' checked':'')+'> '+E(U('map_link'))+'</label></div>':'')+'</div><p class="sm">'+E(U('dup_merge'))+'</p>';
 h+='<div class="dact"><button type="button" class="lbtn" data-cp="mapgo">'+E(U('map_go',{n:rows.length}))+'</button><button type="button" class="lbtn sec" data-cp="cancel">'+E(U('cancel'))+'</button></div>';return h}
function draw(){if(!ROOT)return;if(V=='mgr')return;ROOT.innerHTML=V=='edit'?vEdit():V=='map'?vMap():V=='adir'?vDir():V=='deb'?vDeb():V=='dadd'?vDAdd():vSections();var c=$c('dcpcount');}
function $c(i){return document.getElementById(i)}
function rerenderKeepFocus(){var a=document.activeElement,id=a&&a.id,p=a&&a.selectionStart;draw();if(id&&$c(id)){$c(id).focus();try{$c(id).setSelectionRange(p,p)}catch(e){}}}
/* ---------- разбор файлов ---------- */
function dec(buf){var u=new TextDecoder('utf-8').decode(buf);if(u.indexOf('\uFFFD')>=0){try{return new TextDecoder('windows-1251').decode(buf)}catch(e){}}return u.replace(/^\uFEFF/,'')}
function csv(t){var first=t.split(/\r?\n/)[0]||'',d=[';','\t',','].sort(function(a,b){return first.split(b).length-first.split(a).length})[0],rows=[],r=[],f='',q=false;
 for(var i=0;i<t.length;i++){var ch=t[i];if(q){if(ch=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=ch}else if(ch=='"')q=true;else if(ch==d){r.push(f);f=''}else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(f);rows.push(r);r=[];f=''}else f+=ch}
 if(f||r.length){r.push(f);rows.push(r)}return rows.filter(function(r){return r.some(function(x){return String(x).trim()})}).map(function(r){return r.map(function(x){return String(x).trim()})})}
async function xlsx(buf){var z=await JSZip.loadAsync(buf),P=new DOMParser(),rd=async function(n){var f=z.file(n);return f?P.parseFromString(await f.async('string'),'application/xml'):null};
 var ss=[],sd=await rd('xl/sharedStrings.xml');if(sd)[].forEach.call(sd.getElementsByTagName('si'),function(si){ss.push([].map.call(si.getElementsByTagName('t'),function(t){return t.textContent}).join(''))});
 var wb=await rd('xl/workbook.xml'),rels=await rd('xl/_rels/workbook.xml.rels'),sh=wb.getElementsByTagName('sheet')[0],rid=sh&&(sh.getAttribute('r:id')||sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')),tg='worksheets/sheet1.xml';
 if(rels&&rid)[].forEach.call(rels.getElementsByTagName('Relationship'),function(r){if(r.getAttribute('Id')==rid)tg=r.getAttribute('Target')});tg=tg.replace(/^\/?xl\//,'').replace(/^\//,'');
 var ws=await rd('xl/'+tg),out=[];if(!ws)throw new Error('лист не найден');
 var col=function(ref){var s=(ref.match(/^[A-Z]+/)||['A'])[0],n=0;for(var i=0;i<s.length;i++)n=n*26+s.charCodeAt(i)-64;return n-1};
 [].forEach.call(ws.getElementsByTagName('row'),function(rw){var r=[];[].forEach.call(rw.getElementsByTagName('c'),function(c){var t=c.getAttribute('t'),v=c.getElementsByTagName('v')[0],x=v?v.textContent:'';if(t=='s')x=ss[+x]||'';else if(t=='inlineStr')x=[].map.call(c.getElementsByTagName('t'),function(e){return e.textContent}).join('');else if(t!='str'&&/^\d+\.?\d*E\+\d+$/i.test(x))x=String(Number(x));r[col(c.getAttribute('r')||'A')]=String(x).trim()});for(var i=0;i<r.length;i++)if(r[i]==null)r[i]='';out.push(r)});
 return out.filter(function(r){return r.some(Boolean)})}
function vcf(t){t=t.replace(/\r?\n[ \t]/g,'');return t.split(/BEGIN:VCARD/i).slice(1).map(function(b){var c={roles:[],cases:[]},tel=[],em=[];b.split(/\r?\n/).forEach(function(l){var m=l.match(/^([^:;]+)((?:;[^:]*)?):(.*)$/);if(!m)return;var k=m[1].toUpperCase().replace(/^ITEM\d+\./,''),v=m[3].replace(/\\n/gi,'\n').replace(/\\([,;\\])/g,'$1');
  if(/QUOTED-PRINTABLE/i.test(m[2])){try{v=new TextDecoder(/CHARSET=WINDOWS-1251/i.test(m[2])?'windows-1251':'utf-8').decode(new Uint8Array((v.match(/=[0-9A-F]{2}|[^=]/gi)||[]).map(function(x){return x[0]=='='?parseInt(x.slice(1),16):x.charCodeAt(0)})))}catch(e){}}
  if(k=='FN')c.name=c.name||v;else if(k=='ORG'){c.org=v.split(';')[0]}else if(k=='TEL')tel.push(v);else if(k=='EMAIL')em.push(v);else if(k=='ADR')c.addr_post=v.split(';').filter(Boolean).join(', ');else if(k=='NOTE')c.note=v;else if(k=='TITLE')c.title=v});
  if(c.org){c.head=c.name&&c.name!=c.org?c.name+(c.title?' ('+c.title+')':''):'';c.name=c.org}delete c.org;delete c.title;c.phone=tel.join(', ');c.email=em.join(', ');return c}).filter(function(c){return c.name})}
async function pdfText(buf){var lib=await import(new URL('vendor/pdf.min.mjs',location.href).href);lib.GlobalWorkerOptions.workerSrc=new URL('vendor/pdf.worker.min.mjs',location.href).href;
 var d=await lib.getDocument({data:new Uint8Array(buf.slice(0)),isEvalSupported:false}).promise,out=[];for(var p=1;p<=Math.min(d.numPages,20);p++){var tc=await (await d.getPage(p)).getTextContent();out.push(lines(tc.items))}return out.join('\n')}
/* pdf.js отдаёт куски текста в порядке шрифтов, а не чтения: собираем строки по координатам */
function lines(items){var ch=[];items.forEach(function(i){var t=i.str||'';if(!t)return;var x=i.transform[4],y=i.transform[5],w=i.width||0,h=Math.abs(i.transform[3])||10,n=t.length,cw=w/n;for(var k=0;k<n;k++)if(!/\s/.test(t[k]))ch.push({c:t[k],x:x+cw*(k+.5),y:y,h:h,cw:cw})});
 ch.sort(function(a,b){return b.y-a.y});var L=[];ch.forEach(function(c){var l=L[L.length-1];if(l&&Math.abs(l.y-c.y)<=Math.max(2,c.h*.45))l.a.push(c);else L.push({y:c.y,a:[c]})});
 return L.map(function(l){l.a.sort(function(a,b){return a.x-b.x});var s='',p=null;l.a.forEach(function(c){if(p&&c.x-p.x>(p.cw+c.cw)/2*1.45)s+=' ';s+=c.c;p=c});return s}).join('\n')}
async function docxText(buf){var z=await JSZip.loadAsync(buf),x=await z.file('word/document.xml').async('string');return x.replace(/<w:tab\/>/g,'\t').replace(/<w:br\/>/g,'\n').replace(/<\/w:p>/g,'\n').replace(/<\/w:tc>/g,'\t').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&')}
/* реквизиты из текста */
function extract(t){t=t.replace(/\u00a0/g,' ');var c={roles:[],cases:[]},m,one=function(re,k,g){if(!c[k]&&(m=t.match(re)))c[k]=(m[g||1]||'').replace(/\s+/g,' ').trim().replace(/[;,.]$/,'')};
 if((m=t.match(/ИНН\s*\/\s*КПП\s*[:№]?\s*(\d{10}|\d{12})\s*\/\s*(\d{9})/i))){c.inn=m[1];c.kpp=m[2]}
 one(/ИНН\s*(?:получателя|организации|должника|контрагента)?\s*[:№]?\s*(\d{12}|\d{10})(?!\d)/i,'inn');one(/КПП\s*[:№]?\s*(\d{9})(?!\d)/i,'kpp');one(/ОГРН(?:ИП)?\s*[:№]?\s*(\d{15}|\d{13})(?!\d)/i,'ogrn');
 one(/БИК\s*[:№]?\s*(\d{9})(?!\d)/i,'bik');one(/(?:р\/с|р\.\s?с\.|р\/сч|расч[её]тный\s+сч[её]т)\s*[:№]?\s*(\d{20})/i,'rs');one(/(?:к\/с|к\.\s?с\.|кор(?:р)?\.?\s*сч[её]т|корреспондентский\s+сч[её]т)\s*[:№]?\s*(\d{20})/i,'ks');
 one(/((?:ООО|АО|ПАО|ЗАО|ОАО|НАО|ФГУП|МУП|ГУП|АНО|НКО|ТСЖ|СНТ|КБ|АКБ)\s*[«"„][^»"“\n]{2,90}[»"“](?:\s*\([^)\n]{2,40}\))?)/,'name');
 one(/((?:Общество с ограниченной ответственностью|Акционерное общество|Публичное акционерное общество)\s*[«"„][^»"“\n]{2,90}[»"“])/i,'name');
 one(/((?:Индивидуальный предприниматель|ИП)\s+[А-ЯЁ][а-яё\-]+\s+[А-ЯЁ](?:[а-яё]+|\.)\s*[А-ЯЁ]?(?:[а-яё]+|\.)?)/,'name');
 one(/(?:Наименование(?:\s+организации)?|Полное наименование|Получатель|Контрагент)\s*[:]\s*([^\n\t]{3,120})/i,'name');
 one(/(?:Юридический адрес|Адрес(?:\s+места)?\s+нахождения|Место\s?нахождения|Адрес регистрации|Юр\.\s*адрес)\s*[:]?\s*([^\n\t]{8,200})/i,'addr_legal');
 one(/(?:Почтовый адрес|Фактический адрес|Адрес для корреспонденции)\s*[:]?\s*([^\n\t]{8,200})/i,'addr_post');
 one(/(?:^|\n)\s*Адрес\s*[:]\s*([^\n\t]{8,200})/i,'addr_legal');one(/(\b\d{6},\s*[^\n\t]{10,160})/,'addr_legal');
 one(/(?:Банк(?:\s+получателя)?|Наименование банка)\s*[:]\s*([^\n\t]{3,120})/i,'bank_name');if(!c.bank_name&&c.bik)one(/(?:в\s+)((?:ПАО|АО|ООО|АКБ|КБ)?\s*[«"]?[^\n\t,«»"]{0,40}Банк[^\n\t,]{0,60})/i,'bank_name');
 one(/(?:Генеральный директор|Директор|Руководитель|Председатель правления|Президент)\s*[:\-–]?\s*([А-ЯЁ][а-яё\-]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+|[А-ЯЁ][а-яё\-]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.|[А-ЯЁ]\.\s?[А-ЯЁ]\.\s?[А-ЯЁ][а-яё\-]+)/,'head');
 one(/Тел(?:ефон|\.)?(?:\/факс)?\s*[:.]?\s*(\+?[\d][\d\s\-()]{8,18}\d)/i,'phone');one(/(?:^|[^\d])((?:\+7|8)[\s\-(]*\d{3}[\s\-)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2})(?!\d)/,'phone');one(/([\w.+\-]+@[\w\-]+(?:\.[\w\-]+)+)/,'email');
 Object.keys(c).forEach(function(k){if(typeof c[k]=='string'&&/name|addr|head/.test(k))c[k]=c[k].replace(/(^|[\s,])([а-яё])\.([а-яё]{1,3})(?=[\s,]|$)/g,'$1$2$3.').replace(/\s+([,.;:»])/g,'$1').replace(/,(?=[^\d\s])/g,', ').replace(/(^|\s)(ООО|АО|ПАО|ЗАО|ОАО|НАО|ИП|АКБ|КБ)«/g,'$1$2 «').replace(/\s{2,}/g,' ').trim()});if(c.bank_name&&c.name&&c.bank_name==c.name)delete c.bank_name;var found=Object.keys(c).filter(function(k){return typeof c[k]=='string'}).length;c.kind=guessKind(c);if(c.kind=='bank')c.roles=['bank'];c._found=found;return c}
/* ---------- импорт ---------- */
function blank(){return {id:ArbDB.uid('cp'),kind:'ul',roles:[],cases:[],files:[],created:Date.now()}}
async function upsert(src){var x=findDup(src),nw=!x;
 x=x||blank();Object.keys(src).forEach(function(k){if(k=='id'||k=='files'||k.charAt(0)=='_')return;var v=src[k];if(k=='roles'||k=='cases'){x[k]=(x[k]||[]).concat((v||[]).filter(function(r){return (x[k]||[]).indexOf(r)<0}));return}if(v!=null&&v!==''&&!x[k])x[k]=v;else if(k=='note'&&v&&x.note&&x.note.indexOf(v)<0)x.note+='\n'+v});
 if(nw&&!src.kind)x.kind=guessKind(x);await save1(x);return nw}
function findDup(src){var b=digits(src.bik),inn=digits(src.inn);if(b&&(src.kind=='bank'||!src.kind)){var y=CP.find(function(c){return c.kind=='bank'&&digits(c.bik)==b});if(y)return y}
 if(inn){var z=CP.find(function(c){return digits(c.inn)==inn&&(!b||c.kind!='bank'||!c.bik||digits(c.bik)==b)});if(z)return z}if(b)return null;return CP.find(function(c){return norm(c.name)&&norm(c.name)==norm(src.name)})||null}
/* ---------- реестр банков: ED807 (XML/ZIP) или CSV ---------- */
function xmlDec(buf){var head=new TextDecoder('ascii').decode(new Uint8Array(buf.slice(0,200))),m=head.match(/encoding=["']([\w\-]+)["']/i);try{return new TextDecoder(m?m[1].toLowerCase():'utf-8').decode(buf)}catch(e){return dec(buf)}}
function ed807(txt){var d=new DOMParser().parseFromString(txt,'application/xml');if(d.getElementsByTagName('parsererror').length)throw new Error('XML');var es=d.getElementsByTagNameNS('*','BICDirectoryEntry'),out=[];
 for(var i=0;i<es.length;i++){var e=es[i],p=e.getElementsByTagNameNS('*','ParticipantInfo')[0];if(!p)continue;var g=function(a){return (p.getAttribute(a)||'').trim()},ks='';
  [].forEach.call(e.getElementsByTagNameNS('*','Accounts'),function(a){if(!ks&&/CRSA|CBRA/.test(a.getAttribute('RegulationAccountType')||''))ks=a.getAttribute('Account')||''});
  var adr=[g('Ind'),[g('Tnp'),g('Nnp')].filter(Boolean).join(' '),g('Adr')].filter(Boolean).join(', ');
  out.push({kind:'bank',name:g('NameP'),bik:e.getAttribute('BIC')||'',ks:ks,addr_legal:adr,inn:g('INN')||'',note:g('RegN')?'Рег. № '+g('RegN'):'',src:'cbr'})}
 return out.filter(function(c){return c.name&&/^\d{9}$/.test(c.bik)})}
function bikCsv(rows){var h=rows[0].map(norm),f=function(re){return h.findIndex(function(x){return re.test(x)})},ib=f(/^(бик|bik|bic)$/),iname=f(/^(наименование|name|название|namep|банк|полное наименование)$/);
 if(ib<0)return null;if(iname<0)iname=f(/наимен|name/);if(iname<0)return null;var iks=f(/^(кс|к с|ks|корр|корр счет|корреспондентский счет|account)$|корр/),ia=f(/адрес|address|adr/),ic=f(/^(город|city|nnp)$/),ii=f(/^(индекс|index|ind)$/),iinn=f(/^(инн|inn)$/);
 return rows.slice(1).map(function(r){var a=[ii>=0?r[ii]:'',ic>=0?r[ic]:'',ia>=0?r[ia]:''].filter(Boolean).join(', ');return {kind:'bank',name:r[iname]||'',bik:(r[ib]||'').replace(/\D/g,'').padStart(9,'0'),ks:iks>=0?(r[iks]||'').replace(/\D/g,''):'',addr_legal:a,inn:iinn>=0?(r[iinn]||'').replace(/\D/g,''):'',src:'cbr'}}).filter(function(c){return c.name&&/^\d{9}$/.test(c.bik)})}
async function importBik(f){var nm=f.name,buf=await f.arrayBuffer(),ext=(nm.match(/\.(\w+)$/)||['',''])[1].toLowerCase(),L=null;MSG=U('bik_loading');draw();
 try{if(ext=='zip'){var z=await JSZip.loadAsync(buf),xf=Object.keys(z.files).filter(function(n){return /\.xml$/i.test(n)})[0];if(!xf)throw 0;L=ed807(xmlDec(await z.file(xf).async('arraybuffer')))}
  else if(ext=='xml')L=ed807(xmlDec(buf));else L=bikCsv(csv(dec(buf)))}catch(e){L=null}
 if(!L||!L.length){MSG=U('bik_bad',{name:nm});draw();return}
 var byB={},byI={},n=0,u=0,ch=[];CP.forEach(function(c){if(c.kind=='bank'&&c.bik)byB[digits(c.bik)]=c;if(c.inn)byI[digits(c.inn)]=c});
 L.forEach(function(s){var x=byB[s.bik]||(s.inn&&byI[s.inn]&&(!byI[s.inn].bik||byI[s.inn].kind!='bank')?byI[s.inn]:null);
  if(x){var mod=false;['name','ks','addr_legal','inn','note'].forEach(function(k){if(s[k]&&!x[k]){x[k]=s[k];mod=true}});if(!x.bik){x.bik=s.bik;mod=true}if(x.kind!='bank'){x.kind='bank';mod=true}if(mod){x.updated=Date.now();ch.push(x)}u++}
  else{x=Object.assign(blank(),s);x.kind='bank';CP.push(x);byB[s.bik]=x;if(s.inn)byI[s.inn]=x;ch.push(x);n++}});
 for(var i=0;i<ch.length;i+=500)await ArbDB.putMany('counterparties',ch.slice(i,i+500));
 MSG=U('bik_done',{n:n,u:u,t:CP.filter(function(c){return c.kind=='bank'}).length});KF='bank';LIM=100;V='list';draw();A.refresh()}
/* ---------- встроенные публичные справочники (bank_data/*.js), подгружаются лениво ---------- */
var DIRP={};
function dirLoad(n){var P=(window.ARB_DIR||{})[n];if(!P)return Promise.resolve(null);if(DIRP[n])return DIRP[n];
 DIRP[n]=new Promise(function(res){var sc=document.createElement('script');sc.src=P;sc.onload=function(){res(window[{banks:'ARBITR_BANKS',banks_branches:'ARBITR_BANK_BRANCHES',addressees:'ARBITR_ADDRESSEES',addressees_ifns:'ARBITR_ADDRESSEES_IFNS',addressees_securities:'ARBITR_ADDRESSEES_SEC'}[n]||'ARBITR_ADDRESSEES_EXTRA'])};sc.onerror=function(){DIRP[n]=null;res(null)};document.head.appendChild(sc)});return DIRP[n]}

/* ---- справочник адресатов (органы): только чтение, ленивая загрузка ---- */
function ACF(){return A.C().addressees||{}}
function AU_(k){return (ACF().ui||{})[k]||k}
var ADP=null,AD=null,ADT='',ADR='',ADQ='',ADL=60;
function addrLoad(){if(ADP)return ADP;var ks=Object.keys(window.ARB_DIR||{}).filter(function(k){return k.indexOf('addressees')==0});if(!ks.length)return Promise.resolve(null);
 ADP=Promise.all(ks.map(function(k){return dirLoad(k)})).then(function(){var M=window.ARBITR_ADDRESSEES;if(!M||!M.orgs){ADP=null;return null}var o=M.orgs.slice(),seen={};
  [window.ARBITR_ADDRESSEES_IFNS,window.ARBITR_ADDRESSEES_SEC].forEach(function(x){if(x&&x.orgs)o=o.concat(x.orgs)});if(Array.isArray(window.ARBITR_ADDRESSEES_EXTRA))o=o.concat(window.ARBITR_ADDRESSEES_EXTRA);
  o=o.filter(function(x){var k=x.type+'|'+norm(x.name)+'|'+norm(x.address);if(seen[k])return false;seen[k]=1;return true});
  var T=(M.types||[]).slice();o.forEach(function(x){if(!T.some(function(t){return t.id==x.type}))T.push({id:x.type,label:x.type,template_field:''})});
  AD={types:T,orgs:o,version:M.version||'',date:M.source_date||''};return AD});return ADP}
var RSTOP={'область':1,'обл':1,'край':1,'республика':1,'республики':1,'республике':1,'области':1,'края':1,'крае':1,'город':1,'г':1,'автономный':1,'автономного':1,'округ':1,'округа':1,'округу':1,'по':1,'и':1,'в':1,'федерального':1,'значения':1,'россия':1,'российская':1,'федерация':1,'ао':1};
function rstems(s){return norm(s).replace(/[^а-яёa-z0-9\- ]+/g,' ').split(/\s+/).filter(function(w){return w.length>2&&!RSTOP[w]&&!/^\d+$/.test(w)}).map(function(w){return w.replace(/-/g,'').slice(0,Math.max(4,Math.min(6,w.length-2)))})}
function regionOf(o){var m=/\sпо\s+(.+)$/i.exec(o.name||'');return [o.region||'',m?m[1]:'',o.type=='court'?(o.name||''):''].join(' ')}
function rmatch(o,st){if(!st.length)return true;var t=norm(regionOf(o)+' '+(o.address||'').split(',').slice(0,2).join(' ')).replace(/-/g,'');return st.some(function(w){return t.indexOf(w)>=0})}
function caseRegion(r){var ps=String(r||'').split(','),i,st;for(i=0;i<ps.length;i++){st=rstems(ps[i]);if(st.length)return st.slice(0,2)}return []}
function dirVal(o,tf){if(tf=='НОМЕР_ИФНС'){var m=/№\s*(.+)$/.exec(o.name||'');return m?m[1].trim():(o.code||o.name)}if(tf=='РЕГИОН'){var m2=/\sпо\s+(.+)$/i.exec(o.name||'');return m2?m2[1].trim():(o.region||'')}return o.name||''}
function orgLine(o){return [[o.index,o.address].filter(Boolean).join(', '),o.email?'e-mail: '+o.email:'',o.phone?'тел. '+o.phone:''].filter(Boolean).join(' · ')}
function tLabel(id){var t=(AD&&AD.types||[]).find(function(x){return x.id==id});return t?t.label:id}
function vDir(){var h='<button type="button" class="lbtn sec" data-cp="back">'+E(AU_('back'))+'</button><h4 class="dsh">'+E(AU_('title'))+'</h4>';
 if(!AD)return h+'<p class="sm">…</p>';
 h+='<p class="sm">'+E(AU_('help')||'')+(AD.date?' '+E(AU_('date')||'Актуальность')+': '+E(AD.date.split('-').reverse().join('.')):'')+'</p>';
 h+='<div class="g2"><div><label for="dadt">'+E(AU_('type')||'Тип')+'</label><select id="dadt"><option value="">'+E(AU_('all_types'))+'</option>'+AD.types.filter(function(t){return AD.orgs.some(function(o){return o.type==t.id})}).map(function(t){return '<option value="'+E(t.id)+'"'+(ADT==t.id?' selected':'')+'>'+E(t.label)+' ('+AD.orgs.filter(function(o){return o.type==t.id}).length+')</option>'}).join('')+'</select></div>'+
  '<div><label for="dadr">'+E(AU_('region'))+'</label><input id="dadr" type="search" value="'+E(ADR)+'" placeholder="'+E(AU_('region_ph')||'напр. Ленинградская')+'"></div></div><div class="pflt dflt" style="margin-top:10px"><input type="search" id="dadq" placeholder="'+E(AU_('search'))+'" value="'+E(ADQ)+'"></div>';
 var st=rstems(ADR),q=norm(ADQ),L=AD.orgs.filter(function(o){return (!ADT||o.type==ADT)&&rmatch(o,st)&&(!q||norm([o.name,o.address,o.code,o.email,o.inn].join(' ')).indexOf(q)>=0)}),all=L.length;L=L.slice(0,ADL);
 h+='<p class="sm">'+E(U('shown',{a:L.length,b:all}))+'</p>';
 h+=L.length?L.map(function(o){var i=AD.orgs.indexOf(o),ex=CP.some(function(c){return c.src=='dir'&&norm(c.name)==norm(o.name)});return '<div class="lot dit dadir"><div class="d1">'+E(o.name)+'</div><div class="sm">'+E(tLabel(o.type)+(o.code?' · код '+o.code:''))+'</div><div class="sm">'+E(orgLine(o))+'</div>'+(o.verify?'<div class="sm ewarn">'+E(AU_('verify')||'Проверьте перед отправкой')+'</div>':'')+'<div class="dact"><button type="button" class="lbtn sec" data-cpads="'+i+'"'+(ex?' disabled':'')+'>'+E(ex?(AU_('saved')||'Уже в контрагентах'):AU_('save_cp'))+'</button></div></div>'}).join('')+(all>ADL?'<button type="button" class="lbtn sec" data-cp="admore">'+E(U('more',{n:Math.min(60,all-ADL)}))+'</button>':''):'<div class="empty">'+E(U('nothing'))+'</div>';
 return h}
function openDir(){V='list';SEC='adir';draw();addrLoad().then(function(){if(V=='adir')draw()})}
async function saveDirOrg(i){var o=AD&&AD.orgs[i];if(!o)return;var x=Object.assign(blank(),{kind:/registrar|depositary/.test(o.type)?'ul':'gov',name:o.name,addr_legal:[o.index,o.address].filter(Boolean).join(', '),phone:o.phone||'',email:o.email||'',inn:o.inn||'',ogrn:o.ogrn||'',note:[tLabel(o.type),o.site||'',o.verify?(AU_('verify')||''):''].filter(Boolean).join('. '),src:'dir',dir_type:o.type,region:(o.okato||[])[0]||''});
 var d=findDup(x);if(d){Object.keys(x).forEach(function(k){if(x[k]&&!d[k]&&k!='id')d[k]=x[k]});await save1(d)}else await save1(x);MSG=AU_('saved_ok')||'Сохранено в контрагенты';draw();A.refresh()}
function dirOrgs(tid,region){var ty=(ACF().directory||{})[tid];if(!ty||ty=='bank'||!(window.ARB_DIR||{}).addressees)return null;if(!AD){addrLoad();return {loading:true}}
 var tp=AD.types.find(function(t){return t.id==ty})||{},L=AD.orgs.map(function(o,i){return {o:o,i:i,k:o.type+'|'+o.name}}).filter(function(x){return x.o.type==ty&&inRegs(x.o)}),st=caseRegion(region),A1=st.length?L.filter(function(x){return rmatch(x.o,st)}):[],A2=L.filter(function(x){return A1.indexOf(x)<0});
 return {ty:ty,label:tp.label||ty,tf:tp.template_field||'',inR:A1,other:A2}}
/* выбор адресата из справочника в форме документа */
function dirPick(tid,host,region,setFn){if(!host)return;var ty=(ACF().directory||{})[tid];if(!ty||ty=='bank'||!(window.ARB_DIR||{}).addressees){host.innerHTML='';return}
 host.innerHTML='<p class="sm">…</p>';addrLoad().then(function(D){if(!D){host.innerHTML='';return}var tp=D.types.find(function(t){return t.id==ty})||{},L=D.orgs.filter(function(o){return o.type==ty||(ty=='ifns'&&o.type=='ufns'&&false)});if(!L.length){host.innerHTML='';return}
  var st=caseRegion(region),A1=L.filter(function(o){return st.length&&rmatch(o,st)}),A2=L.filter(function(o){return A1.indexOf(o)<0});
  var opt=function(o){return '<option value="'+D.orgs.indexOf(o)+'">'+E(o.name)+'</option>'};
  host.innerHTML='<div class="dcrow ddirp"><label for="dfdirsel">'+E(AU_('pick')||'Адресат из справочника')+' · '+E(tp.label||ty)+'</label><select id="dfdirsel"><option value="">—</option>'+(A1.length?'<optgroup label="'+E(AU_('in_region')||'Регион дела')+'">'+A1.map(opt).join('')+'</optgroup>':'')+(A2.length?'<optgroup label="'+E(A1.length?(AU_('other_regions')||'Другие регионы'):(tp.label||ty))+'">'+A2.map(opt).join('')+'</optgroup>':'')+'</select><div class="sm" id="dfdirinfo"></div></div>';
  var sel=host.querySelector('select');sel.addEventListener('change',function(){var o=D.orgs[+sel.value],inf=host.querySelector('#dfdirinfo');if(!o){inf.textContent='';return}var tf=tp.template_field;if(tf)setFn(tf,dirVal(o,tf),o);inf.innerHTML=E(orgLine(o))+(o.verify?' <span class="ewarn">'+E(AU_('verify')||'')+'</span>':'')})})}
var BKV='arbitr_banks_ver',BKP=null;
function ensureBanks(force){if(!(window.ARB_DIR||{}).banks)return Promise.resolve(0);if(BKP&&!force)return BKP;BKP=(async function(){var R3=await Promise.all([dirLoad('banks'),dirLoad('banks_branches')]),D=R3[0];if(!D||!D.banks)return 0;
  var VER=[D.version,(R3[1]||{}).version||''].join('/');
  if(!force&&localStorage.getItem(BKV)==VER&&CP.some(function(c){return c.src=='cbr'}))return 0;
  var ST=D.statuses||{},L=D.banks.map(function(b){return [b,b.kind||'head']}).concat(((R3[1]||{}).branches||[]).map(function(b){return [b,'branch']}));
  var byB={};CP.forEach(function(c){if(c.kind=='bank'&&c.bik)byB[digits(c.bik)]=c});var ch=[];
    L.forEach(function(q){var b=q[0],s={name:b.name,bik:b.bik,ks:b.ks||'',inn:b.inn||'',ogrn:b.ogrn||'',addr_legal:b.legal_address||[b.index,b.city,b.adr].filter(Boolean).join(', '),phone:b.phone||'',email:b.email||'',note:[b.full_name,ST[b.status]||'',q[1]=='branch'&&b.parent_bik?'филиал, БИК головного '+b.parent_bik:''].filter(Boolean).join('. ')},x=byB[digits(b.bik)];
   if(x){Object.keys(s).forEach(function(k){if(s[k]&&!x[k])x[k]=s[k]})}else{x=Object.assign(blank(),s,{kind:'bank',roles:['bank'],src:'cbr'});CP.push(x);byB[digits(b.bik)]=x}
   x.bkind=q[1];x.region=b.region||'';x.rank_assets=b.rank_assets||null;x.assets_rub=b.assets_rub||null;x.rank_date=b.rank_assets?(b.rank_date||D.rank_date||''):'';x.dir_ver=VER;ch.push(x)});
  for(var i=0;i<ch.length;i+=500)await ArbDB.putMany('counterparties',ch.slice(i,i+500));localStorage.setItem(BKV,VER);return ch.length})();return BKP}
function roleOf(s){var n=norm(s),R=roles(),r='';Object.keys(R).forEach(function(k){if(!r&&(norm(R[k])==n||n&&norm(R[k]).indexOf(n)==0||n.indexOf(norm(R[k]).split(' ')[0])==0))r=k});return r}
function caseByNo(s){var n=norm(s);return n?A.S().cases.find(function(c){return norm((c.data||{}).НОМЕР_ДЕЛА)==n}):null}
async function runMap(){var n=0,u=0,cur=A.S().cur;
 if(MAP.kind=='case'){var S=A.S();MAP.rows.forEach(function(r){var d={};MAP.map.forEach(function(k,i){if(k&&r[i])d[k]=r[i]});if(!Object.keys(d).length)return;var ex=d.НОМЕР_ДЕЛА&&caseByNo(d.НОМЕР_ДЕЛА);if(ex){Object.keys(d).forEach(function(k){if(!ex.data[k])ex.data[k]=d[k]});u++}else{S.cases.push({id:'c'+Date.now().toString(36)+n,data:d});n++}});A.save();A.drawCases();MSG=U('cases_imported',{n:n,u:u});MAP=null;V='list';draw();return}
 for(var j=0;j<MAP.rows.length;j++){var r=MAP.rows[j],c={roles:[],cases:[]};MAP.map.forEach(function(k,i){var v=r[i];if(!k||!v)return;if(k=='role'){var ro=roleOf(v);if(ro)c.roles.push(ro)}else if(k=='case'){var cs=caseByNo(v);if(cs)c.cases.push(cs.id)}else if(k=='amount')c.note=(c.note?c.note+'\n':'')+'Сумма: '+v;else c[k]=v});
  if(!c.name)continue;if(MAP.role&&c.roles.indexOf(MAP.role)<0)c.roles.push(MAP.role);if(MAP.link&&cur&&c.cases.indexOf(cur)<0)c.cases.push(cur);if(await upsert(c))n++;else u++}
 MSG=U('imported',{n:n,u:u});MAP=null;V='list';draw();A.refresh()}
async function importFiles(fs,kind){MSG='';for(var i=0;i<fs.length;i++){var f=fs[i],nm=f.name,ext=(nm.match(/\.(\w+)$/)||['',''])[1].toLowerCase(),buf=await f.arrayBuffer();
 try{if(ext=='csv'||ext=='xlsx'){var rows=ext=='csv'?csv(dec(buf)):await xlsx(buf);if(rows.length<2)throw new Error('в таблице нет строк');MAP={kind:kind||'cp',name:nm,head:rows[0],rows:rows.slice(1),role:'',link:!!A.S().cur};MAP.map=guessMap(rows[0]);V='map';draw();return}
  if(ext=='json'){var j=JSON.parse(dec(buf)),cps=Array.isArray(j)?j:(j.counterparties||[]),cs=Array.isArray(j)?[]:(j.cases||[]);
   if(kind=='case'&&Array.isArray(j)){cs=j;cps=[]}
   if(cps.length&&!cps[0].name&&!cps[0].inn&&typeof cps[0]=='object'){var hd=Object.keys(cps.reduce(function(a,o){Object.keys(o).forEach(function(k){a[k]=1});return a},{}));MAP={kind:kind||'cp',name:nm,head:hd,rows:cps.map(function(o){return hd.map(function(k){return o[k]==null?'':String(o[k])})}),role:'',link:!!A.S().cur};MAP.map=guessMap(hd);V='map';draw();return}
   var n=0,u=0,S=A.S();for(var q=0;q<cps.length;q++){var o=Object.assign({},cps[q]);delete o.files;if(o.name||o.inn){if(await upsert(o))n++;else u++}}
   var cn=0,cu=0;cs.forEach(function(c){var d=c.data||c;if(!d||typeof d!='object')return;var ex=d.НОМЕР_ДЕЛА&&caseByNo(d.НОМЕР_ДЕЛА);if(ex){Object.keys(d).forEach(function(k){if(!ex.data[k])ex.data[k]=d[k]});cu++}else{S.cases.push({id:c.id&&!caseOf(c.id)?c.id:'c'+Date.now().toString(36)+cn,data:Object.assign({},d)});cn++}});if(cs.length){A.save();A.drawCases()}
   MSG=[cps.length?U('imported',{n:n,u:u}):'',cs.length?U('cases_imported',{n:cn,u:cu}):''].filter(Boolean).join(' · ')||U('extract_none');continue}
  if(kind=='case')throw new Error(U('bad_file',{name:nm}));
  if(ext=='vcf'){var vs=vcf(dec(buf)),a=0,b=0;for(var w=0;w<vs.length;w++){if(await upsert(vs[w]))a++;else b++}MSG=U('imported',{n:a,u:b});continue}
  if(ext=='pdf'||ext=='docx'||ext=='txt'){var tx;try{tx=ext=='pdf'?await pdfText(buf):ext=='docx'?await docxText(buf):dec(buf)}catch(x){throw new Error(U('pdf_fail',{msg:x.message}))}
   var c=extract(tx),cur=A.S().cur;ED=Object.assign(blank(),c,{_new:true,_extract:nm,_found:c._found});if(cur)ED.cases=[cur];
   var ex=digits(c.inn)&&CP.find(function(x){return digits(x.inn)==digits(c.inn)});if(ex){ED=Object.assign({},ex,{_extract:nm,_found:c._found});Object.keys(c).forEach(function(k){if(typeof c[k]=='string'&&c[k]&&!ED[k])ED[k]=c[k]})}
   PEND=[{name:nm,type:f.type,size:f.size,data:buf}];V='edit';draw();return}
  throw new Error(U('bad_file',{name:nm}))}catch(x){MSG=x.message;V='list';draw();return}}
 V='list';draw();A.refresh()}
/* ---------- экспорт ---------- */
function dl(blob,n){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=n;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000)}
function stamp(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function exportJSON(){var cs=CP.map(function(c){var o=Object.assign({},c);o.files=(c.files||[]).map(function(id){return (FM[id]||{}).name}).filter(Boolean);o.case_numbers=(c.cases||[]).map(function(id){var x=caseOf(id);return x&&x.data.НОМЕР_ДЕЛА}).filter(Boolean);return o});
 dl(new Blob([JSON.stringify({format:'arbitr-counterparties',version:1,exported:new Date().toISOString(),counterparties:cs},null,1)],{type:'application/json'}),'kontragenty_'+stamp()+'.json')}
function exportCSV(){var fl=K().fields||[],R=roles(),q=function(s){s=String(s==null?'':s);return /[;"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
 var rows=[[U('kind')].concat(fl.map(function(f){return f.label}),[U('roles'),U('cases')])].concat(visible().map(function(c){return [kinds()[c.kind]||''].concat(fl.map(function(f){return c[f.k]||''}),[(c.roles||[]).map(function(r){return R[r]||r}).join(', '),(c.cases||[]).map(function(id){var x=caseOf(id);return x?x.data.НОМЕР_ДЕЛА||A.caseName(x):''}).filter(Boolean).join(', ')])}));
 dl(new Blob(['\uFEFF'+rows.map(function(r){return r.map(q).join(';')}).join('\r\n')],{type:'text/csv;charset=utf-8'}),'kontragenty_'+stamp()+'.csv')}
function exportCases(){dl(new Blob([JSON.stringify({format:'arbitr-cases',version:1,exported:new Date().toISOString(),cases:A.S().cases},null,1)],{type:'application/json'}),'dela_'+stamp()+'.json')}
/* ---------- события ---------- */
function bind(el){
 el.addEventListener('input',function(e){var i=e.target;if(V=='mgr')return;if(i.dataset.dk&&DEB){DEB.c.data[i.dataset.dk]=i.value;return}if(i.id=='ddcno'){DADD.no=i.value;return}if(i.id=='dcpsq'){SQ[i.dataset.sq]=i.value;LIM=100;rerenderKeepFocus();return}if(i.id=='ddq'){DQ=i.value;rerenderKeepFocus();return}if(V=='list'&&i.id=='dadq'){ADQ=i.value;ADL=60;rerenderKeepFocus();return}if(V=='adir'&&(i.id=='dadr'||i.id=='dadq')){if(i.id=='dadr')ADR=i.value;else ADQ=i.value;ADL=60;rerenderKeepFocus();return}if(i.id=='dcpq'){Q=i.value;LIM=100;rerenderKeepFocus();return}if(i.dataset.cf&&ED){ED[i.dataset.cf]=i.value}});
 el.addEventListener('change',async function(e){var i=e.target;if(V=='mgr')return;if(i.id=='dadt'){ADT=i.value;ADL=60;draw();return}if(i.dataset.rg){var C0=regChecked().slice(),k0=i.dataset.rg;C0=C0.filter(function(x){return x!=k0});if(i.checked)C0.push(k0);regSet(C0);RGOPEN=true;draw();A.refresh();return}if(i.id=='dkmgr'&&DEB){DEB.c.mgr=i.value||undefined;return}if(i.id=='dcaseup2'){var fs2=[].slice.call(i.files);i.value='';await importFiles(fs2,'case');return}if(i.id=='ddfile'){var fs3=[].slice.call(i.files);i.value='';if(!fs3.length)return;DADD=DADD||{};DADD.msg=DU('reading');draw();var rx=await debFromFiles(fs3);DADD.msg='';var un=debFields().filter(function(k){return !rx.d[k]});openDeb(newCase(rx.d),'file',un);if(rx.bad.length)MSG=DU('file_bad',{f:rx.bad.join(', ')});return}
  if(i.id=='dcpbik'){var bf=i.files[0];i.value='';if(bf)await importBik(bf);return}
  if(i.id=='dcpup'){var fs=[].slice.call(i.files);i.value='';await importFiles(fs);return}
  if(i.id=='dcpatt'&&ED){[].forEach.call(i.files,function(f){PEND.push(f)});draw();return}
  if(i.id=='dcponly'){ONLY=i.checked;draw();return}
  if(i.dataset.cf&&ED){ED[i.dataset.cf]=i.value;return}
  if(i.dataset.crole&&ED){var r=i.dataset.crole;ED.roles=(ED.roles||[]).filter(function(x){return x!=r});if(i.checked)ED.roles.push(r);return}
  if(i.dataset.ccase&&ED){var c=i.dataset.ccase;ED.cases=(ED.cases||[]).filter(function(x){return x!=c});if(i.checked)ED.cases.push(c);return}
  if(i.dataset.map!=null&&MAP){MAP.map[+i.dataset.map]=i.value;return}if(i.id=='dcpmrole'&&MAP){MAP.role=i.value;return}if(i.id=='dcpmlink'&&MAP){MAP.link=i.checked;return}});
 el.addEventListener('click',async function(e){if(V=='mgr')return;var b=e.target.closest('[data-cpads],[data-cparch],[data-debarch],[data-cpsec],[data-cptop],[data-cp],[data-cpr],[data-cpk],[data-cpid],[data-debid],[data-cpfget],[data-cpfdel],[data-mgid]');if(!b)return;var d=b.dataset;if(d.cpsec){SEC=SEC==d.cpsec?null:d.cpsec;LIM=100;MSG='';draw();if(SEC){var se=ROOT.querySelector('[data-sec="'+SEC+'"]');if(se&&se.getBoundingClientRect().top<0)se.scrollIntoView({block:'start'})}return}if(d.cptop!=null){BTOP=+d.cptop;LIM=100;draw();return}if(d.debarch){e.stopPropagation();var cz=A.S().cases.find(function(x){return x.id==d.debarch});A.showTab('arch');if(cz)ArbArch.focus([cz.id],cz.data.ДОЛЖНИК_НАИМЕНОВАНИЕ,cz.data.ДОЛЖНИК_ИНН);return}if(d.debid){var cd=A.S().cases.find(function(x){return x.id==d.debid});if(cd)openDeb(cd,'');return}if(d.cp=='dadd'){DADD={};V='dadd';draw();ROOT.scrollIntoView({block:'start'});return}if(d.cp=='dcase'){DADD=DADD||{};DADD.mode='case';draw();var ci=$c('ddcno');if(ci)ci.focus();return}if(d.cp=='dman'){openDeb(newCase({}),'man');return}if(d.cp=='dexp'){exportCases();return}if(d.cp=='dcasego'){var no=String(DADD.no||'').trim().replace(/^A/,'А').replace(/\s+/g,'');DADD.no=no;if(!CASE_RE.test(no)){DADD.err=DU('case_bad');draw();return}var ex=A.S().cases.find(function(x){return norm(x.data.НОМЕР_ДЕЛА)==norm(no)});if(ex){DADD.err=DU('case_dup');draw();return}DADD.err='';DADD.msg=DU('req_sending');draw();var c5=newCase({НОМЕР_ДЕЛА:no});try{c5.req=await caseReq(no);DADD.msg='';var S6=A.S();S6.cases.push(c5);S6.cur=c5.id;A.save();A.refresh();openDeb(c5,'case');pollStart()}catch(x){DADD.msg='';DADD.err=DU('req_fail',{e:x.message});draw()}return}if(d.cp=='dcancel'){DEB=null;V=DADD?'dadd':'list';if(V=='list')SEC='debtors';draw();return}if(d.cp=='dsave'&&DEB){var cc=DEB.c,dd=cc.data;Object.keys(dd).forEach(function(k){dd[k]=String(dd[k]==null?'':dd[k]).trim();if(!dd[k])delete dd[k]});if(!dd.ДОЛЖНИК_НАИМЕНОВАНИЕ&&!dd.НОМЕР_ДЕЛА&&!dd.ДОЛЖНИК_ИНН){$c('dkerr').textContent=DU('need');return}delete cc.unc;var CS=A.S().cases,ix=CS.findIndex(function(x){return x.id==cc.id});if(ix>=0){Object.assign(CS[ix],cc)}else{CS.push(cc);A.S().cur=cc.id}if(cc.mgr&&A.setMgr)A.setMgr(cc.mgr);regAddCase(cc);A.save();DEB=null;DADD=null;V='list';SEC='debtors';MSG=DU('saved');draw();A.refresh();return}if(d.cp=='ddel'&&DEB){if(!confirm(DU('del_confirm',{n:DEB.c.data.ДОЛЖНИК_НАИМЕНОВАНИЕ||DEB.c.data.НОМЕР_ДЕЛА||''})))return;var S5=A.S();S5.cases=S5.cases.filter(function(x){return x.id!=DEB.c.id});if(S5.cur==DEB.c.id)S5.cur=null;A.save();DEB=null;V='list';SEC='debtors';draw();A.refresh();return}if(d.cp=='ddocs'&&DEB){var id6=DEB.c.id;DEB=null;V='list';A.setCur(id6);A.showTab('docs');return}if(d.cp=='rgdef'){RG=null;try{localStorage.removeItem(RGK)}catch(x){}regSet(regChecked());RGOPEN=true;draw();A.refresh();return}if(d.cp=='rgnone'){regSet([]);RGOPEN=true;draw();A.refresh();return}
  if(d.cparch){e.stopPropagation();var ca=CP.find(function(x){return x.id==d.cparch});A.showTab('arch');if(ca)ArbArch.focus(ca.cases||[],ca.name,ca.inn);return}
  if(d.mgid){editMgr(d.mgid);return}
  if(d.cp=='mgnew'){editMgr(null);return}
  if(d.cp=='adir'){openDir();return}if(d.cp=='back'){V='list';draw();return}if(d.cp=='admore'){ADL+=60;draw();return}if(d.cpads!=null&&d.cpads!==''){await saveDirOrg(+d.cpads);return}
  if(d.cp=='banks'){MSG=U('bik_loading');draw();var nb=await ensureBanks(false);MSG=U('banks_ok',{n:CP.filter(function(c){return c.kind=='bank'}).length,d:(window.ARBITR_BANKS||{}).source_date||''});SEC='banks';LIM=100;draw();A.refresh();return}
  if(d.cpk=='bank'){await ensureBanks(false)}
  if(d.cpr!=null){FLT=d.cpr;LIM=100;draw();return}
  if(d.cpk!=null){KF=d.cpk;LIM=100;draw();return}
  if(d.cpid){var c=CP.find(function(x){return x.id==d.cpid});if(c){ED=JSON.parse(JSON.stringify(c));PEND=[];MSG='';V='edit';draw();ROOT.scrollIntoView({block:'start'})}return}
  if(d.cpfget){var f=await ArbDB.get('cp_files',d.cpfget);if(f)dl(new Blob([f.data],{type:f.type||'application/octet-stream'}),f.name);return}
  if(d.cpfdel&&ED){await ArbDB.del('cp_files',d.cpfdel);delete FM[d.cpfdel];ED.files=(ED.files||[]).filter(function(x){return x!=d.cpfdel});var o=CP.find(function(x){return x.id==ED.id});if(o){o.files=ED.files.slice();await save1(o)}draw();return}
  var a=d.cp;
  if(a=='new'){ED=Object.assign(blank(),{_new:true});var cur=A.S().cur;if(cur)ED.cases=[cur];PEND=[];MSG='';V='edit';draw();return}
  if(a=='cancel'){ED=null;MAP=null;PEND=[];V='list';draw();return}
  if(a=='more'){LIM+=100;draw();return}
  if(a=='exj'){exportJSON();return}if(a=='exc'){exportCSV();return}
  if(a=='save'&&ED){if(!String(ED.name||'').trim()){$c('dcperr').textContent=(K().fields||[])[0].label+' — обязательно';return}
   var o={};Object.keys(ED).forEach(function(k){if(k.charAt(0)!='_')o[k]=ED[k]});o.files=o.files||[];
   for(var q=0;q<PEND.length;q++){var p=PEND[q],buf=p.data||await p.arrayBuffer(),fid=ArbDB.uid('cpf');await ArbDB.put('cp_files',{id:fid,cp:o.id,name:p.name,type:p.type,size:p.size||buf.byteLength,data:buf,added:Date.now()});FM[fid]={id:fid,name:p.name,size:p.size||buf.byteLength,type:p.type};o.files.push(fid)}
   var i=CP.findIndex(function(x){return x.id==o.id});if(i>=0)CP[i]=o;await save1(o);ED=null;PEND=[];MSG=U('saved');V='list';draw();A.refresh();return}
  if(a=='del'&&ED){if(!confirm(U('del_confirm',{name:ED.name||''})))return;for(var w=0;w<(ED.files||[]).length;w++)await ArbDB.del('cp_files',ED.files[w]);await ArbDB.del('counterparties',ED.id);CP=CP.filter(function(x){return x.id!=ED.id});ED=null;V='list';draw();A.refresh();return}
  if(a=='mapgo'&&MAP){await runMap();return}});
 el.addEventListener('keydown',function(e){var t=e.target.closest&&e.target.closest('[data-cpid],[data-mgid],[data-debid]');if(t&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}})}
function editMgr(id){V='mgr';ROOT.innerHTML='<div class="dmgwrap"></div>';A.mgrEdit(ROOT.firstChild,id,function(msg){V='list';MSG=msg||'';draw();ROOT.scrollIntoView({block:'start'})});ROOT.scrollIntoView({block:'start'})}
/* ===== d5: регионы справочника (галочки), подсказки адресата (combobox), разделы «Контрагентов», «Должники» ===== */
var RGK='arbitr_dir_regions',RG=undefined,RGN=null,RGOPEN=false;
function regMap(){if(RGN)return RGN;if(!AD)return {};var M={};AD.orgs.forEach(function(o){if(o.okato&&o.okato.length==1&&o.region&&!/[;,]/.test(o.region)){var k=o.okato[0],pr=o.type=='rosreestr'?3:/^[А-ЯЁ]/.test(o.region)&&/(ая|ий|ой|ь|а|ия|ан|ан|ия)\b/.test(o.region)?2:1;if(!M[k]||pr>M[k].p)M[k]={n:o.region,p:pr}}});
 RGN={};Object.keys(M).forEach(function(k){var st=rstems(M[k].n);RGN[k]={n:M[k].n.replace(/^г\.\s*/,''),st:st[0]||''}});return RGN}
function okOf(s){var R=regMap(),t=norm(s).replace(/-/g,''),hit=Object.keys(R).filter(function(k){var st=R[k].st;return st&&t.indexOf(st)>=0});
 return hit.filter(function(k){return !hit.some(function(j){return j!=k&&R[j].st.length>R[k].st.length&&R[j].st.indexOf(R[k].st)==0})})}
function orgOk(o){if(o._ok!==undefined)return o._ok;var v;if(o.okato&&o.okato.length)v=o.okato.length<5?o.okato.slice():[];else if(o.type=='court'&&o.level&&!/first|region|subject/.test(o.level))v=[];else v=okOf(o.region||(o.type=='court'?o.name:''));return o._ok=v}
function regSaved(){if(RG===undefined){try{RG=JSON.parse(localStorage.getItem(RGK)||'null')}catch(e){RG=null}if(!Array.isArray(RG))RG=null}return RG}
function caseOk(c){var d=(c&&c.data)||{};return okOf(d.РЕГИОН||'').concat(okOf(String(d.ДОЛЖНИК_АДРЕС||'').split(',').slice(0,3).join(' ')))}
function regChecked(){var r=regSaved();if(r)return r;var d=(ACF().regions_default||['40','41']).slice();if(AD)A.S().cases.forEach(function(c){caseOk(c).forEach(function(k){if(d.indexOf(k)<0)d.push(k)})});return d}
function regSet(L){RG=L.slice();try{localStorage.setItem(RGK,JSON.stringify(RG))}catch(e){}}
function regAddCase(c){var r=regSaved();if(!r||!AD)return;var ch=false;caseOk(c).forEach(function(k){if(r.indexOf(k)<0){r.push(k);ch=true}});if(ch)regSet(r)}
function inRegs(o){var k=orgOk(o);if(!k.length)return true;var C=regChecked();return k.some(function(x){return C.indexOf(x)>=0})}
function regPanel(){var R=regMap(),C=regChecked(),ks=Object.keys(R).sort(function(a,b){return R[a].n.localeCompare(R[b].n,'ru')});
 return '<details class="dregs"'+(RGOPEN?' open':'')+'><summary>'+E(AU_('regions_t')+' · '+U('shown',{a:C.length,b:ks.length}).replace(/^[^0-9]*/,''))+'</summary><p class="sm">'+E(AU_('regions_help'))+'</p><div class="dact"><button type="button" class="lbtn sec" data-cp="rgdef">'+E(AU_('regions_def'))+'</button><button type="button" class="lbtn sec" data-cp="rgnone">'+E(AU_('regions_none'))+'</button></div><div class="dregl">'+
  ks.map(function(k){return '<label class="dchk"><input type="checkbox" data-rg="'+k+'"'+(C.indexOf(k)>=0?' checked':'')+'> '+E(R[k].n)+'</label>'}).join('')+'</div></details>'}
/* ---- подсказки адресата: один движок для формы и пакета ---- */
var ABS={'по':1,'и':1,'в':1,'на':1,'для':1,'при':1};
function abbr(n){return String(n||'').replace(/[«»"()№.,]/g,' ').split(/[\s\-]+/).filter(function(w){return w&&!ABS[w.toLowerCase()]&&!/^\d/.test(w)}).map(function(w){return w.charAt(0)}).join('').toLowerCase()}
function city(a){var m=/(?:^|,)\s*(?:г\.?\s*)([А-ЯЁ][а-яё\-]+)/.exec(a||'')||/(?:^|,)\s*([А-ЯЁ][а-яё\-]+)\s+г\b/.exec(a||'');return m?m[1]:''}
function hayO(o){if(o._h)return o._h;var al=(ACF().aliases||{})[o.type]||[];return o._h=norm([o.name,o.region,o.address,o.index,o.inn,o.code,city(o.address),abbr(o.name),al.join(' '),tLabel(o.type)].join(' '))}
function hayC(c){return norm([c.name,c.short||'',c.inn,c.bik,c.addr_legal,c.addr_post,city(c.addr_legal||c.addr_post),abbr(c.name)].join(' '))}
function sugMode(tid){var D=ACF().directory||{},P=ACF().private||{};return D[tid]=='bank'?{m:'bank'}:D[tid]?{m:'dir',ty:D[tid]}:P[tid]?{m:'cp',role:P[tid]}:{m:'all'}}
function suggest(q,o){o=o||{};var qq=norm(q).split(' ').filter(Boolean);if(!qq.length)return [];var M=sugMode(o.tid),cs=o.caseId||A.S().cur,out=[],LIM=o.limit||30,
  ok=function(h){return qq.every(function(w){return h.indexOf(w)>=0})},nq=qq[0],tf=o.field||'',cc=A.S().cases.find(function(c){return c.id==cs}),rg0=o.region||(cc?(cc.data.РЕГИОН||cc.data.ДОЛЖНИК_АДРЕС||''):''),st=caseRegion(rg0),ko=okOf(rg0);
 if(M.m!='bank'&&AD)AD.orgs.forEach(function(x,i){if(M.m=='dir'&&x.type!=M.ty)return;if(M.m=='cp')return;if(!inRegs(x))return;var h=hayO(x);if(!ok(h))return;
  out.push({src:'d',i:i,dk:x.type+'|'+x.name,n:x.name,val:M.m=='dir'?dirVal(x,tf):x.name,addr:[x.index,x.address].filter(Boolean).join(', '),sub:[tLabel(x.type),x.inn?'ИНН '+x.inn:'',city(x.address)||x.address||''].filter(Boolean).join(' · '),
   sc:(norm(x.name).indexOf(nq)==0?2:0)+((st.length&&rmatch(x,st))||orgOk(x).some(function(k){return ko.indexOf(k)>=0})?1.5:0)+(orgOk(x).length?0:-0.5)})});
 CP.forEach(function(c){var part=cs&&(c.cases||[]).indexOf(cs)>=0;if(M.m=='bank'&&c.kind!='bank')return;if(M.m=='dir')return;if(M.m=='cp'&&!part&&(c.roles||[]).indexOf(M.role)<0&&M.role!='other')return;
  if(c.kind=='bank'&&c.bkind&&c.bkind!='head'&&c.bkind!='branch')return;if(!ok(hayC(c)))return;
  out.push({src:'k',cp:c.id,n:c.name,val:c.name,addr:c.addr_post||c.addr_legal||'',sub:[part?AU_('cb_part'):(kinds()[c.kind]||''),c.inn?'ИНН '+c.inn:'',c.bik?'БИК '+c.bik:'',city(c.addr_legal||c.addr_post)].filter(Boolean).join(' · '),sc:(part?4:0)+(norm(c.name).indexOf(nq)==0?2:0)+(c.rank_assets?Math.max(0,1-c.rank_assets/400):0)})});
 return out.sort(function(a,b){return b.sc-a.sc||a.n.localeCompare(b.n,'ru')}).slice(0,LIM)}
function cbField(t){var M=sugMode(t.id),D=ACF().directory||{};if(M.m=='dir'&&AD){var tp=AD.types.find(function(x){return x.id==M.ty})||{};if(tp.template_field&&t.fields.indexOf(tp.template_field)>=0)return tp.template_field}
 var m=A.multiOf?null:null,mm=((A.C().batch||{}).multi)||{};var f=t.fields.find(function(k){return mm[k]});if(f)return f;if(M.m=='dir'&&!AD)return null;return null}
var CBN=0;
/* host — контейнер; o: {tid, field, value, addr, label, caseId, region, multi, onSet(v,addr,item), onPick(item)} */
function combo(host,o){if(!host)return null;var id='dcb'+(++CBN),ld=false;
 host.innerHTML='<div class="dcombo"><label for="'+id+'">'+E(o.label||AU_('cb_label'))+'</label><div class="dcbw"><input id="'+id+'" class="dcbin" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="'+id+'_l" autocomplete="off" enterkeyhint="search" placeholder="'+E(o.multi?AU_('cb_ph_multi'):AU_('cb_ph'))+'" value="'+E(o.multi?'':(o.value||''))+'"><div class="dcbl" id="'+id+'_l" role="listbox" hidden></div></div>'+
  '<div class="dcba"><label for="'+id+'_a" class="sm">'+E(AU_('cb_addr'))+'</label><input id="'+id+'_a" class="dcbad" type="text" autocomplete="off" value="'+E(o.addr||'')+'" placeholder="'+E(AU_('cb_addr_ph'))+'"></div></div>';
 var inp=host.querySelector('.dcbin'),L=host.querySelector('.dcbl'),ai=host.querySelector('.dcbad'),tm=0,IT=[],act=-1;
 function close(){L.hidden=true;inp.setAttribute('aria-expanded','false');inp.removeAttribute('aria-activedescendant');act=-1}
 function hi(){[].forEach.call(L.querySelectorAll('.dcbi'),function(e,j){e.classList.toggle('on',j==act);if(j==act){inp.setAttribute('aria-activedescendant',e.id);e.scrollIntoView({block:'nearest'})}})}
 function show(){var v=inp.value.trim();if(!v){close();return}IT=suggest(v,o);act=-1;
  L.innerHTML=IT.map(function(x,j){return '<div class="dcbi" role="option" id="'+id+'_o'+j+'" data-cbi="'+j+'"><b>'+E(x.n)+'</b><span class="sm">'+E(x.sub)+'</span></div>'}).join('')+(!ld?'<div class="sm dcbn">…</div>':IT.length?'':'<div class="sm dcbn">'+E(AU_('cb_none'))+'</div>')+(o.multi?'<div class="dcbi dcbman" role="option" id="'+id+'_om" data-cbi="-1"><b>'+E(AU_('cb_manual',{v:v}))+'</b><span class="sm">'+E(AU_('cb_manual_h'))+'</span></div>':'');
  L.hidden=false;inp.setAttribute('aria-expanded','true')}
 function pick(j){if(j==-1){var v=inp.value.trim();if(!v)return;var it={src:'m',n:v,val:v,addr:ai.value.trim()};if(o.onPick)o.onPick(it);inp.value='';ai.value='';close();return}var x=IT[j];if(!x)return;
  if(o.multi){if(o.onPick)o.onPick(x);inp.value='';ai.value='';close();inp.focus();return}
  inp.value=x.val;ai.value=x.addr||'';close();if(o.onSet)o.onSet(x.val,ai.value,x)}
 function ensure(){if(ld)return;var ps=[addrLoad()];if(sugMode(o.tid).m=='bank'||sugMode(o.tid).m=='all')ps.push(ensureBanks(false));Promise.all(ps).then(function(){ld=true;if(document.activeElement===inp)show()},function(){ld=true})}
 inp.addEventListener('focus',function(){ensure();if(window.innerWidth<700)setTimeout(function(){try{inp.scrollIntoView({block:'start',behavior:'smooth'})}catch(e){}},250)});
 inp.addEventListener('input',function(){ensure();clearTimeout(tm);tm=setTimeout(show,(o.debounce||140));if(!o.multi&&o.onSet)o.onSet(inp.value,ai.value,null)});
 ai.addEventListener('input',function(){if(!o.multi&&o.onSet)o.onSet(inp.value,ai.value,null)});
 inp.addEventListener('keydown',function(e){var n=L.querySelectorAll('.dcbi').length;if(e.key=='ArrowDown'){e.preventDefault();if(L.hidden)show();act=Math.min(n-1,act+1);hi()}else if(e.key=='ArrowUp'){e.preventDefault();act=Math.max(0,act-1);hi()}
  else if(e.key=='Enter'){if(!L.hidden&&act>=0){e.preventDefault();var el=L.querySelectorAll('.dcbi')[act];pick(+el.dataset.cbi)}else if(o.multi&&inp.value.trim()){e.preventDefault();show()}}else if(e.key=='Escape'){close()}});
 L.addEventListener('mousedown',function(e){e.preventDefault()});
 L.addEventListener('click',function(e){var el=e.target.closest('[data-cbi]');if(el)pick(+el.dataset.cbi)});
 inp.addEventListener('blur',function(){setTimeout(function(){if(!host.contains(document.activeElement))close()},180)});ai.addEventListener('blur',function(){setTimeout(function(){if(!host.contains(document.activeElement))close()},180)});ai.addEventListener('focus',function(){if(o.multi&&inp.value.trim())show()});
 return {input:inp,addr:ai,el:host.firstChild}}
/* ---- разделы ---- */
var SEC=null,SQ={},DEB=null,DADD=null,DQ='';
function secs(){return K().sections||[{id:'debtors',title:'Должники'},{id:'banks',title:'Банки'},{id:'adir',title:'Справочник адресатов госорганов'},{id:'managers',title:'Арбитражные управляющие'}]}
function secCount(id){var S0=A.S();if(id=='debtors')return S0.cases.length;if(id=='managers')return A.MGR?A.MGR().length:0;if(id=='banks')return CP.filter(function(c){return c.kind=='bank'}).length||'';
 if(id=='adir')return AD?AD.orgs.filter(inRegs).length:'';if(id=='others')return CP.filter(function(c){return c.kind!='bank'&&c.src!='dir'}).length;return ''}
function secBody(id){if(id=='debtors')return vDebtors();if(id=='managers')return mgrList();if(id=='banks')return vBanks();if(id=='adir')return vDirIn();if(id=='others')return vOthers();return ''}
function vSections(){var h='<p class="sm">'+E(K().help||'')+'</p>'+(MSG?'<p class="sm dok" id="dcpmsg">'+E(MSG)+'</p>':'');
 secs().forEach(function(s){var on=SEC==s.id,n=secCount(s.id);h+='<section class="dcsec'+(on?' on':'')+'" data-sec="'+s.id+'"><button type="button" class="dcsech" data-cpsec="'+s.id+'" aria-expanded="'+on+'"><span class="dcsect">'+E(s.title)+'</span><span class="dcsecn">'+(n===''?'':E(n))+'</span><span class="dcseca" aria-hidden="true">'+(on?'▴':'▾')+'</span></button>'+(on?'<div class="dcsecb">'+secBody(s.id)+'</div>':'')+'</section>'});return h}
function mgrList(){var M=A.MGR?A.MGR():[];return (A.encOK&&!A.encOK()?'<p class="sm ewarn">'+E(MU('locked'))+'</p>':'')+M.map(function(m){var f=m.f,todo=Object.keys(f).some(function(k){return String(f[k]||'').indexOf('[__]')>=0});return '<div class="lot dit dcp dmgc" data-mgid="'+E(m.id)+'" role="button" tabindex="0"><div class="d1">'+E(A.mgrName(m))+'</div><div class="sm">'+E([f.ИНН_УПРАВЛЯЮЩЕГО?'ИНН '+f.ИНН_УПРАВЛЯЮЩЕГО:'',f.РЕГ_НОМЕР_АУ?'рег. № '+f.РЕГ_НОМЕР_АУ:'',f.СРО||''].filter(Boolean).join(' · '))+'</div><div class="sm dkind">'+E(MU('assets',{l:m.lh.length,s:m.sig.length}))+'</div>'+(todo&&(A.C().manager||{}).todo_blocking===false?'<div class="sm">'+E(MU('addr_todo_hint'))+'</div>':'')+'</div>'}).join('')+
 (A.encOK&&A.encOK()?'<p><button type="button" class="lbtn sec" data-cp="mgnew">'+E(MU('add'))+'</button></p>':'')}
function cpRow(c){var R=roles(),rs=(c.roles||[]).map(function(r){return R[r]||r}).join(', ');return '<div class="lot dit dcp" data-cpid="'+E(c.id)+'" role="button" tabindex="0"><div class="d1">'+E(c.name||'—')+'</div><div class="sm">'+E([(kinds()[c.kind]||''),c.kind=='bank'&&c.bik?'БИК '+c.bik:'',c.inn?'ИНН '+c.inn:'',c.rank_assets&&c.bkind=='head'?'№ '+c.rank_assets+' по активам':'',rs].filter(Boolean).join(' · '))+'</div>'+(c.kind=='bank'?'':'<div class="sm dkind">'+E([U('n_cases',{n:(c.cases||[]).length}),(c.files||[]).length?U('n_files',{n:c.files.length}):''].filter(Boolean).join(' · '))+'</div>')+archLink(c)+'</div>'}
var BTOP=0;
function vBanks(){var q=norm(SQ.banks||''),TS=(A.C().batch||{}).top_sizes||[10,20,30],L=CP.filter(function(c){return c.kind=='bank'}),rd='';
 if(!L.length&&(window.ARB_DIR||{}).banks){ensureBanks(false).then(function(n){if(SEC=='banks'&&V=='list')draw()});return '<p class="sm">'+E(U('bik_loading'))+'</p>'}
 L.forEach(function(c){if(c.rank_date)rd=c.rank_date});if(BTOP){var sr={};L=L.filter(function(c){if(c.bkind!='head'||!c.rank_assets||c.rank_assets>BTOP||sr[c.rank_assets])return false;sr[c.rank_assets]=1;return true}).sort(function(a,b){return a.rank_assets-b.rank_assets})}
 else L=L.slice().sort(function(a,b){return (a.bkind=='head'?0:1)-(b.bkind=='head'?0:1)||(a.rank_assets||9999)-(b.rank_assets||9999)||String(a.name).localeCompare(String(b.name),'ru')});
 if(q)L=L.filter(function(c){return hayC(c).indexOf(q)>=0||q.split(' ').every(function(w){return hayC(c).indexOf(w)>=0})});var all=L.length;L=L.slice(0,LIM);
 return '<div class="pflt dflt"><input type="search" id="dcpsq" data-sq="banks" placeholder="'+E(U('bank_search'))+'" value="'+E(SQ.banks||'')+'"></div><div class="dtopn">'+TS.map(function(n){return '<button type="button" class="pchip'+(BTOP==n?' on':'')+'" data-cptop="'+n+'">ТОП-'+n+'</button>'}).join('')+(BTOP?'<button type="button" class="pchip" data-cptop="0">'+E(U('all'))+'</button>':'')+(rd?'<span class="sm">'+E(((A.C().batch||{}).ui||{}).top_date?A.C().batch.ui.top_date.replace('{d}',rd.split('-').reverse().join('.')):rd)+'</span>':'')+'</div>'+
  '<div class="dact dcpbar"><button type="button" class="lbtn sec" data-cp="banks">'+E(U('banks_dir'))+'</button><label class="lbtn sec dfile">'+E(U('bik_import'))+'<input type="file" id="dcpbik" accept=".xml,.zip,.csv,text/xml,application/zip,text/csv" hidden></label></div>'+
  '<p class="sm">'+E(U('shown',{a:L.length,b:all}))+'</p>'+L.map(cpRow).join('')+(all>LIM?'<button type="button" class="lbtn sec" data-cp="more">'+E(U('more',{n:Math.min(100,all-LIM)}))+'</button>':'')}
function vDirIn(){if(!(window.ARB_DIR||{}).addressees)return '<p class="sm">'+E(U('nothing'))+'</p>';if(!AD){addrLoad().then(function(){if(SEC=='adir'&&V=='list')draw()});return '<p class="sm">…</p>'}
 var h=regPanel()+'<p class="sm">'+E(AU_('help')||'')+(AD.date?' '+E(AU_('date')||'Актуальность')+': '+E(AD.date.split('-').reverse().join('.')):'')+'</p>';
 h+='<div class="g2"><div><label for="dadt">'+E(AU_('type')||'Тип')+'</label><select id="dadt"><option value="">'+E(AU_('all_types'))+'</option>'+AD.types.filter(function(t){return AD.orgs.some(function(o){return o.type==t.id})}).map(function(t){return '<option value="'+E(t.id)+'"'+(ADT==t.id?' selected':'')+'>'+E(t.label)+'</option>'}).join('')+'</select></div>'+
  '<div><label for="dadq">'+E(AU_('search'))+'</label><input type="search" id="dadq" placeholder="'+E(AU_('search_ph')||'')+'" value="'+E(ADQ)+'"></div></div>';
 var qq=norm(ADQ).split(' ').filter(Boolean),L=AD.orgs.filter(function(o){return (!ADT||o.type==ADT)&&inRegs(o)&&qq.every(function(w){return hayO(o).indexOf(w)>=0})}),all=L.length;
 L.sort(function(a,b){return (orgOk(a).length?0:1)-(orgOk(b).length?0:1)});L=L.slice(0,ADL);
 h+='<p class="sm">'+E(U('shown',{a:L.length,b:all}))+' · '+E(AU_('fed_always'))+'</p>';
 h+=L.length?L.map(function(o){var i=AD.orgs.indexOf(o),ex=CP.some(function(c){return c.src=='dir'&&norm(c.name)==norm(o.name)});return '<div class="lot dit dadir"><div class="d1">'+E(o.name)+'</div><div class="sm">'+E(tLabel(o.type)+(o.code?' · код '+o.code:'')+(orgOk(o).length?'':' · '+AU_('federal')))+'</div><div class="sm">'+E(orgLine(o))+'</div>'+(o.verify?'<div class="sm ewarn">'+E(AU_('verify')||'Проверьте перед отправкой')+'</div>':'')+'<div class="dact"><button type="button" class="lbtn sec" data-cpads="'+i+'"'+(ex?' disabled':'')+'>'+E(ex?(AU_('saved')||'Уже в контрагентах'):AU_('save_cp'))+'</button></div></div>'}).join('')+(all>ADL?'<button type="button" class="lbtn sec" data-cp="admore">'+E(U('more',{n:Math.min(60,all-ADL)}))+'</button>':''):'<div class="empty">'+E(U('nothing'))+'</div>';
 return h}
function vOthers(){var R=roles(),q=norm(SQ.others||''),L=CP.filter(function(c){return c.kind!='bank'&&(!FLT||(c.roles||[]).indexOf(FLT)>=0)&&(!q||hayC(c).indexOf(q)>=0)}),all=L.length;L=L.slice(0,LIM);
 return '<div class="dact dcpbar"><button type="button" class="lbtn" data-cp="new">'+E(U('add'))+'</button><label class="lbtn sec dfile">'+E(U('import'))+'<input type="file" id="dcpup" accept=".csv,.xlsx,.json,.vcf,.pdf,.docx,.txt,text/csv,application/json,text/vcard" multiple hidden></label>'+(CP.length?'<button type="button" class="lbtn sec" data-cp="exj">'+E(U('export_json'))+'</button><button type="button" class="lbtn sec" data-cp="exc">'+E(U('export_csv'))+'</button>':'')+'</div><p class="sm">'+E(U('import_help'))+'</p>'+
  '<div class="pflt dflt"><input type="search" id="dcpsq" data-sq="others" placeholder="'+E(U('search'))+'" value="'+E(SQ.others||'')+'"></div><div class="dchips"><button type="button" class="pchip'+(FLT?'':' on')+'" data-cpr="">'+E(U('all'))+'</button>'+Object.keys(R).filter(function(r){return CP.some(function(c){return (c.roles||[]).indexOf(r)>=0})}).map(function(r){return '<button type="button" class="pchip'+(FLT==r?' on':'')+'" data-cpr="'+E(r)+'">'+E(R[r])+'</button>'}).join('')+'</div>'+
  (L.length?L.map(cpRow).join('')+(all>LIM?'<button type="button" class="lbtn sec" data-cp="more">'+E(U('more',{n:Math.min(100,all-LIM)}))+'</button>':''):'<div class="empty">'+E(U(CP.length?'nothing':'empty'))+'</div>')}
/* ---- должники ---- */
function DU(k,o){var x=(K().debtors||{})[k]||k;if(o)Object.keys(o).forEach(function(n){x=x.split('{'+n+'}').join(o[n])});return x}
function debFields(){return (K().debtor_fields||A.C().case_order||[])}
function debHay(c){var d=c.data||{};return norm([d.ДОЛЖНИК_НАИМЕНОВАНИЕ,d.ДОЛЖНИК_ИНН,d.НОМЕР_ДЕЛА,d.ДОЛЖНИК_ОГРН_СНИЛС].join(' '))+' '+digits(d.ДОЛЖНИК_ИНН)}
function debLine(c){var d=c.data||{};return [d.ДОЛЖНИК_НАИМЕНОВАНИЕ||DU('unnamed'),d.ДОЛЖНИК_ИНН?'ИНН '+d.ДОЛЖНИК_ИНН:'',d.НОМЕР_ДЕЛА?'№ '+d.НОМЕР_ДЕЛА:''].filter(Boolean).join(' · ')}
function vDebtors(){var cs=A.S().cases,q=norm(DQ),L=cs.filter(function(c){return !q||q.split(' ').every(function(w){return debHay(c).indexOf(w)>=0})});
 var h=(A.encOK&&!A.encOK()?'<p class="sm ewarn">'+E(DU('locked'))+'</p>':'')+'<div class="dact"><button type="button" class="lbtn" data-cp="dadd">'+E(DU('add'))+'</button>'+'<label class="lbtn sec dfile">'+E(U('cases_import'))+'<input type="file" id="dcaseup2" accept=".csv,.xlsx,.json" hidden></label>'+(cs.length?'<button type="button" class="lbtn sec" data-cp="dexp">'+E(U('cases_export'))+'</button>':'')+'</div>'+
  (cs.length>3?'<div class="pflt dflt"><input type="search" id="ddq" placeholder="'+E(DU('search'))+'" value="'+E(DQ)+'"></div>':'');
 h+=L.length?L.map(function(c){var d=c.data||{},rq=c.req&&/^(new|in_progress)$/.test(c.req.status)?'<span class="dpend">'+E(DU('pending'))+'</span>':c.req&&/^(error|not_found)$/.test(c.req.status)?'<span class="dpend err">'+E(DU('req_'+c.req.status))+'</span>':(c.unc&&c.unc.length?'<span class="dpend unc">'+E(DU('unc_badge',{n:c.unc.length}))+'</span>':''),n=window.ArbArch&&!ArbArch.locked()?ArbArch.countFor([c.id],d.ДОЛЖНИК_НАИМЕНОВАНИЕ,d.ДОЛЖНИК_ИНН):0;
  return '<div class="lot dit dcp ddeb'+(c.id==A.S().cur?' on':'')+'" data-debid="'+E(c.id)+'" role="button" tabindex="0"><div class="d1">'+E(d.ДОЛЖНИК_НАИМЕНОВАНИЕ||(c.req&&/^(new|in_progress)$/.test(c.req.status)?DU('pending_name'):DU('unnamed')))+'</div><div class="sm">'+E([d.ДОЛЖНИК_ИНН?'ИНН '+d.ДОЛЖНИК_ИНН:'',d.НОМЕР_ДЕЛА?'№ '+d.НОМЕР_ДЕЛА:'',d.ПРОЦЕДУРА||''].filter(Boolean).join(' · '))+'</div>'+rq+(n?'<button type="button" class="lbtn sec dcparch" data-debarch="'+E(c.id)+'">'+E(U('arch_link',{n:n}))+'</button>':'')+'</div>'}).join(''):'<div class="empty">'+E(cs.length?U('nothing'):DU('empty'))+'</div>';
 return h}
function vDAdd(){var h='<button type="button" class="lbtn sec" data-cp="back">'+E(AU_('back'))+'</button><h4 class="dsh">'+E(DU('add_t'))+'</h4><p class="sm">'+E(DU('add_help'))+'</p><div class="dtiles">'+
  '<label class="dtile" role="button" tabindex="0"><span class="dtic" aria-hidden="true">📄</span><b>'+E(DU('m_file'))+'</b><span class="sm">'+E(DU('m_file_h'))+'</span><input type="file" id="ddfile" accept=".pdf,.docx,.txt,.rtf,.htm,.html,application/pdf" multiple hidden></label>'+
  '<button type="button" class="dtile" data-cp="dcase"><span class="dtic" aria-hidden="true">⚖</span><b>'+E(DU('m_case'))+'</b><span class="sm">'+E(DU('m_case_h'))+'</span></button>'+
  '<button type="button" class="dtile" data-cp="dman"><span class="dtic" aria-hidden="true">✎</span><b>'+E(DU('m_man'))+'</b><span class="sm">'+E(DU('m_man_h'))+'</span></button></div>'+
  (DADD&&DADD.mode=='case'?'<div class="dcasebox"><label for="ddcno">'+E(DU('case_no'))+'</label><input id="ddcno" type="text" inputmode="text" autocomplete="off" placeholder="А56-12345/2026" value="'+E(DADD.no||'')+'"><p class="sm">'+E(DU('case_help'))+'</p><p class="sm ewarn" id="ddcerr">'+E(DADD.err||'')+'</p><div class="dact"><button type="button" class="lbtn" data-cp="dcasego">'+E(DU('case_go'))+'</button></div></div>':'')+
  (DADD&&DADD.msg?'<p class="sm dok">'+E(DADD.msg)+'</p>':'');return h}
function newCase(d){return {id:'c'+Date.now().toString(36),data:d||{}}}
function vDeb(){var c=DEB.c,d=c.data,F=A.F(),u=(DEB.unc||[]).concat(c.unc||[]),pend=c.req&&/^(new|in_progress)$/.test(c.req.status),M=A.MGR?A.MGR():[],isNew=!A.S().cases.some(function(x){return x.id==c.id});
 var h='<button type="button" class="lbtn sec" data-cp="dcancel">'+E(AU_('back'))+'</button><h4 class="dsh">'+E(isNew?DU('review_t'):(d.ДОЛЖНИК_НАИМЕНОВАНИЕ||DU('unnamed')))+'</h4>'+(DEB.src?'<p class="sm">'+E(DU('src_'+DEB.src))+'</p>':'')+(isNew?'<p class="sm dnote">'+E(DU('review_help'))+'</p>':'')+
  (c.req?'<p class="'+(pend?'dpend':'sm dkind')+'">'+E(pend?DU('pending'):DU('req_'+c.req.status))+'</p>'+(pend?'<p class="sm">'+E(DU('pending_h'))+'</p>':''):'')+((c.unc||[]).length?'<p class="sm dnote warn">'+E(DU('unc_help'))+'</p>':'')+'<div class="g2">'+debFields().map(function(k){var f=F[k]||{label:k},v=d[k]||'',dt=f.type=='date',un=u.indexOf(k)>=0||(DEB.src&&DEB.src!='man'&&!v);
  return '<div'+(f.type=='textarea'||/АДРЕС|НАИМЕНОВАНИЕ|СУД$/.test(k)?' class="dwide"':'')+'><label for="dk_'+E(k)+'">'+E(f.label||k)+(un?' <span class="sm ewarn">'+E(DU('check'))+'</span>':'')+'</label>'+(f.opt?'<input id="dk_'+E(k)+'" data-dk="'+E(k)+'" list="dk_'+E(k)+'_l" value="'+E(v)+'" autocomplete="off"><datalist id="dk_'+E(k)+'_l">'+f.opt.map(function(o){return '<option value="'+E(o)+'">'}).join('')+'</datalist>':'<input id="dk_'+E(k)+'" data-dk="'+E(k)+'" type="'+(dt?'date':'text')+'" value="'+E(v)+'" autocomplete="off"'+(pend&&!v?' placeholder="'+E(DU('ph_pending'))+'"':'')+((c.unc||[]).indexOf(k)>=0?' class="dunc"':'')+'>')+'</div>'}).join('')+'</div>'+
  (M.length?'<div class="dcrow"><label for="dkmgr">'+E(DU('mgr'))+'</label><select id="dkmgr"><option value="">—</option>'+M.map(function(m){return '<option value="'+E(m.id)+'"'+(c.mgr==m.id?' selected':'')+'>'+E(A.mgrName(m))+'</option>'}).join('')+'</select></div>':'')+
  (DEB.parts&&DEB.parts.length?'<p class="sm">'+E(DU('parts',{n:DEB.parts.length}))+'</p>':'')+
  '<p class="sm ewarn" id="dkerr"></p><div class="dact"><button type="button" class="lbtn" data-cp="dsave">'+E(isNew?DU('save_new'):U('save'))+'</button>'+(isNew?'':'<button type="button" class="lbtn sec" data-cp="ddocs">'+E(DU('to_docs'))+'</button><button type="button" class="lbtn sec" data-cp="ddel">'+E(U('delete'))+'</button>')+'</div>';return h}
var PROCS=[['реализаци[июя]\\s+имущества','реализация имущества гражданина'],['реструктуризаци[июя]\\s+долгов','реструктуризация долгов гражданина'],['конкурсно[ея]\\s+производств','конкурсное производство'],['внешне[ея]\\s+управлени','внешнее управление'],['финансово[ея]\\s+оздоровлени','финансовое оздоровление'],['наблюдени[ея]','наблюдение']];
var MON={'января':1,'февраля':2,'марта':3,'апреля':4,'мая':5,'июня':6,'июля':7,'августа':8,'сентября':9,'октября':10,'ноября':11,'декабря':12};
function isoD(s){var m=/(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(s||'');if(m)return m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);m=/«?(\d{1,2})»?\s+([а-я]+)\s+(\d{4})/i.exec(s||'');if(m&&MON[m[2].toLowerCase()])return m[3]+'-'+('0'+MON[m[2].toLowerCase()]).slice(-2)+'-'+('0'+m[1]).slice(-2);return ''}
function extractCase(t){t=String(t||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ');var d={},m,cp=extract(t);
 if(m=/\b[АA]\s?(\d{2})\s?[-–]\s?(\d{1,7})\s?\/\s?(\d{4})(?:\s?[-–]\s?\d+)?/.exec(t))d.НОМЕР_ДЕЛА='А'+m[1]+'-'+m[2]+'/'+m[3];
 var reS=/(Арбитражн(?:ый|ого) суд(?:а)? [^\n,.;]{3,90}?)(?=\s*(?:в составе|\n|,|\.|;|\(|судь|$))/gi,sb=null;while((m=reS.exec(t))){if(!sb||sb[1]==sb[1].toUpperCase())sb=m;if(m[1]!=m[1].toUpperCase())break}if(sb){var sv=sb[1].trim();if(sv==sv.toUpperCase())sv=sv.toLowerCase().replace(/^./,function(x){return x.toUpperCase()}).replace(/(санкт-петербург|москв|ленинград|[а-яё]+ской|[а-яё]+ского)/g,function(w){return /^(санкт|москв|ленинград)/.test(w)?w.replace(/(^|-)([а-яё])/g,function(a,b,c){return b+c.toUpperCase()}):w});d.СУД=sv.replace(/^Арбитражного суда/i,'Арбитражный суд').replace(/^Арбитражный суд(а)?/i,'Арбитражный суд')}
 if(m=/[Сс]удь[яиеё]\s+([А-ЯЁ][а-яё\-]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.|[А-ЯЁ]\.\s?[А-ЯЁ]\.\s?[А-ЯЁ][а-яё\-]+)/.exec(t))d.ФИО_СУДЬИ=m[1];
 for(var i=0;i<PROCS.length;i++)if(new RegExp(PROCS[i][0],'i').test(t)){d.ПРОЦЕДУРА=PROCS[i][1];break}
 if(m=/(?:резолютивная часть[^\n]{0,60}?объявлена|дата (?:изготовления|принятия)[^\n]{0,40}?)\s*[:\-]?\s*(«?\d{1,2}»?\s+[а-я]+\s+\d{4}|\d{1,2}\.\d{1,2}\.\d{4})/i.exec(t))d.ДАТА_СУДЕБНОГО_АКТА=isoD(m[1]);
 else if(m=/(«?\d{1,2}»?\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4}|\d{2}\.\d{2}\.\d{4})/i.exec(t))d.ДАТА_СУДЕБНОГО_АКТА=isoD(m[1]);
 if(m=/срок(?:ом)?\s+(?:на\s+)?(\d+\s+(?:месяц[а-я]*|год[а-я]*))/i.exec(t))d.СРОК_ПРОЦЕДУРЫ=m[1];else if(m=/(?:сроком|срок)\s+до\s+(\d{2}\.\d{2}\.\d{4})/i.exec(t))d.СРОК_ПРОЦЕДУРЫ='до '+m[1];
 if(m=/(?:в отношении|должник[а-я]*[:\s–—-]+)\s*((?:обществ[а-я]* с ограниченной ответственностью|акционерн[а-я]* обществ[а-я]*|публичн[а-я]* акционерн[а-я]* обществ[а-я]*|ООО|АО|ПАО|ЗАО)\s*[«"][^»"]{2,80}[»"])/i.exec(t))d.ДОЛЖНИК_НАИМЕНОВАНИЕ=m[1].replace(/\s+/g,' ').replace(/^публичн[а-я]* акционерн[а-я]* обществ[а-я]*/i,'Публичное акционерное общество').replace(/^акционерн[а-я]* обществ[а-я]*/i,'Акционерное общество').replace(/^обществ[а-я]* с ограниченной ответственностью/i,'Общество с ограниченной ответственностью');
 else if(m=/(?:в отношении|гражданин[а-я]*|должник[а-я]*[:\s–—-]+)\s*([А-ЯЁ][а-яё\-]+\s+[А-ЯЁ][а-яё\-]+\s+[А-ЯЁ][а-яё\-]+(?:вич[а-я]*|вн[а-я]+|ич[а-я]*|кызы|оглы))/.exec(t))d.ДОЛЖНИК_НАИМЕНОВАНИЕ=m[1];
 else if(cp.name)d.ДОЛЖНИК_НАИМЕНОВАНИЕ=cp.name;
 if(m=/ИНН[:\s№]*(\d{12}|\d{10})\b/.exec(t))d.ДОЛЖНИК_ИНН=m[1];if(m=/ОГРН(?:ИП)?[:\s№]*(\d{15}|\d{13})\b/.exec(t))d.ДОЛЖНИК_ОГРН_СНИЛС=m[1];else if(m=/СНИЛС[:\s№]*(\d{3}-\d{3}-\d{3}[ -]\d{2})/.exec(t))d.ДОЛЖНИК_ОГРН_СНИЛС=m[1];
 if(m=/(?:адрес(?: регистрации| места нахождения| местонахождения)?|зарегистрирован[а-я]* по адресу|место жительства)[:\s]+(\d{6},[^\n;)]{5,160})/i.exec(t))d.ДОЛЖНИК_АДРЕС=m[1].trim().replace(/[.,]$/,'');else if(cp.addr_legal)d.ДОЛЖНИК_АДРЕС=cp.addr_legal;
 if(cp.head)d.ФИО_РУКОВОДИТЕЛЯ=cp.head;
 if(m=/(?:дата (?:государственной )?регистрации|зарегистрирован[а-я]*)\s*[:\-]?\s*(\d{2}\.\d{2}\.\d{4})/i.exec(t))d.ДАТА_РЕГИСТРАЦИИ=isoD(m[1]);
 var rg=d.СУД&&/суд(?:а)?\s+(?:города\s+)?(.+)$/i.exec(d.СУД);if(rg&&!/\sи\s/i.test(rg[1])&&/(област|кра|республик|округ)/i.test(rg[1]))d.РЕГИОН=rg[1].replace(/ая\b/g,'ой').replace(/ий край/,'ому краю').replace(/области$/,'области');
 Object.keys(d).forEach(function(k){if(!d[k])delete d[k]});return d}
async function debFromFiles(fs){var d={},txt='',bad=[];for(var i=0;i<fs.length;i++){var f=fs[i],ext=(f.name.match(/\.(\w+)$/)||['',''])[1].toLowerCase(),t='';try{var buf=await f.arrayBuffer();if(ext=='pdf')t=await pdfText(buf);else if(ext=='docx')t=await docxText(buf);else t=dec(buf).replace(/<[^>]+>/g,' ')}catch(e){bad.push(f.name)}if(!String(t).trim())bad.push(f.name);txt+='\n'+t}
 var x=extractCase(txt);Object.keys(x).forEach(function(k){if(!d[k])d[k]=x[k]});return {d:d,bad:bad}}
function openDeb(c,src,unc){DEB={c:JSON.parse(JSON.stringify(c)),src:src||'',unc:unc||[]};V='deb';draw();ROOT.scrollIntoView({block:'start'})}
var CASE_RE=/^[АA]\d{2}-\d{1,7}\/\d{4}$/;
function reqId(){var d=new Date(),p=function(n){return ('0'+n).slice(-2)};return 'case_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'_'+Math.random().toString(36).slice(2,6)}
async function caseReq(no){var cfg=K().case_lookup||{},id=reqId(),vs=A.vaultSalt?A.vaultSalt():null;
 var body={schema:'arbitr/debtor_request/v1',id:id,type:'debtor_by_case',case_no:no,created_at:new Date().toISOString(),status:'new',enc:vs?{format:'arbitr/au',s:vs.s,it:vs.it}:null,response_path:(cfg.results||'arbitr/debtor_results/')+id+'.enc'};
 if(typeof ghApi!='function')throw new Error('нет подключения к хранилищу');var r=await ghApi((cfg.requests||'arbitr/debtor_requests/')+id+'.json',{method:'PUT',body:JSON.stringify({message:'debtor_by_case '+id,branch:typeof BRANCH!='undefined'?BRANCH:'main',content:u8b64(JSON.stringify(body,null,1))})});
 if(!r.ok)throw new Error('GitHub '+r.status);return {id:id,no:no,status:'new',at:Date.now()}}
var POLL=0;
async function pollReqs(){var cs=A.S().cases.filter(function(c){return c.req&&c.req.status!='done'&&c.req.status!='error'&&c.req.status!='not_found'});if(!cs.length||typeof ghApi!='function')return;var cfg=K().case_lookup||{},ch=false;
 for(var i=0;i<cs.length;i++){var c=cs[i],q=c.req;try{var r=await ghApi((cfg.results||'arbitr/debtor_results/')+q.id+'.enc');if(r.ok){var j=await r.json(),txt=decodeURIComponent(escape(atob(String(j.content||'').replace(/\s/g,''))));var res=JSON.parse(new TextDecoder().decode(await A.vdec(txt)));
   var d=res.case||{},un=res.uncertain||[];Object.keys(d).forEach(function(k){if(k=='АУ')return;if(d[k]&&!c.data[k])c.data[k]=d[k]});if(d.АУ&&d.АУ.ФИО&&A.MGR){var mm=A.MGR().find(function(m){return norm(m.f.ФИО_УПРАВЛЯЮЩЕГО)==norm(d.АУ.ФИО)});if(mm&&!c.mgr)c.mgr=mm.id}
   q.status=res.status||'done';c.unc=un.filter(function(k){return typeof k=='string'});q.done=Date.now();ch=true;var nm=c.data.ДОЛЖНИК_НАИМЕНОВАНИЕ||c.data.НОМЕР_ДЕЛА||'';if(A.toast)A.toast(q.status=='done'||q.status=='partial'?DU('filled',{n:nm}):DU('req_'+q.status)+' · '+nm);
   for(var p=0;p<(res.participants||[]).length;p++){var pp=res.participants[p];if(!pp.name)continue;var rr={applicant:'creditor',creditor:'creditor',authority:'creditor',third_party:'other',other:'other'}[pp.role]||'other';await upsert({name:pp.name,inn:pp.inn||'',ogrn:pp.ogrn||'',addr_legal:pp.address||'',roles:[rr],cases:[c.id],src:'kad'})}}
  else{var r2=await ghApi((cfg.requests||'arbitr/debtor_requests/')+q.id+'.json');if(r2.ok){var j2=await r2.json(),b=JSON.parse(decodeURIComponent(escape(atob(String(j2.content||'').replace(/\s/g,'')))));if(b.status&&b.status!=q.status&&/^(new|in_progress|error|not_found)$/.test(b.status)){q.status=b.status;q.eta=b.eta_minutes||null;ch=true}}}}catch(e){}}
 if(ch){A.save();if(V=='list')draw();A.refresh()}}
function pollStart(){if(POLL)return;POLL=setInterval(function(){if(document.visibilityState=='visible')pollReqs()},60000);setTimeout(pollReqs,3000)}

/* ---------- API для «Документов» ---------- */
window.ArbCP={
 mount:function(el,api){A=api;ROOT=el;bind(el);load()},
 reset:function(){CP=[];FM={};ED=null;MAP=null;V='list';MSG='';draw()},
 redraw:function(){if(V=='list')draw()},editMgr:editMgr,ensureBanks:function(){return ensureBanks(false).then(function(n){if(n)draw();return n})},dirLoad:dirLoad,dirPick:dirPick,dirOrgs:dirOrgs,dirVal:dirVal,orgLine:orgLine,dirOrg:function(i){return AD&&AD.orgs[i]},addrLoad:addrLoad,combo:combo,suggest:suggest,cbField:cbField,regChecked:regChecked,inRegs:inRegs,orgOk:orgOk,regMap:regMap,pollReqs:pollReqs,pollStart:pollStart,openSec:function(id,sub){V='list';SEC=id;if(sub=='add'){DADD={};V='dadd'}draw()},debHay:debHay,debLine:debLine,extractCase:extractCase,
 list:function(){return CP},
 /* карточки с ролью из списка; привязанные к делу — первыми */
 pick:function(rs,caseId,ks){return CP.filter(function(c){return (!rs||!rs.length)&&!(ks&&ks.length)||(c.roles||[]).some(function(r){return (rs||[]).indexOf(r)>=0})||(ks||[]).indexOf(c.kind)>=0}).sort(function(a,b){var x=(a.cases||[]).indexOf(caseId)>=0?0:1,y=(b.cases||[]).indexOf(caseId)>=0?0:1;return x-y||String(a.name).localeCompare(String(b.name),'ru')})},
 byName:function(n){var q=norm(n);return CP.find(function(c){return norm(c.name)==q})||null},
 get:function(id){return CP.find(function(c){return c.id==id})||null},
 linkDebtor:async function(id,caseId){var c=CP.find(function(x){return x.id==id});if(!c)return null;if((c.roles||[]).indexOf('debtor_main')<0)(c.roles=c.roles||[]).push('debtor_main');if(caseId&&(c.cases||[]).indexOf(caseId)<0)(c.cases=c.cases||[]).push(caseId);await save1(c);draw();return c},
 importCases:function(fs){return importFiles(fs,'case')},exportCases:exportCases,
 quickAdd:async function(o){var c=Object.assign(blank(),o);c.kind=guessKind(c);await save1(c);draw();return c},
 _t:{ed807:ed807,bikCsv:bikCsv,csv:csv,vcf:vcf,extract:extract,innOK:innOK,xlsx:xlsx}
};
})();
