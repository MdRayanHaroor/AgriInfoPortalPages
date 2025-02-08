const path = require('path');
// Build an absolute path to .env.local which is 3 levels up from src/pages/api
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

const bcrypt = require("bcryptjs");

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
