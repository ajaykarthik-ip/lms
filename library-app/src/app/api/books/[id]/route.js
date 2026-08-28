import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBooks } from "@/lib/mongodb";

const notFound = () =>
  NextResponse.json({ error: "Book not found" }, { status: 404 });

function toObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function GET(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  const books = await getBooks();
  const doc = await books.findOne({ _id });
  if (!doc) return notFound();

  return NextResponse.json({ ...doc, _id: doc._id.toString() });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  const body = await request.json();
  const update = {};

  // Only touch the fields that were actually sent, so the borrow/return
  // toggle and the edit form can both use this handler.
  if (body.title !== undefined) update.title = body.title.trim();
  if (body.author !== undefined) update.author = body.author.trim();
  if (body.isbn !== undefined) update.isbn = body.isbn.trim();
  if (body.category !== undefined) update.category = body.category.trim();
  if (body.copies !== undefined) update.copies = Number(body.copies) || 1;
  if (body.borrowedBy !== undefined) {
    update.borrowedBy = body.borrowedBy?.trim() || null;
    update.borrowedAt = update.borrowedBy ? new Date() : null;
  }

  if ("title" in update && !update.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if ("author" in update && !update.author) {
    return NextResponse.json({ error: "Author is required" }, { status: 400 });
  }

  const books = await getBooks();
  const doc = await books.findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: "after" }
  );
  if (!doc) return notFound();

  return NextResponse.json({ ...doc, _id: doc._id.toString() });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return notFound();

  const books = await getBooks();
  const result = await books.deleteOne({ _id });
  if (!result.deletedCount) return notFound();

  return NextResponse.json({ ok: true });
}
