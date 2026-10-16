/* Arbitr · PDF в браузере (без сервера, ПДн не покидают устройство).
   ArbPDF.fromDocx(blob) → {blob, pages, warn:[…], ok}. Рендерит итоговый docx (тот же, что скачивается):
   стили/docDefaults, абзацы (выравнивание, отступы, интервалы, табуляции, рамки), таблицы (сетка, объединения, рамки, заливка),
   колонтитулы бланка с логотипом, поля PAGE/NUMPAGES, картинки inline/anchor (факсимиле), книжная/альбомная ориентация.
   Шрифты: ArbSerif (Liberation Serif — метрики Times New Roman) и ArbSans (PT Sans), встроены в PDF. */
(function(){
'use strict';
var VH=function(){return window.ARB_DOCS_VH||''};
var CF=function(){return ((window.ARB_DOCS_CFG||{}).pdf)||{}};
var LIB=null,FB64={};
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('PDF: не загрузился модуль'))};document.head.appendChild(s)})}
function b64(buf){var u=new Uint8Array(buf),s='',CH=0x8000;for(var i=0;i<u.length;i+=CH)s+=String.fromCharCode.apply(null,u.subarray(i,i+CH));return btoa(s)}
async function deps(){if(LIB)return LIB;LIB=(async function(){
  if(!window.jspdf)await loadScript('vendor/jspdf.umd.min.js?v='+VH());
  if(!window.ARB_PDF_FONTS)await loadScript('docs/fonts/pdf_fonts.js?v='+VH());
  var F=window.ARB_PDF_FONTS.files,jobs=[];
  Object.keys(F).forEach(function(fam){Object.keys(F[fam]).forEach(function(st){var fn=F[fam][st];if(FB64[fn])return;
    jobs.push(fetch('docs/fonts/'+fn+'?v='+VH()).then(function(r){if(!r.ok)throw new Error('PDF: шрифт не загрузился');return r.arrayBuffer()}).then(function(b){FB64[fn]=b64(b)}))})});
  await Promise.all(jobs);return true})();
 try{return await LIB}catch(e){LIB=null;throw e}}

/* ---------- XML ---------- */
function kids(e,n){var r=[];if(!e)return r;for(var c=e.firstElementChild;c;c=c.nextElementSibling)if(!n||c.localName==n)r.push(c);return r}
function kid(e,n){if(!e)return null;for(var c=e.firstElementChild;c;c=c.nextElementSibling)if(c.localName==n)return c;return null}
function at(e,n){if(!e)return null;var v=e.getAttribute('w:'+n);if(v==null)v=e.getAttribute(n);return v}
function num(v,d){var x=parseFloat(v);return isFinite(x)?x:d}
function onoff(e){if(!e)return undefined;var v=at(e,'val');return !(v==='0'||v==='false'||v==='off'||v==='none')}
function parse(s){var d=new DOMParser().parseFromString(s,'application/xml');if(d.getElementsByTagName('parsererror').length)throw new Error('PDF: повреждён XML документа');return d.documentElement}
var HL={yellow:'FFFF00',green:'00FF00',cyan:'00FFFF',magenta:'FF00FF',blue:'0000FF',red:'FF0000',darkBlue:'000080',darkCyan:'008080',darkGreen:'008000',darkMagenta:'800080',darkRed:'800000',darkYellow:'808000',darkGray:'808080',lightGray:'C0C0C0',black:'000000'};

/* ---------- свойства ---------- */
function rP(e,o){o=Object.assign({},o||{});if(!e)return o;
 var f=kid(e,'rFonts');if(f){var a=at(f,'ascii')||at(f,'hAnsi');if(a)o.font=a;else{var th=at(f,'asciiTheme')||at(f,'hAnsiTheme');if(th)o.font='@'+th}}
 var x;if((x=kid(e,'b'))){o.b=onoff(x)}if((x=kid(e,'i'))){o.i=onoff(x)}
 if((x=kid(e,'sz')))o.sz=num(at(x,'val'),24)/2;
 if((x=kid(e,'color'))){var c=at(x,'val');o.color=(!c||c=='auto')?'000000':c}
 if((x=kid(e,'highlight'))){var h=at(x,'val');o.hl=h&&h!='none'?(HL[h]||null):null}
 if((x=kid(e,'shd'))){var fl=at(x,'fill');o.shd=fl&&fl!='auto'?fl:null}
 if((x=kid(e,'u'))){var u=at(x,'val');o.u=!!u&&u!='none'}
 if((x=kid(e,'strike')))o.strike=onoff(x);
 if((x=kid(e,'caps')))o.caps=onoff(x);
 if((x=kid(e,'vanish')))o.hide=onoff(x);
 if((x=kid(e,'vertAlign'))){var va=at(x,'val');o.va=va=='superscript'?'sup':va=='subscript'?'sub':null}
 return o}
function bdr(e){if(!e)return null;var v=at(e,'val');if(!v||v=='nil'||v=='none')return {none:1};return {w:Math.max(0.25,num(at(e,'sz'),4)/8),c:(at(e,'color')&&at(e,'color')!='auto')?at(e,'color'):'000000',sp:num(at(e,'space'),0)}}
function pP(e,o){o=Object.assign({},o||{});if(!e)return o;var x;
 if((x=kid(e,'jc'))){var j=at(x,'val');o.jc=j=='both'||j=='distribute'?'both':j=='center'?'center':(j=='right'||j=='end')?'right':'left'}
 if((x=kid(e,'ind'))){var l=at(x,'left')||at(x,'start'),r=at(x,'right')||at(x,'end');if(l!=null)o.il=num(l,0)/20;if(r!=null)o.ir=num(r,0)/20;
   if(at(x,'firstLine')!=null){o.fi=num(at(x,'firstLine'),0)/20}if(at(x,'hanging')!=null){o.fi=-num(at(x,'hanging'),0)/20}}
 if((x=kid(e,'spacing'))){if(at(x,'before')!=null)o.sb=num(at(x,'before'),0)/20;if(at(x,'after')!=null)o.sa=num(at(x,'after'),0)/20;
   if(at(x,'line')!=null){o.ln=num(at(x,'line'),240);o.lr=at(x,'lineRule')||'auto'}
   if(at(x,'beforeAutospacing')=='1')o.sb=14;if(at(x,'afterAutospacing')=='1')o.sa=14}
 if((x=kid(e,'tabs'))){var T=(o.tabs||[]).slice();kids(x,'tab').forEach(function(t){var v=at(t,'val'),p=num(at(t,'pos'),0)/20;T=T.filter(function(q){return Math.abs(q.pos-p)>0.5});if(v!='clear')T.push({pos:p,v:v=='end'?'right':v=='start'?'left':v,ld:at(t,'leader')})});o.tabs=T.sort(function(a,b){return a.pos-b.pos})}
 if((x=kid(e,'pBdr'))){o.bd=Object.assign({},o.bd||{});['top','bottom','left','right','between'].forEach(function(s){var b=kid(x,s);if(b)o.bd[s]=bdr(b)})}
 if((x=kid(e,'shd'))){var fl=at(x,'fill');o.shd=fl&&fl!='auto'?fl:null}
 if((x=kid(e,'pageBreakBefore')))o.pbb=onoff(x);if((x=kid(e,'keepNext')))o.kn=onoff(x);
 if((x=kid(e,'keepNext')))o.kn=onoff(x);
 if((x=kid(e,'framePr'))&&at(x,'yAlign')=='bottom')o.fb=true;
 if((x=kid(e,'contextualSpacing')))o.cs=onoff(x);
 if((x=kid(e,'pStyle')))o.ps=at(x,'val');
 return o}

