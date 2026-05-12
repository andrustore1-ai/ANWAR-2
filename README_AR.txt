نسخة R7 Burger الاحترافية - Realtime Database

طريقة الرفع:
1) ارفع كل الملفات الموجودة هنا في نفس المكان بدون مجلدات.
2) لا ترفع النسخ القديمة معها حتى لا تظهر أخطاء قديمة مثل auth/admin-restricted-operation.
3) افتح Firebase Console > Realtime Database > Rules.
4) انسخ محتوى ملف database.rules.txt ثم اضغط Publish.
5) افتح firebase-check.html واضغط تشغيل الفحص ثم تهيئة البيانات.
6) افتح login.html.

مفتاح الدخول الافتراضي:
0000

بعد الدخول:
- افتح admin.html.
- من قسم مفاتيح الدخول أنشئ مفتاح أدمن جديد.
- يمكنك تعطيل/حذف المفاتيح من نفس القسم.

مهم:
- هذه النسخة لا تستخدم Firebase Auth نهائياً.
- هذه النسخة لا تستخدم Firestore نهائياً.
- الحفظ كله عبر Realtime Database.
- الصور التي تختارها من الجهاز يتم ضغطها وتحويلها Data URL وحفظها داخل Realtime Database.
- التقارير تحتسب المبيعات فقط عند تسليم الطلب، وليس عند إنشاء الطلب.

الملفات:
- index.html: صفحة المنيو للزبون فقط، بدون روابط إدارة.
- login.html: دخول الأدمن بالمفتاح.
- admin.html: لوحة الإدارة المعزولة.
- tables.html: توليد الطاولات وروابط QR.
- kitchen.html: شاشة المطبخ وعدّاد الطلبات.
- reports.html: التقارير والفواتير الحرارية.
- firebase-check.html: فحص الاتصال والتهيئة.
- firebase.js: إعداد Firebase والكود المشترك فقط.
- database.rules.txt: قواعد Realtime Database.

تشغيل محلي للتجربة:
python3 -m http.server 8000
ثم افتح:
http://localhost:8000/firebase-check.html
