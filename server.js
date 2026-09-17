const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ===============================
// FILE PATHS
// ===============================

const productsFile = path.join(__dirname, "products.json");
const ordersFile = path.join(__dirname, "place.json");
const usersFile = path.join(__dirname, "users.json");

// Create files if they don't exist
function createFileIfMissing(file, defaultData) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
    }
}

createFileIfMissing(productsFile, []);
createFileIfMissing(ordersFile, []);
createFileIfMissing(usersFile, []);

// ===============================
// FILE HELPERS
// ===============================

function readJson(file) {
    try {
        const data = fs.readFileSync(file, "utf8");

        if (!data.trim()) {
            return [];
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading file:", file, error);
        return [];
    }
}

function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===============================
// RESEND EMAIL FUNCTION
// ===============================

async function sendEmail(to, subject, html) {

    try {

        if (!process.env.RESEND_API_KEY) {

            console.log("RESEND_API_KEY is not configured.");

            return {
                success: false,
                message: "Email service is not configured."
            };
        }

        const fromEmail =
            process.env.EMAIL_FROM || "onboarding@resend.dev";

        console.log("--------------------------------");
        console.log("Trying to send email...");
        console.log("To:", to);
        console.log("From:", fromEmail);

        const response = await fetch(
            "https://api.resend.com/emails",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    from: `GlowCart <${fromEmail}>`,
                    to: [to],
                    subject: subject,
                    html: html
                })
            }
        );

        const data = await response.json();

        console.log("Resend HTTP status:", response.status);
        console.log("Resend response:", data);

        if (!response.ok) {

            console.error(
                "RESEND EMAIL FAILED:",
                data
            );

            return {
                success: false,
                data: data
            };
        }

        console.log(
            "EMAIL SENT SUCCESSFULLY:",
            to
        );

        return {
            success: true,
            data: data
        };

    } catch (error) {

        console.error(
            "Email sending error:",
            error
        );

        return {
            success: false,
            error: error.message
        };
    }
}

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "GlowCart backend is running!",
        status: "online"
    });

});

// ===============================
// PRODUCTS
// ===============================

app.get("/api/products", (req, res) => {

    const products = readJson(productsFile);

    res.json(products);

});

// ===============================
// SINGLE PRODUCT
// ===============================

app.get("/api/products/:id", (req, res) => {

    const products = readJson(productsFile);

    const product = products.find(
        p => String(p.id) === String(req.params.id)
    );

    if (!product) {

        return res.status(404).json({
            success: false,
            message: "Product not found"
        });

    }

    res.json(product);

});

