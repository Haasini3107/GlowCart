const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

const resend = RESEND_API_KEY
    ? new Resend(RESEND_API_KEY)
    : null;


/* ================= HOME ================= */

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "GlowCart Backend is running successfully!"
    });

});


/* ================= PRODUCTS ================= */

app.get("/api/products", (req, res) => {

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

});


/* ================= SINGLE PRODUCT ================= */

app.get("/api/products/:id", (req, res) => {

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
                p => String(p.id) === String(req.params.id)
            );


        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }


        res.json(product);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


/* ================= REGISTER ================= */

app.post("/api/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters"
            });

        }


        let emailSent = false;


        /* SEND REGISTRATION EMAIL */

        if (resend && EMAIL_FROM) {

            try {

                const result =
                    await resend.emails.send({

                        from: EMAIL_FROM,

                        to: [email],

                        subject:
                            "Welcome to GlowCart 💗",

                        html: `
                            <div style="
                                font-family:Arial;
                                max-width:600px;
                                margin:auto;
                                padding:30px;
                                border:1px solid #eee;
                                border-radius:15px;
                            ">

                                <h1 style="
                                    color:#e85d88;
                                ">
                                    Welcome to GlowCart 💗
                                </h1>

                                <p>
                                    Hello <strong>${name}</strong>,
                                </p>

                                <p>
                                    Your GlowCart account
                                    has been registered successfully.
                                </p>

                                <p>
                                    You can now login and
                                    start shopping for
                                    your favourite skincare products.
                                </p>

                                <br>

                                <strong>
                                    GlowCart Team
                                </strong>

                            </div>
                        `

                    });


                if (result.error) {

                    console.error(
                        "Resend error:",
                        result.error
                    );

                } else {

                    emailSent = true;

                }

            } catch (emailError) {

                console.error(
                    "Email sending error:",
                    emailError
                );

            }

        }


        res.json({

            success:true,

            message:
                "Registration successful",

            emailSent:emailSent,

            user:{
                name:name,
                email:email
            }

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success:false,

            message:
                "Registration failed"

        });

    }

});


/* ================= LOGIN ================= */

app.post("/api/login", (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success:false,

                message:
                    "Email and password are required"

            });

        }


        /*
         DEMO LOGIN

         This version allows login when
         email and password are entered.

         It is suitable for your current
         college/demo project.

         It is NOT production authentication.
        */


        res.json({

            success:true,

            message:"Login successful",

            user:{
                email:email
            }

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success:false,

            message:"Login failed"

        });

    }

});


/* ================= PLACE ORDER ================= */

app.post("/api/orders", async (req, res) => {

    try {

        const {
            customer,
            items,
            total
        } = req.body;


        if (
            !customer ||
            !customer.name ||
            !customer.email ||
            !customer.phone ||
            !customer.address ||
            !customer.pincode ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(400).json({

                success:false,

                message:
                    "Complete order information is required"

            });

        }


        const order = {

            id:Date.now(),

            customer:customer,

            items:items,

            total:Number(total) || 0,

            status:"Order Placed",

            date:new Date().toISOString()

        };


        let emailSent = false;


        /* ================= ORDER EMAIL ================= */

        if (resend && EMAIL_FROM) {

            try {

                const itemRows =
                    items.map(item => `

                        <tr>

                            <td style="
                                padding:8px;
                                border-bottom:1px solid #eee;
                            ">
                                ${item.name}
                            </td>

                            <td style="
                                padding:8px;
                                border-bottom:1px solid #eee;
                            ">
                                ${item.quantity}
                            </td>

                            <td style="
                                padding:8px;
                                border-bottom:1px solid #eee;
                            ">
                                ₹${item.price * item.quantity}
                            </td>

                        </tr>

                    `).join("");


                const result =
                    await resend.emails.send({

                        from:EMAIL_FROM,

                        to:[customer.email],

                        subject:
                            `GlowCart Order Confirmed #${order.id}`,

                        html:`

                            <div style="
                                font-family:Arial;
                                max-width:650px;
                                margin:auto;
                                padding:25px;
                            ">

                                <h1 style="
                                    color:#e85d88;
                                ">
                                    GlowCart 💗
                                </h1>

                                <h2>
                                    Order Confirmed!
                                </h2>

                                <p>
                                    Hello
                                    <strong>
                                        ${customer.name}
                                    </strong>,
                                </p>

                                <p>
                                    Your order has been
                                    placed successfully.
                                </p>

                                <p>
                                    <strong>
                                        Order ID:
                                    </strong>
                                    #${order.id}
                                </p>

                                <table style="
                                    width:100%;
                                    border-collapse:collapse;
                                    margin-top:20px;
                                ">

                                    <thead>

                                        <tr>

                                            <th style="
                                                text-align:left;
                                                padding:8px;
                                            ">
                                                Product
                                            </th>

                                            <th style="
                                                text-align:left;
                                                padding:8px;
                                            ">
                                                Qty
                                            </th>

                                            <th style="
                                                text-align:left;
                                                padding:8px;
                                            ">
                                                Price
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        ${itemRows}

                                    </tbody>

                                </table>

                                <h2>
                                    Total: ₹${order.total}
                                </h2>

                                <hr>

                                <h3>
                                    Delivery Address
                                </h3>

                                <p>
                                    ${customer.address}<br>
                                    Pincode: ${customer.pincode}<br>
                                    Phone: ${customer.phone}
                                </p>

                                <br>

                                <p>
                                    Thank you for shopping
                                    with GlowCart 💕
                                </p>

                            </div>

                        `

                    });


                if (result.error) {

                    console.error(
                        "Resend order email error:",
                        result.error
                    );

                } else {

                    emailSent = true;

                }

            } catch (emailError) {

                console.error(
                    "Order email error:",
                    emailError
                );

            }

        }


        res.json({

            success:true,

            message:
                "Order placed successfully",

            emailSent:emailSent,

            order:order

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success:false,

            message:
                "Unable to place order"

        });

    }

});


/* ================= START ================= */

app.listen(PORT, () => {

    console.log(
        `GlowCart backend running on port ${PORT}`
    );

});
