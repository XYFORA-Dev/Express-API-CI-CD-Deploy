import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing!");
    console.error("Please add it to your .env file:");
    console.error("DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/booksdb");
    process.exit(1);
}

mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    });

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true }
}, { timestamps: true });

const Book = mongoose.model("Book", bookSchema);

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Books CRUD API - Running on port 8080",
        status: "OK"
    });
});

app.post("/books", async (req, res) => {
    try {
        const book = await Book.create(req.body);
        res.status(201).json(book);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/books", async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/books/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ error: "Book not found" });
        res.json(book);
    } catch (err) {
        res.status(400).json({ error: "Invalid ID format" });
    }
});

app.put("/books/:id", async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!book) return res.status(404).json({ error: "Book not found" });
        res.json(book);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/books/:id", async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ error: "Book not found" });
        res.json({ message: "Book deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: "Invalid ID" });
    }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});