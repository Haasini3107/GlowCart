const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "5mb" }));

/* =========================
   FILES
========================= */

const PRODUCTS_FILE = path.join(__dirname, "products.json");
const USERS_FILE = path.join(__dirname, "users.json");
const ORDERS_FILE = path.join(__dirname, "place.json");

/* =========================
   ADMIN SETTINGS
   These MUST be in Render
   Environment Variables
========================= */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

/*
   Demo admin token.
   It will reset whenever the server restarts.
*/
let ADMIN_TOKEN = null;

/* =========================
   FILE FUNCTIONS
========================= */

function createFile(file, defaultData) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
    }
  } catch (error) {
    console.error("Error creating file:", file, error);
  }
}

function readJson(file) {
  try {
    if (!fs.existsSync(file)) {
      return [];
    }

    const data = fs.readFileSync(file, "utf8");

    if (!data.trim()) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON:", file, error);
    return [];
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing JSON:", file, error);
    return false;
  }
}

/* =========================
   CREATE FILES
========================= */

createFile(PRODUCTS_FILE, []);
createFile(USERS_FILE, []);
createFile(ORDERS_FILE, []);

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GlowCart Backend API is running!",
    version: "2.0",
  });
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "GlowCart API is working!",
    server: "online",
    time: new Date().toISOString(),
  });
});

/* =========================
   EMAILJS CONFIG
========================= */

app.get("/api/emailjs-config", (req, res) => {
  res.json({
    success: true,
    serviceId: process.env.EMAILJS_SERVICE_ID || "",
    publicKey: process.env.EMAILJS_PUBLIC_KEY || "",
    welcomeTemplateId: process.env.EMAILJS_WELCOME_TEMPLATE_ID || "",
    orderTemplateId: process.env.EMAILJS_ORDER_TEMPLATE_ID || "",
  });
});

/* =========================
   PRODUCTS
========================= */

app.get("/api/products", (req, res) => {
  try {
    const products = readJson(PRODUCTS_FILE);

    /*
      IMPORTANT:
      Existing GlowCart frontend expects
      an ARRAY here.
    */

    res.json(products);
  } catch (error) {
    console.error("Products error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load products",
    });
  }
});

/* =========================
   SINGLE PRODUCT
========================= */

app.get("/api/products/:id", (req, res) => {
  try {
    const products = readJson(PRODUCTS_FILE);

    const product = products.find(
      (item) => String(item.id) === String(req.params.id)
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    console.error("Single product error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load product",
    });
  }
});

/* =========================================================
   REGISTER USER
========================================================= */

app.post("/api/register", (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      address,
      pincode,
      address2,
      pincode2,
    } = req.body || {};

    /* Required fields */

    if (
      !name ||
      !email ||
      !mobile ||
      !password ||
      !address ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    /* Mobile validation */

    if (!/^[0-9]{10}$/.test(String(mobile))) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must contain exactly 10 digits.",
      });
    }

    /* Pincode validation */

    if (!/^[0-9]{6}$/.test(String(pincode))) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain exactly 6 digits.",
      });
    }

    /* Second pincode validation */

    if (pincode2 && !/^[0-9]{6}$/.test(String(pincode2))) {
      return res.status(400).json({
        success: false,
        message: "Second pincode must contain exactly 6 digits.",
      });
    }

    const users = readJson(USERS_FILE);

    /* Duplicate email */

    const existingUser = users.find(
      (user) =>
        String(user.email).toLowerCase() ===
        String(email).trim().toLowerCase()
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const newUser = {
      id: Date.now().toString(),

      name: String(name).trim(),

      email: String(email).trim().toLowerCase(),

      mobile: String(mobile).trim(),

      password: String(password),

      address: String(address).trim(),

      pincode: String(pincode).trim(),

      address2: address2 ? String(address2).trim() : "",

      pincode2: pincode2 ? String(pincode2).trim() : "",

      registeredAt: new Date().toISOString(),
    };

    users.push(newUser);

    const saved = writeJson(USERS_FILE, users);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Unable to save registration.",
      });
    }

    /*
      Password is NOT returned to frontend.
    */

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile,
      address: newUser.address,
      pincode: newUser.pincode,
      address2: newUser.address2,
      pincode2: newUser.pincode2,
      registeredAt: newUser.registeredAt,
    };

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      user: safeUser,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

/* =========================================================
   USER LOGIN
========================================================= */

