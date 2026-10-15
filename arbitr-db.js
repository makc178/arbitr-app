/* Arbitr App — локальное хранилище устройства (IndexedDB). Бланки, контрагенты и их файлы живут только в этом браузере и никуда не отправляются. */
(function(){
var NAME='arbitr_local',VER=2,STORES=['letterheads','signatures','counterparties','cp_files','cp_cases','archive'],P=null;
function open(){if(P)return P;P=new Promise(function(res,rej){var r=indexedDB.open(NAME,VER);r.onupgradeneeded=function(){var d=r.result;STORES.forEach(function(s){if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:'id'})})};r.onsuccess=function(){var d=r.result;d.onversionchange=function(){d.close();P=null};res(d)};r.onerror=function(){P=null;rej(r.error)}});return P}
function tx(s,m,f){return open().then(function(d){return new Promise(function(res,rej){var t=d.transaction(s,m),st=t.objectStore(s),out=f(st);t.oncomplete=function(){res(out&&out.result!==undefined?out.result:out)};t.onerror=function(){rej(t.error)};t.onabort=function(){rej(t.error)}})})}
window.ArbDB={
 all:function(s){return tx(s,'readonly',function(st){return st.getAll()})},
 get:function(s,id){return tx(s,'readonly',function(st){return st.get(id)})},
 put:function(s,v){return tx(s,'readwrite',function(st){st.put(v)}).then(function(){return v})},
 putMany:function(s,vs){return tx(s,'readwrite',function(st){vs.forEach(function(v){st.put(v)})})},
 del:function(s,id){return tx(s,'readwrite',function(st){st.delete(id)})},
 wipe:function(){return open().then(function(d){d.close();P=null}).catch(function(){}).then(function(){return new Promise(function(res){var r=indexedDB.deleteDatabase(NAME);r.onsuccess=r.onerror=r.onblocked=function(){res()}})})},
 uid:function(p){return (p||'')+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
};
})();
