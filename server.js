const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "5mb" }));

/* =========================================================
   FILES
========================================================= */

const PRODUCTS_FILE = path.join(__dirname, "products.json");
const USERS_FILE = path.join(__dirname, "users.json");
const ORDERS_FILE = path.join(__dirname, "place.json");

/* =========================================================
   ADMIN
========================================================= */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

let ADMIN_TOKEN = null;

/* =========================================================
   EMAILJS SERVER CONFIGURATION
========================================================= */

const EMAILJS_SERVICE_ID =
  process.env.EMAILJS_SERVICE_ID || "service_nb7q38o";

const EMAILJS_PUBLIC_KEY =
  process.env.EMAILJS_PUBLIC_KEY || "O8MGjkU2KThjrZ31Y";

const EMAILJS_WELCOME_TEMPLATE_ID =
  process.env.EMAILJS_WELCOME_TEMPLATE_ID || "template_giqmpm9";

const EMAILJS_ORDER_TEMPLATE_ID =
  process.env.EMAILJS_ORDER_TEMPLATE_ID || "template_ykzf36";

/* =========================================================
   FILE FUNCTIONS
========================================================= */

function createFile(file, defaultData) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(
        file,
        JSON.stringify(defaultData, null, 2)
      );
    }
  } catch (error) {
    console.error("Create file error:", error);
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
    console.error("Read JSON error:", error);
    return [];
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(
      file,
      JSON.stringify(data, null, 2)
    );

    return true;
  } catch (error) {
    console.error("Write JSON error:", error);
    return false;
  }
}

/* =========================================================
   CREATE FILES
========================================================= */

createFile(PRODUCTS_FILE, []);
createFile(USERS_FILE, []);
createFile(ORDERS_FILE);

/* =========================================================
   SEND EMAIL USING EMAILJS
========================================================= */

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
      console.error(
        "EmailJS failed:",
        response.status,
        text
      );

      return {
        success: false,
        message: text || "EmailJS failed",
      };
    }

    console.log(
      "EmailJS email sent successfully:",
      templateId
    );

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error(
      "EmailJS connection error:",
      error
    );

    return {
      success: false,
      message: error.message,
    };
  }
}

/* =========================================================
   SEND WELCOME EMAIL
========================================================= */

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
        `Welcome to GlowCart, ${user.name}! ` +
        `Your GlowCart account has been created successfully.`,
    }
  );
}

/* =========================================================
   HOME
   THIS MAKES RENDER OPEN THE GLOWCART WEBSITE
========================================================= */

app.get("/", (req, res) => {
  const indexFile = path.join(__dirname, "index.html");

  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }

  res.status(404).send(
    "GlowCart index.html was not found. Make sure index.html is in the same folder as server.js."
  );
});

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "GlowCart API is working!",
    server: "online",
  });
});

/* =========================================================
   ADMIN STATUS
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
   EMAIL CONFIG STATUS
========================================================= */

app.get("/api/emailjs-config", (req, res) => {
  res.json({
    success: true,
    configured: Boolean(
      EMAILJS_SERVICE_ID &&
      EMAILJS_PUBLIC_KEY &&
      EMAILJS_WELCOME_TEMPLATE_ID
    ),
    serviceIdConfigured: Boolean(
      EMAILJS_SERVICE_ID
    ),
    publicKeyConfigured: Boolean(
      EMAILJS_PUBLIC_KEY
    ),
    welcomeTemplateConfigured: Boolean(
      EMAILJS_WELCOME_TEMPLATE_ID
    ),
    orderTemplateConfigured: Boolean(
      EMAILJS_ORDER_TEMPLATE_ID
    ),
  });
});

/* =========================================================
   PRODUCTS
========================================================= */

app.get("/api/products", (req, res) => {
  const products = readJson(PRODUCTS_FILE);

  res.json(products);
});

/* =========================================================
   SINGLE PRODUCT
========================================================= */

