/* 21.10: версия в подвале — дата и время сборки в часовом поясе из arbitr_config.json (timezone), формат footer_ver.fmt — как в Эвересте (verMsk / EV_UI.footer_ver):
   «2026-10-21 18:52 UTC · b510b19» → «21.10.2026 21:52 МСК · b510b19». VER (UTC) в сборке не меняется — по нему проверяется новая версия. */
(function(){
var C=window.ARB_VER||{};
function fmt(v){var m=/^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d) UTC(.*)$/.exec(v);if(!C.on||!m||!C.tz||!C.fmt)return v;
 var d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5])),P={};
 try{new Intl.DateTimeFormat('ru-RU',{timeZone:C.tz,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).forEach(function(x){P[x.type]=x.value})}catch(e){return v}
 return String(C.fmt).replace(/\{(\w+)\}/g,function(_,k){return P[k]||''})+m[6]}
function go(){var e=document.getElementById('ver');if(!e)return;var v=(typeof VER!='undefined'&&!String(VER).startsWith('/*'))?String(VER):e.textContent,t=fmt(v);if(e.textContent!==t)e.textContent=t}
window.ARB_VER_FMT=fmt;go();document.addEventListener('DOMContentLoaded',go);addEventListener('load',go);
})();