/* ---------- контекст документа ---------- */
function Ctx(z){this.z=z;this.warn=[];this.imgs={};this.rels={}}
Ctx.prototype.str=async function(n){var f=this.z.file(n);return f?f.async('string'):null};
Ctx.prototype.init=async function(){
 var st=await this.str('word/styles.xml'),self=this;this.S={};this.dP={};this.dR={};this.defP=null;this.defT=null;
 if(st){var R=parse(st),dd=kid(R,'docDefaults');if(dd){this.dR=rP(kid(kid(dd,'rPrDefault'),'rPr'));this.dP=pP(kid(kid(dd,'pPrDefault'),'pPr'))}
  kids(R,'style').forEach(function(s){var id=at(s,'styleId'),ty=at(s,'type');self.S[id]={ty:ty,based:at(kid(s,'basedOn'),'val'),p:kid(s,'pPr'),r:kid(s,'rPr'),t:kid(s,'tblPr')};
   if(at(s,'default')=='1'&&ty=='paragraph')self.defP=id;if(at(s,'default')=='1'&&ty=='table')self.defT=id})}
 var th=await this.str('word/theme/theme1.xml');this.th={};if(th){var m1=th.match(/<a:minorFont>\s*<a:latin typeface="([^"]*)"/),m2=th.match(/<a:majorFont>\s*<a:latin typeface="([^"]*)"/);this.th.minor=m1?m1[1]:'Calibri';this.th.major=m2?m2[1]:'Calibri'}
 var se=await this.str('word/settings.xml');this.defTab=36;if(se){var m=se.match(/defaultTabStop w:val="(\d+)"/);if(m)this.defTab=+m[1]/20}
 this.cover={};var C=window.ARB_PDF_FONTS.cover;Object.keys(C).forEach(function(k){self.cover[k]=C[k]})};
Ctx.prototype.chain=function(id,kind){var out=[],g=0;while(id&&this.S[id]&&g++<20){out.unshift(this.S[id][kind]);id=this.S[id].based}return out};
Ctx.prototype.pOf=function(pPrEl,tbl){var o=Object.assign({},this.dP);if(tbl)tbl.p.forEach(function(e){o=pP(e,o)});var ps=pPrEl&&kid(pPrEl,'pStyle'),id=ps?at(ps,'val'):this.defP;var self=this;this.chain(id,'p').forEach(function(e){o=pP(e,o)});o=pP(pPrEl,o);o.style=id;return o};
Ctx.prototype.rBase=function(pst,tbl){var o=Object.assign({},this.dR);if(tbl)tbl.r.forEach(function(e){o=rP(e,o)});this.chain(pst||this.defP,'r').forEach(function(e){o=rP(e,o)});return o};
Ctx.prototype.rOf=function(base,rPrEl){var o=base,rs=rPrEl&&kid(rPrEl,'rStyle');if(rs)this.chain(at(rs,'val'),'r').forEach(function(e){o=rP(e,o)});return rP(rPrEl,o)};
Ctx.prototype.relsOf=async function(part){if(this.rels[part])return this.rels[part];var p=part.replace(/([^\/]+)$/,'_rels/$1.rels'),x=await this.str(p),m={};if(x){var R=parse(x);kids(R,'Relationship').forEach(function(r){m[r.getAttribute('Id')]={t:r.getAttribute('Target'),m:r.getAttribute('TargetMode')}})}this.rels[part]=m;return m};
Ctx.prototype.img=async function(part,rid){var rl=(await this.relsOf(part))[rid];if(!rl||rl.m=='External'){this.warn.push('внешнее изображение');return null}
 var base=part.replace(/[^\/]+$/,''),p=rl.t.charAt(0)=='/'?rl.t.slice(1):base+rl.t;p=p.split('/').reduce(function(a,s){if(s=='..')a.pop();else if(s&&s!='.')a.push(s);return a},[]).join('/');
 if(this.imgs[p])return this.imgs[p];var f=this.z.file(p);if(!f){this.warn.push('нет файла изображения');return null}
 var ext=(p.match(/\.(\w+)$/)||[])[1]||'',u=await f.async('uint8array'),fmt=/png/i.test(ext)?'PNG':/jpe?g/i.test(ext)?'JPEG':null;
 if(!fmt&&/gif|bmp|webp/i.test(ext)){try{var bl=new Blob([u]),bm=await createImageBitmap(bl),cv=document.createElement('canvas');cv.width=bm.width;cv.height=bm.height;cv.getContext('2d').drawImage(bm,0,0);u=new Uint8Array(await (await new Promise(function(r){cv.toBlob(r,'image/png')})).arrayBuffer());fmt='PNG'}catch(e){}}
 if(!fmt){this.warn.push('формат изображения '+ext+' не поддерживается');return null}
 var r={u:u,fmt:fmt,key:'im'+Object.keys(this.imgs).length};this.imgs[p]=r;return r};
Ctx.prototype.fam=function(name){var n=String(name||'');if(n.charAt(0)=='@')n=/major/i.test(n)?this.th.major:this.th.minor;
 var M=CF().font_map||{};for(var k in M)if(new RegExp(k,'i').test(n))return M[k];
 return /sans|arial|helvet|calibri|verdana|tahoma|roboto|segoe|trebuchet|open|lato|inter/i.test(n)?'ArbSans':'ArbSerif'};

