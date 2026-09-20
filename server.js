const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const { Resend } = require("resend");

const app = express();

/* =========================================================
   CONFIGURATION
========================================================= */

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

const DATABASE_URL = process.env.DATABASE_URL;

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@example.com";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "change-this-password";

const ADMIN_TOKEN = "glowcart-admin-session";

const EMAIL_FROM =
  process.env.EMAIL_FROM || "GlowCart <onboarding@resend.dev>";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/* =========================================================
   DATABASE
========================================================= */

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   FRONTEND
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use(express.static(__dirname));

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {
  try {
    console.log("Connecting to PostgreSQL...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(30),
        password TEXT NOT NULL,
        permanent_address TEXT,
        another_address TEXT,
        pincode VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /*
      If your old users table already exists without the new
      address columns, these ALTER commands add them safely.
    */

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS permanent_address TEXT
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS another_address TEXT
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS pincode VARCHAR(20)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(150),
        mobile VARCHAR(30),
        address TEXT,
        pincode VARCHAR(20),
        items JSONB NOT NULL,
        total NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_email
      ON orders(user_email)
    `);

    const productCount = await pool.query(
      "SELECT COUNT(*) AS count FROM products"
    );

    if (Number(productCount.rows[0].count) === 0) {
      await pool.query(
        `
        INSERT INTO products
        (name, description, price, image)
        VALUES
        ($1, $2, $3, $4),
        ($5, $6, $7, $8),
        ($9, $10, $11, $12),
        ($13, $14, $15, $16)
        `,
        [
          "Glow Radiance Cream",
          "Brightening face cream for radiant looking skin.",
          499,
          "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80",

          "Vitamin C Face Cream",
          "Vitamin C face cream for a fresh and glowing look.",
          599,
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",

          "Hydra Moisturizing Cream",
          "Hydrating cream for soft and moisturized skin.",
          449,
          "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=600&q=80",

          "Aloe Vera Face Cream",
          "Gentle aloe vera cream for everyday skincare.",
          399,
          "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80"
        ]
      );

      console.log("Default products inserted.");
    }

    console.log("PostgreSQL database ready.");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      success: true,
      message: "GlowCart backend is running.",
      database: "connected"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Backend is running but database connection failed."
    });
  }
});

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

function checkAdmin(req, res, next) {
  const auth = req.headers.authorization || "";

  const token = auth.startsWith("Bearer ")
    ? auth.substring(7)
    : "";

  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized admin access."
    });
  }

  next();
}

/* =========================================================
   EMAIL - WELCOME
========================================================= */

async function sendWelcomeEmail(user) {
  if (!resend) {
    console.log("Resend is not configured.");
    return {
      sent: false,
      reason: "RESEND_API_KEY is not configured."
    };
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: [user.email],
      subject: "Welcome to GlowCart 💖",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="
          margin:0;
          padding:0;
          font-family:Arial,sans-serif;
          background:#fdf2f8;
        ">

          <div style="
            max-width:600px;
            margin:30px auto;
            background:white;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 5px 20px rgba(0,0,0,0.08);
          ">

            <div style="
              padding:30px;
              text-align:center;
              background:linear-gradient(
                135deg,
                #ec4899,
                #8b5cf6
              );
              color:white;
            ">
              <h1 style="margin:0;">
                GlowCart 💖
              </h1>

              <p style="margin-top:10px;">
                Premium Face Creams
              </p>
            </div>

            <div style="padding:30px;">

              <h2>
                Welcome, ${escapeHtml(user.full_name)}!
              </h2>

              <p>
                Thank you for registering with GlowCart.
              </p>

              <p>
                Your account has been successfully created.
              </p>

              <div style="
                background:#fdf2f8;
                padding:18px;
                border-radius:12px;
                margin:20px 0;
              ">
                <strong>Registered Email:</strong>
                ${escapeHtml(user.email)}
                <br><br>

                <strong>Mobile:</strong>
                ${escapeHtml(user.mobile || "")}
              </div>

              <p>
                You can now login and explore our skincare collection.
              </p>

              <p style="color:#777;">
                Thank you for choosing GlowCart 💕
              </p>

            </div>

          </div>

        </body>
        </html>
      `
    });

    if (response.error) {
      console.error("Welcome email error:", response.error);

      return {
        sent: false,
        error: response.error
      };
    }

    return {
      sent: true,
      id: response.data?.id || null
    };
  } catch (error) {
    console.error("Welcome email exception:", error);

    return {
      sent: false,
      error: error.message
    };
  }
}

/* =========================================================
   EMAIL - ORDER
========================================================= */

