/* R7 Burger Firebase Core - Realtime Database only, no Auth */
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
    name: 'R7 Burger',
    slogan: 'منيو ذكي للطلبات السريعة',
    currency: '₪',
    whatsapp: '970590000000',
    publicMenuUrl: '',
    acceptOutsideOrders: true,
    logoText: 'R7',
    logoImage: '',
    themeColor: '#f97316',
    bannerEnabled: true,
    bannerImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1500&h=700&fit=crop',
    bannerTitle: 'طعم البرجر الأصلي',
    bannerSubtitle: 'اطلب من الطاولة أو جهّز طلبك واتساب بسهولة',
    taxRate: 0,
    serviceRate: 0,
    socials: {
      whatsapp_main: { type:'whatsapp', label:'واتساب', url:'https://wa.me/970590000000', active:true, sort:1 },
      instagram_main: { type:'instagram', label:'إنستغرام', url:'#', active:true, sort:2 },
      maps_main: { type:'maps', label:'الموقع', url:'#', active:true, sort:3 }
    }
  };

  const FALLBACK_CATEGORIES = {
    burgers: { name:'الوجبات الأساسية', sort:1, active:true, icon:'burger' },
    sides: { name:'الإضافات', sort:2, active:true, icon:'fries' },
    drinks: { name:'المشروبات', sort:3, active:true, icon:'drink' }
  };

  const FALLBACK_PRODUCTS = {
    demo_burger: { name:'برجر كلاسيك', price:20, categoryId:'burgers', active:true, sort:1, description:'لحم بقري مشوي مع جبنة وصوص خاص وخضار طازجة.', image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop' },
    demo_crispy: { name:'وجبة كريسبي', price:25, categoryId:'burgers', active:true, sort:2, description:'دجاج كريسبي مع بطاطا وصوص المطعم.', image:'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900&h=700&fit=crop' },
    demo_fries: { name:'بطاطا مقلية', price:8, categoryId:'sides', active:true, sort:3, description:'بطاطا مقرمشة مع بهارات خاصة.', image:'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=900&h=700&fit=crop' },
    demo_cola: { name:'كولا باردة', price:5, categoryId:'drinks', active:true, sort:4, description:'مشروب غازي بارد.', image:'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=900&h=700&fit=crop' }
  };

  const SOCIAL_TYPES = [
    ['whatsapp','واتساب'], ['instagram','إنستغرام'], ['facebook','فيسبوك'], ['tiktok','تيك توك'],
    ['snapchat','سناب شات'], ['telegram','تيليجرام'], ['x','X / تويتر'], ['youtube','يوتيوب'],
    ['website','موقع إلكتروني'], ['phone','اتصال'], ['maps','خرائط'], ['delivery','توصيل']
  ];

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
  function sanitizeId(v){ return String(v||'').trim().replace(/[.#$\[\]\/\\]/g,'_').replace(/\s+/g,'_') || ('id_'+Date.now()); }
  function list(obj){
    if(!obj) return [];
    if(Array.isArray(obj)) return obj.filter(Boolean).map((data,i)=>({ id:String(i), ...(data||{}) }));
    return Object.entries(obj).map(([id,data])=>({ id, ...(data||{}) }));
  }
  function sortBySort(a,b){ return Number(a.sort||999)-Number(b.sort||999) || String(a.name||a.label||'').localeCompare(String(b.name||b.label||''),'ar'); }
  function money(v,currency){ const n=Number(v||0); return n.toFixed(Number.isInteger(n)?0:2)+' '+(currency||'₪'); }
  function orderNo(){ const d=new Date(); return 'R7-'+String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+Math.floor(1000+Math.random()*9000); }
  function makeKey(len){ const chars='23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; let out=''; const arr=new Uint32Array(len||10); try{crypto.getRandomValues(arr)}catch(e){arr.fill(Date.now())} for(let i=0;i<arr.length;i++) out+=chars[arr[i]%chars.length]; return out; }
  function hashKey(input){
    const s=String(input||''); let h1=2166136261, h2=16777619;
    for(let i=0;i<s.length;i++){ const c=s.charCodeAt(i); h1=Math.imul(h1^c,16777619); h2=Math.imul(h2+c,2166136261); }
    return ((h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0'));
  }
  function now(){ return firebase.database.ServerValue.TIMESTAMP; }
  function toMillis(v){ if(!v) return null; if(typeof v==='number') return v; const p=Date.parse(v); return Number.isNaN(p)?null:p; }
  function localDate(v){ const t=toMillis(v); return t?new Date(t).toLocaleString('ar',{hour12:false}):''; }
  function todayStart(){ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); }
  function escapeHtml(s){ return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function safeUrl(u){ return String(u||'').trim(); }
  function errorMessage(err){
    const raw=String((err&&err.code)|| (err&&err.message) || err || '').toLowerCase();
    if(raw.includes('permission_denied') || raw.includes('permission-denied')) return 'قواعد Realtime Database تمنع الحفظ أو القراءة. افتح Firebase Console > Realtime Database > Rules والصق قواعد database.rules.txt ثم Publish.';
    if(raw.includes('auth/admin-restricted-operation')) return 'هذا الخطأ من نسخة قديمة تستخدم Firebase Auth. النسخة الحالية لا تستخدم Auth نهائياً. احذف الملفات القديمة وارفع هذه الملفات فقط.';
    if(raw.includes('network') || raw.includes('failed') || raw.includes('fetch')) return 'فشل الاتصال بـ Firebase. تأكد من الإنترنت ومن رفع الملفات على استضافة أو تشغيلها بسيرفر محلي.';
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
  function mapWithTimestamps(obj){ const out={}; Object.keys(obj).forEach(k=>out[k]={...obj[k], createdAt: now(), updatedAt: now()}); return out; }
  async function ensureSeedData(){
    await sdkReady;
    const settings = await get('settings');
    if(!settings) await set('settings', { ...FALLBACK_SETTINGS, createdAt: now(), updatedAt: now() });
    else {
      const patch={};
      ['logoText','logoImage','themeColor','bannerEnabled','bannerImage','bannerTitle','bannerSubtitle','socials'].forEach(k=>{ if(typeof settings[k]==='undefined') patch[k]=FALLBACK_SETTINGS[k]; });
      if(Object.keys(patch).length) await update('settings', {...patch, updatedAt:now()});
    }
    const cats = await get('categories');
    if(!cats) await set('categories', mapWithTimestamps(FALLBACK_CATEGORIES));
    const prods = await get('products');
    if(!prods) await set('products', mapWithTimestamps(FALLBACK_PRODUCTS));
    const def = await get('accessKeys/default_admin');
    if(!def) await set('accessKeys/default_admin', { label:'مفتاح افتراضي 0000', hash:hashKey(DEFAULT_ADMIN_KEY), active:true, type:'permanent', expiresAt:null, createdAt:now(), useCount:0 });
    return true;
  }
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
  function statusLabel(s){
    return ({new:'جديد',preparing:'قيد التحضير',ready:'جاهز',delivered:'تم التسليم',cancelled:'ملغي',whatsapp_sent:'أرسل واتساب'})[s] || s || 'غير محدد';
  }
  function channelLabel(s){ return ({kitchen:'المطبخ',whatsapp:'واتساب',table:'طاولة',manual:'يدوي'})[s] || s || 'منيو'; }
  function icon(type,size){
    const w=size||22, common=`width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    const icons={
      home:`<svg ${common}><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>`,
      cart:`<svg ${common}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>`,
      search:`<svg ${common}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
      menu:`<svg ${common}><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
      settings:`<svg ${common}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.36.6.98 1 1.7 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/></svg>`,
      products:`<svg ${common}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>`,
      table:`<svg ${common}><path d="M4 10h16M5 10l2-6h10l2 6M6 10v10M18 10v10M9 20h6"/></svg>`,
      kitchen:`<svg ${common}><path d="M8 3v4M12 3v4M16 3v4M6 7h12l-1 14H7L6 7Z"/><path d="M9 11h6"/></svg>`,
      reports:`<svg ${common}><path d="M4 19V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M9 17v-6M13 17V7M17 17v-4"/></svg>`,
      key:`<svg ${common}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15 5l4 4M13 7l4 4"/></svg>`,
      plus:`<svg ${common}><path d="M12 5v14M5 12h14"/></svg>`,
      edit:`<svg ${common}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
      trash:`<svg ${common}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>`,
      bell:`<svg ${common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
      print:`<svg ${common}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>`,
      whatsapp:`<svg ${common}><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5Z"/></svg>`,
      instagram:`<svg ${common}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>`,
      facebook:`<svg ${common}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
      tiktok:`<svg ${common}><path d="M14 3v11.2a4.2 4.2 0 1 1-4-4.2"/><path d="M14 3c1 3.5 3.2 5.2 6 5.4"/></svg>`,
      snapchat:`<svg ${common}><path d="M12 3c3 0 4.5 2.1 4.5 5.4v2.2c.7.8 1.6 1 2.5 1.2-.3 1.6-1.4 2.2-2.7 2.5-.4 1.6-1.7 3.7-4.3 3.7s-3.9-2.1-4.3-3.7c-1.3-.3-2.4-.9-2.7-2.5.9-.2 1.8-.4 2.5-1.2V8.4C7.5 5.1 9 3 12 3Z"/></svg>`,
      telegram:`<svg ${common}><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>`,
      x:`<svg ${common}><path d="M4 4l16 16M20 4 4 20"/></svg>`,
      youtube:`<svg ${common}><path d="M22 12s0-4-1-5c-1-1-4-1-9-1s-8 0-9 1-1 5-1 5 0 4 1 5 4 1 9 1 8 0 9-1 1-5 1-5Z"/><path d="m10 15 5-3-5-3z"/></svg>`,
      website:`<svg ${common}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>`,
      phone:`<svg ${common}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 5.2 13 19.8 19.8 0 0 1 2.1 4.4 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.5 1.8L7.8 9.8a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 1.8-.5l3 .5a2 2 0 0 1 1.7 2Z"/></svg>`,
      maps:`<svg ${common}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
      delivery:`<svg ${common}><path d="M10 17h4V5H2v12h3"/><path d="M14 17h1m4 0h3v-5l-3-4h-5v9h2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
      burger:`<svg ${common}><path d="M4 12h16M5 12c0-4 3-6 7-6s7 2 7 6M6 16h12M7 20h10"/><path d="M8 9h.01M12 8h.01M16 9h.01"/></svg>`,
      fries:`<svg ${common}><path d="M8 3v8M12 2v9M16 3v8M6 11h12l-1 10H7L6 11Z"/></svg>`,
      drink:`<svg ${common}><path d="M7 3h10l-1 18H8L7 3ZM7 8h10M11 3v-1h6"/></svg>`
    };
    return icons[type] || icons.website;
  }
  async function fileToDataUrl(file,maxW,quality){
    if(!file) return '';
    const data = await new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); });
    if(!String(file.type||'').startsWith('image/')) return data;
    return await new Promise(resolve=>{
      const img=new Image(); img.onload=function(){
        const mw=maxW||1200; let w=img.width, h=img.height;
        if(w>mw){ h=Math.round(h*mw/w); w=mw; }
        const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h); ctx.drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg', quality || .82));
      };
      img.onerror=()=>resolve(data); img.src=data;
    });
  }

  window.R7F = {
    firebaseConfig, RESTAURANT_ID, BASE, DEFAULT_ADMIN_KEY, FALLBACK_SETTINGS, FALLBACK_CATEGORIES, FALLBACK_PRODUCTS, SOCIAL_TYPES,
    ready:()=>sdkReady, get,set,update,remove,push,watch,list,sortBySort,money,orderNo,makeKey,hashKey,now,toMillis,localDate,todayStart,escapeHtml,safeUrl,errorMessage,
    ensureSeedData,sessionGet,sessionSave,sessionIsValid,requireAdmin,logout,validateAdminKey,menuBaseUrl,qrUrl,calcExpiry,sanitizeId,statusLabel,channelLabel,icon,fileToDataUrl
  };
})();
