import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import mongoose from "mongoose";

mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true }
}, { timestamps: true });

const Book = mongoose.model("Book", bookSchema);

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Express + Mongoose + MongoDB CRUD API");
});

app.post("/books", async (req, res) => {
    try {
        const book = await Book.create(req.body);
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/books", async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/books/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/books/:id", async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/books/:id", async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json({ message: "Book deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
        console.log(`Server running locally on http://localhost:${port}`);
    });
}

export const handler = serverless(app);