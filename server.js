const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

/* =========================================================
   RENDER CONFIGURATION
========================================================= */

const PORT = Number(process.env.PORT) || 10000;
const HOST = "0.0.0.0";

/* =========================================================
   FILE PATHS
========================================================= */

const USERS_FILE = path.join(__dirname, "users.json");
const ORDERS_FILE = path.join(__dirname, "place.json");
const PRODUCTS_FILE = path.join(__dirname, "products.json");

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json({ limit: "2mb" }));

app.use(express.urlencoded({
    extended: true,
    limit: "2mb"
}));

/* =========================================================
   FILE FUNCTIONS
========================================================= */

function createFileIfMissing(file, data) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify(data, null, 2),
                "utf8"
            );
        }
    } catch (error) {
        console.error("Could not create file:", file);
        console.error(error);
    }
}

function readFile(file, defaultValue) {
    try {
        createFileIfMissing(file, defaultValue);

        const content = fs.readFileSync(file, "utf8");

        if (!content.trim()) {
            return defaultValue;
        }

        return JSON.parse(content);

    } catch (error) {
        console.error("Could not read JSON file:", file);
        console.error(error);

        return defaultValue;
    }
}

function saveFile(file, data) {
    try {
        fs.writeFileSync(
            file,
            JSON.stringify(data, null, 2),
            "utf8"
        );

        return true;

    } catch (error) {
        console.error("Could not save JSON file:", file);
        console.error(error);

        return false;
    }
}

/* =========================================================
   CREATE REQUIRED FILES
========================================================= */

createFileIfMissing(USERS_FILE, []);

createFileIfMissing(ORDERS_FILE, []);

createFileIfMissing(PRODUCTS_FILE, [
    {
        id: 1,
        name: "Glow Radiance Cream",
        price: 299,
        image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 2,
        name: "Vitamin C Face Cream",
        price: 349,
        image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 3,
        name: "Hydra Moisturizing Cream",
        price: 279,
        image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 4,
        name: "Aloe Vera Face Cream",
        price: 249,
        image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=700&q=80"
    }
]);

/* =========================================================
   HOME
========================================================= */

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "GlowCart Backend API is running!",
        server: "online"
    });
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "GlowCart API is working!",
        server: "online",
        port: PORT
    });
});

/* =========================================================
   PRODUCTS
========================================================= */

app.get("/api/products", (req, res) => {

    const products = readFile(PRODUCTS_FILE, []);

    res.status(200).json({
        success: true,
        products: products
    });
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/register", (req, res) => {

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

        const userName = name || fullName;
        const userMobile = mobile || phone;

        if (
            !userName ||
            !email ||
            !userMobile ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required registration fields."
            });
        }

        const users = readFile(USERS_FILE, []);

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        const existingUser = users.find(function (user) {

            return String(user.email || "")
                .trim()
                .toLowerCase() === cleanEmail;

        });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        const newUser = {

            id: Date.now(),

            name: String(userName).trim(),

            email: cleanEmail,

            mobile: String(userMobile).trim(),

            password: String(password),

            address: address
                ? String(address).trim()
                : "",

            address2: address2
                ? String(address2).trim()
                : "",

            pincode: pincode
                ? String(pincode).trim()
                : "",

            registeredAt: new Date().toISOString()
        };

        users.push(newUser);

        const saved = saveFile(
            USERS_FILE,
            users
        );

        if (!saved) {

            return res.status(500).json({
                success: false,
                message: "Registration could not be saved."
            });
        }

        return res.status(201).json({

            success: true,

            message: "Registration successful!",

            user: {

                id: newUser.id,

                name: newUser.name,

                email: newUser.email,

                mobile: newUser.mobile,

                address: newUser.address,

                address2: newUser.address2,

                pincode: newUser.pincode,

                registeredAt: newUser.registeredAt
            }

        });

    } catch (error) {

        console.error("REGISTER ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Registration failed."
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
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message: "Please enter email and password."
            });
        }

        const users = readFile(
            USERS_FILE,
            []
        );

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        const user = users.find(function (item) {

            const savedEmail = String(
                item.email || ""
            )
                .trim()
                .toLowerCase();

            const savedPassword = String(
                item.password || ""
            );

            return (
                savedEmail === cleanEmail &&
                savedPassword === String(password)
            );

        });

        if (!user) {

            return res.status(401).json({

                success: false,

                message: "Invalid email or password."
            });
        }

        return res.status(200).json({

            success: true,

            message: "Login successful!",

            user: {

                id: user.id,

                name: user.name,

                email: user.email,

                mobile: user.mobile,

                address: user.address || "",

                address2: user.address2 || "",

                pincode: user.pincode || "",

                registeredAt: user.registeredAt
            }
        });

    } catch (error) {

        console.error("LOGIN ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Login failed."
        });
    }
});

