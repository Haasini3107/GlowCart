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
   DATABASE CONFIGURATION
========================================================= */

if (!process.env.DATABASE_URL) {
    console.error("================================================");
    console.error("ERROR: DATABASE_URL is not configured.");
    console.error("Add DATABASE_URL in Render Environment Variables.");
    console.error("================================================");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: process.env.DATABASE_URL
        ? {
              rejectUnauthorized: false
          }
        : false,

    max: 10,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 10000
});

/* =========================================================
   EMAIL CONFIGURATION
========================================================= */

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    "GlowCart <onboarding@resend.dev>";

/* =========================================================
   ADMIN CONFIGURATION
========================================================= */

const ADMIN_EMAIL =
    process.env.ADMIN_EMAIL ||
    "admin@glowcart.com";

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD ||
    "admin123";

const ADMIN_TOKEN = "glowcart-admin-session";

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
   DATABASE HELPER
========================================================= */

async function query(text, params = []) {
    const result = await pool.query(text, params);
    return result;
}

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {
    try {
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
                registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS products (
                id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                price NUMERIC(10,2) NOT NULL,
                description TEXT DEFAULT '',
                image TEXT DEFAULT '',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
                payment_method TEXT DEFAULT 'Cash on Delivery',
                items JSONB NOT NULL DEFAULT '[]'::jsonb,
                subtotal NUMERIC(10,2) DEFAULT 0,
                gst NUMERIC(10,2) DEFAULT 0,
                total NUMERIC(10,2) DEFAULT 0,
                status TEXT DEFAULT 'Placed',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
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

        await query(`
            CREATE INDEX IF NOT EXISTS orders_created_index
            ON orders(created_at DESC)
        `);

        await seedProducts();

        console.log("======================================");
        console.log("DATABASE INITIALIZED SUCCESSFULLY");
        console.log("======================================");

    } catch (error) {

        console.error("DATABASE INITIALIZATION ERROR:");
        console.error(error);

        throw error;
    }
}

/* =========================================================
   PRODUCT SEEDING
========================================================= */

async function seedProducts() {

    const result = await query(
        `SELECT COUNT(*) AS count FROM products`
    );

    const count = Number(result.rows[0].count);

    if (count > 0) {
        return;
    }

    const products = [
        {
            name: "Glow Radiance Cream",
            price: 299,
            description:
                "Brightening face cream for radiant looking skin.",
            image:
                "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=80"
        },

        {
            name: "Vitamin C Face Cream",
            price: 349,
            description:
                "Vitamin C enriched cream for fresh and glowing skin.",
            image:
                "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=700&q=80"
        },

        {
            name: "Hydra Moisturizing Cream",
            price: 279,
            description:
                "Deep moisturizing cream for soft and hydrated skin.",
            image:
                "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=700&q=80"
        },

        {
            name: "Aloe Vera Face Cream",
            price: 249,
            description:
                "Aloe Vera based soothing face cream.",
            image:
                "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=700&q=80"
        }
    ];

    for (const product of products) {

        await query(
            `
            INSERT INTO products
            (name, price, description, image)
            VALUES ($1, $2, $3, $4)
            `,
            [
                product.name,
                product.price,
                product.description,
                product.image
            ]
        );
    }

    console.log("Default GlowCart products inserted.");
}

/* =========================================================
   LEGACY USERS MIGRATION
   Imports users.json ONCE if it exists.
========================================================= */

async function migrateOldUsers() {

    try {

        const usersFile =
            path.join(__dirname, "users.json");

        if (!fs.existsSync(usersFile)) {
            return;
        }

        const raw =
            fs.readFileSync(
                usersFile,
                "utf8"
            );

        if (!raw.trim()) {
            return;
        }

        const oldUsers = JSON.parse(raw);

        if (!Array.isArray(oldUsers)) {
            return;
        }

        for (const user of oldUsers) {

            if (!user.email || !user.password) {
                continue;
            }

            const email =
                String(user.email)
                    .trim()
                    .toLowerCase();

            const existing =
                await query(
                    `
                    SELECT id
                    FROM users
                    WHERE email = $1
                    `,
                    [email]
                );

            if (existing.rows.length > 0) {
                continue;
            }

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
                    pincode,
                    registered_at
                )
                VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8)
                `,
                [
                    user.name || user.fullName || "",
                    email,
                    user.mobile || user.phone || "",
                    String(user.password),
                    user.address || "",
                    user.address2 || "",
                    user.pincode || "",
                    user.registeredAt
                        ? new Date(user.registeredAt)
                        : new Date()
                ]
            );

            console.log(
                "Migrated old user:",
                email
            );
        }

    } catch (error) {

        console.error(
            "OLD USER MIGRATION ERROR:"
        );

        console.error(error);
    }
}

/* =========================================================
   ADMIN AUTHENTICATION
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
   HOME
========================================================= */

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "GlowCart Backend API is running!",

        server: "online",

        database:
            process.env.DATABASE_URL
                ? "PostgreSQL connected"
                : "DATABASE_URL missing"
    });
});

/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", async (req, res) => {

    try {

        await query("SELECT 1");

        res.status(200).json({

            success: true,

            message:
                "GlowCart API is working!",

            server: "online",

            database: "connected",

            port: PORT
        });

    } catch (error) {

        console.error(
            "HEALTH DATABASE ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "API is running but database connection failed.",

            database: "disconnected"
        });
    }
});

/* =========================================================
   PRODUCTS
========================================================= */

app.get("/api/products", async (req, res) => {

    try {

        const result = await query(
            `
            SELECT
                id,
                name,
                price,
                description,
                image
            FROM products
            ORDER BY id ASC
            `
        );

        const products =
            result.rows.map(function (product) {

                return {

                    id: Number(product.id),

                    name: product.name,

                    price: Number(product.price),

                    description:
                        product.description || "",

                    image:
                        product.image || ""
                };
            });

        res.status(200).json({

            success: true,

            products: products
        });

    } catch (error) {

        console.error(
            "PRODUCTS ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Could not load products."
        });
    }
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/register", async (req, res) => {

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
                    "Please fill all required registration fields."
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

        const cleanPassword =
            String(password);

        const existing =
            await query(
                `
                SELECT id
                FROM users
                WHERE email = $1
                `,
                [cleanEmail]
            );

        if (existing.rows.length > 0) {

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
                    cleanPassword,
                    address
                        ? String(address).trim()
                        : "",
                    address2
                        ? String(address2).trim()
                        : "",
                    pincode
                        ? String(pincode).trim()
                        : ""
                ]
            );

        const user =
            result.rows[0];

        const safeUser = {

            id: Number(user.id),

            name: user.name,

            email: user.email,

            mobile: user.mobile,

            address:
                user.address || "",

            address2:
                user.address2 || "",

            pincode:
                user.pincode || "",

            registeredAt:
                user.registered_at
        };

        /*
           SEND WELCOME EMAIL
           This is optional.
           If RESEND_API_KEY is configured,
           the backend sends the welcome email.
        */

        let emailSent = false;

        if (resend) {

            try {

                await resend.emails.send({

                    from: EMAIL_FROM,

                    to: [safeUser.email],

                    subject:
                        "Welcome to GlowCart!",

                    html: `
                        <div style="
                            font-family:Arial,sans-serif;
                            max-width:600px;
                            margin:auto;
                            padding:30px;
                            border-radius:20px;
                            background:#fff0f8;
                        ">

                            <h1 style="
                                color:#b5179e;
                            ">
                                Welcome to GlowCart 💖
                            </h1>

                            <p>
                                Hello
                                <strong>
                                    ${escapeHtml(
                                        safeUser.name
                                    )}
                                </strong>,
                            </p>

                            <p>
                                Your GlowCart account has
                                been registered successfully.
                            </p>

                            <p>
                                Thank you for joining
                                GlowCart - Premium Face Creams.
                            </p>

                            <div style="
                                margin-top:25px;
                                padding:15px;
                                background:white;
                                border-radius:12px;
                            ">

                                <strong>
                                    Registered Email:
                                </strong>

                                ${escapeHtml(
                                    safeUser.email
                                )}

                                <br><br>

                                <strong>
                                    Mobile:
                                </strong>

                                ${escapeHtml(
                                    safeUser.mobile
                                )}

                            </div>

                            <p style="
                                margin-top:25px;
                                color:#777;
                            ">
                                Enjoy shopping with GlowCart ✨
                            </p>

                        </div>
                    `
                });

                emailSent = true;

            } catch (emailError) {

                console.error(
                    "WELCOME EMAIL ERROR:",
                    emailError
                );
            }
        }

        return res.status(201).json({

            success: true,

            message:
                "Registration successful!",

            emailSent: emailSent,

            user: safeUser
        });

    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Registration failed."
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

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter email and password."
            });
        }

        const cleanEmail =
            String(email)
                .trim()
                .toLowerCase();

        const result =
            await query(
                `
                SELECT
                    id,
                    name,
                    email,
                    mobile,
                    password,
                    address,
                    address2,
                    pincode,
                    registered_at
                FROM users
                WHERE email = $1
                `,
                [cleanEmail]
            );

        if (result.rows.length === 0) {

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

        return res.status(200).json({

            success: true,

            message:
                "Login successful!",

            user: {

                id: Number(user.id),

                name: user.name,

                email: user.email,

                mobile: user.mobile,

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
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Login failed."
        });
    }
});

/* =========================================================
   GET USERS
========================================================= */

app.get("/api/users", async (req, res) => {

    try {

        const result =
            await query(
                `
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
                `
            );

        const users =
            result.rows.map(function (user) {

                return {

                    id: Number(user.id),

                    name: user.name,

                    email: user.email,

                    mobile: user.mobile,

                    address:
                        user.address || "",

                    address2:
                        user.address2 || "",

                    pincode:
                        user.pincode || "",

                    registeredAt:
                        user.registered_at
                };
            });

        return res.status(200).json({

            success: true,

            count: users.length,

            users: users
        });

    } catch (error) {

        console.error(
            "USERS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not load users."
        });
    }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", (req, res) => {

    try {

        const enteredEmail =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const enteredPassword =
            String(req.body.password || "");

        const configuredEmail =
            String(ADMIN_EMAIL)
                .trim()
                .toLowerCase();

        if (
            enteredEmail === configuredEmail &&
            enteredPassword ===
                String(ADMIN_PASSWORD)
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "Admin login successful!",

                token: ADMIN_TOKEN
            });
        }

        return res.status(401).json({

            success: false,

            message:
                "Invalid admin email or password."
        });

    } catch (error) {

        console.error(
            "ADMIN LOGIN ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Admin login failed."
        });
    }
});

/* =========================================================
   ADMIN USERS
========================================================= */

app.get(
    "/api/admin/users",
    checkAdmin,
    async (req, res) => {

        try {

            const result =
                await query(
                    `
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
                    `
                );

            const users =
                result.rows.map(
                    function (user) {

                        return {

                            id: Number(user.id),

                            name: user.name,

                            email: user.email,

                            mobile: user.mobile,

                            address:
                                user.address || "",

                            address2:
                                user.address2 || "",

                            pincode:
                                user.pincode || "",

                            registeredAt:
                                user.registered_at
                        };
                    }
                );

            return res.status(200).json({

                success: true,

                count: users.length,

                users: users
            });

        } catch (error) {

            console.error(
                "ADMIN USERS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Could not load registered members."
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

        return res.status(200).json({

            success: true,

            message:
                "Admin logged out."
        });
    }
);

/* =========================================================
   PLACE ORDER
========================================================= */

app.post("/api/orders", async (req, res) => {

    try {

        const {
            userId,
            orderId,
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
            items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Your cart is empty."
            });
        }

        const generatedOrderId =
            orderId ||
            "GC" +
                Date.now() +
                Math.floor(
                    Math.random() * 1000
                );

        let numericUserId = null;

        if (userId) {

            const parsed =
                Number(userId);

            if (
                Number.isInteger(parsed) &&
                parsed > 0
            ) {
                numericUserId = parsed;
            }
        }

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
                    generatedOrderId,
                    numericUserId,
                    String(name).trim(),
                    String(email)
                        .trim()
                        .toLowerCase(),
                    mobile
                        ? String(mobile).trim()
                        : "",
                    String(address).trim(),
                    address2
                        ? String(address2).trim()
                        : "",
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

        const order =
            formatOrder(result.rows[0]);

        return res.status(201).json({

            success: true,

            message:
                "Order placed successfully!",

            order: order
        });

    } catch (error) {

        console.error(
            "ORDER ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Order placement failed."
        });
    }
});

/* =========================================================
   GET ALL ORDERS
========================================================= */

app.get("/api/orders", async (req, res) => {

    try {

        const result =
            await query(
                `
                SELECT *
                FROM orders
                ORDER BY created_at DESC
                `
            );

        const orders =
            result.rows.map(formatOrder);

        return res.status(200).json({

            success: true,

            count: orders.length,

            orders: orders
        });

    } catch (error) {

        console.error(
            "ORDERS ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not load orders."
        });
    }
});

/* =========================================================
   GET ORDERS BY EMAIL
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
                    WHERE email = $1
                    ORDER BY created_at DESC
                    `,
                    [email]
                );

            const orders =
                result.rows.map(formatOrder);

            return res.status(200).json({

                success: true,

                count: orders.length,

                orders: orders
            });

        } catch (error) {

            console.error(
                "USER ORDERS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Could not load user orders."
            });
        }
    }
);

