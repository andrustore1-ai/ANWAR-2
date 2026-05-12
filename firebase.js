/* R7 Burger Firebase Core - Realtime Database, no Auth, no modules */
(function(){
  'use strict';
  const firebaseConfig = {
    apiKey: "AIzaSyCnLAY7zQyBy7gUuL9wszt9aEhiJgvRmxI",
    authDomain: "shop-d52dc.firebaseapp.com",
    databaseURL: "https://shop-d52dc-default-rtdb.firebaseio.com",
    projectId: "shop-d52dc",
    storageBucket: "shop-d52dc.appspot.com",
    messagingSenderId: "97580537866",
    appId: "1:97580537866:web:abc46e5a2f527b6300a7f3",
    measurementId: "G-956RQMBP42"
  };
  const RESTAURANT_ID = 'r7_burger';
  const BASE = 'restaurants/' + RESTAURANT_ID;
  const DEFAULT_ADMIN_KEY = '0000';
  let db = null;

  const FALLBACK_SETTINGS = {
    name: 'R7 Burger', slogan: 'نظام المنيو الذكي', currency: '₪', whatsapp: '970590000000',
    publicMenuUrl: '', acceptOutsideOrders: true, taxRate: 0, serviceRate: 0
  };
  const FALLBACK_CATEGORIES = {
    burgers: { name:'الوجبات الأساسية', sort:1, active:true },
    drinks: { name:'المشروبات', sort:2, active:true },
    sides: { name:'الإضافات', sort:3, active:true }
  };
  const FALLBACK_PRODUCTS = {
    demo_burger: { name:'برجر كلاسيك', price:20, categoryId:'burgers', active:true, sort:1, description:'لحم بقري مشوي مع جبنة وصوص خاص وخضار طازجة.', image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop' },
    demo_crispy: { name:'وجبة كريسبي', price:25, categoryId:'burgers', active:true, sort:2, description:'دجاج كريسبي مع بطاطا وصوص المطعم.', image:'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900&h=700&fit=crop' },
    demo_fries: { name:'بطاطا مقلية', price:8, categoryId:'sides', active:true, sort:3, description:'بطاطا مقرمشة مع بهارات خاصة.', image:'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=900&h=700&fit=crop' },
    demo_cola: { name:'كولا باردة', price:5, categoryId:'drinks', active:true, sort:4, description:'مشروب غازي بارد.', image:'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=900&h=700&fit=crop' }
  };

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if(document.querySelector('script[src="'+src+'"]')) return resolve();
      const s=document.createElement('script'); s.src=src; s.async=true;
      s.onload=resolve; s.onerror=()=>reject(new Error('فشل تحميل Firebase SDK: '+src));
      document.head.appendChild(s);
    });
  }
  const sdkReady = (async function(){
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-database-compat.js');
    if(!window.firebase) throw new Error('لم يتم تحميل مكتبة Firebase');
    if(!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    return db;
  })();

  function cleanPart(v){ return String(v||'').replace(/^\/+|\/+$/g,'').trim(); }
  function pathOf(path){
    const p = Array.isArray(path) ? path.map(cleanPart).filter(Boolean).join('/') : cleanPart(path);
    return p ? BASE + '/' + p : BASE;
  }
  function sanitizeId(v){
    return String(v||'').trim().replace(/[.#$\[\]\/\\]/g,'_').replace(/\s+/g,'_') || ('id_'+Date.now());
  }
  function list(obj){
    if(!obj) return [];
    return Object.entries(obj).map(([id,data])=>({ id, ...(data||{}) }));
  }
  function sortBySort(a,b){ return Number(a.sort||999)-Number(b.sort||999) || String(a.name||'').localeCompare(String(b.name||''),'ar'); }
  function money(v,currency){ const n=Number(v||0); return n.toFixed(Number.isInteger(n)?0:2)+' '+(currency||'₪'); }
  function orderNo(){ const d=new Date(); return 'R7-'+String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+Math.floor(1000+Math.random()*9000); }
  function makeKey(len){ const chars='23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; let out=''; const arr=new Uint32Array(len||10); (crypto&&crypto.getRandomValues?crypto.getRandomValues(arr):arr.fill(Date.now())); for(let i=0;i<arr.length;i++) out+=chars[arr[i]%chars.length]; return out; }
  function hashKey(input){
    const s=String(input||''); let h1=2166136261, h2=16777619;
    for(let i=0;i<s.length;i++){ const c=s.charCodeAt(i); h1=Math.imul(h1^c,16777619); h2=Math.imul(h2+c,2166136261); }
    return ((h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0'));
  }
  function now(){ return firebase.database.ServerValue.TIMESTAMP; }
  function toMillis(v){ if(!v) return null; if(typeof v==='number') return v; const p=Date.parse(v); return Number.isNaN(p)?null:p; }
  function localDate(v){ const t=toMillis(v); return t?new Date(t).toLocaleString('ar',{hour12:false}):''; }
  function escapeHtml(s){ return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function errorMessage(err){
    const raw=String((err&&err.code)|| (err&&err.message) || err || '').toLowerCase();
    if(raw.includes('permission_denied') || raw.includes('permission-denied')) return 'قواعد Realtime Database تمنع الحفظ أو القراءة. افتح Firebase Console > Realtime Database > Rules والصق قواعد database.rules.txt ثم Publish.';
    if(raw.includes('auth/admin-restricted-operation')) return 'هذا الخطأ من نسخة قديمة تستخدم Firebase Auth. النسخة الجديدة لا تستخدم Auth. احذف الملفات القديمة وارفع هذه النسخة فقط.';
    if(raw.includes('network') || raw.includes('failed') || raw.includes('fetch')) return 'فشل الاتصال بـ Firebase. تأكد من الإنترنت، ومن فتح الصفحة عبر استضافة/سيرفر محلي وليس من معاينة لا تسمح بالاتصال.';
    if(raw.includes('database_url') || raw.includes('database')) return 'تأكد أن Realtime Database مفعّلة وأن databaseURL صحيح في firebase.js.';
    return (err&&err.message) || String(err||'حدث خطأ غير معروف');
  }
  async function get(path){ await sdkReady; const snap=await db.ref(pathOf(path)).once('value'); return snap.val(); }
  async function set(path,value){ await sdkReady; await db.ref(pathOf(path)).set(value); return value; }
  async function update(path,value){ await sdkReady; await db.ref(pathOf(path)).update(value); return value; }
  async function remove(path){ await sdkReady; await db.ref(pathOf(path)).remove(); }
  async function push(path,value){ await sdkReady; const ref=db.ref(pathOf(path)).push(); await ref.set(value); return ref.key; }
  function watch(path,cb,onErr){
    let ref=null; sdkReady.then(()=>{ ref=db.ref(pathOf(path)); ref.on('value', snap=>cb(snap.val()), err=>onErr&&onErr(err)); }).catch(e=>onErr&&onErr(e));
    return ()=>{ if(ref) ref.off(); };
  }
  async function ensureSeedData(){
    await sdkReady;
    const settings = await get('settings');
    if(!settings) await set('settings', { ...FALLBACK_SETTINGS, createdAt: now(), updatedAt: now() });
    const cats = await get('categories');
    if(!cats) await set('categories', mapWithTimestamps(FALLBACK_CATEGORIES));
    const prods = await get('products');
    if(!prods) await set('products', mapWithTimestamps(FALLBACK_PRODUCTS));
    const def = await get('accessKeys/default_admin');
    if(!def) await set('accessKeys/default_admin', { label:'مفتاح افتراضي 0000', key:DEFAULT_ADMIN_KEY, hash:hashKey(DEFAULT_ADMIN_KEY), active:true, type:'permanent', expiresAt:null, createdAt:now(), useCount:0 });
    return true;
  }
  function mapWithTimestamps(obj){ const out={}; Object.keys(obj).forEach(k=>out[k]={...obj[k], createdAt: now(), updatedAt: now()}); return out; }
  function sessionGet(){ try{return JSON.parse(localStorage.getItem('r7_admin_session')||'null')}catch(e){return null} }
  function sessionSave(data){ localStorage.setItem('r7_admin_session', JSON.stringify(data)); return data; }
  function sessionIsValid(){ const s=sessionGet(); if(!s) return false; if(!s.expiresAt) return true; return Date.now()<Number(s.expiresAt); }
  function requireAdmin(){ if(sessionIsValid()) return true; const next=encodeURIComponent(location.pathname.split('/').pop()+location.search); location.href='login.html?next='+next; return false; }
  function logout(){ localStorage.removeItem('r7_admin_session'); location.href='login.html'; }
  async function validateAdminKey(raw){
    const key=String(raw||'').trim(); if(!key) throw new Error('أدخل مفتاح الدخول');
    if(key===DEFAULT_ADMIN_KEY){ return sessionSave({keyId:'bootstrap_0000', label:'دخول افتراضي 0000', bootstrap:true, loggedAt:Date.now(), expiresAt:Date.now()+24*60*60*1000}); }
    const keys=list(await get('accessKeys'));
    const found=keys.find(k=>k.active!==false && (k.hash===hashKey(key) || k.key===key));
    if(!found) throw new Error('مفتاح الدخول غير صحيح');
    const exp=toMillis(found.expiresAt); if(exp && Date.now()>exp) throw new Error('انتهت صلاحية هذا المفتاح');
    await update('accessKeys/'+found.id, { lastLoginAt: now(), useCount: Number(found.useCount||0)+1 });
    return sessionSave({keyId:found.id, label:found.label||'Admin', bootstrap:false, loggedAt:Date.now(), expiresAt:exp});
  }
  function menuBaseUrl(settings){
    if(settings && settings.publicMenuUrl) return settings.publicMenuUrl;
    const file = location.pathname.split('/').pop() || 'index.html';
    if(location.protocol==='file:') return 'index.html';
    return location.href.split('?')[0].replace(file,'index.html');
  }
  function qrUrl(link){ return 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=' + encodeURIComponent(link); }
  function calcExpiry(type,count){
    if(type==='permanent') return null;
    const n=Number(count||1), d=new Date();
    if(type==='minute') d.setMinutes(d.getMinutes()+n);
    else if(type==='day') d.setDate(d.getDate()+n);
    else if(type==='week') d.setDate(d.getDate()+7*n);
    else if(type==='month') d.setMonth(d.getMonth()+n);
    else if(type==='year') d.setFullYear(d.getFullYear()+n);
    return d.getTime();
  }
  window.R7F = {
    firebaseConfig, RESTAURANT_ID, BASE, DEFAULT_ADMIN_KEY, FALLBACK_SETTINGS, FALLBACK_CATEGORIES, FALLBACK_PRODUCTS,
    ready:()=>sdkReady, get,set,update,remove,push,watch,list,sortBySort,money,orderNo,makeKey,hashKey,now,toMillis,localDate,escapeHtml,errorMessage,
    ensureSeedData,sessionGet,sessionSave,sessionIsValid,requireAdmin,logout,validateAdminKey,menuBaseUrl,qrUrl,calcExpiry,sanitizeId
  };
})();
