const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 10000;

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "5mb" }));

// ======================================================
// CONFIGURATION
// ======================================================

const DATABASE_URL = process.env.DATABASE_URL;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const EMAILJS_SERVICE_ID =
  process.env.EMAILJS_SERVICE_ID || "service_nb7q38o";

const EMAILJS_PUBLIC_KEY =
  process.env.EMAILJS_PUBLIC_KEY || "O8MGjkU2KThjrZ31Y";

const EMAILJS_WELCOME_TEMPLATE_ID =
  process.env.EMAILJS_WELCOME_TEMPLATE_ID || "template_giqmpm9";

const EMAILJS_ORDER_TEMPLATE_ID =
  process.env.EMAILJS_ORDER_TEMPLATE_ID || "template_ykzf36";

// ======================================================
// DATABASE
// ======================================================

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is missing.");
  console.error("Add DATABASE_URL in Render Environment Variables.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ======================================================
// JSON PRODUCT FILE
// ======================================================

const PRODUCTS_FILE = path.join(__dirname, "products.json");

function createFile(file, defaultData) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
  }
}

function readJson(file, defaultData) {
  try {
    createFile(file, defaultData);
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.error("JSON read error:", error);
    return defaultData;
  }
}

// ======================================================
// DATABASE INITIALIZATION
// ======================================================

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        mobile TEXT NOT NULL,
        password TEXT NOT NULL,
        address TEXT NOT NULL,
        address2 TEXT DEFAULT '',
        pincode TEXT NOT NULL,
        registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        mobile TEXT,
        address TEXT,
        address2 TEXT,
        pincode TEXT,
        items JSONB NOT NULL,
        subtotal NUMERIC(12,2) DEFAULT 0,
        gst_rate NUMERIC(5,2) DEFAULT 18,
        gst NUMERIC(12,2) DEFAULT 0,
        total NUMERIC(12,2) DEFAULT 0,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'Pending',
        order_status TEXT DEFAULT 'Placed',
        ordered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("PostgreSQL database initialized successfully.");

    // --------------------------------------------------
    // OPTIONAL MIGRATION FROM OLD users.json
    // --------------------------------------------------

    const oldUsersFile = path.join(__dirname, "users.json");

    if (fs.existsSync(oldUsersFile)) {
      try {
        const oldUsers = JSON.parse(
          fs.readFileSync(oldUsersFile, "utf8")
        );

        if (Array.isArray(oldUsers)) {
          for (const user of oldUsers) {
            if (!user.email) continue;

            await pool.query(
              `
              INSERT INTO users
              (name, email, mobile, password, address, address2, pincode)
              VALUES ($1,$2,$3,$4,$5,$6,$7)
              ON CONFLICT (email) DO NOTHING
              `,
              [
                user.name || "",
                user.email.toLowerCase().trim(),
                user.mobile || "",
                user.password || "",
                user.address || "",
                user.address2 || "",
                user.pincode || "",
              ]
            );
          }

          console.log("Old users.json migration checked.");
        }
      } catch (error) {
        console.log("Old users.json migration skipped:", error.message);
      }
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

// ======================================================
// EMAILJS
// ======================================================

async function sendEmailJS(templateId, templateParams) {
  try {
    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: templateId,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: templateParams,
        }),
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("EmailJS error:", response.status, text);

      return {
        success: false,
        message: text,
      };
    }

    console.log("Email sent successfully.");

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("Email sending failed:", error);

    return {
      success: false,
      message: error.message,
    };
  }
}

// ======================================================
// WELCOME EMAIL
// ======================================================

async function sendWelcomeEmail(user) {
  return await sendEmailJS(
    EMAILJS_WELCOME_TEMPLATE_ID,
    {
      to_email: user.email,
      to_name: user.name,

      user_name: user.name,
      user_email: user.email,

      name: user.name,
      email: user.email,

      message:
        "Welcome to GlowCart! Your account has been registered successfully.",
    }
  );
}

// ======================================================
// ORDER EMAIL
// ======================================================

async function sendOrderEmail(order) {
  const itemsText = Array.isArray(order.items)
    ? order.items
        .map(
          (item) =>
            `${item.name} x ${item.quantity || 1} - ₹${
              Number(item.price) * Number(item.quantity || 1)
            }`
        )
        .join("\n")
    : "";

  return await sendEmailJS(
    EMAILJS_ORDER_TEMPLATE_ID,
    {
      to_email: order.email,
      to_name: order.name,

      user_name: order.name,
      user_email: order.email,

      order_id: order.orderId,

      items: itemsText,

      subtotal: order.subtotal,
      gst: order.gst,
      total: order.total,

      payment_method: order.paymentMethod,

      address: order.address,
      pincode: order.pincode,

      message:
        "Thank you for shopping with GlowCart. Your order has been placed successfully.",
    }
  );
}

// ======================================================
// FRONTEND
// ======================================================

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("GlowCart index.html not found.");
  }
});

// ======================================================
// HEALTH
// ======================================================

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      message: "GlowCart backend and database are working!",
      database: "PostgreSQL connected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ======================================================
// PRODUCTS
// ======================================================

app.get("/api/products", (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);

  res.json({
    success: true,
    products,
  });
});

