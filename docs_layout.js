/* Arbitr App — общий движок раскладки документов по ГОСТ Р 7.0.97-2016 (вынесен из docs.js; настройки docs_config.json → layout). */
window.ArbLayout=function(D){var SIGLINE=D.SIGLINE,pList=D.pList,sigPick=D.sigPick,C={};function LYG0(){C=D.C()||{}}
/* ===== Шаг 5: оформление по ГОСТ Р 7.0.97-2016 — общий движок раскладки (настройки: docs_config.json → layout) =====
   роли абзацев: шапка (до заголовка) · заголовок · текст (абзацный отступ, по ширине) · приложения · блок подписи · таблицы; номера страниц сверху по центру со 2-й страницы */
function LYG(){LYG0();var g=C.layout||{};return g.enabled===false?null:g}
var PPO=['pStyle','keepNext','keepLines','pageBreakBefore','framePr','widowControl','numPr','suppressLineNumbers','pBdr','shd','tabs','suppressAutoHyphens','kinsoku','wordWrap','overflowPunct','topLinePunct','autoSpaceDE','autoSpaceDN','bidi','adjustRightInd','snapToGrid','spacing','ind','contextualSpacing','mirrorIndents','suppressOverlap','jc','textDirection','textAlignment','textboxTightWrap','outlineLvl','divId','cnfStyle','rPr','sectPr','pPrChange'];
function ppGet(p){var m=/^<w:p(?:\s[^>]*)?>\s*<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(p);return m?m[1]:''}
function ppKids(inner){var o=[],re=/<w:(\w+)\b[^>]*\/>|<w:(\w+)\b[^>]*>[\s\S]*?<\/w:\2>/g,m;while((m=re.exec(inner)))o.push({n:m[1]||m[2],x:m[0]});return o}
function ppSet(p,mod){if(p=='<w:p/>')return p;var inner=ppGet(p),K=ppKids(inner),by={};K.forEach(function(k){by[k.n]=k.x});
 Object.keys(mod).forEach(function(n){var v=mod[n];if(v===undefined)return;if(v===null)delete by[n];else if(typeof v=='function')by[n]=v(by[n]);else by[n]=v});
 var out=PPO.filter(function(n){return by[n]}).map(function(n){return by[n]}).join('');K.forEach(function(k){if(PPO.indexOf(k.n)<0)out+=k.x});
 var head=/^<w:p(?:\s[^>]*)?>/.exec(p)[0],rest=p.slice(head.length);if(inner||/^\s*<w:pPr>/.test(rest))rest=rest.replace(/^\s*<w:pPr>[\s\S]*?<\/w:pPr>/,'');return head+(out?'<w:pPr>'+out+'</w:pPr>':'')+rest}
function spAttr(old,a){var s=old||'<w:spacing/>';Object.keys(a).forEach(function(k){if(a[k]==null)return;var re=new RegExp('\\sw:'+k+'="[^"]*"');s=re.test(s)?s.replace(re,' w:'+k+'="'+a[k]+'"'):s.replace('<w:spacing','<w:spacing w:'+k+'="'+a[k]+'"')});return s}
function pAttr(p,el,a){var m=new RegExp('<w:'+el+'\\b[^>]*w:'+a+'="([^"]*)"').exec(ppGet(p));return m?m[1]:null}
function runSz(p,hp){/* кегль для прогонов без явного размера (таблицы) */return p.replace(/<w:r>(?!<w:rPr>)/g,'<w:r><w:rPr><w:sz w:val="'+hp+'"/><w:szCs w:val="'+hp+'"/></w:rPr>').replace(/<w:r(\s[^>]*)?><w:rPr>([\s\S]*?)<\/w:rPr>/g,function(m,a,r){return /<w:sz\b/.test(r)?m:'<w:r'+(a||'')+'><w:rPr>'+r+'<w:sz w:val="'+hp+'"/><w:szCs w:val="'+hp+'"/></w:rPr>'})}
function gostRoles(P,dx,t){var ti=-1,R=[];for(var i=0;i<P.length;i++){if(!P[i].tb&&P[i].t.trim()&&pAttr(P[i].s,'jc','val')=='center'){ti=i;break}}
 var sg=sigPick(dx,t),sz=-1;if(sg>=0&&!P[sg].tb){sz=sg;for(var j=sg-1;j>ti&&j>=0;j--){if(P[j].tb)break;if(P[j].t.trim()){if(P[j].t.trim().length<=160&&!/[.;:]$/.test(P[j].t.trim()))sz=j;break}}}
 var att=false;P.forEach(function(p,i){var r;if(p.tb)r='table';else if(ti<0||i<ti)r='head';else if(i==ti)r='title';else if(sz>=0&&i>=sz)r='sig';else{if(/^Приложени[еяй]/.test(p.t.trim()))att=true;r=att?'attach':'body'}R.push(r)});return {R:R,ti:ti}}
function gostXml(dx,t){var G=LYG();if(!G)return dx;var P=pList(dx),o=gostRoles(P,dx,t),R=o.R,tw=function(pt){return Math.round(pt*20)},fl=Math.round((G.first_line_cm||1.25)*567),ln=Math.round((G.line||1)*240),pa=tw(G.para_after_pt||0),ha=tw(G.head_after_pt!=null?G.head_after_pt:6);
 var spc=function(k){var q=P[k];return !!q&&!q.tb&&(q.s=='<w:p/>'||!q.t.trim())&&!/<w:drawing/.test(q.s)},bef=function(i,v){return spc(i-1)?0:v},aft=function(i,v){return spc(i+1)?0:v};
 var TBC=[],tre=/<w:tbl>[\s\S]*?<w:tblGrid>([\s\S]*?)<\/w:tblGrid>/g,tm;while((tm=tre.exec(dx))){var e0=dx.indexOf('</w:tbl>',tm.index);TBC.push({s:tm.index,e:e0<0?dx.length:e0,n:(tm[1].match(/<w:gridCol\b/g)||[]).length})}
 var out='',last=0;P.forEach(function(p,i){var r=R[i],s=p.s,np=s;if(s!='<w:p/>'){var em=!p.t.trim(),il=+(pAttr(s,'ind','left')||0),jc=pAttr(s,'jc','val');
   if(r=='table'){np=ppSet(s,{});var nc=TBC.reduce(function(a,b){return p.i>=b.s&&p.i<b.e?b.n:a},0),tp=(G.table_wide&&nc>=(G.table_wide.cols||9))?G.table_wide.pt:G.table_pt;if(tp)np=runSz(np,Math.round(tp*2))}
   else if(r=='head'){var nx=P[i+1],grpEnd=!nx||nx.tb||(+(pAttr(nx.s,'ind','left')||0))!=il||R[i+1]!='head';np=ppSet(s,{spacing:function(v){var a0=pAttr(s,'spacing','after');return spAttr(v,{after:(a0=='0'&&!grpEnd)?0:(grpEnd?aft(i,ha):(a0!=null?a0:0)),line:ln,lineRule:'auto'})}})}
   else if(r=='title')np=ppSet(s,{keepNext:'<w:keepNext/>',spacing:function(v){return spAttr(v,{before:bef(i,tw(G.title_space_pt||12)),after:aft(i,tw(G.title_space_pt||12)),line:ln,lineRule:'auto'})}});
   else if(r=='sig')np=ppSet(s,{spacing:function(v){return spAttr(v,{before:(i==P.findIndex(function(q,k){return R[k]=='sig'})?(/_{5,}\s*\/[^\/]*\/\s*$/.test(p.t.trim())?tw(Math.max(0,(G.sig_line_gap_pt||30)-(spc(i-1)?(G.text_pt||12):0))):bef(i,tw(G.sig_before_pt||18))):0),after:0,line:ln,lineRule:'auto'})},ind:il?undefined:null,jc:jc=='center'||jc=='right'?undefined:null});
   else if(r=='attach'){var first=i>0&&R[i-1]!='attach';np=ppSet(s,{spacing:function(v){return spAttr(v,{before:first?bef(i,tw(G.attach_before_pt||12)):0,after:0,line:ln,lineRule:'auto'})},ind:il?undefined:null,jc:jc=='center'||jc=='right'?undefined:(G.justify!==false?'<w:jc w:val="both"/>':null)})}
   else if(!em&&!il&&jc!='center'&&jc!='right'&&!/^<w:p[^>]*>[\s\S]*?<w:tab\/>/.test(s.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/,'')))np=ppSet(s,{spacing:function(v){return spAttr(v,{after:pa,line:ln,lineRule:'auto'})},ind:'<w:ind w:firstLine="'+fl+'"/>',jc:G.justify!==false?'<w:jc w:val="both"/>':undefined});
   else np=ppSet(s,{spacing:function(v){return spAttr(v,{after:pa,line:ln,lineRule:'auto'})}})}
  out+=dx.slice(last,p.i)+np;last=p.i+s.length});out+=dx.slice(last);
 var M=G.margins_mm;if(M)out=out.replace(/<w:pgMar [^>]*\/>/g,function(m){var mm=function(v){return Math.round(v*56.6929)};return m.replace(/w:top="\d+"/,'w:top="'+mm(M.top)+'"').replace(/w:bottom="\d+"/,'w:bottom="'+mm(M.bottom)+'"').replace(/w:left="\d+"/,'w:left="'+mm(M.left)+'"').replace(/w:right="\d+"/,'w:right="'+mm(M.right)+'"')});
 return out}
