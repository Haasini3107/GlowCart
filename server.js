```javascript
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const productsFile = path.join(__dirname, "products.json");
const usersFile = path.join(__dirname, "users.json");
const ordersFile = path.join(__dirname, "orders.json");

function readJSON(file, defaultValue) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(
                file,
                JSON.stringify(defaultValue, null, 2)
            );
            return defaultValue;
        }

        return JSON.parse(fs.readFileSync(file, "utf8"));

    } catch (error) {
        console.error(error);
        return defaultValue;
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2)
    );
}

/* HOME */
app.get("/", (req, res) => {
    res.json({
        message: "GlowCart backend is running successfully ❤️"
    });
});

/* PRODUCTS */
app.get("/api/products", (req, res) => {

    const products = readJSON(productsFile, []);

    res.json(products);
});

/* REGISTER */
app.post("/api/register", (req, res) => {

    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
        return res.status(400).json({
            message: "Please fill all fields."
        });
    }

    const users = readJSON(usersFile, []);

    const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
        return res.status(409).json({
            message: "An account with this email already exists."
        });
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        mobile,
        password
    };

    users.push(newUser);

    writeJSON(usersFile, users);

    console.log("New user registered:", email);

    res.status(201).json({
        message: "Registration successful.",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile
        }
    });
});

/* LOGIN */
app.post("/api/login", (req, res) => {

    const { email, password } = req.body;

    const users = readJSON(usersFile, []);

    const user = users.find(
        u =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
    );

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password."
        });
    }

    res.json({
        message: "Login successful.",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile
        }
    });
});

/* PLACE ORDER */
app.post("/api/orders", (req, res) => {

    const { customer, email, items, total } = req.body;

    if (
        !customer ||
        !customer.name ||
        !customer.mobile ||
        !customer.address ||
        !customer.city ||
        !customer.pincode ||
        !items ||
        !items.length
    ) {
        return res.status(400).json({
            message: "Please complete your delivery details."
        });
    }

    const orders = readJSON(ordersFile, []);

    const newOrder = {
        orderId: "GC" + Date.now(),
        email: email || "",
        customer,
        items,
        total,
        status: "Order Placed",
        date: new Date().toISOString()
    };

    orders.push(newOrder);

    writeJSON(ordersFile, orders);

    console.log(
        "Order placed:",
        newOrder.orderId
    );

    res.status(201).json({
        message: "Order placed successfully.",
        order: newOrder
    });
});

/* ALL ORDERS */
app.get("/api/orders", (req, res) => {

    const orders = readJSON(ordersFile, []);

    res.json(orders);
});

app.listen(PORT, () => {

    console.log(
        `GlowCart backend running on port ${PORT}`
    );

});
```
