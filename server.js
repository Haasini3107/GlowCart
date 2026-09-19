const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(cors({
    origin: "*"
}));

app.use(express.json({
    limit: "5mb"
}));

// ===============================
// FILE LOCATIONS
// ===============================

const PRODUCTS_FILE = path.join(__dirname, "products.json");
const USERS_FILE = path.join(__dirname, "users.json");
const ORDERS_FILE = path.join(__dirname, "place.json");

// ===============================
// ADMIN SETTINGS
// ===============================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Temporary admin token
let ADMIN_TOKEN = null;

// ===============================
// FILE FUNCTIONS
// ===============================

function createFile(file, defaultData) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(
            file,
            JSON.stringify(defaultData, null, 2)
        );
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
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2)
    );
}

// Create files if they don't exist
createFile(PRODUCTS_FILE, []);
createFile(USERS_FILE, []);
createFile(ORDERS_FILE);

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "GlowCart Backend is Online"
    });
});

// ===============================
// HEALTH
// ===============================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "GlowCart API is healthy"
    });
});

// ===============================
// EMAILJS CONFIG
// ===============================

app.get("/api/emailjs-config", (req, res) => {
    res.json({
        serviceId: process.env.EMAILJS_SERVICE_ID || "",
        publicKey: process.env.EMAILJS_PUBLIC_KEY || "",
        orderTemplateId: process.env.EMAILJS_ORDER_TEMPLATE_ID || "",
        welcomeTemplateId: process.env.EMAILJS_WELCOME_TEMPLATE_ID || ""
    });
});

// ===============================
// PRODUCTS
// ===============================

app.get("/api/products", (req, res) => {
    const products = readJson(PRODUCTS_FILE);

    res.json({
        success: true,
        products: products
    });
});

app.get("/api/products/:id", (req, res) => {

    const products = readJson(PRODUCTS_FILE);

    const product = products.find(
        p => String(p.id) === String(req.params.id)
    );

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    res.json({
        success: true,
        product: product
    });
});

// ===============================
// REGISTER
// ===============================

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
            pincode2
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
                message: "Please fill all required fields"
            });
        }

        const users = readJson(USERS_FILE);

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        const existingUser = users.find(
            user =>
                String(user.email).toLowerCase() === cleanEmail
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const newUser = {
            id: "USER" + Date.now(),

            name: String(name).trim(),

            email: cleanEmail,

            mobile: String(mobile).trim(),

            // Existing project behavior retained.
            // For production, passwords should be hashed.
            password: String(password),

            address: String(address).trim(),

            pincode: String(pincode).trim(),

            address2: address2
                ? String(address2).trim()
                : "",

            pincode2: pincode2
                ? String(pincode2).trim()
                : "",

            registeredAt: new Date().toISOString()
        };

        users.push(newUser);

        writeJson(USERS_FILE, users);

        console.log(
            "New member registered:",
            newUser.email
        );

        res.status(201).json({
            success: true,
            message: "Registration successful",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile,
                address: newUser.address,
                pincode: newUser.pincode,
                address2: newUser.address2,
                pincode2: newUser.pincode2,
                registeredAt: newUser.registeredAt
            }
        });

    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const users = readJson(USERS_FILE);

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        const user = users.find(
            u =>
                String(u.email).toLowerCase() === cleanEmail &&
                String(u.password) === String(password)
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                pincode: user.pincode,
                address2: user.address2,
                pincode2: user.pincode2,
                registeredAt: user.registeredAt
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});

// ======================================================
// ADMIN LOGIN
// ======================================================

