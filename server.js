const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

const app = express();

/* =========================================================
   RENDER CONFIGURATION
========================================================= */

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

/* =========================================================
   ENVIRONMENT VARIABLES
========================================================= */

const DATABASE_URL = process.env.DATABASE_URL;

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "hasiniambati07@gmail.com";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "";

const RESEND_API_KEY =
  process.env.RESEND_API_KEY || "";

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "GlowCart <onboarding@resend.dev>";

/* =========================================================
   DATABASE
========================================================= */

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

/* =========================================================
   RESEND
========================================================= */

const resend = RESEND_API_KEY
  ? new Resend(RESEND_API_KEY)
  : null;

/* =========================================================
   EXPRESS MIDDLEWARE
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
   SERVE FRONTEND
========================================================= */

const possibleIndexFiles = [
  path.join(__dirname, "index.html"),
  path.join(__dirname, "..", "index.html")
];

let indexFile = null;

for (const file of possibleIndexFiles) {
  if (fs.existsSync(file)) {
    indexFile = file;
    break;
  }
}

app.get("/", (req, res) => {
  if (indexFile) {
    return res.sendFile(indexFile);
  }

  res.json({
    message: "GlowCart backend is running successfully."
  });
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "GlowCart backend is running",
      database: "connected",
      emailService: resend ? "configured" : "not configured"
    });
  } catch (error) {
    console.error("Health error:", error);

    res.status(500).json({
      success: false,
      message: "Backend is running but database connection failed."
    });
  }
});

/* =========================================================
   DATABASE TABLES
========================================================= */

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(30),
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        description TEXT,
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

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at
      ON orders(created_at)
    `);

    /* =====================================================
       SEED PRODUCTS ONLY IF EMPTY
    ===================================================== */

    const productCount = await pool.query(
      "SELECT COUNT(*) FROM products"
    );

    if (Number(productCount.rows[0].count) === 0) {
      const products = [
        [
          "Glow Radiance Cream",
          499,
          "Brightening face cream for a natural glow.",
          "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=600&q=80"
        ],
        [
          "Vitamin C Face Cream",
          599,
          "Vitamin C enriched cream for healthy-looking skin.",
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80"
        ],
        [
          "Hydra Moisturizing Cream",
          449,
          "Deep moisturizing cream for soft and hydrated skin.",
          "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80"
        ],
        [
          "Aloe Vera Face Cream",
          399,
          "Soothing aloe vera cream for everyday skincare.",
          "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80"
        ]
      ];

      for (const product of products) {
        await pool.query(
          `
          INSERT INTO products
          (name, price, description, image)
          VALUES ($1, $2, $3, $4)
          `,
          product
        );
      }

      console.log("Default GlowCart products inserted.");
    }

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

/* =========================================================
   EMAIL HELPER
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
   SEND WELCOME EMAIL
========================================================= */

async function sendWelcomeEmail(user) {
  if (!resend) {
    return {
      success: false,
      message: "RESEND_API_KEY is not configured."
    };
  }

  try {
    const safeName = escapeHtml(user.full_name);
    const safeEmail = escapeHtml(user.email);

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [user.email],
      subject: "Welcome to GlowCart 💖",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport"
                content="width=device-width, initial-scale=1.0">
          <title>Welcome to GlowCart</title>
        </head>

        <body style="
          margin:0;
          padding:0;
          background:#fff0f7;
          font-family:Arial,Helvetica,sans-serif;
        ">

          <div style="
            max-width:600px;
            margin:30px auto;
            background:white;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 8px 30px rgba(0,0,0,0.08);
          ">

            <div style="
              background:linear-gradient(135deg,#ff4f9a,#8e44ad);
              padding:35px 25px;
              text-align:center;
              color:white;
            ">
              <h1 style="
                margin:0;
                font-size:32px;
              ">
                GlowCart 💖
              </h1>

              <p style="
                margin:10px 0 0;
                font-size:16px;
              ">
                Premium Face Creams
              </p>
            </div>

            <div style="
              padding:35px 30px;
              color:#333;
            ">

              <h2 style="
                color:#d63384;
                margin-top:0;
              ">
                Welcome, ${safeName}! 🎉
              </h2>

              <p>
                Thank you for registering with
                <strong>GlowCart</strong>.
              </p>

              <p>
                Your GlowCart account has been created successfully.
              </p>

              <div style="
                background:#fff4fa;
                padding:20px;
                border-radius:12px;
                margin:25px 0;
              ">
                <p style="margin:5px 0;">
                  <strong>Registered Email:</strong>
                  ${safeEmail}
                </p>

                <p style="margin:5px 0;">
                  <strong>Account Status:</strong>
                  Active ✅
                </p>
              </div>

              <p>
                You can now explore our products,
                add your favourite face creams to your cart,
                and place orders.
              </p>

              <div style="
                text-align:center;
                margin:30px 0;
              ">
                <span style="
                  display:inline-block;
                  background:linear-gradient(135deg,#ff4f9a,#8e44ad);
                  color:white;
                  padding:14px 30px;
                  border-radius:30px;
                  font-weight:bold;
                ">
                  Happy Shopping 💕
                </span>
              </div>

              <p style="color:#777;">
                Thank you for choosing GlowCart.
              </p>

            </div>

            <div style="
              text-align:center;
              padding:18px;
              background:#fafafa;
              color:#888;
              font-size:13px;
            ">
              © 2026 GlowCart. All rights reserved.
            </div>

          </div>

        </body>
        </html>
      `
    });

    if (error) {
      console.error(
        "Resend welcome email error:",
        error
      );

      return {
        success: false,
        message: error.message || "Welcome email failed."
      };
    }

    console.log(
      `Welcome email sent to ${user.email}`,
      data?.id || ""
    );

    return {
      success: true,
      message: "Welcome email sent successfully.",
      emailId: data?.id || null
    };

  } catch (error) {
    console.error(
      "Welcome email exception:",
      error
    );

    return {
      success: false,
      message: error.message || "Welcome email failed."
    };
  }
}