async function gostApply(z,t,hasLh){var G=LYG();if(!G)return z;var sx=z.file('word/styles.xml')?await z.file('word/styles.xml').async('string'):null,fn=G.font||'Times New Roman',hp=Math.round((G.text_pt||12)*2);
 if(sx){var rf='<w:rFonts w:ascii="'+fn+'" w:hAnsi="'+fn+'" w:cs="'+fn+'" w:eastAsia="'+fn+'"/>';
  sx=sx.replace(/<w:rPrDefault>[\s\S]*?<\/w:rPrDefault>/,'<w:rPrDefault><w:rPr>'+rf+'<w:sz w:val="'+hp+'"/><w:szCs w:val="'+hp+'"/><w:lang w:val="ru-RU" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>');
  sx=sx.replace(/<w:pPrDefault>[\s\S]*?<\/w:pPrDefault>/,'<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="'+Math.round((G.line||1)*240)+'" w:lineRule="auto"/></w:pPr></w:pPrDefault>');
  sx=sx.replace(/(<w:style [^>]*w:styleId="Normal"[\s\S]*?<w:rPr>)([\s\S]*?)(<\/w:rPr>)/,function(m,a,b,c){return a+b.replace(/<w:rFonts[^>]*\/>/,rf).replace(/<w:sz w:val="\d+"\/>/,'<w:sz w:val="'+hp+'"/>')+c});
  z.file('word/styles.xml',sx)}
 var pn=G.page_numbers||{};if(!hasLh&&pn.enabled!==false){var dx=await z.file('word/document.xml').async('string'),se=dx.lastIndexOf('<w:sectPr');
  if(se>=0&&dx.slice(se).indexOf('headerReference')<0){var php=Math.round((pn.pt||12)*2),hx='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:p><w:pPr><w:jc w:val="'+(pn.align||'center')+'"/></w:pPr><w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:rFonts w:ascii="'+fn+'" w:hAnsi="'+fn+'" w:cs="'+fn+'"/><w:sz w:val="'+php+'"/></w:rPr><w:t>2</w:t></w:r></w:fldSimple></w:p></w:hdr>';
   z.file('word/header_gost.xml',hx);var rp='word/_rels/document.xml.rels',rl=await z.file(rp).async('string');if(rl.indexOf('rIdGostHdr')<0)z.file(rp,rl.replace('</Relationships>','<Relationship Id="rIdGostHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header_gost.xml"/></Relationships>'));
   var ct=await z.file('[Content_Types].xml').async('string');if(ct.indexOf('/word/header_gost.xml')<0)z.file('[Content_Types].xml',ct.replace('</Types>','<Override PartName="/word/header_gost.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>'));
   var sp=dx.slice(se).replace(/<w:sectPr([^>]*)>/,function(m){return m+'<w:headerReference w:type="default" r:id="rIdGostHdr"/>'});if((pn.from||2)>1&&sp.indexOf('<w:titlePg')<0)sp=/<w:docGrid/.test(sp)?sp.replace(/<w:docGrid/,'<w:titlePg/><w:docGrid'):sp.replace('</w:sectPr>','<w:titlePg/></w:sectPr>');
   if(!/xmlns:r=/.test(dx.slice(0,dx.indexOf('<w:body'))))dx=dx.replace(/<w:document /,'<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
   z.file('word/document.xml',dx.slice(0,se)+sp)}}
 return z}
/* предпросмотр: те же роли строк (класс .dlb — абзацный отступ и выравнивание по ширине) */
function gostMdRoles(L){var G=LYG();if(!G)return null;var ti=L.findIndex(function(l){return /^#+\s+/.test(l)}),sg=-1;for(var i=L.length-1;i>ti;i--)if(SIGLINE.test(L[i])){sg=i;break}var sz=sg;if(sg>0)for(var j=sg-1;j>ti;j--){var s=L[j].trim();if(s){if(s.length<=160&&!/[.;:]$/.test(s))sz=j;break}}
 var att=false;return L.map(function(l,i){if(ti<0||i<ti)return 'h';if(i==ti)return 't';if(sz>=0&&i>=sz)return 's';if(/^Приложени[еяй]/.test(l.trim()))att=true;if(att)return 'a';return l.indexOf('\t')>=0?'':'b'})}
return {xml:gostXml,apply:gostApply,mdRoles:gostMdRoles}};
