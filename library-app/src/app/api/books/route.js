import { NextResponse } from "next/server";
import { getBooks } from "@/lib/mongodb";

const serialize = (doc) => ({ ...doc, _id: doc._id.toString() });

// The search box goes straight into a $regex, so escape anything special.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request) {
  const raw = request.nextUrl.searchParams.get("q")?.trim();
  const q = raw ? escapeRegex(raw) : "";

  const filter = q
    ? {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { author: { $regex: q, $options: "i" } },
          { isbn: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const books = await getBooks();
  const docs = await books.find(filter).sort({ createdAt: -1 }).toArray();

  return NextResponse.json(docs.map(serialize));
}

export async function POST(request) {
  const body = await request.json();
  const title = body.title?.trim();
  const author = body.author?.trim();

  if (!title || !author) {
    return NextResponse.json(
      { error: "Title and author are required" },
      { status: 400 }
    );
  }

  const doc = {
    title,
    author,
    isbn: body.isbn?.trim() || "",
    category: body.category?.trim() || "",
    copies: Number(body.copies) > 0 ? Number(body.copies) : 1,
    borrowedBy: null,
    createdAt: new Date(),
  };

  const books = await getBooks();
  const result = await books.insertOne(doc);

  return NextResponse.json(serialize({ ...doc, _id: result.insertedId }), {
    status: 201,
  });
}
