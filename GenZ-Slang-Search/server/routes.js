const express = require("express");
const db = require("./db");
const router = express.Router();

// Get all slang terms
router.get("/slang", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM slang_terms ORDER BY count DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search for a slang term
router.get("/slang/search", async (req, res) => {
  const term = req.query.term;
  try {
    const [rows] = await db.query("SELECT * FROM slang_terms WHERE term = ?", [
      term,
    ]);
    if (rows.length > 0) {
      // Increment the count
      await db.query(
        "UPDATE slang_terms SET count = count + 1 WHERE term = ?",
        [term]
      );
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: "Slang not found!" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new slang term
router.post("/slang", async (req, res) => {
  const { term, meaning } = req.body;
  try {
    // Check if the term already exists
    const [existing] = await db.query(
      "SELECT * FROM slang_terms WHERE term = ?",
      [term]
    );
    if (existing.length > 0) {
      // If it exists, update the count
      await db.query(
        "UPDATE slang_terms SET count = count + 1 WHERE term = ?",
        [term]
      );
      res.json({ message: "Slang count updated!" });
    } else {
      // If it doesn't exist, insert a new record
      await db.query(
        "INSERT INTO slang_terms (term, meaning, count) VALUES (?, ?, 1)",
        [term, meaning]
      );
      res.json({ message: "Slang added successfully!" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
