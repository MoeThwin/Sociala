import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { requireAuth, AuthedRequest } from "../auth/requireAuth";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString("hex");
    cb(null, `${name}${ext}`);
  },
});

function fileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post("/", requireAuth, upload.single("image"), (req: AuthedRequest, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  // This is the URL your frontend will store in Post.imageUrl
  const url = `/uploads/${req.file.filename}`;
  return res.status(201).json({ url });
});

export default router;