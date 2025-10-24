import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { connectToDatabase, disconnectFromDatabase } from "./config/db.js";
import Book from "./models/Book.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
    try {
        await connectToDatabase(process.env.MONGODB_URI);

        const dataPath = path.resolve(__dirname, "./data/books.json");
        const raw = fs.readFileSync(dataPath, "utf-8");
        const books = JSON.parse(raw);

        await Book.deleteMany({});
        await Book.insertMany(books);

        console.log(`✓ Seeded ${books.length} books`);
    } catch (error) {
        console.error("✗ Seeding failed:", error);
    } finally {
        disconnectFromDatabase();
    }
}

seed();
