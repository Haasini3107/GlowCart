const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

/* =========================
   CORS
========================= */

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

/* =========================
   EMAIL FUNCTION
========================= */

async function sendEmail(to, subject, html) {

    try {

        if (!process.env.RESEND_API_KEY) {

            console.error("RESEND_API_KEY is missing.");

            return {
                success: false,
                message: "RESEND_API_KEY is not configured."
            };
        }

        const fromEmail =
            process.env.EMAIL_FROM || "onboarding@resend.dev";

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

                    "Content-Type":
                        "application/json"
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

            console.error("RESEND EMAIL FAILED:", data);

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
            "EMAIL SENDING ERROR:",
            error
        );

        return {
            success: false,
            error: error.message
        };
    }
}

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "GlowCart backend is running!",
        status: "online"
    });

});

/* =========================
   EMAIL TEST
========================= */

app.post("/api/test-email", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {

            return res.status(400).json({
                success: false,
                message: "Email is required."
            });

        }

        const result = await sendEmail(
            email,
            "GlowCart Email Test 💗",
            `
            <div style="
                font-family:Arial,sans-serif;
                max-width:600px;
                margin:auto;
                padding:30px;
                border:1px solid #eee;
                border-radius:15px;
            ">

                <h1 style="color:#d41483;">
                    GlowCart Email Test 💗
                </h1>

                <p>
                    Congratulations!
                </p>

                <p>
                    Your GlowCart email system is working successfully.
                </p>

                <p>
                    This is a test email from your GlowCart backend.
                </p>

            </div>
            `
        );

        if (!result.success) {

            return res.status(500).json({
                success: false,
                message: "Email could not be sent.",
                error: result.data || result.error || result.message
            });
        }

        res.json({
            success: true,
            message: "Test email sent successfully.",
            emailId: result.data?.id || null
        });

    } catch (error) {

        console.error("Test email error:", error);

        res.status(500).json({
            success: false,
            message: "Test email failed.",
            error: error.message
        });

    }

});

/* =========================
   PRODUCTS
========================= */

app.get("/api/products", (req, res) => {

    try {

        const filePath =
            path.join(__dirname, "products.json");

        const fileData =
            fs.readFileSync(filePath, "utf8");

        const products =
            JSON.parse(fileData);

        res.json(products);

    } catch (error) {

        console.error("Products error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load products"
        });

    }

});

/* =========================
   SINGLE PRODUCT
========================= */

app.get("/api/products/:id", (req, res) => {

    try {

        const filePath =
            path.join(__dirname, "products.json");

        const fileData =
            fs.readFileSync(filePath, "utf8");

        const products =
            JSON.parse(fileData);

        const product =
            products.find(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }

        res.json(product);

    } catch (error) {

        console.error("Product error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

/* =========================
   REGISTER
========================= */

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

        console.log("");
        console.log("=================================");
        console.log("NEW GLOWCART REGISTRATION");
        console.log("Name:", name);
        console.log("Email:", email);
        console.log("Mobile:", mobile);
        console.log("=================================");

        const user = {
            id: Date.now(),
            name,
            email,
            mobile
        };

        /* =========================
           REGISTRATION EMAIL
        ========================= */

        const emailResult = await sendEmail(

            email,

            "Welcome to GlowCart 💗",

            `
            <div style="
                font-family:Arial,sans-serif;
                max-width:600px;
                margin:auto;
                padding:30px;
                border:1px solid #eee;
                border-radius:15px;
                background:#ffffff;
            ">

                <h1 style="color:#d41483;">
                    Welcome to GlowCart 💗
                </h1>

                <p>
                    Hello <b>${name}</b>,
                </p>

                <p>
                    Your GlowCart account has been
                    registered successfully.
                </p>

                <p>
                    You can now login and start
                    shopping for your favourite
                    skincare products.
                </p>

                <div style="
                    background:#fff0f7;
                    padding:15px;
                    border-radius:10px;
                    margin-top:20px;
                ">

                    <b>Registered Email:</b>
                    ${email}

                    <br><br>

                    <b>Mobile:</b>
                    ${mobile}

                    <br><br>

                    <b>Delivery Pincode:</b>
                    ${pincode}

                </div>

                <p style="margin-top:25px;">
                    Thank you for choosing
                    <b>GlowCart</b> ✨
                </p>

                <p>
                    Premium skincare made simple.
                </p>

            </div>
            `
        );

        /* =========================
           EMAIL FAILED
        ========================= */

        if (!emailResult.success) {

            console.error(
                "REGISTRATION EMAIL FAILED:",
                emailResult
            );

            return res.status(500).json({

                success: false,

                message:
                    "Registration email could not be sent.",

                error:
                    emailResult.data ||
                    emailResult.error ||
                    emailResult.message

            });

        }

        /* =========================
           SUCCESS
        ========================= */

        console.log(
            "REGISTRATION COMPLETED SUCCESSFULLY"
        );

        res.status(201).json({

            success: true,

            message:
                "Registration successful! Confirmation email sent.",

            emailSent: true,

            emailId:
                emailResult.data?.id || null,

            user: user

        });

    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Registration failed.",

            error:
                error.message

        });

    }

});

