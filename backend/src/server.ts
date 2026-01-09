import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/routes";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true, app: "sociala", time: new Date().toISOString() });
});

app.use("/auth", authRoutes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Backend on http://localhost:${port}`));