app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const users = readJson(USERS_FILE);

    const user = users.find(
      (item) =>
        String(item.email).toLowerCase() ===
          String(email).trim().toLowerCase() &&
        String(item.password) === String(password)
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      pincode: user.pincode,
      address2: user.address2 || "",
      pincode2: user.pincode2 || "",
      registeredAt: user.registeredAt,
    };

    res.json({
      success: true,
      message: "Login successful!",
      user: safeUser,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

/* =========================================================
   ADMIN STATUS
   EASY TESTING ENDPOINT
========================================================= */

app.get("/api/admin/status", (req, res) => {
  res.json({
    success: true,
    adminApi: true,
    emailConfigured: Boolean(ADMIN_EMAIL),
    passwordConfigured: Boolean(ADMIN_PASSWORD),
    message: "Admin API is available.",
  });
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", (req, res) => {
  try {
    const { email, password } = req.body || {};

    console.log("Admin login request received");

    /* Check Render environment variables */

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("ADMIN_EMAIL or ADMIN_PASSWORD is missing.");

      return res.status(500).json({
        success: false,
        message:
          "Admin credentials are not configured in Render Environment Variables.",
      });
    }

    /* Check submitted credentials */

    const enteredEmail = String(email || "")
      .trim()
      .toLowerCase();

    const correctEmail = String(ADMIN_EMAIL)
      .trim()
      .toLowerCase();

    const enteredPassword = String(password || "");

    if (
      enteredEmail !== correctEmail ||
      enteredPassword !== String(ADMIN_PASSWORD)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin email or password.",
      });
    }

    /* Create admin token */

    ADMIN_TOKEN = crypto.randomBytes(32).toString("hex");

    console.log("Admin login successful.");

    return res.json({
      success: true,
      message: "Admin login successful!",
      token: ADMIN_TOKEN,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin login failed.",
    });
  }
});

/* =========================================================
   ADMIN AUTHENTICATION MIDDLEWARE
========================================================= */

function checkAdmin(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin authorization required.",
      });
    }

    const token = authorization.substring(7);

    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
      return res.status(401).json({
        success: false,
        message: "Admin session expired. Please login again.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authentication error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid admin authentication.",
    });
  }
}

/* =========================================================
   GET REGISTERED MEMBERS
========================================================= */

app.get("/api/admin/users", checkAdmin, (req, res) => {
  try {
    const users = readJson(USERS_FILE);

    /*
      IMPORTANT:
      NEVER send customer passwords
      to the admin frontend.
    */

    const safeUsers = users.map((user) => ({
      id: user.id || "",
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      address: user.address || "",
      pincode: user.pincode || "",
      address2: user.address2 || "",
      pincode2: user.pincode2 || "",
      registeredAt: user.registeredAt || "",
    }));

    return res.json({
      success: true,
      totalMembers: safeUsers.length,
      users: safeUsers,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load registered members.",
    });
  }
});

/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post("/api/admin/logout", checkAdmin, (req, res) => {
  ADMIN_TOKEN = null;

  res.json({
    success: true,
    message: "Admin logged out successfully.",
  });
});

/* =========================================================
   PLACE ORDER
========================================================= */

app.post("/api/orders", (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      address,
      pincode,
      items,
      subtotal,
      total,
    } = req.body || {};

    if (!name || !email || !address || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Customer and delivery details are required.",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    const subtotalValue = Number(subtotal) || 0;

    const gst = Number((subtotalValue * 0.18).toFixed(2));

    const totalValue =
      Number(total) || Number((subtotalValue + gst).toFixed(2));

    const orderId =
      "GC" +
      Date.now().toString().slice(-8);

    const order = {
      orderId,

      name: String(name).trim(),

      email: String(email).trim().toLowerCase(),

      mobile: mobile ? String(mobile).trim() : "",

      address: String(address).trim(),

      pincode: String(pincode).trim(),

      items,

      subtotal: subtotalValue,

      gst,

      gstRate: 18,

      total: totalValue,

      status: "Placed",

      orderedAt: new Date().toISOString(),
    };

    const orders = readJson(ORDERS_FILE);

    orders.push(order);

    const saved = writeJson(ORDERS_FILE, orders);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Unable to save order.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      emailSent: false,
      order,
    });
  } catch (error) {
    console.error("Order error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to place order.",
    });
  }
});

/* =========================================================
   GET ALL ORDERS
========================================================= */

app.get("/api/orders", (req, res) => {
  try {
    const orders = readJson(ORDERS_FILE);

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Orders error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load orders.",
    });
  }
});

/* =========================================================
   GET ORDERS BY EMAIL
========================================================= */

app.get("/api/orders/:email", (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email)
      .trim()
      .toLowerCase();

    const orders = readJson(ORDERS_FILE);

    const userOrders = orders.filter(
      (order) =>
        String(order.email).toLowerCase() === email
    );

    res.json({
      success: true,
      orders: userOrders,
    });
  } catch (error) {
    console.error("User orders error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load user orders.",
    });
  }
});

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  console.log("API endpoint not found:", req.method, req.originalUrl);

  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
    method: req.method,
    endpoint: req.originalUrl,
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log("GlowCart Backend Started");
  console.log("Port:", PORT);
  console.log("Admin Email Configured:", Boolean(ADMIN_EMAIL));
  console.log("Admin Password Configured:", Boolean(ADMIN_PASSWORD));
  console.log("======================================");
});
