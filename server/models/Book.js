import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        author: {
            type: String,
            required: true,
            trim: true
        },
        genres: {
            type: [String],
            default: []
        },
        popularity: {
            type: String,
            enum: ["blockbuster", "critical", "hidden"],
            required: true
        },
        era: {
            type: String,
            enum: ["classic", "modern", "contemporary"],
            required: true
        },
        summary: {
            type: String,
            required: true
        },
        goodreads: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

bookSchema.index({ title: "text", author: "text", genres: "text" });

export default mongoose.model("Book", bookSchema);
