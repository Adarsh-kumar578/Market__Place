
const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const VERSION = process.env.VERSION || "v1";

const versionNumber = Number(VERSION.replace("v", ""));

if (![1, 2, 3].includes(versionNumber)) {
  throw new Error("VERSION must be v1, v2, or v3");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let nextSellerId = 1;
let nextProductId = 1;

const sellers = [];
const products = [];

function requireVersion(requiredVersion, res) {
  if (versionNumber < requiredVersion) {
    res.status(403).json({
      error: `This feature is available in v${requiredVersion} and above`
    });
    return false;
  }

  return true;
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: VERSION,
    application: "Marketplace System"
  });
});

// Register a seller — v1, v2, v3
app.post("/sellers", (req, res) => {
  const { name, email, businessName } = req.body;

  if (
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof businessName !== "string" || !businessName.trim()
  ) {
    return res.status(400).json({
      error: "Name, email and business name are required"
    });
  }

  const seller = {
    id: nextSellerId++,
    name: name.trim(),
    email: email.trim(),
    businessName: businessName.trim()
  };

  sellers.push(seller);

  res.status(201).json({
    message: "Seller registered successfully",
    seller
  });
});

// Add a product — v2 and v3
app.post("/products", (req, res) => {
  if (!requireVersion(2, res)) return;

  const { sellerId, name, price, quantity } = req.body;

  if (
    !Number.isInteger(Number(sellerId)) ||
    Number(sellerId) <= 0 ||
    typeof name !== "string" ||
    !name.trim() ||
    price === "" ||
    price === null ||
    price === undefined ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0 ||
    !Number.isInteger(Number(quantity)) ||
    Number(quantity) < 0
  ) {
    return res.status(400).json({
      error: "Provide a valid seller ID, product name, price and quantity"
    });
  }

  const seller = sellers.find(
    item => item.id === Number(sellerId)
  );

  if (!seller) {
    return res.status(404).json({
      error: "Seller not found. Register the seller first."
    });
  }

  const product = {
    id: nextProductId++,
    sellerId: seller.id,
    sellerName: seller.businessName,
    name: name.trim(),
    price: Number(price),
    quantity: Number(quantity)
  };

  products.push(product);

  res.status(201).json({
    message: "Product added successfully",
    product
  });
});

// View all products — v3
app.get("/products", (req, res) => {
  if (!requireVersion(3, res)) return;

  res.json({
    count: products.length,
    products
  });
});

// Friendly response for unsupported routes
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Marketplace ${VERSION} running on port ${PORT}`
  );
});
