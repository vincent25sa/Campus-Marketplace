const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./db");

const mockFile = path.join(__dirname, "mockUsers.json");
const users = JSON.parse(fs.readFileSync(mockFile, "utf8"));

const queryAsync = (sql, params) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

const formatMysqlDatetime = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date();
  return date.toISOString().slice(0, 19).replace("T", " ");
};

(async () => {
  try {
    for (const user of users) {
      const { username, email, password, created_at } = user;
      if (!username || !email || !password) continue;

      const [existing] = await queryAsync("SELECT id FROM users WHERE email = ?", [email]);
      if (existing && existing.id) {
        console.log(`Skipping existing email: ${email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await queryAsync(
        "INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, formatMysqlDatetime(created_at)]
      );
      console.log(`Inserted user: ${email}`);
    }
    console.log("Mock user seeding complete.");
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    db.end();
  }
})();