/* =========================
   LOGIN
========================= */

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
                    "Email and password are required."

            });

        }

        console.log(
            "User login:",
            email
        );

        const user = {

            id: Date.now(),

            name:
                email.split("@")[0],

            email: email

        };

        const emailResult = await sendEmail(

            email,

            "GlowCart Login Successful 💗",

            `
            <div style="
                font-family:Arial,sans-serif;
                max-width:600px;
                margin:auto;
                padding:30px;
                border:1px solid #eee;
                border-radius:15px;
            ">

                <h1 style="color:#d41483;">
                    Login Successful 💗
                </h1>

                <p>
                    Hello <b>${user.name}</b>,
                </p>

                <p>
                    You have successfully logged
                    in to your GlowCart account.
                </p>

                <div style="
                    background:#fff0f7;
                    padding:15px;
                    border-radius:10px;
                    margin-top:20px;
                ">

                    <b>Email:</b>
                    ${email}

                    <br><br>

                    <b>Status:</b>
                    Login successful ✅

                </div>

                <p style="margin-top:25px;">
                    Happy shopping with
                    <b>GlowCart</b> 🛍️
                </p>

            </div>
            `
        );

        res.json({

            success: true,

            message:
                emailResult.success
                ? "Login successful! Login email sent."
                : "Login successful, but email could not be sent.",

            emailSent:
                emailResult.success,

            user: user

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Login failed."

        });

    }

});

/* =========================
   ORDERS
========================= */

app.post("/api/orders", async (req, res) => {

    try {

        const order = req.body;

        if (!order) {

            return res.status(400).json({

                success: false,

                message:
                    "Order data is missing."

            });

        }

        console.log(
            "New order:",
            order
        );

        const customerEmail =
            order.email ||
            order.customerEmail;

        const customerName =
            order.name ||
            order.customerName ||
            "GlowCart Customer";

        let emailSent = false;

        if (customerEmail) {

            const emailResult = await sendEmail(

                customerEmail,

                "GlowCart Order Confirmed 📦💗",

                `
                <div style="
                    font-family:Arial,sans-serif;
                    max-width:600px;
                    margin:auto;
                    padding:30px;
                    border:1px solid #eee;
                    border-radius:15px;
                ">

                    <h1 style="color:#d41483;">
                        Order Confirmed 📦💗
                    </h1>

                    <p>
                        Hello <b>${customerName}</b>,
                    </p>

                    <p>
                        Thank you for shopping with
                        <b>GlowCart</b>.
                    </p>

                    <p>
                        Your order has been received
                        successfully.
                    </p>

                    <div style="
                        background:#fff0f7;
                        padding:20px;
                        border-radius:10px;
                        margin-top:20px;
                    ">

                        <h3>
                            📦 Order Details
                        </h3>

                        ${
                            order.id
                            ?
                            `<p><b>Order ID:</b> ${order.id}</p>`
                            :
                            ""
                        }

                        ${
                            order.total
                            ?
                            `<p><b>Total:</b> ₹${order.total}</p>`
                            :
                            ""
                        }

                        ${
                            order.address
                            ?
                            `<p><b>Delivery Address:</b><br>${order.address}</p>`
                            :
                            ""
                        }

                        <p>
                            <b>Status:</b>
                            Order Received ✅
                        </p>

                    </div>

                    <p style="margin-top:25px;">
                        We will process your order soon. 🛍️
                    </p>

                    <p>
                        Thank you for choosing
                        <b>GlowCart</b> ✨
                    </p>

                </div>
                `
            );

            emailSent = emailResult.success;

        }

        res.status(201).json({

            success: true,

            emailSent: emailSent,

            message:
                emailSent
                ? "Order placed successfully! Confirmation email sent."
                : "Order placed successfully, but confirmation email could not be sent.",

            order: order

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

/* =========================
   START SERVER
========================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "GlowCart server running on port " +
            PORT
        );

    }
);
