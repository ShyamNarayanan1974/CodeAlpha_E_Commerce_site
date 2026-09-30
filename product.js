const express = require("express");
const router = express.Router();
const db = require("../data/db");

// GET /api/products?category=Electronics&search=watch
router.get("/", (req, res) => {
  const { category, search } = req.query;
  res.json(db.getProducts({ category, search }));
});

// GET /api/products/categories  (must come before /:id)
router.get("/categories", (req, res) => {
  res.json(db.getCategories());
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

module.exports = router;
