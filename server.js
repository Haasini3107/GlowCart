const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

const app = express();

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

/* =========================================================
   DATABASE
========================================================= */

if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

/* =========================================================
   EMAIL - RESEND ONLY
========================================================= */

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    "GlowCart <onboarding@resend.dev>";

if (!process.env.RESEND_API_KEY) {
    console.warn(
        "WARNING: RESEND_API_KEY is missing. Emails will not be sent."
    );
}

console.log(
    "Email provider:",
    resend ? "Resend enabled" : "Resend NOT configured"
);

console.log(
    "Email sender:",
    EMAIL_FROM
);

/* =========================================================
   ADMIN
========================================================= */

const ADMIN_EMAIL =
    process.env.ADMIN_EMAIL ||
    "admin@glowcart.com";

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD ||
    "admin123";

const ADMIN_TOKEN =
    "glowcart-admin-session";

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
    cors({
        origin: true,
        credentials: false
    })
);

app.use(
    express.json({
        limit: "5mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "5mb"
    })
);

/* =========================================================
   FRONTEND
========================================================= */

const frontendFiles = [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "..", "index.html")
];

let FRONTEND_FILE = null;

for (const file of frontendFiles) {

    if (fs.existsSync(file)) {

        FRONTEND_FILE = file;

        break;
    }
}

console.log(
    "Frontend:",
    FRONTEND_FILE || "NOT FOUND"
);

if (FRONTEND_FILE) {

    app.use(
        express.static(
            path.dirname(FRONTEND_FILE),
            {
                index: false
            }
        )
    );
}

/* =========================================================
   DATABASE QUERY
========================================================= */

async function query(text, params = []) {

    return await pool.query(
        text,
        params
    );
}

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {

    await query(`
        CREATE TABLE IF NOT EXISTS users (

            id BIGSERIAL PRIMARY KEY,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            mobile TEXT NOT NULL,

            password TEXT NOT NULL,

            address TEXT DEFAULT '',

            address2 TEXT DEFAULT '',

            pincode TEXT DEFAULT '',

            registered_at
                TIMESTAMPTZ
                DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS products (

            id BIGSERIAL PRIMARY KEY,

            name TEXT NOT NULL,

            price NUMERIC(10,2) NOT NULL,

            description TEXT DEFAULT '',

            image TEXT DEFAULT '',

            created_at
                TIMESTAMPTZ
                DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS orders (

            id BIGSERIAL PRIMARY KEY,

            order_id TEXT UNIQUE NOT NULL,

            user_id BIGINT,

            name TEXT NOT NULL,

            email TEXT NOT NULL,

            mobile TEXT DEFAULT '',

            address TEXT NOT NULL,

            address2 TEXT DEFAULT '',

            pincode TEXT NOT NULL,

            payment_method
                TEXT DEFAULT 'Cash on Delivery',

            items JSONB
                NOT NULL
                DEFAULT '[]'::jsonb,

            subtotal NUMERIC(10,2) DEFAULT 0,

            gst NUMERIC(10,2) DEFAULT 0,

            total NUMERIC(10,2) DEFAULT 0,

            status TEXT DEFAULT 'Placed',

            created_at
                TIMESTAMPTZ
                DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMPTZ
        )
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS users_email_index
        ON users(email)
    `);

    await query(`
        CREATE INDEX IF NOT EXISTS orders_email_index
        ON orders(email)
    `);

    await seedProducts();

    console.log(
        "DATABASE INITIALIZED"
    );
}

/* =========================================================
   PRODUCTS
========================================================= */