/* =========================================================
   GET SINGLE ORDER
========================================================= */

app.get(
    "/api/orders/:id",
    async (req, res) => {

        try {

            const result =
                await query(
                    `
                    SELECT *
                    FROM orders
                    WHERE id::text = $1
                       OR order_id = $1
                    LIMIT 1
                    `,
                    [String(req.params.id)]
                );

            if (result.rows.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found."
                });
            }

            return res.status(200).json({

                success: true,

                order:
                    formatOrder(
                        result.rows[0]
                    )
            });

        } catch (error) {

            console.error(
                "SINGLE ORDER ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Could not find order."
            });
        }
    }
);

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

app.put(
    "/api/orders/:id/status",
    async (req, res) => {

        try {

            const {
                status
            } = req.body;

            if (!status) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Status is required."
                });
            }

            const result =
                await query(
                    `
                    UPDATE orders
                    SET
                        status = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id::text = $2
                       OR order_id = $2
                    RETURNING *
                    `,
                    [
                        String(status),
                        String(req.params.id)
                    ]
                );

            if (result.rows.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found."
                });
            }

            return res.status(200).json({

                success: true,

                message:
                    "Order status updated.",

                order:
                    formatOrder(
                        result.rows[0]
                    )
            });

        } catch (error) {

            console.error(
                "UPDATE ORDER ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Could not update order."
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

            const usersResult =
                await query(
                    `SELECT COUNT(*) FROM users`
                );

            const ordersResult =
                await query(
                    `SELECT COUNT(*) FROM orders`
                );

            const productsResult =
                await query(
                    `SELECT COUNT(*) FROM products`
                );

            const salesResult =
                await query(
                    `
                    SELECT COALESCE(
                        SUM(total),
                        0
                    ) AS total
                    FROM orders
                    `
                );

            return res.status(200).json({

                success: true,

                statistics: {

                    registeredMembers:
                        Number(
                            usersResult.rows[0].count
                        ),

                    totalOrders:
                        Number(
                            ordersResult.rows[0].count
                        ),

                    totalProducts:
                        Number(
                            productsResult.rows[0].count
                        ),

                    totalSales:
                        Number(
                            salesResult.rows[0].total
                        )
                }
            });

        } catch (error) {

            console.error(
                "DASHBOARD ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Could not load dashboard."
            });
        }
    }
);

