/* Arbitr App — раздел «Документы». Шаблоны: window.ARB_DOCS (documents/index.json), настройки: window.ARB_DOCS_CFG.
   Персональные данные (профиль управляющего, дела, черновики) хранятся ТОЛЬКО в localStorage этого устройства и никуда не отправляются. */
(function(){
var C,X,F={},S,CUR=null,FLT='',Q='',LS='arbitr_docs_v1',OV=null,BSEL=new Set(),DXC={};
var $=function(i){return document.getElementById(i)};
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function U(k,o){var s=(C.ui||{})[k]||k;if(o)Object.keys(o).forEach(function(n){s=s.split('{'+n+'}').join(o[n])});return s}
function load(){var s={};try{s=JSON.parse(localStorage.getItem(LS))||{}}catch(e){}s.profile=s.profile||{};s.cases=s.cases||[];s.drafts=s.drafts||{};return s}
function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
/* ===== Бланки, подписи и встроенный профиль АУ =====
   Встроенные данные АУ (профиль, бланки, подписи) лежат в ЗАКРЫТОМ репозитории в зашифрованном виде (AES-GCM, ключ из PIN через PBKDF2)
   и расшифровываются в памяти только после ввода PIN. Загруженные вручную бланки и подписи хранятся только на устройстве (IndexedDB). */
var LH=[],SIG=[],AU={profile:null,pin:null,keys:{},state:''},OBJ={};
var WNS='http://schemas.openxmlformats.org/wordprocessingml/2006/main',BR=/\[[^\[\]]{1,60}\]/g;
function LC(){return C.letterhead||{}}
function GC(){return C.signature||{}}
function LU(k,o){var x=LC()[k]||GC()[k]||k;if(o)Object.keys(o).forEach(function(n){x=x.split('{'+n+'}').join(o[n])});return x}
function b64u8(s){return Uint8Array.from(atob(s),function(c){return c.charCodeAt(0)})}
async function auKey(salt,it){var id=salt+':'+it;if(AU.keys[id])return AU.keys[id];var k0=await crypto.subtle.importKey('raw',new TextEncoder().encode(AU.pin),'PBKDF2',false,['deriveKey']);
 return AU.keys[id]=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:b64u8(salt),iterations:it},k0,{name:'AES-GCM',length:256},false,['decrypt'])}
