/* Arbitr App · Документы → пакетное формирование (макет batch_docs/spec.md).
   Значения пакета, номера и журнал — только на этом устройстве (localStorage + архив IndexedDB). */
(function(){
'use strict';
var A,ROOT,B=null,SHEET=null,RES=null,BUSY=false,PVI=null;
function E(s){return A.E(s)}function T(k,o){return A.BU(k,o)}
function cfg(){return A.C.batch||{}}function MU(){return cfg().multi||{}}function PER(t){return (cfg().per_addressee||{})[t.id]||[]}
function F(k){return A.F[k]||{k:k,label:k,scope:'document',type:'text'}}
function scope(k){return F(k).scope||'document'}function opt(k){return !!F(k).optional||!!(A.dtOpt&&A.dtOpt(k))}
function nP(n){return n+' '+A.pl(n,'поле','поля','полей')}function nD(n){return n+' '+A.pl(n,'документ','документа','документов')}function nT(n){return n+' '+A.pl(n,'шаблон','шаблона','шаблонов')}
function S(){return A.S()}
function st(){var s=S();s.bvals=s.bvals||{'*':{}};s.bper=s.bper||{};s.baddr=s.baddr||{};return s}
function TDF(k){var c=A.C||{};return c.date_default=='today'&&(c.date_today_fields||['ДАТА']).indexOf(k)>=0}
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function sel(){return A.X.templates.filter(function(t){return B.ids.indexOf(t.id)>=0})}
function caseNow(){return A.curCase()}
/* ---- поля пакета ---- */
function common(){var ts=sel(),U={},cnt={};ts.forEach(function(t){t.fields.forEach(function(k){if(A.RF(t).indexOf(k)>=0)return;U[k]=1;if(scope(k)=='document')cnt[k]=(cnt[k]||0)+1})});
 var ord=function(sc,o){return (o||[]).filter(function(k){return U[k]&&scope(k)==sc}).concat(Object.keys(U).filter(function(k){return scope(k)==sc&&(o||[]).indexOf(k)<0}))};
 return {prof:ord('profile',A.C.profile_order),cas:ord('case',A.C.case_order).filter(function(k){return !(A.dtSkip&&A.dtSkip(k))}),shared:Object.keys(cnt).filter(function(k){return cnt[k]>=2&&k!='ИСХ_НОМЕР'&&!MU()[k]}).sort(function(a,b){return F(a).label.localeCompare(F(b).label,'ru')})}}
/* 29.10 (QA п.7): список незаполненного для панели перед формированием — тот же счёт, что missC/missT */
function missList(c){var L=[],lb=function(k){return F(k).label||k};
 c.prof.concat(c.cas).forEach(function(k){if(!opt(k)&&!vget(k,'*')&&!(k=='ВИД_УПРАВЛЯЮЩЕГО'&&vget('ПРОЦЕДУРА','*')))L.push({k:k,tid:'*',cas:c.cas.indexOf(k)>=0,l:lb(k)})});
 c.shared.forEach(function(k){if(!opt(k)&&!vget(k,'*'))L.push({k:k,tid:'*',l:lb(k)})});
 sel().forEach(function(t){own(t,c.shared).forEach(function(k){if(!opt(k)&&!vget(k,t.id))L.push({k:k,tid:t.id,l:T('miss_in',{f:lb(k),t:t.title})})});if(A.RF(t).length&&!A.rowsFilled(t).length)L.push({tid:t.id,l:T('miss_rows',{t:t.title})});var a=addrs(t);
  if(a){if(!a.length)L.push({tid:t.id,l:T('miss_addr',{t:t.title})});PER(t).forEach(function(k){a.forEach(function(x){if(!opt(k)&&!pget(t,x,k))L.push({tid:t.id,l:T('miss_in',{f:lb(k),t:t.title+' · '+dn(x)})})})})}});return L}
function askMiss(L){return new Promise(function(res){var d=document.getElementById('dbmiss');if(!d){d=document.createElement('dialog');d.id='dbmiss';d.setAttribute('aria-labelledby','dbmq');document.body.appendChild(d)}
 var mx=+(cfg().miss_list_max||8),sh=L.slice(0,mx);
 d.innerHTML='<h3 id="dbmq">'+E(T('miss_title',{n:nP(L.length)}))+'</h3><p class="sm">'+E(T('miss_lead'))+'</p><ul class="dbml">'+sh.map(function(x,i){return '<li><button type="button" class="link" data-mi="'+i+'">'+E(x.l)+'</button></li>'}).join('')+(L.length>mx?'<li class="sm">'+E(T('miss_more',{n:L.length-mx}))+'</li>':'')+'</ul><div class="dbmb"><button type="button" class="lbtn" data-mm="go">'+E(T('miss_go'))+'</button><button type="button" class="lbtn sec" data-mm="make">'+E(T('miss_anyway'))+'</button><button type="button" class="lbtn sec" data-mm="no">'+E(T('miss_cancel'))+'</button></div>';
 d.classList.toggle('sheet',innerWidth<=(+(cfg().miss_sheet_max_px)||699));
 var done=function(v){d.onclick=null;d.oncancel=null;try{d.close()}catch(e){}res(v)};
 d.oncancel=function(e){e.preventDefault();done(false)};
 d.onclick=function(e){if(e.target===d)return done(false);var b=e.target.closest('button');if(!b)return;if(b.dataset.mm=='make')return done(true);if(b.dataset.mm=='no')return done(false);var x=b.dataset.mi!=null?sh[+b.dataset.mi]:L[0];done(false);if(x)goField(x)};
 try{d.showModal()}catch(e){d.setAttribute('open','')}var g=d.querySelector('[data-mm=go]');if(g)g.focus()})}
function goField(x){if(x.tid!='*')B.open[x.tid]=true;else if(x.cas)B.pc=true;rerender();setTimeout(function(){var el=x.k?document.getElementById('db_'+(x.tid=='*'?'c':x.tid)+'_'+x.k):null;if(!el)el=document.getElementById('dbs-'+x.tid)||document.querySelector('#ded .dempty input,#ded .dempty textarea,#ded .dempty select');if(el){el.scrollIntoView({block:'center'});if(el.focus)try{el.focus({preventScroll:true})}catch(e){}}},60)}
function own(t,sh){return t.fields.filter(function(k){return scope(k)=='document'&&k!='ИСХ_НОМЕР'&&sh.indexOf(k)<0&&!MU()[k]&&PER(t).indexOf(k)<0&&A.RF(t).indexOf(k)<0})}
function vget(k,tid){var s=st();if(scope(k)=='profile')return A.raw(k,'');if(scope(k)=='case'){var c=caseNow();return c?A.raw(k,''):(s.bvals['*'][k]||'')}
 var o=s.bvals[tid]||{};if(tid!='*'&&o[k]!=null)return o[k];var v=s.bvals['*'][k];if(v!=null&&tid=='*')return v;if(tid=='*')return TDF(k)?today():'';
 var d=(S().drafts[tid]||{})[k];if(!d&&window.ArbAF){var w=ArbAF.doc(tid,k,function(x){return x==k?'':vget(x,tid)});if(w&&w.v)return w.v}return d||(TDF(k)?(s.bvals['*'][k]||today()):'')}
function vset(k,tid,v){var s=st();if(scope(k)=='profile'||scope(k)=='case'&&caseNow()){A.setVal(k,v);return}if(scope(k)=='case'){s.bvals['*'][k]=v;A.save();return}(s.bvals[tid]=s.bvals[tid]||{})[k]=v;A.save()}
function mfield(t){return A.multiOf(t)}
function addrs(t){var s=st(),c=caseNow(),key=(c?c.id:'')+'|'+t.id,m=mfield(t);if(!m)return null;
 if(!s.baddr[key]){var M=MU()[m]||{},L=[];if(M.from_case){var r=c?c.data[m]:'';if(r)L.push({n:r,src:'case'})}
  else if(window.ArbCP&&c)ArbCP.pick(M.roles,c.id).filter(function(x){return (x.cases||[]).indexOf(c.id)>=0}).forEach(function(x){L.push({n:x.name,src:'k',cp:x.id})});s.baddr[key]=L}
 return s.baddr[key]}
function dn(a){return a?(a.dn||a.n):''}
function pkey(t,a,k){return t.id+'|'+a.n+'|'+k}
function pget(t,a,k){var s=st(),v=s.bper[pkey(t,a,k)];if(v!=null)return v;var pf=(cfg().per_from_card||{})[k];if(pf&&a.cp&&window.ArbCP){var c=ArbCP.get(a.cp);if(c&&c[pf])return c[pf]}var w=window.ArbAF&&ArbAF.per(t,a,k);return w&&w.v?w.v:''}  // ArbAF: из справочника органов / «Контрагентов» (docs_config.json → af_fields)
function docsOf(t){var a=addrs(t);return a&&a.length?a.length:1}
function missT(t,sh){var n=0;own(t,sh).forEach(function(k){if(!opt(k)&&!vget(k,t.id))n++});if(A.RF(t).length&&!A.rowsFilled(t).length)n++;var a=addrs(t);
 if(a){if(!a.length)n++;PER(t).forEach(function(k){a.forEach(function(x){if(!opt(k)&&!pget(t,x,k))n++})})}return n}
function missC(c){var n=0;c.prof.concat(c.cas).forEach(function(k){if(!opt(k)&&!vget(k,'*')&&!(k=='ВИД_УПРАВЛЯЮЩЕГО'&&vget('ПРОЦЕДУРА','*')))n++});c.shared.forEach(function(k){if(!opt(k)&&!vget(k,'*'))n++});return n}
/* ---- номера ---- */
function oc(){return A.outCfg(caseNow())}
function planSig(){return (caseNow()?caseNow().id:'')+'#'+sel().map(function(t){var a=addrs(t);return t.id+(a?':'+a.map(function(x){return x.dk||x.n}).join(','):'')}).join(';')}
function first(){var o=oc();return B.issued&&B.issued.sig==planSig()?B.issued.first:o.next}
function no(i){return A.outFmt(first()+i,oc(),vget('ДАТА','*'))}
function plan(){var out=[],i=0;sel().forEach(function(t){var a=addrs(t);(a&&a.length?a:[null]).forEach(function(x,j){out.push({t:t,a:x,j:j,i:i,no:no(i)});i++})});return out}
function OVfor(p,c){var v={},t=p.t,s=st();c.shared.forEach(function(k){v[k]=vget(k,'*')});if(!caseNow())c.cas.forEach(function(k){v[k]=vget(k,'*')});
 own(t,c.shared).forEach(function(k){v[k]=vget(k,t.id)});var m=mfield(t);if(m&&p.a){v[m]=p.a.n;v.АДРЕСАТ_АДРЕС=p.a.addr||''}if(p.a)PER(t).forEach(function(k){v[k]=pget(t,p.a,k)});v.ИСХ_НОМЕР=p.no;
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
  (cs?'<div class="sm dmini"><span>'+E(T('proc'))+': <b>'+E(cs.data.ПРОЦЕДУРА||'—')+'</b></span> <span>'+E(T('court'))+': <b>'+E(cs.data.СУД||'—')+'</b></span> '+(cp?'<span>'+E(T('kontr'))+': <b>'+cp+'</b></span>':'')+'</div>':'')+
  sw('blank',B.blank,T('blank'),T('blank_sub'),!A.LH().length)+'</div>';
 h+='<div class="lot dcard"><h4 class="dsh">'+E(T('common'))+' '+stc(cm)+'</h4><p class="sm">'+E(T('common_sub'))+'</p>'+(c.shared.length?'<div class="sm dsub">'+E(T('for_all'))+'</div><div class="g2">'+c.shared.map(function(k){return fld(k,'*')}).join('')+'</div>':'');
 var fmts=cfg().out_formats||['{n}/{yy}'],used=window.ArbArch?ArbArch.usedIn(cs?cs.id:'',first(),first()+P.length-1,planSig()):[];
 h+='<div class="sm dsub">'+E(T('nums'))+'</div><div class="g2"><div><label for="dbfirst">'+E(T('first'))+'</label><input id="dbfirst" inputmode="numeric" value="'+first()+'"></div><div><label for="dbfmt">'+E(T('fmtl'))+'</label><select id="dbfmt">'+fmts.map(function(f){return '<option value="'+E(f)+'"'+(o.fmt==f?' selected':'')+'>'+E(A.outFmt(first(),{fmt:f,pfx:o.pfx||'А'},vget('ДАТА','*')))+'</option>'}).join('')+'</select></div>'+(/\{p\}/.test(o.fmt)?'<div><label for="dbpfx">'+E(T('pfx'))+'</label><input id="dbpfx" value="'+E(o.pfx||'')+'"></div>':'')+'</div>'+
  '<p class="sm">'+E(T('preview_nums',{a:P[0].no,b:P[P.length-1].no,d:nD(P.length),n:A.outFmt(first()+P.length,o,vget('ДАТА','*'))}))+'</p>'+(used.length?'<p class="sm ewarn">'+E(T('used_warn',{a:used[0],b:used[used.length-1]}))+'</p>':'');
 if(B.pc)h+='<div class="sm dsub">'+E(T('case_t'))+' · '+nP(c.cas.length)+' <button type="button" class="adall" data-bact="pc">'+E(T('hide'))+'</button></div><div class="g2">'+c.cas.map(function(k){return fld(k,'*',cs?'из дела':'')}).join('')+'</div>';
 else h+='<button type="button" class="dfoldl" data-bact="pc">'+E(T('prof_case',{c:nP(c.cas.length),p:(function(){var m=A.curMgr&&A.curMgr();return (m&&m.f&&m.f.ФИО_УПРАВЛЯЮЩЕГО)||vget('ФИО_УПРАВЛЯЮЩЕГО','*')||T('prof_none')})()}))+' ›</button>';
 h+='</div><h4 class="dsh">'+E(T('docs'))+'</h4>';
 secs.forEach(function(s){var t=s.t,a=addrs(t),m=mfield(t),op=!!B.open[t.id],ow=own(t,c.shared),nos=s.n>1?'исх. № '+no(s.from)+' – '+no(s.from+s.n-1):'исх. № '+no(s.from);
  h+='<div class="lot dsec'+(s.m?' warn':'')+(op?' open':'')+'" id="dbs-'+E(t.id)+'"><button type="button" class="dsech" data-bfold="'+E(t.id)+'" aria-expanded="'+op+'"><span class="d1">'+E(t.title)+(s.n>1?' <b class="dmul">× '+s.n+'</b>':'')+'</span><span class="sm">'+stc(s.m)+' '+E(nos)+'</span><span class="dchev" aria-hidden="true">›</span></button>';
  if(op){h+='<div class="dsecb">';
   if(m){h+='<div class="sm dsub">'+E(T('addr_t'))+'</div><div class="dacs">'+a.map(function(x,i){return '<span class="dac"><span>'+E(dn(x))+'</span>'+(x.src=='m'?' <i>'+E(T('manual'))+'</i>':'')+'<button type="button" data-brm="'+E(t.id)+'|'+i+'" aria-label="Убрать">✕</button></span>'}).join('')+'<button type="button" class="dac add" data-bpick="'+E(t.id)+'">+ '+E(T('addr_add'))+'</button></div><p class="sm">'+E(T('addr_sub',{f:F(m).label}))+'</p>';
    if(PER(t).length)a.forEach(function(x,i){h+='<div class="lot dpa"><div class="dpah"><b>'+E(x.n)+'</b><span class="sm">исх. № '+E(no(s.from+i))+'</span></div><div class="g2">'+PER(t).map(function(k){var v=pget(t,x,k),f=F(k),em=!v&&!opt(k);return '<div class="'+(f.type=='textarea'?'dwide ':'')+(em?'dempty':'')+'"><label>'+E(f.label)+'</label>'+(f.type=='textarea'?'<textarea rows="2" data-bper="'+E(pkey(t,x,k))+'">'+E(v)+'</textarea>':'<input data-bper="'+E(pkey(t,x,k))+'" value="'+E(v)+'"'+(em?' placeholder="Заполните"':'')+'>')+'</div>'}).join('')+'</div></div>'})}
   if(ow.length)h+='<div class="sm dsub">'+E(T('own'))+'</div><div class="g2">'+ow.map(function(k){return fld(k,t.id)}).join('')+'</div>';else if(!m&&!A.RF(t).length)h+='<p class="sm">'+E(T('no_own'))+'</p>';
   h+=rowsBlock(t)+'</div>'}
  h+='</div>'});
 h+='</div></div></div>';ROOT.innerHTML=h;
 A.bar('<div class="dbi"><b>'+E(nD(P.length))+'</b><span class="sm'+(tot?' dwarn':'')+'">'+E(tot?T('bar_miss',{n:nP(tot)}):T('bar_ok'))+'</span></div>'+(A.fmtSeg?A.fmtSeg():'')+'<button type="button" class="lbtn dbgo" data-bact="make">'+E(T('make_docs',{n:P.length}))+'</button>');drawSheet()}
/* ---- выбор адресатов ---- */
function dirSec(t,a,q){if(!window.ArbCP||!ArbCP.dirOrgs)return '';var m=mfield(t),cs=caseNow(),D=ArbCP.dirOrgs(t.id,cs?(cs.data.РЕГИОН||cs.data.ДОЛЖНИК_АДРЕС||''):vget('РЕГИОН','*'));if(!D)return '';
 if(D.loading){ArbCP.addrLoad().then(function(){if(SHEET&&SHEET.tid==t.id)drawSheet()});return '<p class="sm">…</p>'}if(!D.tf||D.tf!=m)return '';
 var f=function(L){return L.filter(function(x){return !q||(x.o.name+' '+(x.o.address||'')+' '+(x.o.code||'')).toLowerCase().indexOf(q)>=0})},on=function(x){return a.some(function(y){return y.dk==x.k})},
  it=function(x){var o=on(x);return '<div class="dshit" data-bdo="'+x.i+'"><span class="adcb'+(o?' on':'')+'" role="checkbox" aria-checked="'+o+'"></span><div><b>'+E(x.o.name)+'</b><div class="sm">'+E(ArbCP.orgLine(x.o))+'</div>'+(x.o.verify?'<div class="sm ewarn">проверить адрес</div>':'')+'</div></div>'},
  srt=function(L){return L.map(function(x,j){return [x,j]}).sort(function(u,w){return (on(w[0])?1:0)-(on(u[0])?1:0)||u[1]-w[1]}).map(function(x){return x[0]})},
  r1=srt(f(D.inR)),r2=srt(f(D.other)),LIM=q?80:40,s2=r2.slice(0,Math.max(0,LIM-r1.length));
 return '<div class="sm dsub ddirh">'+E(T('dir_t'))+' · '+E(D.label)+'</div>'+(r1.length?'<div class="sm dsub">'+E(T('dir_inr'))+' · '+r1.length+'</div>'+r1.map(it).join(''):'')+(s2.length?'<div class="sm dsub">'+E(r1.length?T('dir_oth'):T('dir_all'))+' · '+r2.length+'</div>'+s2.map(it).join('')+(r2.length>s2.length?'<p class="sm">'+E(T('dir_more',{a:s2.length,b:r2.length}))+'</p>':''):'')}
/* d6: адресаты по регионам (addressee_types шаблона): «Федеральные» — по 1 документу; регионы — три состояния, «k из n», раскрытие по нажатию на название */
function regSec(t,a){var ty=t.addressee_types||[];if(!ty.length||!window.ArbCP||!ArbCP.typeOrgs)return null;var cs=caseNow(),D=ArbCP.typeOrgs(ty,cs&&cs.id);if(!D)return null;
 if(D.loading){ArbCP.addrLoad().then(function(){if(SHEET&&SHEET.tid==t.id)drawSheet()});return '<p class="sm">…</p>'}
 var on=function(x){return a.some(function(y){return y.dk==x.k})},q=String(SHEET.rq||'').toLowerCase(),R=D.R,rx=SHEET.rx=SHEET.rx||{};
 if(!SHEET.rinit){SHEET.rinit=1;for(var z=a.length-1;z>=0;z--)if(a[z].src=='case')a.splice(z,1);if(!a.some(function(y){return y.dk})&&D.caseK.length){D.caseK.forEach(function(k){(D.reg[k]||[]).forEach(function(x){addOrg(t,a,x)})});A.save()}}
 var it=function(x){var o=on(x);return '<div class="dshit" data-bdo2="'+x.i+'"><span class="adcb'+(o?' on':'')+'" role="checkbox" aria-checked="'+o+'"></span><div><b>'+E(x.o.name)+'</b><div class="sm">'+E(ArbCP.orgLine(x.o))+'</div></div></div>'};
 var h='';
 if(D.fed.length)h+='<div class="sm dsub ddirh">'+E(T('fed_t'))+'</div><p class="sm">'+E(T('fed_h'))+'</p>'+D.fed.map(it).join('');
 var ks=Object.keys(D.reg),first=D.caseK.filter(function(k,i){return D.caseK.indexOf(k)==i}).concat(D.checked.filter(function(k){return D.caseK.indexOf(k)<0&&D.reg[k]})),rest=ks.filter(function(k){return first.indexOf(k)<0}).sort(function(x,y){return R[x].n.localeCompare(R[y].n,'ru')});
 var vis=function(k){return !q||R[k].n.toLowerCase().indexOf(q)>=0||(D.reg[k]||[]).some(function(x){return x.o.name.toLowerCase().indexOf(q)>=0})},row=function(k){var L=D.reg[k]||[],n=L.filter(on).length,st=n==0?'':n==L.length?'on':'mix';
  return '<div class="dbrg"><span class="adcb '+st+'" role="checkbox" aria-checked="'+(st=='on'?'true':st=='mix'?'mixed':'false')+'" tabindex="0" data-brg="'+k+'" aria-label="'+E(R[k].n)+'"></span><button type="button" class="dbrgn" data-brgx="'+k+'" aria-expanded="'+!!rx[k]+'"><b>'+E(R[k].n)+'</b>'+(D.caseK.indexOf(k)>=0?' <span class="sm dbrgc">'+E(T('from_card'))+'</span>':'')+'</button><span class="sm dbrgk">'+E(T('k_of_n',{k:n,n:L.length}))+'</span></div>'+(rx[k]?'<div class="dbrgl">'+L.map(it).join('')+'</div>':'')};
 var V=first.concat(rest).filter(vis);
 h+='<div class="sm dsub ddirh">'+E(T('reg_t'))+' · '+E(D.labels.join(', '))+'</div><div class="dbrgbar"><input type="search" id="dbrq" placeholder="'+E(T('reg_search'))+'" value="'+E(SHEET.rq||'')+'" autocomplete="off"><button type="button" class="adall" data-bact="rgsel"'+(V.every(function(k){return (D.reg[k]||[]).every(on)})?' disabled':'')+'>'+E(T('sel_all'))+'</button><button type="button" class="adall" data-bact="rgunsel"'+(V.some(function(k){return (D.reg[k]||[]).some(on)})?'':' disabled')+'>'+E(T('unsel_all'))+'</button></div>'+
  V.map(row).join('')+(V.length?'':'<p class="sm">'+E(T('reg_nf'))+'</p>');
 SHEET.vreg=V;SHEET.D=D;return h}
function addOrg(t,a,x){if(a.some(function(y){return y.dk==x.k}))return;var m=mfield(t);a.push({n:x.tf&&x.tf==m?ArbCP.dirVal(x.o,x.tf):x.o.name,src:'d',dk:x.k,dn:x.o.name,addr:[x.o.index,x.o.address].filter(Boolean).join(', ')})}
function delOrg(a,x){var i=a.findIndex(function(y){return y.dk==x.k});if(i>=0)a.splice(i,1)}
function drawSheet(){var el=document.getElementById('dsheet');if(!SHEET){if(el)el.remove();return}var t=A.X.templates.find(function(x){return x.id==SHEET.tid}),m=mfield(t),M=MU()[m]||{},a=addrs(t),cs=caseNow(),q=(SHEET.q||'').toLowerCase();
 var mine=[],dir=[];if(M.from_case){var seen={};S().cases.forEach(function(c){var r=c.data[m];if(r&&!seen[r]){seen[r]=1;(cs&&c.id==cs.id?mine:dir).push({n:r})}});(S().bregions||[]).forEach(function(r){if(!seen[r]){seen[r]=1;dir.push({n:r})}})}
 else if(window.ArbCP)ArbCP.pick(M.roles,cs&&cs.id,M.kinds).forEach(function(x){((cs&&(x.cases||[]).indexOf(cs.id)>=0)?mine:dir).push({n:x.name,cp:x.id,inn:x.inn,bik:x.bik})});
 a.forEach(function(x){if(!mine.concat(dir).some(function(y){return x.cp?y.cp==x.cp:y.n==x.n}))mine.push({n:x.n,manual:x.src=='m'})});
 var f=function(L){return L.filter(function(x){return !q||x.n.toLowerCase().indexOf(q)>=0||(x.bik||'').indexOf(q)==0||(x.inn||'').indexOf(q)==0})},isOn=function(x){return a.some(function(y){return x.cp?y.cp==x.cp:(!y.cp&&!y.dk&&y.n==x.n)})},it=function(x){var on=isOn(x);return '<div class="dshit" data-bpt="'+E(x.n)+'"'+(x.cp?' data-bcp="'+E(x.cp)+'"':'')+'><span class="adcb'+(on?' on':'')+'" role="checkbox" aria-checked="'+on+'"></span><div><b>'+E(x.n)+'</b>'+(x.bik||x.inn?'<div class="sm">'+E([x.bik?'БИК '+x.bik:'',x.inn?'ИНН '+x.inn:''].filter(Boolean).join(' · '))+'</div>':'')+(x.manual?'<div class="sm">'+E(T('manual'))+' · <button type="button" class="adall" data-bsavecp="'+E(x.n)+'">'+E(T('sheet_save_cp'))+'</button></div>':'')+'</div></div>'};
 var h='<div class="dsh2" role="dialog" aria-modal="true"><div class="dgrab"></div><h4>'+E(T('sheet_t',{t:M.label||F(m).label}))+'</h4><p class="sm">'+E(T('sheet_sub',{t:t.title}))+'</p><div id="dshcb"></div>'+
  (function(){if(t.addressee_types&&t.addressee_types.length&&window.ArbCP&&ArbCP.typeOrgs&&ArbCP.typeOrgs(t.addressee_types,cs&&cs.id))return '';var fm=f(mine),fd=f(dir).map(function(x,i){return [x,i]}).sort(function(a,b){return (isOn(b[0])?1:0)-(isOn(a[0])?1:0)||a[1]-b[1]}).map(function(x){return x[0]}),bk=(M.kinds||[]).indexOf('bank')>=0,allF=fm.concat(fd),allOn=allF.length&&allF.every(isOn),FD=fd.slice(0,100);SHEET.all=allF;
   var TS=cfg().top_sizes||[],rk=bk&&window.ArbCP?ArbCP.list().filter(function(c){return c.kind=='bank'&&c.bkind=='head'&&c.rank_assets}):[],rd=rk.length?rk[0].rank_date:'';
   return (rk.length&&TS.length?'<div class="dtopn">'+TS.map(function(n){return '<button type="button" class="pchip" data-btop="'+n+'">'+E(T('top_n',{n:n}))+'</button>'}).join('')+'<span class="sm">'+E(T('top_date',{d:rd.split('-').reverse().join('.')}))+'</span></div>':'')+(bk&&allF.length?'<button type="button" class="lbtn sec dwide2" data-bact="allbanks">'+E(allOn?T('unsel_all_banks'):T('sel_all_banks',{n:allF.length}))+'</button>':'')+
   (fm.length?'<div class="sm dsub">'+E(T('sheet_case'))+'</div>'+fm.map(it).join(''):'')+(fd.length?'<div class="sm dsub">'+E(T('sheet_dir'))+' · '+fd.length+'</div>'+FD.map(it).join('')+(fd.length>FD.length?'<p class="sm">'+E(T('shown',{a:FD.length,b:fd.length}))+'</p>':''):'')})()+(!mine.length&&!dir.length?'<p class="sm">'+E(T('sheet_empty'))+'</p>':'')+
  (function(){var rs=regSec(t,a);return rs!=null?rs:dirSec(t,a,q)})()+
  '<button type="button" class="lbtn sec dwide2" data-bact="manual">'+E(T('sheet_manual'))+'</button><div class="dact"><button type="button" class="lbtn sec" data-bact="pcancel">'+E(T('sheet_cancel'))+'</button><button type="button" class="lbtn" data-bact="pdone">'+E(T('sheet_done',{n:a.length}))+'</button></div><div class="dshfoot"><b>'+E(T('will_make',{n:a.length}))+'</b><span class="sm">'+E(T('picked_n',{n:a.length}))+'</span></div></div>';
 if(!el){el=document.createElement('div');el.id='dsheet';el.className='dsheet dbatch';document.getElementById('vdocs').appendChild(el)}var cbf=SHEET.cbn&&SHEET.cbn.contains(document.activeElement)?document.activeElement:null;el.innerHTML=h;var host=el.querySelector('#dshcb');
 if(host&&window.ArbCP&&ArbCP.combo){if(SHEET.cbn&&SHEET.cbt==SHEET.tid){host.parentNode.replaceChild(SHEET.cbn,host);if(cbf)cbf.focus()}else{ArbCP.combo(host,{tid:t.id,field:m,multi:true,caseId:cs&&cs.id,region:cs?(cs.data.РЕГИОН||cs.data.ДОЛЖНИК_АДРЕС||''):vget('РЕГИОН','*'),label:T('cb_label'),onPick:function(x){cbAdd(t,x)}});SHEET.cbn=host;SHEET.cbt=SHEET.tid}}}
/* d5: выбор адресата через общий компонент подсказок (тот же, что в форме документа) */
function cbAdd(t,x){var a=addrs(t),m=mfield(t),it;if(x.src=='d'){var o=ArbCP.dirOrg(x.i),D=ArbCP.dirOrgs(t.id,'');if(!o)return;it={n:D&&D.tf?ArbCP.dirVal(o,D.tf):(x.val||o.name),src:'d',dk:x.dk,dn:o.name,addr:x.addr}}
 else if(x.src=='k')it={n:x.n,src:'k',cp:x.cp,addr:x.addr};else it={n:x.n,src:'m',addr:x.addr||''};
 if(!a.some(function(y){return it.dk?y.dk==it.dk:it.cp?y.cp==it.cp:(!y.cp&&!y.dk&&y.n==it.n)}))a.push(it);A.save();drawSheet()}
/* ---- формирование ---- */
function fnPart(s){return String(s||'').replace(/[«»"“”„]/g,'').replace(/[\\\/]/g,'-').replace(/[:*?<>|]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,60)}
function caseNo(){var c=caseNow();return fnPart((c&&c.data.НОМЕР_ДЕЛА)||vget('НОМЕР_ДЕЛА','*')||'без-дела')}
function fname(p){return caseNo()+'_'+fnPart(p.no)+'_'+p.t.id+(p.a?'_'+fnPart(p.a.src=='d'?p.a.n:dn(p.a)).slice(0,60):'')+'.docx'}
function dmy(){var d=new Date();return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()}
async function make(){if(BUSY)return;var c=common(),P=plan(),tot=missC(c)+sel().reduce(function(s,t){return s+missT(t,c.shared)},0);
 if(tot){var ML=missList(c);if(!(await askMiss(ML.length?ML:[{tid:'*',l:T('confirm_miss',{n:nP(tot)})}])))return}   /* 29.10 (QA п.7): своя панель со списком вместо confirm() */if(P.length>(cfg().warn_over||30))A.toast(T('over',{n:P.length}));
 var FW=[],o=oc(),sig=planSig(),reuse=B.issued&&B.issued.sig==sig,f0=first();BUSY=true;var out=[],cs=caseNow();
 try{for(var i=0;i<P.length;i++){var p=P[i];A.bar('<div class="dbi"><b>'+E(T('progress',{i:i,n:P.length}))+'</b></div>');
   A.setOV(OVfor(p,c));try{var sg0=B.sign&&A.SIG().length&&A.sigFor?A.sigFor(p.t):null,blob=await A.docx(p.t),lh=!!A.lhFor(p.t),fo=A.mkFiles?await A.mkFiles(p.t,blob):{docx:blob};if(fo.warn)FW.push(p.t.title);out.push({p:p,blob:blob,fo:fo,fn:fname(p),lh:lh,sg:sg0&&sg0.url})}catch(x){out.push({p:p,err:x.message})}finally{A.setOV(null)}}
  var okN=out.filter(function(r){return r.blob}).map(function(r){return r.p.i});
  if(!reuse){var last=okN.length?f0+Math.max.apply(null,okN):f0-1;if(o.next<=last)o.next=last+1;B.issued={sig:sig,first:f0}}
  var M=MU();sel().forEach(function(t){var m=mfield(t);if(m&&M[m].from_case){var s=S();s.bregions=s.bregions||[];(addrs(t)||[]).filter(function(x){return !x.dk}).forEach(function(x){if(s.bregions.indexOf(x.n)<0)s.bregions.push(x.n)})}});A.save();
  var arN=0,arE='';if(window.ArbArch)for(var j=0;j<out.length;j++){var r=out[j];if(!r.blob)continue;try{await ArbArch.add({doc_date:(function(v){return /^\d{4}-\d\d-\d\d$/.test(v)?v.split('-').reverse().join('.'):v})(vget('ДАТА','*')||''),case:cs?cs.id:'',kind:'out',mgr:(A.curMgr()||{f:{}}).f.ФИО_УПРАВЛЯЮЩЕГО||'',debtor:cs?'':vget('ДОЛЖНИК_НАИМЕНОВАНИЕ','*'),debtor_inn:cs?'':vget('ДОЛЖНИК_ИНН','*'),no:r.p.no,title:r.p.t.title,tid:r.p.t.id,addressee:r.p.a?dn(r.p.a):'',blank:r.lh,signed:B.sign&&A.SIG().length>0,fname:r.fo&&!r.fo.docx?A.pdfName(r.fn):r.fn,pdf_fname:A.pdfName?A.pdfName(r.fn):undefined,auto:true,batch:sig},r.fo?r.fo.docx:r.blob,true,r.fo&&r.fo.pdf?{pdf:r.fo.pdf}:null);arN++}catch(x){arE=x.message}}if(window.ArbArch&&ArbArch.notify)ArbArch.notify(arE&&!arN?0:arN,arE&&!arN?arE:'')
  if(FW.length)A.toast(((A.C.pdf||{}).warn_batch||'PDF не построен для: {t} — для них сохранён Word').replace('{t}',FW.filter(function(v,i,a){return a.indexOf(v)==i}).join(', ')));
  RES={out:out,zip:caseNo()+'_пакет_'+dmy()+'.zip'};B.scr='res'}finally{BUSY=false}render();window.scrollTo(0,document.getElementById('vdocs').offsetTop-60)}
async function zip(){var z=new JSZip();RES.out.forEach(function(r){if(!r.blob)return;var fo=r.fo||{docx:r.blob};if(fo.docx)z.file(r.fn,fo.docx);if(fo.pdf)z.file(A.pdfName(r.fn),fo.pdf)});A.saveBlob(await z.generateAsync({type:'blob'}),RES.zip)}
function vRes(){var c=caseNow(),out=RES.out,ok=out.filter(function(r){return r.blob}),gs=[],sh=common().shared;out.forEach(function(r){var g=gs.find(function(x){return x.t==r.p.t});if(!g)gs.push(g={t:r.p.t,items:[]});g.items.push(r)});
 var miss=gs.filter(function(g){return missT(g.t,sh)}),a=ok.length?ok[0].p.no:'',b=ok.length?ok[ok.length-1].p.no:'';
 var h='<div class="dbatch"><button type="button" class="lbtn sec" data-bact="form">'+E(T('res_back'))+'</button><div class="dhero"><span class="dhic">✓</span><div><h3 class="dth">'+E(T('res_title',{d:nD(ok.length)}))+'</h3><div class="sm">'+E([(c&&c.data.НОМЕР_ДЕЛА)||'',c?c.data.ДОЛЖНИК_НАИМЕНОВАНИЕ||'':'',a?'исх. № '+a+' – '+b:''].filter(Boolean).join(' · '))+'</div></div></div>'+
 '<div class="dact">'+(ok.length?'<button type="button" class="lbtn sec" data-bact="pv">'+E(T('pv_open',{n:ok.length}))+'</button>':'')+'<button type="button" class="lbtn" data-bact="zip">'+E(T('zip'))+'</button></div><div class="sm dmini"><span>'+E(B.blank&&A.LH().length?T('blank_on'):T('blank_off'))+'</span> <span>'+E(B.sign&&A.SIG().length?T('signed'):T('unsigned'))+'</span> <span>ZIP: <b>'+E(RES.zip)+'</b></span></div>'+
 (miss.length?'<p class="sm dnote warn">'+E(T('res_miss',{n:miss.length+' '+A.pl(miss.length,'шаблоне','шаблонах','шаблонах')}))+'</p>':'');
 gs.forEach(function(g){var m=missT(g.t,sh);h+='<div class="lot drg"><div class="d1">'+E(g.t.title)+(g.items.length>1?' <b class="dmul">× '+g.items.length+'</b>':'')+(m?' <span class="dst warn">'+m+'</span>':'')+'</div>'+g.items.map(function(r){var k=out.indexOf(r);return '<div class="dri"><span class="dno">№ '+E(r.p.no)+'</span><span class="dritx">'+E(r.p.a?dn(r.p.a):g.t.kind)+'<span class="sm">'+(r.blob?E(r.fn):'<span class="ewarn">'+E(T('failed'))+': '+E(r.err)+'</span>')+'</span></span>'+(r.blob?'<button type="button" class="lbtn sec dib" data-bview="'+k+'" title="'+E(T('view'))+'" aria-label="'+E(T('view'))+'">👁</button><button type="button" class="lbtn sec dib" data-bdl="'+k+'" title="'+E(T('dl'))+'" aria-label="'+E(T('dl'))+'">⤓</button>':'')+'</div>'}).join('')+'</div>'});
 h+='<p class="sm dnote">'+E(T('res_journal',{a:a,b:b,n:A.outFmt(oc().next,oc(),vget('ДАТА','*'))}))+'</p></div>';ROOT.innerHTML=h;A.bar('')}
function pvList(){return RES?RES.out.filter(function(r){return r.blob}):[]}
function pvHtml(r){var o=OVfor(r.p,common());o.sigUrl=r.sg||null;A.setOV(o);try{var bd=A.htmlPrev(A.expandRowsText(A.TXT[r.p.t.id]||'',r.p.t),r.p.t),l=r.lh?A.lhFor(r.p.t):null;
 if(l&&!l._pv){A.lhPv(l).then(function(){if(PVI!=null)pvDraw()}).catch(function(){});return bd}return l?A.pvWrap(l,r.p.t,bd):bd}finally{A.setOV(null)}}
async function pvOpen(i){var L=pvList();if(!L.length)return;for(var z=0;z<L.length;z++){if(!A.TXT[L[z].p.t.id])try{await A.md(L[z].p.t)}catch(x){}}PVI=Math.min(Math.max(0,i),L.length-1);document.documentElement.classList.add('dnoscroll');pvDraw()}
function pvGo(i){var L=pvList();if(i<0||i>=L.length)return;PVI=i;pvDraw();var b=document.querySelector('#dpvw .dpvbody');if(b)b.scrollTop=0}
function pvClose(){PVI=null;var el=document.getElementById('dpvw');if(el)el.remove();document.documentElement.classList.remove('dnoscroll')}
function pvDraw(){var L=pvList(),r=L[PVI];if(!r){pvClose();return}var el=document.getElementById('dpvw'),k=RES.out.indexOf(r),n=L.length;
 if(!el){el=document.createElement('div');el.id='dpvw';el.className='dpvw dbatch';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');document.getElementById('vdocs').appendChild(el);
  var x0=null,y0=null;el.addEventListener('touchstart',function(e){var t=e.touches[0];x0=t.clientX;y0=t.clientY},{passive:true});
  el.addEventListener('touchend',function(e){if(x0==null)return;var t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)pvGo(PVI+(dx<0?1:-1))},{passive:true})}
 el.innerHTML='<div class="dpvbar"><button type="button" class="lbtn sec dpvnav" data-bpvgo="'+(PVI-1)+'"'+(PVI?'':' disabled')+' aria-label="'+E(T('pv_prev'))+'">‹</button><div class="dpvt"><b>'+E(T('pv_of',{i:PVI+1,n:n}))+' · № '+E(r.p.no)+'</b><div class="sm">'+E(r.p.t.title+(r.p.a?' — '+dn(r.p.a):''))+'</div></div><button type="button" class="lbtn sec dpvnav" data-bpvgo="'+(PVI+1)+'"'+(PVI<n-1?'':' disabled')+' aria-label="'+E(T('pv_next'))+'">›</button></div>'+
  '<div class="dpvbody"><div class="dprev'+(r.lh?' dlhf':'')+'">'+pvHtml(r)+'</div></div>'+
  '<div class="dpvfoot"><div class="dpvdots">'+L.map(function(_,j){return '<button type="button" class="dpvdot'+(j==PVI?' on':'')+'" data-bpvgo="'+j+'" aria-label="'+(j+1)+'"></button>'}).join('')+'</div><div class="dact"><button type="button" class="lbtn sec" data-bact="pvclose">'+E(T('pv_close'))+'</button><button type="button" class="lbtn sec" data-bdl="'+k+'">'+E(T('pv_dl'))+'</button><button type="button" class="lbtn" data-bact="zip">'+E(T('zip'))+'</button></div><p class="sm">'+E(T('pv_hint'))+'</p></div>'}
function viewHtml(r){var c=common();A.setOV(OVfor(r.p,c));try{return A.htmlPrev(A.expandRowsText(A.TXT[r.p.t.id]||'',r.p.t),r.p.t)}finally{A.setOV(null)}}
function render(){if(!B)return;if(B.scr=='res')vRes();else vForm()}
var RT=0;function rerender(){clearTimeout(RT);RT=setTimeout(rerender0,0)}
function rerender0(){var y=window.scrollY,a=document.activeElement,id=a&&a.id,p=a&&a.selectionStart;render();window.scrollTo(0,y);if(id&&document.getElementById(id)){var e=document.getElementById(id);e.focus();try{e.setSelectionRange(p,p)}catch(x){}}}
/* ---- события ---- */
function bind(){var v=document.getElementById('vdocs');
 v.addEventListener('input',function(e){var i=e.target;if(!B||!i.closest('.dbatch'))return;
  if(i.id=='dshq'){SHEET.q=i.value;drawSheet();return}if(i.id=='dbrq'&&SHEET){SHEET.rq=i.value;var p0=i.selectionStart;drawSheet();var n0=document.getElementById('dbrq');if(n0){n0.focus();try{n0.setSelectionRange(p0,p0)}catch(x){}}return}
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
 v.addEventListener('click',async function(e){if(!B)return;var me=e.target.closest('[data-mgredit]');if(me&&me.closest('.dbatch')){e.stopPropagation();A.showTab('cp');if(window.ArbCP&&ArbCP.editMgr)ArbCP.editMgr(me.dataset.mgredit);return}var b=e.target.closest('[data-btop],[data-bact],[data-bsw],[data-bfold],[data-brm],[data-bpick],[data-bpt],[data-bdo],[data-bdo2],[data-brg],[data-brgx],[data-bpvgo],[data-bsavecp],[data-browadd],[data-browdel],[data-bview],[data-bpv],[data-bdl]');
  if(!b){if(e.target.id=='dsheet'){SHEET=null;drawSheet();rerender()}return}if(!b.closest('.dbatch'))return;e.stopPropagation();var d=b.dataset,ts=A.X.templates;
  if(d.bsavecp!=null){e.preventDefault();var cs=caseNow(),t=ts.find(function(x){return x.id==SHEET.tid}),M=MU()[mfield(t)]||{};if(window.ArbCP){var cp=await ArbCP.quickAdd({name:d.bsavecp,roles:M.roles||[],cases:cs?[cs.id]:[]});var a0=addrs(t).find(function(x){return x.n==d.bsavecp});if(a0){a0.src='k';a0.cp=cp.id;A.save()}}drawSheet();return}
  if(d.bdo2!=null&&SHEET&&SHEET.D){var t7=ts.find(function(x){return x.id==SHEET.tid}),a7=addrs(t7),i7=+d.bdo2,D7=SHEET.D,x7=D7.fed.find(function(x){return x.i==i7})||[].concat.apply([],Object.keys(D7.reg).map(function(k){return D7.reg[k]})).find(function(x){return x.i==i7});if(x7){if(a7.some(function(y){return y.dk==x7.k}))delOrg(a7,x7);else addOrg(t7,a7,x7);A.save();drawSheet()}return}
  if(d.brg&&SHEET&&SHEET.D){var t8=ts.find(function(x){return x.id==SHEET.tid}),a8=addrs(t8),L8=SHEET.D.reg[d.brg]||[],all8=L8.length&&L8.every(function(x){return a8.some(function(y){return y.dk==x.k})});L8.forEach(function(x){if(all8)delOrg(a8,x);else addOrg(t8,a8,x)});A.save();drawSheet();return}
  if(d.brgx){SHEET.rx=SHEET.rx||{};SHEET.rx[d.brgx]=!SHEET.rx[d.brgx];drawSheet();return}
  if((d.bact=='rgsel'||d.bact=='rgunsel')&&SHEET&&SHEET.D){var t9=ts.find(function(x){return x.id==SHEET.tid}),a9=addrs(t9);(SHEET.vreg||[]).forEach(function(k){(SHEET.D.reg[k]||[]).forEach(function(x){if(d.bact=='rgsel')addOrg(t9,a9,x);else delOrg(a9,x)})});A.save();drawSheet();return}
  if(d.bdo!=null){var t6=ts.find(function(x){return x.id==SHEET.tid}),a6=addrs(t6),o6=ArbCP.dirOrg(+d.bdo),D6=ArbCP.dirOrgs(t6.id,'');if(o6&&D6){var k6=o6.type+'|'+o6.name,ix=a6.findIndex(function(x){return x.dk==k6});if(ix<0)a6.push({n:ArbCP.dirVal(o6,D6.tf),src:'d',dk:k6,dn:o6.name});else a6.splice(ix,1);A.save();drawSheet()}return}
  if(d.bpvgo!=null){pvGo(+d.bpvgo);return}
  if(d.bpt!=null){var t1=ts.find(function(x){return x.id==SHEET.tid}),a=addrs(t1),k=a.findIndex(function(x){return d.bcp?x.cp==d.bcp:(!x.cp&&!x.dk&&x.n==d.bpt)});if(k<0)a.push({n:d.bpt,src:d.bcp?'k':'case',cp:d.bcp||undefined});else a.splice(k,1);A.save();B.issued=B.issued;drawSheet();return}
  if(d.bsw){B[d.bsw]=!B[d.bsw];S().bopt={blank:B.blank,sign:B.sign};A.save();rerender();return}
  if(d.bfold){B.open[d.bfold]=!B.open[d.bfold];rerender();return}
  if(d.brm){var q=d.brm.split('|'),t2=ts.find(function(x){return x.id==q[0]});addrs(t2).splice(+q[1],1);A.save();rerender();return}
  if(d.bpick){SHEET={tid:d.bpick,q:''};drawSheet();var Mb=MU()[mfield(ts.find(function(x){return x.id==d.bpick}))]||{};if(window.ArbCP&&ArbCP.ensureBanks&&(Mb.kinds||[]).indexOf('bank')>=0)ArbCP.ensureBanks().then(function(n){if(n&&SHEET)drawSheet()});return}
  if(d.browadd){A.rows(ts.find(function(x){return x.id==d.browadd})).push({});A.save();rerender();return}
  if(d.browdel){var r=d.browdel.split('|');A.rows(ts.find(function(x){return x.id==r[0]})).splice(+r[1],1);A.save();rerender();return}
  if(d.bview!=null){var ok7=RES.out.filter(function(r){return r.blob});await pvOpen(Math.max(0,ok7.indexOf(RES.out[+d.bview])));return}
  if(d.bdl!=null){var rr=RES.out[+d.bdl];if(rr.fo&&A.dlFiles)A.dlFiles(rr.fo,rr.fn);else A.saveBlob(rr.blob,rr.fn);return}
  var a1=d.bact;
  if(a1=='list'){B=null;SHEET=null;drawSheet();A.showList();return}
  if(a1=='pc'){B.pc=!B.pc;rerender();return}
  if(a1=='make'){for(var w=0;w<sel().length;w++)try{await A.md(sel()[w])}catch(x){}await make();return}
  if(a1=='form'){pvClose();B.scr='form';B.view=null;render();return}
  if(a1=='zip'){await zip();return}
  if(a1=='pv'){await pvOpen(0);return}
  if(a1=='pvclose'){pvClose();return}
  if(a1=='pcancel'){SHEET=null;drawSheet();rerender();return}
  if(a1=='pdone'){SHEET=null;drawSheet();rerender();return}
  if(d.btop){var t5=ts.find(function(x){return x.id==SHEET.tid}),a5=addrs(t5),N=+d.btop,L5=ArbCP.list().filter(function(c){return c.kind=='bank'&&c.bkind=='head'&&c.rank_assets&&c.rank_assets<=N}).sort(function(x,y){return x.rank_assets-y.rank_assets}).filter(function(c,i,L){return !L.slice(0,i).some(function(z){return z.rank_assets==c.rank_assets&&(z.inn&&z.inn==c.inn||!z.inn)})});
   L5.forEach(function(c){if(!a5.some(function(y){return y.cp==c.id}))a5.push({n:c.name,src:'k',cp:c.id})});A.save();drawSheet();return}
  if(a1=='allbanks'){var t4=ts.find(function(x){return x.id==SHEET.tid}),a4=addrs(t4),L4=SHEET.all||[],on4=L4.length&&L4.every(function(x){return a4.some(function(y){return x.cp?y.cp==x.cp:y.n==x.n})});
   if(on4){var ids={};L4.forEach(function(x){ids[x.cp||('n:'+x.n)]=1});for(var r4=a4.length-1;r4>=0;r4--)if(ids[a4[r4].cp||('n:'+a4[r4].n)])a4.splice(r4,1)}else L4.forEach(function(x){if(!a4.some(function(y){return x.cp?y.cp==x.cp:y.n==x.n}))a4.push({n:x.n,src:x.cp?'k':'m',cp:x.cp})});A.save();drawSheet();return}
  if(a1=='manual'){var tx=(SHEET.q||'').trim()||prompt(T('sheet_manual').replace(/^\+\s*/,''))||'';tx=tx.trim();if(!tx)return;var t3=ts.find(function(x){return x.id==SHEET.tid}),a3=addrs(t3);if(!a3.some(function(x){return x.n==tx}))a3.push({n:tx,src:'m'});SHEET.q='';A.save();drawSheet();return}});
 v.addEventListener('keydown',function(e){if(PVI!=null){if(e.key=='ArrowRight'){pvGo(PVI+1);return}if(e.key=='ArrowLeft'){pvGo(PVI-1);return}if(e.key=='Escape'){pvClose();return}}if(e.key=='Escape'&&SHEET){SHEET=null;drawSheet();rerender()}})}
var SU=0;function softUpdate(){clearTimeout(SU);SU=setTimeout(function(){if(!B||B.scr=='res')return;var a=document.activeElement;if(a&&a.closest&&a.closest('.dbatch')&&/INPUT|TEXTAREA/.test(a.tagName)){var c=common(),P=plan(),tot=missC(c)+sel().reduce(function(s,t){return s+missT(t,c.shared)},0);
 A.bar('<div class="dbi"><b>'+E(nD(P.length))+'</b><span class="sm'+(tot?' dwarn':'')+'">'+E(tot?T('bar_miss',{n:nP(tot)}):T('bar_ok'))+'</span></div>'+(A.fmtSeg?A.fmtSeg():'')+'<button type="button" class="lbtn dbgo" data-bact="make">'+E(T('make_docs',{n:P.length}))+'</button>');sel().forEach(function(t){var q=document.querySelector('#dbs-'+t.id+' .dst');if(q)q.outerHTML=stc(missT(t,c.shared))});var w=a.closest('.dempty');if(w&&a.value)w.classList.remove('dempty')}else rerender()},250)}  // статус раздела «не заполнено N» — тоже сразу
window.ArbBatch={
 mount:function(el,api){A=api;ROOT=el;bind();document.getElementById('vdocs').addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('#dbbar [data-bact]');if(b&&B&&b.dataset.bact=='make'){e.stopPropagation();(async function(){for(var w=0;w<sel().length;w++)try{await A.md(sel()[w])}catch(x){}await make()})()}},true)},
 refresh:function(){if(B&&B.scr=='form')rerender()},
 reset:function(){B=null;RES=null;PVI=null;try{SHEET=null}catch(e){}if(ROOT)ROOT.innerHTML='';if(A){var s=A.S();if(s){delete s.bvals;delete s.bper;delete s.baddr}if(A.bar)A.bar('')}try{drawSheet()}catch(e){}},  // «Сбросить»: значения пакета и нижняя панель «N документов · Не заполнено N полей» тоже
 open:function(ids){var o=S().bopt||{};B={ids:ids,open:{},blank:o.blank!=null?o.blank:A.LH().length>0,sign:o.sign!=null?o.sign:A.SIG().length>0,scr:'form',pc:!caseNow()};RES=null;render()},
 active:function(){return !!B},
 _t:{plan:function(){return plan()},common:common,fname:fname}
};
})();
