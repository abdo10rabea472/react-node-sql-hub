const express = require("express");
const router = express.Router();
const controller = require("../controllers/usersController");
const { authMiddleware, adminMiddleware } = require("../controllers/authController");

router.get("/", authMiddleware, adminMiddleware, controller.getUsers);
router.get("/stats", authMiddleware, adminMiddleware, controller.getStats);
router.get("/:id", authMiddleware, adminMiddleware, controller.getUser);
router.post("/", authMiddleware, adminMiddleware, controller.createUser);
router.put("/:id", authMiddleware, adminMiddleware, controller.updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, controller.deleteUser);

module.exports = router;
