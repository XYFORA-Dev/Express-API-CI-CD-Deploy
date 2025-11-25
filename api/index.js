import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import mongoose from "mongoose";

// === Fix 1: Connect to MongoDB inside a reusable promise ===
const connectDB = (() => {
    let conn = null;
    return async () => {
        if (conn == null) {
            if (!process.env.DATABASE_URL) {
                throw new Error("DATABASE_URL is not defined in environment variables");
            }
            conn = mongoose.connect(process.env.DATABASE_URL, {
                bufferCommands: false, // Disable mongoose buffering
            });
            await conn;
            console.log("MongoDB connected (new connection)");
        }
        return conn;
    };
})();

// === Schema & Model (define outside handler for reuse) ===
const bookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        author: { type: String, required: true },
    },
    { timestamps: true }
);

const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);

// === Express App ===
const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
    res.json({ message: "Express + Mongoose + MongoDB CRUD API - Working!" });
});

// === Routes ===
app.post("/books", async (req, res) => {
    try {
        await connectDB();
        const book = await Book.create(req.body);
        res.status(201).json(book);
    } catch (error) {
        console.error("POST /books error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/books", async (req, res) => {
    try {
        await connectDB();
        const books = await Book.find().lean();
        res.json(books);
    } catch (error) {
        console.error("GET /books error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/books/:id", async (req, res) => {
    try {
        await connectDB();
        const book = await Book.findById(req.params.id).lean();
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/books/:id", async (req, res) => {
    try {
        await connectDB();
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).lean();
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/books/:id", async (req, res) => {
    try {
        await connectDB();
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === Export for Vercel ===
export const handler = serverless(app);