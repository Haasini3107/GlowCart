const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Home API
app.get("/", (req, res) => {
    res.json({
        message: "GlowCart Backend is running successfully!"
    });
});

// Products API
app.get("/api/products", (req, res) => {
    try {
        const data = fs.readFileSync("products.json", "utf8");
        const products = JSON.parse(data);

        res.json(products);
    } catch (error) {
        res.status(500).json({
            message: "Unable to load products"
        });
    }
});

// Single product
app.get("/api/products/:id", (req, res) => {
    try {
        const data = fs.readFileSync("products.json", "utf8");
        const products = JSON.parse(data);

        const product = products.find(
            p => p.id == req.params.id
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json(product);

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

// Register
app.post("/api/register", (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    res.json({
        success: true,
        message: "Registration successful",
        user: {
            name,
            email
        }
    });
});

// Login
app.post("/api/login", (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
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

// Place order
app.post("/api/orders", (req, res) => {

    const { customer, items, total } = req.body;

    if (!customer || !items) {
        return res.status(400).json({
            message: "Order information is missing"
        });
    }

    res.json({
        success: true,
        message: "Order placed successfully",
        order: {
            id: Date.now(),
            customer,
            items,
            total
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`GlowCart backend running on port ${PORT}`);
});