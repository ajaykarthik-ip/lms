import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "library";

// Reuse the client across hot reloads in dev so we don't open a new pool
// on every file change.
let clientPromise = global._mongoClientPromise;

if (!clientPromise) {
  clientPromise = new MongoClient(uri).connect();
  global._mongoClientPromise = clientPromise;
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getBooks() {
  const db = await getDb();
  return db.collection("books");
}
