// for manually hashing passwords
const bcrypt = require("bcryptjs");

const password = "rragro#5752"; // Replace with your desired admin password

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error("Error hashing password:", err);
    process.exit(1);
  }
  console.log("Hashed Password:", hash);
});
