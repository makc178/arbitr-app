/* Arbitr App — раздел «Документы». Шаблоны: window.ARB_DOCS (documents/index.json), настройки: window.ARB_DOCS_CFG.
   Персональные данные (профиль управляющего, дела, черновики) хранятся ТОЛЬКО в localStorage этого устройства и никуда не отправляются. */
(function(){
var C,X,F={},S,CUR=null,FLT='',Q='',LS='arbitr_docs_v1',OV=null,BSEL=new Set(),DXC={};
var $=function(i){return document.getElementById(i)};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function U(k,o){var s=(C.ui||{})[k]||k;if(o)Object.keys(o).forEach(function(n){s=s.split('{'+n+'}').join(o[n])});return s}
/* «сегодня» — по часам устройства в зоне Europe/Moscow (config date_tz), в момент вывода; в черновик не записывается */
function todayISO(){var d=new Date();try{var p=new Intl.DateTimeFormat('en-CA',{timeZone:(window.ARB_DOCS_CFG||{}).date_tz||'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d),g=function(t){return (p.find(function(x){return x.type==t})||{}).value};if(g('year'))return g('year')+'-'+g('month')+'-'+g('day')}catch(e){}return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function DATEF(){var c=window.ARB_DOCS_CFG||{},x=window.ARB_DOCS||{},L=c.date_default=='today'?(c.date_today_fields||['ДАТА']).slice():[];Object.keys(x.fields||{}).forEach(function(k){var f=x.fields[k];if(f&&f.default=='today'&&L.indexOf(k)<0)L.push(k);if(f&&f.default&&f.default!='today'){var i=L.indexOf(k);if(i>=0)L.splice(i,1)}});return L}
/* дата документа по умолчанию — сегодня; введённая вручную дата живёт до конца дня, на следующий день снова «сегодня» */
function load(){var s={};try{s=JSON.parse(localStorage.getItem(LS))||{}}catch(e){}s.profile=s.profile||{};s.cases=s.cases||[];s.drafts=s.drafts||{};try{var MG=((window.ARB_DOCS_CFG||{}).field_migrations)||{};Object.keys(MG).forEach(function(tid){var d=s.drafts[tid];if(!d||tid.charAt(0)=='_')return;Object.keys(MG[tid]).forEach(function(o){if(o=='НОМЕР_ИФНС'&&d[o]!=null&&!/[А-Яа-яЁё]/.test(String(d[o]))){delete d[o];return}if(d[o]!=null){if(d[MG[tid][o]]==null||d[MG[tid][o]]==='')d[MG[tid][o]]=d[o];delete d[o]}})})}catch(e){}
 var td=todayISO(),DF=DATEF();if(DF.length&&s.dday!=td){Object.keys(s.drafts).forEach(function(t){DF.forEach(function(k){delete s.drafts[t][k]})});if(s.bvals)Object.keys(s.bvals).forEach(function(t){DF.forEach(function(k){if(s.bvals[t])delete s.bvals[t][k]})});s.dday=td}return s}
/* d5: карточки должников (дела) хранятся только зашифрованными ключом PIN (IndexedDB managers/_cases); в localStorage — без дел */
var CREADY=false,CST=0;
function save(){try{var o=Object.assign({},S),sp=secSplit(S.drafts);o.drafts=sp.pub;if(CREADY||S.casesEnc){o.cases=[];o.casesEnc=1}else o.cases=stripCaseEnc(S.cases);localStorage.setItem(LS,JSON.stringify(o));secSaveSoon(sp.sec)}catch(e){}if(CREADY)casesSaveSoon()}
function casesSaveSoon(){clearTimeout(CST);CST=setTimeout(casesSave,200)}
async function casesSave(){if(!CREADY||!encOK())return;try{await ArbDB.put('managers',{id:'_cases',c:await ArbArch.enc(new TextEncoder().encode(JSON.stringify(S.cases)))})}catch(e){}}
async function casesLoad(){if(!encOK())return;var L=[];try{var r=await ArbDB.get('managers','_cases');if(r&&r.c)L=JSON.parse(new TextDecoder().decode(await ArbArch.dec(r.c)))}catch(e){return}
 (S.cases||[]).forEach(function(c){if(!L.some(function(x){return x.id==c.id}))L.push(c)});S.cases=L;try{v7Migrate({cases:L,drafts:{}})}catch(e){}S.casesEnc=1;CREADY=true;await secLoad();save();await casesSave();
 if(window.ArbCP&&ArbCP.pollStart)ArbCP.pollStart();refreshAll()}
function reqSalt(){var k='arbitr_req_salt',v=localStorage.getItem(k);if(!v){var b=crypto.getRandomValues(new Uint8Array(16));v=btoa(String.fromCharCode.apply(null,b));try{localStorage.setItem(k,v)}catch(e){}}return v}
/* ===== Бланки, подписи и встроенный профиль АУ =====
   Встроенные данные АУ (профиль, бланки, подписи) лежат в ЗАКРЫТОМ репозитории в зашифрованном виде (AES-GCM, ключ из PIN через PBKDF2)
   и расшифровываются в памяти только после ввода PIN. Загруженные вручную бланки и подписи хранятся только на устройстве (IndexedDB). */
var LH=[],SIG=[],AU={profile:null,pin:null,keys:{},state:'',lh:[],sig:[]},OBJ={},MGR=[],DEVM={},LEG=null,MST={dev:false};
var WNS='http://schemas.openxmlformats.org/wordprocessingml/2006/main',BR=/\[[^\[\]]{1,60}\]/g;
function LC(){return C.letterhead||{}}
function GC(){return C.signature||{}}
function LU(k,o){var x=LC()[k]||GC()[k]||k;if(o)Object.keys(o).forEach(function(n){x=x.split('{'+n+'}').join(o[n])});return x}
function b64u8(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})}
async function auKey(salt,it){var id=salt+':'+it;if(AU.keys[id])return AU.keys[id];var k0=await crypto.subtle.importKey('raw',new TextEncoder().encode(AU.pin),'PBKDF2',false,['deriveKey']);
 return AU.keys[id]=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:b64u8(salt),iterations:it},k0,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function ghRaw(path){var tk=(typeof TOKEN!='undefined'&&TOKEN)||'',rp=(typeof REPO!='undefined'&&REPO)||(C.au_vault||{}).repo;if(!tk||!rp)throw new Error('нет доступа');
 var r=await fetch('https://api.github.com/repos/'+rp+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref=main&_='+Date.now(),{headers:{Authorization:'Bearer '+String(tk).trim(),Accept:'application/vnd.github.raw+json'},cache:'no-store'});
 if(!r.ok)throw new Error('GitHub '+r.status);return r.text()}
async function vdec(txt){var j=JSON.parse(txt),k=await auKey(j.s,j.it);return crypto.subtle.decrypt({name:'AES-GCM',iv:b64u8(j.iv)},k,b64u8(j.ct))}
async function auLoad(){var V=C.au_vault||{};if(!V.path||!AU.pin)return;AU.state='loading';
 for(var i=0;i<120&&!(typeof TOKEN!='undefined'&&TOKEN);i++)await new Promise(function(r){setTimeout(r,500)});
 try{var man=JSON.parse(new TextDecoder().decode(await vdec(await ghRaw(V.path+V.manifest))));AU.profile=man.profile||null;
  for(var a=0;a<(man.letterheads||[]).length;a++){var l=man.letterheads[a];try{var d=await vdec(await ghRaw(V.path+l.file));AU.lh=AU.lh.filter(function(x){return x.id!=l.id});AU.lh.push(await lhMeta({id:l.id,name:l.name,type:l.type,builtin:true,data:d,size:d.byteLength,added:0}))}catch(e){}}
  for(var b=0;b<(man.signatures||[]).length;b++){var g=man.signatures[b];try{var sd=await vdec(await ghRaw(V.path+g.file));AU.sig=AU.sig.filter(function(x){return x.id!=g.id});AU.sig.push(await sigMeta({id:g.id,name:g.name,builtin:true,data:sd,order:b}))}catch(e){}}
  AU.state='ok'}catch(e){AU.state='none'}
 AU.pin=null;AU.done=true;mgrCompose();mgrMigrate()}
window.__arbPin=function(pin){AU.pin=String(pin);AU.keys={};auKey(reqSalt(),600000).catch(function(){});if(window.ArbArch)ArbArch.unlock(String(pin)).then(function(){outSync();return casesLoad()}).then(function(){drawCases();return mgrLoadDev()}).catch(function(){});auLoad()};
function TB(){return (C.manager||{}).todo_blocking!==false}
/* незаполненный номер дома «[__]»: если блокировка выключена (todo_blocking=false) — фрагмент просто убирается из адреса */
function clA(v){v=String(v==null?'':v);if(TB())return v;return v.replace(/,?\s*д\.\s*\[__\]/g,'').replace(/,?\s*\[кв[^\]]*\]/g,'').replace(/\s*\[__\]/g,'').replace(/\s{2,}/g,' ').replace(/,\s*,/g,',').trim()}
function prof(k){var m=curMgr();return m&&clA(m.f[k])||''}
/* --- бланки --- */
function lhGuess(n){n=String(n).toLowerCase();var t=(LC().types||[]).find(function(t){return (t.keywords||[]).some(function(k){return n.indexOf(k)>=0})});return t?t.k:'any'}
function paras(doc){return [].slice.call(doc.getElementsByTagNameNS(WNS,'p'))}
function ptext(p){return [].slice.call(p.getElementsByTagNameNS(WNS,'t')).map(function(t){return t.textContent}).join('')}
/* замена совпадений в тексте абзаца, даже если оно разбито на несколько w:t */
function editPara(p,re,fn){var ts=[].slice.call(p.getElementsByTagNameNS(WNS,'t')),full=ts.map(function(t){return t.textContent}).join(''),m,ms=[],ch=0;re.lastIndex=0;while((m=re.exec(full)))ms.push([m.index,m.index+m[0].length,m[0]]);
 for(var i=ms.length-1;i>=0;i--){var r=fn(ms[i][2],i);if(r==null)continue;ch=1;var st=ms[i][0],en=ms[i][1],off=0,put=false;
  ts.forEach(function(t){var tx=t.textContent,a=off,b=off+tx.length;off=b;if(b<=st||a>=en)return;var s0=Math.max(st,a)-a,e0=Math.min(en,b)-a;t.textContent=tx.slice(0,s0)+(put?'':r)+tx.slice(e0);put=true;t.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve')})}
 return ch}
async function lhParts(z){return Object.keys(z.files).filter(function(n){return /^word\/(header|footer)\d*\.xml$/.test(n)}).sort()}
async function lhMeta(r){var z=await JSZip.loadAsync(r.data.slice(0));if(!z.file('word/document.xml'))throw new Error('bad');var ps=await lhParts(z),f=[];
 for(var i=0;i<ps.length;i++){var d=new DOMParser().parseFromString(await z.file(ps[i]).async('string'),'application/xml'),n=0;paras(d).forEach(function(p){var full=ptext(p),m;BR.lastIndex=0;while((m=BR.exec(full)))f.push({key:ps[i]+':'+(n++),ctx:(m.index>34?'…'+full.slice(m.index-34,m.index).replace(/^\S*\s/,''):full.slice(0,m.index))+m[0]})})}
 r.fields=f;return r}
async function lhLoadLocal(){if(!window.ArbDB)return;var L={lh:[],sig:[]};try{var a=await ArbDB.all('letterheads');for(var i=0;i<a.length;i++){try{L.lh.push(await lhMeta(a[i]))}catch(e){}}}catch(e){}
 try{var s=await ArbDB.all('signatures');for(var j=0;j<s.length;j++)L.sig.push(await sigMeta(s[j]))}catch(e){}LEG=L;mgrMigrate()}
async function lhAdd(f,m){var buf=await f.arrayBuffer(),r={id:ArbDB.uid('lh'),name:f.name.replace(/\.docx$/i,''),size:f.size,type:lhGuess(f.name),added:Date.now(),data:buf};
 try{await lhMeta(r)}catch(e){throw new Error(LU('bad_file',{name:f.name}))}m.lh.push(r)}
function lhType(l){return ((EDM||curMgr()||{}).lhT||{})[l.id]||l.type}
function lhFor(t,ch){if(OV&&!OV.blank)return null;curMgr();ch=ch||(S.lh||{})[t.id]||'auto';if(ch=='none')return null;if(ch!='auto'){var x=LH.find(function(l){return l.id==ch});if(x)return x}
 var want=(LC().by_kind||{})[t.kind]||'any';return LH.find(function(l){return lhType(l)==want})||LH.find(function(l){return lhType(l)=='any'})||LH[0]||null}
function lhSel(t){var a=lhFor(t,'auto'),ch=(S.lh||{})[t.id]||'auto';return '<div class="dcrow"><label for="dflh">'+E(LU('pick'))+'</label><select id="dflh"><option value="auto"'+(ch=='auto'?' selected':'')+'>'+E(a?LU('auto',{name:a.name}):LU('auto_none'))+'</option>'+LH.map(function(l){return '<option value="'+E(l.id)+'"'+(ch==l.id?' selected':'')+'>'+E(l.name)+'</option>'}).join('')+'<option value="none"'+(ch=='none'?' selected':'')+'>'+E(LU('none'))+'</option></select></div>'}
function drawLH(m){var T=LC().types||[],V=m.lhv||{};
 return '<h4 class="dsh">'+E(LU('title'))+'</h4><p class="sm">'+E(LU('help'))+'</p><label class="fdrop dlhdrop"><input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple id="dmlhup"><span>'+E(LU('upload'))+'</span></label><p class="sm" id="dlhm"></p>'+
 m.lh.map(function(l){var vv=V[l.id]||{},ty=(m.lhT||{})[l.id]||l.type;return '<div class="lot dlhit"><div class="d1">'+E(l.name)+' <span class="sm">'+(l.builtin?E(LU('builtin')):Math.round(l.size/1024)+' КБ')+'</span></div><div class="dcrow"><label for="dlht_'+E(l.id)+'">'+E(LU('type_label'))+'</label><select id="dlht_'+E(l.id)+'" data-lht="'+E(l.id)+'">'+T.map(function(t){return '<option value="'+E(t.k)+'"'+(t.k==ty?' selected':'')+'>'+E(t.label)+'</option>'}).join('')+'</select></div>'+
  (l.fields.length?'<div class="sm"><b>'+E(LU('fields_title'))+'</b></div><div class="g2">'+l.fields.map(function(f,i){return '<div><label for="dlhf_'+E(l.id)+'_'+i+'">'+E(f.ctx)+'</label><input id="dlhf_'+E(l.id)+'_'+i+'" data-lhf="'+E(l.id)+'" data-fk="'+E(f.key)+'" value="'+E(vv[f.key]||'')+'" autocomplete="off"></div>'}).join('')+'</div>':'')+
  (l.builtin?'':'<p><button type="button" class="lbtn sec" data-lhdel="'+E(l.id)+'">'+E(LU('del'))+'</button></p>')+'</div>'}).join('')+'<p class="sm">'+E(LU('marker_help'))+'</p>'}
/* d6: компоновка шапки бланка по размерам Дизайнера (letterhead.layout): логотип, кегли строк, тонкая линейка, отступ до текста */
function LYC(){return LC().layout||{}}
function lyOn(l){var a=LYC().apply_to||'none';return a=='all'||(a=='builtin'&&l&&l.builtin)}
function lySz(r,pt){var v=Math.round(pt*2);r=r.replace(/<w:sz w:val="\d+"\/>/g,'<w:sz w:val="'+v+'"/>').replace(/<w:szCs w:val="\d+"\/>/g,'<w:szCs w:val="'+v+'"/>');if(!/<w:sz /.test(r))r=r.replace(/<w:rPr>/,'<w:rPr><w:sz w:val="'+v+'"/><w:szCs w:val="'+v+'"/>');return r}
function lyHeader(x){var L=LYC(),k=0;
 if(L.logo_h_mm)x=x.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g,function(d){var e=d.match(/<wp:extent cx="(\d+)" cy="(\d+)"/);if(!e)return d;var f=L.logo_h_mm*36000/+e[2];if(!(f>0)||Math.abs(f-1)<.01)return d;return d.replace(/(<(?:wp:extent|a:ext) cx=")(\d+)(" cy=")(\d+)(")/g,function(m,a,cx,b,cy,c){return a+Math.round(+cx*f)+b+Math.round(+cy*f)+c})});
 return x.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){var txt=(p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(t){return t.replace(/<[^>]+>/g,'')}).join('').trim();
  if(/<w:pBdr>/.test(p)&&L.rule_pt){return p.replace(/(<w:(?:bottom|top) [^>]*w:sz=")(\d+)(")/g,function(m,a,v,b){return a+Math.round(L.rule_pt*8)+b})}
  if(!txt||/<w:drawing>/.test(p))return p;var i=k++,pt=i==0?L.fio_pt:i==1?L.status_pt:L.req_pt;if(!pt)return p;
  return p.replace(/<w:r[ >][\s\S]*?<\/w:r>/g,function(r){if(!/<w:t[ >]/.test(r))return r;if(!/<w:rPr>/.test(r))r=r.replace(/(<w:r[^>]*>)/,'$1<w:rPr></w:rPr>');r=lySz(r,pt);if(i==0&&L.fio_bold!==false&&!/<w:b\/>/.test(r))r=r.replace(/<w:rPr>/,'<w:rPr><w:b/>');if(i>=2&&L.req_color)r=/<w:color /.test(r)?r.replace(/<w:color w:val="\w+"\/>/,'<w:color w:val="'+L.req_color+'"/>'):r.replace(/<w:rPr>/,'<w:rPr><w:color w:val="'+L.req_color+'"/>');return r})})}
function lyDoc(x){var L=LYC();if(!L.header_max_h_mm)return x;var hd=Math.round((L.header_offset_mm||11)*56.7),top=Math.round(((L.header_max_h_mm||22)+(L.gap_mm||6))*56.7);
 return x.replace(/<w:pgMar [^>]*\/>/g,function(m){return m.replace(/w:top="\d+"/,'w:top="'+top+'"').replace(/w:header="\d+"/,'w:header="'+hd+'"')})}
/* d6 hotfix: строка реквизитов бланка — индекс+город+адрес с новой строки после «член СРО …»; город не переносится (U+2011 в дефисе, U+00A0 после «г.» и после индекса), адрес переносится только после запятых. letterhead.layout.address_line */
function lyAddrGlue(t){return t.replace(/([А-Яа-яЁё])-(?=[А-Яа-яЁё])/g,'$1\u2011').replace(/([^,])[ \t]+/g,'$1\u00a0')}
function lyAddr(x){var A=LYC().address_line||{};if(A.enabled===false)return x;var IR=new RegExp(A.index_re||'(\\d{6}),\\s*(?=г\\.|[А-ЯЁ])'),MK=A.break_after_marker==null?'СРО':A.break_after_marker;
 return x.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){var full=(p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(t){return t.replace(/<[^>]+>/g,'')}).join(''),m=IR.exec(full);if(!m)return p;
  var brk=A.break_before_index!==false&&m.index>0&&(!MK||full.slice(0,m.index).indexOf(MK)>=0),seen=false;
  return p.replace(/(<w:t)(?:\s[^>]*)?>([^<]*)<\/w:t>/g,function(all,o,tx){if(seen)return '<w:t xml:space="preserve">'+lyAddrGlue(tx)+'</w:t>';var mm=IR.exec(tx);if(!mm)return all;seen=true;var pre=tx.slice(0,mm.index),post=tx.slice(mm.index);
   if(brk&&pre.trim()){pre=pre.replace(/[\s·,;–—-]+$/,'');return '<w:t xml:space="preserve">'+pre+'</w:t><w:br/><w:t xml:space="preserve">'+lyAddrGlue(post).replace(/^(\d{6}),[\s\u00a0]*/,'$1,\u00a0')+'</w:t>'}
   return '<w:t xml:space="preserve">'+pre+lyAddrGlue(post).replace(/^(\d{6}),[\s\u00a0]*/,'$1,\u00a0')+'</w:t>'})})}
async function lyZip(z,l){if(!lyOn(l))return z;var ps=await lhParts(z);for(var i=0;i<ps.length;i++){if(/header/.test(ps[i]))z.file(ps[i],lyHeader(await z.file(ps[i]).async('string')));if(/header|footer/.test(ps[i]))z.file(ps[i],lyAddr(await z.file(ps[i]).async('string')))}z.file('word/document.xml',lyDoc(await z.file('word/document.xml').async('string')));return z}
async function lhMerge(tz,l,t){var tx=await tz.file('word/document.xml').async('string'),tb=tx.slice(tx.indexOf('<w:body>')+8,tx.lastIndexOf('<w:sectPr'));
 if(LC().compact!==false)tb=tb.replace(/<w:p\/>(?=(<w:p[ >][\s\S]*?<\/w:p>)?)/g,function(m,nx){return nx&&/_{5,}/.test(nx.replace(/<[^>]+>/g,''))?m:''});
 var z=await lyZip(await JSZip.loadAsync(l.data.slice(0)),l),dx=await z.file('word/document.xml').async('string');
 var bo=dx.indexOf('<w:body'),bs=dx.indexOf('>',bo)+1,be=dx.lastIndexOf('</w:body>'),se=dx.lastIndexOf('<w:sectPr');if(se<bs||se>be)se=be;
 var body=dx.slice(bs,se),mk=LU('marker'),hit=false;
 body=body.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){if(hit)return p;var t=(p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(x){return x.replace(/<[^>]+>/g,'')}).join('');if(t.indexOf(mk)>=0){hit=true;return tb}return p});
 if(!hit)body=tb;dx=dx.slice(0,bs)+body+dx.slice(se);
 var ts=await tz.file('word/styles.xml').async('string'),ls=z.file('word/styles.xml')?await z.file('word/styles.xml').async('string'):null;
 if(ls){var need={};(tb.match(/w:(?:pStyle|tblStyle|rStyle) w:val="[^"]+"/g)||[]).forEach(function(m){need[m.replace(/.*w:val="([^"]+)"/,'$1')]=1});
  Object.keys(need).forEach(function(id){if(ls.indexOf('w:styleId="'+id+'"')>=0)return;var m=ts.match(new RegExp('<w:style [^>]*w:styleId="'+id+'"[\\s\\S]*?</w:style>'));if(m)ls=ls.replace('</w:styles>',m[0]+'</w:styles>')});
  var fn=LC().font;if(fn&&!/<w:rPrDefault>[\s\S]*?<w:rFonts/.test(ls)){var rf='<w:rFonts w:ascii="'+fn+'" w:hAnsi="'+fn+'" w:cs="'+fn+'" w:eastAsia="'+fn+'"/>';ls=/<w:rPrDefault>\s*<w:rPr>/.test(ls)?ls.replace(/<w:rPrDefault>\s*<w:rPr>/,function(m){return m+rf}):ls.replace('<w:docDefaults>','<w:docDefaults><w:rPrDefault><w:rPr>'+rf+'</w:rPr></w:rPrDefault>')}
  z.file('word/styles.xml',ls)}
 var vv=((curMgr()||{}).lhv||{})[l.id]||{},ps=['word/document.xml'].concat(await lhParts(z)),cm=curMgr(),SUB=[];
 /* реквизиты, «вшитые» во встроенный бланк, берутся из карточки управляющего (если там изменены) */
 if(cm&&cm.builtin&&AU.profile&&l.builtin)Object.keys(AU.profile).forEach(function(k){var o=String(AU.profile[k]||''),v=clA(cm.f[k]);if(o.length>=6&&v&&v!==o)SUB.push([new RegExp(o.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+(k=='АДРЕС_АУ'?'(?:,?\\s*\\[кв[^\\]]*\\])?':''),'g'),v])});
 /* адрес с незаполненным номером дома, «вшитый» в бланк, заменяется адресом из карточки */
 var ad=cm&&clA(cm.f.АДРЕС_АУ);if(ad&&ad.indexOf((C.manager||{}).todo_mark||'[__]')<0)SUB.push([/\d{6},[^·\n|]*?д\.\s*\[__\](?:,?\s*\[[^\]]*\])?/g,ad]);
 for(var i=0;i<ps.length;i++){var xml=i==0?dx:await z.file(ps[i]).async('string'),part=ps[i],ch=false;
  if(/\{\{|\[/.test(xml)||SUB.length){var d=new DOMParser().parseFromString(xml,'application/xml'),n=0;
   paras(d).forEach(function(p){if(i>0){var base=n,full=ptext(p),c=0;BR.lastIndex=0;while(BR.exec(full))c++;n+=c;
     SUB.forEach(function(r){if(editPara(p,r[0],function(){return r[1]}))ch=true});if(c&&editPara(p,BR,function(m,j){var v=vv[part+':'+(base+j)];return v?v:null}))ch=true}
    if(editPara(p,/\{\{([^{}]+)\}\}/g,function(m){var k=m.slice(2,-2);if('{{'+k+'}}'==mk)return null;var v=fmt(k,raw(k,t.id));return v||null}))ch=true});
   if(ch)xml=new XMLSerializer().serializeToString(d)}
  z.file(part,xml)}
 return z}
/* --- предпросмотр бланка (WYSIWYG): колонтитулы бланка из карточки управляющего --- */
async function lhPv(l){if(l._pv)return l._pv;var z=await lyZip(await JSZip.loadAsync(l.data.slice(0)),l),dx=await z.file('word/document.xml').async('string'),rl=z.file('word/_rels/document.xml.rels')?await z.file('word/_rels/document.xml.rels').async('string'):'',R={};
 (rl.match(/<Relationship [^>]*>/g)||[]).forEach(function(r){var id=(r.match(/Id="([^"]+)"/)||[])[1],tg=(r.match(/Target="([^"]+)"/)||[])[1];if(id&&tg)R[id]=tg.replace(/^\/?(word\/)?/,'')});
 var sp=dx.slice(dx.lastIndexOf('<w:sectPr')),ref=function(kind){var m=sp.match(new RegExp('<w:'+kind+'Reference [^>]*w:type="(default|first)"[^>]*r:id="([^"]+)"'))||sp.match(new RegExp('<w:'+kind+'Reference [^>]*r:id="([^"]+)"[^>]*w:type="(?:default|first)"'));if(!m)return null;return R[m[2]||m[1]]};
 var pm=sp.match(/<w:pgMar [^>]*>/),tw=function(a){var m=pm&&pm[0].match(new RegExp('w:'+a+'="(-?\\d+)"'));return m?+m[1]/56.7:20};
 async function part(fn){if(!fn||!z.file('word/'+fn))return [];var x=await z.file('word/'+fn).async('string'),rr=z.file('word/_rels/'+fn+'.rels')?await z.file('word/_rels/'+fn+'.rels').async('string'):'',PR={};
  (rr.match(/<Relationship [^>]*>/g)||[]).forEach(function(r){var id=(r.match(/Id="([^"]+)"/)||[])[1],tg=(r.match(/Target="([^"]+)"/)||[])[1];if(id&&tg)PR[id]=tg.replace(/^\.\.\//,'').replace(/^\/?(word\/)?/,'')});
  async function pp(p){var jc=(p.match(/<w:jc w:val="(\w+)"/)||[])[1]||'left',sz=(p.match(/<w:sz w:val="(\d+)"/)||[])[1],b=/<w:b\/>|<w:b w:val="(1|true)"/.test(p),col=(p.match(/<w:color w:val="([0-9A-Fa-f]{6})"/)||[])[1],im=[];
   var dr=p.match(/<w:drawing>[\s\S]*?<\/w:drawing>/g)||[];for(var j=0;j<dr.length;j++){var e=dr[j].match(/<wp:extent cx="(\d+)" cy="(\d+)"/),bl=(dr[j].match(/r:embed="([^"]+)"/)||[])[1],an=/<wp:anchor/.test(dr[j]),ah=(dr[j].match(/<wp:align>(\w+)<\/wp:align>/)||[])[1];if(!bl||!PR[bl]||!z.file('word/'+PR[bl]))continue;
    var ext=PR[bl].split('.').pop().toLowerCase(),blob=new Blob([await z.file('word/'+PR[bl]).async('arraybuffer')],{type:ext=='png'?'image/png':ext=='svg'?'image/svg+xml':'image/jpeg'});im.push({u:URL.createObjectURL(blob),w:e?+e[1]/36000:30,h:e?+e[2]/36000:15,anchor:an,al:ah})}
   var txt=(p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>|<w:tab\/>|<w:br\/>/g)||[]).map(function(t){return t=='<w:tab/>'?'\t':t=='<w:br/>'?'\n':t.replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&')}).join('');
   return (txt.trim()||im.length)?{t:txt,jc:jc,sz:sz?+sz/2:0,b:b,c:col,im:im}:null}
  /* d6: таблицы колонтитула (логотип слева, текст справа) — как в docx */
  var out=[],bl=x.match(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g)||[],rul=function(B){return +((B.match(/<w:bottom [^>]*w:sz="(\d+)"/)||[])[1]||4)/8};
  for(var i=0;i<bl.length;i++){var B=bl[i];
   if(/^<w:tbl>/.test(B)){var rows=[],trs=B.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g)||[];
    for(var r=0;r<trs.length;r++){var cs=[],tcs=trs[r].match(/<w:tc>[\s\S]*?<\/w:tc>/g)||[];
     for(var c=0;c<tcs.length;c++){var w=+((tcs[c].match(/<w:tcW w:w="(\d+)"/)||[])[1]||0),va=(tcs[c].match(/<w:vAlign w:val="(\w+)"/)||[])[1]||'top',it=[],cps=tcs[c].match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[];
      for(var k=0;k<cps.length;k++){var o=await pp(cps[k]);if(o)it.push(o)}cs.push({w:w,va:va,it:it})}
     rows.push(cs)}
    out.push({tbl:rows});continue}
   var o=await pp(B),hr=/<w:pBdr>[\s\S]*?<w:bottom /.test(B);if(o){if(hr)o.rule=rul(B);out.push(o)}else if(hr)out.push({t:'',im:[],rule:rul(B)})}
  return out}
 l._pv={h:await part(ref('header')),f:await part(ref('footer')),ml:tw('left'),mr:tw('right')};return l._pv}
function pvLine(x,t){if(x.tbl)return x.tbl.map(function(r){var tw=r.reduce(function(s,c){return s+(c.w||0)},0)||r.length;return '<div class="dlhrow">'+r.map(function(c){return '<div class="dlhc" style="flex:'+((c.w||1)/tw*100).toFixed(1)+' 1 0;align-self:'+(c.va=='center'?'center':c.va=='bottom'?'flex-end':'flex-start')+'">'+c.it.map(function(y){return pvLine(y,t)}).join('')+'</div>'}).join('')+'</div>'}).join('');
 if(x.rule!=null&&!x.t.trim()&&!x.im.length)return '<div class="dlhrule" style="border-bottom:'+Math.max(.5,x.rule).toFixed(2)+'pt solid currentColor"></div>';var v=x.t,cm=curMgr(),vv=(cm&&cm.lhv||{})[x._l]||{};
 if(cm&&cm.builtin&&AU.profile)Object.keys(AU.profile).forEach(function(k){var o=String(AU.profile[k]||''),n=clA(cm.f[k]);if(o.length>=6&&n&&n!==o)v=v.split(o).join(n).replace(k=='АДРЕС_АУ'?new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+',?\\s*\\[кв[^\\]]*\\]','g'):/$^/,n)});
 var ad=cm&&clA(cm.f.АДРЕС_АУ);if(ad&&ad.indexOf('[__]')<0)v=v.replace(/\d{6},[^·\n|]*?д\.\s*\[__\](?:,?\s*\[[^\]]*\])?/g,ad);
 v=v.replace(/\{\{([^{}]+)\}\}/g,function(m,k){return fmt(k,raw(k,t.id))||m});
 var st='text-align:'+(x.jc=='both'?'justify':x.jc=='center'?'center':x.jc=='right'||x.jc=='end'?'right':'left')+(x.sz?';font-size:'+(x.sz/12).toFixed(2)+'em':'')+(x.b?';font-weight:700':'')+(x.c&&x.c!='000000'?';color:#'+x.c:'');
 return '<div class="dlhl" style="'+st+'">'+x.im.map(function(i){return '<img src="'+i.u+'" alt="" style="height:'+(i.h/4.233).toFixed(2)+'em;width:auto;max-width:100%'+(i.anchor&&i.al=='right'?';float:right':i.anchor&&i.al=='left'?';float:left':'')+'">'}).join('')+E(v).replace(/\t/g,' &emsp; ').replace(/\n/g,'<br>')+'</div>'}
function pvWrap(l,t,body){var P=l._pv;if(!P)return body;return '<div class="dpage"><div class="dlhh">'+P.h.map(function(x){return pvLine(x,t)}).join('')+'</div><div class="dpbody">'+body+'</div><div class="dlhfoot">'+P.f.map(function(x){return pvLine(x,t)}).join('')+'</div></div>'}
/* d6: расчётные сроки (127-ФЗ, ТК, ГК ст. 191–193). Мета — только из index.json (template.computed / fields[k].computed) или резерва computed_deadlines.json; в коде смещений нет */
function DLC(){return C.deadlines||{}}
function DLU(k,o){var s=(DLC().ui||{})[k]||k;Object.keys(o||{}).forEach(function(x){s=s.split('{'+x+'}').join(o[x])});return s}
var DLU_UNITS={calendar_days:1,working_days:1,months:1,years:1,chain:1};
function dlBlock(t,k){if(!t)return null;if(t.computed&&Object.prototype.hasOwnProperty.call(t.computed,k))return t.computed[k];var xf=(X.fields||{})[k];if(xf&&Object.prototype.hasOwnProperty.call(xf,'computed')){var c=xf.computed;if(c&&c.templates&&c.templates.indexOf(t.id)<0)return null;return c}var cd=((X.computed_deadlines||{})[t.id]||{});return Object.prototype.hasOwnProperty.call(cd,k)?cd[k]:null}
function dlKey(s){return typeof s=='string'&&/^[А-ЯЁA-Z0-9_]+$/.test(s)}
/* статус: none | pending (Срок уточняется) | check (только проверка) | auto (заполняем) */
function dlStatus(t,k,b){if(DLC().enabled===false||!b)return 'none';if(b.scope&&b.scope!='document')return 'none';if(t&&rgOf(k,t))return 'none';if(b.verified===false||/проверить/i.test(String(b.status||'')))return 'pending';if(!b.direction||!DLU_UNITS[b.unit])return 'none';
 if(!dlKey(b.from))return 'none';var inT=t.fields.indexOf(b.from)>=0,fc=(F[b.from]||{}).scope=='case';if(!inT&&!fc)return 'none';if(t.fields.indexOf(k)<0)return 'none';
 if(b.hint_only||b.condition||SDF().indexOf(k)>=0)return 'check';return 'auto'}
function dISOd(s){var a=String(s).split('-');return new Date(Date.UTC(+a[0],+a[1]-1,+a[2]))}
function dISOs(d){return d.getUTCFullYear()+'-'+('0'+(d.getUTCMonth()+1)).slice(-2)+'-'+('0'+d.getUTCDate()).slice(-2)}
function dlWork(iso){var c=DLC().calendar||{};if((c.workdays||[]).indexOf(iso)>=0)return true;if((c.holidays||[]).indexOf(iso)>=0)return false;var w=dISOd(iso).getUTCDay();return w!=0&&w!=6}
function dlAddDays(iso,n){var d=dISOd(iso);d.setUTCDate(d.getUTCDate()+n);return dISOs(d)}
function dlAddMonths(iso,n){var a=iso.split('-').map(Number),m=a[1]-1+n,y=a[0]+Math.floor(m/12);m=((m%12)+12)%12;var last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return dISOs(new Date(Date.UTC(y,m,Math.min(a[2],last))))}
function dlAddWork(iso,n){var s=n<0?-1:1,c=Math.abs(n),d=iso;while(c>0){d=dlAddDays(d,s);if(dlWork(d))c--}return d}
function dlStep(iso,off,unit){off=+off||0;return unit=='calendar_days'?dlAddDays(iso,off):unit=='working_days'?dlAddWork(iso,off):unit=='months'?dlAddMonths(iso,off):unit=='years'?dlAddMonths(iso,12*off):null}
/* ст. 191–193 ГК: срок начинается на следующий день после события; «не позднее» +N → перенос на следующий рабочий; «за N дней до» (−N, not_after) → назад; «не ранее» → вперёд (не нарушение); exact — без переноса */
function dlCalc(b,fromISO){if(!b||!fromISO||!/^\d{4}-\d\d-\d\d$/.test(fromISO))return null;var r=fromISO,sgn=0;
 if(b.unit=='chain'){if(!Array.isArray(b.offset))return null;for(var i=0;i<b.offset.length;i++){var o=b.offset[i];r=dlStep(r,o.offset,o.unit);if(!r)return null;sgn=sgn||(+o.offset<0?-1:+o.offset>0?1:0)}}
 else{r=dlStep(r,b.offset,b.unit);if(!r)return null;sgn=+b.offset<0?-1:+b.offset>0?1:0}
 var raw0=r,sh=null;if(b.direction!='exact'&&sgn!==0&&b.unit!='working_days'&&!dlWork(r)){var back=b.direction=='not_after'&&sgn<0;while(!dlWork(r))r=dlAddDays(r,back?-1:1);sh=back?'back':'fwd'}
 return {iso:r,raw:raw0,shift:sh,dir:b.direction}}
function dlDiff(a,b){return Math.round((dISOd(a)-dISOd(b))/864e5)}
/* значение поля-источника: из шаблона/черновика/карточки должника (raw); никогда из запрещённых источников */
function dlFrom(t,b){var v=raw(b.from,t.id);v=String(v||'').trim();if(/^\d{2}\.\d{2}\.\d{4}$/.test(v))v=v.split('.').reverse().join('-');return /^\d{4}-\d\d-\d\d$/.test(v)?v:''}
function srcOk(k,src){var f=F[k]||(X.fields||{})[k]||{},ex=f.excluded_sources||[];if(ex.indexOf(src)>=0)return false;var nev=DLC().never_sources_for_deadline_inputs||['appraiser_db'];if(nev.indexOf(src)>=0&&dlFeeds(k))return false;return true}
function dlFeeds(k){var hit=false;(X.templates||[]).forEach(function(t){t.fields.forEach(function(f){var b=dlBlock(t,f);if(b&&b.from==k)hit=true})});var cd=X.computed_deadlines||{};Object.keys(cd).forEach(function(t){Object.keys(cd[t]||{}).forEach(function(f){var b=cd[t][f];if(b&&typeof b.from=='string'&&b.from.indexOf(k)>=0)hit=true})});return hit}
function dlAuto(t,k){var b=dlBlock(t,k);if(dlStatus(t,k,b)!='auto')return '';var f=dlFrom(t,b);if(!f)return '';var r=dlCalc(b,f);return r?r.iso:''}
var DOW=['вс','пн','вт','ср','чт','пт','сб'];
function dlUnitTxt(n,u){n=Math.abs(n);return u=='working_days'?pl(n,'рабочий день','рабочих дня','рабочих дней'):u=='months'?pl(n,'месяц','месяца','месяцев'):u=='years'?pl(n,'год','года','лет'):pl(n,'день','дня','дней')}
function dlBasis(b){return b.short||b.basis||b.norm||''}
function dlCaption(t,k){var b=dlBlock(t,k),st=dlStatus(t,k,b);if(st=='none')return null;var d=S.drafts[t.id]||{},manual=d[k]!=null&&String(d[k]).trim()!=='';
 if(st=='pending')return manual?null:{pending:1,txt:DLU('pending')};
 var f=dlFrom(t,b);if(!f)return manual?null:{pending:1,txt:DLU('pending')};var r=dlCalc(b,f);if(!r)return null;
 var cap=b.unit=='chain'?b.offset.map(function(o){return (+o.offset<0?'−':'+')+Math.abs(o.offset)+' '+dlUnitTxt(o.offset,o.unit)}).join(' ')+' · '+dlBasis(b):DLU('calc',{sign:+b.offset<0?'−':'+',n:Math.abs(+b.offset),unit:dlUnitTxt(+b.offset,b.unit),basis:dlBasis(b)});
 var sh=r.shift?DLU(r.shift,{d:r.raw.slice(8,10)+'.'+r.raw.slice(5,7),dow:DOW[dISOd(r.raw).getUTCDay()]}):'';
 var v=String(raw(k,t.id)||'');if(/^\d{2}\.\d{2}\.\d{4}$/.test(v))v=v.split('.').reverse().join('-');var warn='';
 if(/^\d{4}-\d\d-\d\d$/.test(v)){var df=dlDiff(v,r.iso);if(r.dir=='not_after'&&df>0)warn=DLU('late',{n:df,days:pl(df,'день','дня','дней')});if(r.dir=='not_before'&&df<0)warn=DLU('early',{n:-df,days:pl(-df,'день','дня','дней')})}
 return {txt:cap,shift:sh,manual:manual&&st=='auto',warn:warn,iso:r.iso,st:st,bound:st=='check'?DLU(r.dir=='not_before'?'bound_before':'bound_after',{d:r.iso.split('-').reverse().join('.')}):''}}
function dlDecorate(){try{cbDecorate()}catch(e){}if(!CUR||DLC().enabled===false)return;var t=CUR,ed=$('ded');if(!ed)return;
 [].forEach.call(ed.querySelectorAll('input[data-k][data-date]'),function(i){var k=i.dataset.k,w=i.closest('.ddate')||i,nx=w.nextElementSibling,cp=dlCaption(t,k);
  if(nx&&nx.classList&&nx.classList.contains('dlc'))nx.remove();i.classList.remove('dlwarn');if(!cp)return;
  if(cp.st=='auto'&&!cp.manual&&document.activeElement!==i){var want=cp.iso.split('-').reverse().join('.');if(i.value!==want)i.value=want}
  var h='<div class="dlc sm" data-dlk="'+E(k)+'">'+(DLC().sigma_icon?'<span class="dlsig" aria-hidden="true">∑</span> ':'')+E(cp.txt)+(cp.bound?' · '+E(cp.bound):'')+(cp.shift?' <span class="dlsh">'+E(cp.shift)+'</span>':'')+(cp.manual?' · <span class="dlman">'+E(DLU('manual'))+'</span> <button type="button" class="link dlrev" data-dlrev="'+E(k)+'">'+E(DLU('revert'))+'</button>':'')+(cp.warn?'<div class="dlw">'+E(cp.warn)+'</div>':'')+'</div>';
  w.insertAdjacentHTML('afterend',h);if(cp.warn)i.classList.add('dlwarn')})}
(function(){var tm;function go(){clearTimeout(tm);tm=setTimeout(dlDecorate,60)}
 document.addEventListener('input',function(e){if(e.target.closest&&e.target.closest('#ded'))go()},true);document.addEventListener('change',function(e){if(e.target.closest&&e.target.closest('#ded'))go()},true);
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-dlrev]');if(b&&CUR){e.preventDefault();var k=b.dataset.dlrev,d=S.drafts[CUR.id]=S.drafts[CUR.id]||{};delete d[k];save();var i=$('ded').querySelector('input[data-k="'+k+'"][data-date]');if(i){i.value='';i.dispatchEvent(new Event('input',{bubbles:true}))}delete d[k];save();dlDecorate();try{refreshPrev&&refreshPrev()}catch(x){}}});
 var mo=new MutationObserver(function(ms){if(ms.some(function(m){return !(m.target.closest&&m.target.closest('.dlc'))&&![].some.call(m.addedNodes,function(n){return n.classList&&n.classList.contains('dlc')})}))go()});
 var iv=setInterval(function(){var ed=document.getElementById('ded');if(ed){mo.observe(ed,{childList:true,subtree:true});clearInterval(iv)}},300)})();
/* --- подпись --- */
async function sigMeta(r){var bl=new Blob([r.data],{type:'image/png'});try{var im=await createImageBitmap(bl);r.w=im.width;r.h=im.height;im.close&&im.close()}catch(e){r.w=3;r.h=2}r.url=URL.createObjectURL(bl);return r}
function sigCur(){var id=(curMgr()||{}).sigSel;return SIG.find(function(s){return s.id==id})||SIG[0]||null}
/* d6: переключатель «Подпись: вкл / выкл» — последний выбор (S.sigPref), действует на превью, «Скачать» и «Сохранить» */
function sigPref(){return S.sigPref!==false}
function sigOn(t){return sigPref()&&!!sigCur()}
function drawSig(m){return '<h4 class="dsh">'+E(LU('sig_title'))+'</h4><p class="sm">'+E(LU('sig_help'))+'</p><label class="fdrop dlhdrop"><input type="file" accept="image/png" multiple id="dmsigup"><span>'+E(LU('sig_upload'))+'</span></label><p class="sm" id="dsigm"></p>'+
 (((C.au_card||{}).show_signature_images===true)?'':'<p class="sm"><b>'+E(LU('sig_count')=='sig_count'?'Подписей: '+m.sig.length:LU('sig_count').replace('{n}',m.sig.length))+'</b></p>')+'<div class="dsigs'+(((C.au_card||{}).show_signature_images===true)?'':' dsigtxt')+'">'+m.sig.map(function(s,i){var img=(C.au_card||{}).show_signature_images===true,dt=s.added?new Date(s.added):null,ds=dt?('0'+dt.getDate()).slice(-2)+'.'+('0'+(dt.getMonth()+1)).slice(-2)+'.'+dt.getFullYear():'';
  return '<div class="lot dsigit"><div class="dsigpick">'+(img?'<img src="'+s.url+'" alt="">':'<span class="dlock" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg></span>')+'<span class="sm">'+E(img?s.name:LU('sig_row2')=='sig_row2'?'Подпись '+(i+1)+(ds?' · добавлена '+ds:''):LU('sig_row2').replace('{i}',i+1).replace('{d}',ds))+'</span></div>'+
  (s.builtin?'':'<details class="dsigm"><summary aria-label="'+E(LU('sig_menu')=='sig_menu'?'Действия':LU('sig_menu'))+'">⋯</summary><div class="dsigmm"><label class="lbtn sec">'+E(LU('sig_rep')=='sig_rep'?'Заменить':LU('sig_rep'))+'<input type="file" accept="image/png" data-sigrep="'+E(s.id)+'" hidden></label><button type="button" class="lbtn sec adred" data-sigdel="'+E(s.id)+'">'+E(LU('sig_del'))+'</button></div></details>')+'</div>'}).join('')+'</div>'}
async function sigAdd(f,m){if(!/png$/i.test(f.type)&&!/\.png$/i.test(f.name))throw new Error(LU('sig_bad',{name:f.name}));var buf=await f.arrayBuffer(),r={id:ArbDB.uid('sg'),name:f.name.replace(/\.png$/i,''),data:buf,added:Date.now()};m.sig.push(await sigMeta(r))}
var SIGLINE=/_{5,}\s*\/\s*\{\{ФИО_УПРАВЛЯЮЩЕГО(?:_ИОФ)?\}\}\s*\//;
/* d6: строка подписи — дата у левого поля, справа «подпись / И. О. Фамилия» (одна строка, кегль основного текста). sign_line в config */
function SLC(){return C.sign_line||{}}
function iof(v){v=String(v||'').trim();var p=v.split(/\s+/);if(p.length<2||/[.]/.test(v))return v;return p.slice(1).map(function(x){return x.charAt(0).toUpperCase()+'.'}).join(' ')+' '+p[0]}
function sgMd(s){if(SLC().enabled===false)return s;var dk=SDF()[0]||'ДАТА';return String(s).replace(new RegExp('^([^\\n]*_{5,}\\s*\\/\\s*)\\{\\{ФИО_УПРАВЛЯЮЩЕГО\\}\\}(\\s*\\/[ \\t]*)\\n(?:[ \\t]*\\n)*[ \\t]*\\{\\{'+dk+'\\}\\}[ \\t]*$','m'),function(m,a,b){return '{{'+dk+'}}\t'+a.replace(/^\s+/,'')+(SLC().initials===false?'{{ФИО_УПРАВЛЯЮЩЕГО}}':'{{ФИО_УПРАВЛЯЮЩЕГО_ИОФ}}')+b.replace(/\s+$/,'')})}
function sgXml(x){if(SLC().enabled===false)return x;var dk=SDF()[0]||'ДАТА',ps=x.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[],tx=function(p){return (p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(y){return y.replace(/<[^>]+>/g,'')}).join('')};
 var si=-1;for(var i=0;i<ps.length;i++)if(/_{5,}\s*\/\s*\{\{ФИО_УПРАВЛЯЮЩЕГО\}\}\s*\/\s*$/.test(tx(ps[i]).trim())){si=i;break}if(si<0)return x;
 var di=-1;for(var j=si+1;j<ps.length&&j<si+4;j++){var tj=tx(ps[j]).trim();if(!tj)continue;if(tj=='{{'+dk+'}}')di=j;break}if(di<0)return x;
 var pg=x.match(/<w:pgSz [^>]*w:w="(\d+)"/),pm=x.match(/<w:pgMar [^>]*>/),mg=function(a){var m=pm&&pm[0].match(new RegExp('w:'+a+'="(\\d+)"'));return m?+m[1]:1134},pos=(pg?+pg[1]:11906)-mg('left')-mg('right');
 var P=ps[si],ppr=(P.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)||[''])[0],rpr=(P.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)||[''])[0],tab='<w:tabs><w:tab w:val="right" w:pos="'+pos+'"/></w:tabs>';
 ppr=ppr?ppr.replace(/<w:tabs>[\s\S]*?<\/w:tabs>/,'').replace('<w:pPr>','<w:pPr>'+tab).replace(/<w:jc w:val="\w+"\/>/,''):'<w:pPr>'+tab+'</w:pPr>';
 var sig=tx(P).trim().replace('{{ФИО_УПРАВЛЯЮЩЕГО}}',SLC().initials===false?'{{ФИО_УПРАВЛЯЮЩЕГО}}':'{{ФИО_УПРАВЛЯЮЩЕГО_ИОФ}}').replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g,'&amp;');
 var NP='<w:p>'+ppr+'<w:r>'+rpr+'<w:t>{{'+dk+'}}</w:t></w:r><w:r>'+rpr+'<w:tab/></w:r><w:r>'+rpr+'<w:t xml:space="preserve">'+sig+'</w:t></w:r></w:p>';
 var re=/<w:p[ >][\s\S]*?<\/w:p>/g,m,n=0,st=-1,en=-1;while((m=re.exec(x))){if(n==si)st=m.index;if(n==di){en=m.index+m[0].length;break}n++}if(st<0||en<0)return x;return x.slice(0,st)+NP+x.slice(en)}
