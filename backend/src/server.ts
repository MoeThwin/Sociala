import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: "sociala",
    time: new Date().toISOString(),
  });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Sociala backend running on http://localhost:${port}`);
});