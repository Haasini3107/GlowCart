const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json({ limit: "5mb" }));

// =====================================================
// FILE PATHS
// =====================================================

const PRODUCTS_FILE = path.join(
    __dirname,
    "products.json"
);

const USERS_FILE = path.join(
    __dirname,
    "users.json"
);

const ORDERS_FILE = path.join(
    __dirname,
    "place.json"
);

// =====================================================
// CREATE FILES IF THEY DON'T EXIST
// =====================================================

function createFile(file, defaultData) {

    if (!fs.existsSync(file)) {

        fs.writeFileSync(
            file,
            JSON.stringify(
                defaultData,
                null,
                2
            )
        );

    }

}

createFile(PRODUCTS_FILE, []);
createFile(USERS_FILE, []);
createFile(ORDERS_FILE, []);

// =====================================================
// READ JSON
// =====================================================

function readJson(file) {

    try {

        if (!fs.existsSync(file)) {
            return [];
        }

        const text =
            fs.readFileSync(
                file,
                "utf8"
            );

        if (!text.trim()) {
            return [];
        }

        const data =
            JSON.parse(text);

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "READ JSON ERROR:",
            error.message
        );

        return [];

    }

}

// =====================================================
// WRITE JSON
// =====================================================

function writeJson(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        )
    );

}

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "GlowCart backend is running",

        status:
            "online"

    });

});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "GlowCart API is healthy",

            status:
                "online"

        });

    }
);

// =====================================================
// EMAILJS CONFIG
// =====================================================

app.get(
    "/api/emailjs-config",
    (req, res) => {

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

    }
);

// =====================================================
// PRODUCTS
// =====================================================

app.get(
    "/api/products",
    (req, res) => {

        try {

            const products =
                readJson(PRODUCTS_FILE);

            res.status(200).json(
                products
            );

        } catch (error) {

            console.error(
                "PRODUCT ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to load products."

            });

        }

    }
);

// =====================================================
// SINGLE PRODUCT
// =====================================================

app.get(
    "/api/products/:id",
    (req, res) => {

        const products =
            readJson(PRODUCTS_FILE);

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found."

            });

        }

        res.json(product);

    }
);

// =====================================================
// REGISTER
// =====================================================