/* =========================================================
   SEND ORDER CONFIRMATION EMAIL
========================================================= */

async function sendOrderEmail(order) {
  if (!resend) {
    return {
      success: false,
      message: "RESEND_API_KEY is not configured."
    };
  }

  try {
    const safeName = escapeHtml(
      order.customer_name || "Customer"
    );

    const safeAddress = escapeHtml(
      order.address || ""
    );

    const safePincode = escapeHtml(
      order.pincode || ""
    );

    let items = [];

    try {
      items =
        typeof order.items === "string"
          ? JSON.parse(order.items)
          : order.items;
    } catch {
      items = [];
    }

    let itemRows = "";

    if (Array.isArray(items)) {
      items.forEach((item) => {
        const name = escapeHtml(
          item.name || "Product"
        );

        const quantity =
          Number(item.quantity) || 1;

        const price =
          Number(item.price) || 0;

        const subtotal =
          quantity * price;

        itemRows += `
          <tr>
            <td style="
              padding:12px;
              border-bottom:1px solid #eee;
            ">
              ${name}
            </td>

            <td style="
              padding:12px;
              border-bottom:1px solid #eee;
              text-align:center;
            ">
              ${quantity}
            </td>

            <td style="
              padding:12px;
              border-bottom:1px solid #eee;
              text-align:right;
            ">
              ₹${subtotal.toFixed(2)}
            </td>
          </tr>
        `;
      });
    }

    const { data, error } =
      await resend.emails.send({
        from: EMAIL_FROM,
        to: [order.user_email],
        subject: `GlowCart Order Confirmed #${order.id} 💖`,
        html: `
          <!DOCTYPE html>
          <html>

          <body style="
            margin:0;
            padding:0;
            background:#fff0f7;
            font-family:Arial,Helvetica,sans-serif;
          ">

            <div style="
              max-width:650px;
              margin:30px auto;
              background:#ffffff;
              border-radius:20px;
              overflow:hidden;
              box-shadow:0 8px 30px rgba(0,0,0,0.08);
            ">

              <div style="
                background:linear-gradient(135deg,#ff4f9a,#8e44ad);
                color:white;
                padding:30px;
                text-align:center;
              ">
                <h1 style="margin:0;">
                  GlowCart 💖
                </h1>

                <p>
                  Order Confirmed 🎉
                </p>
              </div>

              <div style="padding:30px;">

                <h2 style="color:#d63384;">
                  Thank you, ${safeName}!
                </h2>

                <p>
                  Your GlowCart order has been placed
                  successfully.
                </p>

                <div style="
                  background:#fff4fa;
                  padding:18px;
                  border-radius:12px;
                  margin:20px 0;
                ">

                  <p>
                    <strong>Order ID:</strong>
                    #${order.id}
                  </p>

                  <p>
                    <strong>Email:</strong>
                    ${escapeHtml(order.user_email)}
                  </p>

                  <p>
                    <strong>Total:</strong>
                    ₹${Number(order.total).toFixed(2)}
                  </p>

                </div>

                <h3>
                  Ordered Products
                </h3>

                <table style="
                  width:100%;
                  border-collapse:collapse;
                ">

                  <thead>
                    <tr>
                      <th style="
                        padding:12px;
                        text-align:left;
                        background:#fff4fa;
                      ">
                        Product
                      </th>

                      <th style="
                        padding:12px;
                        background:#fff4fa;
                      ">
                        Qty
                      </th>

                      <th style="
                        padding:12px;
                        text-align:right;
                        background:#fff4fa;
                      ">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    ${itemRows}
                  </tbody>

                </table>

                <div style="
                  margin-top:25px;
                  padding:20px;
                  background:#fafafa;
                  border-radius:12px;
                ">

                  <h3>
                    Delivery Address
                  </h3>

                  <p>
                    ${safeAddress}
                  </p>

                  <p>
                    <strong>Pincode:</strong>
                    ${safePincode}
                  </p>

                </div>

                <div style="
                  text-align:center;
                  margin-top:30px;
                  color:#777;
                ">
                  Thank you for shopping with GlowCart 💕
                </div>

              </div>

              <div style="
                text-align:center;
                padding:18px;
                background:#fafafa;
                color:#888;
                font-size:13px;
              ">
                © 2026 GlowCart. All rights reserved.
              </div>

            </div>

          </body>
          </html>
        `
      });

    if (error) {
      console.error(
        "Resend order email error:",
        error
      );

      return {
        success: false,
        message: error.message || "Order email failed."
      };
    }

    console.log(
      `Order email sent to ${order.user_email}`,
      data?.id || ""
    );

    return {
      success: true,
      message: "Order confirmation email sent.",
      emailId: data?.id || null
    };

  } catch (error) {
    console.error(
      "Order email exception:",
      error
    );

    return {
      success: false,
      message: error.message || "Order email failed."
    };
  }
}

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

