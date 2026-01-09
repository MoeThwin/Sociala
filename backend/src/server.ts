import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/routes";
import postsRoutes from "./posts/routes";
import commentRoutes from "./comments/routes";
import uploadsRoutes from "./uploads/routes";


dotenv.config();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.get("/health", (_req, res) => {
  res.json({ ok: true, app: "sociala", time: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/posts", postsRoutes);
app.use("/comments", commentRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/uploads-api", uploadsRoutes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Backend on http://localhost:${port}`));