var RGT=null;function RGX(){if(!RGT&&window.ArbRG)RGT=ArbRG({C:function(){return C},X:function(){return X},F:function(){return F},E:E,items:function(t,g){return rgItems(t,g)},raw:function(k,i){var p0=raw.pr;raw.pr=0;try{return raw(k,i)}finally{raw.pr=p0}},curCase:curCase,metas:function(){return window.ArbArch&&ArbArch.metas?ArbArch.metas():[]},tpl:tByIdQ,draftOf:function(i){return S.drafts[i]},dra:function(i){return DRA(i)},save:save,chVals:chValsOf,fieldOn:rgFieldOn,cur:function(){return CUR},dt:function(){return debtorType()},redraw:v7Redraw,open:function(i){openT(i)}});return RGT}
var RQT=null;function RQ_(){if(!RQT&&window.ArbReq)RQT=ArbReq({C:function(){return C},F:function(){return F},raw:function(k,i){var p0=raw.pr;raw.pr=0;try{return raw(k,i)}finally{raw.pr=p0}},off:function(t){return cbOffFields(t).concat(rgAll(t),TBown(t),ilFields(t).filter(function(k){return !(F[k]||{}).required}))},draft:function(i){return S.drafts[i]=S.drafts[i]||{}},rgReq:function(t){return RGX()?RGX().reqItems(t):[]},save:save,cur:function(){return CUR},fld:function(k,t){return fld(k,t)},toast:toast});return RQT}
var TBT=null;function TB_(){if(!TBT&&window.ArbTables)TBT=ArbTables({C:function(){return C},X:function(){return X},F:function(){return F},DRA:DRA,raw:function(k,i){var p0=raw.pr;raw.pr=0;try{return raw(k,i)}finally{raw.pr=p0}},fmt:fmt,xe:xe,E:E,inp:inp});return TBT}
function TBon(t){return !!(TB_()&&TB_().on(t))}function TBown(t){return TBon(t)?TB_().own(t):[]}
var LYT=null;function LY_(){if(!LYT&&window.ArbLayout)LYT=ArbLayout({C:function(){return C},pList:pList,sigPick:sigPick,SIGLINE:SIGLINE,raw:function(k,t){return t?raw(k,t.id):''}});return LYT}
/* подпись: выбор строки «____ / ФИО /» управляющего (по фамилии из профиля; иначе последняя строка подписи вне таблиц, иначе последняя) */
function pTxt(p){return (p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(x){return x.replace(/<[^>]+>/g,'')}).join('')}
function pList(dx){var o=[],re=/<w:p\/>|<w:p[ >][\s\S]*?<\/w:p>|<w:tbl>|<w:tbl |<\/w:tbl>/g,m,dep=0;while((m=re.exec(dx))){var s=m[0];if(s=='<w:tbl>'||s=='<w:tbl ')dep++;else if(s=='</w:tbl>')dep--;else o.push({s:s,i:m.index,tb:dep>0,t:pTxt(s)})}return o}
function sigLineRe(){return /_{5,}\s*\/[^\/]*\/\s*$/}
function sigPick(dx,t){var P=pList(dx),C=[];P.forEach(function(p,i){if(sigLineRe().test(p.t.trim()))C.push(i)});if(!C.length)return -1;var nm=t?String(raw('ФИО_УПРАВЛЯЮЩЕГО',t.id)||'').trim().split(/\s+/)[0]:'';
 if(nm&&nm.length>1){var hit=C.filter(function(i){return P[i].t.indexOf(nm)>=0});if(hit.length)return hit[hit.length-1]}var out=C.filter(function(i){return !P[i].tb});return out.length?out[out.length-1]:C[C.length-1]}
/* «не отрывать от следующего»: заголовок подписи и последний абзац текста уходят на страницу вместе со строкой подписи */
function sigKeep(dx,t){if(((C.signature||{}).keep_with_text)===false)return dx;var P=pList(dx),k=sigPick(dx,t);if(k<0||P[k].tb)return dx;var mark={},ne=0,lim=(C.signature||{}).keep_paras||2;
 for(var i=k-1;i>=0&&k-i<=8;i--){if(P[i].tb)break;mark[i]=1;if(P[i].t.trim()){ne++;if(ne>=lim)break}}
 var ids=Object.keys(mark).map(Number).sort(function(a,b){return b-a});ids.forEach(function(i){var p=P[i].s,q;if(/<w:keepNext\/>/.test(p))return;if(p=='<w:p/>'){q='<w:p><w:pPr><w:keepNext/></w:pPr></w:p>';dx=dx.slice(0,P[i].i)+q+dx.slice(P[i].i+p.length);return}
  if(/<w:pPr>/.test(p)||/<w:pPr /.test(p)){q=/<w:pStyle [^>]*\/>/.test(p)?p.replace(/(<w:pStyle [^>]*\/>)/,'$1<w:keepNext/>'):p.replace(/(<w:pPr(?: [^>]*)?>)/,'$1<w:keepNext/>')}else q=p.replace(/^(<w:p(?: [^>]*)?>)/,'$1<w:pPr><w:keepNext/></w:pPr>');
  dx=dx.slice(0,P[i].i)+q+dx.slice(P[i].i+p.length)});return dx}
async function sigApply(z,s,t){var G=GC(),hmm=G.height_mm||15,cy=Math.round(hmm*36000),cx=Math.round(cy*s.w/s.h),off=G.offset_mm||[4,-9];
 var dx=await z.file('word/document.xml').async('string'),ok=false,rid='rIdArbSig1';
 var TP=sigPick(dx,t),pi=-1;var dx0=dx;dx=dx.replace(/<w:p\/>|<w:p[ >][\s\S]*?<\/w:p>/g,function(p,po){pi++;if(ok||(TP>=0&&pi!=TP)||p=='<w:p/>')return p;var t=(p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(x){return x.replace(/<[^>]+>/g,'')}).join('');if(!/_{5,}\s*\/[^\/]*\/\s*$/.test(t.trim()))return p;ok=true;
  var pre=dx0.slice(0,po),inT=(pre.match(/<w:tbl[ >]/g)||[]).length>(pre.match(/<\/w:tbl>/g)||[]).length;if(inT&&G.table){var ts=G.table.scale||1;cy=Math.round(cy*ts);cx=Math.round(cx*ts);if(G.table.offset_mm)off=G.table.offset_mm}
  var tb=p.indexOf('<w:tab/></w:r>');if(tb>=0)t=t.replace(/^[^_]*(?=_{5,})/,'');var mu=/^(.*?)(_{5,})/.exec(t.trim())||['','',''],lw=mu[2].length*(G.underscore_mm||2.12),px=mu[1].length*(G.char_mm||2.3),ox=G.center_on_line===false?off[0]:px+Math.max(0,(lw-cx/36000)/2)+off[0];
  var run='<w:r><w:drawing><wp:anchor xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251659264" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="character"><wp:posOffset>'+Math.round(ox*36000)+'</wp:posOffset></wp:positionH><wp:positionV relativeFrom="line"><wp:posOffset>'+Math.round(off[1]*36000)+'</wp:posOffset></wp:positionV><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="9101" name="Подпись"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="9101" name="podpis.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>';
  if(tb>=0){var e=tb+'<w:tab/></w:r>'.length;return p.slice(0,e)+run+p.slice(e)}var m=p.match(/^<w:p[^>]*>(<w:pPr>[\s\S]*?<\/w:pPr>)?/);return m[0]+run+p.slice(m[0].length)});
 if(!ok)return false;z.file('word/document.xml',dx);z.file('word/media/arb_podpis.png',s.data.slice(0));
 var rp='word/_rels/document.xml.rels',rl=await z.file(rp).async('string');if(rl.indexOf('Id="'+rid+'"')<0)rl=rl.replace('</Relationships>','<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/arb_podpis.png"/></Relationships>');z.file(rp,rl);
 var ct=await z.file('[Content_Types].xml').async('string');if(!/Extension="png"/i.test(ct))ct=ct.replace('<Default ','<Default Extension="png" ContentType="image/png"/><Default ');z.file('[Content_Types].xml',ct);return true}
/* ===== Карточки управляющих (бывший «Профиль АУ»): поля, бланки и подписи. На устройстве — только в зашифрованном виде (AES-GCM, ключ из PIN).
   Встроенная карточка собирается в памяти из зашифрованного хранилища (au_vault); правки к ней тоже хранятся зашифрованными. ===== */
var EDM=null,MEL=null,MDONE=null,MST_T=0;
function MU2(k,o){var x=((C.manager||{}).ui||{})[k]||k;if(o)Object.keys(o).forEach(function(n){x=x.split('{'+n+'}').join(o[n])});return x}
function mgrName(m){return (m&&m.f.ФИО_УПРАВЛЯЮЩЕГО)||MU2('new')}
function curMgr(){var c=curCase(),id=(c&&c.mgr)||S.mgr,m=MGR.find(function(x){return x.id==id})||null;if(!m&&MGR.length)m=MGR[0];LH=m?m.lh:[];SIG=m?m.sig:[];return m}
function encOK(){return !!(window.ArbArch&&!ArbArch.locked())}
function newMgr(){return {id:ArbDB.uid('au'),f:{},fed:'',lhv:{},lhT:{},sigSel:'',lh:[],sig:[],created:Date.now()}}
async function mgrSave(m){if(!encOK())return;var base=m.builtin?(AU.profile||{}):{},f={};Object.keys(m.f).forEach(function(k){if((m.f[k]||'')!==(base[k]||''))f[k]=m.f[k]});
 var as=[],a={},own=function(x){return !x.builtin};
 for(var i=0;i<m.lh.length;i++){var l=m.lh[i];if(!own(l))continue;as.push({id:l.id,kind:'lh',name:l.name,type:l.type,size:l.size,added:l.added});a[l.id]=await ArbArch.enc(l.data.slice(0))}
 for(var j=0;j<m.sig.length;j++){var g=m.sig[j];if(!own(g))continue;as.push({id:g.id,kind:'sig',name:g.name,added:g.added});a[g.id]=await ArbArch.enc(g.data.slice(0))}
 var meta={id:m.id,builtin:!!m.builtin,f:f,fed:m.fed||'',lhv:m.lhv||{},lhT:m.lhT||{},sigSel:m.sigSel||'',assets:as,created:m.created||Date.now()};
 await ArbDB.put('managers',{id:m.id,m:await ArbArch.enc(new TextEncoder().encode(JSON.stringify(meta))),a:a});
 DEVM[m.id]=m.builtin?{id:m.id,builtin:true,f:f,fed:meta.fed,lhv:meta.lhv,lhT:meta.lhT,sigSel:meta.sigSel,lh:m.lh.filter(own),sig:m.sig.filter(own)}:m}
function mgrSaveSoon(m){clearTimeout(MST_T);MST_T=setTimeout(function(){mgrSave(m)},600)}
async function mgrLoadDev(){DEVM={};var all=[];try{all=await ArbDB.all('managers')}catch(e){}
 for(var i=0;i<all.length;i++){var r=all[i];if(String(r.id).charAt(0)=='_')continue;try{var me=JSON.parse(new TextDecoder().decode(await ArbArch.dec(r.m))),m={id:me.id,builtin:!!me.builtin,f:me.f||{},fed:me.fed||'',lhv:me.lhv||{},lhT:me.lhT||{},sigSel:me.sigSel||'',created:me.created,lh:[],sig:[]};
  for(var j=0;j<(me.assets||[]).length;j++){var x=me.assets[j],d=await ArbArch.dec(r.a[x.id]);if(x.kind=='lh')m.lh.push(await lhMeta({id:x.id,name:x.name,type:x.type,size:x.size,added:x.added,data:d}));else m.sig.push(await sigMeta({id:x.id,name:x.name,data:d,added:x.added}))}
  DEVM[m.id]=m}catch(e){}}
 MST.dev=true;mgrCompose();mgrMigrate()}
function mgrCompose(){var L=[],o=DEVM.au_builtin;
 if(AU.profile)L.push({id:'au_builtin',builtin:true,f:Object.assign({},AU.profile,o?o.f:{}),fed:o?o.fed:'',lhv:o?o.lhv||{}:{},lhT:o?o.lhT||{}:{},sigSel:o?o.sigSel:'',lh:AU.lh.concat(o?o.lh:[]),sig:AU.sig.concat(o?o.sig:[]),created:0});
 Object.keys(DEVM).forEach(function(k){if(k!='au_builtin')L.push(DEVM[k])});L.sort(function(a,b){return (a.builtin?0:1)-(b.builtin?0:1)||(a.created||0)-(b.created||0)});MGR=L;curMgr();refreshAll()}
