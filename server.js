const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "2mb" }));

// =====================================================
// FILES
// =====================================================

const productsFile = path.join(__dirname, "products.json");
const ordersFile = path.join(__dirname, "place.json");
const usersFile = path.join(__dirname, "users.json");

// =====================================================
// CREATE FILE IF MISSING
// =====================================================

function createFileIfMissing(file, data) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(
            file,
            JSON.stringify(data, null, 2)
        );
    }
}

createFileIfMissing(productsFile, []);
createFileIfMissing(ordersFile, []);
createFileIfMissing(usersFile, []);

// =====================================================
// JSON HELPERS
// =====================================================

function readJson(file) {
    try {
        if (!fs.existsSync(file)) {
            return [];
        }

        const content = fs.readFileSync(
            file,
            "utf8"
        );

        if (!content.trim()) {
            return [];
        }

        const data = JSON.parse(content);

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error(
            "JSON READ ERROR:",
            file,
            error.message
        );

        return [];
    }
}

function writeJson(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2)
    );
}

// =====================================================
// HOME / HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "GlowCart backend is running!",
        status: "online"
    });

});

// =====================================================
// HEALTH
// =====================================================

app.get("/api/health", (req, res) => {

    res.status(200).json({
        success: true,
        message: "GlowCart API is healthy"
    });

});

// =====================================================
// EMAILJS CONFIG
// =====================================================

app.get("/api/emailjs-config", (req, res) => {

    res.json({
        success: true,

        publicKey:
            process.env.EMAILJS_PUBLIC_KEY || "",

        serviceId:
            process.env.EMAILJS_SERVICE_ID || "",

        welcomeTemplateId:
            process.env.EMAILJS_WELCOME_TEMPLATE_ID ||
            "template_giqmpm9",

        orderTemplateId:
            process.env.EMAILJS_ORDER_TEMPLATE_ID ||
            "template_ykzf36"
    });

});

// =====================================================
// PRODUCTS
// =====================================================

app.get("/api/products", (req, res) => {

    try {

        const products =
            readJson(productsFile);

        res.status(200).json(products);

    } catch (error) {

        console.error(
            "Products error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to load products."
        });

    }

});

// =====================================================
// SINGLE PRODUCT
// =====================================================

app.get("/api/products/:id", (req, res) => {

    try {

        const products =
            readJson(productsFile);

        const product =
            products.find(
                p =>
                    String(p.id) ===
                    String(req.params.id)
            );

        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }

        res.json(product);

    } catch (error) {

        console.error(
            "Single product error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to load product."
        });

    }

});

// =====================================================
// REGISTER
// =====================================================

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
                message:
                    "Please fill all required fields."
            });

        }

        if (!/^\d{10}$/.test(String(mobile))) {

            return res.status(400).json({
                success: false,
                message:
                    "Enter a valid 10-digit mobile number."
            });

        }

        if (!/^\d{6}$/.test(String(pincode))) {

            return res.status(400).json({
                success: false,
                message:
                    "Enter a valid 6-digit pincode."
            });

        }

        const users =
            readJson(usersFile);

        const emailLower =
            String(email)
                .trim()
                .toLowerCase();

        const existing =
            users.find(
                u =>
                    String(u.email)
                        .toLowerCase() ===
                    emailLower
            );

        if (existing) {

            return res.status(409).json({
                success: false,
                message:
                    "Email is already registered."
            });

        }

        const newUser = {

            id:
                "USER" +
                Date.now(),

            name:
                String(name).trim(),

            email:
                emailLower,

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
                new Date().toISOString()

        };

        users.push(newUser);

        writeJson(
            usersFile,
            users
        );

        console.log(
            "USER REGISTERED:",
            newUser.email
        );

        res.status(201).json({

            success: true,

            message:
                "Registration successful!",

            emailSent: false,

            user: {

                id: newUser.id,

                name: newUser.name,

                email: newUser.email,

                mobile: newUser.mobile,

                address: newUser.address,

                pincode: newUser.pincode,

                address2: newUser.address2,

                pincode2: newUser.pincode2

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
                "Registration failed. Please try again."

        });

    }

});

// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }

        const users =
            readJson(usersFile);

        const emailLower =
            String(email)
                .trim()
                .toLowerCase();

        const user =
            users.find(
                u =>
                    String(u.email)
                        .toLowerCase() ===
                    emailLower &&
                    String(u.password) ===
                    String(password)
            );

        if (!user) {

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

                id: user.id,

                name: user.name,

                email: user.email,

                mobile: user.mobile,

                address: user.address,

                pincode: user.pincode,

                address2:
                    user.address2 || "",

                pincode2:
                    user.pincode2 || ""

            }

        });

    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Login failed."

        });

    }

});