async function sendOrderEmail(order) {
  if (!resend) {
    return {
      sent: false,
      reason: "RESEND_API_KEY is not configured."
    };
  }

  try {
    const itemRows = (order.items || [])
      .map(
        (item) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">
              ${escapeHtml(item.name)}
            </td>

            <td style="
              padding:10px;
              border-bottom:1px solid #eee;
              text-align:center;
            ">
              ${Number(item.quantity || 1)}
            </td>

            <td style="
              padding:10px;
              border-bottom:1px solid #eee;
              text-align:right;
            ">
              ₹${(
                Number(item.price || 0) *
                Number(item.quantity || 1)
              ).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join("");

    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: [order.user_email],
      subject: `GlowCart Order Confirmation #${order.id} 💖`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="
          margin:0;
          padding:0;
          font-family:Arial,sans-serif;
          background:#fdf2f8;
        ">

          <div style="
            max-width:650px;
            margin:30px auto;
            background:#fff;
            border-radius:20px;
            overflow:hidden;
          ">

            <div style="
              background:linear-gradient(
                135deg,
                #ec4899,
                #8b5cf6
              );
              padding:30px;
              color:white;
              text-align:center;
            ">
              <h1 style="margin:0;">
                GlowCart 💖
              </h1>

              <p>
                Order Confirmation
              </p>
            </div>

            <div style="padding:30px;">

              <h2>
                Thank you, ${escapeHtml(order.customer_name || "")}!
              </h2>

              <p>
                Your order has been successfully placed.
              </p>

              <p>
                <strong>Order ID:</strong> #${order.id}
              </p>

              <table style="
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
              ">

                <thead>
                  <tr style="background:#fdf2f8;">
                    <th style="padding:10px;text-align:left;">
                      Product
                    </th>

                    <th style="padding:10px;">
                      Qty
                    </th>

                    <th style="padding:10px;text-align:right;">
                      Price
                    </th>
                  </tr>
                </thead>

                <tbody>
                  ${itemRows}
                </tbody>

              </table>

              <h2 style="
                text-align:right;
                margin-top:25px;
                color:#8b5cf6;
              ">
                Total: ₹${Number(order.total).toFixed(2)}
              </h2>

              <div style="
                background:#fdf2f8;
                padding:18px;
                border-radius:12px;
                margin-top:20px;
              ">

                <strong>Delivery Address</strong>

                <p>
                  ${escapeHtml(order.address || "")}
                </p>

                <p>
                  <strong>Pincode:</strong>
                  ${escapeHtml(order.pincode || "")}
                </p>

              </div>

              <p style="
                margin-top:25px;
                color:#777;
              ">
                Thank you for shopping with GlowCart 💕
              </p>

            </div>

          </div>

        </body>
        </html>
      `
    });

    if (response.error) {
      console.error("Order email error:", response.error);

      return {
        sent: false,
        error: response.error
      };
    }

    return {
      sent: true,
      id: response.data?.id || null
    };
  } catch (error) {
    console.error("Order email exception:", error);

    return {
      sent: false,
      error: error.message
    };
  }
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   PRODUCTS
========================================================= */

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        price,
        image,
        created_at
      FROM products
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error("Products error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load products."
    });
  }
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      password,
      permanentAddress,
      anotherAddress,
      pincode
    } = req.body;

    if (
      !fullName ||
      !email ||
      !mobile ||
      !password ||
      !permanentAddress ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill all required registration and address fields."
      });
    }

    const cleanName = String(fullName).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanMobile = String(mobile).trim();
    const cleanPassword = String(password);

    const cleanPermanentAddress =
      String(permanentAddress).trim();

    const cleanAnotherAddress =
      anotherAddress
        ? String(anotherAddress).trim()
        : "";

    const cleanPincode =
      String(pincode).trim();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid full name."
      });
    }

    if (!cleanEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters."
      });
    }

    const existing = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered. Please login instead."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO users
      (
        full_name,
        email,
        mobile,
        password,
        permanent_address,
        another_address,
        pincode
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7)
      RETURNING
        id,
        full_name,
        email,
        mobile,
        permanent_address,
        another_address,
        pincode,
        created_at
      `,
      [
        cleanName,
        cleanEmail,
        cleanMobile,
        cleanPassword,
        cleanPermanentAddress,
        cleanAnotherAddress,
        cleanPincode
      ]
    );

    const user = result.rows[0];

    const emailResult = await sendWelcomeEmail(user);

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Your account has been saved permanently.",
      user,
      emailSent: emailResult.sent
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again."
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const cleanEmail =
      String(email).trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        mobile,
        password,
        permanent_address,
        another_address,
        pincode,
        created_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = result.rows[0];

    /*
      This matches the existing beginner version of GlowCart.
      Do not change password storage format unless you also
      migrate existing users.
    */

    if (String(user.password) !== String(password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    delete user.password;

    res.json({
      success: true,
      message: "Login successful.",
      user
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (
    String(email || "").trim().toLowerCase() ===
      String(ADMIN_EMAIL).trim().toLowerCase() &&
    String(password || "") === String(ADMIN_PASSWORD)
  ) {
    return res.json({
      success: true,
      message: "Admin login successful.",
      token: ADMIN_TOKEN
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid admin email or password."
  });
});

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

app.get(
  "/api/admin/dashboard",
  checkAdmin,
  async (req, res) => {
    try {
      const usersResult = await pool.query(
        "SELECT COUNT(*) AS count FROM users"
      );

      const productsResult = await pool.query(
        "SELECT COUNT(*) AS count FROM products"
      );

      const ordersResult = await pool.query(
        "SELECT COUNT(*) AS count FROM orders"
      );

      const revenueResult = await pool.query(
        `
        SELECT COALESCE(SUM(total),0) AS revenue
        FROM orders
        `
      );

      res.json({
        success: true,
        dashboard: {
          registeredMembers:
            Number(usersResult.rows[0].count),

          products:
            Number(productsResult.rows[0].count),

          orders:
            Number(ordersResult.rows[0].count),

          revenue:
            Number(revenueResult.rows[0].revenue)
        }
      });
    } catch (error) {
      console.error("Dashboard error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load dashboard."
      });
    }
  }
);

/* =========================================================
   ADMIN - ALL USERS
========================================================= */

app.get(
  "/api/admin/users",
  checkAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          full_name,
          email,
          mobile,
          permanent_address,
          another_address,
          pincode,
          created_at
        FROM users
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        users: result.rows
      });
    } catch (error) {
      console.error("Admin users error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load registered members."
      });
    }
  }
);