async function mgrMigrate(){if(!MST.dev||!LEG||!AU.done||S.mgMig||!encOK())return;S.mgMig=1;save();
 var P=S.profile||{},has=Object.keys(P).some(function(k){return P[k]}),n=LEG.lh.length+LEG.sig.length;if(!has&&!n)return;
 var b=MGR.find(function(x){return x.builtin}),nm=function(x){return String(x||'').toLowerCase().replace(/[^а-яёa-z]/g,'')},t;
 if(b&&(!P.ФИО_УПРАВЛЯЮЩЕГО||nm(P.ФИО_УПРАВЛЯЮЩЕГО)==nm(b.f.ФИО_УПРАВЛЯЮЩЕГО)))t=b;else{t=newMgr();MGR.push(t)}
 Object.keys(P).forEach(function(k){if(P[k])t.f[k]=P[k]});LEG.lh.forEach(function(l){if(!t.lh.some(function(x){return x.id==l.id}))t.lh.push(l)});LEG.sig.forEach(function(g){if(!t.sig.some(function(x){return x.id==g.id}))t.sig.push(g)});
 t.lhv=Object.assign({},S.lhv||{},t.lhv);t.lhT=Object.assign({},S.lht||{},t.lhT);if(S.sigSel&&S.sigSel!='rotate'&&!t.sigSel)t.sigSel=S.sigSel;
 await mgrSave(t);for(var i=0;i<LEG.lh.length;i++)try{await ArbDB.del('letterheads',LEG.lh[i].id)}catch(e){}for(var j=0;j<LEG.sig.length;j++)try{await ArbDB.del('signatures',LEG.sig[j].id)}catch(e){}
 S.profile={};delete S.lhv;delete S.lht;delete S.sigSel;if(!S.mgr)S.mgr=t.id;LEG={lh:[],sig:[]};save();mgrCompose()}
function setMgr(id){S.mgr=id||null;var c=curCase();if(c)c.mgr=id||null;save();curMgr();refreshAll()}
function refreshAll(){drawCases();if(CUR)openT(CUR.id,1);if(window.ArbCP&&ArbCP.redraw)ArbCP.redraw();if(window.ArbBatch&&ArbBatch.refresh)ArbBatch.refresh()}
function mgrSel(id){var m=curMgr();return '<select id="'+id+'" aria-label="'+E(MU2('pick'))+'">'+(MGR.length?'':'<option value="">'+E(MU2('no_cards'))+'</option>')+MGR.map(function(x){return '<option value="'+E(x.id)+'"'+(x===m?' selected':'')+'>'+E(mgrName(x))+'</option>'}).join('')+'</select>'}
function signBtn(on,attr){var dis=!SIG.length;return '<button type="button" class="dsignbtn'+(on&&!dis?' on':'')+'" '+attr+' aria-pressed="'+(on&&!dis)+'"'+(dis?' disabled':'')+'><span class="dsgi" aria-hidden="true">'+(on&&!dis?'✓':'✍')+'</span>'+E(on&&!dis?MU2('sign_on'):MU2('sign_off'))+'</button>'}
function mgrRO(keys){var m=curMgr();if(!keys.length)return '';return '<details class="dmgro"><summary>'+E(MU2('data'))+'</summary><dl>'+keys.map(function(k){return '<dt>'+E((F[k]||{}).label||k)+'</dt><dd>'+(prof(k)?E(fmt(k,prof(k))):'<span class="dwarn">—</span>')+'</dd>'}).join('')+'</dl>'+(m?'<button type="button" class="lbtn sec" data-mgredit="'+E(m.id)+'">'+E(MU2('edit'))+'</button>':'')+'</details>'}
function mgrTodo(){var m=curMgr(),T=(C.manager||{}).todo_mark||'[__]';return !!m&&Object.keys(m.f).some(function(k){return String(m.f[k]||'').indexOf(T)>=0})}
function mgrTop(signOn,signAttr,selId){var td=TB()&&mgrTodo(),m=curMgr();return '<div class="dmgtop"><label for="'+selId+'">'+E(MU2('pick'))+'</label>'+mgrSel(selId)+signBtn(signOn&&!td,signAttr+(td?' disabled':''))+'</div>'+(td?'<div class="dtodo" role="alert"><b>'+E(MU2('addr_todo'))+'</b> <button type="button" class="lbtn sec" data-mgredit="'+E(m.id)+'">'+E(MU2('edit'))+'</button></div>':'')}
/* редактор карточки управляющего (вкладка «Контрагенты») */
function mgrEdit(el,id,done,pre){MEL=el;MDONE=done;var m=id?MGR.find(function(x){return x.id==id}):null;
 EDM=m?{id:m.id,builtin:m.builtin,f:Object.assign({},m.f),fed:m.fed||'',lhv:JSON.parse(JSON.stringify(m.lhv||{})),lhT:Object.assign({},m.lhT||{}),sigSel:m.sigSel||'',lh:m.lh.slice(),sig:m.sig.slice(),created:m.created,_o:m}:Object.assign(newMgr(),{_new:true,f:Object.assign({},pre||{})});
 if(!el.dataset.mgb){el.dataset.mgb=1;mgrBind(el)}drawMgr()}
function drawMgr(){if(!MEL||!EDM)return;var m=EDM,fl=(C.manager||{}).fields||C.profile_order,links=String(m.fed||'').split(/\s+/).filter(function(u){return /^https?:\/\//.test(u)});
 if(!encOK()){MEL.innerHTML='<p class="sm ewarn">'+E(MU2('locked'))+'</p><div class="dact"><button type="button" class="lbtn sec" data-mg="cancel">'+E(MU2('cancel'))+'</button></div>';return}
 MEL.innerHTML='<div class="dmged"><h4 class="dsh">'+E(m._new?MU2('new'):MU2('title'))+'</h4>'+(m.builtin?'<p class="sm">'+E(MU2('builtin'))+'</p>':'')+'<p class="sm">'+E(MU2('enc'))+'</p>'+grid(fl,function(k){return m.f[k]||''},'dm')+
  '<div><label for="dm_fed">'+E(MU2('fed'))+'</label><textarea id="dm_fed" rows="2">'+E(m.fed||'')+'</textarea>'+(links.length?'<div class="sm">'+links.map(function(u,i){return '<a href="'+E(u)+'" target="_blank" rel="noopener">'+E(MU2('fed_open'))+(links.length>1?' '+(i+1):'')+'</a>'}).join(' · ')+'</div>':'')+'</div>'+
  drawLH(m)+drawSig(m)+'<div class="dact"><button type="button" class="lbtn" data-mg="save">'+E(MU2('save'))+'</button><button type="button" class="lbtn sec" data-mg="cancel">'+E(MU2('cancel'))+'</button>'+(!m._new&&!m.builtin?'<button type="button" class="lbtn sec adred" data-mg="del">'+E(MU2('del'))+'</button>':'')+'</div><p class="sm ewarn" id="dmerr"></p></div>'}
function mgrBind(el){
 el.addEventListener('input',function(e){if(!EDM||!e.target.closest('.dmged'))return;var i=e.target;if(i.id=='dm_fed'){EDM.fed=i.value;return}if(i.dataset.lhf){(EDM.lhv[i.dataset.lhf]=EDM.lhv[i.dataset.lhf]||{})[i.dataset.fk]=i.value;return}if(i.dataset.k&&i.id.indexOf('dm_')==0)EDM.f[i.dataset.k]=i.value});
 el.addEventListener('change',async function(e){if(!EDM||!e.target.closest('.dmged'))return;var i=e.target;if(i.dataset.lht){EDM.lhT[i.dataset.lht]=i.value;return}
  if(i.dataset.sigrep){var f0=i.files[0],ix=EDM.sig.findIndex(function(x){return x.id==i.dataset.sigrep});if(f0&&ix>=0){try{if(!/png$/i.test(f0.type)&&!/\.png$/i.test(f0.name))throw new Error(LU('sig_bad',{name:f0.name}));var nr=await sigMeta({id:ArbDB.uid('sg'),name:EDM.sig[ix].name,data:await f0.arrayBuffer(),added:Date.now()});EDM.sig[ix]=nr;drawMgr()}catch(x){var mm0=$('dsigm');if(mm0)mm0.textContent=x.message}}return}if(i.id=='dmlhup'||i.id=='dmsigup'){var fs=[].slice.call(i.files),msg='';try{for(var q=0;q<fs.length;q++)await (i.id=='dmlhup'?lhAdd(fs[q],EDM):sigAdd(fs[q],EDM));msg=LU(i.id=='dmlhup'?'added':'sig_added')}catch(x){msg=x.message}drawMgr();var mm=$(i.id=='dmlhup'?'dlhm':'dsigm');if(mm)mm.textContent=msg;return}});
 el.addEventListener('click',async function(e){if(!EDM)return;var b=e.target.closest('[data-mg],[data-lhdel],[data-sigdel]');if(!b||!b.closest('.dmged')&&!b.dataset.mg)return;e.stopPropagation();var d=b.dataset;
  if(d.lhdel){var l=EDM.lh.find(function(x){return x.id==d.lhdel});if(l&&confirm(LU('del_confirm',{name:l.name}))){EDM.lh=EDM.lh.filter(function(x){return x!==l});drawMgr()}return}
  if(d.sigdel){var g=EDM.sig.find(function(x){return x.id==d.sigdel});if(g&&confirm(LU('sig_del_confirm',{name:g.name}))){EDM.sig=EDM.sig.filter(function(x){return x!==g});drawMgr()}return}
  if(d.mg=='cancel'){EDM=null;MDONE&&MDONE();return}
  if(d.mg=='del'){var o=EDM._o;if(!o||!confirm(MU2('del_confirm',{name:mgrName(o)})))return;await ArbDB.del('managers',o.id);delete DEVM[o.id];MGR=MGR.filter(function(x){return x!==o});EDM=null;mgrCompose();MDONE&&MDONE();return}
  if(d.mg=='save'){if(!String(EDM.f.ФИО_УПРАВЛЯЮЩЕГО||'').trim()){$('dmerr').textContent=MU2('need_fio');return}var t=EDM._o||newMgr();if(EDM._new)t.id=EDM.id;
   ['f','fed','lhv','lhT','sigSel','lh','sig'].forEach(function(k){t[k]=EDM[k]});t.builtin=EDM.builtin;t.created=EDM.created||Date.now();if(!EDM._o)MGR.push(t);
   try{await mgrSave(t)}catch(x){$('dmerr').textContent=x.message;return}if(!S.mgr||MGR.length==1){S.mgr=t.id;save()}EDM=null;mgrCompose();MDONE&&MDONE(MU2('saved'));return}})}
/* ===== исходящие номера: счётчик по делу (без дела — общий), согласован с архивом ===== */
function outCfg(c){c=c===undefined?curCase():c;var o=c?(c.out=c.out||{}):(S.outNC=S.outNC||{});if(!o.next)o.next=1;if(!o.fmt)o.fmt=((C.batch||{}).out_formats||['{n}/{yy}'])[0];if(o.pfx==null)o.pfx='';return o}
function outFmt(n,o,date){var y=String((String(date||'').match(/(\d{4})/)||[0,new Date().getFullYear()])[1]).slice(-2);return String(o.fmt).replace('{n}',n).replace('{yy}',y).replace('{p}',o.pfx||'')}
function outNum(s){var m=String(s||'').match(/^\s*(\d+)/);return m?+m[1]:0}
function outSync(){if(!window.ArbArch)return;S.cases.concat([null]).forEach(function(c){var m=ArbArch.maxNo(c?c.id:'');if(m){var o=outCfg(c);if(o.next<=m)o.next=m+1}});save()}
function re(list,k){return (list||[]).some(function(p){return p.charAt(0)=='^'?new RegExp(p).test(k):p==k})}
function isDateF(k,label){var P=C.date_patterns||{},ex=(P.exclude||[]).some(function(p){return new RegExp(p).test(k)});if(ex)return false;
 return (P.keys||[]).some(function(p){return new RegExp(p).test(k)})||(P.label?new RegExp(P.label,'i').test(String(label||'')):false)}
function dISO(v){v=String(v||'').trim();if(!v)return '';if(/^\d{4}-\d\d-\d\d$/.test(v))return v;var m=/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v);return m?m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2):null}
function initFields(){var src=Object.assign({},X.fields||{},C.extra_fields||{});
 Object.keys(src).forEach(function(k){var f=Object.assign({},src[k]);f.k=k;if((C.labels||{})[k])f.label=C.labels[k];if((C.scope_override||{})[k])f.scope=C.scope_override[k];
  f.type=src[k].type=='boolean'?'boolean':(src[k].type=='date'||re(C.date_fields,k)||isDateF(k,f.label))?'date':re(C.time_fields,k)?'time':re(C.textarea_fields,k)?'textarea':re(C.inn_fields,k)?'inn':'text';f.opt=(C.options||{})[k];f.optional=(C.optional||[]).indexOf(k)>=0;f.hint=src[k].hint||'';f.required=!!src[k].required;f.fill_order=src[k].fill_order||'';F[k]=Object.assign(f,(C.field_overrides||{})[k])});
 X.templates.forEach(function(t){t.fields.forEach(function(k){if(!F[k])F[k]={k:k,label:k.replace(/_/g,' ').toLowerCase().replace(/^./,function(c){return c.toUpperCase()}),scope:'document',type:'text'}})})}
function ofScope(sc,order){var a=(order||[]).filter(function(k){return F[k]&&F[k].scope==sc});Object.keys(F).forEach(function(k){if(F[k].scope==sc&&a.indexOf(k)<0)a.push(k)});return a}
function curCase(){return S.cases.find(function(c){return c.id==S.cur})||null}
function caseName(c){var d=c.data||{};return [d.ДОЛЖНИК_НАИМЕНОВАНИЕ,d.НОМЕР_ДЕЛА].filter(Boolean).join(' · ')||U('case_unnamed')}
/* d6: дата документа (ДАТА и sign_date.fields) — всегда сегодня, если поле пустое или не тронуто: в форме, превью, docx, в пакетах (OV) тоже */
function SDF(){var L=((C&&C.sign_date)||{}).fields||['ДАТА'];return L}
function raw(k,tid){var cv=RGX()&&RGX().calc(k,tid);if(cv!=null)return cv;if(String(k).indexOf('#')>0)return rgRaw(k,tid);if(F[k]&&F[k].fill_order&&RQ_()&&RQ_().blocked(k,tid))return '';var AFm=(C.addressees||{}).addr_field||{};for(var nmA in AFm)if(AFm[nmA]==k){var vA=raw0(k,tid);if(vA!=null&&String(vA).trim())return vA;var tAf=X.templates.find(function(x){return x.id==tid});if(tAf&&adrField(tAf)==nmA)return raw('АДРЕСАТ_АДРЕС',tid)||''}
 var CFm=(C.addressees||{}).code_field||{};if(!raw.cc){for(var nmF in CFm)if(CFm[nmF]==k){var v0c=raw0(k,tid);if(v0c!=null&&String(v0c).trim())return v0c;var tC=X.templates.find(function(x){return x.id==tid});if(tC&&adrField(tC)==nmF){var dC=(OV?OV.v:(S.drafts[tid]||{}))||{};if(String(dC[nmF]||'').trim())return dC[k]||'';raw.cc=1;try{var aC=adrAuto(tC);return aC?(aC.code||''):''}finally{raw.cc=0}}}}if(raw.pr){var tP=X.templates.find(function(x){return x.id==tid});if(tP&&(noPrintF(tP,k)||cbOffFields(tP).indexOf(k)>=0))return ''}if(k=='ФИО_УПРАВЛЯЮЩЕГО_ИОФ')return iof(raw('ФИО_УПРАВЛЯЮЩЕГО',tid));
 if(k=='АДРЕСАТ_НАИМ'||k=='АДРЕСАТ_АДРЕС'||(OV==null&&X.templates)){var tA=X.templates.find(function(x){return x.id==tid}),cfA=tA&&adrField(tA);
  if(tA&&cfA&&(k==cfA||k=='АДРЕСАТ_НАИМ'||k=='АДРЕСАТ_АДРЕС')){var dA=(OV?OV.v:(S.drafts[tid]||{}))||{},own=String(dA[cfA]||'').trim();
   if(k=='АДРЕСАТ_НАИМ'){if(own)return dA.АДРЕСАТ_НАИМ||'';var aa=adrAuto(tA);return aa?aa.name:''}
   if(k=='АДРЕСАТ_АДРЕС'){var v1=raw0(k,tid);if(v1!=null&&String(v1).trim())return v1;if(own)return '';var ab=adrAuto(tA);return ab?ab.addr:''}
   if(k==cfA){var v2=raw0(k,tid);if(v2!=null&&String(v2).trim())return v2;var ac=adrAuto(tA);if(ac)return ac.val}}}var v0=raw0(k,tid);if((v0==null||String(v0).trim()==='')&&(raw.dl||0)<3){raw.dl=(raw.dl||0)+1;try{var tt=X.templates.find(function(x){return x.id==tid}),ca=tt?dlAuto(tt,k):'';if(ca)return ca}finally{raw.dl--}}if((v0==null||String(v0).trim()==='')&&(SDF().indexOf(k)>=0||(!OV&&DATEF().indexOf(k)>=0)))return todayISO();return v0}
function raw0(k,tid){var f=F[k]||{},d=(S.drafts[tid]||{}),c=curCase(),v;
 if(OV){if(OV.v[k]!=null&&OV.v[k]!=='')return OV.v[k];if(!f.scope||f.scope=='document')return ''}
 else if(d[k]!=null&&d[k]!=='')return d[k];
 if(f.scope=='profile')v=prof(k);else if(f.scope=='case'&&c)v=c.data[k];
 if((v==null||v==='')&&k=='ВИД_УПРАВЛЯЮЩЕГО'){var p=raw0('ПРОЦЕДУРА',tid);v=(C.procedure_manager||{})[String(p||'').toLowerCase().trim()]||''}
 return v==null?'':v}