// ======================================================
// REGISTER
// ======================================================

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      address,
      address2,
      pincode,
    } = req.body;

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

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please login.",
      });
    }

    // Save permanently in PostgreSQL
    const result = await pool.query(
      `
      INSERT INTO users
      (name, email, mobile, password, address, address2, pincode)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, name, email, mobile, address, address2, pincode, registered_at
      `,
      [
        name.trim(),
        cleanEmail,
        mobile.trim(),
        password,
        address.trim(),
        address2 ? address2.trim() : "",
        pincode.trim(),
      ]
    );

    const user = result.rows[0];

    // Send email to the exact registered email
    const emailResult = await sendWelcomeEmail(user);

    console.log(
      `New member registered: ${user.name} <${user.email}>`
    );

    res.status(201).json({
      success: true,
      message: emailResult.success
        ? "Registration successful! Welcome email sent to your registered email."
        : "Registration successful, but the welcome email could not be sent.",
      emailSent: emailResult.success,
      emailMessage: emailResult.message,
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
});

// ======================================================
// LOGIN
// ======================================================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    if (user.password !== password) {
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
      address2: user.address2,
      pincode: user.pincode,
      registered_at: user.registered_at,
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
      error: error.message,
    });
  }
});

// ======================================================
// ADMIN
// ======================================================

let ADMIN_TOKEN = null;

app.get("/api/admin/status", (req, res) => {
  res.json({
    success: true,
    adminConfigured: Boolean(
      ADMIN_EMAIL && ADMIN_PASSWORD
    ),
  });
});

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD
  ) {
    return res.status(500).json({
      success: false,
      message:
        "Admin credentials are not configured in Render.",
    });
  }

  if (
    email === ADMIN_EMAIL &&
    password === ADMIN_PASSWORD
  ) {
    ADMIN_TOKEN = crypto
      .randomBytes(32)
      .toString("hex");

    return res.json({
      success: true,
      message: "Admin login successful.",
      token: ADMIN_TOKEN,
    });
  }

  res.status(401).json({
    success: false,
    message: "Invalid admin email or password.",
  });
});

// ADMIN AUTH
function checkAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : "";

  if (
    !ADMIN_TOKEN ||
    token !== ADMIN_TOKEN
  ) {
    return res.status(401).json({
      success: false,
      message: "Admin authentication required.",
    });
  }

  next();
}

// ======================================================
// ADMIN - REGISTERED MEMBERS
// ======================================================

app.get(
  "/api/admin/users",
  checkAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          name,
          email,
          mobile,
          address,
          address2,
          pincode,
          registered_at
        FROM users
        ORDER BY registered_at DESC
      `);

      res.json({
        success: true,
        totalMembers: result.rows.length,
        users: result.rows,
      });
    } catch (error) {
      console.error("Admin users error:", error);

      res.status(500).json({
        success: false,
        message: "Could not load registered members.",
        error: error.message,
      });
    }
  }
);

// ======================================================
// ADMIN LOGOUT
// ======================================================

app.post(
  "/api/admin/logout",
  checkAdmin,
  (req, res) => {
    ADMIN_TOKEN = null;

    res.json({
      success: true,
      message: "Admin logged out.",
    });
  }
);

// ======================================================
// PLACE ORDER
// ======================================================

app.post("/api/orders", async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      address,
      address2,
      pincode,
      items,
      subtotal,
      gst,
      total,
      paymentMethod,
    } = req.body;

    if (!name || !email || !items || !total) {
      return res.status(400).json({
        success: false,
        message: "Missing order information.",
      });
    }

    const orderId =
      "GC" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    const order = {
      orderId,
      name,
      email: email.toLowerCase().trim(),
      mobile: mobile || "",
      address: address || "",
      address2: address2 || "",
      pincode: pincode || "",
      items: Array.isArray(items) ? items : [],
      subtotal: Number(subtotal || 0),
      gst: Number(gst || 0),
      total: Number(total || 0),
      paymentMethod: paymentMethod || "Cash on Delivery",
    };

    await pool.query(
      `
      INSERT INTO orders
      (
        order_id,
        name,
        email,
        mobile,
        address,
        address2,
        pincode,
        items,
        subtotal,
        gst,
        total,
        payment_method
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        order.orderId,
        order.name,
        order.email,
        order.mobile,
        order.address,
        order.address2,
        order.pincode,
        JSON.stringify(order.items),
        order.subtotal,
        18,
        order.gst,
        order.total,
        order.paymentMethod,
      ]
    );

    // Send order confirmation email
    const emailResult = await sendOrderEmail(order);

    res.status(201).json({
      success: true,
      message: emailResult.success
        ? "Order placed successfully! Confirmation email sent."
        : "Order placed successfully, but confirmation email could not be sent.",
      emailSent: emailResult.success,
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Order error:", error);

    res.status(500).json({
      success: false,
      message: "Could not place order.",
      error: error.message,
    });
  }
});

// ======================================================
// GET ALL ORDERS
// ======================================================

app.get(
  "/api/orders",
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT *
        FROM orders
        ORDER BY ordered_at DESC
      `);

      res.json({
        success: true,
        orders: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Could not load orders.",
        error: error.message,
      });
    }
  }
);

// ======================================================
// GET ORDERS FOR ONE USER
// ======================================================

app.get(
  "/api/orders/:email",
  async (req, res) => {
    try {
      const email = req.params.email
        .toLowerCase()
        .trim();

      const result = await pool.query(
        `
        SELECT *
        FROM orders
        WHERE email = $1
        ORDER BY ordered_at DESC
        `,
        [email]
      );

      res.json({
        success: true,
        orders: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Could not load user orders.",
        error: error.message,
      });
    }
  }
);

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// ======================================================
// START SERVER
// ======================================================

async function startServer() {
  await initDatabase();

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `GlowCart running on port ${PORT}`
      );
    }
  );
}

startServer().catch((error) => {
  console.error(
    "GlowCart failed to start:",
    error
  );

  process.exit(1);
});