async function seedProducts() {

    const result =
        await query(
            `SELECT COUNT(*) AS count FROM products`
        );

    if (
        Number(result.rows[0].count) > 0
    ) {
        return;
    }

    const products = [

        [
            "Glow Radiance Cream",
            299,
            "Brightening face cream.",
            "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=80"
        ],

        [
            "Vitamin C Face Cream",
            349,
            "Vitamin C enriched cream.",
            "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=700&q=80"
        ],

        [
            "Hydra Moisturizing Cream",
            279,
            "Deep moisturizing cream.",
            "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=700&q=80"
        ],

        [
            "Aloe Vera Face Cream",
            249,
            "Soothing Aloe Vera cream.",
            "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=700&q=80"
        ]

    ];

    for (const product of products) {

        await query(
            `
            INSERT INTO products
            (name,price,description,image)
            VALUES($1,$2,$3,$4)
            `,
            product
        );
    }

    console.log(
        "Default products inserted."
    );
}

/* =========================================================
   ADMIN AUTH
========================================================= */

function checkAdmin(req, res, next) {

    const authorization =
        req.headers.authorization || "";

    const token =
        authorization.startsWith("Bearer ")
            ? authorization.substring(7)
            : "";

    if (token !== ADMIN_TOKEN) {

        return res.status(401).json({

            success: false,

            message:
                "Admin authentication required."
        });
    }

    next();
}

/* =========================================================
   SEND WELCOME EMAIL
========================================================= */

async function sendWelcomeEmail(user) {

    if (!resend) {

        console.error(
            "WELCOME EMAIL NOT SENT: RESEND_API_KEY missing."
        );

        return false;
    }

    try {

        const result =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [user.email],

                subject:
                    "Welcome to GlowCart! 💖",

                html: `
                    <div style="
                        font-family:Arial,sans-serif;
                        max-width:650px;
                        margin:auto;
                        padding:30px;
                        background:#fff0f8;
                        color:#333;
                    ">

                        <div style="
                            background:white;
                            padding:30px;
                            border-radius:16px;
                        ">

                            <h1 style="
                                color:#b5179e;
                                margin-top:0;
                            ">
                                Welcome to GlowCart 💖
                            </h1>

                            <p>
                                Hello
                                <strong>
                                    ${escapeHtml(user.name)}
                                </strong>,
                            </p>

                            <p>
                                Your GlowCart registration
                                was successful.
                            </p>

                            <div style="
                                background:#fff5fb;
                                padding:18px;
                                border-radius:10px;
                                margin:20px 0;
                            ">

                                <p>
                                    <strong>
                                        Registered Email:
                                    </strong>
                                    ${escapeHtml(user.email)}
                                </p>

                                <p>
                                    <strong>
                                        Mobile:
                                    </strong>
                                    ${escapeHtml(user.mobile)}
                                </p>

                            </div>

                            <p>
                                You can now log in and start
                                shopping for your favourite
                                face creams.
                            </p>

                            <p>
                                Thank you for joining GlowCart! 💕
                            </p>

                        </div>

                    </div>
                `
            });

        if (result && result.error) {

            console.error(
                "RESEND WELCOME EMAIL ERROR:",
                result.error
            );

            return false;
        }

        console.log(
            "WELCOME EMAIL SENT:",
            user.email
        );

        return true;

    } catch (error) {

        console.error(
            "RESEND WELCOME EMAIL ERROR:",
            error
        );

        return false;
    }
}

/* =========================================================
   SEND ORDER CONFIRMATION EMAIL
========================================================= */