var raw_=raw;raw=function(k,tid){var v=raw_(k,tid);if((v==null||String(v).trim()==='')&&tid&&X&&X.templates){var tF=X.templates.find(function(x){return x.id==tid});if(tF&&tF.field_defaults&&tF.field_defaults[k]!=null)return tF.field_defaults[k]}return v};
function fmt(k,v){if(!v)return '';var f=F[k]||{};if(f.type=='date'&&/^\d{4}-\d\d-\d\d$/.test(String(v).trim())){v=String(v).trim();var a=v.split('-');if(((C.sign_date||{}).format=='long')&&SDF().indexOf(k)>=0)return (+a[2])+' '+['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][+a[1]-1]+' '+a[0]+' г.';return a[2]+'.'+a[1]+'.'+a[0]}return String(v)}
function setVal(k,v,tid){var f=F[k]||{},c=curCase();try{var dn=tid&&S.drafts[tid];if(dn&&dn._needs_check)dn._needs_check=dn._needs_check.filter(function(x){return x!=k});if(c&&c.data&&c.data._needs_check)c.data._needs_check=c.data._needs_check.filter(function(x){return x!=k})}catch(e){}
 if(f.scope=='profile'){var mm=curMgr();if(mm){mm.f[k]=v;mgrSaveSoon(mm)}if(tid&&S.drafts[tid])delete S.drafts[tid][k]}
 else if(f.scope=='case'&&c){c.data[k]=v;if(tid&&S.drafts[tid])delete S.drafts[tid][k]}
 else if(tid){(S.drafts[tid]=S.drafts[tid]||{})[k]=v}save()}
function cpOpts(k){var r=((C.counterparties||{}).doc_fields||{})[k];if(!r||!window.ArbCP)return null;var c=curCase(),o=ArbCP.pick(r,c&&c.id).map(function(x){return x.name});return o.length?o:null}
function inp(f,v,pre){var id=pre+'_'+f.k,a=' data-k="'+E(f.k)+'" id="'+E(id)+'"',dl='',co=cpOpts(f.k);
 if(f.k=='ИСХ_НОМЕР'&&pre=='df'){var o=outCfg();a+=' placeholder="'+E(U('out_auto',{no:outFmt(o.next,o,'')}))+'"'}
 if(co&&!f.opt){dl='<datalist id="'+E(id)+'_l">'+co.map(function(o){return '<option value="'+E(o)+'">'}).join('')+'</datalist>';a+=' list="'+E(id)+'_l"'}
 if(f.opt){dl='<datalist id="'+E(id)+'_l">'+f.opt.map(function(o){return '<option value="'+E(o)+'">'}).join('')+'</datalist>';a+=' list="'+E(id)+'_l"'}
 if(f.type=='boolean')return '<input type="checkbox"'+a+(RGX()&&RGX().truthy(v)?' checked':'')+'>';
 if(f.type=='textarea')return '<textarea'+a+' rows="3">'+E(v)+'</textarea>';
 if(f.type=='date')return dateInp(a,v,dl);
 return '<input'+a+(f.type=='date'?' type="date"':f.type=='time'?' type="time"':'')+(f.type=='inn'?' inputmode="numeric"':'')+(f.type=='text'&&/EMAIL/.test(f.k)?' type="email"':'')+(/ТЕЛ_/.test(f.k)?' type="tel"':'')+' value="'+E(v)+'" autocomplete="off">'+dl}
function grid(keys,get,pre){return '<div class="g2">'+keys.map(function(k){var f=F[k];return '<div data-w="'+E(k)+'"'+(f.type=='textarea'?' class="dwide"':'')+'><label for="'+E(pre+'_'+k)+'">'+E(f.label)+(f.optional?' <span class="sm">(необязательно)</span>':'')+'</label>'+inp(f,get(k),pre)+(f.hint?'<div class="sm dhint">'+E(f.hint)+'</div>':'')+'</div>'}).join('')+'</div>'}
function shell(){var v=document.createElement('div');v.id='vdocs';v.style.display='none';
 v.innerHTML='<div class="md prc fin dwrap"><h2 id="dtl"></h2><p class="sm" id="dintro"></p>'+
 '<div id="dfrst" class="dfx"></div><div id="dflow" class="dfx"></div><div id="dfbar"></div><div id="dfsheet" class="dfx" hidden></div>'+
 '<div id="dlist"></div><div id="ded" style="display:none"></div>'+
 '<p class="sm dpriv"><span id="dpriv"></span> <button type="button" class="lbtn sec" id="dclear"></button> <span class="sm" id="dclm"></span></p></div><div id="dbbar" class="dbbar" style="display:none"></div><div id="dtoast" class="dtoast" style="display:none" role="status"></div>';
 var a=$('veval')||$('vsrc');if(a&&a.parentNode)a.parentNode.insertBefore(v,a.nextSibling);else document.body.appendChild(v);
 var at=v;[['vcp',window.ArbCP,'dcpb',(C.counterparties||{}).nav||(C.counterparties||{}).title],['varch',window.ArbArch,'darchb',(C.archive||{}).title]].forEach(function(x){if(!x[1])return;var w=document.createElement('div');w.id=x[0];w.style.display='none';
  w.innerHTML='<div class="md prc fin dwrap dtop"><h2>'+E(x[3]||'')+'</h2><div id="'+x[2]+'"></div></div>';at.parentNode.insertBefore(w,at.nextSibling);at=w})}
function caseSel(id){return '<select id="'+id+'">'+'<option value="">'+E(U('case_none'))+'</option>'+S.cases.map(function(c){return '<option value="'+E(c.id)+'"'+(c.id==S.cur?' selected':'')+'>'+E(caseName(c))+'</option>'}).join('')+'</select>'}
function CU(k){return ((C.counterparties||{}).ui||{})[k]||k}
function cpDeb(c){if(!window.ArbCP||!c)return '';var L=ArbCP.pick(null,c.id).filter(function(x){return x.src!='cbr'});if(!L.length)return '';return '<div class="dcrow"><label for="dcdeb">'+E(CU('debtor_pick'))+'</label><select id="dcdeb"><option value="">'+E(CU('debtor_none'))+'</option>'+L.map(function(x){return '<option value="'+E(x.id)+'">'+E(x.name+(x.inn?' · ИНН '+x.inn:''))+'</option>'}).join('')+'</select></div>'}
function SU(k){return (C.steps||{})[k]||k}
function debLine(c){var d=c.data||{};return [d.ДОЛЖНИК_НАИМЕНОВАНИЕ||U('case_unnamed'),d.ДОЛЖНИК_ИНН?'ИНН '+d.ДОЛЖНИК_ИНН:'',d.НОМЕР_ДЕЛА?'№ '+d.НОМЕР_ДЕЛА:''].filter(Boolean).join(' · ')}
function groups(){return X.groups||[]}
function GL(g){return (C.group_labels||{})[g]||g}
function BU(k,o){var x=((C.batch||{}).ui||{})[k]||k;if(o)Object.keys(o).forEach(function(n){x=x.split('{'+n+'}').join(o[n])});return x}
function pl(n,a,b,c){var m=Math.abs(n)%100,d=m%10;return m>10&&m<20?c:d>1&&d<5?b:d==1?a:c}
function visT(){var q=Q.trim().toLowerCase();return X.templates.filter(function(t){return (!FLT||t.group==FLT)&&(!q||(t.title+' '+t.norm+' '+t.kind+' '+t.deadline+' '+(TXT[t.id]||'').replace(/\{\{[^{}]+\}\}/g,' ')).toLowerCase().indexOf(q)>=0)})}
function caseProc(){var c=curCase();return c?String(c.data.ПРОЦЕДУРА||'').toLowerCase().trim():''}
function presetIds(p){var pr=caseProc(),M=(C.batch||{}).preset_id_proc||{};return p.ids.filter(function(id){return !pr||!M[id]||M[id].indexOf(pr)>=0})}
var POTH=false;
function presetsHtml(){var B=C.batch||{},P=B.presets||[],GR=B.preset_groups||[],pr=caseProc();if(!P.length)return '';
 var mine=pr?GR.filter(function(g){return g.proc&&g.proc.indexOf(pr)>=0}):[],known=!!mine.length;
 var grp=function(g){var L=[];P.forEach(function(p,i){if(p.group==g.id)L.push([p,i])});if(!L.length)return '';
  return '<div class="dpg"><div class="dpgh">'+E(g.label)+'</div><div class="dpres">'+L.map(function(x,k){var p=x[0],ids=presetIds(p),on=ids.length&&ids.every(function(id){return BSEL.has(id)});return '<button type="button" class="dpre'+(on?' on':'')+(k==L.length-1&&L.length%2==1?' dpw':'')+'" data-pre="'+x[1]+'" aria-pressed="'+on+'"><span class="dpn">'+E(p.name)+'</span><span class="dpc">'+ids.length+'</span></button>'}).join('')+'</div></div>'};
 var h='<div class="sm dlbl">'+E(BU('presets'))+'</div>';
 if(!known)return h+GR.map(grp).join('');
 var rest=GR.filter(function(g){return mine.indexOf(g)<0&&(g.proc||[]).length});
 return h+mine.map(grp).join('')+GR.filter(function(g){return !(g.proc||[]).length}).map(grp).join('')+(rest.length?'<details class="dpoth"'+(POTH?' open':'')+'><summary>'+E(B.presets_other||'…')+'</summary>'+rest.map(grp).join('')+'</details>':'')}
function multiOf(t){var m=(C.batch||{}).multi||{};return t.fields.find(function(k){return m[k]})}
function drawList(){var g=groups(),q=Q.trim().toLowerCase(),vis=visT(),bat=!!window.ArbBatch,n=0,h='<div class="pflt dflt"><input type="search" id="dq" placeholder="'+E(U('search'))+'" value="'+E(Q)+'"></div><div class="dchips" id="dchips"><button type="button" class="pchip'+(FLT?'':' on')+'" data-g="">'+E(U('all'))+'</button>'+g.map(function(x){return '<button type="button" class="pchip'+(FLT==x?' on':'')+'" data-g="'+E(x)+'">'+E(GL(x))+'</button>'}).join('')+'</div>';
 if(bat){h+=presetsHtml();
  var all=vis.length&&vis.every(function(t){return BSEL.has(t.id)});
  h+='<div class="adh dadh"><span class="adt">'+E(vis.length+' '+pl(vis.length,'шаблон','шаблона','шаблонов'))+'</span><button type="button" class="adall" data-bsel="1">'+E(all?BU('unselect_all'):BU('select_all'))+'</button><button type="button" class="lbtn dmk'+(BSEL.size?'':' off')+'" data-bgo="1"'+(BSEL.size?'':' aria-disabled="true"')+'>'+E(BSEL.size?BU('make_n',{n:BSEL.size}):BU('make'))+'</button></div>'}
 g.forEach(function(gr){if(FLT&&FLT!=gr)return;var ts=vis.filter(function(t){return t.group==gr});if(!ts.length)return;n+=ts.length;var gon=ts.every(function(t){return BSEL.has(t.id)});
  h+='<h3 class="dgh"><span class="dght">'+E(GL(gr))+' <span class="sm">'+ts.length+'</span></span>'+(bat?'<button type="button" class="adall" data-bgrp="'+E(gr)+'">'+E(gon?BU('grp_none'):BU('grp_all'))+'</button>':'')+'</h3>'+ts.map(function(t){var on=BSEL.has(t.id),m=multiOf(t);return '<div class="lot dit'+(bat?' dbat':'')+(on?' dsel':'')+'" data-t="'+E(t.id)+'" role="button" tabindex="0">'+(bat?'<span class="adcb'+(on?' on':'')+'" role="checkbox" aria-checked="'+on+'" aria-label="Отметить" tabindex="0" data-bt="'+E(t.id)+'"></span>':'')+'<div class="dbd"><div class="d1">'+E(t.title)+'</div><div class="sm"><b>'+E(U('norm'))+':</b> '+E(t.norm)+'</div>'+(t.deadline?'<div class="sm"><b>'+E(U('deadline'))+':</b> '+E(t.deadline)+'</div>':'')+'<div class="sm"><span class="dkind">'+E(t.kind)+'</span>'+(bat&&m&&m!='РЕГИОН'?' · '+E(BU('by_addr')):'')+'</div></div></div>'}).join('')});
 h+=n?'':'<div class="empty">'+E(U('empty'))+'</div>';
 var L=$('dlist');var foc=document.activeElement&&document.activeElement.id=='dq',pos=foc?document.activeElement.selectionStart:0;L.innerHTML=h;if(foc){var i=$('dq');i.focus();try{i.setSelectionRange(pos,pos)}catch(e){}}listBar()}
function bar(h){var b=$('dbbar');if(!b)return;b.innerHTML=h||'';b.style.display=h?'':'none';$('vdocs').classList.toggle('dbaron',!!h)}
function listBar(){if(!window.ArbBatch||CUR||$('dlist').style.display=='none')return;var n=BSEL.size;
 bar('<div class="dbi"><b>'+E(BU('picked',{n:n}))+'</b>'+(n?'':'<span class="sm">'+E(BU('pick_hint'))+'</span>')+'</div>'+(n?'<button type="button" class="lbtn sec dbx" data-bclr="1" title="'+E(BU('clear'))+'" aria-label="'+E(BU('clear'))+'">✕</button>':'')+'<button type="button" class="lbtn dbgo'+(n?'':' off')+'" data-bgo="1"'+(n?'':' aria-disabled="true"')+'>'+E(n?BU('make_n',{n:n}):BU('make'))+'</button>')}
function toast(t,ms){var x=$('dtoast');if(!x)return;x.textContent=t;x.style.display='';clearTimeout(toast.t);toast.t=setTimeout(function(){x.style.display='none'},ms||2200)}
function showList(){CUR=null;var wb=FL.batch;FL.batch=false;$('vdocs').classList.remove('editing');$('ded').style.display='none';$('ded').innerHTML='';if(!FL.step||FL.step=='f'||wb)FL.step='t';drawCases();if(FL.all)drawList()}
var TXT={},PF=0;
function prefetch(){if(PF)return;PF=1;Promise.all(X.templates.map(function(t){return md(t).catch(function(){})})).then(function(){if(Q)drawList()})}
async function md(t){if(TXT[t.id]==null){var r=await fetch('docs/'+t.md+'?v='+(window.ARB_DOCS_VH||''));if(!r.ok)throw new Error('шаблон не загрузился ('+r.status+')');TXT[t.id]=await r.text()}return TXT[t.id]}
/* d6: колонки таблицы. table_schema[].print===false — колонка только в форме (напр. РЫНОЧНАЯ_СТОИМОСТЬ_СПРАВОЧНО, «Оценщик · справочно»), в docx/PDF не выводится */
function TSC(t){var m={};(t.table_schema||[]).forEach(function(c){if(c&&c.field)m[c.field]=c});return m}
function noPrint(t,k){var c=TSC(t)[k];return !!(c&&c.print===false)}
function RF(t){if(TBon(t))return [];return (t.repeat_row_fields||[]).filter(function(k){return !noPrint(t,k)})}
function RFF(t){if(TBon(t))return [];var rf=(t.repeat_row_fields||[]).slice();(t.table_schema||[]).forEach(function(c){if(c&&c.field&&c.print===false&&rf.indexOf(c.field)<0)rf.push(c.field)});return rf}
function colF(t,k){var c=TSC(t)[k];if(F[k])return F[k];return c?{k:k,label:c.label||k,type:c.type=='number'||c.type=='money'?'text':(c.type=='date'?'date':'text'),hint:c.source_label||'',noprint:c.print===false}:{k:k,label:k,type:'text'}}
function rows(t){var d=S.drafts[t.id]=S.drafts[t.id]||{};if(!Array.isArray(d._rows))d._rows=[{}];return d._rows}
function rowsFilled(t){return rows(t).filter(function(r){return RF(t).some(function(k){return r[k]})})}
/* 1.7o: required_if {field, only_values} — поле обязательно только при выбранном значении (ДАТА_СПРАВОЧНОЙ_ОЦЕНКИ при ОСНОВА_ДОСТАТОЧНОСТИ = appraisal_ref) */
function reqIfOn(t,k){var ri=F[k]&&F[k].required_if;if(!ri||!ri.field)return true;var s=chGet(DRA(t.id),ri.field),v=s.v.length?s.v:(F[ri.field]&&F[ri.field].default?[F[ri.field].default]:[]);return v.some(function(x){return (ri.only_values||[ri.equals]).indexOf(x)>=0})}
function missing(t){var rf=RF(t),off=cbOffFields(t).concat(rgAll(t),ilFields(t),TBown(t)),m=t.fields.filter(function(k){return rf.indexOf(k)<0&&off.indexOf(k)<0&&!noPrintF(t,k)&&k!='ИСХ_НОМЕР'&&!raw(k,t.id)&&!(F[k]&&F[k].optional)&&reqIfOn(t,k)});if(rf.length&&!rowsFilled(t).length)m.push('_rows');m=m.concat(rgMissing(t));return m}
function mlabel(k){return k=='_rows'?U('rows_missing'):(F[k]||{}).label||k}
function rowsHtml(t){var rf=RFF(t);if(!RF(t).length)return '';return '<h4 class="dsh">'+E(U('rows_title'))+'</h4><div id="drows">'+rows(t).map(function(r,i){return '<div class="lot drow"><div class="d1">'+E(U('row_n',{n:i+1}))+'</div><div class="g2">'+rf.map(function(k){var f=colF(t,k),np=noPrint(t,k);return '<div'+(f.type=='textarea'?' class="dwide"':'')+'><label for="dr_'+i+'_'+E(k)+'">'+E(f.label)+(np?' <span class="tag dnp">'+E(U('noprint')=='noprint'?'не печатается':U('noprint'))+'</span>':'')+'</label>'+inp(f,r[k]||'','dr_'+i).replace('data-k=','data-row="'+i+'" data-rk=')+(np&&f.hint?'<p class="sm">'+E(f.hint)+'</p>':'')+'</div>'}).join('')+'</div>'+(rows(t).length>1?'<p><button type="button" class="lbtn sec" data-rowdel="'+i+'">'+E(U('row_del'))+'</button></p>':'')+'</div>'}).join('')+'</div><p><button type="button" class="lbtn sec" id="drowadd">'+E(U('row_add'))+'</button></p>'}
function rowLine(l,t){var rf=RF(t);if(!rf.length||!rf.some(function(k){return l.indexOf('{{'+k+'}}')>=0}))return null;var rs=rowsFilled(t);if(!rs.length)return null;
 return rs.map(function(r,i){return l.replace(/^(\|\s*)\d+(\s*\|)/,'$1'+(i+1)+'$2').replace(/\{\{([^{}]+)\}\}/g,function(m,k){return rf.indexOf(k)>=0?fmt(k,r[k]||''):m})}).join('\n')}
function expandRowsText(s,t){if(TBon(t))s=TB_().md(s,t);if(String(raw('АДРЕСАТ_АДРЕС',t.id)||'').trim())s=s.replace(/^(Кому:[^\n]*)$/m,'$1\n{{АДРЕСАТ_АДРЕС}}');return s.split('\n').map(function(l){var x=rowLine(l,t);return x==null?l:x}).join('\n')}
function expandRowsXml(x,t){if(TBon(t))x=TB_().xml(x,t);var rf=RF(t);if(!rf.length)return x;var rs=rowsFilled(t);if(!rs.length)return x;
 var trs=x.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g)||[],ti=trs.findIndex(function(r){return rf.some(function(k){return r.indexOf('{{'+k+'}}')>=0})});if(ti<0)return x;
 var tpl=trs[ti],out=rs.map(function(r,i){var c=tpl.replace(/(<w:tc>[\s\S]*?<w:t(?:\s[^>]*)?>)\s*1\s*(<\/w:t>)/,'$1'+(i+1)+'$2');return c.replace(/\{\{([^{}]+)\}\}/g,function(m,k){return rf.indexOf(k)>=0?xe(fmt(k,r[k]||'')):m})}).join('');
 var rest=trs.slice(ti+1),cut=0;for(var j=0;j<rest.length;j++){var tx=rest[j].replace(/<[^>]+>/g,'').trim();if(/^\d*$/.test(tx))cut=j+1;else break}
 var a=x.indexOf(tpl),b=cut?x.indexOf(rest[cut-1],a)+rest[cut-1].length:a+tpl.length;return x.slice(0,a)+out+x.slice(b)}
function fill(s,t,mode,dp){return s.replace(/\{\{([^{}]+)\}\}/g,function(m,k){var v=fmt(k,raw(k,t.id));if(v&&!dp&&v.indexOf('{{')>=0)v=fill(v,t,'text',1);if(v)return mode=='html'?E(v):v;if(F[k]&&F[k].optional)return '';var l='['+((F[k]||{}).label||k)+']';return mode=='html'?'<mark>'+E(l)+'</mark>':l})}
function plain(s){return s.split('\n').map(function(l){return l.replace(/^#+\s+/,'')}).join('\n')}
function sigKey(){var m=curMgr();return m?m.id:'_'}
function sigFor(t){curMgr();if(!SIG.length)return null;return SIG[((S.sigNm||{})[sigKey()]||0)%SIG.length]}
function sigNext(){S.sigNm=S.sigNm||{};var k=sigKey();S.sigNm[k]=(((S.sigNm[k]||0)+1)%Math.max(1,SIG.length));save()}
function htmlPrev(s,t){raw.pr=1;try{var h=htmlPrev0(s,t);return TB_()?TB_().htmlTables(h):h}finally{raw.pr=0}}
function htmlPrev0(s,t){s=adrLineFix(sgMd(sdMd(cbMd(rgMd(s,t),t),t)),t);var sg=OV?(OV.sign&&(OV.sigUrl?{url:OV.sigUrl}:sigFor(t))):(sigPref()&&sigFor(t)),LL=s.split('\n');if(LY_())LL=LY_().mdHead(LL);var GR=LY_()?LY_().mdRoles(LL,t):null,GLB=LY_()?LY_().label():null;return LL.map(function(l,li){var hd=/^#+\s+/.test(l),sl=sg&&!(C.preview||{}).hide_signature&&SIGLINE.test(l);l=l.replace(/^#+\s+/,'');var x=fill(l,t,'html');var tl=l.indexOf('\t')>=0&&SIGLINE.test(l),im=sl?'<span class="dsigw"><img class="dsig" style="height:'+((GC().height_mm||22)/4.23).toFixed(2)+'em;bottom:-'+(((GC().height_mm||22)/4.23)*0.3).toFixed(2)+'em" src="'+sg.url+'" alt=""></span>':'';if(tl){var pr=l.split('\t');return '<div class="dsigln"><span>'+fill(pr[0],t,'html')+'</span><span>'+im+fill(pr.slice(1).join(' '),t,'html')+'</span></div>'}if(sl)x=im+x;var GCL={b:'dlb',r:'dlr',s:'dls',c:'dlc',e:'dle'}[GR&&GR[li]]||'',gc=GCL&&x&&!(GCL=='dlb'&&/^\s/.test(l))?' class="'+GCL+'"':'';if(GCL=='dlr'&&GLB){var mL=GLB.exec(l.trim());if(mL&&x.indexOf(mL[0])==0)x='<b>'+mL[0]+'</b>'+x.slice(mL[0].length)}return hd?'<div class="dhd">'+x+'</div>':'<div'+gc+'>'+(x||'&nbsp;')+'</div>'}).join('')}
async function openT(id,keep){var t=X.templates.find(function(x){return x.id==id});if(!t)return;if(CUR!==t||!keep)FL.need=null;if(!keep)FL.tab='f';CUR=t;FL.step='f';FL.batch=false;FL.res=null;$('dlist').style.display='none';bar('');$('vdocs').classList.add('editing');var ed=$('ded');ed.style.display='';if(!keep)ed.innerHTML='<p class="sm">…</p>';
 try{await md(t)}catch(e){ed.innerHTML='<p class="sm ewarn">'+E(e.message)+'</p><button type="button" class="lbtn sec" data-back>'+E(U('back'))+'</button>';return}
 if(CUR!==t)return;var fl=$('dflow');if(fl)fl.innerHTML='';flowVis();var ae=document.activeElement,aid=keep&&ae&&ae.id;
 ed.innerHTML='<div class="dfx">'+formHtml(t)+'</div>';prev();adrCombo(t);needSync();if(aid&&$(aid))try{$(aid).focus()}catch(x){}if(!keep)window.scrollTo(0,$('vdocs').offsetTop-60)}
/* d6 hotfix: адресат по умолчанию из карточки должника (ArbCP.resolveAdr); не сохраняется в черновик — пересчитывается при каждом выводе */
var ADRC={};
function adrAuto(t){var cf=adrField(t);if(!cf||!window.ArbCP||!ArbCP.resolveAdr)return null;if(!ArbCP.adReady()){if(!adrAuto.ld){adrAuto.ld=1;ArbCP.addrLoad().then(function(){ADRC={};if(CUR){adrCombo(CUR);prev();try{formBar()}catch(x){}}})}return null}
 var c=curCase(),cd=Object.assign({},c?c.data:{}),key=t.id+'|'+JSON.stringify(cd);if(ADRC[key]!==undefined)return ADRC[key];var r=null;try{r=ArbCP.resolveAdr(t.id,cf,cd)}catch(e){}ADRC[key]=r;return r}
function adrDraft(t){var cf=adrField(t),d=(OV?OV.v:(S.drafts[t.id]||{}))||{};return cf?String(d[cf]||'').trim():''}
function adrUnres(t){var cf=adrField(t);if(!cf)return false;return !String(raw(cf,t.id)||'').trim()}
function adrLineFix(src,t,xml){var cf=adrField(t),L=((C.addressees||{}).full_name_line||{})[cf];if(!L)return src;var nm=String(raw('АДРЕСАТ_НАИМ',t.id)||'').trim();if(!nm)return src;return src.split(L).join('{{АДРЕСАТ_НАИМ}}')}
/* d6 (index 1.7): условные блоки {{#if флаг}} … {{/if}} — флаг в черновике (_if_<флаг>), по умолчанию default_flag; выключен — блок удаляется вместе с маркерами; field_print:false — поле в форме, в документе пусто */
function CBL(t){return (t&&t.conditional_blocks)||[]}
function cbOn(t,fl){var d=(OV?OV.v:(S.drafts[t.id]||{}))||{};var b=cbBlock(t,fl);if(b&&cbScopeG(t,b))return false;return cbVal(t,fl,d)}
function cbOffFields(t){var o=[];CBL(t).forEach(function(b){if(cbScopeG(t,b))return;if(!cbOn(t,b.flag))o=o.concat(b.fields||[])});return o}
/* --- 1.7e: строчные условия {{#if ПОЛЕ}}…{{/if}} в одной строке md / одном абзаце (ячейке) docx --- */
var ILRE=/\{\{#if\s+([^}\s]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g;
function ilOn(t,k){var b=cbBlock(t,k);if(b&&!(F[k]))return cbOn(t,k);var v=raw(k,t.id);return v!=null&&String(v).trim()!==''}
function ilFields(t){var o=[];(t&&t.inline_blocks||[]).forEach(function(b){(b.fields||[b.field]).forEach(function(k){if(k&&o.indexOf(k)<0)o.push(k)})});return o}
function ilMd(l,t){if(String(l).indexOf('{{#if')<0||/^\s*\{\{#if\s+[^}\s]+\s*\}\}\s*$/.test(l))return l;return String(l).replace(ILRE,function(m,k,body){return ilOn(t,k)?body:''})}
function ilXml(p,t){if(p.indexOf('{{#if')<0)return p;var re=/(<w:t(?:\s[^>]*)?>)([^<]*)(<\/w:t>)/g,seg=[],full='',m;while((m=re.exec(p))){seg.push({i:m.index,n:m[0].length,o:m[1],s:full.length,x:m[2]});full+=m[2]}
 if(/^\s*\{\{#if\s+[^}\s]+\s*\}\}\s*$/.test(full)||full.indexOf('{{#if')<0)return p;var del=new Uint8Array(full.length),hit=0,mm;ILRE.lastIndex=0;
 while((mm=ILRE.exec(full))){hit=1;var a=mm.index,e=a+mm[0].length,h=mm[0].indexOf('}}')+2;if(ilOn(t,mm[1])){for(var j=a;j<a+h;j++)del[j]=1;for(j=e-7;j<e;j++)del[j]=1}else for(j=a;j<e;j++)del[j]=1}
 if(!hit)return p;var out='',last=0;seg.forEach(function(g){var x='';for(var j=0;j<g.x.length;j++)if(!del[g.s+j])x+=g.x[j];var o=g.o.indexOf('xml:space')<0?g.o.replace('<w:t','<w:t xml:space="preserve"'):g.o;out+=p.slice(last,g.i)+o+x+'</w:t>';last=g.i+g.n});return out+p.slice(last)}
function cbMd(s,t){if(!CBL(t).length&&String(s).indexOf('{{#if')<0)return s;var out=[],skip=0;String(s).split('\n').forEach(function(l){var m=/^\s*\{\{#if\s+([^}\s]+)\s*\}\}\s*$/.exec(l);if(m){skip=cbOn(t,m[1])?0:1;return}if(/^\s*\{\{\/if\}\}\s*$/.test(l)){skip=0;return}if(skip)return;var r=ilMd(l,t);if(r!==l&&!r.trim()){out.dr=1;return}if(out.dr&&!r.trim()&&out.length&&!String(out[out.length-1]).trim()){out.dr=0;return}out.dr=0;out.push(r)});return out.join('\n')}
function cbXml(x,t){if(x.indexOf('{{#if')<0&&x.indexOf('{{/if}}')<0)return x;var skip=0,tx=function(p){return (p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(y){return y.replace(/<[^>]+>/g,'')}).join('').trim()};
 return x.replace(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g,function(p){if(p.indexOf('<w:tbl>')==0)return skip?'':p.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(c){return ilXml(c,t)});var q=tx(p),m=/^\{\{#if\s+([^}\s]+)\s*\}\}$/.exec(q);if(m){skip=cbOn(t,m[1])?0:1;return ''}if(q=='{{/if}}'){skip=0;return ''}if(skip)return '';var r=ilXml(p,t);return r!==p&&q.indexOf('{{#if')>=0&&!tx(r)&&!/<w:drawing|<w:pict|<w:br w:type="page"/.test(r)?'\u0001':r}).replace(/(<w:p\/>)\s*\u0001\s*<w:p\/>/g,'$1').replace(/\u0001/g,'')}
function noPrintF(t,k){return !!(t&&t.field_print&&t.field_print[k]===false)}
function cbDecorate(){if(!CUR)return;var t=CUR,ed=$('ded');if(!ed||ed.querySelector('.dcondw'))return;var B=CBL(t).filter(function(b){return !cbScopeG(t,b)&&!(b.flag_from&&b.flag_from.field)});if(!B.length)return;var fm=ed.querySelector('.fl .card, .fl form, .fl');if(!fm)return;
 var h='<div class="card dcondw">'+B.map(function(b){var ff=b.flag_from||{};if(ff.debtor_type){var dt=debtorType(),c=curCase(),ex=c&&c.data&&c.data._dtype;var lb=V7().debtor_type_labels||{legal:'Организация',person:'Гражданин'};return '<div class="dcond ddt"><b>'+E(V7U('debtor','Должник'))+'</b><div class="dfmt">'+['legal','person'].map(function(v){var on=dt==v;return '<button type="button" data-dtype="'+v+'" class="'+(on?'on':'')+'" aria-pressed="'+on+'">'+E(lb[v])+'</button>'}).join('')+'</div>'+(dt&&!ex?'<span class="sm">'+E(V7U('dtype_auto','по ИНН'))+'</span>':'')+(!dt?'<span class="sm dchk">'+E(V7U('dtype_need','укажите тип должника'))+'</span>':'')+'</div>'+(b.hint?'<p class="sm">'+E(b.hint)+'</p>':'')}
  var auto=b.flag_from?cbAuto(t,b,DRA(t.id)):null;if(auto!=null&&!b.user_can_enable&&window.ArbExt)return ArbExt.cond(b,auto,E,V7U);return '<label class="dcond"><input type="checkbox" data-cond="'+E(b.flag)+'"'+(cbOn(t,b.flag)?' checked':'')+(auto?' disabled':'')+'> <b>'+E(b.label||b.flag)+'</b></label>'+(b.hint?'<p class="sm">'+E(b.hint)+'</p>':'')+(b.norm?'<p class="sm">'+E(b.norm)+'</p>':'')}).join('')+'</div>';
 var first=ed.querySelector('.fl .card');if(first)first.insertAdjacentHTML('beforebegin',h);else fm.insertAdjacentHTML('afterbegin',h)}
function rgMissing(t){var o=[];Object.keys(RGS(t)).forEach(function(g){rgItems(t,g).forEach(function(it,i){rgReg(t,g,i,it);(RGS(t)[g].fields||[]).forEach(function(k){if(!rgFieldOn(t,g,it,k)||rgCompB(t,k)||t.table_target==k||rgOpt(t,g,it,k)||noPrintF(t,k))return;if(!String(it[k]||'').trim())o.push(k+'#'+i)})})});return o}
function ncOf(k,t){var d=(S.drafts[t.id]||{}),c=curCase();return ((d._needs_check||[]).indexOf(k)>=0)||!!(c&&c.data&&(c.data._needs_check||[]).indexOf(k)>=0)}
/* ===== 1.7d: повторяющиеся группы ({{#each}}), наборы формулировок (choice_sets), флаги flag_from, таблица ст. 61.12 (table_rules), мягкие проверки (validations), шифрование encrypted:pin в черновиках, миграции deprecated_alias.
   Всё читается из index.json: наборы, флаги, правила сроков (computed/variants/scope), пороги проверок; в коде нет списков оснований и сроков. ===== */
function V7(){return (C&&C.v17)||{}}
function V7U(k,d,o){var s=(V7().ui||{})[k];if(s==null)s=d==null?k:d;if(o)Object.keys(o).forEach(function(n){s=String(s).split('{'+n+'}').join(o[n])});return s}
function CSET(id){return id&&(X.choice_sets||{})[id]||null}
function RGS(t){return (t&&t.repeat_groups)||{}}
function rgOf(k,t){var G=RGS(t);for(var g in G)if((G[g].fields||[]).indexOf(k)>=0)return g;return null}
function rgAll(t){var o=[],G=RGS(t);for(var g in G)o=o.concat(G[g].fields||[]);return o}
function DRA(tid){if(OV){OV.v=OV.v||{};return OV.v}return S.drafts[tid]||(S.drafts[tid]={})}
function rgItems(t,g){var d=DRA(t.id);if(!d._rg||typeof d._rg!='object')d._rg={};var L=d._rg[g];if(!Array.isArray(L))L=d._rg[g]=[];var mn=+((RGS(t)[g]||{}).min_items)||0;while(L.length<mn)L.push({});if(RGX()&&!rgItems.b){rgItems.b=1;try{RGX().pull(t,g,L)}finally{rgItems.b=0}}return L}
function tByIdQ(id){return (X.templates||[]).find(function(x){return x.id==id})||null}
function isoOf(v){v=String(v||'').trim();if(/^\d{2}\.\d{2}\.\d{4}$/.test(v))v=v.split('.').reverse().join('-');return /^\d{4}-\d\d-\d\d$/.test(v)?v:''}
function dmyOf(iso){return iso?iso.split('-').reverse().join('.'):''}
/* --- тип должника: явный выбор в карточке дела (_dtype) → по ИНН (12 цифр — гражданин/ИП, 10 — организация) --- */
function debtorType(c){c=c===undefined?curCase():c;var d=(c&&c.data)||{};if(d._dtype=='person'||d._dtype=='legal')return d._dtype;var inn=String(d.ДОЛЖНИК_ИНН||'').replace(/\D/g,'');if(inn.length==12)return 'person';if(inn.length==10)return 'legal';return null}
/* --- флаги: блоки документа и элементов групп --- */
function cbBlock(t,fl){return CBL(t).find(function(x){return x.flag==fl||x.id==fl})||null}
function cbScopeG(t,b){return b&&b.scope&&b.scope!='document'&&RGS(t)[b.scope]?b.scope:null}
function chValsOf(src,k,t){var s=src&&src['_ch_'+k];if(s&&Array.isArray(s.v))return s.v;return []}
function cbAuto(t,b,src){var ff=b&&b.flag_from;if(!ff)return null;var rx=RGX()?RGX().flag(t,ff,src):null;if(rx!=null)return rx;if(ff.debtor_type)return debtorType()==ff.debtor_type;if(ff.table!=null){var tn=TBon(t)?TB_().count(t,ff.table):0;return ff.empty===false?tn>0:tn==0}if(ff.field&&ff.filled!=null){var p0=raw.pr,fv;raw.pr=0;try{fv=raw(ff.field,t.id)}finally{raw.pr=p0}return (fv!=null&&String(fv).trim()!=='')==!!ff.filled}
 if(ff.field){var vs=chValsOf(src,ff.field,t);if(ff.equals!=null)return vs.length==1&&vs[0]==ff.equals;if(ff.includes!=null)return vs.indexOf(ff.includes)>=0;if(ff.only_values)return vs.length>0&&vs.every(function(v){return ff.only_values.indexOf(v)>=0})}return null}
function cbVal(t,fl,src){var b=cbBlock(t,fl),k='_if_'+fl;src=src||{};var a=b?cbAuto(t,b,src):null;if(a!=null){if(a)return true;return !!(b.user_can_enable&&src[k])}if(src[k]!=null)return !!src[k];return !!(b&&b.default_flag)}
/* --- наборы формулировок --- */
function isCu(o){return !!o&&(o.value=='custom'||o.id=='custom')}
function optVal(o){return o.value!=null?o.value:o.id}
function chOpts(f){var cs=CSET(f.choices);if(!cs)return [];var o=(cs.options||[]).slice();if(cs.allow_custom&&!o.some(isCu))o.push({value:'custom',label:V7U('custom','Свой вариант'),text:''});return o}
function chMulti(f){var cs=CSET(f.choices)||{};return f.multiple!=null?!!f.multiple:!!cs.multiple}
function chText(k,s){var f=F[k]||{},cs=CSET(f.choices);if(!cs||!s)return '';var O=chOpts(f),out=[];O.forEach(function(o){var v=optVal(o);if(s.v.indexOf(v)<0)return;if(isCu(o)){if(String(s.c||'').trim())out.push(String(s.c).trim());return}if(o.text)out.push(o.text)});return out.join(f.multiple_join||cs.multiple_join||'; ')}
function chGet(src,k){var s=src&&src['_ch_'+k];if(s&&Array.isArray(s.v))return s;var tv=String((src||{})[k]||'').trim();return tv?{v:['custom'],c:tv,legacy:1}:{v:[],c:''}}
function chSet(src,k,v,custom){var f=F[k]||{},s=chGet(src,k);s={v:s.v.slice(),c:s.c||''};if(custom!=null)s.c=custom;else if(chMulti(f)){var on=s.v.indexOf(v)<0;s.v=s.v.filter(function(x){return x!=v});if(on)s.v.push(v)}else s.v=s.v.length==1&&s.v[0]==v?[]:[v];src['_ch_'+k]=s;src[k]=chText(k,s);return s}
function vuNote(o){if(!o||!o.valid_until)return '';var n=dlAddDays(o.valid_until,1);return '<span class="dchvu" title="'+E(o.valid_until_note||'')+'">'+E(V7U('valid_until','Норма изменится с {d}',{d:dmyOf(n)}))+'</span>'}
function clip7(s,n){s=String(s||'');return s.length>n?s.slice(0,n-1).replace(/\s+\S*$/,'')+'…':s}
function chHtml(k,src,at){var f=F[k]||{},cs=CSET(f.choices)||{},s=chGet(src,k),O=chOpts(f).map(function(o){return RGX()&&CUR&&src?RGX().optF(CUR,src,o):o}),multi=chMulti(f);at=at||'';
 var seg=!multi&&O.length<=4&&O.every(function(o){return String(o.label||'').length<=16});
 var h='<div class="dch'+(seg?' dchseg':'')+'" data-chk="'+E(k)+'"'+at+' role="group" aria-label="'+E(f.label||k)+'">';
 if(seg)h+='<div class="dfmt dchs">'+O.map(function(o){var v=optVal(o),on=s.v.indexOf(v)>=0;return '<button type="button" data-chv="'+E(v)+'" class="'+(on?'on':'')+'" aria-pressed="'+on+'">'+E(o.label||v)+'</button>'}).join('')+'</div>';
 else{var grp=null;h+=O.map(function(o){var v=optVal(o),on=s.v.indexOf(v)>=0,cu=isCu(o),gh='';if(o.group&&o.group!=grp&&!cu){grp=o.group;gh='<div class="dchg">'+E(o.group)+'</div>'}
  return gh+'<button type="button" class="dcho'+(on?' on':'')+(cu?' cu':'')+(o.parent?' sub':'')+'" data-chv="'+E(v)+'" aria-pressed="'+on+'"><span class="ck" aria-hidden="true"></span><span class="tx"><b>'+E(o.label||v)+'</b>'+(cu?'':(o.text?'<span class="sm">'+E(clip7(o.text,120))+'</span>':'')+(o.norm?'<span class="nr">'+E(o.norm)+'</span>':''))+vuNote(o)+'</span></button>'}).join('')}
 if(s.v.indexOf('custom')>=0)h+='<textarea class="inp dchc" data-chc="1" rows="2" placeholder="'+E(V7U('custom_ph','Своя формулировка'))+'">'+E(s.c||'')+'</textarea>';
 (cs.excluded_options||[]).forEach(function(o){if(o.link_template&&tByIdQ(o.link_template))h+='<button type="button" class="dchlink" data-chlink="'+E(o.link_template)+'" title="'+E(o.reason||'')+'">'+E(((V7().link_cards||{})[o.link_template])||(o.label+' — отдельное заявление →'))+'</button>'});
 return h+'</div>'}
/* --- ключи элементов групп: ПОЛЕ#i --- */
function rgK(k){var m=/^(.+)#(\d+)$/.exec(k);return m?{b:m[1],i:+m[2]}:null}
function rgOpt(t,g,it,k){if((F[k]||{}).calculated)return true;var o=((V7().groups||{})[g]||{}).optional||{},L=o[cbVal(t,((V7().groups||{})[g]||{}).type_flag||'',it)?'person':'legal']||o.all||[];return L.indexOf(k)>=0||(o.all||[]).indexOf(k)>=0}
function rgReg(t,g,i,it){(RGS(t)[g].fields||[]).forEach(function(k){var nk=k+'#'+i,b=F[k]||{k:k,label:k,type:'text'};F[nk]=Object.assign({},b,{k:nk,label:(b.label||k)+' · '+(i+1),optional:rgOpt(t,g,it,k)||!!b.optional})})}
function rgFieldOn(t,g,it,k){var on=true;CBL(t).forEach(function(b){if(cbScopeG(t,b)==g&&(b.fields||[]).indexOf(k)>=0&&!cbVal(t,b.flag,it))on=false});return on}
function rgCompB(t,k){var b=dlBlock(t,k);return b&&b.scope&&RGS(t)[b.scope]?b:null}
function rgCompVariant(t,b,it){var v=(b.variants||[]).find(function(x){return x.flag&&cbVal(t,x.flag,it)});return v?Object.assign({},b,v):b}
function rgCalc(t,k,it){var b=rgCompB(t,k);if(!b||!b.from)return null;var f=isoOf(it[b.from]);if(!f)return null;var bb=rgCompVariant(t,b,it);if(bb.verified===false)return null;var r=dlCalc(bb,f);return r?Object.assign(r,{b:bb,from:f}):null}
function TR(t){return t&&t.table_rules||null}
function tbRows(t){var tr=TR(t);if(!tr)return [];var d=DRA(t.id);d._tb=d._tb||{};return d._tb[tr.name]||(d._tb[tr.name]=[])}
function money(v){var s=String(v==null?'':v).replace(/[\s\u00a0]/g,'').replace(',','.');if(!/^-?\d+(\.\d+)?$/.test(s))return null;return Math.round(parseFloat(s)*100)/100}
function moneyFmt(n){var a=Math.abs(n).toFixed(2).split('.');return (n<0?'-':'')+a[0].replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')+','+a[1]}
function tbCols(t){var m={};(t.table_schema||[]).forEach(function(c){var k=c.field,K=k;if(c.type=='date')m.date=k;else if(c.type=='money')m.sum=k;else if(c.type=='enum')m.ex=k;else if(/КРЕДИТОР/.test(k))m.cred=k;else if(/ОСНОВАНИЕ/.test(k))m.basis=k;else if(/ОПРЕДЕЛЕНИЕ/.test(k))m.act=k});return m}
/* сумма по sum_rule: дата строки ПОЗЖЕ даты ответчика, исключение ≠ «да»; строки без даты не входят */
function tbSum(t,base){var cm=tbCols(t),o={sum:0,n:0,nodate:0,before:0,ex:0};if(!base)return null;tbRows(t).forEach(function(r){var d=isoOf(r[cm.date]),m=money(r[cm.sum]);if(!d){o.nodate++;return}if(String(r[cm.ex]||'')=='да'){o.ex++;return}if(d<=base){o.before++;return}if(m==null)return;o.sum+=m;o.n++});o.sum=Math.round(o.sum*100)/100;return o}
function rgRaw(k,tid){var p=rgK(k),t=tByIdQ(tid);if(!p||!t)return '';var g=rgOf(p.b,t);if(!g)return '';var it=rgItems(t,g)[p.i];if(!it)return '';
 if(raw.pr&&!rgFieldOn(t,g,it,p.b))return '';
 if(rgCompB(t,p.b)){var r=rgCalc(t,p.b,it);return r?r.iso:''}
 var tr=TR(t);if(tr&&t.table_target==p.b&&tr.scope==g){var c=rgCalc(t,tbBaseKey(t),it),s=c&&tbSum(t,c.iso);return s?moneyFmt(s.sum):''}
 var v=it[p.b];return v==null?'':v}
function tbBaseKey(t){var k=null;(rgAll(t)).forEach(function(f){if(!k&&rgCompB(t,f))k=f});return k}
/* --- {{#each}} в md и docx; {{#if}} внутри — по флагам элемента (scope группы) или документа --- */
function ifOn(t,fl,it){var b=cbBlock(t,fl);if(b&&cbScopeG(t,b))return cbVal(t,fl,it);if(!b&&it&&((V7().item_flags||[]).indexOf(fl)>=0))return !!it['_if_'+fl];return cbOn(t,fl)}
function rgSub(s,t,g,i){s=s.split('{{@number}}').join(RGX()?RGX().num(t,g,i):i+1);(RGS(t)[g].fields||[]).forEach(function(k){s=s.split('{{'+k+'}}').join('{{'+k+'#'+i+'}}');s=s.replace(new RegExp('\\{\\{#if\\s+'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\}\\}','g'),'{{#if '+k+'#'+i+'}}')});return s}
function rgMd(s,t){s=String(s);if(s.indexOf('{{#each')<0)return s;var L=s.split('\n'),out=[],i=0;
 while(i<L.length){var m=/^\s*\{\{#each\s+([^}\s]+)\s*\}\}\s*$/.exec(L[i]);if(!m){out.push(L[i++]);continue}var g=m[1],body=[];i++;while(i<L.length&&!/^\s*\{\{\/each\}\}\s*$/.test(L[i]))body.push(L[i++]);i++;
  if(!RGS(t)[g])continue;rgItems(t,g).forEach(function(it,n){rgReg(t,g,n,it);if(RGX()&&RGX().skip(t,g,it,n))return;var skip=0;body.forEach(function(l){var mi=/^\s*\{\{#if\s+([^}\s]+)\s*\}\}\s*$/.exec(l);if(mi){skip=ifOn(t,mi[1],it)?0:1;return}if(/^\s*\{\{\/if\}\}\s*$/.test(l)){skip=0;return}if(!skip)out.push(rgSub(l,t,g,n))})})}
 return out.join('\n')}
function rgXml(x,t){if(x.indexOf('{{#each')<0)return x;var tx=function(p){return (p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(y){return y.replace(/<[^>]+>/g,'')}).join('').trim()};
 var body=[],g=null;
 var re=/<w:p[ >][\s\S]*?<\/w:p>/g,mm,out='',last=0;
 while((mm=re.exec(x))){var p=mm[0],q=tx(p),me=/^\{\{#each\s+([^}\s]+)\s*\}\}$/.exec(q);
  if(me&&g==null){out+=x.slice(last,mm.index);g=me[1];body=[];last=re.lastIndex;continue}
  if(g!=null){if(q=='{{/each}}'){var gg=g;g=null;last=re.lastIndex;if(RGS(t)[gg])rgItems(t,gg).forEach(function(it,n){rgReg(t,gg,n,it);if(RGX()&&RGX().skip(t,gg,it,n))return;var skip=0;body.forEach(function(bp){var qq=tx(bp),mi=/^\{\{#if\s+([^}\s]+)\s*\}\}$/.exec(qq);if(mi){skip=ifOn(t,mi[1],it)?0:1;return}if(qq=='{{/if}}'){skip=0;return}if(!skip)out+=rgSub(bp,t,gg,n)})});continue}
   body.push(p);last=re.lastIndex;continue}}
 return out+x.slice(last)}
/* --- мягкая проверка периода (validations): «A < B − N лет/мес/дн»; годы — п. 3 ст. 192 ГК (то же число, иначе последний день месяца) --- */
function vParse(c){var m=/^\s*([А-ЯЁA-Z0-9_]+)\s*<\s*([А-ЯЁA-Z0-9_]+)\s*[−\-–]\s*(\d+)\s*(год|года|лет|месяц|месяца|месяцев|дн|дня|дней|день)/i.exec(String(c||''));if(!m)return null;var u=/^(год|лет)/i.test(m[4])?'years':/^мес/i.test(m[4])?'months':'calendar_days';return {a:m[1],b:m[2],n:+m[3],u:u}}
function vCheck(t,g,it){var o=[];(t.validations||[]).forEach(function(v){if(v.scope&&v.scope!=g)return;var p=vParse(v.condition);if(!p)return;var get=function(k){return isoOf(rgOf(k,t)==g?it[k]:raw(k,t.id))};var a=get(p.a),b=get(p.b);if(!a||!b)return;var lim=p.u=='calendar_days'?dlAddDays(b,-p.n):dlAddMonths(b,-(p.u=='years'?12:1)*p.n);if(a<lim)o.push({id:v.id,msg:v.message||'',lim:lim,norm:v.norm||''})});return RGX()?o.concat(RGX().rules(t,g,it)):o}
/* --- форма: карточки элементов групп --- */
function flagLabel(t,fl){var b=cbBlock(t,fl);if(b&&b.label)return b.label;var L=(V7().flag_labels||{})[fl];if(L)return L;var lab=fl;Object.keys(t.computed||{}).forEach(function(k){var c=t.computed[k];(c&&c.variants||[]).forEach(function(v){if(v.flag==fl&&v.condition)lab=v.condition.charAt(0).toUpperCase()+v.condition.slice(1)})});return lab}
function gInp(t,g,i,k,v){var f=F[k]||{k:k,label:k,type:'text'};return inp(f,v,'dg'+i).replace(/ data-k="[^"]*"/,' data-gk="'+E(k)+'" data-gg="'+E(g)+'" data-gi="'+i+'"').replace(/<(input|textarea|select)/,'<$1 class="inp"'+(RGX()&&RGX().locked(t,g,k)?' readonly':''))}
function gLab(t,g,k){var o=((V7().groups||{})[g]||{}).labels||{};return o[k]||(F[k]||{}).label||k}
function gHint(t,g,k){var o=((V7().groups||{})[g]||{}).hints||{};return o[k]||''}
function rgItemHtml(t,g,it,i){var gm=RGS(t)[g],gc=(V7().groups||{})[g]||{},L=rgItems(t,g),tf=gc.type_flag,at=' data-gg="'+E(g)+'" data-gi="'+i+'"',isP=tf?cbVal(t,tf,it):false;
 var h='<div class="drgi" data-gi="'+i+'"><div class="drgh"><b>'+E((gc.item||'№')+' '+RGX().numUI(t,g,i))+'</b>'+(it.ОТВЕТЧИК||it[(gm.fields||[])[0]]?'<span class="sm drgnm">'+E(clip7(it[(gm.fields||[])[0]],48))+'</span>':'')+'<span class="sp"></span>'+(L.length>(+gm.min_items||0)&&RGX().removable(t,g,i)?'<button type="button" class="link drgdel" data-rgdel="'+i+'"'+at+'>'+E(V7U('remove','Удалить'))+'</button>':'')+'</div>';
 if(tf&&(gm.flags||[]).indexOf(tf)>=0){var lb=gc.type_labels||['Организация','Гражданин'];h+='<div class="dfmt drgt" role="group">'+[0,1].map(function(n){var on=n?isP:!isP;return '<button type="button" data-rgflag="'+E(tf)+'" data-rgfv="'+n+'"'+at+' class="'+(on?'on':'')+'" aria-pressed="'+on+'">'+E(lb[n])+'</button>'}).join('')+'</div>'}
 if(window.ArbCP&&gc.pick_cp!==false){var c=curCase(),cps=(ArbCP.pick?ArbCP.pick(null,c&&c.id):[]).filter(function(x){return x&&x.name});if(cps.length)h+='<label class="f drgcp"><span>'+E(V7U('pick_cp','Из контрагентов'))+'</span><select class="inp" data-rgcp="1"'+at+'><option value="">—</option>'+cps.slice(0,400).map(function(x){return '<option value="'+E(x.id)+'">'+E(x.name+(x.inn?' · ИНН '+x.inn:''))+'</option>'}).join('')+'</select></label>'}
 (gm.flags||[]).forEach(function(fl){if(fl==tf)return;var b=cbBlock(t,fl);if(b&&b.flag_from&&!b.user_can_enable)return;var on=cbVal(t,fl,it),auto=b&&b.flag_from?cbAuto(t,b,it):null;
  h+='<label class="dcond drgf"><input type="checkbox" data-rgflag="'+E(fl)+'"'+at+(on?' checked':'')+(auto?' disabled':'')+'> <b>'+E(flagLabel(t,fl))+'</b>'+(auto?' <span class="sm">· '+E(V7U('auto_on','включено по выбранным основаниям'))+'</span>':'')+'</label>'});
 var base=tbBaseKey(t);
 h+='<div class="g2 drgfs">';(gm.fields||[]).forEach(function(k){if(!rgFieldOn(t,g,it,k))return;var f=F[k]||{k:k,label:k,type:'text'},wide=f.choices||f.type=='textarea'||/ОТВЕТЧИК$|АДРЕС|ОПИСАНИЕ/.test(k);
  if(rgCompB(t,k)||t.table_target==k)return;
  if(f.choices){h+='<div class="f dwide" data-w="'+E(k)+'#'+i+'"><span class="dchl">'+E(gLab(t,g,k))+'</span>'+chHtml(k,it,at+' data-gk="'+E(k)+'"')+'</div>';return}
  var v=it[k]||'',e=!String(v).trim()&&!rgOpt(t,g,it,k),nc=(it._needs_check||[]).indexOf(k)>=0;
  h+='<label class="f'+(e?' empty':'')+(nc?' dnc':'')+(wide?' dwide':'')+'" data-w="'+E(k)+'#'+i+'"><span>'+E(gLab(t,g,k))+(rgOpt(t,g,it,k)?' <span class="sm">('+E(FU('optional'))+')</span>':'')+'</span>'+gInp(t,g,i,k,v)+'</label>';
  if(nc)h+='<div class="src dwide dncn">'+E(V7U('needs_check','Проверьте: значение перенесено из старого поля'))+'</div>';
  if(gHint(t,g,k))h+='<div class="src dwide drghint">'+E(gHint(t,g,k))+'</div>';
  if(base&&rgCompB(t,base).from==k){var r=rgCalc(t,base,it);h+='<div class="dwide dlc sm drgres" data-rgres="'+i+'">'+(r?'<button type="button" class="link drgexp" data-rgexp="'+i+'"'+at+'>'+E(V7U('st9_res','∑ срок истёк {d}',{d:dmyOf(r.iso)}))+'</button>'+(it._exp?'<div class="drgcalc">'+E(calcTxt(t,r))+'</div>':''):E(V7U('st9_wait','Дата истечения срока появится после ввода даты')))+'</div>'}});
 h+='</div>';
 if(TR(t)&&base&&rgFieldOn(t,g,it,t.table_target)){var r2=rgCalc(t,base,it),s2=r2&&tbSum(t,r2.iso);h+='<div class="drgsum sm">'+E(V7U('sum61','Размер по ст. 61.12'))+': <b>'+(s2?E(moneyFmt(s2.sum))+' руб.':'—')+'</b>'+(s2?' · '+E(V7U('sum_after','∑ после {d} · {n}',{d:dmyOf(r2.iso),n:s2.n+' '+pl(s2.n,'строка','строки','строк')})):'')+'</div>'}
 vCheck(t,g,it).forEach(function(w){h+='<div class="dlw drgw" role="note">'+E(w.msg)+'</div>'});
 return h+'</div>'}
function calcTxt(t,r){var b=r.b;return V7U('calc','{from} + {n} {u} ({norm}) = {raw}{sh}',{from:dmyOf(r.from),n:b.offset,u:dlUnitTxt(+b.offset,b.unit),norm:b.norm||'',raw:dmyOf(r.raw),sh:r.shift?' → '+dmyOf(r.iso)+' ('+V7U('shift','перенос на рабочий день, ст. 193 ГК')+')':''})}
function rgHtml(t){var G=RGS(t),h='';for(var g in G){var gm=G[g],L=rgItems(t,g),gc=(V7().groups||{})[g]||{};
  h+='<div class="card drg" id="drg_'+E(g)+'" data-rgg="'+E(g)+'"><h3>'+E(gm.label||g)+' <span class="cnt">'+L.length+'</span></h3>'+RGX().head(t,g)+L.map(function(it,i){return rgItemHtml(t,g,it,i)}).join('')+RGX().addBtn(t,g,gc.add)+'</div>'}
 if(TR(t)&&tbNeed(t))h+=tbHtml(t);return h}
function tbNeed(t){var tr=TR(t),g=tr&&tr.scope;if(!g||!RGS(t)[g])return false;var bk=tbBaseKey(t);return rgItems(t,g).some(function(it){return rgFieldOn(t,g,it,t.table_target)||(bk&&rgFieldOn(t,g,it,bk))})}
/* --- таблица ст. 61.12 --- */
function tbHtml(t){var tr=TR(t),g=tr.scope,cm=tbCols(t),R=tbRows(t),sc=TSC(t),bases=[];rgItems(t,g).forEach(function(it,i){if(!rgFieldOn(t,g,it,t.table_target))return;var r=rgCalc(t,tbBaseKey(t),it);bases.push({i:i,it:it,r:r})});
 var minB=bases.filter(function(b){return b.r}).map(function(b){return b.r.iso}).sort()[0]||'',nod=R.filter(function(r){return !isoOf(r[cm.date])}).length,gc=(V7().groups||{})[g]||{};
 var h='<div class="card dtb" id="dtb61"><h3>'+E(V7U('tb_title','Обязательства для размера по ст. 61.12'))+' <span class="cnt">'+R.length+'</span></h3><p class="sm">'+E(tr.norm||'')+'</p>';
 h+=bases.map(function(b){var s=b.r&&tbSum(t,b.r.iso);return '<div class="dtbh">'+E((gc.item||'№')+' '+(b.i+1))+(b.it.ОТВЕТЧИК?' · '+E(clip7(b.it.ОТВЕТЧИК,40)):'')+': '+(b.r?'<button type="button" class="link" data-tbexp="'+b.i+'">'+E(V7U('sum_after','∑ после {d} · {n}',{d:dmyOf(b.r.iso),n:s.n+' '+pl(s.n,'строка','строки','строк')}))+'</button> = <b>'+E(moneyFmt(s.sum))+' руб.</b>'+(DTBX[b.i]?'<div class="drgcalc">'+E(calcTxt(t,b.r))+'</div>':''):'<span class="sm">'+E(V7U('tb_nobase','нет даты возникновения обстоятельств — сумма не считается'))+'</span>')+'</div>'}).join('');
 if(nod)h+='<div class="dtbban" role="status">'+E(V7U('tb_nodate','{n} без даты возникновения — не учтены в сумме',{n:nod+' '+pl(nod,'строка','строки','строк')}))+' · <button type="button" class="link" data-tbshow="1">'+E(V7U('show','Показать'))+'</button></div>';
 h+='<div class="dtbrows">'+R.map(function(r,i){var d=isoOf(r[cm.date]),ex=String(r[cm.ex]||'')=='да',before=d&&minB&&d<=minB,cls=!d?' nodate':ex?' ex':before?' before':'';
  var fi=function(k,ph){var c=sc[k]||{},f={k:k,label:c.label||k,type:c.type=='date'?'date':'text'};return '<label class="f"><span>'+E(c.label||k)+'</span>'+inp(f,c.type=='date'?d:r[k]||'','dt'+i).replace(/ data-k="[^"]*"/,' data-tbk="'+E(k)+'" data-tbi="'+i+'"').replace(/<(input|textarea)/,'<$1 class="inp"')+'</label>'};
  return '<div class="dtbr'+cls+'" data-tbi="'+i+'">'+fi(cm.cred)+fi(cm.basis)+fi(cm.date)+(d?'':'<div class="dtbnd sm">'+E(V7U('need_date','укажите дату возникновения'))+'</div>')+fi(cm.sum)+fi(cm.act)+
   '<div class="dtbex"><label class="dcond"><input type="checkbox" data-tbex="'+i+'"'+(ex?' checked':'')+'> '+E(V7U('exclude','исключить (п. 3 ст. 61.12)'))+'</label>'+(ex?'<input class="inp" data-tbwhy="'+i+'" placeholder="'+E(V7U('exclude_why','причина исключения'))+'" value="'+E(r._why||'')+'">':'')+'<span class="sp"></span><button type="button" class="link" data-tbdel="'+i+'">'+E(V7U('remove','Удалить'))+'</button></div></div>'}).join('')+'</div>';
 h+='<div class="dtbbtn"><button type="button" class="btn ghost" data-tbadd="1">'+E(V7U('tb_add','+ Строка'))+'</button>'+(window.ArbCP?'<button type="button" class="btn ghost" data-tbfill="1">'+E(V7U('tb_fill','Заполнить из реестра кредиторов'))+'</button>':'')+'</div><p class="sm">'+E(V7U('tb_note','Дата — день возникновения обязательства (договор, поставка, услуга) по основанию из определения о включении; не дата определения и не срок оплаты.'))+'</p></div>';
 return h}
var DTBX={};
/* предзаполнение из реестра кредиторов: только строки, где известна дата основания (basis_date) */
function tbFill(t){var cm=tbCols(t),R=tbRows(t),c=curCase(),n=0,skip=0;if(!window.ArbCP)return 0;(ArbCP.pick(['creditor'],c&&c.id)||[]).forEach(function(cp){(cp.claims||cp.au_claims||[]).forEach(function(cl){var bd=isoOf(cl.basis_date||cl.obligation_date);if(!bd){skip++;return}var key=(cp.name||'')+'|'+bd+'|'+(cl.amount||'');if(R.some(function(r){return r._src==key}))return;var o={_src:key};o[cm.cred]=cp.name||'';o[cm.basis]=cl.basis||'';o[cm.date]=bd;o[cm.sum]=cl.amount!=null?String(cl.amount):'';o[cm.act]=cl.act||cl.court_act||'';o[cm.ex]='нет';R.push(o);n++})});return {n:n,skip:skip}}
/* --- события формы 1.7d --- */
function v7Redraw(){if(!CUR)return;save();FL.need=null;var y=window.scrollY;Promise.resolve(openT(CUR.id,1)).then(function(){window.scrollTo(0,y)})}
function v7Soft(){save();try{prev()}catch(e){}try{needSync()}catch(e){}}
function v7Src(el){var w=el.closest('[data-gg]')||el;if(w.dataset&&w.dataset.gg!=null&&w.dataset.gi!=null&&CUR){var L=rgItems(CUR,w.dataset.gg);return L[+w.dataset.gi]||null}return CUR?DRA(CUR.id):null}
function v7Bind(root){if(!root||root._v7)return;root._v7=1;
 root.addEventListener('click',function(e){if(!CUR)return;var b=e.target.closest('[data-chv],[data-rgadd],[data-rgdel],[data-rgflag][data-rgfv],[data-rgexp],[data-tbexp],[data-tbadd],[data-tbdel],[data-tbfill],[data-tbshow],[data-chlink],[data-dtype],[data-ppay]');if(!b||!root.contains(b))return;var t=CUR;
  if(b.dataset.chv!=null){var w=b.closest('[data-chk]'),k=w.dataset.chk,src=w.dataset.gg!=null?v7Src(w):DRA(t.id);if(!src)return;chSet(src,k,b.dataset.chv);v7Redraw();return}
  if(b.dataset.rgadd){rgItems(t,b.dataset.rgadd).push({});v7Redraw();return}
  if(b.dataset.rgdel!=null){var L=rgItems(t,b.dataset.gg);L.splice(+b.dataset.rgdel,1);v7Redraw();return}
  if(b.dataset.rgflag&&b.dataset.rgfv!=null){var it=v7Src(b);if(it){it['_if_'+b.dataset.rgflag]=b.dataset.rgfv=='1';v7Redraw()}return}
  if(b.dataset.rgexp!=null){var it2=v7Src(b);if(it2){it2._exp=!it2._exp;v7Redraw()}return}
  if(b.dataset.tbexp!=null){DTBX[b.dataset.tbexp]=!DTBX[b.dataset.tbexp];v7Redraw();return}
  if(b.dataset.tbadd){var o={};o[tbCols(t).ex]='нет';tbRows(t).push(o);v7Redraw();return}
  if(b.dataset.tbdel!=null){tbRows(t).splice(+b.dataset.tbdel,1);v7Redraw();return}
  if(b.dataset.tbfill){var r=tbFill(t);toast(r&&r.n?V7U('tb_filled','Добавлено строк: {n}',{n:r.n})+(r.skip?' · '+V7U('tb_skip','без даты основания пропущено: {n}',{n:r.skip}):''):V7U('tb_none','В реестре нет требований с датой основания — заполните вручную'),3500);v7Redraw();return}
  if(b.dataset.tbshow){var x=root.querySelector('.dtbr.nodate');if(x){x.scrollIntoView({block:'center'});x.classList.add('flash');var q=x.querySelector('[data-tbk]');setTimeout(function(){x.classList.remove('flash')},1600)}return}
  if(b.dataset.chlink){v7Link(t,b.dataset.chlink);return}
  if(b.dataset.dtype){var c=curCase();if(c){c.data=c.data||{};c.data._dtype=b.dataset.dtype;save()}v7Redraw();return}
  if(b.dataset.ppay){ppAttach(t);return}});
 root.addEventListener('input',function(e){var i=e.target;if(!CUR)return;
  if(i.dataset.gk&&!i.closest('[data-chk]')){var it=v7Src(i);if(!it)return;var v=i.type=='checkbox'?i.checked:i.value;if(i.dataset.date){var iso=isoOf(v);if(v&&!iso)return;v=iso}it[i.dataset.gk]=v;if(it._needs_check)it._needs_check=it._needs_check.filter(function(x){return x!=i.dataset.gk});var lb=i.closest('label.f');if(lb)lb.classList.toggle('empty',!String(v).trim()&&!rgOpt(CUR,i.dataset.gg,it,i.dataset.gk));v7Soft();return}
  if(i.dataset.chc){var w=i.closest('[data-chk]'),src=w.dataset.gg!=null?v7Src(w):DRA(CUR.id);if(src){chSet(src,w.dataset.chk,null,i.value);v7Soft()}return}
  if(i.dataset.tbk){var r=tbRows(CUR)[+i.dataset.tbi];if(!r)return;var v2=i.value;if(i.dataset.date){var iso2=isoOf(v2);if(v2&&!iso2)return;v2=iso2}r[i.dataset.tbk]=v2;v7Soft();return}
  if(i.dataset.tbwhy!=null){var r2=tbRows(CUR)[+i.dataset.tbwhy];if(r2){r2._why=i.value;save()}return}
  if(i.dataset.ppsum!=null){var d=DRA(CUR.id);d._pp_sum=i.value;save();return}},true);
 root.addEventListener('change',function(e){var i=e.target;if(!CUR)return;
  if(i.dataset.rgflag&&i.type=='checkbox'){var it=v7Src(i);if(it){it['_if_'+i.dataset.rgflag]=i.checked;v7Redraw()}return}
  if(i.dataset.rgcp){var it2=v7Src(i),cp=ArbCP.get&&ArbCP.get(i.value);if(it2&&cp){cpToItem(CUR,i.dataset.gg,it2,cp);v7Redraw()}return}
  if(i.dataset.tbex!=null){var r=tbRows(CUR)[+i.dataset.tbex];if(r){r[tbCols(CUR).ex]=i.checked?'да':'нет';v7Redraw()}return}
  if((i.dataset.gk&&(i.dataset.date||i.type=='checkbox'))||(i.dataset.tbk&&i.dataset.date)){v7Redraw();return}
  if(i.dataset.gk&&/ОСНОВАНИЕ|ДАТА/.test(i.dataset.gk))v7Redraw()},true)}
function cpToItem(t,g,it,cp){var M=((V7().groups||{})[g]||{}).cp_map||{};Object.keys(M).forEach(function(k){var v=cp[M[k]];if(v!=null&&String(v).trim())it[k]=String(v)});if(!it[Object.keys(M).find(function(k){return M[k]=='addr_legal'})||'']&&cp.addr_post){var ka=Object.keys(M).find(function(k){return M[k]=='addr_legal'});if(ka)it[ka]=cp.addr_post}
 var tf=((V7().groups||{})[g]||{}).type_flag;if(tf)it['_if_'+tf]=['fl','ip','person'].indexOf(cp.kind)>=0;it._cp=cp.id}
/* ссылка-карточка: новый документ (напр. убытки по ст. 61.13) с теми же ответчиками */
function v7Link(t,tid){var nt=tByIdQ(tid);if(!nt)return;var src=DRA(t.id),dst=S.drafts[tid]=S.drafts[tid]||{};dst._rg=dst._rg||{};Object.keys(RGS(nt)).forEach(function(g){if(!RGS(t)[g])return;var keep=(RGS(nt)[g].fields||[]).concat((RGS(nt)[g].flags||[]).map(function(f){return '_if_'+f}));var cur=dst._rg[g]||[],has=cur.some(function(x){return Object.keys(x).some(function(k){return String(x[k]||'').trim()})});if(has)return;dst._rg[g]=rgItems(t,g).map(function(it){var o={};keep.forEach(function(k){if(it[k]!=null)o[k]=it[k]});if(it._cp)o._cp=it._cp;return o})});
 ['ГОСПОШЛИНА','_ch_ГОСПОШЛИНА'].forEach(function(k){if(src[k]!=null&&dst[k]==null&&nt.fields.indexOf('ГОСПОШЛИНА')>=0)dst[k]=JSON.parse(JSON.stringify(src[k]))});save();toast(V7U('linked','Создан документ «{t}» — ответчики перенесены',{t:nt.title}),3000);openT(tid)}
/* платёжное поручение по пошлине: файл → архив дела (шифруется ключом PIN), отметка в черновике */
function ppAttach(t){var i=document.createElement('input');i.type='file';i.accept='.pdf,.jpg,.jpeg,.png,.doc,.docx';i.onchange=async function(){var f=i.files&&i.files[0];if(!f)return;if(!window.ArbArch||!ArbArch.add){toast(V7U('pp_noarch','Архив недоступен'));return}
 try{var c=curCase();var id=await ArbArch.add({case:c?c.id:'',kind:'in',title:V7U('pp_title','Платёжное поручение (госпошлина)'),tid:t.id,fname:f.name,t:Date.now(),src:'pp'},f,true);var d=DRA(t.id);d._pp={id:id||1,name:f.name,t:Date.now()};save();toast(V7U('pp_ok','Платёжка сохранена в архиве дела (зашифрована)'),3000);v7Redraw()}catch(e){toast(V7U('pp_err','Не удалось сохранить файл'))}};i.click()}
/* блок «Государственная пошлина»: сегменты + сумма «проверить» (не печатается) + платёжка */
function poshHtml(t){var k='ГОСПОШЛИНА',f=F[k];if(!f||!f.choices||t.fields.indexOf(k)<0)return '';var d=DRA(t.id),s=chGet(d,k),paid=s.v.length==1&&s.v[0]=='paid',pp=d._pp;
 var h='<div class="card dposh"><h3>'+E(f.label||k)+'</h3>'+chHtml(k,d,'');
 if(paid)h+='<div class="g2"><label class="f"><span>'+E(V7U('pp_sum','Сумма пошлины, руб.'))+' <span class="dchk">'+E(V7U('check','проверить'))+'</span></span><input class="inp" inputmode="decimal" data-ppsum="1" value="'+E(d._pp_sum||'')+'"></label><div class="f"><span>'+E(V7U('pp_doc','Платёжное поручение'))+'</span><button type="button" class="btn ghost" data-ppay="1">'+E(pp?V7U('pp_re','Заменить платёжку'):V7U('pp_add','Приложить платёжку'))+'</button>'+(pp?'<div class="sm">'+E(pp.name)+' · '+E(V7U('pp_in','в архиве дела'))+'</div>':'')+'</div></div><p class="sm">'+E(V7U('pp_note','Сумма в документ не печатается: ставка в деле о банкротстве не сверена — проверьте по ст. 333.21 НК.'))+'</p>';
 if(s.v.length==1&&s.v[0]=='deferral')h+='<p class="sm">'+E(V7U('def_note','Отдельный документ не нужен: пункт об отсрочке и приложение добавятся в заявление.'))+'</p>';
 return h+'</div>'}
/* миграции deprecated_alias: карточки дел и черновики (по описанию в index.json) */
function aliasFor(w,tid){if(!w)return true;var h=String(w).split(/[;(]/)[0],ids=h.split(/[\s,]+/).filter(function(x){return /^[a-z][a-z_0-9]+$/.test(x)&&x.indexOf('_')>0});return !ids.length||ids.indexOf(tid)>=0}
function v7Migrate(s){var FX=X.fields||{},rep=[];var digits=function(v){return String(v||'').replace(/\D/g,'')};
 (s.cases||[]).forEach(function(c){var d=c.data||{};if(d.ДОЛЖНИК_ОГРН_СНИЛС==null)return;var v=String(d.ДОЛЖНИК_ОГРН_СНИЛС).trim(),n=digits(v).length;if(v){if((n==13||n==15)&&!d.ДОЛЖНИК_ОГРН)d.ДОЛЖНИК_ОГРН=digits(v);else if(n==11&&!d.ДОЛЖНИК_СНИЛС)d.ДОЛЖНИК_СНИЛС=v;else{if(!d.ДОЛЖНИК_ОГРН)d.ДОЛЖНИК_ОГРН=v;(d._needs_check=d._needs_check||[]).push('ДОЛЖНИК_ОГРН')}}d._legacy=Object.assign(d._legacy||{},{ДОЛЖНИК_ОГРН_СНИЛС:v});delete d.ДОЛЖНИК_ОГРН_СНИЛС;rep.push(c.id)});
 Object.keys(s.drafts||{}).forEach(function(tid){var d=s.drafts[tid],t=tByIdQ(tid);if(!d||!t||tid.charAt(0)=='_')return;
  if(d.ДОЛЖНИК_ОГРН_СНИЛС!=null){var v=String(d.ДОЛЖНИК_ОГРН_СНИЛС).trim(),n=digits(v).length;if(v){if(n==11)d.ДОЛЖНИК_СНИЛС=d.ДОЛЖНИК_СНИЛС||v;else{d.ДОЛЖНИК_ОГРН=d.ДОЛЖНИК_ОГРН||v;if(n!=13&&n!=15)(d._needs_check=d._needs_check||[]).push('ДОЛЖНИК_ОГРН')}}delete d.ДОЛЖНИК_ОГРН_СНИЛС}
  var G=RGS(t);if(RGX())RGX().migItems(tid,d);
  var AM=((X.field_meta||{}).deprecated_aliases_map)||{};Object.keys(AM).forEach(function(old){var m=AM[old];if(d[old]==null||(m.templates&&m.templates.indexOf(tid)<0))return;var g=String(m.replaced_by||'').replace(/^repeat_groups\./,'');if(G[g]){d._rg=d._rg||{};var L=d._rg[g]=d._rg[g]||[],ov=String(d[old]).trim(),ix=m.item_index!=null?+m.item_index:0,f0=m.item_field||(G[g].fields||[])[0];if(!L.length)L.push({});if(ov){while(L.length<=ix)L.push({});if(!String(L[ix][f0]||'').trim()){if(m.convert&&RGX())RGX().conv(Object.assign({from:old},m),d,L[ix],f0,d[old]);else{L[ix][f0]=String(d[old]);if(m.item_index==null||m.needs_check)(L[ix]._needs_check=L[ix]._needs_check||[]).push(f0)}}else if(String(L[ix][f0])!=String(d[old]))(d._legacy=d._legacy||{})[old]=d[old]}delete d[old]}});
  Object.keys(FX).forEach(function(nk){(FX[nk].deprecated_alias||[]).forEach(function(a){var old=a.field;if(!old||d[old]==null||String(old)==='ДОЛЖНИК_ОГРН_СНИЛС')return;if(!aliasFor(a.when,tid))return;
   var g=rgOf(nk,t),v=d[old];if(g){d._rg=d._rg||{};var L=d._rg[g]=d._rg[g]||[];if(!L.length)L.push({});var into=(V7().alias_into||{})[nk];L.forEach(function(it){if(it[nk])return;if(into&&!(chValsOf(it,into.field,t).indexOf(into.includes)>=0)&&L.length>1)return;it[nk]=v;if(a.needs_check)(it._needs_check=it._needs_check||[]).push(nk)})}else if(d[nk]==null||d[nk]===''){d[nk]=v;if(a.needs_check)(d._needs_check=d._needs_check||[]).push(nk)}delete d[old]})})});return rep}
/* encrypted:pin — значения не пишутся в localStorage; хранятся в IndexedDB под ключом PIN (_sec) */
function encKeys(){var o=[],FX=X&&X.fields||{};Object.keys(FX).forEach(function(k){if(FX[k].encrypted=='pin')o.push(k)});return o}
function secSplit(drafts){var EK=encKeys(),pub={},sec={};Object.keys(drafts||{}).forEach(function(tid){var d=drafts[tid];if(!d||typeof d!='object'){pub[tid]=d;return}var p=Object.assign({},d),s={};EK.forEach(function(k){if(p[k]!=null&&p[k]!==''){s[k]=p[k]}delete p[k]});if(p._rg){p._rg={};Object.keys(d._rg).forEach(function(g){p._rg[g]=(d._rg[g]||[]).map(function(it,i){var c=Object.assign({},it);EK.forEach(function(k){if(c[k]!=null&&c[k]!==''){((s._rg=s._rg||{})[g]=s._rg[g]||{})[i]=Object.assign(((s._rg||{})[g]||{})[i]||{},{[k]:c[k]})}delete c[k]});return c})})}pub[tid]=p;if(Object.keys(s).length)sec[tid]=s});return {pub:pub,sec:sec}}
function secMerge(sec){Object.keys(sec||{}).forEach(function(tid){var s=sec[tid],d=S.drafts[tid]=S.drafts[tid]||{};Object.keys(s).forEach(function(k){if(k=='_rg')return;if(d[k]==null||d[k]==='')d[k]=s[k]});Object.keys(s._rg||{}).forEach(function(g){var L=((d._rg=d._rg||{})[g]=d._rg[g]||[]);Object.keys(s._rg[g]).forEach(function(i){L[i]=L[i]||{};Object.keys(s._rg[g][i]).forEach(function(k){if(L[i][k]==null||L[i][k]==='')L[i][k]=s._rg[g][i][k]})})})})}
var SECST=0;function secSaveSoon(sec){clearTimeout(SECST);SECST=setTimeout(async function(){if(!CREADY||!encOK())return;try{await ArbDB.put('managers',{id:'_sec',c:await ArbArch.enc(new TextEncoder().encode(JSON.stringify(sec)))})}catch(e){}},250)}
async function secLoad(){if(!encOK())return;try{var r=await ArbDB.get('managers','_sec');if(r&&r.c)secMerge(JSON.parse(new TextDecoder().decode(await ArbArch.dec(r.c))))}catch(e){}}
function stripCaseEnc(cases){var EK=encKeys();return (cases||[]).map(function(c){var d=Object.assign({},c.data||{});EK.forEach(function(k){delete d[k]});return Object.assign({},c,{data:d})})}

document.addEventListener('change',function(e){var i=e.target;if(i&&i.dataset&&i.dataset.cond&&CUR){var d=S.drafts[CUR.id]=S.drafts[CUR.id]||{};d['_if_'+i.dataset.cond]=i.checked;save();FL.need=null;var k=CUR.id;openT(k,1)}});
function adrField(t){var a=C.addressees||{};if((a.none||[]).indexOf(t.id)>=0)return null;return multiOf(t)||null}
function adrCombo(t){var h=$('dfdir');if(!h)return;var cf=adrField(t);if(!cf||!window.ArbCP||!ArbCP.combo){h.innerHTML='';return}
 var au=adrDraft(t)?null:adrAuto(t),un=!String(raw(cf,t.id)||'').trim(),AUI=(C.addressees||{}).ui||{},cd0=(curCase()||{}).data||{};
 ArbCP.combo(h,{tid:t.id,field:cf,value:raw(cf,t.id),addr:raw('АДРЕСАТ_АДРЕС',t.id),note:un?(AUI['unres_'+((ArbCP.typeMeta&&(C.addressees.directory||{})[t.id])||'')]||(((C.addressees.directory||{})[t.id]=='ifns')?(AUI.unres_ifns||'Инспекция не найдена для региона должника'):(AUI.unres||'Адресат не найден для региона должника — выберите из списка или добавьте'))):(au&&au.warn?au.warn:(au?(AUI.auto_note||'подобрано по карточке должника'):'')),noteCls:un||(au&&au.warn)?'dcbwarn':'',
  listEmpty:(C.addressees.directory||{})[t.id]?function(){return ArbCP.regionOrgs(t.id,cd0)}:null,addNew:(C.addressees.directory||{})[t.id]?function(x){var ty=(C.addressees.directory||{})[t.id],o=ArbCP.adrUserAdd({type:ty,name:x.name,address:x.address,region:cd0.РЕГИОН||''});ADRC={};return {n:o.name,val:ArbCP.dirVal(o,cf),addr:o.address||'',src:'d'}}:null,caseId:S.cur,region:raw('РЕГИОН',t.id)||raw('ДОЛЖНИК_АДРЕС',t.id),label:((C.addressees||{}).ui||{}).cb_label,
  onSet:function(v,ad,x){setVal(cf,v,t.id);var d=(S.drafts[t.id]=S.drafts[t.id]||{});if(x&&x.n&&x.src=='d')d.АДРЕСАТ_НАИМ=x.n;else if(!x||x.src!='k')delete d.АДРЕСАТ_НАИМ;if(x&&x.src=='k')d.АДРЕСАТ_НАИМ=x.n;var cfc=((C.addressees||{}).code_field||{})[cf];if(cfc){var oc=x&&x.i!=null&&ArbCP.dirOrg?ArbCP.dirOrg(x.i):null;if(oc&&oc.code)d[cfc]=oc.code;else if(x&&x.code)d[cfc]=x.code;else delete d[cfc]}if(ad)d.АДРЕСАТ_АДРЕС=ad;else delete d.АДРЕСАТ_АДРЕС;save();var i=$('df_'+cf)||$('dc_'+cf);if(i)i.value=v;prev()}})}
/* d6: дата подписания внизу документа («__» ______ 20__ г.) — по умолчанию сегодня (поле ДАТА_ПОДПИСИ; если в шаблоне есть ДАТА — она же) */
function SDC(){return C.sign_date||{}}
function sdRe(){return new RegExp(SDC().pattern||'«_{1,3}»\\s*_{3,}\\s*20_{1,3}\\s*г\\.')}
function sdHas(t){var s=TXT[t.id];return s!=null?sdRe().test(s):true}
function sdVal(t){var k=SDC().field||'ДАТА_ПОДПИСИ',d=(OV?OV.v:(S.drafts[t.id]||{}))[k];if(d)return d;if(t.fields.indexOf('ДАТА')>=0&&SDC().follow_doc_date!==false){var v=raw('ДАТА',t.id);if(v)return v}return SDC().default=='empty'?'':todayISO()}
function sdText(t){var v=String(sdVal(t)||'').trim(),m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(v)||(function(x){return x?[0,x[3],x[2],x[1]]:null})(/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(v));if(!m)return null;
 var MG=SDC().months_gen||['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];return '«'+m[3]+'» '+MG[+m[2]-1]+' '+m[1]+' г.'}
function sdXml(x,t){var tx=sdText(t);if(!tx)return x;var re=sdRe();return x.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){var plain=p.replace(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<[^>]+>/g,'$1');if(!re.test(plain))return p;var first=true;
  return p.replace(/<w:t(\s[^>]*)?>([^<]*)<\/w:t>/g,function(_,a,txt){if(first){first=false;return '<w:t xml:space="preserve">'+xe(plain.replace(re,tx))+'</w:t>'}return '<w:t xml:space="preserve"></w:t>'})})}
function sdMd(s,t){var tx=sdText(t);return tx?String(s).replace(sdRe(),tx):s}
function adrXml(x,t){var a=String(raw('АДРЕСАТ_АДРЕС',t.id)||'').trim();if(!a)return x;var ps=x.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[];
 for(var i=0;i<ps.length;i++){var p=ps[i];if(/^\s*Кому:/.test(p.replace(/<[^>]+>/g,''))){var pp=(p.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)||[''])[0],rp=(p.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)||[''])[0];return x.replace(p,p+'<w:p>'+pp+'<w:r>'+rp+'<w:t xml:space="preserve">'+xe(a)+'</w:t></w:r></w:p>')}}return x}
function prev(){if(!CUR||!$('dprev'))return;var pl0=lhFor(CUR),bd=htmlPrev(expandRowsText(TXT[CUR.id],CUR),CUR);$('dprev').innerHTML=pl0?pvWrap(pl0,CUR,bd):bd;if(pl0&&!pl0._pv){var c0=CUR;lhPv(pl0).then(function(){if(CUR===c0)prev()}).catch(function(){})}$('dprev').classList.toggle('dlhf',!!lhFor(CUR));var m=missing(CUR),el=$('dmiss');if(el&&!el.dataset.warn){el.textContent=m.length?'':U('all_filled');el.className='sm'}
 if(el&&el.dataset.warn&&!m.length){el.dataset.warn='';el.textContent=U('all_filled');el.className='sm'}
 document.querySelectorAll('#dform [data-k]').forEach(function(i){var w=i.closest('[data-w]');if(w)w.classList.toggle('dempty',!i.value&&!(F[i.dataset.k]&&F[i.dataset.k].optional))});if(RQ_())RQ_().sync(CUR);if(RGX())RGX().dom(CUR)}
function sig(t){return t.id+'|'+missing(t).join(',')}
function gate(btn){var m=missing(CUR).map(mlabel),el=$('dmiss');if(!m.length)return true;if(btn.dataset.ok==sig(CUR))return true;btn.dataset.ok=sig(CUR);el.dataset.warn=1;el.className='sm ewarn';el.textContent=U('missing',{n:m.length,list:m.map(function(k){return (F[k]||{}).label||k}).join(', ')});return false}
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
async function docx(t){raw.pr=1;try{return await docx0(t)}finally{raw.pr=0}}
/* d7: альбомная ориентация из index.json (orientation:"landscape") — pgSz меняется местами, таблицы растягиваются на новую ширину строки (в т.ч. в колонтитулах бланка) */
function orientTbl(x,oldTW,newTW){return x.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g,function(tb){var g=(tb.match(/<w:gridCol w:w="(\d+)"/g)||[]).map(function(q){return +q.match(/\d+/)[0]}),sum=g.reduce(function(a,b){return a+b},0);if(!sum||sum<oldTW*0.85)return tb;var f=newTW/sum;
 return tb.replace(/(<w:gridCol w:w=")(\d+)/g,function(m,a,v){return a+Math.round(v*f)}).replace(/(<w:tcW[^>]*w:w=")(\d+)("[^>]*w:type="dxa")/g,function(m,a,v,c){return a+Math.round(v*f)+c}).replace(/(<w:tcW w:type="dxa" w:w=")(\d+)/g,function(m,a,v){return a+Math.round(v*f)}).replace(/(<w:tblW[^>]*w:w=")(\d+)("[^>]*w:type="dxa")/g,function(m,a,v,c){return a+Math.round(v*f)+c})})}
async function orientZ(z){var dx=await z.file('word/document.xml').async('string'),i=dx.lastIndexOf('<w:sectPr');if(i<0)return;var sp=dx.slice(i),m=sp.match(/<w:pgSz[^>]*\/>/);if(!m)return;
 var W=+(m[0].match(/w:w="(\d+)"/)||[0,11906])[1],H=+(m[0].match(/w:h="(\d+)"/)||[0,16838])[1];if(W>H)return;var L=+(sp.match(/w:left="(\d+)"/)||[0,1701])[1],R=+(sp.match(/w:right="(\d+)"/)||[0,850])[1],oT=W-L-R,nT=H-L-R;
 var sp2=sp.replace(m[0],'<w:pgSz w:w="'+H+'" w:h="'+W+'" w:orient="landscape"/>');dx=orientTbl(dx.slice(0,i),oT,nT)+sp2;z.file('word/document.xml',dx);
 var ps=Object.keys(z.files).filter(function(n){return /^word\/(header|footer)\d*\.xml$/.test(n)});for(var k=0;k<ps.length;k++){var hx=await z.file(ps[k]).async('string');z.file(ps[k],orientTbl(hx,oT,nT))}}
async function docx0(t){if(!DXC[t.id]){var r=await fetch('docs/'+t.docx+'?v='+(window.ARB_DOCS_VH||''));if(!r.ok)throw new Error('шаблон Word не загрузился ('+r.status+')');DXC[t.id]=await r.arrayBuffer()}var z=await JSZip.loadAsync(DXC[t.id].slice(0));
 var names=Object.keys(z.files).filter(function(n){return /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)});
 for(var i=0;i<names.length;i++){var xx=await z.file(names[i]).async('string');if(names[i]=='word/document.xml')xx=expandRowsXml(adrLineFix(sgXml(cbXml(rgXml(xx,t),t)),t,1),t);if(names[i]=='word/document.xml'&&LY_())xx=LY_().pretag(xx,t);xx=runXml(xx,t);if(names[i]=='word/document.xml')xx=sigKeep(xx,t);if(names[i]=='word/document.xml'){xx=adrXml(xx,t);xx=sdXml(xx,t)}z.file(names[i],xx)}
 var l=lhFor(t);try{var dg=await z.file('word/document.xml').async('string');if(LY_()){z.file('word/document.xml',LY_().xml(dg,t));z=await LY_().apply(z,t,!!l)}}catch(e){console.warn('layout',e)}if(l)z=await lhMerge(z,l,t);
 var TODO=(C.manager||{}).todo_mark||'[__]',pn=Object.keys(z.files).filter(function(n){return /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)});
 for(var q=0;q<pn.length;q++){var xq=await z.file(pn[q]).async('string'),tx=xq.replace(/<[^>]+>/g,'');if(tx.indexOf(TODO)<0)continue;if(TB())throw new Error(MU2('addr_todo'));z.file(pn[q],xq.replace(/,?\s*д\.\s*\[__\]/g,'').replace(/,?\s*\[кв\.?\/?оф\.?\s*_+\]/g,'').replace(/\[__\]/g,''))}
 if(t.orientation=='landscape')await orientZ(z);
if(OV?OV.sign:(S.sign||{})[t.id]){var g=sigFor(t);if(g){await sigApply(z,g,t);sigNext()}}
 return z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
/* каждый сформированный документ сразу попадает в Архив (зашифровано PIN); без дела — группа «Без дела» */
function archMeta(t,extra){var c=curCase(),m=curMgr();return Object.assign({doc_date:(function(v){return /^\d{4}-\d\d-\d\d$/.test(v)?v.split('-').reverse().join('.'):v})(String(raw('ДАТА',t.id)||'')),case:c?c.id:'',kind:'out',title:t.title,tid:t.id,mgr:m?(m.f.ФИО_УПРАВЛЯЮЩЕГО||''):'',debtor:c?'':(raw('ДОЛЖНИК_НАИМЕНОВАНИЕ',t.id)||''),debtor_inn:c?'':(raw('ДОЛЖНИК_ИНН',t.id)||'')},RGX()&&RGX().snap(t)||{},extra||{})}
async function archSave(m,blob){if(!window.ArbArch)return;try{var id=await ArbArch.add(m,blob);if(ArbArch.notify)ArbArch.notify(1,'',id)}catch(x){if(ArbArch.notify)ArbArch.notify(0,x.message)}}
async function archCopy(t,via){var lh=lhFor(t),sg=(S.sign||{})[t.id]&&!!sigFor(t),b;try{b=await docx(t)}catch(x){if(window.ArbArch&&ArbArch.notify)ArbArch.notify(0,x.message);return}await archSave(archMeta(t,{no:raw('ИСХ_НОМЕР',t.id)||'',addressee:addrOf(t,null),blank:!!lh,signed:sg,fname:fname(t,'docx'),via:via}),b)}
async function single(t){var auto=t.fields.indexOf('ИСХ_НОМЕР')>=0&&!raw('ИСХ_НОМЕР',t.id),c=curCase(),o=outCfg(),no=raw('ИСХ_НОМЕР',t.id),d=S.drafts[t.id]=S.drafts[t.id]||{};
 if(auto){no=outFmt(o.next,o,fmt('ДАТА',raw('ДАТА',t.id)));d.ИСХ_НОМЕР=no}
 var lh=lhFor(t),sg=(S.sign||{})[t.id]&&!!sigFor(t),blob;try{blob=await docx(t)}finally{if(auto)delete d.ИСХ_НОМЕР}
 var n=outNum(no);if(no&&n&&n>=o.next)o.next=n+1;save();var fn=fname(t,'docx');saveBlob(blob,fn);
 await archSave(archMeta(t,{no:no||'',addressee:addrOf(t,null),blank:!!lh,signed:sg,fname:fn,auto:auto}),blob)
 if(auto)openT(t.id,1)}
function addrOf(t,v){var m=((C.batch||{}).multi)||{},k=t.fields.find(function(x){return m[x]});return k?(v&&v[k]!=null?v[k]:raw(k,t.id)):''}
function bind(){var v=$('vdocs');
 v.addEventListener('toggle',function(e){if(e.target.classList&&e.target.classList.contains('dpoth'))POTH=e.target.open},true);
 v.addEventListener('input',function(e){var i=e.target;if(i.closest('.dbatch'))return;if(i.id=='dq'){Q=i.value;drawList();return}if(i.dataset&&i.dataset.tbk&&CUR&&TBon(CUR)){var rr=TB_().set(CUR,i);save();if(rr)openT(CUR.id,1);else prev();return}if(i.dataset&&i.dataset.rk&&CUR){rows(CUR)[+i.dataset.row][i.dataset.rk]=i.value;save();prev();return}var k=i.dataset&&i.dataset.k;if(!k)return;
  var pre=i.id.split('_')[0];if(pre=='dc'){var c=curCase();if(c){c.data[k]=i.value;save()}}else if(pre=='df'&&CUR){var sv=$('dsv_'+k);if(sv&&!sv.checked)(S.drafts[CUR.id]=S.drafts[CUR.id]||{})[k]=i.value,save();else setVal(k,i.value,CUR.id);if(k=='ПРОЦЕДУРА'){var w=$('df_ВИД_УПРАВЛЯЮЩЕГО');if(w&&!w.value)w.placeholder=raw('ВИД_УПРАВЛЯЮЩЕГО',CUR.id)}prev()}});
 v.addEventListener('change',async function(e){var i=e.target;if(i.closest('.dbatch'))return;
  if(i.id=='dcaseup'&&window.ArbCP){var fs=[].slice.call(i.files);i.value='';showTab('cp');await ArbCP.importCases(fs);return}
  if(i.id=='dcdeb'&&window.ArbCP&&i.value){var cc=curCase(),cp=await ArbCP.linkDebtor(i.value,cc&&cc.id);if(cc&&cp){var M=(C.counterparties||{}).debtor_map||{};Object.keys(M).forEach(function(k){if(cp[M[k]])cc.data[k]=cp[M[k]]});save();drawCases();if(CUR)openT(CUR.id,1)}return}
  if(i.id=='dflh'&&CUR){S.lh=S.lh||{};S.lh[CUR.id]=i.value;save();prev();return}
  if(i.id=='dfmgr'){setMgr(i.value);return}
  if(i.id=='dcmgr'){var cm=curCase();if(cm){cm.mgr=i.value||null;if(i.value)S.mgr=i.value;save();curMgr();if(CUR)openT(CUR.id,1)}return}
  if(i.id=='dcsel'||i.id=='dfcase'){S.cur=i.value||null;var nc=curCase();if(nc&&nc.mgr)S.mgr=nc.mgr;save();curMgr();drawCases();if(CUR)openT(CUR.id)}else if(i.dataset&&i.dataset.k&&i.id.indexOf('dc_')==0){var o=$('dcsel').selectedOptions[0],c=curCase();if(o&&c)o.textContent=caseName(c)}});
 v.addEventListener('click',async function(e){var cb=e.target.closest('[data-bt]');if(cb){e.preventDefault();e.stopPropagation();var id=cb.dataset.bt;BSEL.has(id)?BSEL.delete(id):BSEL.add(id);drawList();return}
  var b=e.target.closest('button,[data-t]');if(!b)return;
  if(b.dataset.pre!=null){var P=((C.batch||{}).presets||[])[+b.dataset.pre],pi=presetIds(P),on=pi.every(function(id){return BSEL.has(id)});pi.forEach(function(id){on?BSEL.delete(id):BSEL.add(id)});drawList();return}
  if(b.dataset.bsel){var vs=visT(),al=vs.every(function(t){return BSEL.has(t.id)});vs.forEach(function(t){al?BSEL.delete(t.id):BSEL.add(t.id)});drawList();return}
  if(b.dataset.bgrp){var gs=visT().filter(function(t){return t.group==b.dataset.bgrp}),ga=gs.every(function(t){return BSEL.has(t.id)});gs.forEach(function(t){ga?BSEL.delete(t.id):BSEL.add(t.id)});drawList();return}
  if(b.dataset.bclr){BSEL.clear();drawList();return}
  if(b.dataset.bgo){if(!BSEL.size){toast(BU('need_pick'));return}FL.batch=true;flowVis();fbar('');$('dlist').style.display='none';$('vdocs').classList.add('editing');$('ded').style.display='';ArbBatch.open(X.templates.filter(function(t){return BSEL.has(t.id)}).map(function(t){return t.id}));window.scrollTo(0,$('vdocs').offsetTop-60);return}
  if(b.closest('#ded .dbatch'))return;
  if(b.dataset.g!=null&&b.classList.contains('pchip')){FLT=b.dataset.g;drawList();return}
  if(b.dataset.t){openT(b.dataset.t);return}
  if(b.hasAttribute('data-back')){showList();return}
  if(b.id=='dcexp'&&window.ArbCP){ArbCP.exportCases();return}
  if(b.id=='dcnew'){var c={id:'c'+Date.now().toString(36),data:{}};S.cases.push(c);S.cur=c.id;save();drawCases();$('dcases').open=true;return}
  if(b.id=='dcdel'){var cc=curCase();if(cc&&confirm(U('case_del_confirm',{name:caseName(cc)}))){S.cases=S.cases.filter(function(x){return x!==cc});S.cur=null;save();drawCases()}return}
  if(b.dataset.tbadd&&CUR&&TBon(CUR)){TB_().add(CUR,b.dataset.tbadd);save();openT(CUR.id,1);return}if(b.dataset.tbdel&&CUR&&TBon(CUR)){TB_().del(CUR,b.dataset.tbdel,b.dataset.tbr);save();openT(CUR.id,1);return}if(b.id=='drowadd'&&CUR){rows(CUR).push({});save();openT(CUR.id,1);return}
  if(b.dataset.rowdel!=null&&CUR){rows(CUR).splice(+b.dataset.rowdel,1);save();openT(CUR.id,1);return}
  if(b.id=='dfsign'&&CUR){S.sign=S.sign||{};S.sign[CUR.id]=!S.sign[CUR.id];save();openT(CUR.id,1);return}
  if(b.dataset.mgredit){showTab('cp');if(window.ArbCP&&ArbCP.editMgr)ArbCP.editMgr(b.dataset.mgredit);return}
  if(b.id=='dclear'){if(confirm(U('clear_confirm'))){localStorage.removeItem(LS);S=load();try{await ArbDB.wipe()}catch(x){}S.mgMig=1;save();LEG={lh:[],sig:[]};DEVM={};mgrCompose();if(window.ArbCP&&ArbCP.reset)ArbCP.reset();if(window.ArbArch)ArbArch.reset();BSEL.clear();drawList();drawCases();if(CUR)openT(CUR.id);$('dclm').textContent=U('cleared')}return}
  if(!CUR)return;
  try{if(b.id=='ddocx'){if(!gate(b))return;await single(CUR)}
   else if(b.id=='dtxt'){if(!gate(b))return;saveBlob(new Blob([plain(fill(expandRowsText(TXT[CUR.id],CUR),CUR,'text'))],{type:'text/plain;charset=utf-8'}),fname(CUR,'txt'));await archCopy(CUR,'txt')}
   else if(b.id=='dcopy'){setTimeout(function(){archCopy(CUR,'copy')},0);var s=plain(fill(expandRowsText(TXT[CUR.id],CUR),CUR,'text'));try{await navigator.clipboard.writeText(s)}catch(x){var ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}$('dmiss').dataset.warn='';$('dmiss').className='sm';$('dmiss').textContent=U('copied')}}
  catch(x){$('dmiss').className='sm ewarn';$('dmiss').textContent='Не удалось: '+x.message}});
 v.addEventListener('keydown',function(e){var cb=e.target.closest&&e.target.closest('[data-bt]');if(cb&&(e.key=='Enter'||e.key==' ')){e.preventDefault();cb.click();return}var t=e.target.closest&&e.target.closest('[data-t]');if(e.target.closest&&e.target.closest('.dbatch'))return;if(t&&(e.key=='Enter'||e.key==' ')){e.preventDefault();openT(t.dataset.t)}})}
var VIEWS={docs:'vdocs',cp:'vcp',arch:'varch'};
function showTab(k){var b=document.querySelector('nav button[data-v="'+k+'"]');if(b)b.click()}
function nav(force){if(document.querySelector('nav button[data-v="docs"]'))return true;var after=document.querySelector('nav button[data-v="eval"]')||(force&&document.querySelector('nav button[data-v="fin"]'));if(!after)return false;
 var T={docs:C.title,cp:(C.counterparties||{}).nav||(C.counterparties||{}).title,arch:(C.archive||{}).nav||(C.archive||{}).title},own=Object.keys(VIEWS).map(function(k){return VIEWS[k]});
 Object.keys(VIEWS).forEach(function(k){if(!$(VIEWS[k]))return;var nb=document.createElement('button');nb.dataset.v=k;nb.textContent=T[k];after.after(' ',nb);after=nb;
  nb.onclick=function(){document.querySelectorAll('nav button[data-v]').forEach(function(x){x.classList.toggle('on',x===nb)});['vreg','vman','vmet','vsrc','vrep','vprc','vfin','veval','vprop','vperr','vfav'].concat(own).forEach(function(i){var e=$(i);if(e)e.style.display='none'});$(VIEWS[k]).style.display='';
   if(k=='docs')prefetch();if(k=='arch'&&window.ArbArch)ArbArch.draw();if(k=='cp'&&window.ArbCP&&ArbCP.redraw)ArbCP.redraw();window.scrollTo(0,0)}});
 document.querySelector('nav').classList.add('dnav6');
 document.querySelector('nav').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(b&&!VIEWS[b.dataset.v])own.forEach(function(i){var d=$(i);if(d)d.style.display='none'})});return true}
/* ===== d6: новая страница «Документы» по макету Дизайнера (documents_page/spec.md): Управляющий → Должник → Документ → Подпись ===== */
var FL={step:null,tab:'f',af:false,dq:'',dAll:null,tq:'',oth:false,all:false,res:null,batch:false,need:null,ms:''};
var IC=window.ArbIC||{};
function FU(k,o){var x=(C.flow||{})[k];if(x==null)x=k;if(o)Object.keys(o).forEach(function(n){x=x.split('{'+n+'}').join(o[n])});return x}
var PRS={'наблюдение':'Набл.','финансовое оздоровление':'ФО','внешнее управление':'ВУ','конкурсное производство':'КП','реструктуризация долгов гражданина':'РД','реализация имущества гражданина':'РИ'};
var PRL={'наблюдение':'Наблюдение','финансовое оздоровление':'Фин. оздоровление','внешнее управление':'Внешнее управление','конкурсное производство':'Конкурсное производство','реструктуризация долгов гражданина':'Реструктуризация долгов','реализация имущества гражданина':'Реализация имущества'};
function fioP(m){return String((m&&m.f.ФИО_УПРАВЛЯЮЩЕГО)||'').trim().split(/\s+/)}
function ini(m){var p=fioP(m);return ((p[1]||'').charAt(0)+(p[0]||'').charAt(0)).toUpperCase()||'АУ'}
function mshort(m){var p=fioP(m);return p[0]?p[0]+(p[1]?' '+p[1].charAt(0)+'.':'')+(p[2]?' '+p[2].charAt(0)+'.':''):''}
function when(iso){if(!iso)return '';var d=new Date(iso),n=new Date(),dd=function(x){return x.getFullYear()+'-'+x.getMonth()+'-'+x.getDate()},y=new Date(n.getTime()-864e5),hm=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
 if(dd(d)==dd(n))return FU('today')+', '+hm;if(dd(d)==dd(y))return FU('yesterday');return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()}
function caseLast(c){if(!window.ArbArch||ArbArch.locked()||!ArbArch.lastFor)return '';var d=c.data||{};return ArbArch.lastFor([c.id],d.ДОЛЖНИК_НАИМЕНОВАНИЕ,d.ДОЛЖНИК_ИНН)}
function autoStep(){if(!MGR.length)return 'm';if(MGR.length==1&&!MGR.some(function(m){return m.id==S.mgr})){S.mgr=MGR[0].id;save()}if(!MGR.some(function(m){return m.id==S.mgr}))return 'm';if(!curCase())return 'd';return 't'}
function goStep(s){FL.step=s;FL.auto=false;FL.res=s=='r'?FL.res:null;if(s!='f'&&CUR){CUR=null;$('ded').style.display='none';$('ded').innerHTML='';$('vdocs').classList.remove('editing')}if(s=='d'){FL.dq='';FL.dAll=null}if(s!='t')FL.all=false;drawCases();var v=$('vdocs');if(v&&v.offsetParent)window.scrollTo(0,v.offsetTop-60)}
function stepper(n){var L=['<span class="lg2">'+E(FU('st_m'))+'</span><span class="sh2">'+E(FU('st_m_short'))+'</span>',E(FU('st_d')),E(FU('st_t')),E(FU('st_f'))],K=['m','d','t','f'];
 return '<div class="stp">'+L.map(function(l,i){return '<a href="#" '+(i<n?'data-fs="'+K[i]+'"':'tabindex="-1"')+' class="'+(i<n?'done':i==n?'cur':'')+'">'+(i<n?'<i>✓</i>':'')+l+'</a>'}).join('')+'</div>'}
function ctxBar(){var m=curMgr(),c=curCase(),d=(c&&c.data)||{},pr=String(d.ПРОЦЕДУРА||'').toLowerCase().trim();
 return '<div class="ctx"><div class="av s">'+E(ini(m))+'</div><div class="tx"><div class="l1">'+E(d.ДОЛЖНИК_НАИМЕНОВАНИЕ||(c?U('case_unnamed'):FU('no_debtor')))+(PRS[pr]?' <span class="pc'+(pr=='наблюдение'?' n':'')+'">'+E(PRS[pr])+'</span>':'')+'</div><div class="l2">'+E([d.НОМЕР_ДЕЛА||'',mshort(m)].filter(Boolean).join(' · '))+'</div></div><button type="button" class="chip ch" data-fl="chg">'+E(FU('change'))+'</button></div>'}
function fbar(h,cls){var b=$('dfbar');if(!b)return;b.className=h?'dfx on '+(cls||''):'';b.innerHTML=h||'';document.documentElement.classList.toggle('dfbar-on',!!h)}
function flowVis(){var fl=$('dflow');if(!fl)return;var on=!FL.batch;fl.style.display=on?'':'none';$('dlist').style.display=on&&FL.step=='t'&&FL.all&&!CUR?'':'none';['dtl','dintro'].forEach(function(i){if($(i))$(i).style.display='none'});if(!on||FL.step!='f'&&FL.step!='m')fbar(on&&FL.step=='m'&&false?'':'')}
/* d6: «Сбросить» — очистка заявки (АУ, должник, пакеты, поля, разборы файлов, пакетный режим, черновик), возврат к выбору АУ. Архив, карточки, счётчик исх. № не трогаются */
function RU(k){var r=(C.reset||{})[k];return r==null?k:r}
function rstDraw(){var el=$('dfrst');if(!el){var fl=$('dflow');if(!fl)return;el=document.createElement('div');el.id='dfrst';el.className='dfx';fl.parentNode.insertBefore(el,fl)}if((C.reset||{}).enabled===false){el.innerHTML='';return}el.innerHTML='<button type="button" class="btn dfrstb" data-rst="1">'+E(RU('button'))+'</button>';rstObs();setTimeout(rstPlace,0)}
function rstAsk(){var d=document.createElement('div');d.className='dmodal dfx';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
 d.innerHTML='<div class="dmbox"><h3>'+E(RU('title'))+'</h3><p class="sm dmsub">'+E(RU('text'))+'</p><div class="dmact"><button type="button" class="btn dfcancel" data-rsc="0">'+E(RU('cancel'))+'</button><button type="button" class="btn dfdanger" data-rsc="1">'+E(RU('confirm'))+'</button></div></div>';
 document.body.appendChild(d);var b=d.querySelector('[data-rsc="0"]');b&&b.focus();
 d.addEventListener('click',function(e){var x=e.target.closest('[data-rsc]');if(e.target===d||x){d.remove();if(x&&x.dataset.rsc=='1')rstDo()}});
 d.addEventListener('keydown',function(e){if(e.key=='Escape')d.remove()})}
function rstDo(){S.drafts={};S.mgr=null;S.cur=null;delete S.bregions;CUR=null;OV=null;
 FL.pk={};FL.batch=false;FL.need=null;FL.res=null;FL.dq='';FL.dAll=null;FL.tq='';FL.all=false;FL.oth=false;FL.af=false;FL.tab='f';FL.ms='';
 if(window.ArbBatch&&ArbBatch.reset)ArbBatch.reset();
 var ed=$('ded');if(ed){ed.style.display='none';ed.innerHTML=''}$('vdocs').classList.remove('editing');var sh=$('dfsheet');if(sh){sh.hidden=true;sh.innerHTML=''}
 save();try{fbar('')}catch(e){}goStep('m');toast(RU('done'),(C.reset||{}).toast_ms||5000)}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-rst]');if(b){e.preventDefault();rstAsk()}});
/* на телефоне — полоса «Сбросить» сразу под шкалой шагов (sticky), на десктопе — над шагами справа */
function rstPlace(){if(!$('dfrst')){rstDraw();return}var r=$('dfrst'),v=$('vdocs');if(!r||!v)return;var ph=window.matchMedia&&matchMedia('(max-width:600px)').matches,st=[].filter.call(v.querySelectorAll('.stp'),function(x){return x.offsetParent!=null})[0];
 if(!r.innerHTML)rstDraw();if(ph&&st){if(st.nextElementSibling!==r)st.parentNode.insertBefore(r,st.nextSibling);r.classList.add('dfrst-ph')}
 else{var fl=$('dflow');if(fl&&r.nextElementSibling!==fl)fl.parentNode.insertBefore(r,fl);r.classList.remove('dfrst-ph')}
 var top=0;[].forEach.call(v.querySelectorAll('*'),function(x){if(x===r||!x.offsetParent)return;var cs=getComputedStyle(x);if(cs.position=='sticky'&&parseFloat(cs.top||0)<=1&&!r.contains(x)&&!x.contains(r)){var h=x.getBoundingClientRect().height;if(h<160)top=Math.max(top,h)}});r.style.top=top+'px'}
function rstObs(){if(rstObs.on)return;var tm;function go(){clearTimeout(tm);tm=setTimeout(rstPlace,30)}var v=document.getElementById('vdocs');if(!v||!window.MutationObserver)return;rstObs.on=1;new MutationObserver(function(ms){if(ms.some(function(m){return m.target.id!='dfrst'&&!(m.target.closest&&m.target.closest('#dfrst'))}))go()}).observe(v,{childList:true,subtree:true});window.addEventListener('resize',go)}
function drawCases(){rstDraw();var el=$('dflow');if(window.ArbArch&&ArbArch.draw)ArbArch.draw();if(!el)return;if(FL.batch){flowVis();return}
 var a=document.activeElement;if(a&&a.id=='dfdq'&&FL.step=='d'){drawDD();return}
 if(!FL.step||(FL.auto&&FL.step=='m'&&MGR.length==1)||(FL.step!='m'&&!MGR.some(function(m){return m.id==S.mgr}))||((FL.step=='t'||FL.step=='f')&&!curCase())){FL.step=autoStep();FL.auto=true}
 if(FL.step=='f'&&!CUR)FL.step='t';
 var h='';if(FL.step=='m')h=scrM();else if(FL.step=='d')h=scrD();else if(FL.step=='t')h=scrT();else if(FL.step=='r')h=scrR();else h='';
 el.innerHTML=h;flowVis();
 if(FL.step=='m'){var m=curMgr();fbar(MGR.length?'<div class="info"><b>'+E(mshort(m)||'—')+'</b><span class="sm">'+E(FU('m_picked'))+'</span></div><button type="button" class="btn pri" data-fs="d">'+E(FU('next_d'))+'</button>':'')}
 else if(FL.step=='d'){fbar('');drawDD();var i=$('dfdq');if(i&&!FL.nofocus)setTimeout(function(){try{i.focus({preventScroll:true})}catch(x){}},30);FL.nofocus=false}
 else if(FL.step=='t')pkBar();else if(FL.step=='r')fbar('');
 if(FL.step=='t'&&FL.all)drawList()}
/* --- шаг 1 --- */
function scrM(){var q=String(FL.ms||'').toLowerCase(),L=MGR.slice(),last={};L.forEach(function(m){last[m.id]=window.ArbArch&&ArbArch.lastByMgr&&!ArbArch.locked()?ArbArch.lastByMgr(m.f.ФИО_УПРАВЛЯЮЩЕГО):''});
 L.sort(function(a,b){return String(last[b.id]).localeCompare(String(last[a.id]))});if(q)L=L.filter(function(m){return (m.f.ФИО_УПРАВЛЯЮЩЕГО+' '+(m.f.СРО||'')).toLowerCase().indexOf(q)>=0});
 var h=stepper(0)+'<h2>'+E(FU('m_title'))+'</h2><p class="sm intro">'+E(FU('m_help'))+'</p>';
 if(!MGR.length)return h+'<div class="card"><b>'+E(encOK()?FU('m_empty'):FU('m_locked'))+'</b></div>'+(encOK()?'<button type="button" class="addl" data-fl="mgadd">'+IC.plus+E(FU('m_add'))+'</button>':'');
 if(MGR.length>1)h+='<div class="search">'+IC.srch+'<input id="dfms" placeholder="'+E(FU('m_search'))+'" value="'+E(FL.ms||'')+'"></div>';
 h+='<div class="mgl">'+L.map(function(m,i){var f=m.f,n=S.cases.filter(function(c){return c.mgr==m.id}).length,ls=last[m.id];return '<button type="button" class="mg'+(m.id==S.mgr?' sel':'')+'" data-fmg="'+E(m.id)+'"><div class="av'+(['',' b',' c',' d'][i%4])+'">'+E(ini(m))+'</div><div class="tx"><b>'+E(f.ФИО_УПРАВЛЯЮЩЕГО||mgrName(m))+'</b><span class="sm">'+E(f.СРО||'')+'</span><span class="sm">'+E([f.РЕГ_НОМЕР_АУ?FU('reg_no')+' '+f.РЕГ_НОМЕР_АУ:'',FU('cases_n')+': '+n,ls?FU('last_doc')+' '+when(ls):''].filter(Boolean).join(' · '))+'</span></div><span class="rad"></span></button>'}).join('')+
  '<button type="button" class="addl" data-fl="mgadd">'+IC.plus+'<span style="flex:1;text-align:left">'+E(FU('m_add'))+'</span><span class="sm" style="font-weight:400">'+E(FU('in_cp'))+'</span></button></div>';return h}
/* --- шаг 2 --- */
function nrm(s){return String(s||'').toLowerCase().replace(/ё/g,'е')}
function dig(s){return String(s||'').replace(/^\s*[аa]\s?\d{2}\s*-/i,'').replace(/\D/g,'')}
function hlx(s,q,mode){s=String(s||'');if(!q)return E(s);if(mode=='d'){var ds=q,idx=[],t='';for(var i=0;i<s.length;i++)if(/\d/.test(s[i])){idx.push(i);t+=s[i]}var p=t.indexOf(ds);if(p<0)return E(s);var a=idx[p],b=idx[p+ds.length-1]+1;return E(s.slice(0,a))+'<mark>'+E(s.slice(a,b))+'</mark>'+E(s.slice(b))}
 var n=nrm(s),re=new RegExp('(^|[\\s«"(\\-])('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','i'),m=re.exec(n);if(!m)return E(s);var st=m.index+m[1].length;return E(s.slice(0,st))+'<mark>'+E(s.slice(st,st+q.length))+'</mark>'+E(s.slice(st+q.length))}
function dMatch(c,q){var d=c.data||{},qd=q.replace(/\D/g,''),qn=nrm(q).replace(/[«»"]/g,'').trim();if(!qn)return {s:0};
 var r=null;if(qd.length>=3&&qd.length==q.replace(/[\s\/\-аАaA]/g,'').length){var no=dig(d.НОМЕР_ДЕЛА),inn=String(d.ДОЛЖНИК_ИНН||'');if(no&&no.indexOf(qd)>=0)r={s:no==qd?3:1,f:'no',q:qd};else if(inn.indexOf(qd)>=0)r={s:inn==qd?3:1,f:'inn',q:qd};
  else if(/[аa]\s?\d/i.test(q)&&nrm(d.НОМЕР_ДЕЛА).replace(/\s/g,'').indexOf(nrm(q).replace(/\s/g,''))>=0)r={s:2,f:'no',q:qd};return r}
 if(qn.length<2)return null;var nm=nrm(d.ДОЛЖНИК_НАИМЕНОВАНИЕ).replace(/[«»"]/g,' '),ok=qn.split(/\s+/).every(function(w){return new RegExp('(^|[\\s\\-(])'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(nm)});
 if(ok)return {s:nm.indexOf(qn)==0?2:1,f:'nm',q:qn.split(/\s+/)[0]};if(/[аa]\d|\//i.test(q)&&nrm(d.НОМЕР_ДЕЛА).indexOf(nrm(q))>=0)return {s:2,f:'no',q:''};return null}
function isFiz(c){var d=c.data||{};return String(d.ДОЛЖНИК_ИНН||'').length==12||/гражданин/.test(String(d.ПРОЦЕДУРА||''))}
function dRow(c,mt,hl,i){var d=c.data||{},pr=String(d.ПРОЦЕДУРА||'').toLowerCase().trim(),ls=caseLast(c);mt=mt||{};
 return '<div class="dr'+(hl?' hl':'')+'" role="option" id="dfdr'+i+'" data-fdeb="'+E(c.id)+'"><div class="ic2">'+(isFiz(c)?IC.user:IC.bld)+'</div><div class="tx"><div class="nm">'+(mt.f=='nm'?hlx(d.ДОЛЖНИК_НАИМЕНОВАНИЕ,mt.q):E(d.ДОЛЖНИК_НАИМЕНОВАНИЕ||U('case_unnamed')))+'</div><div class="kv"><span>ИНН</span><b>'+(mt.f=='inn'?hlx(d.ДОЛЖНИК_ИНН,mt.q,'d'):E(d.ДОЛЖНИК_ИНН||'—'))+'</b><span>'+E(FU('case'))+'</span><b>'+(mt.f=='no'&&mt.q?hlx(d.НОМЕР_ДЕЛА,mt.q,'d'):E(d.НОМЕР_ДЕЛА||'—'))+'</b></div>'+
  '<div style="margin-top:5px">'+(PRL[pr]?'<span class="pc'+(pr=='наблюдение'?' n':'')+'">'+E(PRL[pr])+'</span>':'')+(ls?' <span class="sm">· '+E(when(ls))+'</span>':'')+(c.req&&/^(new|in_progress|partial)$/.test(c.req.status)?' <span class="sm">· '+E(window.ArbCP&&ArbCP.pendTxt?ArbCP.pendTxt(c):FU('pending'))+'</span>':'')+'</div></div></div>'}
function scrD(){var m=curMgr();return stepper(1)+'<button type="button" class="mg sel" style="padding:9px 12px" data-fs="m"><div class="av s">'+E(ini(m))+'</div><div class="tx"><b style="font-size:14.5px">'+E((m&&m.f.ФИО_УПРАВЛЯЮЩЕГО)||'')+'</b><span class="sm">'+E((m&&m.f.СРО)||'')+'</span></div><span class="link" style="padding:0">'+E(FU('change'))+'</span></button>'+
 '<h2>'+E(FU('d_title'))+'</h2><div class="cb"><div class="cbi">'+IC.srch+'<input id="dfdq" type="text" role="combobox" aria-expanded="true" aria-controls="dfdd" aria-autocomplete="list" autocomplete="off" enterkeyhint="search" value="'+E(FL.dq)+'" placeholder="'+E(FU('d_ph'))+'"><button type="button" class="x" data-fl="dqx" aria-label="'+E(FU('clear'))+'"'+(FL.dq?'':' hidden')+'>'+IC.x+'</button></div>'+
 '<div class="cbh">'+E(FU('d_by'))+'<span>'+E(FU('d_by1'))+'</span><span>ИНН</span><span>'+E(FU('d_by3'))+'</span></div><div class="dd" id="dfdd" role="listbox"></div></div>'}
var DDL=[],DDA=0;
function drawDD(){var el=$('dfdd');if(!el)return;var m=curMgr(),q=String(FL.dq||'').trim(),mine=S.cases.filter(function(c){return c.mgr?c.mgr==S.mgr:MGR.length<=1}),all=FL.dAll==null?!mine.length:FL.dAll,src=all?S.cases:mine,L=[];
 if(q){src.forEach(function(c){var r=dMatch(c,q);if(r)L.push({c:c,m:r})});L.sort(function(a,b){return b.m.s-a.m.s||String(caseLast(b.c)).localeCompare(String(caseLast(a.c)))})}
 else{L=src.map(function(c){return {c:c,l:caseLast(c)}}).sort(function(a,b){return String(b.l).localeCompare(String(a.l))}).slice(0,5)}
 DDL=L;if(DDA>=L.length)DDA=0;
 var h='<div class="dh">'+E(q?FU('found',{n:L.length}):FU('recent'))+'<span class="sp"></span><span class="seg2"><button type="button" class="'+(all?'':'on')+'" data-fl="dmine">'+E(FU('cases_of',{m:mshort(m)}))+'</button><button type="button" class="'+(all?'on':'')+'" data-fl="dall">'+E(FU('all'))+'</button></span></div>';
 h+=L.map(function(x,i){return dRow(x.c,x.m,i==DDA,i)}).join('');
 if(!L.length)h+='<div class="dr"><div class="tx"><div class="nm">'+E(q?FU('nf',{q:q}):(S.cases.length?FU('none_mine'):FU('none')))+'</div></div></div>';
 h+='<div class="ft" role="button" tabindex="0" data-fl="dadd">'+IC.plus+E(FU('d_add'))+'</div>';el.innerHTML=h;var x=$('dfdq');if(x)x.setAttribute('aria-activedescendant',L.length?'dfdr'+DDA:'')}
function pickDeb(id){var c=S.cases.find(function(x){return x.id==id});if(!c)return;S.cur=c.id;if(!c.mgr&&S.mgr)c.mgr=S.mgr;save();curMgr();FL.af1=true;goStep('t');refreshAll()}
/* --- шаг 3 --- */
function cardFill(){var c=curCase(),pf=(C.profile_order||[]).filter(function(k){return F[k]&&F[k].scope=='profile'}),cs=(C.case_order||[]).filter(function(k){return F[k]&&F[k].scope=='case'});
 return {p:pf.filter(function(k){return prof(k)}).length,c:cs.filter(function(k){return c&&c.data[k]}).length,miss:cs.filter(function(k){return !(c&&c.data[k])&&!(F[k]||{}).optional&&k!='ВИД_УПРАВЛЯЮЩЕГО'})}}
function presetsQB(){var B=C.batch||{},P=B.presets||[],GR=B.preset_groups||[],pr=caseProc(),tq=nrm(FL.tq).trim();if(!P.length)return '';
 var PK=FL.pk=FL.pk||{},qb=function(ix){return '<div class="qs">'+ix.map(function(i){var p=P[i],on=!!PK[i],n=presetIds(p).length;return '<button type="button" class="qb pk'+(on?' on':'')+'" data-fpre="'+i+'" role="checkbox" aria-checked="'+on+'"><i class="pkc" aria-hidden="true"></i><span>'+E(p.name)+'<small>'+E(n+' '+pl(n,'документ','документа','документов'))+'</small></span></button>'}).join('')+'</div>'};
 if(tq){var hit=P.map(function(p,i){return i}).filter(function(i){return nrm(P[i].name).indexOf(tq)>=0});return hit.length?'<div class="secth"><span class="n">'+E(FU('sets'))+'</span></div>'+qb(hit):''}
 var mine=pr?GR.filter(function(g){return g.proc&&g.proc.indexOf(pr)>=0}):GR,allG=GR.filter(function(g){return !g.proc||!g.proc.length}),rest=GR.filter(function(g){return mine.indexOf(g)<0&&allG.indexOf(g)<0}),h='';
 var sec=function(g,first){var ix=P.map(function(p,i){return i}).filter(function(i){return P[i].group==g.id});return ix.length?'<div class="secth"><span class="n">'+E(g.label||g.title||g.id)+'</span>'+(first?'<span class="c">'+E(FU('sets_l'))+'</span>':'')+'</div>'+qb(ix):''};
 (pr?mine:GR.filter(function(g){return allG.indexOf(g)<0})).forEach(function(g,i){h+=sec(g,i==0)});allG.forEach(function(g){h+=sec(g)});
 if(pr&&rest.length){var nr=P.filter(function(p){return rest.some(function(g){return g.id==p.group})}).length;h+='<button type="button" class="oth" data-fl="oth">'+E(FU('others'))+' <span class="sm">· '+E(FU('more_sets',{n:nr}))+'</span>'+IC.chev+'</button>';if(FL.oth)rest.forEach(function(g){h+=sec(g)})}
 return h}
function tRow(t,sub,fav){return '<div class="ti" role="button" tabindex="0" data-ft="'+E(t.id)+'"><div class="ki">'+IC.doc+'</div><div class="tx"><b>'+E(t.title)+'</b><span class="sm">'+(sub?E(sub):'<span class="kind">'+E(t.kind||'')+'</span>'+(t.deadline?' · '+E(t.deadline):''))+'</span></div><button type="button" class="star'+(fav?' on':'')+'" data-fstar="'+E(t.id)+'" aria-pressed="'+!!fav+'" aria-label="'+E(FU('fav'))+'">'+IC.star+'</button></div>'}
function scrT(){var c=curCase(),d=(c&&c.data)||{},cf=cardFill(),fav=S.fav||[],tq=nrm(FL.tq).trim(),h=ctxBar()+stepper(2);
 if(cf.miss.length)h+='<div class="af warn"><div class="ic">'+IC.warn+'</div><div class="tx"><b>'+E(FU('af_miss'))+'</b><span class="sm">'+E(cf.miss.slice(0,3).map(function(k){return (F[k]||{}).label||k}).join(', ')+(cf.miss.length>3?' '+FU('and_more',{n:cf.miss.length-3}):''))+'</span></div><button type="button" class="link" data-fl="debcard">'+E(FU('complete'))+'</button></div>';
 else if(FL.af1)h+='<div class="af"><div class="ic">'+IC.chk+'</div><div class="tx"><b>'+E(FU('af_ok'))+'</b><span class="sm">'+E(FU('af_ok_n',{n:cf.p+cf.c,p:cf.p,c:cf.c}))+'</span></div></div>';
 h+='<h2>'+E(FU('t_title'))+'</h2><div class="search">'+IC.srch+'<input id="dftq" placeholder="'+E(FU('t_search'))+'" value="'+E(FL.tq)+'"></div>';
 if(tq){var ts=X.templates.filter(function(t){return nrm(t.title+' '+(t.kind||'')+' '+t.fields.map(function(k){return (F[k]||{}).label||''}).join(' ')+' '+(t.addressee_types||[]).map(function(x){return ((X.addressee_type_meta||{})[x]||{}).label||''}).join(' ')+' '+(((C.search_synonyms||{})[t.id])||'')).indexOf(tq)>=0});return h+presetsQB()+(ts.length?'<div class="secth"><span class="n">'+E(FU('templates'))+'</span><span class="c">'+ts.length+'</span></div><div class="tl">'+ts.map(function(t){return tRow(t,null,fav.indexOf(t.id)>=0)}).join('')+'</div>':'')+(!ts.length&&!presetsQB()?'<p class="sm">'+E(FU('t_nf'))+'</p>':'')}
 var rec=window.ArbArch&&!ArbArch.locked()&&ArbArch.recent&&c?ArbArch.recent([c.id],d.ДОЛЖНИК_НАИМЕНОВАНИЕ,d.ДОЛЖНИК_ИНН,3):[];
 h+='<div class="t2"><div>'+(((C.batch||{}).presets||[]).length?'<div class="pkh"><span class="sm">'+E(FU('pk_hint'))+'</span><button type="button" class="link" data-fl="pkall">'+E(FU('pk_all'))+'</button><button type="button" class="link" data-fl="pknone">'+E(FU('pk_none'))+'</button></div>':'')+presetsQB()+'</div><div>';
 if(rec.length)h+='<div class="secth"><span class="n">'+E(FU('recent_docs'))+'</span><span class="sp"></span><button type="button" class="link" data-fl="archall">'+E(FU('all_arch'))+'</button></div><div class="tl">'+rec.map(function(r){var t=X.templates.find(function(x){return x.id==r.tid});return t?tRow(t,when(r.date)+(r.no?' · '+FU('out_no')+' '+r.no:''),fav.indexOf(t.id)>=0):''}).join('')+'</div>';
 var fv=fav.map(function(id){return X.templates.find(function(t){return t.id==id})}).filter(Boolean);
 h+='<div class="secth"><span class="n">'+E(FU('favs'))+'</span><span class="c">'+fv.length+'</span></div>'+(fv.length?'<div class="tl">'+fv.map(function(t){return tRow(t,null,true)}).join('')+'</div>':'<p class="sm">'+E(FU('favs_h'))+'</p>');
 h+='<button type="button" class="oth" data-fl="all">'+IC.book+E(FU('all_t'))+' <span class="sm">· '+E(FU('all_t_n',{n:X.templates.length}))+'</span>'+IC.chev+'</button></div></div>';return h}
function pkIds(){var P=(C.batch||{}).presets||[],seen={},out=[];Object.keys(FL.pk||{}).sort(function(a,b){return a-b}).forEach(function(i){var p=P[+i];if(p)presetIds(p).forEach(function(id){if(!seen[id]&&X.templates.some(function(t){return t.id==id})){seen[id]=1;out.push(id)}})});return out}
function pkBar(){if(FL.step!='t')return;var P=(C.batch||{}).presets||[],ks=Object.keys(FL.pk||{}),tot=ks.reduce(function(s,i){return s+(P[+i]?presetIds(P[+i]).length:0)},0),u=pkIds().length;
 if(!ks.length){fbar('');return}
 fbar('<div class="info"><b>'+E(FU('pk_sel',{n:ks.length+' '+pl(ks.length,'пакет','пакета','пакетов'),d:tot+' '+pl(tot,'документ','документа','документов')}))+'</b>'+(u!=tot?'<span class="sm">'+E(FU('pk_uniq',{u:u}))+'</span>':'')+'</div><button type="button" class="btn sec" data-fl="pknone">'+E(FU('pk_none'))+'</button><button type="button" class="btn pri" data-fl="pkgo">'+E(FU('pk_go'))+'</button>')}
function startBatch(ids){BSEL.clear();ids.forEach(function(id){BSEL.add(id)});FL.batch=true;flowVis();fbar('');$('dlist').style.display='none';$('vdocs').classList.add('editing');$('ded').style.display='';ArbBatch.open(ids);window.scrollTo(0,$('vdocs').offsetTop-60)}
/* --- шаг 4: форма --- */
function needKeys(t,cf){var rf=RF(t),skip=['ДАТА','ДАТА_ОТЧЁТА','ИСХ_НОМЕР',cf].concat(rgAll(t),ilFields(t),TBown(t),cbOffFields(t),poshHtml(t)?['ГОСПОШЛИНА']:[]);return t.fields.filter(function(k){if(rf.indexOf(k)>=0||skip.indexOf(k)>=0)return false;var sc=(F[k]||{}).scope||'document';if(sc=='document')return true;return !raw(k,t.id)})}
function fld(k,t,cls){var f=F[k]||{k:k,label:k,type:'text'},v=raw(k,t.id),sc=f.scope||'document',e=!v&&!f.optional&&ilFields(t).indexOf(k)<0,ph=sc=='profile'?FU('ph_mgr'):sc=='case'?FU('ph_case'):'';if(f.choices&&CSET(f.choices)&&sc=='document')return '<div class="f dwide'+(e?' empty':'')+'" data-w="'+E(k)+'" style="grid-column:1/-1"><span class="dchl">'+E(f.label||k)+'</span>'+chHtml(k,DRA(t.id),'')+'</div>'+(f.hint?'<div class="src">'+E(f.hint)+'</div>':'');var NC=ncOf(k,t);
 var h='<label class="f'+(e?' empty':'')+(NC?' dnc':'')+'" data-w="'+E(k)+'"'+(f.type=='textarea'?' style="grid-column:1/-1"':'')+'><span>'+E(f.label||k)+(f.optional?' <span class="sm">('+E(FU('optional'))+')</span>':'')+'</span>'+inp(f,v,'df').replace(/<(input|textarea|select)/,'<$1 class="inp"'+(ph&&!v?' placeholder="'+E(ph)+'"':''))+'</label>';
 if(f.hint)h+='<div class="src">'+E(f.hint)+'</div>';
 if(sc=='profile'||sc=='case'){var who=sc=='profile'?FU('to_mgr',{m:mshort(curMgr())}):FU('to_case');h+='<label class="chk"><input type="checkbox" id="dsv_'+E(k)+'" checked><i></i>'+E(FU('save_to',{w:who}))+'</label>'}return h}
function afBlock(t){var pf=t.fields.filter(function(k){return (F[k]||{}).scope=='profile'&&raw(k,t.id)}),cs=t.fields.filter(function(k){return (F[k]||{}).scope=='case'&&raw(k,t.id)}),n=pf.length+cs.length,c=curCase(),d=(c&&c.data)||{};if(!n)return '';
 var kv=function(k){return '<div class="kv2" data-fafk="'+E(k)+'" role="button" tabindex="0"><span>'+E((F[k]||{}).label||k)+'</span><b>'+E(fmt(k,raw(k,t.id)))+'</b></div>'};
 if(!FL.af)return '<div class="af"><div class="ic">'+IC.chk+'</div><div class="tx"><b>'+E(FU('af_f',{n:n}))+'</b><span class="sm">'+E([mshort(curMgr()),pf.length?FU('af_mgr'):'',d.НОМЕР_ДЕЛА?FU('case')+' '+d.НОМЕР_ДЕЛА:'',cs.length?FU('af_case'):''].filter(Boolean).join(', '))+'</span></div><button type="button" class="link" data-fl="afo">'+E(FU('show'))+'</button></div>';
 return '<div class="af open"><div style="display:flex;gap:10px;align-items:flex-start"><div class="ic">'+IC.chk+'</div><div class="tx"><b>'+E(FU('af_f',{n:n}))+'</b><span class="sm">'+E(FU('af_local'))+'</span></div><button type="button" class="link" data-fl="afo">'+E(FU('hide'))+'</button></div>'+
  (pf.length?'<div class="sub" style="margin:10px 0 2px">'+E(FU('af_g_mgr',{n:pf.length}))+'</div><div class="grid">'+pf.map(kv).join('')+'</div>':'')+(cs.length?'<div class="sub" style="margin:10px 0 2px">'+E(FU('af_g_case',{n:cs.length}))+'</div><div class="grid">'+cs.map(kv).join('')+'</div>':'')+
  '<button type="button" class="link" data-fl="debcard" style="margin-top:6px">'+E(FU('edit_card'))+'</button></div>'}
function regChips(){if(!window.ArbCP||!ArbCP.regChecked||!ArbCP.regMap)return '';var R=ArbCP.regMap(),L=ArbCP.regChecked();if(!Object.keys(R).length)return '';return '<div class="rgn" role="button" tabindex="0" data-fl="regs">'+E(FU('regs'))+' '+L.map(function(k){return '<span class="pc">'+E((R[k]||{}).n||k)+'</span>'}).join('')+'<span class="pc">'+E(FU('plus_fed'))+'</span></div>'}
function formHtml(t){var cf=adrField(t),nk=FL.need||(FL.need=needKeys(t,cf)),ne=nk.filter(function(k){return !raw(k,t.id)&&!(F[k]||{}).optional}),sg=SIG.length,sn=((S.sign||{})[t.id]!==false),ix=sg?((S.sigNm||{})[sigKey()]||0)%sg+1:0,lh=lhFor(t,'auto'),lhOn=(S.lh||{})[t.id]!='none';
 var need=nk.length?'<div class="need'+(ne.length?'':' ok')+'" id="dfneed"><h3>'+E(ne.length?FU('need'):FU('need_ok'))+'<span class="st '+(ne.length?'warn':'ok')+'" id="dfneedn">'+(ne.length?IC.warn+ne.length:IC.chk)+'</span><span class="sp"></span></h3>'+nk.map(function(k){return fld(k,t)}).join('')+'</div>':'';
 var adr=cf?'<div class="card"><h3>'+E(FU('addressee'))+'</h3><div id="dfdir"></div>'+regChips()+'<div class="sm" style="margin-top:6px">'+E(FU('adr_multi'))+' <button type="button" class="link" data-fl="tobatch">'+E(FU('adr_batch'))+'</button></div></div>':'';
 var doc='<div class="card"><h3>'+E(FU('doc'))+'</h3><div class="num">'+(t.fields.indexOf('ДАТА')>=0?'<label class="f"><span>'+E(FU('date'))+(raw('ДАТА',t.id)==todayISO()?' · <b style="color:var(--ok);font-weight:600">'+E(FU('today'))+'</b>':'')+'</span>'+inp(F['ДАТА'],raw('ДАТА',t.id),'df').replace(/<input/,'<input class="inp"')+'</label>':'')+
  (t.fields.indexOf('ИСХ_НОМЕР')>=0?'<label class="f"><span>'+E(FU('out'))+(raw('ИСХ_НОМЕР',t.id)?'':' · <b style="color:var(--ok);font-weight:600">'+E(FU('auto'))+'</b>')+'</span>'+inp(F['ИСХ_НОМЕР'],raw('ИСХ_НОМЕР',t.id),'df').replace(/<input/,'<input class="inp"')+'</label>':'')+'</div>'+
  (t.fields.indexOf('ДАТА_ОТЧЁТА')>=0?fld('ДАТА_ОТЧЁТА',t):'')+
  (sdHas(t)&&F[SDC().field||'ДАТА_ПОДПИСИ']?'<label class="f"><span>'+E(F[SDC().field||'ДАТА_ПОДПИСИ'].label)+'</span>'+inp(F[SDC().field||'ДАТА_ПОДПИСИ'],sdVal(t),'df')+'</label>':'')+
  '<div class="sw"><div class="tx"><b>'+E(FU('blank'))+'</b><span class="sm">'+E(lh?FU('blank_h',{n:lh.name}):FU('blank_none'))+'</span></div><button type="button" class="tg'+(lhOn&&lh?' on':'')+'" data-fl="lh" aria-pressed="'+!!(lhOn&&lh)+'"'+(lh?'':' disabled')+'></button></div>'+
  '<div class="sw"><div class="tx"><b>'+E(FU('sign'))+'</b><span class="sm">'+E(sg?FU('sign_h',{i:ix,n:sg,mm:GC().height_mm||22}):FU('sign_none'))+'</span></div><button type="button" class="tg'+(sg&&sigPref()?' on':'')+'" data-fl="sg" aria-pressed="'+!!(sg&&sigPref())+'" aria-label="'+E(FU('sign_tg')=='sign_tg'?'Подпись: вкл / выкл':FU('sign_tg'))+'"'+(sg?'':' disabled')+'></button></div></div>';
 var rows=rgHtml(t)+poshHtml(t)+(TBon(t)?TB_().html(t):'')+(RF(t).length?'<div class="card">'+rowsHtml(t)+'</div>':'');
 var pv='<div class="pv"><div class="pvh"><span>'+E(FU('pv_h'))+'</span><span class="sp"></span></div><div class="paperwrap"><div class="dprev" id="dprev"></div></div><div class="sm" style="margin-top:8px">'+E(FU('pv_note'))+'</div></div>';
 return ctxBar()+stepper(3)+'<button type="button" class="back" data-fl="t">'+E(FU('back_t'))+'</button><h2 class="dtitle">'+E(t.title)+'</h2><div class="dmeta"><span class="kind">'+E(t.kind||'')+'</span>'+(t.deadline?'<span>'+E(t.deadline)+'</span>':'')+(t.norm?'<span>'+E(t.norm)+'</span>':'')+'</div>'+
  '<div class="seg"><button type="button" class="'+(FL.tab=='f'?'on':'')+'" data-fl="tabf">'+E(FU('tab_f'))+' <span class="cnt" id="dfcnt"'+(ne.length?'':' hidden')+'>'+ne.length+'</span></button><button type="button" class="'+(FL.tab=='p'?'on':'')+'" data-fl="tabp">'+E(FU('tab_p'))+'</button></div>'+
  '<div class="fl'+(FL.tab=='p'?' ph-pv':'')+'"><form class="fm" id="dform" autocomplete="off" onsubmit="return false">'+afBlock(t)+need+rows+adr+doc+'</form>'+pv+'</div>'}
/* d6 hotfix: нижняя панель — «Подпись» вкл/выкл · Word / PDF / Оба · «Скачать» · «Подписать и сохранить в архив» (без подписи — «Сохранить в архив без подписи»); пока адресат не выбран — сохранить нельзя */
function FMT(){var f=S.fmt||'docx';if(f!='docx'&&!PDFOK())f='docx';return f}
function PDFOK(){return !!(window.ArbPDF&&ArbPDF.ready&&((C.pdf||{}).enabled!==false))}
function fmtSeg(){var B=C.bar||{},pdf=PDFOK(),f=FMT();return '<div class="dfmt" role="group" aria-label="'+E(B.fmt_label||'Формат')+'">'+[['docx',B.word||'Word'],['pdf',B.pdf||'PDF'],['both',B.both||'Оба']].map(function(x){var dis=x[0]!='docx'&&!pdf;return '<button type="button" class="'+(f==x[0]?'on':'')+'" data-fmt="'+x[0]+'" aria-pressed="'+(f==x[0])+'"'+(dis?' disabled title="'+E(B.soon||'скоро')+'" aria-disabled="true"':'')+'>'+E(x[1])+(dis?'<small>'+E(B.soon||'скоро')+'</small>':'')+'</button>'}).join('')+'</div>'}
function formBar(){if(!CUR)return;var m=missing(CUR).filter(function(k){return k!='ИСХ_НОМЕР'}),n=m.length,sg=SIG.length>0,on=sg&&sigPref(),ua=adrUnres(CUR),B=C.bar||{},pdf=PDFOK(),f=FMT();
 var seg=fmtSeg();
 var tg='<label class="dsgtg"><button type="button" class="tg'+(on?' on':'')+'" data-fl="sg" aria-pressed="'+on+'"'+(sg?'':' disabled title="'+E(FU('sign_none'))+'"')+'></button><span>'+E(B.sign||'Подпись')+'</span></label>';
 var main=on?FU('sign_save'):(B.save_unsigned||'Сохранить в архив без подписи');
 fbar((n?'<div class="warnl">'+IC.warn+E(FU('bar_miss',{n:n+' '+pl(n,'поле','поля','полей')}))+'</div>':'')+(ua?'<div class="warnl dadrw">'+IC.warn+E(B.adr_none||'Адресат не выбран — сохранить в архив нельзя, скачать черновик можно')+'</div>':'')+
  '<div class="dbrow1">'+tg+seg+'</div><div class="dbrow2"><button type="button" class="btn sec dlb" data-fl="dl" title="'+E(FU('dl_t'))+'">'+IC.dl+'<span class="lbl2">'+E(FU('dl'))+'</span></button><button type="button" class="btn pri grow" data-fl="signsave"'+(ua?' disabled aria-disabled="true" title="'+E(B.adr_none||'Адресат не выбран')+'"':'')+'>'+IC.pen+E(main)+'</button></div>','two dbar3')}
function needSync(){if(!CUR)return;var t=CUR,nk=FL.need||[],ne=nk.filter(function(k){return !raw(k,t.id)&&!(F[k]||{}).optional});
 nk.forEach(function(k){var w=document.querySelector('#dfneed [data-w="'+k+'"]');if(w)w.classList.toggle('empty',!raw(k,t.id)&&!(F[k]||{}).optional)});
 var b=$('dfneedn'),nd=$('dfneed'),c=$('dfcnt');if(b){b.className='st '+(ne.length?'warn':'ok');b.innerHTML=ne.length?IC.warn+ne.length:IC.chk}if(nd){nd.classList.toggle('ok',!ne.length);var h=nd.querySelector('h3');if(h&&h.firstChild)h.firstChild.nodeValue=ne.length?FU('need'):FU('need_ok')}if(c){c.textContent=ne.length;c.hidden=!ne.length}formBar()}
/* d7: форматы результата — Word / PDF / Оба. PDF строится в браузере из того же docx (ArbPDF); при сбое или неточном рендере — Word вместо PDF с предупреждением */
async function mkFiles(t,blob,f){f=f||FMT();var o={docx:f!='pdf'?blob:null,pdf:null,f:f},P=C.pdf||{};if(f=='docx')return o;
 try{var r=await ArbPDF.fromDocx(blob);if(!r.ok&&P.strict!==false){o.docx=blob;o.warn=String(P.warn_fallback||'PDF для «{t}» может отличаться от Word ({why}) — сохранён Word').replace('{t}',t.title).replace('{why}',r.warn.join(', '));o.why=r.warn}else o.pdf=r.blob}
 catch(x){o.docx=blob;o.warn=String(P.warn_error||'PDF не построен ({why}) — сохранён Word').replace('{why}',x.message);o.why=[x.message]}
 return o}
function pdfName(fn){return String(fn).replace(/\.docx$/i,'')+'.pdf'}
function dlFiles(o,fn){if(o.docx)saveBlob(o.docx,fn);if(o.pdf)setTimeout(function(){saveBlob(o.pdf,pdfName(fn))},o.docx?400:0)}
async function flowMake(sign){var t=CUR;if(!t)return;if(RQ_()&&!RQ_().gate(t))return;var m=missing(t).filter(function(k){return k!='ИСХ_НОМЕР'});
 if(sign&&m.length&&!confirm(FU('confirm_miss',{n:m.length+' '+pl(m.length,'поле','поля','полей')}))){FL.tab='f';var fl=document.querySelector('.fl');if(fl)fl.classList.remove('ph-pv');var e=document.querySelector('#dfneed .empty input,#dfneed .empty textarea,#dform .empty input');if(e){e.scrollIntoView({block:'center'});e.focus()}return}
 var useSig=sigPref()&&SIG.length>0;S.sign=S.sign||{};var was=S.sign[t.id];S.sign[t.id]=useSig;
 var auto=t.fields.indexOf('ИСХ_НОМЕР')>=0&&!raw('ИСХ_НОМЕР',t.id),o=outCfg(),no=raw('ИСХ_НОМЕР',t.id),d=S.drafts[t.id]=S.drafts[t.id]||{};if(auto){no=outFmt(o.next,o,fmt('ДАТА',raw('ДАТА',t.id)));d.ИСХ_НОМЕР=no}
 var sgv=useSig?(((S.sigNm||{})[sigKey()]||0)%SIG.length+1):0,lh=lhFor(t),blob;fbar('<div class="info"><b>'+E(FU('making'))+'</b></div>');
 try{blob=await docx(t)}catch(x){S.sign[t.id]=was;if(auto)delete d.ИСХ_НОМЕР;toast(x.message);formBar();return}finally{if(auto)delete d.ИСХ_НОМЕР}
 S.sign[t.id]=was;var n=outNum(no);if(no&&n&&n>=o.next)o.next=n+1;save();
 var c=curCase(),cn=String((c&&c.data.НОМЕР_ДЕЛА)||'').replace(/[\\\/:*?"<>|\s]+/g,'-'),fn=(cn?cn+'_':'')+String(no||'').replace(/[\\\/:*?"<>|\s]+/g,'-')+(no?'_':'')+t.id+'.docx',ad=addrOf(t,null),id=null;
 var FO=await mkFiles(t,blob);if(FO.warn)toast(FO.warn);
 if(!sign)dlFiles(FO,fn);
 if(window.ArbArch){try{id=await ArbArch.add(archMeta(t,{no:no||'',addressee:ad,blank:!!lh,signed:useSig,unsigned:!useSig,sig_variant:sgv||undefined,fname:FO.docx?fn:pdfName(fn),pdf_fname:pdfName(fn),auto:auto}),FO.docx,undefined,FO.pdf?{pdf:FO.pdf}:null);if(ArbArch.notify&&!sign)ArbArch.notify(1,'',id)}catch(x){if(ArbArch.notify)ArbArch.notify(0,x.message)}}
 FL.res={t:t,no:no,blob:blob,fo:FO,fn:fn,signed:useSig,sgv:sgv,lh:!!lh,ad:ad,id:id,at:new Date(),date:fmt('ДАТА',raw('ДАТА',t.id))};CUR=null;$('ded').style.display='none';$('ded').innerHTML='';$('vdocs').classList.remove('editing');FL.step='r';drawCases();window.scrollTo(0,$('vdocs').offsetTop-60)}
function scrR(){var r=FL.res;if(!r)return '';var c=curCase(),d=(c&&c.data)||{},m=curMgr(),at=r.at,ts=('0'+at.getDate()).slice(-2)+'.'+('0'+(at.getMonth()+1)).slice(-2)+'.'+at.getFullYear()+', '+('0'+at.getHours()).slice(-2)+':'+('0'+at.getMinutes()).slice(-2);
 return ctxBar()+'<div class="big"><div class="ic">'+IC.chk+'</div><h2>'+E(r.signed?FU('r_signed'):FU('r_unsigned'))+'</h2><div class="sm">'+E(FU('r_where',{d:d.ДОЛЖНИК_НАИМЕНОВАНИЕ||FU('nodebtor'),t:ts}))+'</div></div>'+
 '<div class="rc">'+(r.no?'<div class="kv2"><span>'+E(FU('out'))+'</span><b>'+E(r.no+(r.date?' '+FU('from')+' '+r.date:''))+'</b></div>':'')+'<div class="kv2"><span>'+E(FU('doc_l'))+'</span><b>'+E(r.t.title)+'</b></div>'+(r.ad?'<div class="kv2"><span>'+E(FU('addressee'))+'</span><b>'+E(r.ad)+'</b></div>':'')+
 '<div class="kv2"><span>'+E(FU('sign'))+'</span><b>'+E([r.signed?mshort(m)+' · '+FU('variant')+' '+r.sgv:FU('unsigned'),r.lh?FU('on_blank'):''].filter(Boolean).join(' · '))+'</b></div><div class="kv2"><span>'+E(FU('file'))+'</span><b>'+E(r.fn)+'</b></div></div>'+
 '<div class="dl">'+((r.fo||{}).docx||!r.fo?'<button type="button" class="btn pri" data-fl="rdl">'+IC.dl+E(FU('dl_word'))+'</button>':'')+((r.fo||{}).pdf?'<button type="button" class="btn '+((r.fo||{}).docx?'sec':'pri')+'" data-fl="rdlp">'+IC.dl+E(FU('dl_pdf')=='dl_pdf'?'Скачать PDF':FU('dl_pdf'))+'</button>':'')+'</div><button type="button" class="btn sec" style="width:100%;min-height:46px" data-fl="rarch">'+IC.arch+E(FU('open_arch'))+'</button>'+
 '<div class="secth"><span class="n">'+E(FU('next'))+'</span></div><div class="tl"><div class="nx" role="button" tabindex="0" data-fs="t"><div class="ki">'+IC.plus+'</div><div class="tx">'+E(FU('nx_more'))+'<span class="sm">'+E(mshort(m)+' · '+(d.ДОЛЖНИК_НАИМЕНОВАНИЕ||''))+'</span></div>'+IC.chev+'</div>'+
 '<div class="nx" role="button" tabindex="0" data-fl="same"><div class="ki">'+IC.doc+'</div><div class="tx">'+E(FU('nx_same'))+'<span class="sm">'+E(FU('nx_same_h'))+'</span></div>'+IC.chev+'</div>'+
 '<div class="nx" role="button" tabindex="0" data-fs="d"><div class="ki">'+IC.user+'</div><div class="tx">'+E(FU('nx_other'))+'<span class="sm">'+E(FU('nx_other_h'))+'</span></div>'+IC.chev+'</div></div>'}
function chgSheet(on){var s=$('dfsheet');if(!s)return;s.hidden=!on;if(!on){s.innerHTML='';return}s.innerHTML='<div class="sh" role="dialog" aria-modal="true"><div class="grab"></div><h3>'+E(FU('change'))+'</h3><div class="tl"><div class="nx" role="button" tabindex="0" data-fs="m"><div class="ki">'+IC.user+'</div><div class="tx">'+E(FU('chg_m'))+'</div>'+IC.chev+'</div><div class="nx" role="button" tabindex="0" data-fs="d"><div class="ki">'+IC.bld+'</div><div class="tx">'+E(FU('chg_d'))+'</div>'+IC.chev+'</div></div><div class="acts"><button type="button" class="btn sec" data-fl="shx">'+E(FU('cancel'))+'</button></div></div>'}
function flowBind(){var v=$('vdocs');
 v.addEventListener('click',function(e){var fb=e.target.closest('[data-fmt]');if(fb&&!fb.disabled&&!fb.closest('.dbatch')){S.fmt=fb.dataset.fmt;save();[].forEach.call(document.querySelectorAll('[data-fmt]'),function(x){x.classList.toggle('on',x.dataset.fmt==S.fmt);x.setAttribute('aria-pressed',x.dataset.fmt==S.fmt)});if(S.fmt!='docx'&&window.ArbPDF)ArbPDF.preload();return}
 var b=e.target.closest('[data-fs],[data-fl],[data-fmg],[data-fdeb],[data-fpre],[data-ft],[data-fstar],[data-fafk]');if(!b||b.closest('.dbatch'))return;var d=b.dataset;
  if(d.fstar){e.stopPropagation();S.fav=S.fav||[];var i=S.fav.indexOf(d.fstar);if(i<0)S.fav.push(d.fstar);else S.fav.splice(i,1);save();drawCases();return}
  if(d.fs){e.preventDefault();chgSheet(false);if(d.fs=='d'&&FL.step=='m'&&!MGR.some(function(m){return m.id==S.mgr}))return;goStep(d.fs);return}
  if(d.fmg){if(S.mgr==d.fmg&&FL.step=='m'){goStep('d');return}S.mgr=d.fmg;var c0=curCase();if(c0&&c0.mgr&&c0.mgr!=d.fmg)S.cur=null;save();curMgr();FL.step='m';refreshAll();return}
  if(d.fdeb){pickDeb(d.fdeb);return}
  if(d.fpre!=null){FL.pk=FL.pk||{};if(FL.pk[d.fpre])delete FL.pk[d.fpre];else FL.pk[d.fpre]=1;b.classList.toggle('on',!!FL.pk[d.fpre]);b.setAttribute('aria-checked',!!FL.pk[d.fpre]);pkBar();return}
  if(d.fl=='pkall'||d.fl=='pknone'){FL.pk={};if(d.fl=='pkall')[].forEach.call(document.querySelectorAll('#dflow [data-fpre]'),function(x){FL.pk[x.dataset.fpre]=1});drawCases();return}
  if(d.fl=='pkgo'){var ids=pkIds();if(ids.length&&window.ArbBatch){FL.pk={};startBatch(ids)}return}
  if(d.ft){openT(d.ft);return}
  if(d.fafk){var k=d.fafk,cur=raw(k,CUR.id),nv=prompt(((F[k]||{}).label||k)+' — '+FU('af_local'),fmt(k,cur));if(nv!=null){(S.drafts[CUR.id]=S.drafts[CUR.id]||{})[k]=nv;save();var bb=b.querySelector('b');if(bb)bb.textContent=nv;prev();formBar()}return}
  var a=d.fl;
  if(a=='chg'){chgSheet(true);return}if(a=='shx'){chgSheet(false);return}
  if(a=='mgadd'){showTab('cp');if(window.ArbCP&&ArbCP.openSec)ArbCP.openSec('managers');return}
  if(a=='dadd'){showTab('cp');if(window.ArbCP&&ArbCP.openSec)ArbCP.openSec('debtors','add');return}
  if(a=='debcard'){showTab('cp');if(window.ArbCP&&ArbCP.openSec)ArbCP.openSec('debtors');return}
  if(a=='dqx'){FL.dq='';var q=$('dfdq');if(q){q.value='';q.focus()}b.hidden=true;drawDD();return}
  if(a=='dmine'||a=='dall'){FL.dAll=a=='dall';drawDD();return}
  if(a=='oth'){FL.oth=!FL.oth;drawCases();return}
  if(a=='all'){FL.all=!FL.all;drawCases();if(FL.all)$('dlist').scrollIntoView({block:'start'});return}
  if(a=='archall'||a=='rarch'){var c=curCase();showTab('arch');if(window.ArbArch&&c)ArbArch.focus([c.id],c.data.ДОЛЖНИК_НАИМЕНОВАНИЕ,c.data.ДОЛЖНИК_ИНН);return}
  if(a=='t'){goStep('t');return}
  if(a=='afo'){FL.af=!FL.af;var fm=$('dform'),ab=fm&&fm.querySelector('.af');if(ab){var tmp=document.createElement('div');tmp.innerHTML=afBlock(CUR);ab.replaceWith(tmp.firstChild)}return}
  if(a=='tabf'||a=='tabp'){FL.tab=a=='tabp'?'p':'f';var fl=document.querySelector('#ded .fl');if(fl)fl.classList.toggle('ph-pv',FL.tab=='p');[].forEach.call(document.querySelectorAll('#ded .seg button'),function(x){x.classList.toggle('on',x.dataset.fl==a)});return}
  if(a=='sg'&&CUR){S.sigPref=!sigPref();save();[].forEach.call(document.querySelectorAll('[data-fl=sg]'),function(x){x.classList.toggle('on',S.sigPref);x.setAttribute('aria-pressed',S.sigPref)});prev();try{formBar()}catch(x){}return}
   if(a=='lh'&&CUR){S.lh=S.lh||{};S.lh[CUR.id]=S.lh[CUR.id]=='none'?'auto':'none';save();b.classList.toggle('on',S.lh[CUR.id]!='none');prev();return}
  if(a=='regs'){showTab('cp');if(window.ArbCP&&ArbCP.openSec)ArbCP.openSec('adir');return}
  if(a=='tobatch'&&CUR){startBatch([CUR.id]);return}
  if(a=='dl'){flowMake(false);return}if(a=='signsave'){if(CUR&&adrUnres(CUR)){toast((C.bar||{}).adr_none||'Адресат не выбран');return}flowMake(true);return}
  if(a=='rdl'&&FL.res){saveBlob(FL.res.blob,FL.res.fn);return}
  if(a=='rdlp'&&FL.res&&FL.res.fo&&FL.res.fo.pdf){saveBlob(FL.res.fo.pdf,pdfName(FL.res.fn));return}
  if(a=='same'&&FL.res){openT(FL.res.t.id);return}});
 v.addEventListener('input',function(e){var i=e.target;if(i.id=='dfdq'){FL.dq=i.value;var x=v.querySelector('[data-fl="dqx"]');if(x)x.hidden=!i.value;clearTimeout(drawDD.t);drawDD.t=setTimeout(function(){DDA=0;drawDD()},120);return}
  if(i.id=='dftq'){FL.tq=i.value;var p=i.selectionStart;drawCases();var n=$('dftq');if(n){n.focus();try{n.setSelectionRange(p,p)}catch(x){}}return}
  if(i.id=='dfms'){FL.ms=i.value;var p2=i.selectionStart;drawCases();var n2=$('dfms');if(n2){n2.focus();try{n2.setSelectionRange(p2,p2)}catch(x){}}return}
  if(CUR&&i.id&&i.id.indexOf('df_')==0)setTimeout(needSync,0)});
 v.addEventListener('keydown',function(e){var i=e.target;if(i.id=='dfdq'){var n=DDL.length;if(e.key=='ArrowDown'){e.preventDefault();DDA=Math.min(n-1,DDA+1);drawDD()}else if(e.key=='ArrowUp'){e.preventDefault();DDA=Math.max(0,DDA-1);drawDD()}else if(e.key=='Enter'){e.preventDefault();if(DDL[DDA])pickDeb(DDL[DDA].c.id)}else if(e.key=='Escape'){i.blur()}return}
  var t=i.closest&&i.closest('[data-ft],[data-fs].nx,[data-fl].nx,[data-fl].ft,[data-fl].rgn,[data-fafk]');if(t&&t===i&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}if(e.key=='Escape'&&!$('dfsheet').hidden)chgSheet(false)})}

/* d6: поле даты — ручной ввод по маске __.__.____, кнопка календаря (на телефоне — системный выбор даты), «Сегодня», проверка */
function toDMY(v){v=String(v||'').trim();var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(v);return m?m[3]+'.'+m[2]+'.'+m[1]:v}
function dmyOk(v){var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(v);if(!m)return false;var d=new Date(+m[3],+m[2]-1,+m[1]);return d.getFullYear()==+m[3]&&d.getMonth()==+m[2]-1&&d.getDate()==+m[1]}
function dateInp(a,v,dl){var DU2=(C.date_ui||{}),dm=toDMY(v),bad=dm&&dm.length==10&&!dmyOk(dm);
 return '<span class="ddate"><span class="ddw"><input'+a+' type="text" inputmode="numeric" data-date="1" maxlength="10" placeholder="'+E(DU2.ph||'ДД.ММ.ГГГГ')+'" value="'+E(dm)+'" autocomplete="off"'+(bad?' class="dbad" aria-invalid="true"':'')+'><button type="button" class="ddcal" data-ddcal="1" aria-label="'+E(DU2.cal||'Открыть календарь')+'"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg></button><input type="date" class="ddnat" tabindex="-1" aria-hidden="true"></span>'+
  '<span class="ddrow"><button type="button" class="ddtoday" data-ddtoday="1">'+E(DU2.today||'Сегодня')+'</button><span class="ddbad"'+(bad?'':' hidden')+'>'+E(DU2.bad||'Такой даты нет — проверьте день и месяц')+'</span></span></span>'+(dl||'')}
function dmyNow(){return todayISO().split('-').reverse().join('.')}
function dSet(i,v){i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}
function dCheck(i){var w=i.closest('.ddate'),b=w&&w.querySelector('.ddbad'),bad=i.value.length==10&&!dmyOk(i.value)||(i.value.length>0&&i.value.length<10&&document.activeElement!==i);i.classList.toggle('dbad',bad);i.setAttribute('aria-invalid',bad?'true':'false');if(b)b.hidden=!bad}
var DPOP=null;
function calClose(){if(DPOP){DPOP.remove();DPOP=null}}
function calOpen(i){calClose();var U3=C.date_ui||{},MN=U3.months||['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],WD=U3.weekdays||['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
 var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(i.value),cur=m&&dmyOk(i.value)?new Date(+m[3],+m[2]-1,+m[1]):null,v=cur||new Date(),y=v.getFullYear(),mo=v.getMonth();
 var p=document.createElement('div');p.className='ddpop';p.setAttribute('role','dialog');p.setAttribute('aria-label',U3.cal||'Календарь');
 var draw=function(){var f=new Date(y,mo,1),off=(f.getDay()+6)%7,n=new Date(y,mo+1,0).getDate(),t=new Date(),h='<div class="ddph"><button type="button" data-ddm="-1" aria-label="‹">‹</button><b>'+MN[mo]+' '+y+'</b><button type="button" data-ddm="1" aria-label="›">›</button></div><div class="ddg">'+WD.map(function(w){return '<i>'+w+'</i>'}).join('');
  for(var k=0;k<off;k++)h+='<span></span>';for(var d=1;d<=n;d++){var sel=cur&&cur.getFullYear()==y&&cur.getMonth()==mo&&cur.getDate()==d,td=t.getFullYear()==y&&t.getMonth()==mo&&t.getDate()==d;h+='<button type="button" data-ddd="'+d+'" class="'+(sel?'on':'')+(td?' td':'')+'">'+d+'</button>'}p.innerHTML=h+'</div>'};
 draw();p.addEventListener('mousedown',function(e){e.preventDefault()});
 p.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.ddm){mo+=+b.dataset.ddm;if(mo<0){mo=11;y--}if(mo>11){mo=0;y++}draw();return}if(b.dataset.ddd){dSet(i,('0'+b.dataset.ddd).slice(-2)+'.'+('0'+(mo+1)).slice(-2)+'.'+y);dCheck(i);calClose();i.focus()}});
 i.closest('.ddw').appendChild(p);DPOP=p}
function dateBind(){if(window.__ddb)return;window.__ddb=1;
 document.addEventListener('input',function(e){var i=e.target;if(!i.dataset||!i.dataset.date)return;var d=i.value.replace(/\D/g,'').slice(0,8),o=d.slice(0,2)+(d.length>2?'.'+d.slice(2,4):'')+(d.length>4?'.'+d.slice(4):'');if(o!==i.value)i.value=o;dCheck(i)},true);
 document.addEventListener('focusout',function(e){var i=e.target;if(i.dataset&&i.dataset.date)setTimeout(function(){dCheck(i)},0)});
 document.addEventListener('click',function(e){var b=e.target.closest('[data-ddtoday],[data-ddcal]');if(!b){if(DPOP&&!e.target.closest('.ddpop'))calClose();return}var w=b.closest('.ddate'),i=w&&w.querySelector('[data-date]');if(!i)return;e.preventDefault();
  if(b.dataset.ddtoday){if(i.dataset.k&&SDF().indexOf(i.dataset.k)>=0&&!i.closest('.dcpb')){dSet(i,'');i.value=dmyNow()}else dSet(i,dmyNow());dCheck(i);calClose();return}
  if(DPOP&&w.contains(DPOP)){calClose();return}
  var nat=w.querySelector('.ddnat');if(matchMedia('(pointer:coarse)').matches&&nat&&nat.showPicker){var m=/^(\d\d)\.(\d\d)\.(\d{4})$/.exec(i.value);nat.value=m&&dmyOk(i.value)?m[3]+'-'+m[2]+'-'+m[1]:'';nat.onchange=function(){if(nat.value)dSet(i,toDMY(nat.value));dCheck(i)};try{nat.showPicker();return}catch(x){}}
  calOpen(i)});
 document.addEventListener('keydown',function(e){if(e.key=='Escape')calClose();var t=e.target;if(t&&t.dataset&&t.dataset.brg&&(e.key=='Enter'||e.key==' ')){e.preventDefault();t.click()}})}
function init(){C=window.ARB_DOCS_CFG;X=window.ARB_DOCS;if(!C||!X)return;S=load();try{v7Migrate(S)}catch(e){}initFields();shell();try{v7Bind($('vdocs'))}catch(e){}
 $('dtl').textContent=C.title;$('dintro').textContent=C.intro||'';$('dpriv').textContent=C.privacy||'';$('dclear').textContent=U('clear');
 drawCases();bind();flowBind();dateBind();lhLoadLocal();
 var API={mkFiles:mkFiles,pdfName:pdfName,dlFiles:dlFiles,fmtSeg:fmtSeg,FMT:FMT,X:X,C:C,F:F,S:function(){return S},save:save,raw:raw,fmt:fmt,missing:missing,mlabel:mlabel,docx:docx,md:md,TXT:TXT,rows:rows,RF:RF,rowsFilled:rowsFilled,lhFor:lhFor,sigFor:sigFor,SIG:function(){return SIG},LH:function(){return LH},curCase:curCase,caseName:caseName,saveBlob:saveBlob,setVal:setVal,inp:inp,E:E,U:U,BU:BU,pl:pl,outCfg:outCfg,outFmt:outFmt,outNum:outNum,setOV:function(o){OV=o},MGR:function(){return MGR},curMgr:curMgr,setMgr:setMgr,mgrName:mgrName,mgrTop:mgrTop,mgrRO:mgrRO,mgrEdit:mgrEdit,mgrSave:mgrSave,showTab:showTab,MU2:MU2,encOK:encOK,htmlPrev:htmlPrev,pvWrap:pvWrap,lhPv:lhPv,sigFor:sigFor,expandRowsText:expandRowsText,drawCases:drawCases,bar:bar,toast:toast,showList:showList,sel:BSEL,multiOf:multiOf,prof:prof,ofScope:ofScope,addrOf:addrOf,setCur:function(id){S.cur=id||null;save();drawCases()}};
 if(window.ArbBatch)ArbBatch.mount($('ded'),API);if(window.ArbArch&&$('darchb'))ArbArch.mount($('darchb'),API);
 if(window.ArbCP&&$('dcpb'))ArbCP.mount($('dcpb'),{S:function(){return S},debtorType:function(c){return debtorType(c)},personOnly:function(){var o=[];(X.templates||[]).forEach(function(t){CBL(t).forEach(function(b){if(b.flag_from&&b.flag_from.debtor_type=='person'&&!cbScopeG(t,b))o=o.concat(b.fields||[])})});return o},C:function(){return C},F:function(){return F},save:save,caseName:caseName,drawCases:drawCases,refresh:function(){drawCases();if(CUR)openT(CUR.id,1)},MGR:function(){return MGR},mgrName:mgrName,mgrEdit:mgrEdit,showTab:showTab,encOK:encOK,E:E,setMgr:setMgr,setCur:function(id){S.cur=id||null;save();curMgr();refreshAll()},dateInp:dateInp,vdec:vdec,venc:async function(b,s,it){var iv=crypto.getRandomValues(new Uint8Array(12));return {iv:iv,ct:await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},await auKey(s,it),b)}},vaultSalt:function(){return {s:reqSalt(),it:600000}},multiOf:multiOf,pl:pl,toast:function(m){toast(m)}});var n=0,iv=setInterval(function(){n++;if(nav(n>40))clearInterval(iv)},250)}
window.__docsTest={S:function(){return S},open:function(id){return openT(id)},miss:function(){return CUR?missing(CUR):null},lyAddr:function(x){return lyAddr(x)},dl:{calc:dlCalc,block:function(id,k){return dlBlock(X.templates.find(function(x){return x.id==id}),k)},status:function(id,k,b){var t=X.templates.find(function(x){return x.id==id});return dlStatus(t,k,b||dlBlock(t,k))},caption:function(id,k){return dlCaption(X.templates.find(function(x){return x.id==id}),k)},srcOk:srcOk,feeds:dlFeeds,work:dlWork},F:function(){return F},sgMd:function(s){return sgMd(s)},ov:function(o){OV=o},blank:function(id,k){S.drafts[id]=S.drafts[id]||{};S.drafts[id][k]=''},fill:function(id){var t=X.templates.find(function(x){return x.id==id});return md(t).then(function(s){return plain(fill(s,t,'text'))})},docx:function(id){return docx(X.templates.find(function(x){return x.id==id}))},missing:function(id){return missing(X.templates.find(function(x){return x.id==id}))}};
if(document.readyState=='loading')addEventListener('DOMContentLoaded',init);else init();
})();