app.get("/api/products/:id", (req, res) => {
  const products = readJson(PRODUCTS_FILE);

  const product = products.find(
    (p) =>
      String(p.id) ===
      String(req.params.id)
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.json(product);
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/register", async (req, res) => {
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
        message:
          "Please fill all required fields.",
      });
    }

    if (
      !/^[0-9]{10}$/.test(
        String(mobile)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number must contain 10 digits.",
      });
    }

    if (
      !/^[0-9]{6}$/.test(
        String(pincode)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Pincode must contain 6 digits.",
      });
    }

    if (
      pincode2 &&
      !/^[0-9]{6}$/.test(
        String(pincode2)
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Second pincode must contain 6 digits.",
      });
    }

    const users = readJson(USERS_FILE);

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    const exists = users.find(
      (u) =>
        String(u.email)
          .toLowerCase() ===
        cleanEmail
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message:
          "Email is already registered.",
      });
    }

    const newUser = {
      id: Date.now().toString(),

      name:
        String(name).trim(),

      email:
        cleanEmail,

      mobile:
        String(mobile).trim(),

      password:
        String(password),

      address:
        String(address).trim(),

      pincode:
        String(pincode).trim(),

      address2:
        address2
          ? String(address2).trim()
          : "",

      pincode2:
        pincode2
          ? String(pincode2).trim()
          : "",

      registeredAt:
        new Date().toISOString(),
    };

    users.push(newUser);

    if (
      !writeJson(
        USERS_FILE,
        users
      )
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to save registration.",
      });
    }

    const safeUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile,
      address: newUser.address,
      pincode: newUser.pincode,
      address2: newUser.address2,
      pincode2: newUser.pincode2,
      registeredAt:
        newUser.registeredAt,
    };

    /*
      SEND WELCOME EMAIL FROM SERVER
    */

    const emailResult =
      await sendWelcomeEmail(
        safeUser
      );

    console.log(
      "Registration:",
      safeUser.email
    );

    console.log(
      "Welcome email result:",
      emailResult
    );

    res.status(201).json({
      success: true,

      message:
        "Registration successful!",

      user: safeUser,

      emailSent:
        emailResult.success,

      emailMessage:
        emailResult.message,
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Registration failed.",
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const users =
      readJson(USERS_FILE);

    const user =
      users.find(
        (u) =>
          String(u.email)
            .toLowerCase() ===
            String(email)
              .trim()
              .toLowerCase() &&
          String(u.password) ===
            String(password)
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      pincode: user.pincode,
      address2:
        user.address2 || "",
      pincode2:
        user.pincode2 || "",
      registeredAt:
        user.registeredAt,
    };

    res.json({
      success: true,
      message:
        "Login successful!",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Login failed.",
    });
  }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post(
  "/api/admin/login",
  (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body || {};

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
        String(email || "")
          .trim()
          .toLowerCase() !==
          String(ADMIN_EMAIL)
            .trim()
            .toLowerCase() ||
        String(password || "") !==
          String(ADMIN_PASSWORD)
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid admin email or password.",
        });
      }

      ADMIN_TOKEN =
        crypto.randomBytes(32)
          .toString("hex");

      res.json({
        success: true,
        message:
          "Admin login successful!",
        token: ADMIN_TOKEN,
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Admin login failed.",
      });
    }
  }
);

/* =========================================================
   ADMIN AUTH
========================================================= */

function checkAdmin(
  req,
  res,
  next
) {
  const authorization =
    req.headers.authorization || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Admin authorization required.",
    });
  }

  const token =
    authorization.substring(7);

  if (
    !ADMIN_TOKEN ||
    token !== ADMIN_TOKEN
  ) {
    return res.status(401).json({
      success: false,
      message:
        "Admin session expired. Login again.",
    });
  }

  next();
}

/* =========================================================
   ADMIN MEMBERS
========================================================= */

app.get(
  "/api/admin/users",
  checkAdmin,
  (req, res) => {
    try {
      const users =
        readJson(USERS_FILE);

      const safeUsers =
        users.map((u) => ({
          id: u.id || "",
          name: u.name || "",
          email: u.email || "",
          mobile: u.mobile || "",
          address:
            u.address || "",
          pincode:
            u.pincode || "",
          address2:
            u.address2 || "",
          pincode2:
            u.pincode2 || "",
          registeredAt:
            u.registeredAt || "",
        }));

      res.json({
        success: true,
        totalMembers:
          safeUsers.length,
        users: safeUsers,
      });
    } catch (error) {
      console.error(
        "Admin users error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load members.",
      });
    }
  }
);

/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post(
  "/api/admin/logout",
  checkAdmin,
  (req, res) => {
    ADMIN_TOKEN = null;

    res.json({
      success: true,
      message:
        "Admin logged out.",
    });
  }
);

/* =========================================================
   PLACE ORDER
========================================================= */

