/* Arbitr App — общий движок раскладки документов по ГОСТ Р 7.0.97-2016 (спецификация Дизайнера, согласована в комнате Arbitr).
   Все размеры — docs_config.json → layout. Роли абзацев: шапка (письмо: «Исх.» слева 75 мм + адресат с 105 мм; суд: правый блок с подписями полужирным) ·
   заголовок / тема «О …» · обращение · текст · приложения (нумерованный список) · исполнитель · подпись · таблицы (повтор шапки). */
window.ArbLayout=function(D){var SIGLINE=D.SIGLINE,pList=D.pList,sigPick=D.sigPick,C={};
function LYG(){C=D.C()||{};var g=C.layout||{};return g.enabled===false?null:g}
var MM=56.6929,tw=function(pt){return Math.round(pt*20)},mmT=function(v){return Math.round(v*MM)};
var PPO=['pStyle','keepNext','keepLines','pageBreakBefore','framePr','widowControl','numPr','suppressLineNumbers','pBdr','shd','tabs','suppressAutoHyphens','kinsoku','wordWrap','overflowPunct','topLinePunct','autoSpaceDE','autoSpaceDN','bidi','adjustRightInd','snapToGrid','spacing','ind','contextualSpacing','mirrorIndents','suppressOverlap','jc','textDirection','textAlignment','textboxTightWrap','outlineLvl','divId','cnfStyle','rPr','sectPr','pPrChange'];
function ppGet(p){var m=/^<w:p(?:\s[^>]*)?>\s*<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(p);return m?m[1]:''}
function ppKids(inner){var o=[],re=/<w:(\w+)\b[^>]*\/>|<w:(\w+)\b[^>]*>[\s\S]*?<\/w:\2>/g,m;while((m=re.exec(inner)))o.push({n:m[1]||m[2],x:m[0]});return o}
function ppSet(p,mod){if(p=='<w:p/>')p='<w:p></w:p>';var inner=ppGet(p),K=ppKids(inner),by={};K.forEach(function(k){by[k.n]=k.x});
 Object.keys(mod).forEach(function(n){var v=mod[n];if(v===undefined)return;if(v===null)delete by[n];else if(typeof v=='function')by[n]=v(by[n]);else by[n]=v});
 var out=PPO.filter(function(n){return by[n]}).map(function(n){return by[n]}).join('');K.forEach(function(k){if(PPO.indexOf(k.n)<0)out+=k.x});
 var head=/^<w:p(?:\s[^>]*)?>/.exec(p)[0],rest=p.slice(head.length).replace(/^\s*<w:pPr>[\s\S]*?<\/w:pPr>/,'');return head+(out?'<w:pPr>'+out+'</w:pPr>':'')+rest}
function spAttr(old,a){var s=old||'<w:spacing/>';Object.keys(a).forEach(function(k){if(a[k]==null)return;var re=new RegExp('\\sw:'+k+'="[^"]*"');s=re.test(s)?s.replace(re,' w:'+k+'="'+a[k]+'"'):s.replace('<w:spacing','<w:spacing w:'+k+'="'+a[k]+'"')});return s}
function pAttr(p,el,a){var m=new RegExp('<w:'+el+'\\b[^>]*w:'+a+'="([^"]*)"').exec(ppGet(p));return m?m[1]:null}
function pTx(p){return (p.match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(x){return x.replace(/<[^>]+>/g,'')}).join('')}
/* свойства прогонов: кегль / курсив / полужирный для всех прогонов абзаца */
function runProps(p,o){var add=function(r){if(o.hp){r=r.replace(/<w:sz\b[^>]*\/>|<w:szCs\b[^>]*\/>/g,'')+'<w:sz w:val="'+o.hp+'"/><w:szCs w:val="'+o.hp+'"/>'}if(o.i&&!/<w:i\/>/.test(r))r='<w:i/>'+r;if(o.b===false)r=r.replace(/<w:b\/>|<w:bCs\/>/g,'');return r};
 var body=p.replace(/^(<w:p(?:\s[^>]*)?>)(\s*<w:pPr>[\s\S]*?<\/w:pPr>)?/,'');var hd=p.slice(0,p.length-body.length);
 body=body.replace(/<w:r>(?!<w:rPr>)/g,'<w:r><w:rPr></w:rPr>').replace(/<w:r(\s[^>]*)?><w:rPr>([\s\S]*?)<\/w:rPr>/g,function(m,a,r){return '<w:r'+(a||'')+'><w:rPr>'+ordR(add(r))+'</w:rPr>'});return hd+body}
var RPO=['rStyle','rFonts','b','bCs','i','iCs','caps','smallCaps','strike','dstrike','outline','shadow','emboss','imprint','noProof','snapToGrid','vanish','webHidden','color','spacing','w','kern','position','sz','szCs','highlight','u','effect','bdr','shd','fitText','vertAlign','rtl','cs','em','lang','eastAsianLayout','specVanish','oMath'];
function ordR(r){var K=ppKids(r);K.sort(function(a,b){var x=RPO.indexOf(a.n),y=RPO.indexOf(b.n);return (x<0?99:x)-(y<0?99:y)});return K.map(function(k){return k.x}).join('')}
function runSzIfNone(p,hp){return p.replace(/<w:r>(?!<w:rPr>)/g,'<w:r><w:rPr><w:sz w:val="'+hp+'"/><w:szCs w:val="'+hp+'"/></w:rPr>').replace(/<w:r(\s[^>]*)?><w:rPr>([\s\S]*?)<\/w:rPr>/g,function(m,a,r){return /<w:sz\b/.test(r)?m:'<w:r'+(a||'')+'><w:rPr>'+ordR(r+'<w:sz w:val="'+hp+'"/><w:szCs w:val="'+hp+'"/>')+'</w:rPr>'})}
/* полужирная подпись-метка в начале абзаца («Заявитель:», «Должник:», «дело №», «Судье») */
function boldLabel(p,re){var t=pTx(p),m=re.exec(t);if(!m||m.index!==0)return p;var lab=m[0],done=false;
 return p.replace(/<w:r(\s[^>]*)?>(<w:rPr>([\s\S]*?)<\/w:rPr>)?<w:t(\s[^>]*)?>([^<]*)<\/w:t><\/w:r>/,function(all,a,_r,rp,ta,tx){if(done||tx.indexOf(lab)!==0)return all;done=true;rp=rp||'';var rest=tx.slice(lab.length);
  return '<w:r'+(a||'')+'><w:rPr>'+ordR(rp.replace(/<w:b\/>/g,'')+'<w:b/>')+'</w:rPr><w:t xml:space="preserve">'+lab+'</w:t></w:r>'+(rest?'<w:r'+(a||'')+'>'+(rp?'<w:rPr>'+rp+'</w:rPr>':'')+'<w:t xml:space="preserve">'+rest+'</w:t></w:r>':'')})}
function RX(s,f){try{return s?new RegExp(s,f||''):null}catch(e){return null}}
function titleIdx(P){for(var i=0;i<P.length;i++)if(!P[i].tb&&P[i].t.trim()&&pAttr(P[i].s,'jc','val')=='center')return i;return -1}
/* ---------- шапка: письмо / судебный документ ---------- */
function headXml(dx,G){var P=pList(dx),ti=titleIdx(P);if(ti<=0)return dx;var H=[];for(var i=0;i<ti;i++){if(P[i].tb)return dx;H.push(i)}
 var TB=G.top_block||{},CT=G.court||{},M=G.margins_mm||{left:30,right:15},pw=210,txw=pw-M.left-M.right,al=mmT(Math.max(0,(TB.addr_left_mm||105)-M.left)),gap=tw(TB.block_gap_pt!=null?TB.block_gap_pt:6);
 var nonEmpty=H.filter(function(i){return P[i].s!='<w:p/>'&&P[i].t.trim()}),isCourt=RX(CT.detect||'^(В\\s.*[Сс]уд|Судь[ея])')&&nonEmpty.some(function(i){return RX(CT.detect||'^(В\\s.*[Сс]уд|Судь[ея])').test(P[i].t.trim())});
 var right=function(p,last){p=ppSet(p,{ind:al?'<w:ind w:left="'+al+'" w:right="0"/>':null,jc:null,suppressAutoHyphens:TB.hyphenation===false?'<w:suppressAutoHyphens/>':undefined,spacing:function(v){return spAttr(v,{before:0,after:last?gap:0})}});return TB.addr_pt?runProps(p,{hp:Math.round(TB.addr_pt*2)}):p};
 var st=P[H[0]].i,en=P[H[H.length-1]].i+P[H[H.length-1]].s.length,out;
 if(isCourt&&CT.right_block!==false){var ord=(CT.order||[]),lab=RX(CT.labels||'^(Заявитель:|Должник-гражданин:|Должник:|Ответчики?:|Кредитор:|[Дд]ело\\s№|Судье|Судья:)'),G2={},seq=[],cur=null;
  nonEmpty.forEach(function(i){var t=P[i].t.trim(),k=null;ord.forEach(function(o){if(!k&&RX(o.re).test(t))k=o.k});if(!k)k=cur||'_';if(!G2[k]){G2[k]=[];seq.push(k)}G2[k].push(i);cur=k});
  var keys=ord.map(function(o){return o.k}).filter(function(k){return G2[k]}).concat(seq.filter(function(k){return ord.every(function(o){return o.k!=k})}));
  out=keys.map(function(k){return G2[k].map(function(i,n){var p=right(P[i].s,n==G2[k].length-1);return lab&&CT.bold_labels!==false?boldLabel(p,lab):p}).join('')}).join('')}
 else{var stop=RX(TB.stop||'^(От:|Исх\\.)'),refRe=RX(TB.ref_match||'^Исх\\.'),A=[],R=[],O=[],inA=true;
  H.forEach(function(i){var p=P[i],t=p.t.trim();if(inA){if(p.s=='<w:p/>'||!t){if(A.length){inA=false;O.push(i)}return}if(stop.test(t)){inA=false}else{A.push(i);return}}if(refRe&&refRe.test(t))R.push(i);else O.push(i)});
  if(!A.length)return dx;
  if(R.length&&TB.table!==false){var c1=mmT(TB.ref_width_mm||75),c3=mmT(TB.addr_width_mm||90),c2=Math.max(0,mmT(txw)-c1-c3),nb='<w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/>';
   var cell=function(w,ps){return '<w:tc><w:tcPr><w:tcW w:w="'+w+'" w:type="dxa"/></w:tcPr>'+(ps||'<w:p/>')+'</w:tc>'};
   var inner=function(i,last){var p=ppSet(P[i].s,{ind:null,jc:null,suppressAutoHyphens:TB.hyphenation===false?'<w:suppressAutoHyphens/>':undefined,spacing:function(v){return spAttr(v,{before:0,after:0})}});return TB.addr_pt?runProps(p,{hp:Math.round(TB.addr_pt*2)}):p};
   var tbl='<w:tbl><w:tblPr><w:tblW w:w="'+(c1+c2+c3)+'" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/><w:tblBorders>'+nb+'</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar><w:tblDescription w:val="arb-top"/></w:tblPr><w:tblGrid><w:gridCol w:w="'+c1+'"/><w:gridCol w:w="'+c2+'"/><w:gridCol w:w="'+c3+'"/></w:tblGrid><w:tr>'+cell(c1,R.map(function(i){return inner(i)}).join(''))+cell(c2)+cell(c3,A.map(function(i){return inner(i)}).join(''))+'</w:tr></w:tbl>';
   out=tbl+'<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="120" w:lineRule="exact"/></w:pPr></w:p>'+O.filter(function(i){return !(P[i].s=='<w:p/>'||!P[i].t.trim())||O.indexOf(i)>0}).map(function(i){return P[i].s}).join('')}
  else out=A.map(function(i,n){return right(P[i].s,n==A.length-1)}).join('')+H.filter(function(i){return A.indexOf(i)<0}).map(function(i){return P[i].s}).join('')}
 return dx.slice(0,st)+out+dx.slice(en)}
/* ---------- роли ---------- */
function gostRoles(P,dx,t,G){var ti=titleIdx(P),R=[];
 var sg=sigPick(dx,t),sz=-1;if(sg>=0&&!P[sg].tb){sz=sg;for(var j=sg-1;j>ti&&j>=0;j--){if(P[j].tb)break;if(P[j].t.trim()){if(P[j].t.trim().length<=160&&!/[.;:]$/.test(P[j].t.trim()))sz=j;break}}}
 var AT=RX((G.attach||{}).match||'^Приложени[еяй]'),SA=RX((G.salutation||{}).match||'^Уважаем'),EX=RX((G.executor||{}).match||'^(Исп\\.|Исполнитель)'),att=false;
 P.forEach(function(p,i){var r,t=p.t.trim();if(p.tb)r='table';else if(ti<0||i<ti)r='head';else if(i==ti)r='title';else if(EX&&EX.test(t))r='exec';else if(sz>=0&&i>=sz)r='sig';else if(SA&&SA.test(t))r='salut';else{if(AT&&AT.test(t))att=true;r=att?'attach':'body'}R.push(r)});return {R:R,ti:ti}}
/* приложения: «Приложение: а; б» → «Приложение:» + нумерованный список */
function attachSplit(p,G){var A=G.attach||{};if(A.numbered===false)return p;var t=pTx(p),m=/^(Приложени[еяй]\s*:)\s*(.+)$/.exec(t.trim());if(!m)return p;
 var parts=m[2].split(RX(A.split||';\\s*|,\\s+(?=(?:копи|выписк|документ|справк|отч[её]т|акт[а-я]*\\s|протокол|договор|квитанц|уведомлен|доверенн|платёжн|платежн))','')).map(function(s){return s.trim()}).filter(Boolean);
 if(parts.length<2||(p.match(/<w:r[ >]/g)||[]).length>1)return p;var rp=(/<w:r(?:\s[^>]*)?>(<w:rPr>[\s\S]*?<\/w:rPr>)?/.exec(p)||[])[1]||'',pp=(/<w:pPr>[\s\S]*?<\/w:pPr>/.exec(p)||[''])[0];
 var mk=function(s){return '<w:p>'+pp+'<w:r>'+rp+'<w:t xml:space="preserve">'+s+'</w:t></w:r></w:p>'};
 return mk(m[1].replace(/\s+:/,':'))+parts.map(function(s,i){s=s.replace(/[.;,]\s*$/,'');return mk((i+1)+'. '+s+(i==parts.length-1?'.':';'))}).join('')}
function gostXml(dx,t){var G=LYG();if(!G)return dx;
 dx=dx.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){return /Приложени[еяй]\s*:/.test(pTx(p))?attachSplit(p,G):p});
 try{dx=headXml(dx,G)}catch(e){console.warn('layout head',e)}
 var P=pList(dx),o=gostRoles(P,dx,t,G),R=o.R,fl=Math.round((G.first_line_cm||1.25)*567),ln=Math.round((G.line||1)*240),pa=tw(G.para_after_pt||0),ha=tw(G.head_after_pt!=null?G.head_after_pt:6),SJ=G.subject||{},AT=G.attach||{},EXC=G.executor||{},jb=G.justify!==false?'<w:jc w:val="both"/>':undefined;
 var spc=function(k){var q=P[k];return !!q&&!q.tb&&(q.s=='<w:p/>'||!q.t.trim())&&!/<w:drawing/.test(q.s)},bef=function(i,v){return spc(i-1)?Math.max(0,v-tw((G.text_pt||12)*(G.line||1))):v},aft=function(i,v){return spc(i+1)?0:v};
 var TBC=[],tre=/<w:tbl>([\s\S]*?)<w:tblGrid>([\s\S]*?)<\/w:tblGrid>/g,tm;while((tm=tre.exec(dx))){var e0=dx.indexOf('</w:tbl>',tm.index);TBC.push({s:tm.index,e:e0<0?dx.length:e0,n:(tm[2].match(/<w:gridCol\b/g)||[]).length,top:tm[1].indexOf('arb-top')>=0})}
 var tbOf=function(pos){var r=null;TBC.forEach(function(b){if(pos>=b.s&&pos<b.e)r=b});return r};
 var subj=o.ti>=0&&RX(SJ.match||'^Об?\\s')&&RX(SJ.match||'^Об?\\s').test(P[o.ti].t.trim()),attHead=-1;
 var out='',last=0;P.forEach(function(p,i){var r=R[i],s=p.s,np=s;if(s!='<w:p/>'){var em=!p.t.trim(),il=+(pAttr(s,'ind','left')||0),jc=pAttr(s,'jc','val'),sp=function(a){return function(v){return spAttr(v,Object.assign({line:ln,lineRule:'auto'},a))}};
   if(r=='table'){var tb=tbOf(p.i);if(tb&&tb.top)np=s;else{np=ppSet(s,{});var tp=(G.table_wide&&tb&&tb.n>=(G.table_wide.cols||9))?G.table_wide.pt:G.table_pt;if(tp)np=runSzIfNone(np,Math.round(tp*2))}}
   else if(r=='head'){if(il){np=s}else{var nx=P[i+1],grpEnd=!nx||nx.tb||R[i+1]!='head'||spc(i+1);np=ppSet(s,{spacing:sp({after:grpEnd?aft(i,ha):0})})}}
   else if(r=='title'){var gp=Math.round((SJ.gap_mm||10)*72/25.4*20);if(subj){np=ppSet(s,{keepNext:'<w:keepNext/>',jc:SJ.align=='center'?'<w:jc w:val="center"/>':null,ind:null,spacing:sp({before:bef(i,gp),after:aft(i,tw(G.title_space_pt||12))})});np=runProps(np,{hp:Math.round((SJ.pt||11)*2),i:SJ.italic!==false,b:SJ.bold?undefined:false})}
    else np=ppSet(s,{keepNext:'<w:keepNext/>',spacing:sp({before:bef(i,gp),after:aft(i,tw(G.title_space_pt||12))})})}
   else if(r=='salut')np=ppSet(s,{ind:null,jc:'<w:jc w:val="center"/>',spacing:sp({before:0,after:aft(i,tw(G.title_space_pt||12))})});
   else if(r=='exec'){np=ppSet(s,{ind:null,jc:null,keepLines:'<w:keepLines/>',spacing:sp({before:bef(i,tw(EXC.before_pt||24)),after:0})});np=runProps(np,{hp:Math.round((EXC.pt||9)*2)})}
   else if(r=='sig'){var fz=P.findIndex(function(q,k){return R[k]=='sig'});np=ppSet(s,{spacing:sp({before:(i==fz?(/_{5,}\s*\/[^\/]*\/\s*$/.test(p.t.trim())?tw(Math.max(0,(G.sig_line_gap_pt||30)-(spc(i-1)?(G.text_pt||12):0))):bef(i,tw(G.sig_before_pt||18))):0),after:0}),ind:il?undefined:null,jc:jc=='center'||jc=='right'?undefined:null})}
   else if(r=='attach'){var first=i>0&&R[i-1]!='attach',isItem=/^\d+[.)]\s/.test(p.t.trim()),hg=Math.round((AT.hanging_mm||6)*MM);if(first)attHead=i;
    np=ppSet(s,{spacing:sp({before:first?bef(i,tw(G.attach_before_pt||12)):0,after:0}),ind:isItem?'<w:ind w:left="'+hg+'" w:hanging="'+hg+'"/>':(il?undefined:null),jc:jc=='center'||jc=='right'?undefined:(isItem?jb:(first?null:jb))})}
   else if(!em&&!il&&jc!='center'&&jc!='right'&&!/<w:tab\/>/.test(s.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/,'')))np=ppSet(s,{spacing:sp({after:pa}),ind:'<w:ind w:firstLine="'+fl+'"/>',jc:jb});
   else np=ppSet(s,{spacing:sp({after:pa})})}
  out+=dx.slice(last,p.i)+np;last=p.i+s.length});out+=dx.slice(last);
 /* повтор строки заголовка таблицы на каждой странице */
 if(G.table_header_repeat!==false)out=out.replace(/<w:tbl>([\s\S]*?)<\/w:tblGrid>\s*<w:tr(\s[^>]*)?>(\s*<w:trPr>)?/g,function(m,a,tra,trp){if(a.indexOf('arb-top')>=0||/<w:tblHeader\/>/.test(m))return m;return '<w:tbl>'+a+'</w:tblGrid><w:tr'+(tra||'')+'>'+(trp?trp+'<w:tblHeader/>':'<w:trPr><w:tblHeader/></w:trPr>')});
 var M=G.margins_mm;if(M)out=out.replace(/<w:pgMar [^>]*\/>/g,function(m){return m.replace(/w:top="\d+"/,'w:top="'+mmT(M.top)+'"').replace(/w:bottom="\d+"/,'w:bottom="'+mmT(M.bottom)+'"').replace(/w:left="\d+"/,'w:left="'+mmT(M.left)+'"').replace(/w:right="\d+"/,'w:right="'+mmT(M.right)+'"')});
 return out}
