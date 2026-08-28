"use client";

import { useCallback, useEffect, useState } from "react";

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  copies: 1,
};

export default function Home() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBooks = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Could not load books");
      setBooks(await res.json());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce the search box so we aren't hitting the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => loadBooks(search), 300);
    return () => clearTimeout(timer);
  }, [search, loadBooks]);

  const setField = (name) => (e) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editingId ? `/api/books/${editingId}` : "/api/books";
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
      return;
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    loadBooks(search);
  }

  function startEdit(book) {
    setEditingId(book._id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      category: book.category || "",
      copies: book.copies || 1,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function removeBook(id) {
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    loadBooks(search);
  }

  async function toggleBorrow(book) {
    let borrowedBy = null;
    if (!book.borrowedBy) {
      borrowedBy = prompt("Issue to (borrower name):")?.trim();
      if (!borrowedBy) return;
    }
    await fetch(`/api/books/${book._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrowedBy }),
    });
    loadBooks(search);
  }

  const available = books.filter((b) => !b.borrowedBy).length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Library Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {books.length} book{books.length === 1 ? "" : "s"} &middot;{" "}
          {available} available &middot; {books.length - available} issued
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          {editingId ? "Edit book" : "Add a book"}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Title *">
            <input
              required
              value={form.title}
              onChange={setField("title")}
              className={inputClass}
              placeholder="The Pragmatic Programmer"
            />
          </Field>
          <Field label="Author *">
            <input
              required
              value={form.author}
              onChange={setField("author")}
              className={inputClass}
              placeholder="Andrew Hunt"
            />
          </Field>
          <Field label="ISBN">
            <input
              value={form.isbn}
              onChange={setField("isbn")}
              className={inputClass}
              placeholder="978-0135957059"
            />
          </Field>
          <Field label="Category">
            <input
              value={form.category}
              onChange={setField("category")}
              className={inputClass}
              placeholder="Software"
            />
          </Field>
          <Field label="Copies">
            <input
              type="number"
              min="1"
              value={form.copies}
              onChange={setField("copies")}
              className={inputClass}
            />
          </Field>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {editingId ? "Save changes" : "Add book"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
          placeholder="Search by title, author or ISBN..."
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            Loading...
          </p>
        ) : books.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            No books yet. Add one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Copies</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((book) => (
                  <tr key={book._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      {book.title}
                      {book.isbn && (
                        <span className="block text-xs text-slate-400">
                          {book.isbn}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{book.author}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {book.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{book.copies}</td>
                    <td className="px-4 py-3">
                      {book.borrowedBy ? (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          Issued to {book.borrowedBy}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                          Available
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-medium">
                        <button
                          onClick={() => toggleBorrow(book)}
                          className="text-slate-700 hover:underline"
                        >
                          {book.borrowedBy ? "Return" : "Issue"}
                        </button>
                        <button
                          onClick={() => startEdit(book)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeBook(book._id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}