async function ghRaw(path){var tk=(typeof TOKEN!='undefined'&&TOKEN)||'',rp=(typeof REPO!='undefined'&&REPO)||(C.au_vault||{}).repo;if(!tk||!rp)throw new Error('нет доступа');
 var r=await fetch('https://api.github.com/repos/'+rp+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref=main&_='+Date.now(),{headers:{Authorization:'Bearer '+String(tk).trim(),Accept:'application/vnd.github.raw+json'},cache:'no-store'});
 if(!r.ok)throw new Error('GitHub '+r.status);return r.text()}
async function vdec(txt){var j=JSON.parse(txt),k=await auKey(j.s,j.it);return crypto.subtle.decrypt({name:'AES-GCM',iv:b64u8(j.iv)},k,b64u8(j.ct))}
async function auLoad(){var V=C.au_vault||{};if(!V.path||!AU.pin)return;AU.state='loading';
 for(var i=0;i<120&&!(typeof TOKEN!='undefined'&&TOKEN);i++)await new Promise(function(r){setTimeout(r,500)});
 try{var man=JSON.parse(new TextDecoder().decode(await vdec(await ghRaw(V.path+V.manifest))));AU.profile=man.profile||null;
  for(var a=0;a<(man.letterheads||[]).length;a++){var l=man.letterheads[a];try{var d=await vdec(await ghRaw(V.path+l.file));LH=LH.filter(function(x){return x.id!=l.id});LH.unshift(await lhMeta({id:l.id,name:l.name,type:l.type,builtin:true,data:d,size:d.byteLength,added:0}))}catch(e){}}
  for(var b=0;b<(man.signatures||[]).length;b++){var g=man.signatures[b];try{var sd=await vdec(await ghRaw(V.path+g.file));SIG=SIG.filter(function(x){return x.id!=g.id});SIG.push(await sigMeta({id:g.id,name:g.name,builtin:true,data:sd,order:b}))}catch(e){}}
  SIG.sort(function(x,y){return (x.builtin?0:1)-(y.builtin?0:1)||(x.order||0)-(y.order||0)});
  AU.state='ok'}catch(e){AU.state='none'}
 AU.pin=null;drawProfile();if(CUR)openT(CUR.id,1)}
window.__arbPin=function(pin){AU.pin=String(pin);AU.keys={};if(window.ArbArch)ArbArch.unlock(String(pin)).then(function(){outSync();drawCases()}).catch(function(){});auLoad()};
function prof(k){var v=S.profile[k];if(v!=null&&v!=='')return v;return AU.profile&&AU.profile[k]||''}
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
async function lhLoadLocal(){if(!window.ArbDB)return;try{var a=await ArbDB.all('letterheads');for(var i=0;i<a.length;i++){if(!LH.some(function(x){return x.id==a[i].id}))LH.push(await lhMeta(a[i]))}}catch(e){}
 try{var s=await ArbDB.all('signatures');for(var j=0;j<s.length;j++){if(!SIG.some(function(x){return x.id==s[j].id}))SIG.push(await sigMeta(s[j]))}}catch(e){}drawProfile()}
async function lhAdd(f){var buf=await f.arrayBuffer(),r={id:ArbDB.uid('lh'),name:f.name.replace(/\.docx$/i,''),size:f.size,type:lhGuess(f.name),added:Date.now(),data:buf};
 try{await lhMeta(r)}catch(e){throw new Error(LU('bad_file',{name:f.name}))}
 await ArbDB.put('letterheads',{id:r.id,name:r.name,size:r.size,type:r.type,added:r.added,data:buf});LH.push(r)}
function lhType(l){return (S.lht||{})[l.id]||l.type}
function lhFor(t,ch){if(OV&&!OV.blank)return null;ch=ch||(S.lh||{})[t.id]||'auto';if(ch=='none')return null;if(ch!='auto'){var x=LH.find(function(l){return l.id==ch});if(x)return x}
 var want=(LC().by_kind||{})[t.kind]||'any';return LH.find(function(l){return lhType(l)==want})||LH.find(function(l){return lhType(l)=='any'})||LH[0]||null}
function lhSel(t){var a=lhFor(t,'auto'),ch=(S.lh||{})[t.id]||'auto';return '<div class="dcrow"><label for="dflh">'+E(LU('pick'))+'</label><select id="dflh"><option value="auto"'+(ch=='auto'?' selected':'')+'>'+E(a?LU('auto',{name:a.name}):LU('auto_none'))+'</option>'+LH.map(function(l){return '<option value="'+E(l.id)+'"'+(ch==l.id?' selected':'')+'>'+E(l.name)+'</option>'}).join('')+'<option value="none"'+(ch=='none'?' selected':'')+'>'+E(LU('none'))+'</option></select></div>'}
function drawLH(){var T=LC().types||[],V=S.lhv||{};
 return '<h4 class="dsh">'+E(LU('title'))+'</h4><p class="sm">'+E(LU('help'))+'</p><label class="fdrop dlhdrop"><input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple id="dlhup"><span>'+E(LU('upload'))+'</span></label><p class="sm" id="dlhm"></p>'+
 LH.map(function(l){var vv=V[l.id]||{};return '<div class="lot dlhit"><div class="d1">'+E(l.name)+' <span class="sm">'+(l.builtin?E(LU('builtin')):Math.round(l.size/1024)+' КБ')+'</span></div><div class="dcrow"><label for="dlht_'+E(l.id)+'">'+E(LU('type_label'))+'</label><select id="dlht_'+E(l.id)+'" data-lht="'+E(l.id)+'">'+T.map(function(t){return '<option value="'+E(t.k)+'"'+(t.k==lhType(l)?' selected':'')+'>'+E(t.label)+'</option>'}).join('')+'</select></div>'+
  (l.fields.length?'<div class="sm"><b>'+E(LU('fields_title'))+'</b></div><div class="g2">'+l.fields.map(function(f,i){return '<div><label for="dlhf_'+E(l.id)+'_'+i+'">'+E(f.ctx)+'</label><input id="dlhf_'+E(l.id)+'_'+i+'" data-lhf="'+E(l.id)+'" data-fk="'+E(f.key)+'" value="'+E(vv[f.key]||'')+'" autocomplete="off"></div>'}).join('')+'</div>':'')+
  (l.builtin?'':'<p><button type="button" class="lbtn sec" data-lhdel="'+E(l.id)+'">'+E(LU('del'))+'</button></p>')+'</div>'}).join('')+'<p class="sm">'+E(LU('marker_help'))+'</p>'}
async function lhMerge(tz,l,t){var tx=await tz.file('word/document.xml').async('string'),tb=tx.slice(tx.indexOf('<w:body>')+8,tx.lastIndexOf('<w:sectPr'));
 if(LC().compact!==false)tb=tb.replace(/<w:p\/>(?=(<w:p[ >][\s\S]*?<\/w:p>)?)/g,function(m,nx){return nx&&/_{5,}/.test(nx.replace(/<[^>]+>/g,''))?m:''});
 var z=await JSZip.loadAsync(l.data.slice(0)),dx=await z.file('word/document.xml').async('string');
 var bo=dx.indexOf('<w:body'),bs=dx.indexOf('>',bo)+1,be=dx.lastIndexOf('</w:body>'),se=dx.lastIndexOf('<w:sectPr');if(se<bs||se>be)se=be;
 var body=dx.slice(bs,se),mk=LU('marker'),hit=false;
 body=body.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){if(hit)return p;var t=(p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(x){return x.replace(/<[^>]+>/g,'')}).join('');if(t.indexOf(mk)>=0){hit=true;return tb}return p});
 if(!hit)body=tb;dx=dx.slice(0,bs)+body+dx.slice(se);
 var ts=await tz.file('word/styles.xml').async('string'),ls=z.file('word/styles.xml')?await z.file('word/styles.xml').async('string'):null;
 if(ls){var need={};(tb.match(/w:(?:pStyle|tblStyle|rStyle) w:val="[^"]+"/g)||[]).forEach(function(m){need[m.replace(/.*w:val="([^"]+)"/,'$1')]=1});
  Object.keys(need).forEach(function(id){if(ls.indexOf('w:styleId="'+id+'"')>=0)return;var m=ts.match(new RegExp('<w:style [^>]*w:styleId="'+id+'"[\\s\\S]*?</w:style>'));if(m)ls=ls.replace('</w:styles>',m[0]+'</w:styles>')});
  var fn=LC().font;if(fn&&!/<w:rPrDefault>[\s\S]*?<w:rFonts/.test(ls)){var rf='<w:rFonts w:ascii="'+fn+'" w:hAnsi="'+fn+'" w:cs="'+fn+'" w:eastAsia="'+fn+'"/>';ls=/<w:rPrDefault>\s*<w:rPr>/.test(ls)?ls.replace(/<w:rPrDefault>\s*<w:rPr>/,function(m){return m+rf}):ls.replace('<w:docDefaults>','<w:docDefaults><w:rPrDefault><w:rPr>'+rf+'</w:rPr></w:rPrDefault>')}
  z.file('word/styles.xml',ls)}
 var vv=(S.lhv||{})[l.id]||{},ps=['word/document.xml'].concat(await lhParts(z));
 for(var i=0;i<ps.length;i++){var xml=i==0?dx:await z.file(ps[i]).async('string'),part=ps[i],ch=false;
  if(/\{\{|\[/.test(xml)){var d=new DOMParser().parseFromString(xml,'application/xml'),n=0;
   paras(d).forEach(function(p){if(i>0){var base=n,full=ptext(p),c=0;BR.lastIndex=0;while(BR.exec(full))c++;n+=c;if(c&&editPara(p,BR,function(m,j){var v=vv[part+':'+(base+j)];return v?v:null}))ch=true}
    if(editPara(p,/\{\{([^{}]+)\}\}/g,function(m){var k=m.slice(2,-2);if('{{'+k+'}}'==mk)return null;var v=fmt(k,raw(k,t.id));return v||null}))ch=true});
   if(ch)xml=new XMLSerializer().serializeToString(d)}
  z.file(part,xml)}
 return z}
/* --- подпись --- */
async function sigMeta(r){var bl=new Blob([r.data],{type:'image/png'});try{var im=await createImageBitmap(bl);r.w=im.width;r.h=im.height;im.close&&im.close()}catch(e){r.w=3;r.h=2}r.url=URL.createObjectURL(bl);return r}
function sigCur(){var id=S.sigSel;return SIG.find(function(s){return s.id==id})||SIG[0]||null}
function sigOn(t){return !!(S.sign||{})[t.id]&&!!sigCur()}
function drawSig(){return '<h4 class="dsh">'+E(LU('sig_title'))+'</h4><p class="sm">'+E(LU('sig_help'))+'</p><label class="fdrop dlhdrop"><input type="file" accept="image/png" multiple id="dsigup"><span>'+E(LU('sig_upload'))+'</span></label><p class="sm" id="dsigm"></p>'+
 '<div class="dsigs">'+SIG.map(function(s){return '<div class="lot dsigit'+(sigCur()===s?' on':'')+'"><button type="button" class="dsigpick" data-sigpick="'+E(s.id)+'" aria-pressed="'+(sigCur()===s)+'"><img src="'+s.url+'" alt=""><span class="sm">'+E(s.name)+'</span></button>'+(s.builtin?'':'<button type="button" class="lbtn sec" data-sigdel="'+E(s.id)+'">'+E(LU('sig_del'))+'</button>')+'</div>'}).join('')+'</div>'}
async function sigAdd(f){if(!/png$/i.test(f.type)&&!/\.png$/i.test(f.name))throw new Error(LU('sig_bad',{name:f.name}));var buf=await f.arrayBuffer(),r={id:ArbDB.uid('sg'),name:f.name.replace(/\.png$/i,''),data:buf,added:Date.now()};await ArbDB.put('signatures',{id:r.id,name:r.name,data:buf,added:r.added});SIG.push(await sigMeta(r))}
var SIGLINE=/_{5,}\s*\/\s*\{\{ФИО_УПРАВЛЯЮЩЕГО\}\}\s*\//;
async function sigApply(z,s){var G=GC(),hmm=G.height_mm||15,cy=Math.round(hmm*36000),cx=Math.round(cy*s.w/s.h),off=G.offset_mm||[4,-9];
 var dx=await z.file('word/document.xml').async('string'),ok=false,rid='rIdArbSig1';
 dx=dx.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){if(ok)return p;var t=(p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(x){return x.replace(/<[^>]+>/g,'')}).join('');if(!/_{5,}\s*\/[^\/]*\/\s*$/.test(t.trim()))return p;ok=true;
  var run='<w:r><w:drawing><wp:anchor xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="251659264" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="character"><wp:posOffset>'+Math.round(off[0]*36000)+'</wp:posOffset></wp:positionH><wp:positionV relativeFrom="line"><wp:posOffset>'+Math.round(off[1]*36000)+'</wp:posOffset></wp:positionV><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="9101" name="Подпись"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="9101" name="podpis.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>';
  var m=p.match(/^<w:p[^>]*>(<w:pPr>[\s\S]*?<\/w:pPr>)?/);return m[0]+run+p.slice(m[0].length)});
 if(!ok)return false;z.file('word/document.xml',dx);z.file('word/media/arb_podpis.png',s.data.slice(0));
 var rp='word/_rels/document.xml.rels',rl=await z.file(rp).async('string');if(rl.indexOf('Id="'+rid+'"')<0)rl=rl.replace('</Relationships>','<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/arb_podpis.png"/></Relationships>');z.file(rp,rl);
 var ct=await z.file('[Content_Types].xml').async('string');if(!/Extension="png"/i.test(ct))ct=ct.replace('<Default ','<Default Extension="png" ContentType="image/png"/><Default ');z.file('[Content_Types].xml',ct);return true}