// ===============================
// REGISTER
// ===============================

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
            pincode2
        } = req.body;

        // -------------------------------
        // VALIDATION
        // -------------------------------

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
                message: "Please fill all required fields."
            });

        }

        // -------------------------------
        // READ USERS
        // -------------------------------

        const users = readJson(usersFile);

        // -------------------------------
        // CHECK EXISTING EMAIL
        // -------------------------------

        const existingUser = users.find(
            user =>
                user.email.toLowerCase() ===
                email.toLowerCase()
        );

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });

        }

        // -------------------------------
        // CREATE USER
        // -------------------------------

        const newUser = {

            id: "USER" + Date.now(),

            name: name,
            email: email,
            mobile: mobile,
            password: password,

            address: address,
            pincode: pincode,

            address2: address2 || "",
            pincode2: pincode2 || "",

            registeredAt: new Date().toISOString()
        };

        // -------------------------------
        // SAVE USER FIRST
        // -------------------------------

        users.push(newUser);

        writeJson(usersFile, users);

        console.log("--------------------------------");
        console.log("NEW USER REGISTERED");
        console.log("Name:", name);
        console.log("Email:", email);
        console.log("Mobile:", mobile);
        console.log("--------------------------------");

        // ==================================================
        // SEND REGISTRATION EMAIL
        // ==================================================

        const registrationEmail = await sendEmail(

            email,

            "Welcome to GlowCart - Registration Successful",

            `
            <div style="
                font-family:Arial,sans-serif;
                max-width:600px;
                margin:auto;
                padding:30px;
                border-radius:15px;
                background:#fff0f7;
                border:1px solid #f3b5d2;
            ">

                <h1 style="
                    color:#d63384;
                    text-align:center;
                ">
                    ✨ Welcome to GlowCart ✨
                </h1>

                <p>
                    Hello <strong>${name}</strong>,
                </p>

                <p>
                    Your GlowCart account has been
                    registered successfully.
                </p>

                <div style="
                    background:white;
                    padding:20px;
                    border-radius:10px;
                ">

                    <p>
                        <strong>Name:</strong> ${name}
                    </p>

                    <p>
                        <strong>Email:</strong> ${email}
                    </p>

                    <p>
                        <strong>Mobile:</strong> ${mobile}
                    </p>

                </div>

                <p style="margin-top:20px;">
                    You can now login to GlowCart
                    and start shopping.
                </p>

                <p style="
                    text-align:center;
                    color:#d63384;
                    font-weight:bold;
                ">
                    Thank you for choosing GlowCart 💖
                </p>

            </div>
            `
        );

        // ==================================================
        // IMPORTANT:
        // EMAIL FAILURE MUST NOT CANCEL REGISTRATION
        // ==================================================

        if (!registrationEmail.success) {

            console.log(
                "REGISTRATION EMAIL FAILED, BUT USER REGISTRATION SUCCESSFUL."
            );

            console.log(
                "Reason:",
                registrationEmail.data ||
                registrationEmail.error ||
                registrationEmail.message
            );

        } else {

            console.log(
                "REGISTRATION EMAIL SENT SUCCESSFULLY."
            );

        }

        // ==================================================
        // ALWAYS RETURN SUCCESS AFTER USER IS SAVED
        // ==================================================

        return res.status(201).json({

            success: true,

            message:
                "Registration successful! Your GlowCart account has been created.",

            emailSent:
                registrationEmail.success,

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

                message:
                    "Email and password are required."

            });

        }

        const users = readJson(usersFile);

        const user = users.find(

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

                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                pincode: user.pincode,
                address2: user.address2,
                pincode2: user.pincode2

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

// ===============================
// PLACE ORDER
// ===============================

app.post("/api/orders", async (req, res) => {

    try {

        const order = req.body;

        console.log("--------------------------------");
        console.log("New order:", order);
        console.log("--------------------------------");

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

        // -------------------------------
        // ENSURE ORDER ID
        // -------------------------------

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

        // -------------------------------
        // CALCULATE TOTALS IF NEEDED
        // -------------------------------

        let subtotal = Number(
            order.subtotal || 0
        );

        if (!subtotal) {

            subtotal = order.items.reduce(

                (sum, item) => {

                    const price =
                        Number(item.price) || 0;

                    const quantity =
                        Number(item.quantity) || 1;

                    return sum +
                        (price * quantity);

                },

                0

            );

        }

        const gst =
            Number(order.gst || 0);

        const total =
            Number(
                order.total ||
                (subtotal + gst)
            );

        // -------------------------------
        // SAVE ORDER
        // -------------------------------

        const orders =
            readJson(ordersFile);

        orders.push({

            ...order,

            subtotal:
                Number(subtotal.toFixed(2)),

            gst:
                Number(gst.toFixed(2)),

            total:
                Number(total.toFixed(2)),

            status:
                order.status || "Order Placed",

            createdAt:
                new Date().toISOString()

        });

        writeJson(
            ordersFile,
            orders
        );

        console.log(
            "ORDER SAVED:",
            order.orderId
        );

        // ==================================================
        // PAYMENT METHOD
        // ==================================================

        const paymentMethod =
            order.paymentMethod ||
            "Not specified";

        // ==================================================
        // ORDER ITEMS HTML
        // ==================================================

        let itemsHtml = "";

        order.items.forEach(item => {

            const quantity =
                Number(item.quantity) || 1;

            const price =
                Number(item.price) || 0;

            const itemTotal =
                price * quantity;

            itemsHtml += `

                <tr>

                    <td style="
                        padding:10px;
                        border-bottom:1px solid #eee;
                    ">
                        ${item.name || "Product"}
                    </td>

                    <td style="
                        padding:10px;
                        border-bottom:1px solid #eee;
                        text-align:center;
                    ">
                        ${quantity}
                    </td>

                    <td style="
                        padding:10px;
                        border-bottom:1px solid #eee;
                        text-align:right;
                    ">
                        ₹${itemTotal.toFixed(2)}
                    </td>

                </tr>

            `;

        });

        // ==================================================
        // ORDER EMAIL
        // ==================================================

        const orderEmail = await sendEmail(

            order.email,

            `GlowCart Order Confirmed - ${order.orderId}`,

            `

            <div style="
                font-family:Arial,sans-serif;
                max-width:700px;
                margin:auto;
                padding:25px;
                background:#fff7fb;
                border-radius:15px;
            ">

                <h1 style="
                    color:#d63384;
                    text-align:center;
                ">
                    🛍️ GlowCart
                </h1>

                <h2 style="
                    color:#333;
                ">
                    Order Confirmed! 🎉
                </h2>

                <p>
                    Hello
                    <strong>
                        ${order.name || "Customer"}
                    </strong>,
                </p>

                <p>
                    Your order has been successfully
                    placed.
                </p>

                <div style="
                    background:white;
                    padding:15px;
                    border-radius:10px;
                    margin:15px 0;
                ">

                    <p>
                        <strong>Order ID:</strong>
                        ${order.orderId}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${order.date}
                    </p>

                    <p>
                        <strong>Payment:</strong>
                        ${paymentMethod}
                    </p>

                </div>

                <h3>
                    Order Items
                </h3>

                <table style="
                    width:100%;
                    border-collapse:collapse;
                    background:white;
                ">

                    <thead>

                        <tr>

                            <th style="
                                padding:10px;
                                text-align:left;
                            ">
                                Product
                            </th>

                            <th style="
                                padding:10px;
                                text-align:center;
                            ">
                                Qty
                            </th>

                            <th style="
                                padding:10px;
                                text-align:right;
                            ">
                                Amount
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${itemsHtml}

                    </tbody>

                </table>

                <div style="
                    background:white;
                    padding:20px;
                    margin-top:20px;
                    border-radius:10px;
                ">

                    <p style="
                        display:flex;
                        justify-content:space-between;
                    ">
                        <strong>Subtotal:</strong>
                        ₹${subtotal.toFixed(2)}
                    </p>

                    <p style="
                        display:flex;
                        justify-content:space-between;
                    ">
                        <strong>GST (18%):</strong>
                        ₹${gst.toFixed(2)}
                    </p>

                    <hr>

                    <h2 style="
                        color:#d63384;
                    ">
                        Total: ₹${total.toFixed(2)}
                    </h2>

                </div>

                <div style="
                    background:#fff0f7;
                    padding:15px;
                    border-radius:10px;
                    margin-top:20px;
                ">

                    <p>
                        <strong>Delivery Address:</strong>
                    </p>

                    <p>
                        ${order.address || ""}
                    </p>

                    <p>
                        Pincode:
                        ${order.pincode || ""}
                    </p>

                </div>

                <p style="
                    text-align:center;
                    margin-top:25px;
                    color:#d63384;
                    font-weight:bold;
                ">
                    Thank you for shopping with GlowCart 💖
                </p>

            </div>

            `

        );

        // ==================================================
        // ORDER EMAIL FAILURE DOES NOT CANCEL ORDER
        // ==================================================

        if (!orderEmail.success) {

            console.log(
                "ORDER EMAIL FAILED, BUT ORDER WAS SAVED SUCCESSFULLY."
            );

        } else {

            console.log(
                "ORDER EMAIL SENT SUCCESSFULLY:",
                order.email
            );

        }

        // ==================================================
        // ALWAYS RETURN ORDER SUCCESS
        // ==================================================

        return res.status(201).json({

            success: true,

            message:
                "Order placed successfully!",

            emailSent:
                orderEmail.success,

            order: {

                ...order,

                subtotal:
                    Number(subtotal.toFixed(2)),

                gst:
                    Number(gst.toFixed(2)),

                total:
                    Number(total.toFixed(2))

            }

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

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log(
        `GlowCart server running on port ${PORT}`
    );

    console.log(
        `API available at: http://localhost:${PORT}`
    );

});
