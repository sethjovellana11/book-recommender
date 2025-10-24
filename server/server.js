import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { connectToDatabase } from "./config/db.js";
import booksRouter from "./routes/books.js";

const app = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
    try {
        await connectToDatabase(process.env.MONGODB_URI);
        console.log("✓ Connected to MongoDB");
    } catch (error) {
        console.error("✗ MongoDB connection failed:", error.message);
        process.exit(1);
    }

    app.use(cors());
    app.use(express.json());
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

    app.use("/api/books", booksRouter);

    if (process.env.SERVE_CLIENT === "true") {
        const clientDir = process.env.CLIENT_DIR || path.resolve(__dirname, "../");
        app.use(express.static(clientDir));

        app.get("*", (req, res) => {
            res.sendFile(path.join(clientDir, "index.html"));
        });
    }

    app.use((req, res) => {
        res.status(404).json({ error: "Not found" });
    });

    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    });

    app.listen(port, () => {
        console.log(`🚀 Server ready on port ${port}`);
    });
}

bootstrap();
