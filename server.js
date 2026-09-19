javascript
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

/* ==============================
   BASIC CONFIGURATION
============================== */

const PORT = process.env.PORT || 10000;

const USERS_FILE = path.join(__dirname, "users.json");
const ORDERS_FILE = path.join(__dirname, "place.json");
const PRODUCTS_FILE = path.join(__dirname, "products.json");

/* ==============================
   MIDDLEWARE
============================== */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==============================
   HELPER FUNCTIONS
============================== */

function ensureFile(file, defaultData) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify(defaultData, null, 2),
                "utf8"
            );
        }
    } catch (error) {
        console.error("File creation error:", error);
    }
}

function readJson(file, defaultData = []) {
    try {
        ensureFile(file, defaultData);

        const data = fs.readFileSync(file, "utf8");

        if (!data.trim()) {
            return defaultData;
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("JSON read error:", error);
        return defaultData;
    }
}

function writeJson(file, data) {
    try {
        fs.writeFileSync(
            file,
            JSON.stringify(data, null, 2),
            "utf8"
        );

        return true;
    } catch (error) {
        console.error("JSON write error:", error);
        return false;
    }
}

/* ==============================
   INITIAL FILES
============================== */

ensureFile(USERS_FILE, []);
ensureFile(ORDERS_FILE, []);

ensureFile(PRODUCTS_FILE, [
    {
        id: 1,
        name: "Glow Radiance Cream",
        price: 499,
        description: "Brightening face cream for radiant looking skin.",
        image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883"
    },
    {
        id: 2,
        name: "Vitamin C Face Cream",
        price: 599,
        description: "Vitamin C enriched cream for fresh and glowing skin.",
        image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd"
    },
    {
        id: 3,
        name: "Hydra Moisturizing Cream",
        price: 449,
        description: "Deep moisturizing cream for soft and hydrated skin.",
        image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b"
    },
    {
        id: 4,
        name: "Aloe Vera Face Cream",
        price: 399,
        description: "Aloe Vera based soothing face cream.",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be"
    }
]);

/* ==============================
   HOME / HEALTH
============================== */

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "GlowCart Backend API is running!",
        server: "online"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "GlowCart API is working!",
        server: "online"
    });
});

/* ==============================
   PRODUCTS
============================== */

app.get("/api/products", (req, res) => {
    const products = readJson(PRODUCTS_FILE, []);

    res.json({
        success: true,
        products: products
    });
});

/* ==============================
   REGISTER USER
============================== */

app.post("/api/register", (req, res) => {
    try {
        const {
            name,
            fullName,
            email,
            mobile,
            phone,
            password
        } = req.body;

        const userName = name || fullName;
        const userMobile = mobile || phone;

        if (!userName || !email || !userMobile || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all registration fields."
            });
        }

        const users = readJson(USERS_FILE, []);

        const cleanEmail = String(email).trim().toLowerCase();

        const existingUser = users.find(
            user =>
                String(user.email).trim().toLowerCase() === cleanEmail
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        const newUser = {
            id: Date.now(),
            name: String(userName).trim(),
            email: cleanEmail,
            mobile: String(userMobile).trim(),
            password: String(password),
            registeredAt: new Date().toISOString()
        };

        users.push(newUser);

        const saved = writeJson(USERS_FILE, users);

        if (!saved) {
            return res.status(500).json({
                success: false,
                message: "Unable to save registration."
            });
        }

        res.status(201).json({
            success: true,
            message: "Registration successful!",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile,
                registeredAt: newUser.registeredAt
            }
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
});

/* ==============================
   LOGIN USER
============================== */

app.post("/api/login", (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password."
            });
        }

        const users = readJson(USERS_FILE, []);

        const cleanEmail = String(email).trim().toLowerCase();

        const user = users.find(
            item =>
                String(
```