/* ---------- измерение ---------- */
var SUB={'\u2011':'-','\u2610':'\u25a1','\u2611':'\u25a0','\u2612':'\u25a0','\u2713':'v','\u2714':'v','\u00ad':''};
function covers(rs,c){var lo=0,hi=rs.length-1;while(lo<=hi){var m=(lo+hi)>>1;if(c<rs[m][0])hi=m-1;else if(c>rs[m][1])lo=m+1;else return true}return false}
function sty(r,fam){var b=!!r.b,i=!!r.i;if(fam=='ArbSans'&&b&&i)i=false;return b&&i?'bolditalic':b?'bold':i?'italic':'normal'}
/* делит текст на куски по покрытию шрифтов: [{s,fam}] */
function segs(cx,s,fam){var out=[],cur='',cf=fam,alt=fam=='ArbSerif'?'ArbSans':'ArbSerif';
 for(var k=0;k<s.length;k++){var ch=s[k],c=ch.charCodeAt(0),f=fam;
  if(c>=0xD800&&c<0xDC00){ch=s.substr(k,2);k++;c=0x10000}
  if(!covers(cx.cover[fam],c)){if(SUB[ch]!=null)ch=SUB[ch];else if(covers(cx.cover[alt],c))f=alt;else ch='?'}
  if(f!==cf&&cur){out.push({s:cur,fam:cf});cur=''}cf=f;cur+=ch}
 if(cur)out.push({s:cur,fam:cf});return out}

/* ---------- раскладка ---------- */
function L(doc,cx){this.doc=doc;this.cx=cx;this.FM=window.ARB_PDF_FONTS.m}
L.prototype.w=function(s,fam,st,sz){this.doc.setFont(fam,st);return this.doc.getStringUnitWidth(s)*sz};
L.prototype.met=function(fam){return this.FM[fam]||{asc:.89,desc:.22}};

/* блок-поток: ops в координатах потока, y растёт вниз; paginate — для тела документа */
function Flow(L,x,w,opt){this.L=L;this.x=x;this.w=w;this.y=0;this.ops=[];this.opt=opt||{}}
Flow.prototype.op=function(o){this.ops.push(o)};

/* сбор инлайн-элементов абзаца */
async function inl(cx,part,pEl,pp,tbl,out,fs){
 var base=cx.rBase(pp.style,tbl);
 async function run(r){var rpr=kid(r,'rPr'),rp=cx.rOf(base,rpr);if(rp.hide)return;
  for(var c=r.firstElementChild;c;c=c.nextElementSibling){var n=c.localName;
   if(fs.skip&&n!='fldChar')continue;
   if(n=='t'){var s=c.textContent;if(fs.instr)continue;if(rp.caps)s=s.toUpperCase();out.push({k:'t',s:s,r:rp})}
   else if(n=='tab')out.push({k:'tab',r:rp});
   else if(n=='ptab')out.push({k:'tab',r:rp,abs:at(c,'alignment')||'left'});
   else if(n=='br'||n=='cr'){var ty=at(c,'type');out.push({k:ty=='page'||ty=='column'?'pb':'br',r:rp})}
   else if(n=='noBreakHyphen')out.push({k:'t',s:'\u2011',r:rp});
   else if(n=='sym'){var ch=parseInt(at(c,'char')||'0',16);if(ch>=0xF000)ch-=0xF000;out.push({k:'t',s:ch==0xA8||ch==0xFE?'\u25a0':ch==0x6F||ch==0xA1?'\u25a1':'\u2022',r:rp})}
   else if(n=='instrText'){fs.code=(fs.code||'')+c.textContent}
   else if(n=='fldChar'){var t=at(c,'fldCharType');if(t=='begin'){fs.code='';fs.instr=true;fs.skip=false}else if(t=='separate'){fs.instr=false;var k=(fs.code||'').trim().split(/\s+/)[0].toUpperCase();if(k=='PAGE'||k=='NUMPAGES'||k=='SECTIONPAGES'){out.push({k:'fld',f:k=='PAGE'?'PAGE':'NUMPAGES',r:rp});fs.skip=true}}else if(t=='end'){if(fs.instr){var k2=(fs.code||'').trim().split(/\s+/)[0].toUpperCase();if(k2=='PAGE'||k2=='NUMPAGES')out.push({k:'fld',f:k2=='PAGE'?'PAGE':'NUMPAGES',r:rp})}fs.instr=false;fs.skip=false;fs.code=''}}
   else if(n=='drawing'){var d=await drawing(cx,part,c);if(d)out.push(d)}
   else if(n=='pict'||n=='object'){cx.warn.push('VML/OLE-объект');}
   else if(n=='AlternateContent'){var fb=kid(c,'Fallback');if(fb)await walk(fb)}
  }}
 async function walk(e){for(var c=e.firstElementChild;c;c=c.nextElementSibling){var n=c.localName;
  if(n=='r')await run(c);else if(n=='hyperlink'||n=='smartTag'||n=='ins'||n=='customXml'||n=='sdt'||n=='sdtContent'||n=='moveTo')await walk(n=='sdt'?(kid(c,'sdtContent')||c):c);
  else if(n=='fldSimple'){var k=(at(c,'instr')||'').trim().split(/\s+/)[0].toUpperCase();if(k=='PAGE'||k=='NUMPAGES'){var rr=kid(c,'r');out.push({k:'fld',f:k,r:cx.rOf(base,rr&&kid(rr,'rPr'))})}else await walk(c)}
  else if(n=='AlternateContent'){var fb=kid(c,'Fallback');if(fb)await walk(fb)}
 }}
 await walk(pEl);return base}
async function drawing(cx,part,d){var a=kid(d,'anchor'),i=kid(d,'inline'),e=a||i;if(!e)return null;
 var ext=kid(e,'extent'),w=num(at(ext,'cx'),0)/12700,h=num(at(ext,'cy'),0)/12700,bl=e.getElementsByTagNameNS('*','blip')[0];
 if(!bl){cx.warn.push('фигура/надпись (не картинка)');return {k:i?'img':'anc',w:i?w:0,h:i?h:0,im:null,iw:w,ih:h}}
 var rid=bl.getAttribute('r:embed')||bl.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed'),im=await cx.img(part,rid);
 if(i)return {k:'img',w:w,h:h,im:im};
 function pos(tag){var p=kid(e,tag);if(!p)return {rf:'column',off:0};var o=kid(p,'posOffset'),al=kid(p,'align');return {rf:p.getAttribute('relativeFrom')||'column',off:o?num(o.textContent,0)/12700:0,al:al?al.textContent:null}}
 var wr=kids(e).map(function(x){return x.localName}).filter(function(n){return /^wrap/.test(n)})[0]||'wrapNone';
 if(wr!='wrapNone')cx.warn.push('обтекание '+wr);
 return {k:'anc',w:0,iw:w,ih:h,im:im,H:pos('positionH'),V:pos('positionV'),behind:e.getAttribute('behindDoc')=='1'}}