async function sendOrderEmail(order) {

    if (!resend) {

        console.error(
            "ORDER EMAIL NOT SENT: RESEND_API_KEY missing."
        );

        return false;
    }

    let items = [];

    try {

        items =
            Array.isArray(order.items)
                ? order.items
                : JSON.parse(
                    order.items || "[]"
                );

    } catch (error) {

        items = [];
    }

    const itemRows =
        items.map(item => {

            const productName =
                item.name ||
                item.productName ||
                "Product";

            const quantity =
                Number(item.quantity) || 1;

            const price =
                Number(item.price) || 0;

            const itemTotal =
                price * quantity;

            return `
                <tr>
                    <td style="
                        padding:12px;
                        border-bottom:1px solid #eee;
                    ">
                        ${escapeHtml(productName)}
                    </td>

                    <td style="
                        padding:12px;
                        text-align:center;
                        border-bottom:1px solid #eee;
                    ">
                        ${quantity}
                    </td>

                    <td style="
                        padding:12px;
                        text-align:right;
                        border-bottom:1px solid #eee;
                    ">
                        ₹${itemTotal.toFixed(2)}
                    </td>
                </tr>
            `;
        }).join("");

    try {

        const result =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [
                    String(order.email)
                        .trim()
                        .toLowerCase()
                ],

                subject:
                    `GlowCart Order Confirmation - ${order.order_id}`,

                html: `
                    <div style="
                        font-family:Arial,sans-serif;
                        max-width:700px;
                        margin:auto;
                        padding:25px;
                        background:#fff0f8;
                        color:#333;
                    ">

                        <div style="
                            background:white;
                            padding:30px;
                            border-radius:16px;
                        ">

                            <h1 style="
                                color:#b5179e;
                                margin-top:0;
                            ">
                                GlowCart 💖
                            </h1>

                            <h2>
                                Order Confirmed! 🎉
                            </h2>

                            <p>
                                Hello
                                <strong>
                                    ${escapeHtml(order.name)}
                                </strong>,
                            </p>

                            <p>
                                Thank you for shopping with
                                GlowCart. Your order has been
                                successfully placed.
                            </p>

                            <div style="
                                background:#fff5fb;
                                padding:18px;
                                border-radius:10px;
                                margin:20px 0;
                            ">

                                <p>
                                    <strong>
                                        Order ID:
                                    </strong>
                                    ${escapeHtml(order.order_id)}
                                </p>

                                <p>
                                    <strong>
                                        Order Status:
                                    </strong>
                                    ${escapeHtml(order.status || "Placed")}
                                </p>

                                <p>
                                    <strong>
                                        Payment:
                                    </strong>
                                    ${escapeHtml(
                                        order.payment_method ||
                                        "Cash on Delivery"
                                    )}
                                </p>

                            </div>

                            <h3>
                                Order Details
                            </h3>

                            <table style="
                                width:100%;
                                border-collapse:collapse;
                                margin-bottom:20px;
                            ">

                                <thead>

                                    <tr style="
                                        background:#fce4f3;
                                    ">

                                        <th style="
                                            padding:12px;
                                            text-align:left;
                                        ">
                                            Product
                                        </th>

                                        <th style="
                                            padding:12px;
                                            text-align:center;
                                        ">
                                            Qty
                                        </th>

                                        <th style="
                                            padding:12px;
                                            text-align:right;
                                        ">
                                            Price
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${itemRows}

                                </tbody>

                            </table>

                            <div style="
                                background:#fff5fb;
                                padding:20px;
                                border-radius:10px;
                            ">

                                <p>
                                    <strong>
                                        Subtotal:
                                    </strong>
                                    ₹${Number(
                                        order.subtotal
                                    ).toFixed(2)}
                                </p>

                                <p>
                                    <strong>
                                        GST:
                                    </strong>
                                    ₹${Number(
                                        order.gst
                                    ).toFixed(2)}
                                </p>

                                <h2 style="
                                    color:#b5179e;
                                ">
                                    Total:
                                    ₹${Number(
                                        order.total
                                    ).toFixed(2)}
                                </h2>

                            </div>

                            <h3>
                                Delivery Address
                            </h3>

                            <p>
                                ${escapeHtml(order.address)}
                                ${
                                    order.address2
                                        ? `<br>${escapeHtml(order.address2)}`
                                        : ""
                                }
                                <br>
                                ${escapeHtml(order.pincode)}
                            </p>

                            <hr style="
                                border:none;
                                border-top:1px solid #eee;
                                margin:25px 0;
                            ">

                            <p>
                                Thank you for choosing
                                <strong>GlowCart</strong>. 💕
                            </p>

                        </div>

                    </div>
                `
            });

        if (result && result.error) {

            console.error(
                "RESEND ORDER EMAIL ERROR:",
                result.error
            );

            return false;
        }

        console.log(
            "ORDER EMAIL SENT:",
            order.order_id,
            "TO:",
            order.email
        );

        return true;

    } catch (error) {

        console.error(
            "RESEND ORDER EMAIL ERROR:",
            error
        );

        return false;
    }
}