app.post(
  "/api/orders",
  async (req, res) => {
    try {
      const {
        name,
        email,
        mobile,
        address,
        pincode,
        items,
        subtotal,
        paymentMethod,
      } = req.body || {};

      if (
        !name ||
        !email ||
        !address ||
        !pincode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer details are required.",
        });
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cart is empty.",
        });
      }

      const subtotalAmount =
        Number(subtotal) || 0;

      const gst =
        Number(
          (
            subtotalAmount *
            0.18
          ).toFixed(2)
        );

      const total =
        Number(
          (
            subtotalAmount +
            gst
          ).toFixed(2)
        );

      const orderId =
        "GC" +
        Date.now()
          .toString()
          .slice(-8);

      const order = {
        orderId,

        name:
          String(name).trim(),

        email:
          String(email)
            .trim()
            .toLowerCase(),

        mobile:
          mobile
            ? String(mobile).trim()
            : "",

        address:
          String(address).trim(),

        pincode:
          String(pincode).trim(),

        items,

        subtotal:
          subtotalAmount,

        gstRate: 18,

        gst,

        total,

        paymentMethod:
          paymentMethod ||
          "Cash on Delivery",

        paymentStatus:
          paymentMethod ===
          "Cash on Delivery"
            ? "Pending"
            : "Demo Payment Selected",

        status:
          "Order Placed",

        orderedAt:
          new Date().toISOString(),
      };

      const orders =
        readJson(ORDERS_FILE);

      orders.push(order);

      if (
        !writeJson(
          ORDERS_FILE,
          orders
        )
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Unable to save order.",
        });
      }

      /*
        SEND ORDER EMAIL FROM SERVER
      */

      const itemText =
        order.items
          .map(
            (item) =>
              `${item.name} x ${item.qty} = ₹${Number(
                item.price *
                  item.qty
              ).toFixed(2)}`
          )
          .join("\n");

      const orderEmailResult =
        await sendEmailJS(
          EMAILJS_ORDER_TEMPLATE_ID,
          {
            to_email:
              order.email,

            to_name:
              order.name,

            user_name:
              order.name,

            user_email:
              order.email,

            order_id:
              order.orderId,

            order_items:
              itemText,

            order_subtotal:
              `₹${order.subtotal.toFixed(2)}`,

            order_gst:
              `₹${order.gst.toFixed(2)}`,

            order_total:
              `₹${order.total.toFixed(2)}`,

            order_address:
              order.address,

            order_pincode:
              order.pincode,

            payment_method:
              order.paymentMethod,
          }
        );

      res.status(201).json({
        success: true,

        message:
          "Order placed successfully!",

        order,

        emailSent:
          orderEmailResult.success,

        emailMessage:
          orderEmailResult.message,
      });
    } catch (error) {
      console.error(
        "Order error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to place order.",
      });
    }
  }
);

/* =========================================================
   ALL ORDERS
========================================================= */

app.get(
  "/api/orders",
  (req, res) => {
    const orders =
      readJson(ORDERS_FILE);

    res.json({
      success: true,
      orders,
    });
  }
);

/* =========================================================
   USER ORDERS
========================================================= */

app.get(
  "/api/orders/:email",
  (req, res) => {
    try {
      const email =
        decodeURIComponent(
          req.params.email
        )
          .trim()
          .toLowerCase();

      const orders =
        readJson(ORDERS_FILE);

      const userOrders =
        orders.filter(
          (order) =>
            String(order.email)
              .toLowerCase() ===
            email
        );

      res.json({
        success: true,
        orders:
          userOrders,
      });
    } catch (error) {
      console.error(
        "User orders error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to load orders.",
      });
    }
  }
);

/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API endpoint not found.",
      method:
        req.method,
      endpoint:
        req.originalUrl,
    });
  }
);

/* =========================================================
   ERROR
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Internal server error.",
    });
  }
);

/* =========================================================
   START
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "=================================="
    );

    console.log(
      "GlowCart Backend + Website Started"
    );

    console.log(
      "PORT:",
      PORT
    );

    console.log(
      "ADMIN_EMAIL configured:",
      Boolean(ADMIN_EMAIL)
    );

    console.log(
      "ADMIN_PASSWORD configured:",
      Boolean(ADMIN_PASSWORD)
    );

    console.log(
      "EMAILJS configured:",
      Boolean(
        EMAILJS_SERVICE_ID &&
        EMAILJS_PUBLIC_KEY
      )
    );

    console.log(
      "=================================="
    );
  }
);
