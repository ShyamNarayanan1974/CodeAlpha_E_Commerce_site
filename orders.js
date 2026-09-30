const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../data/db");

const TAX_RATE = 0.08;
const SHIPPING_FLAT_RATE = 5.99;

// POST /api/orders  { customer: { name, email, address }, payment: { cardName, cardNumber } }
router.post("/", (req, res) => {
  const { customer, payment } = req.body;
  const cartItems = db.getCartItems(req.sessionId);

  if (!cartItems.length) {
    return res.status(400).json({ error: "Cart is empty" });
  }
  if (!customer || !customer.name || !customer.email || !customer.address) {
    return res
      .status(400)
      .json({ error: "Missing required customer/shipping information" });
  }
  if (!payment || !payment.cardName || !payment.cardNumber) {
    return res.status(400).json({ error: "Missing payment information" });
  }

  const items = cartItems.map((item) => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    lineTotal: +(item.price * item.quantity).toFixed(2)
  }));

  const subtotal = +items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const shipping = subtotal > 0 ? SHIPPING_FLAT_RATE : 0;
  const total = +(subtotal + tax + shipping).toFixed(2);

  // NOTE: This is a simulated payment step for demo purposes only.
  // A real app would call a payment processor (Stripe, etc.) here and
  // never accept or store raw card numbers directly.
  const maskedCard = "**** **** **** " + String(payment.cardNumber).slice(-4);

  const order = {
    id: uuidv4(),
    userId: req.session.userId || null,
    createdAt: new Date().toISOString(),
    status: "confirmed",
    customer: {
      name: customer.name,
      email: customer.email,
      address: customer.address
    },
    payment: { cardName: payment.cardName, card: maskedCard },
    items,
    subtotal,
    tax,
    shipping,
    total
  };

  db.createOrder(order);
  items.forEach((item) => db.decrementStock(item.productId, item.quantity));
  db.clearCart(req.sessionId);

  res.status(201).json(order);
});

// GET /api/orders/mine  (order history for the logged-in user)
router.get("/mine", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "You must be logged in to view order history" });
  }
  res.json(db.listOrdersByUser(req.session.userId));
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

module.exports = router;
