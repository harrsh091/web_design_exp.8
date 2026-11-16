// script.js - frontend logic: talks to the REST API using fetch()

const API_URL = "/api/books";

// DOM elements
const idInput = document.getElementById("book-id");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const yearInput = document.getElementById("year");
const genreInput = document.getElementById("genre");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formHeading = document.getElementById("form-heading");
const messageBox = document.getElementById("message");
const bookList = document.getElementById("book-list");
const emptyText = document.getElementById("empty");
const countText = document.getElementById("count");
const searchInput = document.getElementById("search");

// ---------- Helpers ----------
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = "message " + type;
  setTimeout(() => {
    messageBox.className = "message";
  }, 3500);
}

function resetForm() {
  idInput.value = "";
  titleInput.value = "";
  authorInput.value = "";
  yearInput.value = "";
  genreInput.value = "";
  formHeading.textContent = "Add a book";
  saveBtn.textContent = "Add book";
  cancelBtn.classList.add("hidden");
}

// ---------- READ: load and display books ----------
async function loadBooks() {
  try {
    const query = searchInput.value.trim();
    const url = query ? `${API_URL}?search=${encodeURIComponent(query)}` : API_URL;
    const response = await fetch(url);
    const books = await response.json();
    renderBooks(books);
  } catch (error) {
    showMessage("Could not reach the server. Is it running?", "error");
  }
}

function renderBooks(books) {
  bookList.innerHTML = "";
  countText.textContent = `(${books.length})`;
  emptyText.classList.toggle("hidden", books.length > 0);

  books.forEach((book) => {
    const row = document.createElement("tr");

    // textContent is used so book data can never inject HTML
    [book.id, book.title, book.author, book.year ?? "-", book.genre || "-"].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    actionCell.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-secondary btn-small";
    editBtn.addEventListener("click", () => startEdit(book));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-danger btn-small";
    deleteBtn.addEventListener("click", () => deleteBook(book));

    actionCell.append(editBtn, deleteBtn);
    row.appendChild(actionCell);
    bookList.appendChild(row);
  });
}

// ---------- CREATE and UPDATE ----------
async function saveBook() {
  const id = idInput.value;
  const bookData = {
    title: titleInput.value,
    author: authorInput.value,
    year: yearInput.value,
    genre: genreInput.value,
  };

  const isEditing = id !== "";
  const url = isEditing ? `${API_URL}/${id}` : API_URL;
  const method = isEditing ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    const result = await response.json();

    if (!response.ok) {
      const text = result.errors ? result.errors.join(", ") : result.error;
      showMessage(text, "error");
      return;
    }

    showMessage(isEditing ? "Book updated." : "Book added.", "success");
    resetForm();
    loadBooks();
  } catch (error) {
    showMessage("Could not reach the server. Is it running?", "error");
  }
}

// Fill the form with an existing book for editing
function startEdit(book) {
  idInput.value = book.id;
  titleInput.value = book.title;
  authorInput.value = book.author;
  yearInput.value = book.year ?? "";
  genreInput.value = book.genre;
  formHeading.textContent = "Edit book";
  saveBtn.textContent = "Save changes";
  cancelBtn.classList.remove("hidden");
  titleInput.focus();
}

// ---------- DELETE ----------
async function deleteBook(book) {
  if (!confirm(`Delete "${book.title}"?`)) return;

  try {
    const response = await fetch(`${API_URL}/${book.id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      showMessage(result.error, "error");
      return;
    }
    showMessage("Book deleted.", "success");
    if (idInput.value === String(book.id)) resetForm();
    loadBooks();
  } catch (error) {
    showMessage("Could not reach the server. Is it running?", "error");
  }
}

// ---------- Event listeners ----------
saveBtn.addEventListener("click", saveBook);
cancelBtn.addEventListener("click", resetForm);
searchInput.addEventListener("input", loadBooks);

// Load books when the page opens
loadBooks();