/* перенос строк абзаца → строки */
L.prototype.lines=function(items,pp,W,cx){var self=this,toks=[];
 items.forEach(function(it){if(it.k!='t'){toks.push(it);return}
  var fam=cx.fam(it.r.font),sz=it.r.sz||12,szE=it.r.va?sz*0.65:sz;
  segs(cx,it.s,fam).forEach(function(sg){var st=sty(it.r,sg.fam),parts=sg.s.match(/ +|[^ \-]*-|[^ \-]+/g)||[];
   parts.forEach(function(p){toks.push({k:p.charAt(0)==' '?'g':'b',s:p,r:it.r,fam:sg.fam,st:st,sz:szE,w:self.w(p,sg.fam,st,szE),brk:/-$/.test(p)})})})});
 var il=pp.il||0,ir=pp.ir||0,fi=pp.fi||0,out=[],ln=null;
 function nl(first){ln={a:[],x0:il+(first?fi:0),x:il+(first?fi:0),max:W-ir,tabs:0};return ln}
 function push(){out.push(ln)}
 nl(true);
 var i=0;
 function wordAt(j){var w=0,k=j;while(k<toks.length&&toks[k].k=='b'){w+=toks[k].w;if(toks[k].brk){k++;break}k++}return {w:w,end:k}}
 while(i<toks.length){var t=toks[i];
  if(t.k=='b'){var wd=wordAt(i);
   if(ln.x+wd.w>ln.max+0.01&&ln.a.some(function(a){return a.k!='g'&&a.k!='anc'})){push();nl(false);continue}
   if(ln.x+wd.w>ln.max+0.01&&wd.w>ln.max-ln.x0){/* слово длиннее строки — рубим по символам */
     var tk=toks[i],acc='',ax=ln.x;for(var q=0;q<tk.s.length;q++){var cw=self.w(tk.s[q],tk.fam,tk.st,tk.sz);if(ax+cw>ln.max&&acc){ln.a.push(Object.assign({},tk,{s:acc,w:self.w(acc,tk.fam,tk.st,tk.sz),x:ln.x}));ln.x+=self.w(acc,tk.fam,tk.st,tk.sz);push();nl(false);acc='';ax=ln.x}acc+=tk.s[q];ax+=cw}
     toks[i]=Object.assign({},tk,{s:acc,w:self.w(acc,tk.fam,tk.st,tk.sz)});wd=wordAt(i);}
   for(var j=i;j<wd.end;j++){var b=toks[j];ln.a.push(Object.assign({},b,{x:ln.x}));ln.x+=b.w}i=wd.end;continue}
  if(t.k=='g'){ln.a.push(Object.assign({},t,{x:ln.x}));ln.x+=t.w;i++;continue}
  if(t.k=='tab'){var pos=self.tabStop(ln,pp,t,cx,W);if(pos==null){push();nl(false);i++;continue}
   ln.tabs++;ln.a.push({k:'tab',x:ln.x,x2:pos.x,v:pos.v,r:t.r,ld:pos.ld});ln.seg={v:pos.v,at:pos.x,start:ln.a.length,x0:pos.v=='left'?pos.x:ln.x};ln.x=pos.v=='left'?pos.x:ln.x;i++;continue}
  if(t.k=='br'||t.k=='pb'){ln.brk=t.k;self.fixSeg(ln);push();nl(false);i++;continue}
  if(t.k=='img'){if(ln.x+t.w>ln.max+0.01&&ln.a.length){push();nl(false)}ln.a.push(Object.assign({},t,{x:ln.x}));ln.x+=t.w;i++;continue}
  if(t.k=='fld'){var fam=cx.fam(t.r.font),st=sty(t.r,fam),sz=t.r.sz||12,fw=self.w('8',fam,st,sz);ln.a.push({k:'fld',f:t.f,r:t.r,fam:fam,st:st,sz:sz,w:fw,x:ln.x});ln.x+=fw;i++;continue}
  if(t.k=='anc'){ln.a.push(Object.assign({},t,{x:ln.x}));i++;continue}
  i++}
 self.fixSeg(ln);push();
 out.forEach(function(l){self.fixSeg(l)});return out};
/* правая/центр. табуляция: сдвиг сегмента после табуляции */
L.prototype.fixSeg=function(ln){var s=ln.seg;if(!s||s.done)return;s.done=1;if(s.v=='left')return;var a=ln.a.slice(s.start),end=s.x0;a.forEach(function(x){if(x.k!='g'||x!==a[a.length-1])end=Math.max(end,x.x+(x.w||0))});
 var tr=a.length&&a[a.length-1].k=='g'?a[a.length-1].w:0,wd=end-s.x0-tr,nx=s.v=='right'?s.at-wd:s.v=='center'?s.at-wd/2:s.at;var tb=ln.a[s.start-1];nx=Math.max(nx,tb?tb.x:nx);var d=nx-s.x0;a.forEach(function(x){x.x+=d});if(tb)tb.x2=nx;ln.x+=d};
L.prototype.tabStop=function(ln,pp,t,cx,W){var x=ln.x+0.5,T=(pp.tabs||[]).filter(function(q){return q.v!='bar'});this.fixSeg(ln);
 if(t.abs){var p=t.abs=='right'?W-(pp.ir||0):t.abs=='center'?W/2:0;return {x:p,v:t.abs=='right'?'right':t.abs=='center'?'center':'left'}}
 for(var k=0;k<T.length;k++)if(T[k].pos>x)return {x:T[k].pos,v:T[k].v=='right'?'right':T[k].v=='center'?'center':'left',ld:T[k].ld};
 if((pp.fi||0)<0&&(pp.il||0)>x)return {x:pp.il,v:'left'};
 var d=cx.defTab||36,p=Math.ceil(x/d)*d;if(p<=x)p+=d;if(p>W-(pp.ir||0)+0.5)return ln.a.length?null:{x:p,v:'left'};return {x:p,v:'left'}};