/* ===== исходящие номера: счётчик по делу (без дела — общий), согласован с архивом ===== */
function outCfg(c){c=c===undefined?curCase():c;var o=c?(c.out=c.out||{}):(S.outNC=S.outNC||{});if(!o.next)o.next=1;if(!o.fmt)o.fmt=((C.batch||{}).out_formats||['{n}/{yy}'])[0];if(o.pfx==null)o.pfx='';return o}
function outFmt(n,o,date){var y=String((String(date||'').match(/(\d{4})/)||[0,new Date().getFullYear()])[1]).slice(-2);return String(o.fmt).replace('{n}',n).replace('{yy}',y).replace('{p}',o.pfx||'')}
function outNum(s){var m=String(s||'').match(/^\s*(\d+)/);return m?+m[1]:0}
function outSync(){if(!window.ArbArch)return;S.cases.concat([null]).forEach(function(c){var m=ArbArch.maxNo(c?c.id:'');if(m){var o=outCfg(c);if(o.next<=m)o.next=m+1}});save()}
function re(list,k){return (list||[]).some(function(p){return p.charAt(0)=='^'?new RegExp(p).test(k):p==k})}
function initFields(){var src=Object.assign({},X.fields||{},C.extra_fields||{});
 Object.keys(src).forEach(function(k){var f=Object.assign({},src[k]);f.k=k;if((C.labels||{})[k])f.label=C.labels[k];if((C.scope_override||{})[k])f.scope=C.scope_override[k];
  f.type=re(C.date_fields,k)?'date':re(C.time_fields,k)?'time':re(C.textarea_fields,k)?'textarea':re(C.inn_fields,k)?'inn':'text';f.opt=(C.options||{})[k];f.optional=(C.optional||[]).indexOf(k)>=0;f.hint=src[k].hint||'';F[k]=f});
 X.templates.forEach(function(t){t.fields.forEach(function(k){if(!F[k])F[k]={k:k,label:k.replace(/_/g,' ').toLowerCase().replace(/^./,function(c){return c.toUpperCase()}),scope:'document',type:'text'}})})}
function ofScope(sc,order){var a=(order||[]).filter(function(k){return F[k]&&F[k].scope==sc});Object.keys(F).forEach(function(k){if(F[k].scope==sc&&a.indexOf(k)<0)a.push(k)});return a}
function curCase(){return S.cases.find(function(c){return c.id==S.cur})||null}
function caseName(c){var d=c.data||{};return [d.ДОЛЖНИК_НАИМЕНОВАНИЕ,d.НОМЕР_ДЕЛА].filter(Boolean).join(' · ')||U('case_unnamed')}
function raw(k,tid){var f=F[k]||{},d=(S.drafts[tid]||{}),c=curCase(),v;
 if(OV){if(OV.v[k]!=null&&OV.v[k]!=='')return OV.v[k];if(!f.scope||f.scope=='document')return ''}
 else if(d[k]!=null&&d[k]!=='')return d[k];
 if(f.scope=='profile')v=prof(k);else if(f.scope=='case'&&c)v=c.data[k];
 if((v==null||v==='')&&k=='ВИД_УПРАВЛЯЮЩЕГО'){var p=raw('ПРОЦЕДУРА',tid);v=(C.procedure_manager||{})[p]||''}
 return v==null?'':v}
function fmt(k,v){if(!v)return '';var f=F[k]||{};if(f.type=='date'&&/^\d{4}-\d\d-\d\d$/.test(v)){var a=v.split('-');return a[2]+'.'+a[1]+'.'+a[0]}return String(v)}
function setVal(k,v,tid){var f=F[k]||{},c=curCase();
 if(f.scope=='profile'){S.profile[k]=v;if(tid&&S.drafts[tid])delete S.drafts[tid][k]}
 else if(f.scope=='case'&&c){c.data[k]=v;if(tid&&S.drafts[tid])delete S.drafts[tid][k]}
 else if(tid){(S.drafts[tid]=S.drafts[tid]||{})[k]=v}save()}