app.post("/api/admin/login", (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {

            return res.status(500).json({
                success: false,
                message: "Admin credentials are not configured in Render"
            });
        }

        if (
            String(email).trim().toLowerCase() !==
            String(ADMIN_EMAIL).trim().toLowerCase()
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password"
            });
        }

        if (
            String(password) !==
            String(ADMIN_PASSWORD)
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid admin email or password"
            });
        }

        // Generate temporary token
        ADMIN_TOKEN = crypto
            .randomBytes(32)
            .toString("hex");

        console.log("Admin logged in");

        res.json({
            success: true,
            message: "Admin login successful",
            token: ADMIN_TOKEN
        });

    } catch (error) {

        console.error("Admin login error:", error);

        res.status(500).json({
            success: false,
            message: "Admin login failed"
        });
    }
});

// ======================================================
// ADMIN AUTHENTICATION
// ======================================================

function checkAdmin(req, res, next) {

    const authHeader = req.headers.authorization || "";

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : "";

    if (
        !ADMIN_TOKEN ||
        !token ||
        token !== ADMIN_TOKEN
    ) {

        return res.status(401).json({
            success: false,
            message: "Unauthorized admin access"
        });
    }

    next();
}

// ======================================================
// ADMIN - GET REGISTERED MEMBERS
// ======================================================

app.get(
    "/api/admin/users",
    checkAdmin,
    (req, res) => {

        try {

            const users = readJson(USERS_FILE);

            // NEVER send passwords to frontend
            const safeUsers = users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                pincode: user.pincode,
                address2: user.address2,
                pincode2: user.pincode2,
                registeredAt: user.registeredAt
            }));

            res.json({
                success: true,

                totalMembers: safeUsers.length,

                users: safeUsers
            });

        } catch (error) {

            console.error(
                "Admin users error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to load members"
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
            message: "Admin logged out"
        });
    }
);

// ======================================================
// ORDERS - CREATE
// ======================================================

app.post("/api/orders", (req, res) => {

    try {

        const {
            email,
            items,
            address,
            pincode
        } = req.body;

        if (
            !email ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !address ||
            !pincode
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid order details"
            });
        }

        let subtotal = 0;

        items.forEach(item => {

            const price =
                Number(item.price) || 0;

            const quantity =
                Number(item.quantity) || 1;

            subtotal += price * quantity;
        });

        const gst =
            Number((subtotal * 0.18).toFixed(2));

        const total =
            Number((subtotal + gst).toFixed(2));

        const orders = readJson(ORDERS_FILE);

        const order = {

            orderId:
                "ORD" +
                Date.now() +
                Math.floor(Math.random() * 1000),

            email: String(email)
                .trim()
                .toLowerCase(),

            items: items,

            address: String(address).trim(),

            pincode: String(pincode).trim(),

            subtotal: subtotal,

            gst: gst,

            total: total,

            orderedAt:
                new Date().toISOString()
        };

        orders.push(order);

        writeJson(
            ORDERS_FILE,
            orders
        );

        console.log(
            "Order placed:",
            order.orderId
        );

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: order
        });

    } catch (error) {

        console.error(
            "Order error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Order failed"
        });
    }
});

// ======================================================
// ALL ORDERS
// ======================================================

app.get("/api/orders", (req, res) => {

    const orders = readJson(ORDERS_FILE);

    res.json({
        success: true,
        orders: orders
    });
});

// ======================================================
// USER ORDERS
// ======================================================

app.get("/api/orders/:email", (req, res) => {

    const orders = readJson(ORDERS_FILE);

    const email = String(req.params.email)
        .trim()
        .toLowerCase();

    const userOrders = orders.filter(
        order =>
            String(order.email).toLowerCase() === email
    );

    res.json({
        success: true,
        orders: userOrders
    });
});

// ======================================================
// 404
// ======================================================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use((error, req, res, next) => {

    console.error(
        "Server error:",
        error
    );

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

// ======================================================
// START SERVER
// ======================================================

const PORT =
    process.env.PORT || 10000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `GlowCart server running on port ${PORT}`
        );

        console.log(
            "Admin system:",
            ADMIN_EMAIL
                ? "Configured"
                : "NOT CONFIGURED"
        );
    }
);
