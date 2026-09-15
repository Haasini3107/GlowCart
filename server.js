```javascript
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "GlowCart Backend is running successfully!"
    });
});

/* PRODUCTS */
app.get("/api/products", (req, res) => {
    try {
        const data = fs.readFileSync("products.json", "utf8");
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to load products"
        });
    }
});

app.get("/api/products/:id", (req, res) => {
    try {
        const data = fs.readFileSync("products.json", "utf8");
        const products = JSON.parse(data);

        const product = products.find(
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
});

/* REGISTER + EMAIL */
app.post("/api/register", async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    try {

        await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: email,
            subject: "Welcome to GlowCart 💗",
            html: `
                <div style="font-family:Arial;padding:25px">
                    <h1 style="color:#d65a7a">Welcome to GlowCart 💗</h1>

                    <p>Hi <b>${name}</b>,</p>

                    <p>
                    Your GlowCart account has been registered successfully.
                    </p>

                    <p>
                    You can now shop your favourite skincare products
                    at affordable prices.
                    </p>

                    <hr>

                    <p>Thank you for choosing GlowCart.</p>

                    <h3>GlowCart Team ✨</h3>
                </div>
            `
        });

        res.json({
            success: true,
            message: "Registration successful",
            user: {
                name,
                email
            }
        });

    } catch (error) {

        console.error("REGISTER EMAIL ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed. Email could not be sent."
        });
    }
});

/* LOGIN */
app.post("/api/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    res.json({
        success: true,
        message: "Login successful",
        user: {
            email
        }
    });
});

/* PLACE ORDER + EMAIL */
app.post("/api/orders", async (req, res) => {

    const { customer, items, total } = req.body;

    if (!customer || !items || !customer.email) {
        return res.status(400).json({
            success: false,
            message: "Order information is missing"
        });
    }

    const orderId = Date.now();

    try {

        const productRows = items.map(item => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid #ddd">
                    ${item.name}
                </td>

                <td style="padding:10px;border-bottom:1px solid #ddd">
                    ${item.qty}
                </td>

                <td style="padding:10px;border-bottom:1px solid #ddd">
                    ₹${item.price}
                </td>
            </tr>
        `).join("");

        await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: customer.email,
            subject: `GlowCart Order Confirmed #${orderId}`,
            html: `
                <div style="font-family:Arial;padding:25px">

                    <h1 style="color:#d65a7a">
                        GlowCart 💗
                    </h1>

                    <h2>
                        Order Confirmed 🎉
                    </h2>

                    <p>
                        Hi <b>${customer.name}</b>,
                    </p>

                    <p>
                        Your GlowCart order has been placed successfully.
                    </p>

                    <p>
                        <b>Order ID:</b> ${orderId}
                    </p>

                    <h3>Order Details</h3>

                    <table
                        style="
                        width:100%;
                        border-collapse:collapse;
                        text-align:left;
                        "
                    >
                        <tr>
                            <th style="padding:10px">
                                Product
                            </th>

                            <th style="padding:10px">
                                Qty
                            </th>

                            <th style="padding:10px">
                                Price
                            </th>
                        </tr>

                        ${productRows}
                    </table>

                    <h2>
                        Total: ₹${total}
                    </h2>

                    <h3>Delivery Address</h3>

                    <p>
                        ${customer.address}<br>
                        Pincode: ${customer.pincode}<br>
                        Phone: ${customer.phone}
                    </p>

                    <p style="color:green">
                        ✓ Your order has been successfully placed.
                    </p>

                    <hr>

                    <p>
                        Thank you for shopping with GlowCart 💗
                    </p>

                </div>
            `
        });

        res.json({
            success: true,
            message: "Order placed successfully",
            order: {
                id: orderId,
                customer,
                items,
                total
            }
        });

    } catch (error) {

        console.error("ORDER EMAIL ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Order created but confirmation email failed."
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `GlowCart Backend running on port ${PORT}`
    );
});
```