function cpOpts(k){var r=((C.counterparties||{}).doc_fields||{})[k];if(!r||!window.ArbCP)return null;var c=curCase(),o=ArbCP.pick(r,c&&c.id).map(function(x){return x.name});return o.length?o:null}
function inp(f,v,pre){var id=pre+'_'+f.k,a=' data-k="'+E(f.k)+'" id="'+E(id)+'"',dl='',co=cpOpts(f.k);
 if(f.k=='ИСХ_НОМЕР'&&pre=='df'){var o=outCfg();a+=' placeholder="'+E(U('out_auto',{no:outFmt(o.next,o,'')}))+'"'}
 if(co&&!f.opt){dl='<datalist id="'+E(id)+'_l">'+co.map(function(o){return '<option value="'+E(o)+'">'}).join('')+'</datalist>';a+=' list="'+E(id)+'_l"'}
 if(f.opt){dl='<datalist id="'+E(id)+'_l">'+f.opt.map(function(o){return '<option value="'+E(o)+'">'}).join('')+'</datalist>';a+=' list="'+E(id)+'_l"'}
 if(f.type=='textarea')return '<textarea'+a+' rows="3">'+E(v)+'</textarea>';
 return '<input'+a+(f.type=='date'?' type="date"':f.type=='time'?' type="time"':'')+(f.type=='inn'?' inputmode="numeric"':'')+(f.type=='text'&&/EMAIL/.test(f.k)?' type="email"':'')+(/ТЕЛ_/.test(f.k)?' type="tel"':'')+' value="'+E(v)+'" autocomplete="off">'+dl}
function grid(keys,get,pre){return '<div class="g2">'+keys.map(function(k){var f=F[k];return '<div data-w="'+E(k)+'"'+(f.type=='textarea'?' class="dwide"':'')+'><label for="'+E(pre+'_'+k)+'">'+E(f.label)+(f.optional?' <span class="sm">(необязательно)</span>':'')+'</label>'+inp(f,get(k),pre)+(f.hint?'<div class="sm dhint">'+E(f.hint)+'</div>':'')+'</div>'}).join('')+'</div>'}
function shell(){var v=document.createElement('div');v.id='vdocs';v.style.display='none';
 v.innerHTML='<div class="md prc fin dwrap"><h2 id="dtl"></h2><p class="sm" id="dintro"></p>'+
 '<details class="pfold" id="dprof"><summary>'+E(U('profile'))+'</summary><div id="dprofb"></div></details>'+
 '<details class="pfold" id="dcases"><summary>'+E(U('cases'))+'</summary><div id="dcasesb"></div></details>'+
 (window.ArbArch?'<details class="pfold" id="darch"><summary>'+E((C.archive||{}).title||'')+'</summary><div id="darchb"></div></details>':'')+
 (window.ArbCP?'<details class="pfold" id="dcp"><summary>'+E((C.counterparties||{}).title||'')+'</summary><div id="dcpb"></div></details>':'')+
 '<p class="sm dpriv"><span id="dpriv"></span> <button type="button" class="lbtn sec" id="dclear"></button> <span class="sm" id="dclm"></span></p>'+
 '<div id="dlist"></div><div id="ded" style="display:none"></div></div><div id="dbbar" class="dbbar" style="display:none"></div><div id="dtoast" class="dtoast" style="display:none" role="status"></div>';
 var a=$('veval')||$('vsrc');if(a&&a.parentNode)a.parentNode.insertBefore(v,a.nextSibling);else document.body.appendChild(v)}
function caseSel(id){return '<select id="'+id+'">'+'<option value="">'+E(U('case_none'))+'</option>'+S.cases.map(function(c){return '<option value="'+E(c.id)+'"'+(c.id==S.cur?' selected':'')+'>'+E(caseName(c))+'</option>'}).join('')+'</select>'}
function drawProfile(){var b=$('dprofb');if(!b)return;var st=AU.state=='ok'?LU('vault_ok'):AU.state=='loading'?LU('vault_loading'):'';b.innerHTML=(st?'<p class="sm">'+E(st)+'</p>':'')+grid(ofScope('profile',C.profile_order),function(k){return prof(k)},'dp')+drawLH()+drawSig()}
function CU(k){return ((C.counterparties||{}).ui||{})[k]||k}
function cpDeb(c){if(!window.ArbCP||!c)return '';var L=ArbCP.pick(null,c.id);if(!L.length)return '';return '<div class="dcrow"><label for="dcdeb">'+E(CU('debtor_pick'))+'</label><select id="dcdeb"><option value="">'+E(CU('debtor_none'))+'</option>'+L.map(function(x){return '<option value="'+E(x.id)+'">'+E(x.name+(x.inn?' · ИНН '+x.inn:''))+'</option>'}).join('')+'</select></div>'}
function drawCases(){var c=curCase();$('dcasesb').innerHTML='<div class="dcrow">'+caseSel('dcsel')+' <button type="button" class="lbtn sec" id="dcnew">'+E(U('case_new'))+'</button>'+(c?' <button type="button" class="lbtn sec" id="dcdel">'+E(U('case_del'))+'</button>':'')+'</div>'+
 (window.ArbCP?'<div class="dcrow"><label class="lbtn sec dfile">'+E(CU('cases_import'))+'<input type="file" id="dcaseup" accept=".csv,.xlsx,.json" hidden></label>'+(S.cases.length?' <button type="button" class="lbtn sec" id="dcexp">'+E(CU('cases_export'))+'</button>':'')+'</div>':'')+cpDeb(c)+
 (c?grid(ofScope('case',C.case_order),function(k){return c.data[k]||''},'dc')+'<p class="sm">'+E(U('procedure_hint'))+'</p>':'');if(window.ArbArch&&ArbArch.draw)ArbArch.draw()}