/* =========================================================
   404
========================================================= */

app.use(
    function (req, res) {

        res.status(404).json({

            success: false,

            message:
                "GlowCart API endpoint not found.",

            path:
                req.originalUrl
        });
    }
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "SERVER ERROR:"
        );

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Internal server error."
        });
    }
);

/* =========================================================
   HTML ESCAPE FOR EMAIL
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
   ORDER FORMATTER
========================================================= */

function formatOrder(order) {

    let items = [];

    try {

        if (Array.isArray(order.items)) {
            items = order.items;
        } else if (typeof order.items === "string") {
            items = JSON.parse(order.items);
        }

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

        items:
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
            order.created_at,

        updatedAt:
            order.updated_at
    };
}

/* =========================================================
   DATABASE + SERVER START
========================================================= */

async function startServer() {

    try {

        if (!process.env.DATABASE_URL) {

            throw new Error(
                "DATABASE_URL is missing in Render Environment Variables."
            );
        }

        await query("SELECT NOW()");

        console.log(
            "PostgreSQL connection successful."
        );

        await initializeDatabase();

        await migrateOldUsers();

        app.listen(
            PORT,
            HOST,
            function () {

                console.log("");
                console.log(
                    "======================================"
                );

                console.log(
                    "          GLOWCART BACKEND"
                );

                console.log(
                    "======================================"
                );

                console.log(
                    "Server running on port:",
                    PORT
                );

                console.log(
                    "Host:",
                    HOST
                );

                console.log(
                    "Database: PostgreSQL"
                );

                console.log(
                    "Admin email:",
                    process.env.ADMIN_EMAIL
                        ? "configured"
                        : "default"
                );

                console.log(
                    "Admin password:",
                    process.env.ADMIN_PASSWORD
                        ? "configured"
                        : "default"
                );

                console.log(
                    "Welcome email:",
                    process.env.RESEND_API_KEY
                        ? "enabled"
                        : "disabled"
                );

                console.log(
                    "======================================"
                );

                console.log("");
            }
        );

    } catch (error) {

        console.error("");
        console.error(
            "======================================"
        );

        console.error(
            "GLOWCART SERVER START FAILED"
        );

        console.error(
            "======================================"
        );

        console.error(error);

        process.exit(1);
    }
}

startServer();