// =====================================================
// PLACE ORDER
// IMPORTANT:
// SAVE ORDER FIRST.
// NO EMAIL SERVICE HERE.
// =====================================================

app.post("/api/orders", (req, res) => {

    try {

        const order =
            req.body;

        console.log(
            "================================"
        );

        console.log(
            "NEW ORDER RECEIVED"
        );

        console.log(
            order
        );

        console.log(
            "================================"
        );

        // -------------------------------
        // BASIC VALIDATION
        // -------------------------------

        if (!order) {

            return res.status(400).json({

                success: false,

                message:
                    "Order data is missing."

            });

        }

        if (!order.email) {

            return res.status(400).json({

                success: false,

                message:
                    "Customer email is required."

            });

        }

        if (
            !Array.isArray(order.items) ||
            order.items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Your cart is empty."

            });

        }

        if (!order.address) {

            return res.status(400).json({

                success: false,

                message:
                    "Delivery address is required."

            });

        }

        if (
            !order.pincode ||
            !/^\d{6}$/.test(
                String(order.pincode)
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Valid 6-digit pincode is required."

            });

        }

        // -------------------------------
        // ORDER ID
        // -------------------------------

        const orderId =
            order.orderId ||
            order.id ||
            "GC" + Date.now();

        // -------------------------------
        // DATE
        // -------------------------------

        const orderDate =
            order.date ||
            new Date().toLocaleString(
                "en-IN"
            );

        // -------------------------------
        // CALCULATE SUBTOTAL
        // SUPPORT qty AND quantity
        // -------------------------------

        let subtotal = 0;

        order.items.forEach(item => {

            const price =
                Number(item.price) || 0;

            const quantity =
                Number(
                    item.qty ??
                    item.quantity ??
                    1
                );

            subtotal +=
                price *
                Math.max(
                    1,
                    quantity
                );

        });

        subtotal =
            Number(
                subtotal.toFixed(2)
            );

        // -------------------------------
        // GST
        // -------------------------------

        const gstRate = 18;

        const gst =
            Number(
                (
                    subtotal *
                    gstRate /
                    100
                ).toFixed(2)
            );

        // -------------------------------
        // TOTAL
        // -------------------------------

        const total =
            Number(
                (
                    subtotal +
                    gst
                ).toFixed(2)
            );

        // -------------------------------
        // FINAL ORDER
        // -------------------------------

        const savedOrder = {

            id:
                orderId,

            orderId:
                orderId,

            date:
                orderDate,

            createdAt:
                new Date().toISOString(),

            name:
                order.name || "",

            email:
                String(order.email)
                    .trim()
                    .toLowerCase(),

            mobile:
                order.mobile || "",

            address:
                order.address || "",

            pincode:
                order.pincode || "",

            items:
                order.items,

            subtotal:
                subtotal,

            gst:
                gst,

            gstRate:
                gstRate,

            total:
                total,

            paymentMethod:
                order.paymentMethod ||
                "Cash on Delivery",

            paymentDetails:
                order.paymentDetails ||
                "",

            status:
                "Order Placed"

        };

        // -------------------------------
        // READ ORDERS
        // -------------------------------

        const orders =
            readJson(ordersFile);

        // -------------------------------
        // SAVE ORDER
        // -------------------------------

        orders.push(
            savedOrder
        );

        writeJson(
            ordersFile,
            orders
        );

        console.log(
            "ORDER SAVED SUCCESSFULLY:",
            savedOrder.orderId
        );

        // -------------------------------
        // RETURN SUCCESS IMMEDIATELY
        // -------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Order placed successfully!",

            emailSent:
                false,

            order:
                savedOrder

        });

    } catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "PLACE ORDER ERROR:"
        );

        console.error(
            error
        );

        console.error(
            "================================"
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to place order. Please try again."

        });

    }

});

// =====================================================
// GET ALL ORDERS
// =====================================================

app.get("/api/orders", (req, res) => {

    try {

        const orders =
            readJson(ordersFile);

        res.json({

            success: true,

            orders:
                orders

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message:
                "Unable to load orders."

        });

    }

});

// =====================================================
// SERVER
// =====================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================"
        );

        console.log(
            "GlowCart Backend Started"
        );

        console.log(
            "Port:",
            PORT
        );

        console.log(
            "================================"
        );

    }
);