function groups(){return X.groups||[]}
function GL(g){return (C.group_labels||{})[g]||g}
function BU(k,o){var x=((C.batch||{}).ui||{})[k]||k;if(o)Object.keys(o).forEach(function(n){x=x.split('{'+n+'}').join(o[n])});return x}
function pl(n,a,b,c){var m=Math.abs(n)%100,d=m%10;return m>10&&m<20?c:d>1&&d<5?b:d==1?a:c}
function visT(){var q=Q.trim().toLowerCase();return X.templates.filter(function(t){return (!FLT||t.group==FLT)&&(!q||(t.title+' '+t.norm+' '+t.kind+' '+t.deadline+' '+(TXT[t.id]||'').replace(/\{\{[^{}]+\}\}/g,' ')).toLowerCase().indexOf(q)>=0)})}
function multiOf(t){var m=(C.batch||{}).multi||{};return t.fields.find(function(k){return m[k]})}
function drawList(){var g=groups(),q=Q.trim().toLowerCase(),vis=visT(),bat=!!window.ArbBatch,n=0,h='<div class="pflt dflt"><input type="search" id="dq" placeholder="'+E(U('search'))+'" value="'+E(Q)+'"></div><div class="dchips" id="dchips"><button type="button" class="pchip'+(FLT?'':' on')+'" data-g="">'+E(U('all'))+'</button>'+g.map(function(x){return '<button type="button" class="pchip'+(FLT==x?' on':'')+'" data-g="'+E(x)+'">'+E(GL(x))+'</button>'}).join('')+'</div>';
 if(bat){var P=(C.batch||{}).presets||[];if(P.length)h+='<div class="sm dlbl">'+E(BU('presets'))+'</div><div class="dpres">'+P.map(function(p,i){var on=p.ids.length&&p.ids.every(function(id){return BSEL.has(id)});return '<button type="button" class="pchip dpre'+(on?' on':'')+'" data-pre="'+i+'" aria-pressed="'+on+'">'+E(p.name)+' <b>'+p.ids.length+'</b></button>'}).join('')+'</div>';
  var all=vis.length&&vis.every(function(t){return BSEL.has(t.id)});
  h+='<div class="adh dadh"><span class="adt">'+E(vis.length+' '+pl(vis.length,'шаблон','шаблона','шаблонов'))+'</span><button type="button" class="adall" data-bsel="1">'+E(all?BU('unselect_all'):BU('select_all'))+'</button><button type="button" class="lbtn dmk'+(BSEL.size?'':' off')+'" data-bgo="1"'+(BSEL.size?'':' aria-disabled="true"')+'>'+E(BSEL.size?BU('make_n',{n:BSEL.size}):BU('make'))+'</button></div>'}
 g.forEach(function(gr){if(FLT&&FLT!=gr)return;var ts=vis.filter(function(t){return t.group==gr});if(!ts.length)return;n+=ts.length;var gon=ts.every(function(t){return BSEL.has(t.id)});
  h+='<h3 class="dgh"><span class="dght">'+E(GL(gr))+' <span class="sm">'+ts.length+'</span></span>'+(bat?'<button type="button" class="adall" data-bgrp="'+E(gr)+'">'+E(gon?BU('grp_none'):BU('grp_all'))+'</button>':'')+'</h3>'+ts.map(function(t){var on=BSEL.has(t.id),m=multiOf(t);return '<div class="lot dit'+(bat?' dbat':'')+(on?' dsel':'')+'" data-t="'+E(t.id)+'" role="button" tabindex="0">'+(bat?'<span class="adcb'+(on?' on':'')+'" role="checkbox" aria-checked="'+on+'" aria-label="Отметить" tabindex="0" data-bt="'+E(t.id)+'"></span>':'')+'<div class="dbd"><div class="d1">'+E(t.title)+'</div><div class="sm"><b>'+E(U('norm'))+':</b> '+E(t.norm)+'</div>'+(t.deadline?'<div class="sm"><b>'+E(U('deadline'))+':</b> '+E(t.deadline)+'</div>':'')+'<div class="sm"><span class="dkind">'+E(t.kind)+'</span>'+(bat&&m&&m!='РЕГИОН'?' · '+E(BU('by_addr')):'')+'</div></div></div>'}).join('')});
 h+=n?'':'<div class="empty">'+E(U('empty'))+'</div>';
 var L=$('dlist');var foc=document.activeElement&&document.activeElement.id=='dq',pos=foc?document.activeElement.selectionStart:0;L.innerHTML=h;if(foc){var i=$('dq');i.focus();try{i.setSelectionRange(pos,pos)}catch(e){}}listBar()}
function bar(h){var b=$('dbbar');if(!b)return;b.innerHTML=h||'';b.style.display=h?'':'none';$('vdocs').classList.toggle('dbaron',!!h)}
function listBar(){if(!window.ArbBatch||CUR||$('dlist').style.display=='none')return;var n=BSEL.size;
 bar('<div class="dbi"><b>'+E(BU('picked',{n:n}))+'</b>'+(n?'':'<span class="sm">'+E(BU('pick_hint'))+'</span>')+'</div>'+(n?'<button type="button" class="lbtn sec dbx" data-bclr="1" title="'+E(BU('clear'))+'" aria-label="'+E(BU('clear'))+'">✕</button>':'')+'<button type="button" class="lbtn dbgo'+(n?'':' off')+'" data-bgo="1"'+(n?'':' aria-disabled="true"')+'>'+E(n?BU('make_n',{n:n}):BU('make'))+'</button>')}
function toast(t){var x=$('dtoast');if(!x)return;x.textContent=t;x.style.display='';clearTimeout(toast.t);toast.t=setTimeout(function(){x.style.display='none'},2200)}
function showList(){CUR=null;$('vdocs').classList.remove('editing');$('ded').style.display='none';$('ded').innerHTML='';$('dlist').style.display='';drawList()}
var TXT={},PF=0;
function prefetch(){if(PF)return;PF=1;Promise.all(X.templates.map(function(t){return md(t).catch(function(){})})).then(function(){if(Q)drawList()})}
async function md(t){if(TXT[t.id]==null){var r=await fetch('docs/'+t.md+'?v='+(window.ARB_DOCS_VH||''));if(!r.ok)throw new Error('шаблон не загрузился ('+r.status+')');TXT[t.id]=await r.text()}return TXT[t.id]}
function RF(t){return t.repeat_row_fields||[]}
function rows(t){var d=S.drafts[t.id]=S.drafts[t.id]||{};if(!Array.isArray(d._rows))d._rows=[{}];return d._rows}
function rowsFilled(t){return rows(t).filter(function(r){return RF(t).some(function(k){return r[k]})})}
function missing(t){var rf=RF(t),m=t.fields.filter(function(k){return rf.indexOf(k)<0&&k!='ИСХ_НОМЕР'&&!raw(k,t.id)&&!(F[k]&&F[k].optional)});if(rf.length&&!rowsFilled(t).length)m.push('_rows');return m}
function mlabel(k){return k=='_rows'?U('rows_missing'):(F[k]||{}).label||k}
function rowsHtml(t){var rf=RF(t);if(!rf.length)return '';return '<h4 class="dsh">'+E(U('rows_title'))+'</h4><div id="drows">'+rows(t).map(function(r,i){return '<div class="lot drow"><div class="d1">'+E(U('row_n',{n:i+1}))+'</div><div class="g2">'+rf.map(function(k){var f=F[k]||{k:k,label:k,type:'text'};return '<div'+(f.type=='textarea'?' class="dwide"':'')+'><label for="dr_'+i+'_'+E(k)+'">'+E(f.label)+'</label>'+inp(f,r[k]||'','dr_'+i).replace('data-k=','data-row="'+i+'" data-rk=')+'</div>'}).join('')+'</div>'+(rows(t).length>1?'<p><button type="button" class="lbtn sec" data-rowdel="'+i+'">'+E(U('row_del'))+'</button></p>':'')+'</div>'}).join('')+'</div><p><button type="button" class="lbtn sec" id="drowadd">'+E(U('row_add'))+'</button></p>'}
function rowLine(l,t){var rf=RF(t);if(!rf.length||!rf.some(function(k){return l.indexOf('{{'+k+'}}')>=0}))return null;var rs=rowsFilled(t);if(!rs.length)return null;
 return rs.map(function(r,i){return l.replace(/^(\|\s*)\d+(\s*\|)/,'$1'+(i+1)+'$2').replace(/\{\{([^{}]+)\}\}/g,function(m,k){return rf.indexOf(k)>=0?fmt(k,r[k]||''):m})}).join('\n')}