/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {

    if (!FRONTEND_FILE) {

        return res.status(500).send(
            "<h1>GlowCart index.html not found</h1>"
        );
    }

    res.sendFile(
        FRONTEND_FILE
    );
});

/* =========================================================
   HEALTH
========================================================= */

app.get(
    "/api/health",
    async (req, res) => {

        try {

            await query(
                "SELECT 1"
            );

            res.json({

                success: true,

                message:
                    "GlowCart Backend API is running!",

                server: "online",

                database:
                    "PostgreSQL connected",

                email:
                    resend
                        ? "Resend configured"
                        : "Resend not configured"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Database connection failed."
            });
        }
    }
);

/* =========================================================
   PRODUCTS
========================================================= */

app.get(
    "/api/products",
    async (req, res) => {

        try {

            const result =
                await query(`
                    SELECT
                        id,
                        name,
                        price,
                        description,
                        image
                    FROM products
                    ORDER BY id ASC
                `);

            const products =
                result.rows.map(product => ({

                    id:
                        Number(product.id),

                    name:
                        product.name,

                    price:
                        Number(product.price),

                    description:
                        product.description || "",

                    image:
                        product.image || ""
                }));

            res.json({

                success: true,

                products
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Could not load products."
            });
        }
    }
);

/* =========================================================
   REGISTER
========================================================= */

app.post(
    "/api/register",
    async (req, res) => {

        try {

            const {
                name,
                fullName,
                email,
                mobile,
                phone,
                password,
                address,
                address2,
                pincode
            } = req.body;

            const userName =
                name || fullName;

            const userMobile =
                mobile || phone;

            if (
                !userName ||
                !email ||
                !userMobile ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please fill all required fields."
                });
            }

            const cleanName =
                String(userName).trim();

            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const cleanMobile =
                String(userMobile).trim();

            const existing =
                await query(
                    `
                    SELECT id
                    FROM users
                    WHERE email=$1
                    `,
                    [cleanEmail]
                );

            if (existing.rows.length) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Email is already registered."
                });
            }

            const result =
                await query(
                    `
                    INSERT INTO users
                    (
                        name,
                        email,
                        mobile,
                        password,
                        address,
                        address2,
                        pincode
                    )
                    VALUES
                    ($1,$2,$3,$4,$5,$6,$7)

                    RETURNING
                        id,
                        name,
                        email,
                        mobile,
                        address,
                        address2,
                        pincode,
                        registered_at
                    `,
                    [
                        cleanName,
                        cleanEmail,
                        cleanMobile,
                        String(password),
                        String(address || ""),
                        String(address2 || ""),
                        String(pincode || "")
                    ]
                );

            const user =
                result.rows[0];

            /*
             * DATABASE REGISTRATION IS ALREADY SUCCESSFUL.
             *
             * Email failure must NOT make the registration fail.
             */

            const emailSent =
                await sendWelcomeEmail(user);

            res.status(201).json({

                success: true,

                message:
                    "Registration successful!",

                emailSent,

                user: {

                    id:
                        Number(user.id),

                    name:
                        user.name,

                    email:
                        user.email,

                    mobile:
                        user.mobile,

                    address:
                        user.address || "",

                    address2:
                        user.address2 || "",

                    pincode:
                        user.pincode || "",

                    registeredAt:
                        user.registered_at
                }
            });

        } catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Registration failed."
            });
        }
    }
);

