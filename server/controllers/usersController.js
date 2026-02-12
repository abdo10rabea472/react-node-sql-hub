const db = require("../config/db");
const bcrypt = require("bcryptjs");

// GET all users
exports.getUsers = (req, res) => {
  db.query(
    "SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC",
    (err, data) => {
      if (err) {
        console.error("[Users] Fetch error:", err);
        return res.status(500).json({ message: "خطأ في جلب المستخدمين" });
      }
      res.json(data);
    }
  );
};

// GET single user
exports.getUser = (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?",
    [id],
    (err, data) => {
      if (err) {
        console.error("[Users] Get error:", err);
        return res.status(500).json({ message: "خطأ في جلب المستخدم" });
      }
      if (data.length === 0) return res.status(404).json({ message: "مستخدم غير موجود" });
      res.json(data[0]);
    }
  );
};

// GET dashboard stats
exports.getStats = (req, res) => {
  const queries = {
    totalUsers: "SELECT COUNT(*) as count FROM users",
    activeUsers: "SELECT COUNT(*) as count FROM users WHERE status = 'active'",
    inactiveUsers: "SELECT COUNT(*) as count FROM users WHERE status = 'inactive'",
    bannedUsers: "SELECT COUNT(*) as count FROM users WHERE status = 'banned'",
    admins: "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
    editors: "SELECT COUNT(*) as count FROM users WHERE role = 'editor'",
    recentUsers: "SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5",
  };

  const results = {};
  const keys = Object.keys(queries);
  let done = 0;

  keys.forEach(key => {
    db.query(queries[key], (err, data) => {
      if (err) {
        console.error(`[Users] Stats ${key} error:`, err);
        results[key] = key === "recentUsers" ? [] : 0;
      } else {
        results[key] = key === "recentUsers" ? data : data[0].count;
      }
      done++;
      if (done === keys.length) {
        res.json(results);
      }
    });
  });
};

// POST create user
exports.createUser = (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة" });
  }

  db.query("SELECT id FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) {
      console.error("[Users] Create check error:", err);
      return res.status(500).json({ message: "خطأ في التحقق من البريد" });
    }
    if (existing.length > 0) {
      return res.status(409).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
    }

    const hashed = bcrypt.hashSync(password, 10);
    db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashed, role || "user"],
      (err, result) => {
        if (err) {
          console.error("[Users] Create error:", err);
          return res.status(500).json({ message: "خطأ في إضافة المستخدم" });
        }
        res.json({
          message: "تم إضافة المستخدم بنجاح",
          userId: result.insertId,
        });
      }
    );
  });
};

// PUT update user
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { name, email, role, status, password } = req.body;

  const fields = [];
  const values = [];

  if (name) { fields.push("name = ?"); values.push(name); }
  if (email) { fields.push("email = ?"); values.push(email); }
  if (role) { fields.push("role = ?"); values.push(role); }
  if (status) { fields.push("status = ?"); values.push(status); }
  if (password) {
    const hashed = bcrypt.hashSync(password, 10);
    fields.push("password = ?");
    values.push(hashed);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "لا توجد بيانات للتحديث" });
  }

  values.push(id);
  db.query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
    values,
    (err) => {
      if (err) {
        console.error("[Users] Update error:", err);
        return res.status(500).json({ message: "خطأ في تحديث المستخدم" });
      }
      res.json({ message: "تم تحديث المستخدم بنجاح" });
    }
  );
};

// DELETE user
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("[Users] Delete error:", err);
      return res.status(500).json({ message: "خطأ في حذف المستخدم" });
    }
    res.json({ message: "تم حذف المستخدم بنجاح" });
  });
};
