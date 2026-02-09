const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "stodio_secret_key_2026";

// LOGIN
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "خطأ في الخادم" });

    if (results.length === 0) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    const user = results[0];

    if (user.status === "banned") {
      return res.status(403).json({ message: "تم حظر هذا الحساب" });
    }

    if (user.status === "inactive") {
      return res.status(403).json({ message: "هذا الحساب غير مفعل" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
      },
    });
  });
};

// VERIFY TOKEN
exports.verifyToken = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "لا يوجد توكن" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.query(
      "SELECT id, name, email, role, status, created_at FROM users WHERE id = ?",
      [decoded.id],
      (err, results) => {
        if (err || results.length === 0)
          return res.status(401).json({ message: "مستخدم غير موجود" });
        res.json({ user: results[0] });
      }
    );
  } catch {
    res.status(401).json({ message: "توكن غير صالح" });
  }
};

// Middleware
exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "غير مصرح" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "توكن غير صالح" });
  }
};