const ADMIN_TOKEN = "glowcart-admin-session";

function checkAdmin(req, res, next) {
  const auth =
    req.headers.authorization || "";

  if (auth === `Bearer ${ADMIN_TOKEN}`) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized admin access."
  });
}

/* =========================================================
   GET PRODUCTS
========================================================= */

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
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
      name,
      email,
      mobile,
      password
    } = req.body;

    const finalName =
      String(fullName || name || "").trim();

    const finalEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const finalMobile =
      String(mobile || "").trim();

    const finalPassword =
      String(password || "");

    if (
      !finalName ||
      !finalEmail ||
      !finalPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, email and password are required."
      });
    }

    const existing =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        `,
        [finalEmail]
      );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Email is already registered."
      });
    }

    const result =
      await pool.query(
        `
        INSERT INTO users
        (full_name, email, mobile, password)
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          full_name,
          email,
          mobile,
          created_at
        `,
        [
          finalName,
          finalEmail,
          finalMobile,
          finalPassword
        ]
      );

    const user = result.rows[0];

    /* Send exactly one backend welcome email */
    const emailResult =
      await sendWelcomeEmail(user);

    res.status(201).json({
      success: true,
      message:
        "Registration successful.",
      user,
      emailSent:
        emailResult.success,
      emailMessage:
        emailResult.message
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Registration failed. Please try again."
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const finalEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const result =
      await pool.query(
        `
        SELECT
          id,
          full_name,
          email,
          mobile,
          password,
          created_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
        `,
        [finalEmail]
      );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const user = result.rows[0];

    if (user.password !== password) {
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
      message: "Login failed."
    });
  }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (
      String(email || "")
        .trim()
        .toLowerCase() !==
      ADMIN_EMAIL.toLowerCase() ||
      String(password || "") !== ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials."
      });
    }

    res.json({
      success: true,
      message: "Admin login successful.",
      token: ADMIN_TOKEN
    });

  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Admin login failed."
    });
  }
});

/* =========================================================
   GET REGISTERED MEMBERS
========================================================= */

app.get(
  "/api/admin/users",
  checkAdmin,
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT
            id,
            full_name,
            email,
            mobile,
            created_at
          FROM users
          ORDER BY created_at DESC
        `);

      res.json({
        success: true,
        users: result.rows
      });

    } catch (error) {
      console.error(
        "Admin users error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load registered members."
      });
    }
  }
);

/* =========================================================
   ⭐ RESEND WELCOME EMAIL TO EXISTING MEMBER
========================================================= */

