const express = require("express");
const router = express.Router();
const controller = require("../controllers/usersController");
const { authMiddleware } = require("../controllers/authController");

router.get("/", authMiddleware, controller.getUsers);
router.get("/stats", authMiddleware, controller.getStats);
router.get("/:id", authMiddleware, controller.getUser);
router.post("/", authMiddleware, controller.createUser);
router.put("/:id", authMiddleware, controller.updateUser);
router.delete("/:id", authMiddleware, controller.deleteUser);

module.exports = router;
