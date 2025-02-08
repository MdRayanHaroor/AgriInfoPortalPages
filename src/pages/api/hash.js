import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Build an absolute path to .env.local which is 3 levels up from this file.
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

const password = process.env.ADMIN_KEY || "";

if (!password) {
  console.error("Error: ADMIN_KEY is not set.");
  process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error("Error hashing password:", err);
    process.exit(1);
  }
  console.log("Hashed Password:", hash);
});