app.post(
  "/api/admin/users/:id/resend-welcome",
  checkAdmin,
  async (req, res) => {
    try {
      const userId =
        Number(req.params.id);

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid member ID."
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            full_name,
            email,
            mobile,
            created_at
          FROM users
          WHERE id = $1
          `,
          [userId]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Registered member not found."
        });
      }

      const user = result.rows[0];

      console.log(
        `Admin requested welcome email resend for ${user.email}`
      );

      const emailResult =
        await sendWelcomeEmail(user);

      if (!emailResult.success) {
        return res.status(502).json({
          success: false,
          message:
            `Email could not be sent to ${user.email}.`,
          emailError:
            emailResult.message
        });
      }

      res.json({
        success: true,
        message:
          `Welcome email resent successfully to ${user.email}.`,
        email: user.email,
        emailId:
          emailResult.emailId || null
      });

    } catch (error) {
      console.error(
        "Resend welcome error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to resend welcome email."
      });
    }
  }
);

/* =========================================================
   RESEND WELCOME EMAIL USING EMAIL ADDRESS
   Useful if frontend only stores email.
========================================================= */

app.post(
  "/api/admin/resend-welcome",
  checkAdmin,
  async (req, res) => {
    try {
      const email =
        String(req.body.email || "")
          .trim()
          .toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email address is required."
        });
      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            full_name,
            email,
            mobile,
            created_at
          FROM users
          WHERE LOWER(email) = LOWER($1)
          `,
          [email]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "No registered member found with this email."
        });
      }

      const user = result.rows[0];

      const emailResult =
        await sendWelcomeEmail(user);

      if (!emailResult.success) {
        return res.status(502).json({
          success: false,
          message:
            "Email could not be sent.",
          emailError:
            emailResult.message
        });
      }

      res.json({
        success: true,
        message:
          `Welcome email resent successfully to ${user.email}.`,
        email: user.email,
        emailId:
          emailResult.emailId || null
      });

    } catch (error) {
      console.error(
        "Resend welcome by email error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to resend welcome email."
      });
    }
  }
);

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

app.get(
  "/api/admin/dashboard",
  checkAdmin,
  async (req, res) => {
    try {
      const users =
        await pool.query(
          "SELECT COUNT(*) FROM users"
        );

      const products =
        await pool.query(
          "SELECT COUNT(*) FROM products"
        );

      const orders =
        await pool.query(
          "SELECT COUNT(*) FROM orders"
        );

      const revenue =
        await pool.query(
          "SELECT COALESCE(SUM(total), 0) AS total FROM orders"
        );

      res.json({
        success: true,
        dashboard: {
          registeredMembers:
            Number(users.rows[0].count),

          products:
            Number(products.rows[0].count),

          orders:
            Number(orders.rows[0].count),

          revenue:
            Number(revenue.rows[0].total)
        }
      });

    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load dashboard."
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
      email,
      customerName,
      name,
      mobile,
      address,
      pincode,
      items,
      total
    } = req.body;

    const finalEmail =
      String(userEmail || email || "")
        .trim()
        .toLowerCase();

    const finalName =
      String(customerName || name || "")
        .trim();

    const finalMobile =
      String(mobile || "").trim();

    const finalAddress =
      String(address || "").trim();

    const finalPincode =
      String(pincode || "").trim();

    const finalTotal =
      Number(total);

    if (
      !finalEmail ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !Number.isFinite(finalTotal)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order details."
      });
    }

    const result =
      await pool.query(
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
        ($1, $2, $3, $4, $5, $6::jsonb, $7)
        RETURNING *
        `,
        [
          finalEmail,
          finalName,
          finalMobile,
          finalAddress,
          finalPincode,
          JSON.stringify(items),
          finalTotal
        ]
      );

    const order =
      result.rows[0];

    /* Send order confirmation */
    const emailResult =
      await sendOrderEmail(order);

    res.status(201).json({
      success: true,
      message:
        "Order placed successfully.",
      order,
      emailSent:
        emailResult.success,
      emailMessage:
        emailResult.message
    });

  } catch (error) {
    console.error(
      "Order error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to place order."
    });
  }
});

/* =========================================================
   GET USER ORDERS
========================================================= */

app.get(
  "/api/orders/user/:email",
  async (req, res) => {
    try {
      const email =
        String(req.params.email || "")
          .trim()
          .toLowerCase();

      const result =
        await pool.query(
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
        orders: result.rows
      });

    } catch (error) {
      console.error(
        "User orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load orders."
      });
    }
  }
);

/* =========================================================
   GET ALL ORDERS FOR ADMIN
========================================================= */

app.get(
  "/api/orders",
  checkAdmin,
  async (req, res) => {
    try {
      const result =
        await pool.query(`
          SELECT *
          FROM orders
          ORDER BY created_at DESC
        `);

      res.json({
        success: true,
        orders: result.rows
      });

    } catch (error) {
      console.error(
        "Admin orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load orders."
      });
    }
  }
);

/* =========================================================
   ADMIN DELETE PRODUCT
========================================================= */

app.delete(
  "/api/products/:id",
  checkAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const result =
        await pool.query(
          `
          DELETE FROM products
          WHERE id = $1
          RETURNING *
          `,
          [id]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Product not found."
        });
      }

      res.json({
        success: true,
        message:
          "Product deleted successfully.",
        product:
          result.rows[0]
      });

    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete product."
      });
    }
  }
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      "GlowCart API route not found."
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

    console.log(
      `Email service: ${
        resend
          ? "Resend configured"
          : "Resend NOT configured"
      }`
    );

    console.log(
      `Email sender: ${EMAIL_FROM}`
    );
  });
}

startServer();
