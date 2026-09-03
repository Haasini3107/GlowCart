const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());

/* ================= PORT ================= */

const PORT = process.env.PORT || 10000;

/* ================= RESEND ================= */

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const EMAIL_FROM =
process.env.EMAIL_FROM || "[onboarding@resend.dev](mailto:onboarding@resend.dev)";

const resend = RESEND_API_KEY
? new Resend(RESEND_API_KEY)
: null;

/* ================= HOME ================= */

app.get("/", (req, res) => {

res.status(200).json({

    success: true,

    message:
        "GlowCart Backend is running successfully! 💖",

    status:
        "online"

});

});

/* ================= HEALTH CHECK ================= */

app.get("/health", (req, res) => {

res.status(200).json({

    success: true,

    message: "GlowCart server is healthy"

});

});

/* ================= PRODUCTS ================= */

app.get("/api/products", (req, res) => {

try {

    const filePath = path.join(
        __dirname,
        "products.json"
    );

    if (!fs.existsSync(filePath)) {

        return res.status(404).json({

            success: false,

            message:
                "products.json file not found"

        });

    }

    const data = fs.readFileSync(
        filePath,
        "utf8"
    );

    const products = JSON.parse(data);

    res.status(200).json(products);

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

/* ================= SINGLE PRODUCT ================= */

app.get("/api/products/:id", (req, res) => {

try {

    const filePath = path.join(
        __dirname,
        "products.json"
    );

    const data = fs.readFileSync(
        filePath,
        "utf8"
    );

    const products = JSON.parse(data);

    const product = products.find(
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

    res.status(200).json(product);

} catch (error) {

    console.error(
        "Single product error:",
        error
    );

    res.status(500).json({

        success: false,

        message:
            "Server error"

    });

}

});

/* ================= REGISTER ================= */

app.post("/api/register", async (req, res) => {

const {
    name,
    email,
    password,
    mobile
} = req.body;


if (
    !name ||
    !email ||
    !password
) {

    return res.status(400).json({

        success: false,

        message:
            "Name, email and password are required"

    });

}


try {

    let emailSent = false;


    /* ================= SEND REGISTER EMAIL ================= */

    if (resend) {

        const result =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [email],

                subject:
                    "GlowCart Registration Successful 💖",

                html: `

                <!DOCTYPE html>

                <html>

                <body style="
                    margin:0;
                    padding:0;
                    background:#fff5fa;
                    font-family:Arial,sans-serif;
                ">

                    <div style="
                        max-width:600px;
                        margin:30px auto;
                        background:white;
                        border-radius:20px;
                        padding:35px;
                        box-shadow:0 10px 30px rgba(0,0,0,0.08);
                    ">

                        <h1 style="
                            color:#e91e63;
                            text-align:center;
                        ">
                            Welcome to GlowCart! 💖
                        </h1>

                        <p style="
                            font-size:17px;
                            color:#444;
                        ">
                            Hello <strong>${name}</strong>,
                        </p>

                        <p style="
                            font-size:16px;
                            line-height:1.7;
                            color:#555;
                        ">
                            Your GlowCart account has been
                            registered successfully.
                        </p>

                        <div style="
                            background:#fff0f6;
                            padding:20px;
                            border-radius:15px;
                            margin:25px 0;
                        ">

                            <p>
                                <strong>Name:</strong>
                                ${name}
                            </p>

                            <p>
                                <strong>Email:</strong>
                                ${email}
                            </p>

                            <p>
                                <strong>Mobile:</strong>
                                ${mobile || "Not provided"}
                            </p>

                        </div>

                        <p style="
                            color:#555;
                            line-height:1.7;
                        ">
                            Your account is ready.
                            You can now log in and start
                            shopping for your favourite
                            skincare products. 🛍️
                        </p>

                        <div style="
                            text-align:center;
                            margin:30px 0;
                        ">

                            <span style="
                                display:inline-block;
                                padding:14px 28px;
                                background:linear-gradient(
                                    135deg,
                                    #e91e63,
                                    #9c27b0
                                );
                                color:white;
                                border-radius:25px;
                                font-weight:bold;
                            ">
                                Happy Shopping ✨
                            </span>

                        </div>

                        <hr>

                        <p style="
                            text-align:center;
                            color:#888;
                        ">
                            Thank you for choosing GlowCart 💕
                        </p>

                        <p style="
                            text-align:center;
                            color:#9c27b0;
                            font-weight:bold;
                        ">
                            GlowCart Team
                        </p>

                    </div>

                </body>

                </html>

                

            });


        if (result.error) {

            console.error(
                "Resend registration error:",
                result.error
            );

        } else {

            emailSent = true;

            console.log(
                "Registration email sent to:",
                email
            );

        }

    } else {

        console.error(
            "RESEND_API_KEY is missing"
        );

    }


    /* ================= RESPONSE ================= */

    res.status(200).json({

        success: true,

        emailSent: emailSent,

        message: emailSent
            ? "Registration successful. Email sent successfully."
            : "Registration successful, but email service is not configured.",

        user: {

            name: name,

            email: email,

            mobile: mobile || ""

        }

    });


} catch (error) {

    console.error(
        "Registration error:",
        error
    );

    res.status(200).json({

        success: true,

        emailSent: false,

        message:
            "Registration successful, but email could not be sent.",

        user: {

            name: name,

            email: email,

            mobile: mobile || ""

        }

    });

}

});

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {

```
const {
    name,
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
            "Email and password are required"

    });

}


try {

    let emailSent = false;


    /* ================= LOGIN EMAIL ================= */

    if (resend) {

        const result =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [email],

                subject:
                    "GlowCart Login Successful 🔐",

                html: `

                <div style="
                    max-width:600px;
                    margin:30px auto;
                    padding:35px;
                    background:#fff7fb;
                    border-radius:20px;
                    font-family:Arial;
                ">

                    <h1 style="
                        color:#9c27b0;
                    ">
                        Login Successful 💖
                    </h1>

                    <p>
                        Hello
                        <strong>
                            ${name || "GlowCart Customer"}
                        </strong>,
                    </p>

                    <p style="
                        line-height:1.7;
                        color:#555;
                    ">
                        You have successfully logged into
                        your GlowCart account.
                    </p>

                    <p>
                        Welcome back! 🛍️✨
                    </p>

                    <hr>

                    <p style="
                        color:#777;
                        text-align:center;
                    ">
                        GlowCart Team 💕
                    </p>

                </div>

                `

            });


        if (result.error) {

            console.error(
                "Login email error:",
                result.error
            );

        } else {

            emailSent = true;

        }

    }


    res.status(200).json({

        success: true,

        emailSent: emailSent,

        message:
            "Login successful",

        user: {

            name:
                name ||
                "GlowCart Customer",

            email: email

        }

    });


} catch (error) {

    console.error(
        "Login error:",
        error
    );

    res.status(200).json({

        success: true,

        emailSent: false,

        message:
            "Login successful",

        user: {

            name:
                name ||
                "GlowCart Customer",

            email: email

        }

    });

}

});

/* ================= PLACE ORDER ================= */

app.post("/api/orders", async (req, res) => {

const {
    customer,
    items,
    total,
    orderId,
    payment
} = req.body;


if (
    !customer ||
    !customer.email ||
    !Array.isArray(items) ||
    items.length === 0
) {

    return res.status(400).json({

        success: false,

        message:
            "Customer email and order information are required"

    });

}


const finalOrderId =
    orderId ||
    "GC" +
    Date.now();


try {

    let productRows = "";


    /* ================= PRODUCT ROWS ================= */

    items.forEach(item => {

        const price =
            Number(
                String(
                    item.price || 0
                )
                    .replace("₹", "")
                    .replace(",", "")
            );


        const quantity =
            Number(
                item.quantity || 1
            );


        const itemTotal =
            price *
            quantity;


        productRows += `

            <tr>

                <td style="
                    padding:12px;
                    border-bottom:1px solid #eee;
                ">
                    ${item.name || "Product"}
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
                    ₹${itemTotal}
                </td>

            </tr>

        `;

    });


    let emailSent = false;


    /* ================= ORDER EMAIL ================= */

    if (resend) {

        const result =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [customer.email],

                subject:
                    `GlowCart Order Confirmed - ${finalOrderId}`,

                html: `

                <div style="
                    max-width:650px;
                    margin:30px auto;
                    padding:35px;
                    background:#fff7fb;
                    border-radius:20px;
                    font-family:Arial;
                ">

                    <h1 style="
                        color:#e91e63;
                    ">
                        Order Placed Successfully! 🎉
                    </h1>

                    <p>
                        Hello
                        <strong>
                            ${customer.name || "Customer"}
                        </strong>,
                    </p>

                    <p>
                        Thank you for shopping with
                        GlowCart.
                    </p>

                    <div style="
                        background:white;
                        padding:20px;
                        border-radius:15px;
                        margin:20px 0;
                    ">

                        <h3>
                            Order ID:
                            ${finalOrderId}
                        </h3>

                    </div>

                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        background:white;
                    ">

                        <thead>

                            <tr>

                                <th style="padding:12px;">
                                    Product
                                </th>

                                <th style="padding:12px;">
                                    Qty
                                </th>

                                <th style="padding:12px;">
                                    Total
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${productRows}

                        </tbody>

                    </table>

                    <h2 style="
                        text-align:right;
                        color:#9c27b0;
                    ">
                        Total: ₹${total}
                    </h2>

                    <p>
                        <strong>
                            Payment:
                        </strong>

                        ${payment || "Cash on Delivery"}

                    </p>

                    <div style="
                        background:white;
                        padding:20px;
                        border-radius:15px;
                    ">

                        <h3>
                            Delivery Address
                        </h3>

                        <p>
                            ${customer.address || ""}<br>
                            ${customer.city || ""}<br>
                            Pincode:
                            ${customer.pincode || ""}<br>
                            Phone:
                            ${customer.phone || ""}
                        </p>

                    </div>

                    <hr>

                    <p style="
                        text-align:center;
                        color:#777;
                    ">
                        Thank you for choosing GlowCart 💖
                    </p>

                    <p style="
                        text-align:center;
                        color:#9c27b0;
                        font-weight:bold;
                    ">
                        GlowCart Team
                    </p>

                </div>

                `

            });


        if (result.error) {

            console.error(
                "Order email error:",
                result.error
            );

        } else {

            emailSent = true;

            console.log(
                "Order confirmation sent to:",
                customer.email
            );

        }

    }


    /* ================= RESPONSE ================= */

    res.status(200).json({

        success: true,

        emailSent: emailSent,

        message:
            "Order placed successfully",

        order: {

            id: finalOrderId,

            customer: customer,

            items: items,

            total: total,

            payment:
                payment ||
                "Cash on Delivery",

            status:
                "Order Placed"

        }

    });


} catch (error) {

    console.error(
        "Order error:",
        error
    );

    res.status(200).json({

        success: true,

        emailSent: false,

        message:
            "Order placed successfully, but email could not be sent",

        order: {

            id: finalOrderId,

            customer: customer,

            items: items,

            total: total,

            payment:
                payment ||
                "Cash on Delivery",

            status:
                "Order Placed"

        }

    });

}

});

/* ================= 404 ================= */

app.use((req, res) => {

```
res.status(404).json({

    success: false,

    message:
        "API route not found",

    route:
        req.originalUrl

});
```

});

/* ================= ERROR HANDLER ================= */

app.use((error, req, res, next) => {

console.error(
    "Server error:",
    error
);

res.status(500).json({

    success: false,

    message:
        "Internal server error"

});

});

/* ================= START SERVER ================= */

app.listen(
PORT,
"0.0.0.0",
() => {

    console.log(
        `GlowCart Backend running on port ${PORT}`
    );

    console.log(
        `Email service: ${
            resend
                ? "Configured"
                : "NOT CONFIGURED"
        }`
    );

}

);