app.post(
    "/api/register",
    (req, res) => {

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

            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

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

            if (
                !/^\d{10}$/.test(
                    String(mobile)
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid 10-digit mobile number."

                });

            }

            if (
                !/^\d{6}$/.test(
                    String(pincode)
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Enter a valid 6-digit pincode."

                });

            }

            // -----------------------------------------
            // USERS
            // -----------------------------------------

            const users =
                readJson(USERS_FILE);

            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const alreadyExists =
                users.find(
                    user =>
                        String(user.email)
                            .toLowerCase() ===
                        cleanEmail
                );

            if (alreadyExists) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Email is already registered."

                });

            }

            // -----------------------------------------
            // NEW USER
            // -----------------------------------------

            const newUser = {

                id:
                    "USER" +
                    Date.now(),

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
                    new Date().toISOString()

            };

            users.push(
                newUser
            );

            writeJson(
                USERS_FILE,
                users
            );

            console.log(
                "REGISTERED:",
                newUser.email
            );

            res.status(201).json({

                success: true,

                message:
                    "Registration successful!",

                user: {

                    id:
                        newUser.id,

                    name:
                        newUser.name,

                    email:
                        newUser.email,

                    mobile:
                        newUser.mobile,

                    address:
                        newUser.address,

                    pincode:
                        newUser.pincode,

                    address2:
                        newUser.address2,

                    pincode2:
                        newUser.pincode2

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

// =====================================================
// LOGIN
// =====================================================

app.post(
    "/api/login",
    (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required."

                });

            }

            const users =
                readJson(USERS_FILE);

            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const user =
                users.find(
                    item =>
                        String(item.email)
                            .toLowerCase() ===
                        cleanEmail &&
                        String(item.password) ===
                        String(password)
                );

            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }

            res.status(200).json({

                success: true,

                message:
                    "Login successful!",

                user: {

                    id:
                        user.id,

                    name:
                        user.name,

                    email:
                        user.email,

                    mobile:
                        user.mobile,

                    address:
                        user.address,

                    pincode:
                        user.pincode,

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

    }
);

// =====================================================
// PLACE ORDER
// =====================================================

app.post(
    "/api/orders",
    (req, res) => {

        try {

            console.log(
                "================================"
            );

            console.log(
                "NEW GLOWCART ORDER"
            );

            console.log(
                "================================"
            );

            const body =
                req.body || {};

            // -----------------------------------------
            // BASIC VALIDATION
            // -----------------------------------------

            if (!body.email) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Customer email is required."

                });

            }

            if (
                !Array.isArray(body.items) ||
                body.items.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your cart is empty."

                });

            }

            if (!body.address) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivery address is required."

                });

            }

            if (
                !body.pincode ||
                !/^\d{6}$/.test(
                    String(body.pincode)
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Valid 6-digit pincode is required."

                });

            }

            // -----------------------------------------
            // ORDER ID
            // -----------------------------------------

            const orderId =
                body.orderId ||
                body.id ||
                "GC" +
                Date.now();

            // -----------------------------------------
            // DATE
            // -----------------------------------------

            const orderDate =
                body.date ||
                new Date().toLocaleString(
                    "en-IN"
                );

            // -----------------------------------------
            // CALCULATE SUBTOTAL
            // -----------------------------------------

            let subtotal = 0;

            const cleanItems =
                body.items.map(
                    item => {

                        const price =
                            Number(
                                item.price
                            ) || 0;

                        const qty =
                            Number(
                                item.qty ??
                                item.quantity ??
                                1
                            );

                        const safeQty =
                            qty > 0
                                ? qty
                                : 1;

                        const itemTotal =
                            price *
                            safeQty;

                        subtotal +=
                            itemTotal;

                        return {

                            id:
                                item.id,

                            name:
                                item.name ||
                                "Product",

                            price:
                                price,

                            qty:
                                safeQty,

                            quantity:
                                safeQty,

                            image:
                                item.image ||
                                ""

                        };

                    }
                );

            // -----------------------------------------
            // ROUND SUBTOTAL
            // -----------------------------------------

            subtotal =
                Number(
                    subtotal.toFixed(2)
                );

            // -----------------------------------------
            // GST 18%
            // -----------------------------------------

            const gstRate =
                18;

            const gst =
                Number(
                    (
                        subtotal *
                        gstRate /
                        100
                    ).toFixed(2)
                );

            // -----------------------------------------
            // GRAND TOTAL
            // -----------------------------------------

            const total =
                Number(
                    (
                        subtotal +
                        gst
                    ).toFixed(2)
                );

            // -----------------------------------------
            // FINAL ORDER
            // -----------------------------------------

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
                    body.name || "",

                email:
                    String(body.email)
                        .trim()
                        .toLowerCase(),

                mobile:
                    body.mobile || "",

                address:
                    body.address || "",

                pincode:
                    body.pincode || "",

                items:
                    cleanItems,

                subtotal:
                    subtotal,

                gst:
                    gst,

                gstRate:
                    gstRate,

                total:
                    total,

                paymentMethod:
                    body.paymentMethod ||
                    "Cash on Delivery",

                paymentDetails:
                    body.paymentDetails ||
                    "",

                status:
                    "Order Placed"

            };

            // -----------------------------------------
            // LOAD EXISTING ORDERS
            // -----------------------------------------

            const orders =
                readJson(ORDERS_FILE);

            // -----------------------------------------
            // SAVE ORDER
            // -----------------------------------------

            orders.push(
                savedOrder
            );

            writeJson(
                ORDERS_FILE,
                orders
            );

            console.log(
                "ORDER SAVED"
            );

            console.log(
                "Order ID:",
                savedOrder.orderId
            );

            console.log(
                "Subtotal:",
                savedOrder.subtotal
            );

            console.log(
                "GST:",
                savedOrder.gst
            );

            console.log(
                "Total:",
                savedOrder.total
            );

            console.log(
                "================================"
            );

            // -----------------------------------------
            // IMPORTANT
            //
            // EMAILJS IS NOT USED HERE.
            //
            // FRONTEND WILL SEND EMAILJS EMAIL
            // AFTER THIS SUCCESS RESPONSE.
            //
            // THIS MEANS EMAIL FAILURE CANNOT
            // BREAK ORDER PLACEMENT.
            // -----------------------------------------

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
                "PLACE ORDER ERROR"
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

    }
);

// =====================================================
// GET ORDERS
// =====================================================

app.get(
    "/api/orders",
    (req, res) => {

        try {

            const orders =
                readJson(ORDERS_FILE);

            res.status(200).json({

                success: true,

                orders:
                    orders

            });

        } catch (error) {

            console.error(
                "GET ORDERS ERROR:",
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

// =====================================================
// GET ORDERS FOR EMAIL
// =====================================================

app.get(
    "/api/orders/:email",
    (req, res) => {

        try {

            const orders =
                readJson(ORDERS_FILE);

            const email =
                decodeURIComponent(
                    req.params.email
                )
                .trim()
                .toLowerCase();

            const userOrders =
                orders.filter(
                    order =>
                        String(
                            order.email
                        )
                        .toLowerCase() ===
                        email
                );

            res.json({

                success: true,

                orders:
                    userOrders

            });

        } catch (error) {

            res.status(500).json({

                success: false,

                message:
                    "Unable to load orders."

            });

        }

    }
);

// =====================================================
// 404
// =====================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "API endpoint not found."

        });

    }
);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Internal server error."

        });

    }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "       GLOWCART BACKEND RUNNING"
        );

        console.log(
            "========================================"
        );

        console.log(
            "Port:",
            PORT
        );

        console.log(
            "Environment:",
            process.env.NODE_ENV ||
            "production"
        );

        console.log(
            "========================================"
        );

    }
);
