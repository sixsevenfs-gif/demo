import { Db, GridFSBucket, MongoClient, ObjectId } from "mongodb";

let clientPromise: Promise<MongoClient> | undefined;

async function database(): Promise<Db> {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not configured");
  if (!clientPromise) clientPromise = new MongoClient(uri).connect();
  const client = await clientPromise;
  return client.db();
}

export async function uploadEvidence(
  buffer: Buffer,
  filename: string,
  mimeType: string,
) {
  const bucket = new GridFSBucket(await database(), { bucketName: "evidence" });
  return new Promise<ObjectId>((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, { contentType: mimeType });
    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id));
    stream.end(buffer);
  });
}

export async function readEvidence(id: string) {
  const bucket = new GridFSBucket(await database(), { bucketName: "evidence" });
  return bucket.openDownloadStream(new ObjectId(id));
}

export async function clearEvidence(): Promise<number> {
  const db = await database();
  const files = await db
    .collection("evidence.files")
    .find({}, { projection: { _id: 1 } })
    .toArray();
  if (files.length === 0) return 0;

  const bucket = new GridFSBucket(db, { bucketName: "evidence" });
  await Promise.all(files.map((file) => bucket.delete(file._id)));
  return files.length;
}