/* =========================================================
   GET REGISTERED USERS
========================================================= */

app.get("/api/users", (req, res) => {

    try {

        const users = readFile(
            USERS_FILE,
            []
        );

        const safeUsers = users.map(function (user) {

            return {

                id: user.id,

                name: user.name,

                email: user.email,

                mobile: user.mobile,

                address: user.address || "",

                address2: user.address2 || "",

                pincode: user.pincode || "",

                registeredAt: user.registeredAt
            };

        });

        return res.status(200).json({

            success: true,

            count: safeUsers.length,

            users: safeUsers
        });

    } catch (error) {

        console.error("USERS ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Could not load users."
        });
    }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const adminEmail =
            process.env.ADMIN_EMAIL ||
            "admin@glowcart.com";

        const adminPassword =
            process.env.ADMIN_PASSWORD ||
            "admin123";

        const enteredEmail = String(email || "")
            .trim()
            .toLowerCase();

        const savedAdminEmail = String(adminEmail)
            .trim()
            .toLowerCase();

        if (
            enteredEmail === savedAdminEmail &&
            String(password || "") === String(adminPassword)
        ) {

            return res.status(200).json({

                success: true,

                message: "Admin login successful!",

                token: "glowcart-admin-session"
            });
        }

        return res.status(401).json({

            success: false,

            message: "Invalid admin email or password."
        });

    } catch (error) {

        console.error("ADMIN LOGIN ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Admin login failed."
        });
    }
});

/* =========================================================
   ADMIN USERS
========================================================= */

app.get("/api/admin/users", (req, res) => {

    try {

        const users = readFile(
            USERS_FILE,
            []
        );

        const safeUsers = users.map(function (user) {

            return {

                id: user.id,

                name: user.name,

                email: user.email,

                mobile: user.mobile,

                address: user.address || "",

                address2: user.address2 || "",

                pincode: user.pincode || "",

                registeredAt: user.registeredAt
            };

        });

        return res.status(200).json({

            success: true,

            count: safeUsers.length,

            users: safeUsers
        });

    } catch (error) {

        console.error("ADMIN USERS ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Could not load registered members."
        });
    }
});

/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post("/api/admin/logout", (req, res) => {

    return res.status(200).json({

        success: true,

        message: "Admin logged out."
    });
});

/* =========================================================
   PLACE ORDER
========================================================= */

app.post("/api/orders", (req, res) => {

    try {

        const {
            userId,
            orderId,
            name,
            email,
            mobile,
            address,
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
            !pincode ||
            !items
        ) {

            return res.status(400).json({

                success: false,

                message: "Please provide all order details."
            });
        }

        if (!Array.isArray(items) || items.length === 0) {

            return res.status(400).json({

                success: false,

                message: "Your cart is empty."
            });
        }

        const orders = readFile(
            ORDERS_FILE,
            []
        );

        const newOrder = {

            id: orderId || ("GC" + Date.now()),

            orderId: orderId || ("GC" + Date.now()),

            userId: userId || null,

            name: String(name).trim(),

            email: String(email)
                .trim()
                .toLowerCase(),

            mobile: mobile
                ? String(mobile).trim()
                : "",

            address: String(address).trim(),

            pincode: String(pincode).trim(),

            paymentMethod:
                paymentMethod ||
                "Cash on Delivery",

            items: items,

            subtotal: Number(subtotal) || 0,

            gst: Number(gst) || 0,

            total: Number(total) || 0,

            status: "Placed",

            createdAt: new Date().toISOString()
        };

        orders.push(newOrder);

        const saved = saveFile(
            ORDERS_FILE,
            orders
        );

        if (!saved) {

            return res.status(500).json({

                success: false,

                message: "Order could not be saved."
            });
        }

        return res.status(201).json({

            success: true,

            message: "Order placed successfully!",

            order: newOrder
        });

    } catch (error) {

        console.error("ORDER ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Order placement failed."
        });
    }
});