/* высота строки и базовая линия */
L.prototype.lh=function(l,pp,emptyR,cx){var self=this,asc=0,desc=0;
 l.a.forEach(function(a){if(a.k=='img'){asc=Math.max(asc,a.h);return}if(a.k=='anc'||a.k=='tab')return;var m=self.met(a.fam),sz=a.sz||12;asc=Math.max(asc,m.asc*sz);desc=Math.max(desc,(m.desc+(m.gap||0))*sz)});
 if(!asc&&!desc){var fam=cx.fam(emptyR.font),m=this.met(fam),sz=emptyR.sz||12;asc=m.asc*sz;desc=(m.desc+(m.gap||0))*sz}
 var nat=asc+desc,h=nat,lr=pp.lr||'auto',ln=pp.ln==null?240:pp.ln;
 if(lr=='exact')h=ln/20;else if(lr=='atLeast')h=Math.max(nat,ln/20);else h=nat*ln/240;
 return {h:h,base:lr=='exact'?Math.min(h,asc+(h-nat)/2+0)+0:(h-nat)+asc,asc:asc,desc:desc}};
L.prototype.lhFix=function(m,lr){return m};

/* отрисовать строку в flow */
Flow.prototype.line=function(l,y,m,pp,last,W){var L0=this.L,x0=this.x,ops=this,jc=pp.jc||'left';
 var a=l.a,endX=0;a.forEach(function(it){if(it.k!='g'&&it.k!='anc')endX=Math.max(endX,it.x+(it.w||0))});
 var sh=0,extra=0,gl=[];
 if(!l.tabs||jc!='both'){var avail=l.max-l.x0,used=endX-l.x0;if(jc=='center')sh=(avail-used)/2;else if(jc=='right')sh=avail-used}
 if(jc=='both'&&!last&&!l.brk){var lt=-1;a.forEach(function(it,k){if(it.k=='tab')lt=k});var lastNG=-1;a.forEach(function(it,k){if(it.k!='g'&&it.k!='anc')lastNG=k});
   a.forEach(function(it,k){if(it.k=='g'&&k>lt&&k<lastNG)gl.push(k)});if(gl.length)extra=(l.max-endX)/gl.length;if(extra<0)extra=0}
 var add=0,base=y+m.base;
 for(var k=0;k<a.length;k++){var it=a[k],X=x0+it.x+sh+add;
  if(it.k=='g'&&gl.indexOf(k)>=0){var gw=it.w+extra;if(it.r&&(it.r.hl||it.r.shd))ops.op({z:0,k:'rect',x:X,y:base-m.asc,w:gw,h:m.asc+m.desc,c:it.r.hl||it.r.shd});if(it.r&&it.r.u)ops.op({z:1,k:'line',x1:X,y1:base+1.2,x2:X+gw,y2:base+1.2,w:0.5,c:it.r.color||'000000'});add+=extra;continue}
  if(it.k=='b'||it.k=='g'||it.k=='fld'){var r=it.r||{},m2=L0.met(it.fam),sz=it.sz;
   if(r.hl||r.shd)ops.op({z:0,k:'rect',x:X,y:base-m2.asc*sz,w:it.w,h:(m2.asc+m2.desc)*sz,c:r.hl||r.shd});
   var dy=r.va=='sup'?-sz*0.5:r.va=='sub'?sz*0.2:0;
   if(it.k=='fld')ops.op({z:1,k:'fld',f:it.f,x:X,y:base+dy,fam:it.fam,st:it.st,sz:sz,c:r.color||'000000'});
   else if(it.k=='b')ops.op({z:1,k:'text',s:it.s,x:X,y:base+dy,fam:it.fam,st:it.st,sz:sz,c:r.color||'000000'});
   if(r.u&&it.k!='fld')ops.op({z:1,k:'line',x1:X,y1:base+sz*0.1,x2:X+it.w,y2:base+sz*0.1,w:Math.max(0.4,sz*0.05),c:r.color||'000000'});
   if(r.strike&&it.k=='b')ops.op({z:1,k:'line',x1:X,y1:base-sz*0.28,x2:X+it.w,y2:base-sz*0.28,w:Math.max(0.4,sz*0.05),c:r.color||'000000'});
   continue}
  if(it.k=='tab'){if(it.ld&&it.ld!='none'){var lx=x0+it.x+sh,lx2=x0+it.x2+sh;var ch=it.ld=='dot'?'.':it.ld=='hyphen'?'-':'_';var r2=it.r||{},fam2=L0.cx.fam(r2.font),st2=sty(r2,fam2),sz2=r2.sz||12,cw=L0.w(ch,fam2,st2,sz2),n=Math.floor((lx2-lx-1)/cw);if(n>0)ops.op({z:1,k:'text',s:new Array(n+1).join(ch),x:lx2-n*cw,y:base,fam:fam2,st:st2,sz:sz2,c:'000000'})}
   if(it.r&&it.r.u){ops.op({z:1,k:'line',x1:x0+it.x+sh,y1:base+1.2,x2:x0+it.x2+sh,y2:base+1.2,w:0.5,c:'000000'})}continue}
  if(it.k=='img'){if(it.im)ops.op({z:1,k:'img',im:it.im,x:X,y:base-it.h,w:it.w,h:it.h});continue}
  if(it.k=='anc'&&it.im){ops.anc.push({it:it,x:X,lineTop:y})}
 }};

