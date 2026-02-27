import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./utils/database.ts";
import { IdentifyController } from "./controllers/identifyController";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize controllers
const identifyController = new IdentifyController();

// Routes
app.post("/identify", identifyController.identify);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});