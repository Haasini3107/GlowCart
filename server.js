```javascript
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;


/* =====================================================
   CORS
===================================================== */

app.use(
    cors({
        origin: [
            "https://haasini3107.github.io",
            "http://localhost:3000",
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.options("*", cors());


/* =====================================================
   BODY PARSER
===================================================== */

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


/* =====================================================
   HOME / HEALTH CHECK
===================================================== */

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "GlowCart backend is running! 💗",
        status: "online"
    });

});


/* =====================================================
   PRODUCTS
===================================================== */

app.get("/api/products", (req, res) => {

    try {

        const filePath =
            path.join(__dirname, "products.json");

        const data =
            fs.readFileSync(
                filePath,
                "utf8"
            );

        const products =
            JSON.parse(data);

        res.json(products);

    } catch (error) {

        console.error(
            "Products error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to load products"
        });

    }

});


/* =====================================================
   SINGLE PRODUCT
===================================================== */

app.get("/api/products/:id", (req, res) => {

    try {

        const filePath =
            path.join(__dirname, "products.json");

        const data =
            fs.readFileSync(
                filePath,
                "utf8"
            );

        const products =
            JSON.parse(data);

        const product =
            products.find(
                p =>
                    String(p.id) ===
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

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


/* =====================================================
   REGISTER
===================================================== */

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

                message:
                    "Please fill all fields."

            });

        }


        /*
          Demo registration.

          For your current project we return
          the user immediately so the frontend
          can continue to login.
        */

        const user = {

            id: Date.now(),

            name: name,

            email: email,

            mobile: mobile

        };


        console.log(
            "New registration:",
            email
        );


        res.status(201).json({

            success: true,

            message:
                "Registration successful!",

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


/* =====================================================
   LOGIN
===================================================== */

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


        /*
          Demo login for current project.
          Database authentication can be added later.
        */

        const user = {

            id: Date.now(),

            name:
                email
                    .split("@")[0],

            email: email

        };


        console.log(
            "Login:",
            email
        );


        res.json({

            success: true,

            message:
                "Login successful!",

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


/* =====================================================
   ORDERS
===================================================== */

app.post("/api/orders", (req, res) => {

    try {

        const order =
            req.body;


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


        res.status(201).json({

            success: true,

            message:
                "Order placed successfully!",

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


/* =====================================================
   START SERVER
===================================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `GlowCart server running on port ${PORT}`
        );

    }
);
```