/* абзац */
Flow.prototype.para=async function(pEl,part,tbl,prev){var cx=this.L.cx,pPr=kid(pEl,'pPr'),pp=cx.pOf(pPr,tbl);
 var items=[],fs={};var base=await inl(cx,part,pEl,pp,tbl,items,fs);var mark=cx.rOf(base,pPr&&kid(pPr,'rPr'));
 var sb=pp.sb||0,sa=pp.sa||0;if(pp.cs&&prev&&prev.style==pp.style){sb=0;if(prev.op&&prev.sa){}}
 if(pp.pbb&&this.opt.page)this.newPage();
 if(prev&&prev.cs&&prev.style==pp.style)sb=0;
 var W=this.w,lines=this.L.lines(items,pp,W,cx);
 var bd=pp.bd||{},bt=bd.top&&!bd.top.none?bd.top:null,bb=bd.bottom&&!bd.bottom.none?bd.bottom:null;
 /* интервал перед: в начале страницы Word его сохраняет (кроме разрыва страницы) */
 this.y+=sb;var ptop=this.y;if(bt){this.y+=bt.sp+bt.w}
 this.anc=[];var paraTop=this.y,self=this,firstPage=this.page;
 for(var k=0;k<lines.length;k++){var l=lines[k],m=this.L.lh(l,pp,mark,cx);
  if(this.opt.page&&this.y+m.h>this.bottom()+0.01&&this.y>this.top()+0.01){this.newPage();paraTop=this.y}
  if(pp.shd)this.op({z:0,k:'rect',x:this.x+(pp.il||0),y:this.y,w:W-(pp.il||0)-(pp.ir||0),h:m.h,c:pp.shd});
  this.line(l,this.y,m,pp,k==lines.length-1,W);
  var A=this.anc;this.anc=[];A.forEach(function(q){self.placeAnc(q,paraTop)});this.anc=[];
  this.y+=m.h;if(l.brk=='pb'&&this.opt.page)this.newPage()}
 if(bt)this.op({z:1,k:'line',x1:this.x+(pp.il||0),y1:ptop+bt.w/2,x2:this.x+W-(pp.ir||0),y2:ptop+bt.w/2,w:bt.w,c:bt.c});
 if(bb){this.y+=bb.sp;this.op({z:1,k:'line',x1:this.x+(pp.il||0),y1:this.y+bb.w/2,x2:this.x+W-(pp.ir||0),y2:this.y+bb.w/2,w:bb.w,c:bb.c});this.y+=bb.w}
 var nx=pEl.nextElementSibling,nextCs=false;
 this.y+=sa;return {style:pp.style,cs:pp.cs,sa:sa}};
Flow.prototype.anc=[];
Flow.prototype.placeAnc=function(q,paraTop){var it=q.it,H=it.H||{},V=it.V||{},pg=this.pg||{},x,y;
 var mL=pg.ml!=null?pg.ml:this.x,mT=pg.mt!=null?pg.mt:0;
 var hRef=H.rf=='page'?0:H.rf=='character'?q.x:(H.rf=='margin'||H.rf=='column'||H.rf=='leftMargin'||H.rf=='insideMargin')?(H.rf=='column'?this.x:mL):this.x;
 var hW=H.rf=='page'?(pg.w||0):(pg.tw||this.w);
 x=H.al?(H.al=='center'?hRef+(hW-it.iw)/2:H.al=='right'?hRef+hW-it.iw:hRef):hRef+H.off;
 var vRef=V.rf=='page'?0:V.rf=='margin'||V.rf=='topMargin'?mT:V.rf=='line'?q.lineTop:paraTop;
 y=V.al?(V.al=='center'?vRef+((V.rf=='page'?pg.h:0)-it.ih)/2:V.al=='bottom'?vRef+(V.rf=='page'?pg.h:0)-it.ih:vRef):vRef+V.off;
 /* page/margin-relative — абсолютные координаты страницы: помечаем abs */
 var abs=V.rf=='page'||V.rf=='margin'||V.rf=='topMargin';
 this.op({z:it.behind?0:2,k:'img',im:it.im,x:x,y:y,w:it.iw,h:it.ih,absY:abs})};