function expandRowsText(s,t){return s.split('\n').map(function(l){var x=rowLine(l,t);return x==null?l:x}).join('\n')}
function expandRowsXml(x,t){var rf=RF(t);if(!rf.length)return x;var rs=rowsFilled(t);if(!rs.length)return x;
 var trs=x.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g)||[],ti=trs.findIndex(function(r){return rf.some(function(k){return r.indexOf('{{'+k+'}}')>=0})});if(ti<0)return x;
 var tpl=trs[ti],out=rs.map(function(r,i){var c=tpl.replace(/(<w:tc>[\s\S]*?<w:t(?:\s[^>]*)?>)\s*1\s*(<\/w:t>)/,'$1'+(i+1)+'$2');return c.replace(/\{\{([^{}]+)\}\}/g,function(m,k){return rf.indexOf(k)>=0?xe(fmt(k,r[k]||'')):m})}).join('');
 var rest=trs.slice(ti+1),cut=0;for(var j=0;j<rest.length;j++){var tx=rest[j].replace(/<[^>]+>/g,'').trim();if(/^\d*$/.test(tx))cut=j+1;else break}
 var a=x.indexOf(tpl),b=cut?x.indexOf(rest[cut-1],a)+rest[cut-1].length:a+tpl.length;return x.slice(0,a)+out+x.slice(b)}
