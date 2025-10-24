import express from "express";
import Book from "../models/Book.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const { genres, popularity, era, search } = req.query;

        const query = {};

        if (genres) {
            const genreList = Array.isArray(genres) ? genres : genres.split(",").map(value => value.trim()).filter(Boolean);
            if (genreList.length) {
                query.genres = { $all: genreList };
            }
        }

        if (popularity && popularity !== "any") {
            query.popularity = popularity;
        }

        if (era && era !== "any") {
            query.era = era;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const books = await Book.find(query).sort({ popularity: 1, title: 1 }).lean();
        res.json({ data: books });
    } catch (error) {
        next(error);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const book = await Book.create(req.body);
        res.status(201).json({ data: book });
    } catch (error) {
        next(error);
    }
});

export default router;