/* таблица */
Flow.prototype.table=async function(tEl,part){var cx=this.L.cx,tp=kid(tEl,'tblPr'),self=this;
 var stId=(tp&&kid(tp,'tblStyle'))?at(kid(tp,'tblStyle'),'val'):cx.defT,chain=cx.chain(stId,'t'),tblP=[],tblR=[];
 cx.chain(stId,'p').forEach(function(e){if(e)tblP.push(e)});cx.chain(stId,'r').forEach(function(e){if(e)tblR.push(e)});
 var TB={},CM={l:5.4,r:5.4,t:0,b:0},ind=0,jc='left';
 function rd(e){if(!e)return;var b=kid(e,'tblBorders');if(b)['top','left','bottom','right','insideH','insideV','start','end'].forEach(function(s){var x=kid(b,s);if(x)TB[s=='start'?'left':s=='end'?'right':s]=bdr(x)});
  var m=kid(e,'tblCellMar');if(m){var f=function(s,k){var x=kid(m,s);if(x)CM[k]=num(at(x,'w'),0)/20};f('left','l');f('start','l');f('right','r');f('end','r');f('top','t');f('bottom','b')}
  var ti=kid(e,'tblInd');if(ti)ind=num(at(ti,'w'),0)/20;var j=kid(e,'jc');if(j){var v=at(j,'val');jc=v=='center'?'center':(v=='right'||v=='end')?'right':'left'}}
 chain.forEach(rd);rd(tp);
 var grid=kids(kid(tEl,'tblGrid'),'gridCol').map(function(g){return num(at(g,'w'),0)/20}),tw=grid.reduce(function(a,b){return a+b},0);
 var X0=this.x+(jc=='center'?(this.w-tw)/2:jc=='right'?this.w-tw:ind);
 var TBL={p:tblP,r:tblR},rows=kids(tEl,'tr'),R=[],vm={};
 for(var ri=0;ri<rows.length;ri++){var tr=rows[ri],trp=kid(tr,'trPr'),hdr=!!(trp&&kid(trp,'tblHeader')),th=trp&&kid(trp,'trHeight'),hmin=th?num(at(th,'val'),0)/20:0,hr=th?(at(th,'hRule')||'atLeast'):'',col=0,cells=[];
  var gb=trp&&kid(trp,'gridBefore');if(gb)col=num(at(gb,'val'),0);
  var tcs=kids(tr).filter(function(c){return c.localName=='tc'||c.localName=='sdt'});
  for(var ci=0;ci<tcs.length;ci++){var tc=tcs[ci];if(tc.localName=='sdt')tc=kid(kid(tc,'sdtContent'),'tc')||tc;var tcp=kid(tc,'tcPr'),span=tcp&&kid(tcp,'gridSpan')?num(at(kid(tcp,'gridSpan'),'val'),1):1,vme=tcp&&kid(tcp,'vMerge'),vmv=vme?(at(vme,'val')||'continue'):null;
   var x=X0+grid.slice(0,col).reduce(function(a,b){return a+b},0),w=grid.slice(col,col+span).reduce(function(a,b){return a+b},0);
   var cm=Object.assign({},CM),tm=tcp&&kid(tcp,'tcMar');if(tm){[['left','l'],['start','l'],['right','r'],['end','r'],['top','t'],['bottom','b']].forEach(function(q){var e=kid(tm,q[0]);if(e)cm[q[1]]=num(at(e,'w'),0)/20})}
   var cb={},tb=tcp&&kid(tcp,'tcBorders');if(tb)['top','left','bottom','right','start','end'].forEach(function(s){var e=kid(tb,s);if(e)cb[s=='start'?'left':s=='end'?'right':s]=bdr(e)});
   var sh=tcp&&kid(tcp,'shd'),fill=sh&&at(sh,'fill')&&at(sh,'fill')!='auto'?at(sh,'fill'):null,va=tcp&&kid(tcp,'vAlign')?at(kid(tcp,'vAlign'),'val'):'top';
   var cell={x:x,w:w,col:col,span:span,cm:cm,cb:cb,fill:fill,va:va,row:ri,cont:vmv=='continue'};
   if(vmv=='restart'||!vmv){if(vmv=='restart')vm[col]=cell;else delete vm[col];
     var f=new Flow(this.L,x+cm.l,Math.max(1,w-cm.l-cm.r),{});f.pg=this.pg;f.y=0;await f.blocks(tc,part,TBL);cell.f=f;cell.h=f.y+cm.t+cm.b}
   else{var st=vm[col];if(st){st.rs=(st.rs||1)+1;cell.owner=st}cell.h=0}
   cells.push(cell);col+=span}
  var h=Math.max.apply(null,[hmin].concat(cells.filter(function(c){return !c.cont&&!(c.rs>1)}).map(function(c){return c.h})));if(hr=='exact')h=hmin;
  R.push({cells:cells,h:h,hdr:hdr})}
 /* объединённые по вертикали: добрать высоту последней строке */
 R.forEach(function(r,ri){r.cells.forEach(function(c){if(c.rs>1){var tot=0;for(var k=ri;k<ri+c.rs&&k<R.length;k++)tot+=R[k].h;if(c.h>tot)R[Math.min(R.length-1,ri+c.rs-1)].h+=c.h-tot}})});
 var hdrRows=R.filter(function(r,i){return r.hdr&&R.slice(0,i).every(function(q){return q.hdr})});
 var self2=this;
 function edge(c,side,r,ri){var b=c.cb[side];if(b)return b.none?null:b;var inner=side=='top'?ri>0:side=='bottom'?ri<R.length-1:side=='left'?c.col>0:c.col+c.span<grid.length;var t=inner?(side=='top'||side=='bottom'?TB.insideH:TB.insideV):TB[side];return t&&!t.none?t:null}
 function drawRow(r,ri,y0){r.cells.forEach(function(c){if(c.cont)return;var hh=r.h;if(c.rs>1){hh=0;for(var k=ri;k<ri+c.rs&&k<R.length;k++)hh+=R[k].h}
   if(c.fill)self2.op({z:0,k:'rect',x:c.x,y:y0,w:c.w,h:hh,c:c.fill});
   var dy=c.va=='center'?(hh-c.h)/2:c.va=='bottom'?hh-c.h:0;c.f.ops.forEach(function(o){self2.op(shift(o,0,y0+c.cm.t+dy))});
   var bt=edge(c,'top',r,ri),bb=edge(c,'bottom',r,ri+(c.rs||1)-1),bl=edge(c,'left',r,ri),br=edge(c,'right',r,ri);
   if(bt)self2.op({z:1,k:'line',x1:c.x,y1:y0,x2:c.x+c.w,y2:y0,w:bt.w,c:bt.c});
   if(bb)self2.op({z:1,k:'line',x1:c.x,y1:y0+hh,x2:c.x+c.w,y2:y0+hh,w:bb.w,c:bb.c});
   if(bl)self2.op({z:1,k:'line',x1:c.x,y1:y0,x2:c.x,y2:y0+hh,w:bl.w,c:bl.c});
   if(br)self2.op({z:1,k:'line',x1:c.x+c.w,y1:y0,x2:c.x+c.w,y2:y0+hh,w:br.w,c:br.c})})}
 for(var i=0;i<R.length;i++){var r=R[i];
  if(this.opt.page&&this.y+r.h>this.bottom()+0.01&&this.y>this.top()+0.01){this.newPage();if(!r.hdr)hdrRows.forEach(function(hr2){drawRow(hr2,R.indexOf(hr2),self.y);self.y+=hr2.h})}
  drawRow(r,i,this.y);this.y+=r.h}
 return {style:null}};
function shift(o,dx,dy){var n=Object.assign({},o);if(n.absY)return n;if('y' in n)n.y+=dy;if('y1' in n){n.y1+=dy;n.y2+=dy}return n}
Flow.prototype.blocks=async function(el,part,tbl){var prev=null;for(var c=el.firstElementChild;c;c=c.nextElementSibling){var n=c.localName;
  if(n=='p'&&this.opt.page&&!tbl){var pk=this.L.cx.pOf(kid(c,'pPr'),tbl);if(pk.kn){var ch=[c],q=c;while(q.nextElementSibling&&q.nextElementSibling.localName=='p'&&ch.length<12){q=q.nextElementSibling;ch.push(q);if(!this.L.cx.pOf(kid(q,'pPr'),tbl).kn)break}
   var fk=new Flow(this.L,this.x,this.w,{});fk.pg=this.pg;fk.page=0;fk.y=0;var pv=prev;for(var ki=0;ki<ch.length;ki++)pv=await fk.para(ch[ki],part,tbl,pv);
   if(this.y+fk.y>this.bottom()+0.01&&this.y>this.top()+0.01&&fk.y<this.bottom()-this.top())this.newPage()}}
  if(n=='p'&&this.opt.page&&!tbl&&this.L.cx.pOf(kid(c,'pPr'),tbl).fb){/* рамка «внизу страницы» (отметка об исполнителе): высота пробным проходом, затем к нижнему полю */
   var fb=new Flow(this.L,this.x,this.w,{});fb.pg=this.pg;fb.page=0;fb.y=0;await fb.para(c,part,tbl,null);if(this.y+fb.y>this.bottom()+0.01)this.newPage();this.y=Math.max(this.y,this.bottom()-fb.y);prev=await this.para(c,part,tbl,null);continue}
  if(n=='p'){var sp=kid(kid(c,'pPr'),'sectPr');if(sp&&c.nextElementSibling&&c.nextElementSibling.localName!='sectPr'){this.L.cx.warn.push('несколько разделов')}prev=await this.para(c,part,tbl,prev)}
  else if(n=='tbl'){prev=await this.table(c,part);}
  else if(n=='sdt'){await this.blocks(kid(c,'sdtContent')||c,part,tbl)}
  else if(n=='customXml'){await this.blocks(c,part,tbl)}}};