async function gostApply(z,t,hasLh){var G=LYG();if(!G)return z;var sx=z.file('word/styles.xml')?await z.file('word/styles.xml').async('string'):null,fn=G.font||'Times New Roman',hp=Math.round((G.text_pt||12)*2);
 if(sx){var rf='<w:rFonts w:ascii="'+fn+'" w:hAnsi="'+fn+'" w:cs="'+fn+'" w:eastAsia="'+fn+'"/>';
  sx=sx.replace(/<w:rPrDefault>[\s\S]*?<\/w:rPrDefault>/,'<w:rPrDefault><w:rPr>'+rf+'<w:sz w:val="'+hp+'"/><w:szCs w:val="'+hp+'"/><w:lang w:val="ru-RU" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>');
  sx=sx.replace(/<w:pPrDefault>[\s\S]*?<\/w:pPrDefault>/,'<w:pPrDefault><w:pPr>'+(G.widow_control!==false?'<w:widowControl/>':'')+'<w:spacing w:after="0" w:line="'+Math.round((G.line||1)*240)+'" w:lineRule="auto"/></w:pPr></w:pPrDefault>');
  sx=sx.replace(/(<w:style [^>]*w:styleId="Normal"[\s\S]*?<w:rPr>)([\s\S]*?)(<\/w:rPr>)/,function(m,a,b,c){return a+b.replace(/<w:rFonts[^>]*\/>/,rf).replace(/<w:sz w:val="\d+"\/>/,'<w:sz w:val="'+hp+'"/>')+c});
  z.file('word/styles.xml',sx)}
 if(G.hyphenation!==false&&z.file('word/settings.xml')){var se0=await z.file('word/settings.xml').async('string');if(se0.indexOf('autoHyphenation')<0)z.file('word/settings.xml',se0.replace(/<w:settings([^>]*)>/,'<w:settings$1><w:autoHyphenation/>'))}
 var pn=G.page_numbers||{};if(!hasLh&&pn.enabled!==false){var dx=await z.file('word/document.xml').async('string'),se=dx.lastIndexOf('<w:sectPr');
  if(se>=0&&dx.slice(se).indexOf('headerReference')<0){var php=Math.round((pn.pt||12)*2),hx='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:p><w:pPr><w:jc w:val="'+(pn.align||'center')+'"/></w:pPr><w:fldSimple w:instr=" PAGE "><w:r><w:rPr><w:rFonts w:ascii="'+fn+'" w:hAnsi="'+fn+'" w:cs="'+fn+'"/><w:sz w:val="'+php+'"/><w:szCs w:val="'+php+'"/></w:rPr><w:t>2</w:t></w:r></w:fldSimple></w:p></w:hdr>';
   z.file('word/header_gost.xml',hx);var rp='word/_rels/document.xml.rels',rl=await z.file(rp).async('string');if(rl.indexOf('rIdGostHdr')<0)z.file(rp,rl.replace('</Relationships>','<Relationship Id="rIdGostHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header_gost.xml"/></Relationships>'));
   var ct=await z.file('[Content_Types].xml').async('string');if(ct.indexOf('/word/header_gost.xml')<0)z.file('[Content_Types].xml',ct.replace('</Types>','<Override PartName="/word/header_gost.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>'));
   var sp=dx.slice(se).replace(/<w:sectPr([^>]*)>/,function(m){return m+'<w:headerReference w:type="default" r:id="rIdGostHdr"/>'});if((pn.from||2)>1&&sp.indexOf('<w:titlePg')<0)sp=/<w:docGrid/.test(sp)?sp.replace(/<w:docGrid/,'<w:titlePg/><w:docGrid'):sp.replace('</w:sectPr>','<w:titlePg/></w:sectPr>');
   if(!/xmlns:r=/.test(dx.slice(0,dx.indexOf('<w:body'))))dx=dx.replace(/<w:document /,'<w:document xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
   z.file('word/document.xml',dx.slice(0,se)+sp)}}
 return z}
/* предпросмотр: роли строк md (b — текст с отступом, r — правый блок шапки, s — тема «О …», c — обращение) */
function gostMdRoles(L){var G=LYG();if(!G)return null;var ti=L.findIndex(function(l){return /^#+\s+/.test(l)}),sg=-1;for(var i=L.length-1;i>ti;i--)if(SIGLINE.test(L[i])){sg=i;break}var sz=sg;if(sg>0)for(var j=sg-1;j>ti;j--){var s=L[j].trim();if(s){if(s.length<=160&&!/[.;:]$/.test(s))sz=j;break}}
 var CT=G.court||{},TB=G.top_block||{},cr=RX(CT.detect||'^(В\\s.*[Сс]уд|Судь[ея])'),court=L.slice(0,Math.max(0,ti)).some(function(l){return cr&&cr.test(l.trim())}),stop=RX(TB.stop||'^(От:|Исх\\.)'),inA=true,SJ=RX((G.subject||{}).match||'^Об?\\s'),SA=RX((G.salutation||{}).match||'^Уважаем');
 var att=false;return L.map(function(l,i){var t=l.trim();if(ti<0||i<ti){if(court)return t?'r':'';if(inA){if(!t||stop.test(t)){inA=false;return ''}return 'r'}return ''}if(i==ti)return SJ&&SJ.test(t.replace(/^#+\s+/,''))?'s':'t';if(sz>=0&&i>=sz)return 'x';if(SA&&SA.test(t))return 'c';if(/^Приложени[еяй]/.test(t))att=true;if(att)return 'a';return l.indexOf('\t')>=0?'':'b'})}
/* предпросмотр: тот же порядок правого блока судебного документа */
function gostMdHead(L){var G=LYG();if(!G)return L;var CT=G.court||{},ord=CT.order||[],cr=RX(CT.detect||'^(В\\s.*[Сс]уд|Судь[ея])'),ti=L.findIndex(function(l){return /^#+\s+/.test(l)});if(ti<=0||CT.right_block===false||!ord.length)return L;
 var H=L.slice(0,ti);if(!H.some(function(l){return cr&&cr.test(l.trim())}))return L;var G2={},seq=[],cur=null;H.forEach(function(l){var t=l.trim();if(!t)return;var k=null;ord.forEach(function(o){if(!k&&RX(o.re).test(t))k=o.k});if(!k)k=cur||'_';if(!G2[k]){G2[k]=[];seq.push(k)}G2[k].push(l);cur=k});
 var keys=ord.map(function(o){return o.k}).filter(function(k){return G2[k]}).concat(seq.filter(function(k){return ord.every(function(o){return o.k!=k})}));var out=[];keys.forEach(function(k){out=out.concat(G2[k])});out.push('');return out.concat(L.slice(ti))}
function gostLabel(){var G=LYG();if(!G)return null;var CT=G.court||{};return CT.bold_labels===false?null:RX(CT.labels||'^(Заявитель:|Должник-гражданин:|Должник:|Ответчики?:|Кредитор:|[Дд]ело\\s№|Судье|Судья:)')}
return {xml:gostXml,apply:gostApply,mdRoles:gostMdRoles,mdHead:gostMdHead,label:gostLabel}};
