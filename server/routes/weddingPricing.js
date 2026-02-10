const express = require("express");
const router = express.Router();
const controller = require("../controllers/weddingPricingController");

// Albums
router.get("/albums", controller.getAlbums);
router.post("/albums", controller.addAlbum);
router.put("/albums/:id", controller.updateAlbum);
router.delete("/albums/:id", controller.deleteAlbum);

// Videos
router.get("/videos", controller.getVideos);
router.post("/videos", controller.addVideo);
router.put("/videos/:id", controller.updateVideo);
router.delete("/videos/:id", controller.deleteVideo);

module.exports = router;
