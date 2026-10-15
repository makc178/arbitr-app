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
function vList(){var R=roles(),vs=visible(),cur=A.S().cur;
 var h='<p class="sm">'+E(K().help||'')+'</p><div class="dact dcpbar"><button type="button" class="lbtn" data-cp="new">'+E(U('add'))+'</button><label class="lbtn sec dfile">'+E(U('import'))+'<input type="file" id="dcpup" accept=".csv,.xlsx,.json,.vcf,.pdf,.docx,.txt,text/csv,application/json,text/vcard" multiple hidden></label><label class="lbtn sec dfile">'+E(U('bik_import'))+'<input type="file" id="dcpbik" accept=".xml,.zip,.csv,text/xml,application/zip,text/csv" hidden></label>'+
  (CP.length?'<button type="button" class="lbtn sec" data-cp="exj">'+E(U('export_json'))+'</button><button type="button" class="lbtn sec" data-cp="exc">'+E(U('export_csv'))+'</button>':'')+'</div><p class="sm">'+E(U('import_help'))+'</p><p class="sm">'+E(U('bik_help'))+'</p>'+(MSG?'<p class="sm dok" id="dcpmsg">'+E(MSG)+'</p>':'');
 if(CP.length){h+='<div class="pflt dflt"><input type="search" id="dcpq" placeholder="'+E(U('search'))+'" value="'+E(Q)+'"></div><div class="dchips"><button type="button" class="pchip'+(FLT?'':' on')+'" data-cpr="">'+E(U('all'))+'</button>'+Object.keys(R).filter(function(r){return CP.some(function(c){return (c.roles||[]).indexOf(r)>=0})}).map(function(r){return '<button type="button" class="pchip'+(FLT==r?' on':'')+'" data-cpr="'+E(r)+'">'+E(R[r])+'</button>'}).join('')+'</div>'+
  (function(){var ks=Object.keys(kinds()).filter(function(k){return CP.some(function(c){return c.kind==k})});return ks.length>1?'<div class="dchips"><button type="button" class="pchip'+(KF?'':' on')+'" data-cpk="">'+E(U('kinds_all'))+'</button>'+ks.map(function(k){var n=CP.filter(function(c){return c.kind==k}).length;return '<button type="button" class="pchip'+(KF==k?' on':'')+'" data-cpk="'+k+'">'+E((K().kinds_short||{})[k]||kinds()[k])+' <b>'+n+'</b></button>'}).join('')+'</div>':''})()+
  (cur?'<label class="dchk"><input type="checkbox" id="dcponly"'+(ONLY?' checked':'')+'> '+E(U('this_case'))+'</label>':'');
  var all=vs.length;vs=vs.slice(0,LIM);h+=all>LIM||all>20?'<p class="sm">'+E(U('shown',{a:vs.length,b:all}))+'</p>':'';h+=vs.length?vs.map(function(c){var rs=(c.roles||[]).map(function(r){return R[r]||r}).join(', ');return '<div class="lot dit dcp" data-cpid="'+E(c.id)+'" role="button" tabindex="0"><div class="d1">'+E(c.name||'—')+'</div><div class="sm">'+E([(kinds()[c.kind]||''),c.kind=='bank'&&c.bik?'БИК '+c.bik:'',c.inn?'ИНН '+c.inn:'',rs].filter(Boolean).join(' · '))+'</div><div class="sm dkind">'+E([U('n_cases',{n:(c.cases||[]).length}),(c.files||[]).length?U('n_files',{n:c.files.length}):''].filter(Boolean).join(' · '))+'</div></div>'}).join('')+(all>LIM?'<button type="button" class="lbtn sec" data-cp="more">'+E(U('more',{n:Math.min(100,all-LIM)}))+'</button>':''):'<div class="empty">'+E(U('nothing'))+'</div>'}
 else h+='<div class="empty">'+E(U('empty'))+'</div>';
 return h}
/* ---------- карточка ---------- */
function vEdit(){var c=ED,R=roles(),KD=kinds(),L=K().inn_lookup||{},cs=A.S().cases;
 var h='<h4 class="dsh">'+E(c._new?U('new'):U('edit'))+'</h4>'+(c._extract?'<p class="sm dok">'+E(U('extract_title',{name:c._extract}))+'</p><p class="sm">'+E(c._found?U('extract_help'):U('extract_none'))+'</p>':'')+
 '<div class="g2"><div><label for="dcp_kind">'+E(U('kind'))+'</label><select id="dcp_kind" data-cf="kind">'+Object.keys(KD).map(function(k){return '<option value="'+k+'"'+(c.kind==k?' selected':'')+'>'+E(KD[k])+'</option>'}).join('')+'</select></div>'+
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
function draw(){if(!ROOT)return;ROOT.innerHTML=V=='edit'?vEdit():V=='map'?vMap():vList();var c=$c('dcpcount');}
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
 el.addEventListener('input',function(e){var i=e.target;if(i.id=='dcpq'){Q=i.value;LIM=100;rerenderKeepFocus();return}if(i.dataset.cf&&ED){ED[i.dataset.cf]=i.value}});
 el.addEventListener('change',async function(e){var i=e.target;
  if(i.id=='dcpbik'){var bf=i.files[0];i.value='';if(bf)await importBik(bf);return}
  if(i.id=='dcpup'){var fs=[].slice.call(i.files);i.value='';await importFiles(fs);return}
  if(i.id=='dcpatt'&&ED){[].forEach.call(i.files,function(f){PEND.push(f)});draw();return}
  if(i.id=='dcponly'){ONLY=i.checked;draw();return}
  if(i.dataset.cf&&ED){ED[i.dataset.cf]=i.value;return}
  if(i.dataset.crole&&ED){var r=i.dataset.crole;ED.roles=(ED.roles||[]).filter(function(x){return x!=r});if(i.checked)ED.roles.push(r);return}
  if(i.dataset.ccase&&ED){var c=i.dataset.ccase;ED.cases=(ED.cases||[]).filter(function(x){return x!=c});if(i.checked)ED.cases.push(c);return}
  if(i.dataset.map!=null&&MAP){MAP.map[+i.dataset.map]=i.value;return}if(i.id=='dcpmrole'&&MAP){MAP.role=i.value;return}if(i.id=='dcpmlink'&&MAP){MAP.link=i.checked;return}});
 el.addEventListener('click',async function(e){var b=e.target.closest('[data-cp],[data-cpr],[data-cpk],[data-cpid],[data-cpfget],[data-cpfdel]');if(!b)return;var d=b.dataset;
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
 el.addEventListener('keydown',function(e){var t=e.target.closest&&e.target.closest('[data-cpid]');if(t&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}})}
/* ---------- API для «Документов» ---------- */
window.ArbCP={
 mount:function(el,api){A=api;ROOT=el;bind(el);load()},
 reset:function(){CP=[];FM={};ED=null;MAP=null;V='list';MSG='';draw()},
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
