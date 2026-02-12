# 🚀 شرح تشغيل وإيقاف السيرفرات

## المتطلبات
- Node.js مثبت على الجهاز
- npm أو yarn للمكتبات
- MySQL قاعدة البيانات

---

## 📋 1. تشغيل الخادم الخلفي (Backend)

### الخطوة 1: فتح Terminal في مجلد الخادم

```bash
cd C:\Users\pc\Desktop\Stodio\server
```

### الخطوة 2: تشغيل الخادم مع متغير البيئة

#### على Windows (PowerShell):
```powershell
$env:JWT_SECRET='your-secret-key-here'; node index.js
```

#### على Windows (Command Prompt - CMD):
```cmd
set JWT_SECRET=your-secret-key-here && node index.js
```

#### على Linux/Mac:
```bash
JWT_SECRET='your-secret-key-here' node index.js
```

### النتيجة المتوقعة:
```
Server running on http://localhost:3000
```

---

## 📋 2. تشغيل الخادم الأمامي (Frontend)

### الخطوة 1: فتح Terminal جديد في المجلد الرئيسي

```bash
cd C:\Users\pc\Desktop\Stodio
```

### الخطوة 2: تشغيل خادم التطوير

```bash
npm run dev
```

### النتيجة المتوقعة:
```
VITE v7.3.1  ready in 220 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.1.11:8080/
```

---

## ⏹️ 3. إيقاف السيرفرات

### من Terminal:

**لإيقاف أي سيرفر:**

اضغط المفاتيح التالية معاً في نفس الوقت:

```
Ctrl + C
```

سيظهر تأكيد مثل:
```
^C
Terminate batch job? (Y/N)?
```

اكتب `Y` واضغط Enter

---

## 🔄 4. تشغيل كلا السيرفرين معاً

### الطريقة الأولى: استخدام نافذتين منفصلتين

**النافذة الأولى (Backend):**
```powershell
cd C:\Users\pc\Desktop\Stodio\server
$env:JWT_SECRET='your-secret-key-here'; node index.js
```

**النافذة الثانية (Frontend):**
```powershell
cd C:\Users\pc\Desktop\Stodio
npm run dev
```

### الطريقة الثانية: استخدام PowerShell (تشغيل متوازي)

```powershell
# في نفس النافذة، شغّل الـ Backend في الخلفية
cd C:\Users\pc\Desktop\Stodio\server
Start-Process powershell -ArgumentList "$env:JWT_SECRET='your-secret-key-here'; node index.js" -NoNewWindow

# ثم شغّل الـ Frontend
cd C:\Users\pc\Desktop\Stodio
npm run dev
```

---

## 🔑 ملاحظات مهمة

### 1. متغير JWT_SECRET
- **التعريف:** مفتاح سري لتشفير بيانات المستخدم
- **الاستخدام الحالي:** `your-secret-key-here` (للتطوير فقط)
- **للإنتاج:** استخدم مفتاح قوي وآمن جداً

### 2. المنافذ
| السيرفر | المنفذ | الرابط |
|--------|--------|--------|
| **Backend** | 3000 | http://localhost:3000 |
| **Frontend** | 8080 | http://localhost:8080 |

### 3. قاعدة البيانات
- يجب أن تكون **MySQL** مشغلة قبل تشغيل البيرفر
- الجداول تُنشأ تلقائياً عند التشغيل الأول

---

## 🐛 استكشاف الأخطاء الشائعة

### ❌ **الخطأ: Port already in use**

```
Error: listen EADDRINUSE :::3000
```

**الحل:** هناك عملية أخرى تستخدم نفس المنفذ

```powershell
# لإيقاف العملية على المنفذ 3000
netstat -ano | findstr ":3000"
taskkill /PID <PID> /F
```

### ❌ **الخطأ: JWT_SECRET not set**

```
FATAL: JWT_SECRET environment variable is required
```

**الحل:** تأكد من تعيين المتغير قبل التشغيل

### ❌ **الخطأ: Cannot find module**

```
Error: Cannot find module 'express'
```

**الحل:** ثبت المكتبات في مجلد الـ Backend

```powershell
cd C:\Users\pc\Desktop\Stodio\server
npm install
```

---

## ✨ نصائح إضافية

### 1. استخدام npm scripts
يمكنك إضافة script في `package.json` للسهولة:

```json
"scripts": {
  "server": "$env:JWT_SECRET='your-secret-key-here'; node index.js",
  "dev": "vite"
}
```

### 2. استخدام tools مثل Concurrently
لتشغيل كلا السيرفر معاً من نافذة واحدة:

```bash
npm install -D concurrently
```

ثم في `package.json`:
```json
"scripts": {
  "dev:all": "concurrently \"cd server && node index.js\" \"vite\""
}
```

---

## 📞 مساعدة إضافية

للاستعلام عن سجل البيانات أو أي مشكلة في عملية التشغيل:
- افحص ملف `server/logs.txt` للمعلومات التفصيلية
- تحقق من وصلة MySQL على `localhost:3306`
