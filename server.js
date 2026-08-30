const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
process.env.EMAIL_FROM || "[onboarding@resend.dev](mailto:onboarding@resend.dev)";

const resend =
RESEND_API_KEY
? new Resend(RESEND_API_KEY)
: null;

/* ================= HOME ================= */

app.get("/", (req, res) => {

```
res.json({
    success: true,
    message: "GlowCart Backend is running successfully!"
});
```

});

/* ================= PRODUCTS ================= */

app.get("/api/products", (req, res) => {

```
try {

    const data =
        fs.readFileSync(
            "products.json",
            "utf8"
        );

    const products =
        JSON.parse(data);

    res.json(products);

} catch (error) {

    console.error(error);

    res.status(500).json({
        success: false,
        message: "Unable to load products"
    });

}
```

});

app.get("/api/products/:id", (req, res) => {

```
try {

    const data =
        fs.readFileSync(
            "products.json",
            "utf8"
        );

    const products =
        JSON.parse(data);

    const product =
        products.find(
            p => p.id == req.params.id
        );

    if (!product) {

        return res.status(404).json({
            success: false,
            message: "Product not found"
        });

    }

    res.json(product);

} catch (error) {

    res.status(500).json({
        success: false,
        message: "Server error"
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
        message: "Name, email and password are required"
    });

}


try {

    /*
     * Send welcome email.
     */

    if (resend) {

        const { error } =
            await resend.emails.send({

                from: EMAIL_FROM,

                to: [email],

                subject:
                    "Welcome to GlowCart! 💖",

                html: `
                    <div style="
                        font-family:Arial;
                        max-width:600px;
                        margin:auto;
                        padding:30px;
                        border-radius:15px;
                        background:#fff7fb;
                    ">

                        <h1 style="
                            color:#e91e63;
                        ">
                            Welcome to GlowCart, ${name}! 💖
                        </h1>

                        <p>
                            Your GlowCart account has been
                            registered successfully.
                        </p>

                        <p>
                            Thank you for joining our
                            premium skincare shopping experience.
                        </p>

                        <hr>

                        <p>
                            Happy Shopping! 🛍️
                        </p>

                        <strong>
                            GlowCart Team
                        </strong>

                    </div>
                `

            });


        if (error) {

            console.error(
                "Registration email error:",
                error
            );

        }

    }


    res.json({

        success: true,

        message:
            "Registration successful",

        user: {
            name,
            email,
            mobile
        }

    });

} catch (error) {

    console.error(error);

    res.json({

        success: true,

        message:
            "Registration successful, but email could not be sent",

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

    /*
     * Send login notification email.
     */

    if (resend) {

        const { error } =
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
                        padding:30px;
                        background:#fff7fb;
                        border-radius:15px;
                    ">

                        <h1 style="
                            color:#9c27b0;
                        ">
                            Login Successful 💖
                        </h1>

                        <p>
                            Hello ${name || "GlowCart Customer"},
                        </p>

                        <p>
                            You have successfully logged
                            into your GlowCart account.
                        </p>

                        <p>
                            Welcome back! 🛍️
                        </p>

                        <hr>

                        <strong>
                            GlowCart Team
                        </strong>

                    </div>
                `

            });


        if (error) {

            console.error(
                "Login email error:",
                error
            );

        }

    }


    res.json({

        success: true,

        message:
            "Login successful",

        user: {
            name:
                name || "GlowCart Customer",
            email
        }

    });

} catch (error) {

    console.error(error);

    res.json({

        success: true,

        message:
            "Login successful, but email could not be sent",

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


if (!customer || !customer.email || !items) {

    return res.status(400).json({

        success: false,

        message:
            "Customer email and order information are required"

    });

}


const finalOrderId =
    orderId || "GC" + Date.now();


try {

    /*
     * Create product list for email.
     */

    let productRows = "";

    items.forEach(item => {

        const price =
            String(item.price)
                .replace("₹", "")
                .replace(",", "");

        const quantity =
            Number(item.quantity || 1);

        const itemTotal =
            Number(price) * quantity;


        productRows += `

            <tr>

                <td style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                ">
                    ${item.name}
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
                    ₹${itemTotal}
                </td>

            </tr>

        `;

    });


    /*
     * Send order confirmation email.
     */

    if (resend) {

        const { error } =
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
                        padding:30px;
                        background:#fff7fb;
                        border-radius:15px;
                    ">

                        <h1 style="
                            color:#e91e63;
                        ">
                            Order Confirmed! 🎉
                        </h1>

                        <p>
                            Hello ${customer.name},
                        </p>

                        <p>
                            Thank you for shopping with GlowCart.
                            Your order has been placed successfully.
                        </p>

                        <h3>
                            Order ID: ${finalOrderId}
                        </h3>

                        <table style="
                            width:100%;
                            border-collapse:collapse;
                            background:white;
                            margin-top:20px;
                        ">

                            <thead>

                                <tr>

                                    <th style="padding:10px;">
                                        Product
                                    </th>

                                    <th style="padding:10px;">
                                        Qty
                                    </th>

                                    <th style="padding:10px;">
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
                            Payment:
                            <strong>
                                ${payment || "Cash on Delivery"}
                            </strong>
                        </p>

                        <p>
                            Delivery Address:
                        </p>

                        <p>
                            ${customer.address}<br>
                            ${customer.city} -
                            ${customer.pincode}<br>
                            Phone: ${customer.phone}
                        </p>

                        <hr>

                        <p>
                            Thank you for choosing GlowCart 💖
                        </p>

                        <strong>
                            GlowCart Team
                        </strong>

                    </div>

                `

            });


        if (error) {

            console.error(
                "Order email error:",
                error
            );

        }

    }


    res.json({

        success: true,

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

    console.error(error);

    res.json({

        success: true,

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

app.listen(PORT, () => {

```
console.log(
    `GlowCart backend running on port ${PORT}`
);
```

});