function fill(s,t,mode){return s.replace(/\{\{([^{}]+)\}\}/g,function(m,k){var v=fmt(k,raw(k,t.id));if(v)return mode=='html'?E(v):v;if(F[k]&&F[k].optional)return '';var l='['+((F[k]||{}).label||k)+']';return mode=='html'?'<mark>'+E(l)+'</mark>':l})}
function plain(s){return s.split('\n').map(function(l){return l.replace(/^#+\s+/,'')}).join('\n')}
function sigFor(t){if(!SIG.length)return null;var m=S.sigSel||'rotate';if(m!='rotate'){var x=SIG.find(function(g){return g.id==m});if(x)return x}return SIG[(S.sigN||0)%SIG.length]}
function sigCtl(t){if(!SIG.length)return '<p class="sm">'+E(LU('sig_none'))+'</p>';var on=!!(S.sign||{})[t.id],m=S.sigSel||'rotate';
 return '<div class="dsigctl"><label class="dchk"><input type="checkbox" id="dfsign"'+(on?' checked':'')+'> '+E(LU('sign'))+'</label>'+(on?'<select id="dfsigsel" aria-label="'+E(LU('sig_pick'))+'"><option value="rotate"'+(m=='rotate'?' selected':'')+'>'+E(LU('sig_rotate'))+'</option>'+SIG.map(function(g){return '<option value="'+E(g.id)+'"'+(m==g.id?' selected':'')+'>'+E(g.name)+'</option>'}).join('')+'</select>':'')+'</div>'}
function htmlPrev(s,t){var sg=(S.sign||{})[t.id]&&sigFor(t);return s.split('\n').map(function(l){var hd=/^#+\s+/.test(l),sl=sg&&SIGLINE.test(l);l=l.replace(/^#+\s+/,'');var x=fill(l,t,'html');if(sl)x='<span class="dsigw"><img class="dsig" src="'+sg.url+'" alt=""></span>'+x;return hd?'<div class="dhd">'+x+'</div>':'<div>'+(x||'&nbsp;')+'</div>'}).join('')}
async function openT(id,keep){var t=X.templates.find(function(x){return x.id==id});if(!t)return;CUR=t;$('dlist').style.display='none';bar('');$('vdocs').classList.add('editing');var ed=$('ded');ed.style.display='';ed.innerHTML='<p class="sm">…</p>';
 try{await md(t)}catch(e){ed.innerHTML='<p class="sm ewarn">'+E(e.message)+'</p><button type="button" class="lbtn sec" data-back>'+E(U('back'))+'</button>';return}
 var by={profile:[],case:[],document:[]};t.fields.forEach(function(k){if(RF(t).indexOf(k)>=0)return;(by[(F[k]||{}).scope]||by.document).push(k)});
 var ord=function(a,o){return a.sort(function(x,y){var i=(o||[]).indexOf(x),j=(o||[]).indexOf(y);return (i<0?999:i)-(j<0?999:j)})};ord(by.profile,C.profile_order);ord(by.case,C.case_order);
 var st=C.scope_titles||{},sec=function(sc){return by[sc].length?'<h4 class="dsh">'+E(st[sc]||sc)+'</h4>'+grid(by[sc],function(k){return raw(k,t.id)},'df'):''};
 ed.innerHTML='<button type="button" class="lbtn sec" data-back>'+E(U('back'))+'</button><h3 class="dth">'+E(t.title)+'</h3><div class="sm"><b>'+E(U('norm'))+':</b> '+E(t.norm)+'</div>'+(t.deadline?'<div class="sm"><b>'+E(U('deadline'))+':</b> '+E(t.deadline)+'</div>':'')+
  '<div class="dcrow"><label for="dfcase">'+E(U('case_pick'))+'</label>'+caseSel('dfcase')+'</div><p class="sm">'+E(U('save_to_profile'))+'</p>'+lhSel(t)+sigCtl(t)+
  '<form id="dform" autocomplete="off" onsubmit="return false">'+sec('profile')+sec('case')+sec('document')+rowsHtml(t)+'</form>'+
  '<div class="dact"><button type="button" class="lbtn" id="ddocx">'+E(U('dl_docx'))+'</button><button type="button" class="lbtn sec" id="dtxt">'+E(U('dl_txt'))+'</button><button type="button" class="lbtn sec" id="dcopy">'+E(U('copy'))+'</button></div><p class="sm" id="dmiss"></p>'+
  '<h4 class="dsh">'+E(U('preview'))+'</h4><div class="dprev" id="dprev"></div>';
 prev();if(!keep)window.scrollTo(0,$('vdocs').offsetTop-60)}
function prev(){if(!CUR||!$('dprev'))return;$('dprev').innerHTML=htmlPrev(expandRowsText(TXT[CUR.id],CUR),CUR);$('dprev').classList.toggle('dlhf',!!lhFor(CUR));var m=missing(CUR),el=$('dmiss');if(el&&!el.dataset.warn){el.textContent=m.length?'':U('all_filled');el.className='sm'}
 if(el&&el.dataset.warn&&!m.length){el.dataset.warn='';el.textContent=U('all_filled');el.className='sm'}
 document.querySelectorAll('#dform [data-k]').forEach(function(i){var w=i.closest('[data-w]');if(w)w.classList.toggle('dempty',!i.value&&!(F[i.dataset.k]&&F[i.dataset.k].optional))})}
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
async function docx(t){if(!DXC[t.id]){var r=await fetch('docs/'+t.docx+'?v='+(window.ARB_DOCS_VH||''));if(!r.ok)throw new Error('шаблон Word не загрузился ('+r.status+')');DXC[t.id]=await r.arrayBuffer()}var z=await JSZip.loadAsync(DXC[t.id].slice(0));
 var names=Object.keys(z.files).filter(function(n){return /^word\/(document|header\d*|footer\d*)\.xml$/.test(n)});
 for(var i=0;i<names.length;i++){var xx=await z.file(names[i]).async('string');if(names[i]=='word/document.xml')xx=expandRowsXml(xx,t);z.file(names[i],runXml(xx,t))}
 var l=lhFor(t);if(l)z=await lhMerge(z,l,t);
 if(OV?OV.sign:(S.sign||{})[t.id]){var g=sigFor(t);if(g){if(!(await sigApply(z,g)))throw new Error(LU('sig_noline'));if((S.sigSel||'rotate')=='rotate'){S.sigN=((S.sigN||0)+1)%SIG.length;save()}}}
 return z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
async function single(t){var auto=t.fields.indexOf('ИСХ_НОМЕР')>=0&&!raw('ИСХ_НОМЕР',t.id),c=curCase(),o=outCfg(),no=raw('ИСХ_НОМЕР',t.id),d=S.drafts[t.id]=S.drafts[t.id]||{};
 if(auto){no=outFmt(o.next,o,fmt('ДАТА',raw('ДАТА',t.id)));d.ИСХ_НОМЕР=no}
 var lh=lhFor(t),sg=(S.sign||{})[t.id]&&!!sigFor(t),blob;try{blob=await docx(t)}finally{if(auto)delete d.ИСХ_НОМЕР}
 var n=outNum(no);if(no&&n&&n>=o.next)o.next=n+1;save();var fn=fname(t,'docx');saveBlob(blob,fn);
 if(window.ArbArch)try{await ArbArch.add({case:c?c.id:'',kind:'out',no:no||'',title:t.title,tid:t.id,addressee:addrOf(t,null),blank:!!lh,signed:sg,fname:fn,auto:auto},blob)}catch(x){}
 if(auto)openT(t.id,1)}
function addrOf(t,v){var m=((C.batch||{}).multi)||{},k=t.fields.find(function(x){return m[x]});return k?(v&&v[k]!=null?v[k]:raw(k,t.id)):''}
function bind(){var v=$('vdocs');
 v.addEventListener('input',function(e){var i=e.target;if(i.closest('.dbatch'))return;if(i.id=='dq'){Q=i.value;drawList();return}if(i.dataset&&i.dataset.rk&&CUR){rows(CUR)[+i.dataset.row][i.dataset.rk]=i.value;save();prev();return}if(i.dataset&&i.dataset.lhf){S.lhv=S.lhv||{};(S.lhv[i.dataset.lhf]=S.lhv[i.dataset.lhf]||{})[i.dataset.fk]=i.value;save();return}var k=i.dataset&&i.dataset.k;if(!k)return;
  var pre=i.id.split('_')[0];if(pre=='dp'){S.profile[k]=i.value;save()}else if(pre=='dc'){var c=curCase();if(c){c.data[k]=i.value;save()}}else if(pre=='df'&&CUR){setVal(k,i.value,CUR.id);if(k=='ПРОЦЕДУРА'){var w=$('df_ВИД_УПРАВЛЯЮЩЕГО');if(w&&!w.value)w.placeholder=raw('ВИД_УПРАВЛЯЮЩЕГО',CUR.id)}prev()}});
 v.addEventListener('change',async function(e){var i=e.target;if(i.closest('.dbatch'))return;
  if(i.id=='dcaseup'&&window.ArbCP){var fs=[].slice.call(i.files);i.value='';$('dcp').open=true;await ArbCP.importCases(fs);return}
  if(i.id=='dcdeb'&&window.ArbCP&&i.value){var cc=curCase(),cp=await ArbCP.linkDebtor(i.value,cc&&cc.id);if(cc&&cp){var M=(C.counterparties||{}).debtor_map||{};Object.keys(M).forEach(function(k){if(cp[M[k]])cc.data[k]=cp[M[k]]});save();drawCases();if(CUR)openT(CUR.id,1)}return}
  if(i.id=='dflh'&&CUR){S.lh=S.lh||{};S.lh[CUR.id]=i.value;save();prev();return}
  if(i.id=='dfsign'&&CUR){S.sign=S.sign||{};S.sign[CUR.id]=i.checked;save();openT(CUR.id,1);return}
  if(i.id=='dfsigsel'){S.sigSel=i.value;save();prev();return}
  if(i.dataset&&i.dataset.lht){S.lht=S.lht||{};S.lht[i.dataset.lht]=i.value;save();return}
  if(i.id=='dlhup'||i.id=='dsigup'){var m=$(i.id=='dlhup'?'dlhm':'dsigm'),fs=[].slice.call(i.files);try{for(var q=0;q<fs.length;q++)await (i.id=='dlhup'?lhAdd(fs[q]):sigAdd(fs[q]));drawProfile();$('dprof').open=true;var mm=$(i.id=='dlhup'?'dlhm':'dsigm');if(mm)mm.textContent=LU(i.id=='dlhup'?'added':'sig_added')}catch(x){m.textContent=x.message}return}if(i.id=='dcsel'||i.id=='dfcase'){S.cur=i.value||null;save();drawCases();if(CUR)openT(CUR.id)}else if(i.dataset&&i.dataset.k&&i.id.indexOf('dc_')==0){var o=$('dcsel').selectedOptions[0],c=curCase();if(o&&c)o.textContent=caseName(c)}});
 v.addEventListener('click',async function(e){var cb=e.target.closest('[data-bt]');if(cb){e.preventDefault();e.stopPropagation();var id=cb.dataset.bt;BSEL.has(id)?BSEL.delete(id):BSEL.add(id);drawList();return}
  var b=e.target.closest('button,[data-t]');if(!b)return;
  if(b.dataset.pre!=null){var P=((C.batch||{}).presets||[])[+b.dataset.pre],on=P.ids.every(function(id){return BSEL.has(id)});P.ids.forEach(function(id){on?BSEL.delete(id):BSEL.add(id)});drawList();return}
  if(b.dataset.bsel){var vs=visT(),al=vs.every(function(t){return BSEL.has(t.id)});vs.forEach(function(t){al?BSEL.delete(t.id):BSEL.add(t.id)});drawList();return}
  if(b.dataset.bgrp){var gs=visT().filter(function(t){return t.group==b.dataset.bgrp}),ga=gs.every(function(t){return BSEL.has(t.id)});gs.forEach(function(t){ga?BSEL.delete(t.id):BSEL.add(t.id)});drawList();return}
  if(b.dataset.bclr){BSEL.clear();drawList();return}
  if(b.dataset.bgo){if(!BSEL.size){toast(BU('need_pick'));return}$('dlist').style.display='none';$('vdocs').classList.add('editing');$('ded').style.display='';ArbBatch.open(X.templates.filter(function(t){return BSEL.has(t.id)}).map(function(t){return t.id}));window.scrollTo(0,$('vdocs').offsetTop-60);return}
  if(b.closest('#ded .dbatch'))return;
  if(b.dataset.g!=null&&b.classList.contains('pchip')){FLT=b.dataset.g;drawList();return}
  if(b.dataset.t){openT(b.dataset.t);return}
  if(b.hasAttribute('data-back')){showList();return}
  if(b.id=='dcexp'&&window.ArbCP){ArbCP.exportCases();return}
  if(b.id=='dcnew'){var c={id:'c'+Date.now().toString(36),data:{}};S.cases.push(c);S.cur=c.id;save();drawCases();$('dcases').open=true;return}
  if(b.id=='dcdel'){var cc=curCase();if(cc&&confirm(U('case_del_confirm',{name:caseName(cc)}))){S.cases=S.cases.filter(function(x){return x!==cc});S.cur=null;save();drawCases()}return}
  if(b.id=='drowadd'&&CUR){rows(CUR).push({});save();openT(CUR.id,1);return}
  if(b.dataset.rowdel!=null&&CUR){rows(CUR).splice(+b.dataset.rowdel,1);save();openT(CUR.id,1);return}
  if(b.dataset.lhdel){var l=LH.find(function(x){return x.id==b.dataset.lhdel});if(l&&confirm(LU('del_confirm',{name:l.name}))){await ArbDB.del('letterheads',l.id);LH=LH.filter(function(x){return x!==l});drawProfile()}return}
  if(b.dataset.sigdel){var g=SIG.find(function(x){return x.id==b.dataset.sigdel});if(g&&confirm(LU('sig_del_confirm',{name:g.name}))){await ArbDB.del('signatures',g.id);SIG=SIG.filter(function(x){return x!==g});drawProfile()}return}
  if(b.dataset.sigpick){S.sigSel=b.dataset.sigpick;save();drawProfile();return}
  if(b.id=='dclear'){if(confirm(U('clear_confirm'))){localStorage.removeItem(LS);S=load();try{await ArbDB.wipe()}catch(x){}LH=LH.filter(function(x){return x.builtin});SIG=SIG.filter(function(x){return x.builtin});if(window.ArbCP&&ArbCP.reset)ArbCP.reset();if(window.ArbArch)ArbArch.reset();BSEL.clear();drawList();drawProfile();drawCases();if(CUR)openT(CUR.id);$('dclm').textContent=U('cleared')}return}
  if(!CUR)return;
  try{if(b.id=='ddocx'){if(!gate(b))return;await single(CUR)}
   else if(b.id=='dtxt'){if(!gate(b))return;saveBlob(new Blob([plain(fill(expandRowsText(TXT[CUR.id],CUR),CUR,'text'))],{type:'text/plain;charset=utf-8'}),fname(CUR,'txt'))}
   else if(b.id=='dcopy'){var s=plain(fill(expandRowsText(TXT[CUR.id],CUR),CUR,'text'));try{await navigator.clipboard.writeText(s)}catch(x){var ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}$('dmiss').dataset.warn='';$('dmiss').className='sm';$('dmiss').textContent=U('copied')}}
  catch(x){$('dmiss').className='sm ewarn';$('dmiss').textContent='Не удалось: '+x.message}});
 v.addEventListener('keydown',function(e){var cb=e.target.closest&&e.target.closest('[data-bt]');if(cb&&(e.key=='Enter'||e.key==' ')){e.preventDefault();cb.click();return}var t=e.target.closest&&e.target.closest('[data-t]');if(e.target.closest&&e.target.closest('.dbatch'))return;if(t&&(e.key=='Enter'||e.key==' ')){e.preventDefault();openT(t.dataset.t)}})}
function nav(force){var ex=document.querySelector('nav button[data-v="docs"]');if(ex)return true;var after=document.querySelector('nav button[data-v="eval"]')||(force&&document.querySelector('nav button[data-v="fin"]'));if(!after)return false;
 var nb=document.createElement('button');nb.dataset.v='docs';nb.textContent=C.title;after.after(' ',nb);
 nb.onclick=function(){document.querySelectorAll('nav button[data-v]').forEach(function(x){x.classList.toggle('on',x===nb)});['vreg','vman','vmet','vsrc','vrep','vprc','vfin','veval','vprop','vperr','vfav'].forEach(function(i){var e=$(i);if(e)e.style.display='none'});$('vdocs').style.display='';prefetch()};
 document.querySelector('nav').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(b&&b.dataset.v!='docs'){var d=$('vdocs');if(d)d.style.display='none'}});return true}
function init(){C=window.ARB_DOCS_CFG;X=window.ARB_DOCS;if(!C||!X)return;S=load();initFields();shell();
 $('dtl').textContent=C.title;$('dintro').textContent=C.intro||'';$('dpriv').textContent=C.privacy||'';$('dclear').textContent=U('clear');
 drawProfile();drawCases();drawList();bind();lhLoadLocal();
 var API={X:X,C:C,F:F,S:function(){return S},save:save,raw:raw,fmt:fmt,missing:missing,mlabel:mlabel,docx:docx,md:md,TXT:TXT,rows:rows,RF:RF,rowsFilled:rowsFilled,lhFor:lhFor,sigFor:sigFor,SIG:function(){return SIG},LH:function(){return LH},curCase:curCase,caseName:caseName,saveBlob:saveBlob,setVal:setVal,inp:inp,E:E,U:U,BU:BU,pl:pl,outCfg:outCfg,outFmt:outFmt,outNum:outNum,setOV:function(o){OV=o},htmlPrev:htmlPrev,expandRowsText:expandRowsText,drawCases:drawCases,bar:bar,toast:toast,showList:showList,sel:BSEL,multiOf:multiOf,prof:prof,ofScope:ofScope,addrOf:addrOf,setCur:function(id){S.cur=id||null;save();drawCases()}};
 if(window.ArbBatch)ArbBatch.mount($('ded'),API);if(window.ArbArch&&$('darchb'))ArbArch.mount($('darchb'),API);
 if(window.ArbCP&&$('dcpb'))ArbCP.mount($('dcpb'),{S:function(){return S},C:function(){return C},F:function(){return F},save:save,caseName:caseName,drawCases:drawCases,refresh:function(){drawCases();if(CUR)openT(CUR.id,1)}});var n=0,iv=setInterval(function(){n++;if(nav(n>40))clearInterval(iv)},250)}
window.__docsTest={fill:function(id){var t=X.templates.find(function(x){return x.id==id});return md(t).then(function(s){return plain(fill(s,t,'text'))})},docx:function(id){return docx(X.templates.find(function(x){return x.id==id}))},missing:function(id){return missing(X.templates.find(function(x){return x.id==id}))}};
if(document.readyState=='loading')addEventListener('DOMContentLoaded',init);else init();
})();
