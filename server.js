const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const EMAIL_FROM =
process.env.EMAIL_FROM || "[onboarding@resend.dev](mailto:onboarding@resend.dev)";

const resend = RESEND_API_KEY
? new Resend(RESEND_API_KEY)
: null;

/* ================= HOME ================= */

app.get("/", (req, res) => {

```
res.json({
    success: true,
    message: "GlowCart Backend is running successfully! 💖"
});
```

});

/* ================= PRODUCTS ================= */

app.get("/api/products", (req, res) => {

```
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

    res.json(products);

} catch (error) {

    console.error("Products error:", error);

    res.status(500).json({

        success: false,

        message:
            "Unable to load products"

    });

}
```

});

/* ================= SINGLE PRODUCT ================= */

app.get("/api/products/:id", (req, res) => {

```
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
        p => String(p.id) === String(req.params.id)
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

    console.error(error);

    res.status(500).json({

        success: false,

        message:
            "Server error"

    });

}
```

});

/* ================= REGISTER ================= */

app.post("/api/register", async (req, res) => {

```
const {
    name,
    email,
    password,
    mobile
} = req.body;


if (!name || !email || !password) {

    return res.status(400).json({

        success: false,

        message:
            "Name, email and password are required"

    });

}


try {

    let emailSent = false;

    if (resend) {

        const result =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [email],

                subject:
                    "Welcome to GlowCart! 💖",

                html: `

                <div style="
                    font-family:Arial,sans-serif;
                    max-width:600px;
                    margin:auto;
                    padding:35px;
                    background:#fff7fb;
                    border-radius:20px;
                    border:1px solid #f3d5e5;
                ">

                    <h1 style="
                        color:#e91e63;
                        text-align:center;
                    ">
                        Welcome to GlowCart! 💖
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
                        border-radius:15px;
                        margin:20px 0;
                    ">

                        <p>
                            <strong>Email:</strong>
                            ${email}
                        </p>

                        <p>
                            <strong>Mobile:</strong>
                            ${mobile || "Not provided"}
                        </p>

                    </div>

                    <p>
                        You can now log in and start
                        shopping for your favourite
                        skincare products. 🛍️
                    </p>

                    <p>
                        Thank you for choosing
                        <strong>GlowCart</strong>.
                    </p>

                    <hr>

                    <p style="
                        text-align:center;
                        color:#777;
                    ">
                        GlowCart Team 💕
                    </p>

                </div>

                `

            });


        if (result.error) {

            console.error(
                "Registration email error:",
                result.error
            );

        } else {

            emailSent = true;

        }

    } else {

        console.error(
            "RESEND_API_KEY is missing"
        );

    }


    res.json({

        success: true,

        emailSent: emailSent,

        message: emailSent
            ? "Registration successful. Welcome email sent."
            : "Registration successful, but email service is not configured.",

        user: {

            name,
            email,
            mobile

        }

    });


} catch (error) {

    console.error(
        "Registration error:",
        error
    );

    res.json({

        success: true,

        emailSent: false,

        message:
            "Registration successful, but email could not be sent.",

        user: {

            name,
            email,
            mobile

        }

    });

}
```

});

/* ================= LOGIN ================= */

app.post("/api/login", async (req, res) => {

```
const {
    name,
    email,
    password
} = req.body;


if (!email || !password) {

    return res.status(400).json({

        success: false,

        message:
            "Email and password are required"

    });

}


try {

    let emailSent = false;

    if (resend) {

        const result =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [email],

                subject:
                    "GlowCart Login Successful 🔐",

                html: `

                <div style="
                    font-family:Arial;
                    max-width:600px;
                    margin:auto;
                    padding:35px;
                    background:#fff7fb;
                    border-radius:20px;
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

                    <p>
                        You have successfully logged
                        into your GlowCart account.
                    </p>

                    <p>
                        Happy shopping! 🛍️✨
                    </p>

                    <hr>

                    <strong>
                        GlowCart Team
                    </strong>

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


    res.json({

        success: true,

        emailSent: emailSent,

        message:
            "Login successful",

        user: {

            name:
                name || "GlowCart Customer",

            email

        }

    });


} catch (error) {

    console.error(
        "Login error:",
        error
    );

    res.json({

        success: true,

        emailSent: false,

        message:
            "Login successful",

        user: {

            name:
                name || "GlowCart Customer",

            email

        }

    });

}
```

});

/* ================= PLACE ORDER ================= */

app.post("/api/orders", async (req, res) => {

```
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
    !items ||
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
    orderId || "GC" + Date.now();


try {

    let productRows = "";


    items.forEach(item => {

        const price =
            Number(
                String(item.price)
                    .replace("₹", "")
                    .replace(",", "")
            );

        const quantity =
            Number(item.quantity || 1);

        const itemTotal =
            price * quantity;


        productRows += `

            <tr>

                <td style="
                    padding:12px;
                    border-bottom:1px solid #eee;
                ">
                    ${item.name}
                </td>

                <td style="
                    padding:12px;
                    border-bottom:1px solid #eee;
                    text-align:center;
                ">
                    ${quantity}
                </td>

                <td style="
                    padding:12px;
                    border-bottom:1px solid #eee;
                    text-align:right;
                ">
                    ₹${itemTotal}
                </td>

            </tr>

        `;

    });


    let emailSent = false;


    if (resend) {

        const result =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [customer.email],

                subject:
                    `GlowCart Order Confirmed - ${finalOrderId}`,

                html: `

                <div style="
                    font-family:Arial;
                    max-width:650px;
                    margin:auto;
                    padding:35px;
                    background:#fff7fb;
                    border-radius:20px;
                ">

                    <h1 style="
                        color:#e91e63;
                    ">
                        Order Confirmed! 🎉
                    </h1>

                    <p>
                        Hello
                        <strong>
                            ${customer.name}
                        </strong>,
                    </p>

                    <p>
                        Your GlowCart order has been
                        placed successfully.
                    </p>

                    <h3>
                        Order ID:
                        ${finalOrderId}
                    </h3>

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
                        padding:18px;
                        border-radius:12px;
                    ">

                        <h3>
                            Delivery Address
                        </h3>

                        <p>
                            ${customer.address || ""}<br>
                            ${customer.city || ""} -
                            ${customer.pincode || ""}<br>
                            Phone:
                            ${customer.phone || ""}
                        </p>

                    </div>

                    <hr>

                    <p style="
                        text-align:center;
                    ">
                        Thank you for shopping
                        with GlowCart 💖
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

        }

    }


    res.json({

        success: true,

        emailSent: emailSent,

        message:
            "Order placed successfully",

        order: {

            id: finalOrderId,

            customer,

            items,

            total,

            payment,

            status:
                "Order Placed"

        }

    });


} catch (error) {

    console.error(
        "Order error:",
        error
    );

    res.json({

        success: true,

        emailSent: false,

        message:
            "Order placed successfully, but email could not be sent",

        order: {

            id: finalOrderId,

            customer,

            items,

            total,

            payment,

            status:
                "Order Placed"

        }

    });

}
```

});

/* ================= START SERVER ================= */

app.listen(
PORT,
"0.0.0.0",
() => {

```
    console.log(
        `GlowCart backend running on 0.0.0.0:${PORT}`
    );

}
```

);