/* =========================================================
   LOGIN
========================================================= */

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            const cleanEmail =
                String(email || "")
                    .trim()
                    .toLowerCase();

            const result =
                await query(
                    `
                    SELECT *
                    FROM users
                    WHERE email=$1
                    `,
                    [cleanEmail]
                );

            if (!result.rows.length) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."
                });
            }

            const user =
                result.rows[0];

            if (
                String(user.password) !==
                String(password)
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."
                });
            }

            res.json({

                success: true,

                message:
                    "Login successful!",

                user: {

                    id:
                        Number(user.id),

                    name:
                        user.name,

                    email:
                        user.email,

                    mobile:
                        user.mobile,

                    address:
                        user.address || "",

                    address2:
                        user.address2 || "",

                    pincode:
                        user.pincode || "",

                    registeredAt:
                        user.registered_at
                }
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Login failed."
            });
        }
    }
);

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post(
    "/api/admin/login",
    (req, res) => {

        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const password =
            String(req.body.password || "");

        if (
            email ===
                String(ADMIN_EMAIL)
                    .trim()
                    .toLowerCase()
            &&
            password ===
                String(ADMIN_PASSWORD)
        ) {

            return res.json({

                success: true,

                message:
                    "Admin login successful!",

                token:
                    ADMIN_TOKEN
            });
        }

        return res.status(401).json({

            success: false,

            message:
                "Invalid admin email or password."
        });
    }
);

/* =========================================================
   ADMIN USERS
========================================================= */

