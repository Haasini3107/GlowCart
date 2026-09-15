
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
   PRODUCTS
========================= */

app.get("/api/products", (req, res) => {

    try {

        const filePath = path.join(
            __dirname,
            "products.json"
        );

        const fileData = fs.readFileSync(
            filePath,
            "utf8"
        );

        const products = JSON.parse(fileData);

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

        const filePath = path.join(
            __dirname,
            "products.json"
        );

        const fileData = fs.readFileSync(
            filePath,
            "utf8"
        );

        const products = JSON.parse(fileData);

        const product = products.find(
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

app.post("/api/register", (req, res) => {

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
                message: "Please fill all fields."
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


        res.status(201).json({

            success: true,

            message: "Registration successful!",

            user: user

        });

    } catch (error) {

        console.error(
            "Register error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Registration failed."

        });

    }

});


/* =========================
   LOGIN
========================= */

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


        res.json({

            success: true,

            message: "Login successful!",

            user: user

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Login failed."

        });

    }

});


/* =========================
   ORDERS
========================= */

app.post("/api/orders", (req, res) => {

    try {

        const order = req.body;


        if (!order) {

            return res.status(400).json({

                success: false,

                message: "Order data is missing."

            });

        }


        console.log(
            "New order:",
            order
        );


        res.status(201).json({

            success: true,

            message: "Order placed successfully!",

            order: order

        });

    } catch (error) {

        console.error(
            "Order error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Unable to place order."

        });

    }

});


/* =========================
   START SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        "GlowCart server running on port " + PORT
    );

});