/* =========================================================
   ADMIN - RESEND WELCOME EMAIL
========================================================= */

app.post(
  "/api/admin/users/:id/resend-welcome",
  checkAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID."
        });
      }

      const result = await pool.query(
        `
        SELECT
          id,
          full_name,
          email,
          mobile,
          permanent_address,
          another_address,
          pincode,
          created_at
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Registered member not found."
        });
      }

      const user = result.rows[0];

      const emailResult =
        await sendWelcomeEmail(user);

      if (!emailResult.sent) {
        return res.status(500).json({
          success: false,
          message:
            "Welcome email could not be sent.",
          emailError:
            emailResult.error ||
            emailResult.reason ||
            "Unknown email error."
        });
      }

      res.json({
        success: true,
        message:
          "Welcome email resent successfully.",
        email: user.email
      });
    } catch (error) {
      console.error(
        "Resend welcome error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to resend welcome email."
      });
    }
  }
);

/* =========================================================
   PLACE ORDER
========================================================= */

app.post("/api/orders", async (req, res) => {
  try {
    const {
      userEmail,
      customerName,
      mobile,
      address,
      pincode,
      items,
      total
    } = req.body;

    if (
      !userEmail ||
      !customerName ||
      !address ||
      !pincode ||
      !Array.isArray(items) ||
      items.length === 0 ||
      Number(total) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide valid order details."
      });
    }

    const cleanEmail =
      String(userEmail).trim().toLowerCase();

    /*
      Check that the customer actually exists.
      This also ensures registered members remain
      associated with their orders.
    */

    const userCheck = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (userCheck.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "User account not found. Please register first."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO orders
      (
        user_email,
        customer_name,
        mobile,
        address,
        pincode,
        items,
        total
      )
      VALUES
      ($1,$2,$3,$4,$5,$6::jsonb,$7)
      RETURNING *
      `,
      [
        cleanEmail,
        String(customerName).trim(),
        String(mobile || "").trim(),
        String(address).trim(),
        String(pincode).trim(),
        JSON.stringify(items),
        Number(total)
      ]
    );

    const order = result.rows[0];

    const emailResult =
      await sendOrderEmail(order);

    res.status(201).json({
      success: true,
      message:
        "Order placed successfully.",
      order: formatOrder(order),
      emailSent: emailResult.sent
    });
  } catch (error) {
    console.error("Order error:", error);

    res.status(500).json({
      success: false,
      message:
        "Unable to place order. Please try again."
    });
  }
});

/* =========================================================
   USER ORDERS
========================================================= */

app.get(
  "/api/orders/user/:email",
  async (req, res) => {
    try {
      const email =
        decodeURIComponent(req.params.email)
          .trim()
          .toLowerCase();

      const result = await pool.query(
        `
        SELECT *
        FROM orders
        WHERE LOWER(user_email) = LOWER($1)
        ORDER BY created_at DESC
        `,
        [email]
      );

      res.json({
        success: true,
        orders: result.rows.map(formatOrder)
      });
    } catch (error) {
      console.error(
        "User orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load your orders."
      });
    }
  }
);

/* =========================================================
   ADMIN - ALL ORDERS
========================================================= */

app.get(
  "/api/orders",
  checkAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT *
        FROM orders
        ORDER BY created_at DESC
      `);

      res.json({
        success: true,
        orders: result.rows.map(formatOrder)
      });
    } catch (error) {
      console.error(
        "Admin orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Unable to load orders."
      });
    }
  }
);

/* =========================================================
   ORDER FORMAT
========================================================= */

function formatOrder(order) {
  return {
    id: order.id,
    user_email: order.user_email,
    customer_name: order.customer_name,
    mobile: order.mobile,
    address: order.address,
    pincode: order.pincode,
    items:
      typeof order.items === "string"
        ? JSON.parse(order.items)
        : order.items,
    total: Number(order.total),
    created_at: order.created_at
  };
}

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  await initializeDatabase();

  app.listen(PORT, HOST, () => {
    console.log(
      `GlowCart server running on ${HOST}:${PORT}`
    );
  });
}

startServer();
