const express = require("express");
const path = require("path");
const cookieSession = require("cookie-session");
const { v4: uuidv4 } = require("uuid");

const productsRouter = require("./routes/products");
const cartRouter = require("./routes/cart");
const ordersRouter = require("./routes/orders");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Cookie-based session. session.id identifies a visitor's cart (works for
// guests too); session.userId is set once someone registers or logs in and
// is what ties orders to a user account.
app.use(
  cookieSession({
    name: "session",
    keys: ["dev-secret-key-change-me"],
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })
);

app.use((req, res, next) => {
  if (!req.session.id) {
    req.session.id = uuidv4();
  }
  req.sessionId = req.session.id;
  next();
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);

// Static frontend
app.use(express.static(path.join(__dirname, "public")));

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