/* =========================================================
   GET ALL ORDERS
========================================================= */

app.get("/api/orders", (req, res) => {

    try {

        const orders = readFile(
            ORDERS_FILE,
            []
        );

        return res.status(200).json({

            success: true,

            count: orders.length,

            orders: orders
        });

    } catch (error) {

        console.error("ORDERS ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Could not load orders."
        });
    }
});

/* =========================================================
   GET ORDERS BY EMAIL
========================================================= */

app.get("/api/orders/user/:email", (req, res) => {

    try {

        const email = decodeURIComponent(
            req.params.email
        )
            .trim()
            .toLowerCase();

        const orders = readFile(
            ORDERS_FILE,
            []
        );

        const userOrders = orders.filter(
            function (order) {

                return String(order.email || "")
                    .trim()
                    .toLowerCase() === email;

            }
        );

        return res.status(200).json({

            success: true,

            count: userOrders.length,

            orders: userOrders
        });

    } catch (error) {

        console.error("USER ORDERS ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Could not load user orders."
        });
    }
});

/* =========================================================
   GET SINGLE ORDER
========================================================= */

app.get("/api/orders/:id", (req, res) => {

    try {

        const orders = readFile(
            ORDERS_FILE,
            []
        );

        const order = orders.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(req.params.id)
                );

            }
        );

        if (!order) {

            return res.status(404).json({

                success: false,

                message: "Order not found."
            });
        }

        return res.status(200).json({

            success: true,

            order: order
        });

    } catch (error) {

        console.error("SINGLE ORDER ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Could not find order."
        });
    }
});

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

app.put("/api/orders/:id/status", (req, res) => {

    try {

        const {
            status
        } = req.body;

        if (!status) {

            return res.status(400).json({

                success: false,

                message: "Status is required."
            });
        }

        const orders = readFile(
            ORDERS_FILE,
            []
        );

        const index = orders.findIndex(
            function (item) {

                return (
                    String(item.id) ===
                    String(req.params.id)
                );

            }
        );

        if (index === -1) {

            return res.status(404).json({

                success: false,

                message: "Order not found."
            });
        }

        orders[index].status = String(status);

        orders[index].updatedAt =
            new Date().toISOString();

        saveFile(
            ORDERS_FILE,
            orders
        );

        return res.status(200).json({

            success: true,

            message: "Order status updated.",

            order: orders[index]
        });

    } catch (error) {

        console.error("UPDATE ORDER ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Could not update order."
        });
    }
});

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

app.get("/api/admin/dashboard", (req, res) => {

    try {

        const users = readFile(
            USERS_FILE,
            []
        );

        const orders = readFile(
            ORDERS_FILE,
            []
        );

        const products = readFile(
            PRODUCTS_FILE,
            []
        );

        const totalSales = orders.reduce(
            function (sum, order) {

                return (
                    sum +
                    (Number(order.total) || 0)
                );

            },
            0
        );

        return res.status(200).json({

            success: true,

            statistics: {

                registeredMembers:
                    users.length,

                totalOrders:
                    orders.length,

                totalProducts:
                    products.length,

                totalSales:
                    totalSales
            }
        });

    } catch (error) {

        console.error("DASHBOARD ERROR:");
        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Could not load dashboard."
        });
    }
});

/* =========================================================
   UNKNOWN API
========================================================= */

app.use(function (req, res) {

    res.status(404).json({

        success: false,

        message: "GlowCart API endpoint not found.",

        path: req.originalUrl
    });

});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(function (error, req, res, next) {

    console.error("SERVER ERROR:");
    console.error(error);

    res.status(500).json({

        success: false,

        message: "Internal server error."
    });

});

/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    HOST,
    function () {

        console.log("");
        console.log("======================================");
        console.log("        GLOWCART BACKEND");
        console.log("======================================");
        console.log(
            "Server running on: http://" +
            HOST +
            ":" +
            PORT
        );
        console.log(
            "PORT:",
            PORT
        );
        console.log(
            "ADMIN_EMAIL:",
            process.env.ADMIN_EMAIL
                ? "configured"
                : "using default"
        );
        console.log(
            "ADMIN_PASSWORD:",
            process.env.ADMIN_PASSWORD
                ? "configured"
                : "using default"
        );
        console.log("======================================");
        console.log("");

    }
);