/* пагинация тела */
Flow.prototype.top=function(){return this.pg.bt};Flow.prototype.bottom=function(){return this.pg.bb};
Flow.prototype.newPage=function(){this.pages.push(this.ops);this.ops=[];this.y=this.top();this.page=this.pages.length};

/* ---------- главный вход ---------- */
async function fromDocx(src){await deps();var JS=window.jspdf.jsPDF;
 var z=await JSZip.loadAsync(src instanceof Blob?await src.arrayBuffer():src),cx=new Ctx(z);await cx.init();
 var dx=await cx.str('word/document.xml');if(!dx)throw new Error('PDF: в файле нет document.xml');var D=parse(dx),body=kid(D,'body');
 var sps=body.getElementsByTagNameNS('*','sectPr'),sp=kid(body,'sectPr')||sps[sps.length-1];if(sps.length>1)cx.warn.push('несколько разделов');
 var pz=kid(sp,'pgSz'),pm=kid(sp,'pgMar'),pw=num(at(pz,'w'),11906)/20,ph=num(at(pz,'h'),16838)/20,orient=at(pz,'orient');if(orient=='landscape'&&pw<ph){var t=pw;pw=ph;ph=t}
 var M={t:num(at(pm,'top'),1134)/20,r:num(at(pm,'right'),850)/20,b:num(at(pm,'bottom'),1134)/20,l:num(at(pm,'left'),1701)/20,hd:num(at(pm,'header'),708)/20,ft:num(at(pm,'footer'),708)/20};
 var doc=new JS({unit:'pt',format:[pw,ph],orientation:pw>ph?'landscape':'portrait',compress:true});
 var F=window.ARB_PDF_FONTS.files;Object.keys(F).forEach(function(fam){Object.keys(F[fam]).forEach(function(st){var fn=F[fam][st];doc.addFileToVFS(fn,FB64[fn]);doc.addFont(fn,fam,st)})});
 ['bolditalic'].forEach(function(st){if(!F.ArbSans[st])doc.addFont(F.ArbSans.bold,'ArbSans',st)});
 var Lx=new L(doc,cx),tw=pw-M.l-M.r,pg={w:pw,h:ph,ml:M.l,mt:M.t,tw:tw};
 /* колонтитулы */
 var rels=await cx.relsOf('word/document.xml'),tp=!!kid(sp,'titlePg');
 async function hf(kind){var refs=kids(sp,kind+'Reference'),o={};for(var i=0;i<refs.length;i++){var ty=at(refs[i],'type')||'default',rid=refs[i].getAttribute('r:id'),rl=rels[rid];if(!rl)continue;var part='word/'+rl.t.replace(/^\/?word\//,'');var x=await cx.str(part);if(!x)continue;
   var f=new Flow(Lx,M.l,tw,{});f.pg=pg;f.y=0;await f.blocks(parse(x),part,null);o[ty]={ops:f.ops,h:f.y}}return o}
 var HD=await hf('header'),FT=await hf('footer');
 function hfFor(o,first){return first&&tp?(o.first||null):(o['default']||null)}
 function bodyTop(first){var h=hfFor(HD,first);return Math.max(M.t,h?M.hd+h.h:0)}
 function bodyBot(first){var f=hfFor(FT,first);return ph-Math.max(M.b,f?M.ft+f.h:0)}
 var B=new Flow(Lx,M.l,tw,{page:true});B.pg=Object.assign({},pg,{bt:bodyTop(true),bb:bodyBot(true)});B.pages=[];B.page=0;B.y=B.pg.bt;
 var nP=B.newPage;B.newPage=function(){nP.call(this);this.pg=Object.assign({},pg,{bt:bodyTop(false),bb:bodyBot(false)});this.y=this.pg.bt};
 await B.blocks(body,'word/document.xml',null);B.pages.push(B.ops);
 var N=B.pages.length;
 function draw(o,pn){if(o.k=='text'||o.k=='fld'){var s=o.k=='fld'?String(o.f=='PAGE'?pn:N):o.s;doc.setFont(o.fam,o.st);doc.setFontSize(o.sz);doc.setTextColor('#'+o.c);doc.text(s,o.x,o.y,{baseline:'alphabetic'})}
  else if(o.k=='rect'){doc.setFillColor('#'+o.c);doc.rect(o.x,o.y,o.w,o.h,'F')}
  else if(o.k=='line'){doc.setDrawColor('#'+o.c);doc.setLineWidth(o.w);doc.line(o.x1,o.y1,o.x2,o.y2)}
  else if(o.k=='img'&&o.im){try{doc.addImage(o.im.u,o.im.fmt,o.x,o.y,o.w,o.h,o.im.key,'FAST')}catch(e){cx.warn.push('изображение не встроилось')}}}
 for(var p=0;p<N;p++){if(p>0)doc.addPage([pw,ph],pw>ph?'landscape':'portrait');
  var ops=[],h=hfFor(HD,p==0),f=hfFor(FT,p==0);
  if(h)h.ops.forEach(function(o){ops.push(shift(o,0,M.hd))});
  if(f){var fy=ph-M.ft-f.h;f.ops.forEach(function(o){ops.push(shift(o,0,fy))})}
  B.pages[p].forEach(function(o){ops.push(o)});
  ops.map(function(o,i){return [o,i]}).sort(function(a,b){return (a[0].z||0)-(b[0].z||0)||a[1]-b[1]}).forEach(function(q){draw(q[0],p+1)})}
 doc.setProperties({title:'',creator:'Arbitr',producer:'Arbitr'});
 var out=doc.output('blob');var warn=cx.warn.filter(function(v,i,a){return a.indexOf(v)==i});
 return {blob:new Blob([out],{type:'application/pdf'}),pages:N,warn:warn,ok:!warn.length,landscape:pw>ph}}
/* пустой A4-документ jsPDF со встроенными шрифтами ArbSans/ArbSerif — для простых отчётов (отчёт Судебной практики, docs_prq.js); формируется на устройстве */
async function newDoc(o){await deps();var doc=new window.jspdf.jsPDF(o||{unit:'pt',format:'a4'}),F=window.ARB_PDF_FONTS.files;Object.keys(F).forEach(function(fam){Object.keys(F[fam]).forEach(function(st){var fn=F[fam][st];doc.addFileToVFS(fn,FB64[fn]);doc.addFont(fn,fam,st)})});return doc}
window.ArbPDF={ready:true,fromDocx:fromDocx,newDoc:newDoc,preload:function(){return deps().catch(function(){})}};
})();
