const express = require("express");
const router = express.Router();
const db = require("../data/db");

function enrichCart(items) {
  const enriched = items.map((item) => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    lineTotal: +(item.price * item.quantity).toFixed(2)
  }));
  const subtotal = +enriched.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);
  return { items: enriched, subtotal };
}

// GET /api/cart
router.get("/", (req, res) => {
  res.json(enrichCart(db.getCartItems(req.sessionId)));
});
