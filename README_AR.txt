نسخة R7 Burger المصححة - بدون مجلدات

الملفات:
- firebase.js: إعداد Firebase وكل دوال الحفظ والقراءة. هذا هو ملف الجافا الوحيد الخاص بفايربيز.
- index.html: منيو الزبون فقط، بدون إدارة.
- login.html: تسجيل دخول الإدارة. المفتاح الافتراضي 0000.
- admin.html: إدارة الإعدادات، الأقسام، الأصناف، ومفاتيح الدخول.
- tables.html: توليد الطاولات و QR وحفظها في Firebase.
- kitchen.html: شاشة المطبخ مع عداد الطلبات الجديدة.
- reports.html: التقارير والفواتير الحرارية وطلب واتساب يدوي.
- firebase-check.html: فحص القراءة والكتابة والتهيئة.
- database.rules.txt: قواعد Realtime Database المطلوبة.

طريقة التشغيل:
1) ارفع كل الملفات كما هي في نفس المكان، بدون مجلدات.
2) افتح Firebase Console > Realtime Database > Rules.
3) انسخ محتوى database.rules.txt واضغط Publish.
4) افتح firebase-check.html واضغط تشغيل الفحص ثم تهيئة البيانات.
5) افتح login.html واستخدم المفتاح 0000.
6) من admin.html أنشئ مفتاح جديد دائم أو مؤقت.

مهم:
- هذه النسخة لا تستخدم Firebase Auth نهائياً، لذلك خطأ auth/admin-restricted-operation لا يمكن أن يطلع منها.
- هذه النسخة تستخدم Realtime Database وليس Firestore.
- لو لم يحفظ Firebase، السبب غالباً أن قواعد Realtime Database لم تُنشر أو أنك تفتح نسخة قديمة.
