const express = require("express");
const router = express.Router();
const controller = require("../controllers/weddingPricingController");
const { authMiddleware, adminMiddleware } = require("../controllers/authController");

// Albums
router.get("/albums", authMiddleware, controller.getAlbums);
router.post("/albums", authMiddleware, adminMiddleware, controller.addAlbum);
router.put("/albums/:id", authMiddleware, adminMiddleware, controller.updateAlbum);
router.delete("/albums/:id", authMiddleware, adminMiddleware, controller.deleteAlbum);

// Videos
router.get("/videos", authMiddleware, controller.getVideos);
router.post("/videos", authMiddleware, adminMiddleware, controller.addVideo);
router.put("/videos/:id", authMiddleware, adminMiddleware, controller.updateVideo);
router.delete("/videos/:id", authMiddleware, adminMiddleware, controller.deleteVideo);

module.exports = router;