app.get(
    "/api/admin/users",
    checkAdmin,
    async (req, res) => {

        try {

            const result =
                await query(`
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

            const users =
                result.rows.map(user => ({

                    id:
                        Number(user.id),

                    name:
                        user.name,

                    email:
                        user.email,

                    mobile:
                        user.mobile,

                    address:
                        user.address || "",

                    address2:
                        user.address2 || "",

                    pincode:
                        user.pincode || "",

                    registeredAt:
                        user.registered_at
                }));

            res.json({

                success: true,

                count:
                    users.length,

                users
            });

        } catch (error) {

            console.error(
                "ADMIN USERS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load registered members."
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
                await query(
                    "SELECT COUNT(*) FROM users"
                );

            const orders =
                await query(
                    "SELECT COUNT(*) FROM orders"
                );

            const products =
                await query(
                    "SELECT COUNT(*) FROM products"
                );

            res.json({

                success: true,

                statistics: {

                    registeredMembers:
                        Number(
                            users.rows[0].count
                        ),

                    totalOrders:
                        Number(
                            orders.rows[0].count
                        ),

                    totalProducts:
                        Number(
                            products.rows[0].count
                        )
                }
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Dashboard failed."
            });
        }
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
                userId,
                name,
                email,
                mobile,
                address,
                address2,
                pincode,
                paymentMethod,
                items,
                subtotal,
                gst,
                total
            } = req.body;

            if (
                !name ||
                !email ||
                !address ||
                !pincode
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please provide all order details."
                });
            }

            if (
                !Array.isArray(items) ||
                !items.length
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your cart is empty."
                });
            }

            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const orderId =
                "GC" +
                Date.now() +
                Math.floor(
                    Math.random() * 1000
                );

            const result =
                await query(
                    `
                    INSERT INTO orders
                    (
                        order_id,
                        user_id,
                        name,
                        email,
                        mobile,
                        address,
                        address2,
                        pincode,
                        payment_method,
                        items,
                        subtotal,
                        gst,
                        total,
                        status
                    )
                    VALUES
                    (
                        $1,$2,$3,$4,$5,$6,$7,$8,
                        $9,$10::jsonb,$11,$12,$13,$14
                    )
                    RETURNING *
                    `,
                    [
                        orderId,

                        userId || null,

                        String(name).trim(),

                        cleanEmail,

                        mobile || "",

                        String(address).trim(),

                        address2 || "",

                        String(pincode).trim(),

                        paymentMethod ||
                            "Cash on Delivery",

                        JSON.stringify(items),

                        Number(subtotal) || 0,

                        Number(gst) || 0,

                        Number(total) || 0,

                        "Placed"
                    ]
                );

            const savedOrder =
                result.rows[0];

            /*
             * ORDER IS NOW PERMANENTLY SAVED.
             *
             * Send exactly one Resend confirmation.
             *
             * Even if email fails, the order remains successful.
             */

            const emailSent =
                await sendOrderEmail(
                    savedOrder
                );

            res.status(201).json({

                success: true,

                message:
                    "Order placed successfully!",

                emailSent,

                order:
                    formatOrder(
                        savedOrder
                    )
            });

        } catch (error) {

            console.error(
                "ORDER ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Order placement failed."
            });
        }
    }
);

/* =========================================================
   USER ORDERS
========================================================= */

app.get(
    "/api/orders/user/:email",
    async (req, res) => {

        try {

            const email =
                decodeURIComponent(
                    req.params.email
                )
                    .trim()
                    .toLowerCase();

            const result =
                await query(
                    `
                    SELECT *
                    FROM orders
                    WHERE email=$1
                    ORDER BY created_at DESC
                    `,
                    [email]
                );

            res.json({

                success: true,

                count:
                    result.rows.length,

                orders:
                    result.rows.map(
                        formatOrder
                    )
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Could not load orders."
            });
        }
    }
);

/* =========================================================
   ALL ORDERS
========================================================= */

app.get(
    "/api/orders",
    async (req, res) => {

        try {

            const result =
                await query(`
                    SELECT *
                    FROM orders
                    ORDER BY created_at DESC
                `);

            res.json({

                success: true,

                orders:
                    result.rows.map(
                        formatOrder
                    )
            });

        } catch (error) {

            console.error(
                "ALL ORDERS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Could not load orders."
            });
        }
    }
);

/* =========================================================
   ORDER FORMATTER
========================================================= */

function formatOrder(order) {

    let items = [];

    try {

        items =
            Array.isArray(order.items)
                ? order.items
                : JSON.parse(
                    order.items || "[]"
                );

    } catch (error) {

        items = [];
    }

    return {

        id:
            order.id,

        orderId:
            order.order_id,

        userId:
            order.user_id,

        name:
            order.name,

        email:
            order.email,

        mobile:
            order.mobile || "",

        address:
            order.address || "",

        address2:
            order.address2 || "",

        pincode:
            order.pincode || "",

        paymentMethod:
            order.payment_method ||
            "Cash on Delivery",

        items,

        subtotal:
            Number(order.subtotal) || 0,

        gst:
            Number(order.gst) || 0,

        total:
            Number(order.total) || 0,

        status:
            order.status || "Placed",

        createdAt:
            order.created_at
    };
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   404
========================================================= */

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "GlowCart endpoint not found.",

        path:
            req.originalUrl
    });
});

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

    try {

        if (!process.env.DATABASE_URL) {

            throw new Error(
                "DATABASE_URL is missing."
            );
        }

        await query(
            "SELECT NOW()"
        );

        await initializeDatabase();

        app.listen(
            PORT,
            HOST,
            () => {

                console.log(
                    "================================"
                );

                console.log(
                    "       GLOWCART SERVER"
                );

                console.log(
                    "================================"
                );

                console.log(
                    "Port:",
                    PORT
                );

                console.log(
                    "Database: PostgreSQL"
                );

                console.log(
                    "Email:",
                    resend
                        ? "Resend ENABLED"
                        : "Resend DISABLED"
                );

                console.log(
                    "Email From:",
                    EMAIL_FROM
                );

                console.log(
                    "Frontend:",
                    FRONTEND_FILE ||
                    "NOT FOUND"
                );

                console.log(
                    "Admin:",
                    ADMIN_EMAIL
                );

                console.log(
                    "================================"
                );
            }
        );

    } catch (error) {

        console.error(
            "SERVER START ERROR:",
            error
        );

        process.exit(1);
    }
}

startServer();
