import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { roomsRouter } from "./routes/rooms.js";
import { adminRouter } from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST ?? "0.0.0.0";
const publicHost = process.env.PUBLIC_HOST ?? "10.5.1.50";

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "rupat-ruang-rapat" });
});

app.use("/api/rooms", roomsRouter);
app.use("/api/admin", adminRouter);

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(port, host, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  console.log(`TV viewer: http://${publicHost}:${port}/`);
  console.log(`Admin:     http://${publicHost}:${port}/admin`);
});
