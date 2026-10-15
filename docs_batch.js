/* Arbitr App · Документы → пакетное формирование (макет batch_docs/spec.md).
   Значения пакета, номера и журнал — только на этом устройстве (localStorage + архив IndexedDB). */
(function(){
'use strict';
var A,ROOT,B=null,SHEET=null,RES=null,BUSY=false;
function E(s){return A.E(s)}function T(k,o){return A.BU(k,o)}
function cfg(){return A.C.batch||{}}function MU(){return cfg().multi||{}}function PER(t){return (cfg().per_addressee||{})[t.id]||[]}
function F(k){return A.F[k]||{k:k,label:k,scope:'document',type:'text'}}
function scope(k){return F(k).scope||'document'}function opt(k){return !!F(k).optional}
function nP(n){return n+' '+A.pl(n,'поле','поля','полей')}function nD(n){return n+' '+A.pl(n,'документ','документа','документов')}function nT(n){return n+' '+A.pl(n,'шаблон','шаблона','шаблонов')}
function S(){return A.S()}
function st(){var s=S();s.bvals=s.bvals||{'*':{}};s.bper=s.bper||{};s.baddr=s.baddr||{};return s}
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function sel(){return A.X.templates.filter(function(t){return B.ids.indexOf(t.id)>=0})}
function caseNow(){return A.curCase()}
/* ---- поля пакета ---- */
function common(){var ts=sel(),U={},cnt={};ts.forEach(function(t){t.fields.forEach(function(k){if(A.RF(t).indexOf(k)>=0)return;U[k]=1;if(scope(k)=='document')cnt[k]=(cnt[k]||0)+1})});
 var ord=function(sc,o){return (o||[]).filter(function(k){return U[k]&&scope(k)==sc}).concat(Object.keys(U).filter(function(k){return scope(k)==sc&&(o||[]).indexOf(k)<0}))};
 return {prof:ord('profile',A.C.profile_order),cas:ord('case',A.C.case_order),shared:Object.keys(cnt).filter(function(k){return cnt[k]>=2&&k!='ИСХ_НОМЕР'&&!MU()[k]}).sort(function(a,b){return F(a).label.localeCompare(F(b).label,'ru')})}}
function own(t,sh){return t.fields.filter(function(k){return scope(k)=='document'&&k!='ИСХ_НОМЕР'&&sh.indexOf(k)<0&&!MU()[k]&&PER(t).indexOf(k)<0&&A.RF(t).indexOf(k)<0})}
function vget(k,tid){var s=st();if(scope(k)=='profile')return A.raw(k,'');if(scope(k)=='case'){var c=caseNow();return c?A.raw(k,''):(s.bvals['*'][k]||'')}
 var o=s.bvals[tid]||{};if(tid!='*'&&o[k]!=null)return o[k];var v=s.bvals['*'][k];if(v!=null&&tid=='*')return v;if(tid=='*')return k=='ДАТА'?today():'';
 var d=(S().drafts[tid]||{})[k];return d||''}
function vset(k,tid,v){var s=st();if(scope(k)=='profile'||scope(k)=='case'&&caseNow()){A.setVal(k,v);return}if(scope(k)=='case'){s.bvals['*'][k]=v;A.save();return}(s.bvals[tid]=s.bvals[tid]||{})[k]=v;A.save()}
function mfield(t){return A.multiOf(t)}
function addrs(t){var s=st(),c=caseNow(),key=(c?c.id:'')+'|'+t.id,m=mfield(t);if(!m)return null;
 if(!s.baddr[key]){var M=MU()[m]||{},L=[];if(M.from_case){var r=c?c.data[m]:'';if(r)L.push({n:r,src:'case'})}
  else if(window.ArbCP&&c)ArbCP.pick(M.roles,c.id).filter(function(x){return (x.cases||[]).indexOf(c.id)>=0}).forEach(function(x){L.push({n:x.name,src:'k',cp:x.id})});s.baddr[key]=L}
 return s.baddr[key]}
function pkey(t,a,k){return t.id+'|'+a.n+'|'+k}
function pget(t,a,k){var s=st(),v=s.bper[pkey(t,a,k)];if(v!=null)return v;var pf=(cfg().per_from_card||{})[k];if(pf&&a.cp&&window.ArbCP){var c=ArbCP.get(a.cp);if(c&&c[pf])return c[pf]}return ''}
function docsOf(t){var a=addrs(t);return a&&a.length?a.length:1}
function missT(t,sh){var n=0;own(t,sh).forEach(function(k){if(!opt(k)&&!vget(k,t.id))n++});if(A.RF(t).length&&!A.rowsFilled(t).length)n++;var a=addrs(t);
 if(a){if(!a.length)n++;PER(t).forEach(function(k){a.forEach(function(x){if(!opt(k)&&!pget(t,x,k))n++})})}return n}
function missC(c){var n=0;c.prof.concat(c.cas).forEach(function(k){if(!opt(k)&&!vget(k,'*')&&!(k=='ВИД_УПРАВЛЯЮЩЕГО'&&vget('ПРОЦЕДУРА','*')))n++});c.shared.forEach(function(k){if(!opt(k)&&!vget(k,'*'))n++});return n}
/* ---- номера ---- */
function oc(){return A.outCfg(caseNow())}
function planSig(){return (caseNow()?caseNow().id:'')+'#'+sel().map(function(t){var a=addrs(t);return t.id+(a?':'+a.map(function(x){return x.n}).join(','):'')}).join(';')}
function first(){var o=oc();return B.issued&&B.issued.sig==planSig()?B.issued.first:o.next}
function no(i){return A.outFmt(first()+i,oc(),vget('ДАТА','*'))}
function plan(){var out=[],i=0;sel().forEach(function(t){var a=addrs(t);(a&&a.length?a:[null]).forEach(function(x,j){out.push({t:t,a:x,j:j,i:i,no:no(i)});i++})});return out}
function OVfor(p,c){var v={},t=p.t,s=st();c.shared.forEach(function(k){v[k]=vget(k,'*')});if(!caseNow())c.cas.forEach(function(k){v[k]=vget(k,'*')});
 own(t,c.shared).forEach(function(k){v[k]=vget(k,t.id)});var m=mfield(t);if(m&&p.a)v[m]=p.a.n;if(p.a)PER(t).forEach(function(k){v[k]=pget(t,p.a,k)});v.ИСХ_НОМЕР=p.no;
 return {v:v,blank:B.blank,sign:B.sign&&A.SIG().length>0}}
/* ---- разметка ---- */
function stc(n){return n?'<span class="dst warn">'+E(T('miss',{n:nP(n)}))+'</span>':'<span class="dst ok">'+E(T('ok'))+'</span>'}
function fld(k,tid,tag){var f=F(k),v=vget(k,tid),em=!v&&!opt(k)&&!(k=='ВИД_УПРАВЛЯЮЩЕГО'&&vget('ПРОЦЕДУРА','*')),id='db_'+(tid=='*'?'c':tid)+'_'+k,h=A.inp(f,v,'db_'+(tid=='*'?'c':tid)).replace('data-k=','data-bk="'+E(k)+'" data-btid="'+E(tid)+'" data-x=');
 if(em)h=h.replace(/^<(input|textarea)/,'<$1 placeholder="Заполните"');
 return '<div class="'+(f.type=='textarea'?'dwide ':'')+(em?'dempty':'')+'"><label for="'+E(id)+'">'+E(f.label)+(opt(k)?' <span class="sm">· необязательно</span>':'')+(tag&&v?' <span class="dtag">'+E(tag)+'</span>':'')+'</label>'+h+(f.hint?'<div class="sm dhint">'+E(f.hint)+'</div>':'')+'</div>'}
function sw(k,on,t,sub,dis){return '<div class="dsw"><div><b>'+E(t)+'</b><div class="sm">'+E(sub)+'</div></div><button type="button" class="dtg'+(on?' on':'')+'" data-bsw="'+k+'" role="switch" aria-checked="'+on+'" aria-label="'+E(t)+'"'+(dis?' disabled':'')+'></button></div>'}
function rowsBlock(t){var rf=A.RF(t);if(!rf.length)return '';var rs=A.rows(t);return '<div class="sm dsub">'+E(T('rows',{n:A.rowsFilled(t).length}))+'</div>'+rs.map(function(r,i){return '<div class="lot drow"><div class="d1">'+E(A.U('row_n',{n:i+1}))+'</div><div class="g2">'+rf.map(function(k){var f=F(k);return '<div'+(f.type=='textarea'?' class="dwide"':'')+'><label for="dbr_'+t.id+'_'+i+'_'+E(k)+'">'+E(f.label)+'</label>'+A.inp(f,r[k]||'','dbr_'+t.id+'_'+i).replace('data-k=','data-brt="'+E(t.id)+'" data-brow="'+i+'" data-brk=')+'</div>'}).join('')+'</div>'+(rs.length>1?'<p><button type="button" class="lbtn sec" data-browdel="'+E(t.id)+'|'+i+'">'+E(A.U('row_del'))+'</button></p>':'')+'</div>'}).join('')+'<p><button type="button" class="lbtn sec" data-browadd="'+E(t.id)+'">'+E(A.U('row_add'))+'</button></p>'}
function vForm(){var c=common(),ts=sel(),P=plan(),cm=missC(c),o=oc(),cs=caseNow(),ofs=0;
 var secs=ts.map(function(t){var n=docsOf(t),r={t:t,n:n,m:missT(t,c.shared),from:ofs};ofs+=n;return r}),tot=secs.reduce(function(s,x){return s+x.m},cm);
 if(!B.opened){B.opened=1;secs.forEach(function(s){if(s.m)B.open[s.t.id]=true})}
 var cp=window.ArbCP&&cs?ArbCP.list().filter(function(x){return (x.cases||[]).indexOf(cs.id)>=0}).length:0;
 var h='<div class="dbatch"><button type="button" class="lbtn sec" data-bact="list">'+E(T('back'))+'</button><h3 class="dth">'+E(T('title'))+'</h3><p class="sm">'+E(T('sum',{t:nT(ts.length),d:nD(P.length),a:P[0].no,b:P[P.length-1].no}))+'</p><div class="dbf"><aside class="dtoc"><h4>'+E(T('toc'))+'</h4><a href="#dbs-common"><i class="ddot'+(cm?' w':'')+'"></i><span>'+E(T('common_toc'))+'</span></a>'+secs.map(function(s){return '<a href="#dbs-'+E(s.t.id)+'"><i class="ddot'+(s.m?' w':'')+'"></i><span>'+E(s.t.title)+(s.n>1?' <b class="dmul">× '+s.n+'</b>':'')+'</span></a>'}).join('')+'</aside><div class="dbmain">';
 h+='<div class="lot dcard" id="dbs-common">'+A.mgrTop(B.sign&&A.SIG().length>0,'data-bsw="sign"','dbmgr')+A.mgrRO(c.prof)+'<h4 class="dsh">'+E(T('case_card'))+'</h4><div class="dcrow"><label for="dbcase">'+E(T('case_pick'))+'</label><select id="dbcase"><option value="">'+E(A.U('case_none'))+'</option>'+S().cases.map(function(x){return '<option value="'+E(x.id)+'"'+(cs&&x.id==cs.id?' selected':'')+'>'+E(A.caseName(x))+'</option>'}).join('')+'<option value="__new">'+E(T('case_new'))+'</option></select></div>'+
  (cs?'<div class="sm dmini"><span>'+E(T('proc'))+': <b>'+E(cs.data.ПРОЦЕДУРА||'—')+'</b></span> <span>'+E(T('court'))+': <b>'+E(cs.data.СУД||'—')+'</b></span> <span>'+E(T('kontr'))+': <b>'+cp+'</b></span></div>':'')+
  sw('blank',B.blank,T('blank'),T('blank_sub'),!A.LH().length)+'</div>';
 h+='<div class="lot dcard"><h4 class="dsh">'+E(T('common'))+' '+stc(cm)+'</h4><p class="sm">'+E(T('common_sub'))+'</p>'+(c.shared.length?'<div class="sm dsub">'+E(T('for_all'))+'</div><div class="g2">'+c.shared.map(function(k){return fld(k,'*')}).join('')+'</div>':'');
 var fmts=cfg().out_formats||['{n}/{yy}'],used=window.ArbArch?ArbArch.usedIn(cs?cs.id:'',first(),first()+P.length-1,planSig()):[];
 h+='<div class="sm dsub">'+E(T('nums'))+'</div><div class="g2"><div><label for="dbfirst">'+E(T('first'))+'</label><input id="dbfirst" inputmode="numeric" value="'+first()+'"></div><div><label for="dbfmt">'+E(T('fmtl'))+'</label><select id="dbfmt">'+fmts.map(function(f){return '<option value="'+E(f)+'"'+(o.fmt==f?' selected':'')+'>'+E(A.outFmt(first(),{fmt:f,pfx:o.pfx||'А'},vget('ДАТА','*')))+'</option>'}).join('')+'</select></div>'+(/\{p\}/.test(o.fmt)?'<div><label for="dbpfx">'+E(T('pfx'))+'</label><input id="dbpfx" value="'+E(o.pfx||'')+'"></div>':'')+'</div>'+
  '<p class="sm">'+E(T('preview_nums',{a:P[0].no,b:P[P.length-1].no,d:nD(P.length),n:A.outFmt(first()+P.length,o,vget('ДАТА','*'))}))+'</p>'+(used.length?'<p class="sm ewarn">'+E(T('used_warn',{a:used[0],b:used[used.length-1]}))+'</p>':'');
 if(B.pc)h+='<div class="sm dsub">'+E(T('case_t'))+' · '+nP(c.cas.length)+' <button type="button" class="adall" data-bact="pc">'+E(T('hide'))+'</button></div><div class="g2">'+c.cas.map(function(k){return fld(k,'*',cs?'из дела':'')}).join('')+'</div>';
 else h+='<button type="button" class="dfoldl" data-bact="pc">'+E(T('prof_case',{c:nP(c.cas.length)}))+' ›</button>';
 h+='</div><h4 class="dsh">'+E(T('docs'))+'</h4>';
 secs.forEach(function(s){var t=s.t,a=addrs(t),m=mfield(t),op=!!B.open[t.id],ow=own(t,c.shared),nos=s.n>1?'исх. № '+no(s.from)+' – '+no(s.from+s.n-1):'исх. № '+no(s.from);
  h+='<div class="lot dsec'+(s.m?' warn':'')+(op?' open':'')+'" id="dbs-'+E(t.id)+'"><button type="button" class="dsech" data-bfold="'+E(t.id)+'" aria-expanded="'+op+'"><span class="d1">'+E(t.title)+(s.n>1?' <b class="dmul">× '+s.n+'</b>':'')+'</span><span class="sm">'+stc(s.m)+' '+E(nos)+'</span><span class="dchev" aria-hidden="true">›</span></button>';
  if(op){h+='<div class="dsecb">';
   if(m){h+='<div class="sm dsub">'+E(T('addr_t'))+'</div><div class="dacs">'+a.map(function(x,i){return '<span class="dac"><span>'+E(x.n)+'</span>'+(x.src=='m'?' <i>'+E(T('manual'))+'</i>':'')+'<button type="button" data-brm="'+E(t.id)+'|'+i+'" aria-label="Убрать">✕</button></span>'}).join('')+'<button type="button" class="dac add" data-bpick="'+E(t.id)+'">+ '+E(T('addr_add'))+'</button></div><p class="sm">'+E(T('addr_sub',{f:F(m).label}))+'</p>';
    if(PER(t).length)a.forEach(function(x,i){h+='<div class="lot dpa"><div class="dpah"><b>'+E(x.n)+'</b><span class="sm">исх. № '+E(no(s.from+i))+'</span></div><div class="g2">'+PER(t).map(function(k){var v=pget(t,x,k),f=F(k),em=!v&&!opt(k);return '<div class="'+(f.type=='textarea'?'dwide ':'')+(em?'dempty':'')+'"><label>'+E(f.label)+'</label>'+(f.type=='textarea'?'<textarea rows="2" data-bper="'+E(pkey(t,x,k))+'">'+E(v)+'</textarea>':'<input data-bper="'+E(pkey(t,x,k))+'" value="'+E(v)+'"'+(em?' placeholder="Заполните"':'')+'>')+'</div>'}).join('')+'</div></div>'})}
   if(ow.length)h+='<div class="sm dsub">'+E(T('own'))+'</div><div class="g2">'+ow.map(function(k){return fld(k,t.id)}).join('')+'</div>';else if(!m&&!A.RF(t).length)h+='<p class="sm">'+E(T('no_own'))+'</p>';
   h+=rowsBlock(t)+'</div>'}
  h+='</div>'});
 h+='</div></div></div>';ROOT.innerHTML=h;
 A.bar('<div class="dbi"><b>'+E(nD(P.length))+'</b><span class="sm'+(tot?' dwarn':'')+'">'+E(tot?T('bar_miss',{n:nP(tot)}):T('bar_ok'))+'</span></div><button type="button" class="lbtn dbgo" data-bact="make">'+E(T('make_docs',{n:P.length}))+'</button>');drawSheet()}
/* ---- выбор адресатов ---- */
function drawSheet(){var el=document.getElementById('dsheet');if(!SHEET){if(el)el.remove();return}var t=A.X.templates.find(function(x){return x.id==SHEET.tid}),m=mfield(t),M=MU()[m]||{},a=addrs(t),cs=caseNow(),q=(SHEET.q||'').toLowerCase();
 var mine=[],dir=[];if(M.from_case){var seen={};S().cases.forEach(function(c){var r=c.data[m];if(r&&!seen[r]){seen[r]=1;(cs&&c.id==cs.id?mine:dir).push({n:r})}});(S().bregions||[]).forEach(function(r){if(!seen[r]){seen[r]=1;dir.push({n:r})}})}
 else if(window.ArbCP)ArbCP.pick(M.roles,cs&&cs.id,M.kinds).forEach(function(x){((cs&&(x.cases||[]).indexOf(cs.id)>=0)?mine:dir).push({n:x.name,cp:x.id,inn:x.inn,bik:x.bik})});
 a.forEach(function(x){if(!mine.concat(dir).some(function(y){return x.cp?y.cp==x.cp:y.n==x.n}))mine.push({n:x.n,manual:x.src=='m'})});
 var f=function(L){return L.filter(function(x){return !q||x.n.toLowerCase().indexOf(q)>=0||(x.bik||'').indexOf(q)==0||(x.inn||'').indexOf(q)==0})},isOn=function(x){return a.some(function(y){return x.cp?y.cp==x.cp:(!y.cp&&y.n==x.n)})},it=function(x){var on=isOn(x);return '<div class="dshit" data-bpt="'+E(x.n)+'"'+(x.cp?' data-bcp="'+E(x.cp)+'"':'')+'><span class="adcb'+(on?' on':'')+'" role="checkbox" aria-checked="'+on+'"></span><div><b>'+E(x.n)+'</b>'+(x.bik||x.inn?'<div class="sm">'+E([x.bik?'БИК '+x.bik:'',x.inn?'ИНН '+x.inn:''].filter(Boolean).join(' · '))+'</div>':'')+(x.manual?'<div class="sm">'+E(T('manual'))+' · <button type="button" class="adall" data-bsavecp="'+E(x.n)+'">'+E(T('sheet_save_cp'))+'</button></div>':'')+'</div></div>'};
 var h='<div class="dsh2" role="dialog" aria-modal="true"><div class="dgrab"></div><h4>'+E(T('sheet_t',{t:M.label||F(m).label}))+'</h4><p class="sm">'+E(T('sheet_sub',{t:t.title}))+'</p><input type="search" id="dshq" placeholder="'+E(T('sheet_find'))+'" value="'+E(SHEET.q||'')+'">'+
  (function(){var fm=f(mine),fd=f(dir).map(function(x,i){return [x,i]}).sort(function(a,b){return (isOn(b[0])?1:0)-(isOn(a[0])?1:0)||a[1]-b[1]}).map(function(x){return x[0]}),bk=(M.kinds||[]).indexOf('bank')>=0,allF=fm.concat(fd),allOn=allF.length&&allF.every(isOn),FD=fd.slice(0,100);SHEET.all=allF;
   var TS=cfg().top_sizes||[],rk=bk&&window.ArbCP?ArbCP.list().filter(function(c){return c.kind=='bank'&&c.bkind=='head'&&c.rank_assets}):[],rd=rk.length?rk[0].rank_date:'';
   return (rk.length&&TS.length?'<div class="dtopn">'+TS.map(function(n){return '<button type="button" class="pchip" data-btop="'+n+'">'+E(T('top_n',{n:n}))+'</button>'}).join('')+'<span class="sm">'+E(T('top_date',{d:rd.split('-').reverse().join('.')}))+'</span></div>':'')+(bk&&allF.length?'<button type="button" class="lbtn sec dwide2" data-bact="allbanks">'+E(allOn?T('unsel_all_banks'):T('sel_all_banks',{n:allF.length}))+'</button>':'')+
   (fm.length?'<div class="sm dsub">'+E(T('sheet_case'))+'</div>'+fm.map(it).join(''):'')+(fd.length?'<div class="sm dsub">'+E(T('sheet_dir'))+' · '+fd.length+'</div>'+FD.map(it).join('')+(fd.length>FD.length?'<p class="sm">'+E(T('shown',{a:FD.length,b:fd.length}))+'</p>':''):'')})()+(!mine.length&&!dir.length?'<p class="sm">'+E(T('sheet_empty'))+'</p>':'')+
  '<button type="button" class="lbtn sec dwide2" data-bact="manual">'+E(T('sheet_manual'))+'</button><div class="dact"><button type="button" class="lbtn sec" data-bact="pcancel">'+E(T('sheet_cancel'))+'</button><button type="button" class="lbtn" data-bact="pdone">'+E(T('sheet_done',{n:a.length}))+'</button></div></div>';
 if(!el){el=document.createElement('div');el.id='dsheet';el.className='dsheet dbatch';document.getElementById('vdocs').appendChild(el)}var foc=document.activeElement&&document.activeElement.id=='dshq';el.innerHTML=h;if(foc){var i=document.getElementById('dshq');i.focus();i.setSelectionRange(i.value.length,i.value.length)}}
/* ---- формирование ---- */
function fnPart(s){return String(s||'').replace(/[«»"“”„]/g,'').replace(/[\\\/]/g,'-').replace(/[:*?<>|]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,60)}
function caseNo(){var c=caseNow();return fnPart((c&&c.data.НОМЕР_ДЕЛА)||vget('НОМЕР_ДЕЛА','*')||'без-дела')}
function fname(p){return caseNo()+'_'+fnPart(p.no)+'_'+p.t.id+(p.a?'_'+fnPart(p.a.n):'')+'.docx'}
function dmy(){var d=new Date();return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()}
async function make(){if(BUSY)return;var c=common(),P=plan(),tot=missC(c)+sel().reduce(function(s,t){return s+missT(t,c.shared)},0);
 if(tot&&!confirm(T('confirm_miss',{n:nP(tot)})))return;if(P.length>(cfg().warn_over||30))A.toast(T('over',{n:P.length}));
 var o=oc(),sig=planSig(),reuse=B.issued&&B.issued.sig==sig,f0=first();BUSY=true;var out=[],cs=caseNow();
 try{for(var i=0;i<P.length;i++){var p=P[i];A.bar('<div class="dbi"><b>'+E(T('progress',{i:i,n:P.length}))+'</b></div>');
   A.setOV(OVfor(p,c));try{var blob=await A.docx(p.t),lh=!!A.lhFor(p.t);out.push({p:p,blob:blob,fn:fname(p),lh:lh})}catch(x){out.push({p:p,err:x.message})}finally{A.setOV(null)}}
  var okN=out.filter(function(r){return r.blob}).map(function(r){return r.p.i});
  if(!reuse){var last=okN.length?f0+Math.max.apply(null,okN):f0-1;if(o.next<=last)o.next=last+1;B.issued={sig:sig,first:f0}}
  var M=MU();sel().forEach(function(t){var m=mfield(t);if(m&&M[m].from_case){var s=S();s.bregions=s.bregions||[];(addrs(t)||[]).forEach(function(x){if(s.bregions.indexOf(x.n)<0)s.bregions.push(x.n)})}});A.save();
  if(window.ArbArch)for(var j=0;j<out.length;j++){var r=out[j];if(!r.blob)continue;try{await ArbArch.add({case:cs?cs.id:'',kind:'out',no:r.p.no,title:r.p.t.title,tid:r.p.t.id,addressee:r.p.a?r.p.a.n:'',blank:r.lh,signed:B.sign&&A.SIG().length>0,fname:r.fn,auto:true,batch:sig},r.blob,true)}catch(x){}}
  RES={out:out,zip:caseNo()+'_пакет_'+dmy()+'.zip'};B.scr='res'}finally{BUSY=false}render();window.scrollTo(0,document.getElementById('vdocs').offsetTop-60)}
async function zip(){var z=new JSZip();RES.out.forEach(function(r){if(r.blob)z.file(r.fn,r.blob)});A.saveBlob(await z.generateAsync({type:'blob'}),RES.zip)}
function vRes(){var c=caseNow(),out=RES.out,ok=out.filter(function(r){return r.blob}),gs=[],sh=common().shared;out.forEach(function(r){var g=gs.find(function(x){return x.t==r.p.t});if(!g)gs.push(g={t:r.p.t,items:[]});g.items.push(r)});
 var miss=gs.filter(function(g){return missT(g.t,sh)}),a=ok.length?ok[0].p.no:'',b=ok.length?ok[ok.length-1].p.no:'';
 var h='<div class="dbatch"><button type="button" class="lbtn sec" data-bact="form">'+E(T('res_back'))+'</button><div class="dhero"><span class="dhic">✓</span><div><h3 class="dth">'+E(T('res_title',{d:nD(ok.length)}))+'</h3><div class="sm">'+E([(c&&c.data.НОМЕР_ДЕЛА)||'',c?c.data.ДОЛЖНИК_НАИМЕНОВАНИЕ||'':'',a?'исх. № '+a+' – '+b:''].filter(Boolean).join(' · '))+'</div></div></div>'+
 '<div class="dact"><button type="button" class="lbtn" data-bact="zip">'+E(T('zip'))+'</button></div><div class="sm dmini"><span>'+E(B.blank&&A.LH().length?T('blank_on'):T('blank_off'))+'</span> <span>'+E(B.sign&&A.SIG().length?T('signed'):T('unsigned'))+'</span> <span>ZIP: <b>'+E(RES.zip)+'</b></span></div>'+
 (miss.length?'<p class="sm dnote warn">'+E(T('res_miss',{n:miss.length+' '+A.pl(miss.length,'шаблоне','шаблонах','шаблонах')}))+'</p>':'');
 gs.forEach(function(g){var m=missT(g.t,sh);h+='<div class="lot drg"><div class="d1">'+E(g.t.title)+(g.items.length>1?' <b class="dmul">× '+g.items.length+'</b>':'')+(m?' <span class="dst warn">'+m+'</span>':'')+'</div>'+g.items.map(function(r){var k=out.indexOf(r);return '<div class="dri"><span class="dno">№ '+E(r.p.no)+'</span><span class="dritx">'+E(r.p.a?r.p.a.n:g.t.kind)+'<span class="sm">'+(r.blob?E(r.fn):'<span class="ewarn">'+E(T('failed'))+': '+E(r.err)+'</span>')+'</span></span>'+(r.blob?'<button type="button" class="lbtn sec dib" data-bview="'+k+'" title="'+E(T('view'))+'" aria-label="'+E(T('view'))+'">👁</button><button type="button" class="lbtn sec dib" data-bdl="'+k+'" title="'+E(T('dl'))+'" aria-label="'+E(T('dl'))+'">⤓</button>':'')+'</div>'+(B.view==k?'<div class="dprev'+(r.lh?' dlhf':'')+'">'+viewHtml(r)+'</div>':'')}).join('')+'</div>'});
 h+='<p class="sm dnote">'+E(T('res_journal',{a:a,b:b,n:A.outFmt(oc().next,oc(),vget('ДАТА','*'))}))+'</p></div>';ROOT.innerHTML=h;A.bar('')}
function viewHtml(r){var c=common();A.setOV(OVfor(r.p,c));try{return A.htmlPrev(A.expandRowsText(A.TXT[r.p.t.id]||'',r.p.t),r.p.t)}finally{A.setOV(null)}}
function render(){if(!B)return;if(B.scr=='res')vRes();else vForm()}
var RT=0;function rerender(){clearTimeout(RT);RT=setTimeout(rerender0,0)}
function rerender0(){var y=window.scrollY,a=document.activeElement,id=a&&a.id,p=a&&a.selectionStart;render();window.scrollTo(0,y);if(id&&document.getElementById(id)){var e=document.getElementById(id);e.focus();try{e.setSelectionRange(p,p)}catch(x){}}}
/* ---- события ---- */
function bind(){var v=document.getElementById('vdocs');
 v.addEventListener('input',function(e){var i=e.target;if(!B||!i.closest('.dbatch'))return;
  if(i.id=='dshq'){SHEET.q=i.value;drawSheet();return}
  if(i.dataset.bk){vset(i.dataset.bk,i.dataset.btid,i.value);if(i.type!='date')softUpdate();return}
  if(i.dataset.bper){st().bper[i.dataset.bper]=i.value;A.save();softUpdate();return}
  if(i.dataset.brk){A.rows(A.X.templates.find(function(t){return t.id==i.dataset.brt}))[+i.dataset.brow][i.dataset.brk]=i.value;A.save();softUpdate();return}
  if(i.id=='dbfirst'){var n=parseInt(i.value,10);if(n>0){oc().next=n;B.issued=null;A.save();softUpdate()}return}
  if(i.id=='dbpfx'){oc().pfx=i.value;A.save();softUpdate();return}});
 v.addEventListener('change',function(e){var i=e.target;if(!B||!i.closest('.dbatch'))return;
  if(i.id=='dbmgr'){A.setMgr(i.value);return}
  if(i.dataset.bk&&i.type=='date'){rerender();return}
  if(i.id=='dbcase'){if(i.value=='__new'){var c={id:'c'+Date.now().toString(36),data:{}};S().cases.push(c);A.setCur(c.id);B.pc=1}else A.setCur(i.value);B.issued=null;B.opened=0;rerender();return}
  if(i.id=='dbfmt'){oc().fmt=i.value;A.save();rerender();return}
  if(i.dataset.bk||i.dataset.bper||i.dataset.brk||i.id=='dbfirst'||i.id=='dbpfx')rerender()});
 v.addEventListener('click',async function(e){if(!B)return;var me=e.target.closest('[data-mgredit]');if(me&&me.closest('.dbatch')){e.stopPropagation();A.showTab('cp');if(window.ArbCP&&ArbCP.editMgr)ArbCP.editMgr(me.dataset.mgredit);return}var b=e.target.closest('[data-btop],[data-bact],[data-bsw],[data-bfold],[data-brm],[data-bpick],[data-bpt],[data-bsavecp],[data-browadd],[data-browdel],[data-bview],[data-bdl]');
  if(!b){if(e.target.id=='dsheet'){SHEET=null;drawSheet();rerender()}return}if(!b.closest('.dbatch'))return;e.stopPropagation();var d=b.dataset,ts=A.X.templates;
  if(d.bsavecp!=null){e.preventDefault();var cs=caseNow(),t=ts.find(function(x){return x.id==SHEET.tid}),M=MU()[mfield(t)]||{};if(window.ArbCP){var cp=await ArbCP.quickAdd({name:d.bsavecp,roles:M.roles||[],cases:cs?[cs.id]:[]});var a0=addrs(t).find(function(x){return x.n==d.bsavecp});if(a0){a0.src='k';a0.cp=cp.id;A.save()}}drawSheet();return}
  if(d.bpt!=null){var t1=ts.find(function(x){return x.id==SHEET.tid}),a=addrs(t1),k=a.findIndex(function(x){return d.bcp?x.cp==d.bcp:(!x.cp&&x.n==d.bpt)});if(k<0)a.push({n:d.bpt,src:d.bcp?'k':'case',cp:d.bcp||undefined});else a.splice(k,1);A.save();B.issued=B.issued;drawSheet();return}
  if(d.bsw){B[d.bsw]=!B[d.bsw];S().bopt={blank:B.blank,sign:B.sign};A.save();rerender();return}
  if(d.bfold){B.open[d.bfold]=!B.open[d.bfold];rerender();return}
  if(d.brm){var q=d.brm.split('|'),t2=ts.find(function(x){return x.id==q[0]});addrs(t2).splice(+q[1],1);A.save();rerender();return}
  if(d.bpick){SHEET={tid:d.bpick,q:''};drawSheet();var Mb=MU()[mfield(ts.find(function(x){return x.id==d.bpick}))]||{};if(window.ArbCP&&ArbCP.ensureBanks&&(Mb.kinds||[]).indexOf('bank')>=0)ArbCP.ensureBanks().then(function(n){if(n&&SHEET)drawSheet()});return}
  if(d.browadd){A.rows(ts.find(function(x){return x.id==d.browadd})).push({});A.save();rerender();return}
  if(d.browdel){var r=d.browdel.split('|');A.rows(ts.find(function(x){return x.id==r[0]})).splice(+r[1],1);A.save();rerender();return}
  if(d.bview!=null){B.view=B.view==+d.bview?null:+d.bview;for(var z=0;z<sel().length;z++)try{await A.md(sel()[z])}catch(x){}rerender();return}
  if(d.bdl!=null){var rr=RES.out[+d.bdl];A.saveBlob(rr.blob,rr.fn);return}
  var a1=d.bact;
  if(a1=='list'){B=null;SHEET=null;drawSheet();A.showList();return}
  if(a1=='pc'){B.pc=!B.pc;rerender();return}
  if(a1=='make'){for(var w=0;w<sel().length;w++)try{await A.md(sel()[w])}catch(x){}await make();return}
  if(a1=='form'){B.scr='form';B.view=null;render();return}
  if(a1=='zip'){await zip();return}
  if(a1=='pcancel'){SHEET=null;drawSheet();rerender();return}
  if(a1=='pdone'){SHEET=null;drawSheet();rerender();return}
  if(d.btop){var t5=ts.find(function(x){return x.id==SHEET.tid}),a5=addrs(t5),N=+d.btop,L5=ArbCP.list().filter(function(c){return c.kind=='bank'&&c.bkind=='head'&&c.rank_assets&&c.rank_assets<=N}).sort(function(x,y){return x.rank_assets-y.rank_assets}).filter(function(c,i,L){return !L.slice(0,i).some(function(z){return z.rank_assets==c.rank_assets&&(z.inn&&z.inn==c.inn||!z.inn)})});
   L5.forEach(function(c){if(!a5.some(function(y){return y.cp==c.id}))a5.push({n:c.name,src:'k',cp:c.id})});A.save();drawSheet();return}
  if(a1=='allbanks'){var t4=ts.find(function(x){return x.id==SHEET.tid}),a4=addrs(t4),L4=SHEET.all||[],on4=L4.length&&L4.every(function(x){return a4.some(function(y){return x.cp?y.cp==x.cp:y.n==x.n})});
   if(on4){var ids={};L4.forEach(function(x){ids[x.cp||('n:'+x.n)]=1});for(var r4=a4.length-1;r4>=0;r4--)if(ids[a4[r4].cp||('n:'+a4[r4].n)])a4.splice(r4,1)}else L4.forEach(function(x){if(!a4.some(function(y){return x.cp?y.cp==x.cp:y.n==x.n}))a4.push({n:x.n,src:x.cp?'k':'m',cp:x.cp})});A.save();drawSheet();return}
  if(a1=='manual'){var tx=(SHEET.q||'').trim()||prompt(T('sheet_manual').replace(/^\+\s*/,''))||'';tx=tx.trim();if(!tx)return;var t3=ts.find(function(x){return x.id==SHEET.tid}),a3=addrs(t3);if(!a3.some(function(x){return x.n==tx}))a3.push({n:tx,src:'m'});SHEET.q='';A.save();drawSheet();return}});
 v.addEventListener('keydown',function(e){if(e.key=='Escape'&&SHEET){SHEET=null;drawSheet();rerender()}})}
var SU=0;function softUpdate(){clearTimeout(SU);SU=setTimeout(function(){if(!B||B.scr=='res')return;var a=document.activeElement;if(a&&a.closest&&a.closest('.dbatch')&&/INPUT|TEXTAREA/.test(a.tagName)){var c=common(),P=plan(),tot=missC(c)+sel().reduce(function(s,t){return s+missT(t,c.shared)},0);
 A.bar('<div class="dbi"><b>'+E(nD(P.length))+'</b><span class="sm'+(tot?' dwarn':'')+'">'+E(tot?T('bar_miss',{n:nP(tot)}):T('bar_ok'))+'</span></div><button type="button" class="lbtn dbgo" data-bact="make">'+E(T('make_docs',{n:P.length}))+'</button>');var w=a.closest('.dempty');if(w&&a.value)w.classList.remove('dempty')}else rerender()},250)}
window.ArbBatch={
 mount:function(el,api){A=api;ROOT=el;bind();document.getElementById('vdocs').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#dbbar [data-bact]');if(b&&B&&b.dataset.bact=='make'){e.stopPropagation();(async function(){for(var w=0;w<sel().length;w++)try{await A.md(sel()[w])}catch(x){}await make()})()}},true)},
 refresh:function(){if(B&&B.scr=='form')rerender()},
 open:function(ids){var o=S().bopt||{};B={ids:ids,open:{},blank:o.blank!=null?o.blank:A.LH().length>0,sign:o.sign!=null?o.sign:A.SIG().length>0,scr:'form',pc:!caseNow()};RES=null;render()},
 active:function(){return !!B},
 _t:{plan:function(){return plan()},common:common,fname:fname}
};
})();
