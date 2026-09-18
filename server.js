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

app.use(express.json());

// =====================================================
// FILE PATHS
// =====================================================

const productsFile = path.join(__dirname, "products.json");
const ordersFile = path.join(__dirname, "place.json");
const usersFile = path.join(__dirname, "users.json");

// =====================================================
// CREATE FILES IF MISSING
// =====================================================

function createFileIfMissing(file, defaultData) {

    if (!fs.existsSync(file)) {

        fs.writeFileSync(
            file,
            JSON.stringify(defaultData, null, 2)
        );

    }

}

createFileIfMissing(productsFile, []);
createFileIfMissing(ordersFile, []);
createFileIfMissing(usersFile, []);

// =====================================================
// FILE HELPERS
// =====================================================

function readJson(file) {

    try {

        const data =
            fs.readFileSync(file, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Error reading file:",
            file,
            error
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
// EMAILJS CONFIGURATION
// =====================================================
// These values come from Render Environment Variables.
//
// EMAILJS_SERVICE_ID
// EMAILJS_PUBLIC_KEY
// EMAILJS_WELCOME_TEMPLATE_ID
// EMAILJS_ORDER_TEMPLATE_ID
//
// They are sent to index.html through this endpoint.
// No EmailJS private key is exposed.
// =====================================================

app.get("/api/emailjs-config", (req, res) => {

    const serviceId =
        process.env.EMAILJS_SERVICE_ID || "";

    const publicKey =
        process.env.EMAILJS_PUBLIC_KEY || "";

    const welcomeTemplateId =
        process.env.EMAILJS_WELCOME_TEMPLATE_ID || "";

    const orderTemplateId =
        process.env.EMAILJS_ORDER_TEMPLATE_ID || "";

    if (
        !serviceId ||
        !publicKey ||
        !welcomeTemplateId ||
        !orderTemplateId
    ) {

        return res.status(500).json({

            success: false,

            message:
                "EmailJS environment variables are not configured in Render."

        });

    }

    return res.json({

        success: true,

        serviceId: serviceId,

        publicKey: publicKey,

        welcomeTemplateId:
            welcomeTemplateId,

        orderTemplateId:
            orderTemplateId

    });

});

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "GlowCart backend is running!",

        status: "online"

    });

});

// =====================================================
// PRODUCTS
// =====================================================

app.get("/api/products", (req, res) => {

    const products =
        readJson(productsFile);

    res.json(products);

});

// =====================================================
// SINGLE PRODUCT
// =====================================================

app.get("/api/products/:id", (req, res) => {

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

            message:
                "Product not found"

        });

    }

    res.json(product);

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

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

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

        // ---------------------------------------------
        // READ USERS
        // ---------------------------------------------

        const users =
            readJson(usersFile);

        // ---------------------------------------------
        // CHECK EXISTING EMAIL
        // ---------------------------------------------

        const existingUser =
            users.find(
                user =>
                    user.email.toLowerCase() ===
                    email.toLowerCase()
            );

        if (existingUser) {

            return res.status(409).json({

                success: false,

                message:
                    "Email is already registered."

            });

        }

        // ---------------------------------------------
        // CREATE USER
        // ---------------------------------------------

        const newUser = {

            id:
                "USER" + Date.now(),

            name:
                name,

            email:
                email.toLowerCase(),

            mobile:
                mobile,

            password:
                password,

            address:
                address,

            pincode:
                pincode,

            address2:
                address2 || "",

            pincode2:
                pincode2 || "",

            registeredAt:
                new Date().toISOString()

        };

        // ---------------------------------------------
        // SAVE USER
        // ---------------------------------------------

        users.push(newUser);

        writeJson(
            usersFile,
            users
        );

        console.log("--------------------------------");
        console.log("NEW USER REGISTERED");
        console.log("Name:", name);
        console.log("Email:", email);
        console.log("Mobile:", mobile);
        console.log("--------------------------------");

        // ---------------------------------------------
        // RETURN SUCCESS
        // ---------------------------------------------
        // EmailJS is now handled by index.html.
        // The backend only creates the account.
        // ---------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Registration successful! Your GlowCart account has been created.",

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
            "Registration error:",
            error
        );

        return res.status(500).json({

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

        const user =
            users.find(

                u =>
                    u.email.toLowerCase() ===
                        email.toLowerCase() &&
                    u.password === password

            );

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }

        return res.json({

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
                    user.address2,

                pincode2:
                    user.pincode2

            }

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Login failed."

        });

    }

});

// =====================================================
// PLACE ORDER
// =====================================================

app.post("/api/orders", (req, res) => {

    try {

        const order =
            req.body;

        console.log("--------------------------------");
        console.log("NEW ORDER");
        console.log(order);
        console.log("--------------------------------");

        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (
            !order ||
            !order.email ||
            !order.items ||
            !order.items.length
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid order details."

            });

        }

        // ---------------------------------------------
        // ORDER ID
        // ---------------------------------------------

        if (!order.id) {

            order.id =
                "GC" + Date.now();

        }

        if (!order.orderId) {

            order.orderId =
                order.id;

        }

        if (!order.date) {

            order.date =
                new Date().toLocaleString();

        }

        // ---------------------------------------------
        // SUBTOTAL
        // ---------------------------------------------

        let subtotal =
            Number(order.subtotal || 0);

        if (!subtotal) {

            subtotal =
                order.items.reduce(

                    (sum, item) => {

                        const price =
                            Number(item.price) || 0;

                        const quantity =
                            Number(
                                item.qty ||
                                item.quantity ||
                                1
                            );

                        return sum +
                            (price * quantity);

                    },

                    0

                );

        }

        // ---------------------------------------------
        // GST
        // ---------------------------------------------

        let gst =
            Number(order.gst || 0);

        if (!gst) {

            gst =
                subtotal * 0.18;

        }

        // ---------------------------------------------
        // TOTAL
        // ---------------------------------------------

        const total =
            Number(
                order.total ||
                (subtotal + gst)
            );

        // ---------------------------------------------
        // SAVE ORDER
        // ---------------------------------------------

        const orders =
            readJson(ordersFile);

        const savedOrder = {

            ...order,

            subtotal:
                Number(
                    subtotal.toFixed(2)
                ),

            gst:
                Number(
                    gst.toFixed(2)
                ),

            total:
                Number(
                    total.toFixed(2)
                ),

            gstRate:
                Number(
                    order.gstRate || 18
                ),

            status:
                order.status ||
                "Order Placed",

            createdAt:
                new Date().toISOString()

        };

        orders.push(savedOrder);

        writeJson(
            ordersFile,
            orders
        );

        console.log(
            "ORDER SAVED:",
            savedOrder.orderId
        );

        // ---------------------------------------------
        // RETURN ORDER
        // ---------------------------------------------
        // EmailJS sends the email from index.html
        // after this successful response.
        // ---------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Order placed successfully!",

            order:
                savedOrder

        });

    } catch (error) {

        console.error(
            "Order error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to place order."

        });

    }

});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log(
        `GlowCart server running on port ${PORT}`
    );

    console.log(
        `API available on port ${PORT}`
    );

});
