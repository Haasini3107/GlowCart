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


/* =========================
   BODY PARSER
========================= */

app.use(express.json());


/* =========================
   EMAIL FUNCTION - RESEND
========================= */

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
            process.env.EMAIL_FROM ||
            "onboarding@resend.dev";


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


        if (!response.ok) {

            console.error(
                "Resend error:",
                data
            );

            return {
                success: false,
                data: data
            };

        }


        console.log(
            "Email sent successfully to:",
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


/* =========================
   HOME
========================= */

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "GlowCart backend is running!",

        status: "online"

    });

});


/* =========================
   PRODUCTS
========================= */

app.get("/api/products", (req, res) => {

    try {

        const filePath =
            path.join(
                __dirname,
                "products.json"
            );


        const fileData =
            fs.readFileSync(
                filePath,
                "utf8"
            );


        const products =
            JSON.parse(fileData);


        res.json(products);


    } catch (error) {

        console.error(
            "Products error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to load products"

        });

    }

});


/* =========================
   SINGLE PRODUCT
========================= */

app.get("/api/products/:id", (req, res) => {

    try {

        const filePath =
            path.join(
                __dirname,
                "products.json"
            );


        const fileData =
            fs.readFileSync(
                filePath,
                "utf8"
            );


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

                message:
                    "Product not found"

            });

        }


        res.json(product);


    } catch (error) {

        console.error(
            "Product error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Server error"

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
            password
        } = req.body;


        if (
            !name ||
            !email ||
            !mobile ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill all fields."

            });

        }


        console.log(
            "New user registered:",
            email
        );


        const user = {

            id: Date.now(),

            name: name,

            email: email,

            mobile: mobile

        };


        /* =========================
           REGISTRATION EMAIL
        ========================= */

        await sendEmail(

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
            ">

                <h1 style="color:#d81b83;">
                    Welcome to GlowCart 💗
                </h1>

                <p>Hello <b>${name}</b>,</p>

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


        res.status(201).json({

            success: true,

            message:
                "Registration successful! Confirmation email sent.",

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
                "Registration failed."

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


        /* =========================
           LOGIN EMAIL
        ========================= */

        await sendEmail(

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

                <h1 style="color:#d81b83;">
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
                "Login successful! Login email sent.",

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


        /* =========================
           GET CUSTOMER DETAILS
        ========================= */

        const customerEmail =
            order.email ||
            order.customerEmail;


        const customerName =
            order.name ||
            order.customerName ||
            "GlowCart Customer";


        /* =========================
           ORDER EMAIL
        ========================= */

        if (customerEmail) {

            await sendEmail(

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

                    <h1 style="color:#d81b83;">
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
                            order.orderId
                            ?
                            `<p><b>Order ID:</b> ${order.orderId}</p>`
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
                        We will process your order
                        soon. 🛍️
                    </p>

                    <p>
                        Thank you for choosing
                        <b>GlowCart</b> ✨
                    </p>

                </div>
                `

            );

        } else {

            console.log(
                "No customer email found in order."
            );

        }


        res.status(201).json({

            success: true,

            message:
                "Order placed successfully! Confirmation email sent.",

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
