// server.js - RESTful API for managing a book collection (CRUD)
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(express.json());                                   // parse JSON request bodies
app.use(express.static(path.join(__dirname, "public")));   // serve the frontend

// ---------- In-memory data store ----------
let books = [
  { id: 1, title: "The God of Small Things", author: "Arundhati Roy", year: 1997, genre: "Fiction" },
  { id: 2, title: "Wings of Fire", author: "A. P. J. Abdul Kalam", year: 1999, genre: "Autobiography" },
  { id: 3, title: "The Guide", author: "R. K. Narayan", year: 1958, genre: "Fiction" },
];
let nextId = 4;

// ---------- Helper: validate request body ----------
function validateBook(body) {
  const errors = [];
  const { title, author, year } = body;

  if (typeof title !== "string" || title.trim() === "") {
    errors.push("title is required");
  }
  if (typeof author !== "string" || author.trim() === "") {
    errors.push("author is required");
  }
  if (year !== undefined && year !== null && year !== "") {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 0 || y > new Date().getFullYear()) {
      errors.push("year must be a valid whole number");
    }
  }
  return errors;
}

function cleanBook(body) {
  return {
    title: body.title.trim(),
    author: body.author.trim(),
    year: body.year === undefined || body.year === null || body.year === "" ? null : Number(body.year),
    genre: typeof body.genre === "string" ? body.genre.trim() : "",
  };
}

// ---------- Routes ----------

// READ all books  (optional search: /api/books?search=text)
app.get("/api/books", (req, res) => {
  const { search } = req.query;
  if (search) {
    const q = search.toLowerCase();
    const result = books.filter(
      (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
    );
    return res.json(result);
  }
  res.json(books);
});

// READ one book
app.get("/api/books/:id", (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

// CREATE a book
app.post("/api/books", (req, res) => {
  const errors = validateBook(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const book = { id: nextId++, ...cleanBook(req.body) };
  books.push(book);
  res.status(201).json(book);
});

// UPDATE a book (replaces the whole record)
app.put("/api/books/:id", (req, res) => {
  const index = books.findIndex((b) => b.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Book not found" });

  const errors = validateBook(req.body);
  if (errors.length) return res.status(400).json({ errors });

  books[index] = { id: books[index].id, ...cleanBook(req.body) };
  res.json(books[index]);
});

// DELETE a book
app.delete("/api/books/:id", (req, res) => {
  const index = books.findIndex((b) => b.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Book not found" });

  const [removed] = books.splice(index, 1);
  res.json({ message: "Book deleted", book: removed });
});

// ---------- Error handling ----------
// Unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Invalid JSON or any other error
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Book API running at http://localhost:${PORT}`);
});
