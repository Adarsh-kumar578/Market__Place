
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const VERSION = process.env.VERSION || "v1";

const versionMatch = /^v([123])$/.exec(VERSION);

if (!versionMatch) {
  throw new Error("VERSION must be v1, v2, or v3");
}

const versionNumber = Number(versionMatch[1]);

// Shared data file used by all three local versions.
const DATA_FILE = path.join(__dirname, "data.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ sellers: [], products: [] }, null, 2)
    );
  }
}

function readData() {
  ensureDataFile();

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  return {
    sellers: Array.isArray(data.sellers) ? data.sellers : [],
    products: Array.isArray(data.products) ? data.products : []
  };
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Enforce exactly one feature per version.
function requireExactVersion(requiredVersion, res) {
  if (versionNumber !== requiredVersion) {
    res.status(403).json({
      error: `This endpoint is available only in v${requiredVersion}`
    });
    return false;
  }

  return true;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check: available in every version.
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: VERSION,
    application: "Marketplace System"
  });
});

// FEATURE 1: Register Seller — v1 only.
app.post("/sellers", (req, res) => {
  if (!requireExactVersion(1, res)) return;

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

  const data = readData();

  const seller = {
    id: Math.max(0, ...data.sellers.map(s => s.id)) + 1,
    name: name.trim(),
    email: email.trim(),
    businessName: businessName.trim()
  };

  data.sellers.push(seller);
  writeData(data);

  res.status(201).json({
    message: "Seller registered successfully",
    seller
  });
});

// FEATURE 2: Add Product — v2 only.
app.post("/products", (req, res) => {
  if (!requireExactVersion(2, res)) return;

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
    quantity === "" ||
    quantity === null ||
    quantity === undefined ||
    !Number.isInteger(Number(quantity)) ||
    Number(quantity) < 0
  ) {
    return res.status(400).json({
      error: "Provide a valid seller ID, product name, price and quantity"
    });
  }

  const data = readData();

  const seller = data.sellers.find(
    item => item.id === Number(sellerId)
  );

  if (!seller) {
    return res.status(404).json({
      error: "Seller not found. Register a seller in v1 first."
    });
  }

  const product = {
    id: Math.max(0, ...data.products.map(p => p.id)) + 1,
    sellerId: seller.id,
    sellerName: seller.businessName,
    name: name.trim(),
    price: Number(price),
    quantity: Number(quantity)
  };

  data.products.push(product);
  writeData(data);

  res.status(201).json({
    message: "Product added successfully",
    product
  });
});

// FEATURE 3: View All Products — v3 only.
app.get("/products", (req, res) => {
  if (!requireExactVersion(3, res)) return;

  const data = readData();

  res.json({
    count: data.products.length,
    products: data.products
  });
});

// Unsupported endpoints.
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Marketplace ${VERSION} running on port ${PORT}`);
});
