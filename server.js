<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>GlowCart - Premium Face Creams</title>

<style>
*{box-sizing:border-box;margin:0;padding:0}

body{
    font-family:Arial,sans-serif;
    background:#fff7fc;
    color:#3b2140
}

header{
    background:linear-gradient(90deg,#7b2cbf,#d63384,#ff6f91);
    color:#fff;
    padding:18px 40px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    box-shadow:0 4px 15px #7b2cbf40
}

.logo{
    font-size:28px;
    font-weight:bold;
    cursor:pointer
}

.logo span{
    color:#ffe5f1
}

nav{
    display:flex;
    gap:6px;
    align-items:center;
    flex-wrap:wrap
}

nav button{
    background:transparent;
    border:0;
    color:#fff;
    padding:10px 12px;
    border-radius:20px;
    cursor:pointer;
    font-weight:bold
}

nav button:hover{
    background:#ffffff30
}

.page{
    display:none
}

.page.active{
    display:block
}

.btn{
    border:0;
    padding:13px 25px;
    border-radius:25px;
    background:linear-gradient(90deg,#7b2cbf,#e83e8c);
    color:white;
    font-weight:bold;
    cursor:pointer;
    font-size:15px
}

.btn:hover{
    transform:translateY(-2px)
}

.btn-white{
    background:#fff;
    color:#8e2de2
}

.btn-danger{
    background:#dc3545
}

.btn-mail{
    background:linear-gradient(90deg,#ff6f91,#e83e8c);
    padding:9px 14px;
    font-size:13px;
    white-space:nowrap
}

.container{
    width:92%;
    max-width:1150px;
    margin:auto
}

.section{
    padding:45px 20px
}

.section-title{
    text-align:center;
    color:#7b2cbf;
    font-size:32px;
    margin-bottom:25px
}

/* HOME */

.hero{
    min-height:calc(100vh - 75px);
    background:linear-gradient(135deg,#fbc2eb,#a6c1ee);
    display:flex;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:50px 20px
}

.hero-content{
    max-width:850px
}

.hero h1{
    font-size:64px;
    color:#651fff;
    margin-bottom:15px
}

.hero h2{
    font-size:30px;
    color:#8e2de2;
    margin-bottom:20px
}

.hero p{
    font-size:18px;
    line-height:1.7;
    margin-bottom:30px
}

.hero-buttons{
    display:flex;
    justify-content:center;
    gap:15px;
    flex-wrap:wrap
}

/* FORMS */

.form-page{
    padding:50px 20px;
    min-height:calc(100vh - 75px)
}

.form-box{
    max-width:600px;
    margin:20px auto;
    background:#fff;
    padding:35px;
    border-radius:20px;
    box-shadow:0 8px 30px #7b2cbf26
}

.form-box h2{
    text-align:center;
    color:#7b2cbf;
    margin-bottom:25px
}

.form-group{
    margin-bottom:16px
}

.form-group label{
    display:block;
    margin-bottom:7px;
    font-weight:bold
}

.form-group input,
.form-group textarea,
.form-group select{
    width:100%;
    padding:12px;
    border:1px solid #ddd;
    border-radius:10px;
    font-size:15px
}

.form-group textarea{
    min-height:80px;
    resize:vertical
}

.form-box .btn{
    width:100%;
    margin-top:10px
}

.message{
    margin-top:15px;
    padding:12px;
    border-radius:10px;
    display:none;
    text-align:center
}

.message.success{
    display:block;
    background:#d1e7dd;
    color:#0f5132
}

.message.error{
    display:block;
    background:#f8d7da;
    color:#842029
}

.message.info{
    display:block;
    background:#cff4fc;
    color:#055160
}

/* PRODUCTS */

.search-box{
    max-width:600px;
    margin:0 auto 30px;
    display:flex;
    gap:10px
}

.search-box input{
    flex:1;
    padding:13px;
    border:1px solid #ddd;
    border-radius:25px;
    font-size:15px
}

.products{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:25px
}

.product-card{
    background:#fff;
    border-radius:18px;
    padding:20px;
    box-shadow:0 7px 25px #7b2cbf20;
    text-align:center
}

.product-card img{
    width:100%;
    height:190px;
    object-fit:contain;
    border-radius:12px;
    margin-bottom:15px
}

.product-card h3{
    color:#7b2cbf;
    margin-bottom:8px
}

.product-card p{
    margin-bottom:10px
}

.price{
    font-size:21px;
    font-weight:bold;
    color:#e83e8c;
    margin-bottom:15px
}

.product-card .btn{
    width:100%
}

/* CART */

.cart-item{
    background:#fff;
    margin-bottom:15px;
    padding:18px;
    border-radius:15px;
    box-shadow:0 5px 15px #00000014;
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:15px
}

.cart-info{
    flex:1
}

.cart-info h3{
    color:#7b2cbf;
    margin-bottom:6px
}

.cart-actions{
    display:flex;
    gap:8px;
    align-items:center
}

.cart-total{
    background:#fff;
    padding:25px;
    margin-top:20px;
    border-radius:15px;
    box-shadow:0 5px 15px #00000014
}

.cart-total p{
    margin:8px 0
}

.grand-total{
    font-size:24px!important;
    font-weight:bold;
    color:#e83e8c
}

/* CHECKOUT */

.checkout-box{
    max-width:700px;
    margin:auto;
    background:#fff;
    padding:30px;
    border-radius:20px;
    box-shadow:0 8px 30px #7b2cbf26
}

.checkout-box h2{
    color:#7b2cbf;
    margin-bottom:20px
}

/* ORDERS */

.order-card{
    background:#fff;
    margin-bottom:20px;
    padding:25px;
    border-radius:18px;
    box-shadow:0 5px 20px #00000014
}

.order-card h3{
    color:#7b2cbf;
    margin-bottom:10px
}

.order-card p{
    margin:7px 0
}

/* ADMIN */

.admin-cards{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
    gap:20px;
    margin-bottom:30px
}

.admin-card{
    background:#fff;
    padding:25px;
    border-radius:18px;
    text-align:center;
    box-shadow:0 5px 20px #00000014
}

.admin-card h3{
    color:#7b2cbf;
    margin-bottom:10px
}

.admin-card p{
    font-size:30px;
    color:#e83e8c;
    font-weight:bold
}

.admin-table-wrapper{
    overflow-x:auto;
    background:#fff;
    border-radius:15px;
    box-shadow:0 5px 20px #00000014
}

table{
    width:100%;
    border-collapse:collapse
}

th,td{
    padding:13px;
    border-bottom:1px solid #eee;
    text-align:left
}

th{
    background:#7b2cbf;
    color:#fff;
    white-space:nowrap
}

tr:hover{
    background:#fff5fb
}

footer{
    background:#3b2140;
    color:#fff;
    text-align:center;
    padding:20px;
    margin-top:40px
}

@media(max-width:700px){

    header{
        padding:15px;
        flex-direction:column;
        gap:10px
    }

    .hero h1{
        font-size:42px
    }

    .hero h2{
        font-size:24px
    }

    nav{
        justify-content:center
    }

    nav button{
        font-size:12px;
        padding:8px
    }

    .cart-item{
        flex-direction:column;
        align-items:flex-start
    }
}
</style>
</head>

<body>

<!-- =====================================================
     HOME HEADER
===================================================== -->

<header id="homeHeader">

    <div class="logo" onclick="showHome()">
        ✨ Glow<span>Cart</span>
    </div>

    <button
        type="button"
        class="btn btn-white"
        onclick="showAdminLogin()"
        style="padding:10px 20px">
        👑 Admin
    </button>

</header>


<!-- =====================================================
     LOGGED HEADER
===================================================== -->

<header id="loggedHeader">

    <div class="logo" onclick="showHome()">
        ✨ Glow<span>Cart</span>
    </div>

    <nav>

        <button onclick="showHome()">Home</button>

        <button onclick="startShopping()">Shop</button>

        <button onclick="openCart()">
            🛒 Cart <span id="cartCount">0</span>
        </button>

        <button onclick="openOrders()">📦 Orders</button>

        <button onclick="showRegister()">Register</button>

        <button onclick="showLogin()">Login</button>

        <button onclick="showAdminLogin()">👑 Admin</button>

        <button onclick="logout()">Logout</button>

    </nav>

</header>


<!-- =====================================================
     HOME
===================================================== -->

<section id="homePage" class="page active">

    <div class="hero">

        <div class="hero-content">

            <h1>GlowCart</h1>

            <h2>Premium Face Creams</h2>

            <p>
                Discover premium face creams for beautiful,
                healthy and glowing skin.
                Shop your favourite skincare products at affordable prices.
            </p>

            <div class="hero-buttons">

                <button
                    type="button"
                    class="btn"
                    onclick="showRegister()">
                    Register
                </button>

                <button
                    type="button"
                    class="btn btn-white"
                    onclick="showLogin()">
                    Login
                </button>

            </div>

        </div>

    </div>

</section>


<!-- =====================================================
     REGISTER
===================================================== -->

<section id="registerPage" class="page form-page">

    <div class="form-box">

        <h2>✨ Create Your GlowCart Account</h2>

        <form id="registerForm">

            <div class="form-group">

                <label>Full Name</label>

                <input
                    id="regName"
                    type="text"
                    required
                    placeholder="Enter your full name">

            </div>


            <div class="form-group">

                <label>Email</label>

                <input
                    id="regEmail"
                    type="email"
                    required
                    placeholder="Enter your email">

            </div>


            <div class="form-group">

                <label>Mobile Number</label>

                <input
                    id="regMobile"
                    type="tel"
                    required
                    placeholder="Enter mobile number">

            </div>


            <div class="form-group">

                <label>Password</label>

                <input
                    id="regPassword"
                    type="password"
                    required
                    placeholder="Create password">

            </div>


            <!-- ADDRESS ONLY DURING REGISTRATION -->

            <div class="form-group">

                <label>Permanent Address</label>

                <textarea
                    id="regAddress"
                    required
                    placeholder="Enter permanent address"></textarea>

            </div>


            <div class="form-group">

                <label>Second Address - Optional</label>

                <textarea
                    id="regAddress2"
                    placeholder="Enter second address (optional)"></textarea>

            </div>


            <div class="form-group">

                <label>Pincode</label>

                <input
                    id="regPincode"
                    type="text"
                    required
                    placeholder="Enter pincode">

            </div>


            <button
                class="btn"
                type="submit">
                Register
            </button>

        </form>


        <div
            id="registerMessage"
            class="message">
        </div>


        <p style="text-align:center;margin-top:18px">

            Already registered?

            <button
                type="button"
                class="btn"
                style="padding:8px 15px"
                onclick="showLogin()">
                Login
            </button>

        </p>

    </div>

</section>


<!-- =====================================================
     LOGIN
===================================================== -->

<section id="loginPage" class="page form-page">

    <div class="form-box">

        <h2>🔐 Login to GlowCart</h2>

        <form id="loginForm">

            <div class="form-group">

                <label>Email</label>

                <input
                    id="loginEmail"
                    type="email"
                    required
                    placeholder="Enter registered email">

            </div>


            <div class="form-group">

                <label>Password</label>

                <input
                    id="loginPassword"
                    type="password"
                    required
                    placeholder="Enter password">

            </div>


            <button
                class="btn"
                type="submit">
                Login
            </button>

        </form>


        <div
            id="loginMessage"
            class="message">
        </div>


        <p style="text-align:center;margin-top:18px">

            Don't have an account?

            <button
                type="button"
                class="btn"
                style="padding:8px 15px"
                onclick="showRegister()">
                Register
            </button>

        </p>

    </div>

</section>


<!-- =====================================================
     SHOP
===================================================== -->

<section id="shopPage" class="page section">

    <div class="container">

        <h2 class="section-title">
            🛍️ Premium Face Creams
        </h2>

        <div class="search-box">

            <input
                id="searchInput"
                type="text"
                placeholder="Search face creams..."
                oninput="filterProducts()">

            <button
                class="btn"
                type="button"
                onclick="loadProducts()">
                Refresh
            </button>

        </div>

        <div
            id="productMessage"
            class="message">
        </div>

        <div
            id="productsContainer"
            class="products">
        </div>

    </div>

</section>


<!-- =====================================================
     CART
===================================================== -->

<section id="cartPage" class="page section">

    <div class="container">

        <h2 class="section-title">
            🛒 Your Cart
        </h2>

        <div id="cartContainer"></div>

        <div id="cartTotalBox"></div>

    </div>

</section>


<!-- =====================================================
     CHECKOUT
===================================================== -->

<section id="checkoutPage" class="page section">

    <div class="container">

        <div class="checkout-box">

            <h2>🧾 Place Your Order</h2>

            <div id="checkoutSummary"></div>


            <div class="form-group">

                <label>Select Address</label>

                <select id="checkoutAddress">

                    <option value="permanent">
                        Permanent Address
                    </option>

                    <option
                        value="second"
                        id="secondAddressOption">
                        Second Address
                    </option>

                </select>

            </div>


            <div
                id="checkoutAddressText"
                style="background:#fff5fb;padding:15px;border-radius:10px;margin-bottom:20px">
            </div>


            <div class="form-group">

                <label>Payment Method</label>

                <select id="paymentMethod">

                    <option value="Cash on Delivery">
                        Cash on Delivery
                    </option>

                    <option value="UPI">
                        UPI
                    </option>

                    <option value="Card">
                        Card
                    </option>

                </select>

            </div>


            <button
                type="button"
                class="btn"
                onclick="placeOrder()">
                Place Order
            </button>


            <div
                id="orderMessage"
                class="message">
            </div>

        </div>

    </div>

</section>


<!-- =====================================================
     ORDERS
===================================================== -->

<section id="ordersPage" class="page section">

    <div class="container">

        <h2 class="section-title">
            📦 My Orders
        </h2>

        <div id="ordersContainer"></div>

    </div>

</section>


<!-- =====================================================
     ADMIN LOGIN
===================================================== -->

<section id="adminLoginPage" class="page form-page">

    <div class="form-box">

        <h2>👑 GlowCart Admin Login</h2>

        <form id="adminLoginForm">

            <div class="form-group">

                <label>Admin Email</label>

                <input
                    id="adminEmail"
                    type="email"
                    required
                    placeholder="Enter admin email">

            </div>


            <div class="form-group">

                <label>Admin Password</label>

                <input
                    id="adminPassword"
                    type="password"
                    required
                    placeholder="Enter admin password">

            </div>


            <button
                class="btn"
                type="submit">
                Admin Login
            </button>

        </form>


        <div
            id="adminLoginMessage"
            class="message">
        </div>


        <p style="text-align:center;margin-top:18px">

            <button
                type="button"
                class="btn"
                style="padding:8px 20px"
                onclick="showHome()">
                Back to Home
            </button>

        </p>

    </div>

</section>


<!-- =====================================================
     ADMIN DASHBOARD
===================================================== -->

<section id="adminPage" class="page section">

    <div class="container">

        <h2 class="section-title">
            👑 GlowCart Admin Dashboard
        </h2>


        <div class="admin-cards">

            <div class="admin-card">

                <h3>Registered Members</h3>

                <p id="memberCount">0</p>

            </div>


            <div class="admin-card">

                <h3>Total Orders</h3>

                <p id="adminOrderCount">0</p>

            </div>


            <div class="admin-card">

                <h3>Total Products</h3>

                <p id="adminProductCount">0</p>

            </div>

        </div>


        <h2 style="color:#7b2cbf;margin-bottom:15px">
            Registered Members
        </h2>


        <div class="admin-table-wrapper">

            <table>

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Name</th>

                        <th>Email</th>

                        <th>Mobile</th>

                        <th>Permanent Address</th>

                        <th>Second Address</th>

                        <th>Pincode</th>

                        <th>Registered At</th>

                        <th>Welcome Mail</th>

                    </tr>

                </thead>


                <tbody id="membersTableBody"></tbody>

            </table>

        </div>


        <br>


        <button
            type="button"
            class="btn"
            onclick="loadAdminData()">
            🔄 Refresh Members
        </button>


        <button
            type="button"
            class="btn btn-danger"
            onclick="adminLogout()">
            Admin Logout
        </button>


        <div
            id="adminMessage"
            class="message">
        </div>

    </div>

</section>


<footer>
    © 2026 GlowCart - Premium Face Creams
</footer>


<script>

/* =====================================================
   API
===================================================== */

const API = "https://glowcart-fxwp.onrender.com";

const GST_RATE = 18;


/* =====================================================
   VARIABLES
===================================================== */

let currentUser = null;

let products = [];

let cart = [];

let orders = [];

let adminToken = null;


/* =====================================================
   LOAD SAVED DATA
===================================================== */

function loadSavedUser(){

    try{

        const saved =
            localStorage.getItem("glowcart_user");

        if(saved){

            currentUser =
                JSON.parse(saved);

            document.body.classList.add(
                "logged-in"
            );

        }else{

            currentUser = null;

        }

    }catch(error){

        currentUser = null;

        localStorage.removeItem(
            "glowcart_user"
        );

    }

}


function loadAdminToken(){

    adminToken =
        localStorage.getItem(
            "glowcart_admin_token"
        );
}


/* =====================================================
   SAVE USER
===================================================== */

function saveUser(){

    localStorage.setItem(
        "glowcart_user",
        JSON.stringify(currentUser)
    );

    document.body.classList.add(
        "logged-in"
    );
}


/* =====================================================
   PAGE
===================================================== */

function showPage(id){

    document
    .querySelectorAll(".page")
    .forEach(function(page){

        page.classList.remove("active");

    });


    const page =
        document.getElementById(id);

    if(page){

        page.classList.add("active");

    }

}


/* =====================================================
   HOME
===================================================== */

function showHome(){

    showPage("homePage");

}


/* =====================================================
   REGISTER
===================================================== */

function showRegister(){

    showPage("registerPage");

    clearMessages();

}


/* =====================================================
   LOGIN
===================================================== */

function showLogin(){

    showPage("loginPage");

    clearMessages();

}


/* =====================================================
   ADMIN LOGIN
===================================================== */

function showAdminLogin(){

    showPage("adminLoginPage");

    clearMessages();

}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(id,text,type){

    const el =
        document.getElementById(id);

    if(!el)return;

    el.className =
        "message " + type;

    el.textContent = text;

}


function clearMessages(){

    document
    .querySelectorAll(".message")
    .forEach(function(el){

        el.className = "message";

        el.textContent = "";

    });

}


/* =====================================================
   LOGIN REQUIRED
===================================================== */

function requireLogin(message){

    if(!currentUser){

        showLogin();

        showMessage(
            "loginMessage",
            message || "Please login first.",
            "info"
        );

        return false;

    }

    return true;

}


/* =====================================================
   REGISTER
===================================================== */

document
.getElementById("registerForm")
.addEventListener(
"submit",
async function(e){

    e.preventDefault();


    const name =
        document
        .getElementById("regName")
        .value.trim();


    const email =
        document
        .getElementById("regEmail")
        .value.trim()
        .toLowerCase();


    const mobile =
        document
        .getElementById("regMobile")
        .value.trim();


    const password =
        document
        .getElementById("regPassword")
        .value;


    const address =
        document
        .getElementById("regAddress")
        .value.trim();


    const address2 =
        document
        .getElementById("regAddress2")
        .value.trim();


    const pincode =
        document
        .getElementById("regPincode")
        .value.trim();


    showMessage(
        "registerMessage",
        "Registering...",
        "info"
    );


    try{

        const response =
            await fetch(
                API + "/api/register",
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        name:name,

                        fullName:name,

                        email:email,

                        mobile:mobile,

                        password:password,

                        address:address,

                        address2:address2,

                        pincode:pincode

                    })
                }
            );


        const data =
            await response.json();


        if(!response.ok){

            throw new Error(
                data.message ||
                "Registration failed."
            );

        }


        showMessage(
            "registerMessage",
            data.emailSent === false
                ? "✅ Registration successful. Welcome email could not be sent."
                : "✅ Registration successful! Welcome email sent. Please login.",
            data.emailSent === false
                ? "info"
                : "success"
        );


        document
        .getElementById("registerForm")
        .reset();


        setTimeout(function(){

            showLogin();

            document
            .getElementById("loginEmail")
            .value = email;

        },1500);


    }catch(error){

        showMessage(
            "registerMessage",
            "❌ " + error.message,
            "error"
        );

    }

});


/* =====================================================
   CUSTOMER LOGIN
===================================================== */

document
.getElementById("loginForm")
.addEventListener(
"submit",
async function(e){

    e.preventDefault();


    const email =
        document
        .getElementById("loginEmail")
        .value.trim()
        .toLowerCase();


    const password =
        document
        .getElementById("loginPassword")
        .value;


    showMessage(
        "loginMessage",
        "Logging in...",
        "info"
    );


    try{

        const response =
            await fetch(
                API + "/api/login",
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({
                        email:email,
                        password:password
                    })
                }
            );


        const data =
            await response.json();


        if(!response.ok){

            throw new Error(
                data.message ||
                "Invalid email or password."
            );

        }


        if(!data.user){

            throw new Error(
                "Login response did not contain user information."
            );

        }


        currentUser = data.user;


        saveUser();

        loadCart();

        updateCartCount();


        showMessage(
            "loginMessage",
            "✅ Login successful!",
            "success"
        );


        setTimeout(function(){

            showPage("shopPage");

            loadProducts();

        },800);


    }catch(error){

        console.error(error);

        showMessage(
            "loginMessage",
            "❌ " + error.message,
            "error"
        );

    }

});


/* =====================================================
   SHOP
===================================================== */

function startShopping(){

    if(
        !requireLogin(
            "Please login first to access Shop."
        )
    ){
        return;
    }


    showPage("shopPage");

    loadProducts();

}


/* =====================================================
   PRODUCTS
===================================================== */

async function loadProducts(){

    if(
        !requireLogin(
            "Please login first to access Shop."
        )
    ){
        return;
    }


    const container =
        document.getElementById(
            "productsContainer"
        );


    container.innerHTML =
        "<p>Loading products...</p>";


    try{

        const response =
            await fetch(
                API + "/api/products"
            );


        const data =
            await response.json();


        products =
            Array.isArray(data.products)
                ? data.products
                : Array.isArray(data)
                    ? data
                    : [];


        renderProducts(products);


    }catch(error){

        console.error(error);

        container.innerHTML =
            "<p>Could not load products.</p>";

    }

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(list){

    const container =
        document.getElementById(
            "productsContainer"
        );


    if(!list.length){

        container.innerHTML =
            "<p>No products found.</p>";

        return;

    }


    container.innerHTML =
        list.map(function(product){

            const id =
                String(
                    product.id ??
                    product._id ??
                    product.productId ??
                    product.name
                );


            const name =
                product.name ||
                product.title ||
                "Face Cream";


            const price =
                Number(
                    product.price ??
                    product.amount ??
                    0
                );


            const image =
                product.image ||
                "https://via.placeholder.com/300x220?text=GlowCart";


            return `

            <div class="product-card">

                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(name)}"
                    onerror="this.src='https://via.placeholder.com/300x220?text=GlowCart'">

                <h3>
                    ${escapeHtml(name)}
                </h3>

                <p>
                    Premium skincare product
                </p>

                <div class="price">
                    ₹${price.toFixed(2)}
                </div>

                <button
                    type="button"
                    class="btn"
                    onclick="addToCartById('${encodeURIComponent(id)}')">

                    🛒 Add to Cart

                </button>

            </div>

            `;

        }).join("");

}


/* =====================================================
   SEARCH
===================================================== */

function filterProducts(){

    const text =
        document
        .getElementById("searchInput")
        .value
        .toLowerCase();


    const filtered =
        products.filter(function(product){

            return String(
                product.name ||
                product.title ||
                ""
            )
            .toLowerCase()
            .includes(text);

        });


    renderProducts(filtered);

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCartById(encodedId){

    if(
        !requireLogin(
            "Please login first to add products to your cart."
        )
    ){
        return;
    }


    const id =
        decodeURIComponent(encodedId);


    const product =
        products.find(function(item){

            return String(
                item.id ??
                item._id ??
                item.productId ??
                item.name
            ) === id;

        });


    if(!product){

        alert("Product not found.");

        return;

    }


    const productId =
        String(
            product.id ??
            product._id ??
            product.productId ??
            product.name
        );


    const existing =
        cart.find(function(item){

            return String(item.id) === productId;

        });


    if(existing){

        existing.quantity++;

    }else{

        cart.push({

            id:productId,

            name:
                product.name ||
                product.title ||
                "Face Cream",

            price:
                Number(
                    product.price ??
                    product.amount ??
                    0
                ),

            image:
                product.image || "",

            quantity:1

        });

    }


    saveCart();

    updateCartCount();


    showMessage(
        "productMessage",
        "🛒 Product added to cart!",
        "success"
    );

}


/* =====================================================
   CART
===================================================== */

function cartKey(){

    return currentUser
        ? "glowcart_cart_" +
          String(
              currentUser.email
          ).toLowerCase()
        : "glowcart_cart_guest";

}


function loadCart(){

    try{

        const saved =
            localStorage.getItem(
                cartKey()
            );


        cart =
            saved
                ? JSON.parse(saved)
                : [];


        if(!Array.isArray(cart)){

            cart=[];

        }

    }catch(error){

        cart=[];

    }

}


function saveCart(){

    localStorage.setItem(
        cartKey(),
        JSON.stringify(cart)
    );

}


function updateCartCount(){

    const count =
        cart.reduce(
            function(total,item){

                return total +
                    Number(
                        item.quantity || 0
                    );

            },
            0
        );


    document.getElementById(
        "cartCount"
    ).textContent = count;

}


function openCart(){

    if(
        !requireLogin(
            "Please login first to access your cart."
        )
    ){
        return;
    }


    showPage("cartPage");

    renderCart();

}


function renderCart(){

    const container =
        document.getElementById(
            "cartContainer"
        );


    const totalBox =
        document.getElementById(
            "cartTotalBox"
        );


    if(!cart.length){

        container.innerHTML = `

            <div style="
                text-align:center;
                background:white;
                padding:40px;
                border-radius:20px">

                <h3>
                    Your cart is empty 🛒
                </h3>

                <br>

                <button
                    class="btn"
                    type="button"
                    onclick="startShopping()">

                    Continue Shopping

                </button>

            </div>

        `;

        totalBox.innerHTML = "";

        return;

    }


    container.innerHTML =
        cart.map(function(item,index){

            const total =
                Number(item.price) *
                Number(item.quantity);


            return `

            <div class="cart-item">

                <div class="cart-info">

                    <h3>
                        ${escapeHtml(item.name)}
                    </h3>

                    <p>
                        Price:
                        ₹${Number(item.price).toFixed(2)}
                    </p>

                    <p>
                        Quantity:
                        ${item.quantity}
                    </p>

                    <p>
                        Total:
                        ₹${total.toFixed(2)}
                    </p>

                </div>

                <div class="cart-actions">

                    <button
                        class="btn"
                        type="button"
                        onclick="changeQuantity(${index},-1)">
                        −
                    </button>

                    <button
                        class="btn"
                        type="button"
                        onclick="changeQuantity(${index},1)">
                        +
                    </button>

                    <button
                        class="btn btn-danger"
                        type="button"
                        onclick="removeFromCart(${index})">
                        Remove
                    </button>

                </div>

            </div>

            `;

        }).join("");


    const subtotal =
        cart.reduce(
            function(total,item){

                return total +
                    Number(item.price) *
                    Number(item.quantity);

            },
            0
        );


    const gst =
        subtotal * GST_RATE / 100;


    const total =
        subtotal + gst;


    totalBox.innerHTML = `

        <div class="cart-total">

            <p>
                Subtotal:
                <strong>
                    ₹${subtotal.toFixed(2)}
                </strong>
            </p>

            <p>
                GST (${GST_RATE}%):
                <strong>
                    ₹${gst.toFixed(2)}
                </strong>
            </p>

            <p class="grand-total">
                Grand Total:
                ₹${total.toFixed(2)}
            </p>

            <br>

            <button
                class="btn"
                type="button"
                onclick="openCheckout()">

                Proceed to Place Order

            </button>

        </div>

    `;

}


function changeQuantity(index,change){

    if(!cart[index])return;


    cart[index].quantity += change;


    if(cart[index].quantity <= 0){

        cart.splice(index,1);

    }


    saveCart();

    updateCartCount();

    renderCart();

}


function removeFromCart(index){

    cart.splice(index,1);

    saveCart();

    updateCartCount();

    renderCart();

}


/* =====================================================
   CHECKOUT
===================================================== */

function openCheckout(){

    if(
        !requireLogin(
            "Please login first to place an order."
        )
    ){
        return;
    }


    if(!cart.length){

        alert("Your cart is empty.");

        return;

    }


    showPage("checkoutPage");

    renderCheckout();

}


document
.getElementById("checkoutAddress")
.addEventListener(
    "change",
    updateCheckoutAddress
);


function renderCheckout(){

    const subtotal =
        cart.reduce(
            function(total,item){

                return total +
                    Number(item.price) *
                    Number(item.quantity);

            },
            0
        );


    const gst =
        subtotal * GST_RATE / 100;


    const total =
        subtotal + gst;


    document.getElementById(
        "checkoutSummary"
    ).innerHTML = `

        <div style="
            background:#fff5fb;
            padding:18px;
            border-radius:12px;
            margin-bottom:20px">

            <p>
                Subtotal:
                ₹${subtotal.toFixed(2)}
            </p>

            <p>
                GST ${GST_RATE}%:
                ₹${gst.toFixed(2)}
            </p>

            <p style="
                font-size:22px;
                font-weight:bold;
                color:#e83e8c">

                Total:
                ₹${total.toFixed(2)}

            </p>

        </div>

    `;


    const secondOption =
        document.getElementById(
            "secondAddressOption"
        );


    if(
        currentUser.address2 &&
        currentUser.address2.trim()
    ){

        secondOption.style.display = "block";

    }else{

        secondOption.style.display = "none";

        document.getElementById(
            "checkoutAddress"
        ).value = "permanent";

    }


    updateCheckoutAddress();

}


function updateCheckoutAddress(){

    if(!currentUser)return;


    const selected =
        document.getElementById(
            "checkoutAddress"
        ).value;


    let address = "";


    if(selected === "second"){

        address =
            currentUser.address2 ||
            currentUser.address ||
            "";

    }else{

        address =
            currentUser.address ||
            "";

    }


    const pincode =
        currentUser.pincode || "";


    document.getElementById(
        "checkoutAddressText"
    ).textContent =
        address +
        (
            pincode
                ? " - " + pincode
                : ""
        );

}


/* =====================================================
   PLACE ORDER
===================================================== */

async function placeOrder(){

    if(
        !currentUser ||
        !cart.length
    ){
        return;
    }


    const selected =
        document.getElementById(
            "checkoutAddress"
        ).value;


    const address =
        selected === "second"
            ? currentUser.address2 ||
              currentUser.address
            : currentUser.address;


    const payment =
        document.getElementById(
            "paymentMethod"
        ).value;


    const subtotal =
        cart.reduce(
            function(total,item){

                return total +
                    Number(item.price) *
                    Number(item.quantity);

            },
            0
        );


    const gst =
        subtotal * GST_RATE / 100;


    const total =
        subtotal + gst;


    showMessage(
        "orderMessage",
        "Placing order...",
        "info"
    );


    try{

        const response =
            await fetch(
                API + "/api/orders",
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({

                        userId:
                            currentUser.id,

                        name:
                            currentUser.name ||
                            currentUser.fullName,

                        email:
                            currentUser.email,

                        mobile:
                            currentUser.mobile,

                        address:
                            address,

                        address2:
                            currentUser.address2 || "",

                        pincode:
                            currentUser.pincode,

                        paymentMethod:
                            payment,

                        items:
                            cart,

                        subtotal:
                            subtotal,

                        gst:
                            gst,

                        total:
                            total

                    })
                }
            );


        const data =
            await response.json();


        if(!response.ok){

            throw new Error(
                data.message ||
                "Order failed."
            );

        }


        cart=[];

        saveCart();

        updateCartCount();


        showMessage(
            "orderMessage",
            data.emailSent === false
                ? "🎉 Order placed. Confirmation email could not be sent."
                : "🎉 Order placed successfully! Confirmation email sent.",
            data.emailSent === false
                ? "info"
                : "success"
        );


        setTimeout(
            openOrders,
            1500
        );


    }catch(error){

        showMessage(
            "orderMessage",
            "❌ " + error.message,
            "error"
        );

    }

}


/* =====================================================
   ORDERS
===================================================== */

async function openOrders(){

    if(
        !requireLogin(
            "Please login first to view your orders."
        )
    ){
        return;
    }


    showPage("ordersPage");

    await loadOrders();

}


async function loadOrders(){

    const container =
        document.getElementById(
            "ordersContainer"
        );


    container.innerHTML =
        "<p>Loading orders...</p>";


    try{

        const response =
            await fetch(
                API +
                "/api/orders/user/" +
                encodeURIComponent(
                    currentUser.email
                )
            );


        const data =
            await response.json();


        orders =
            Array.isArray(data.orders)
                ? data.orders
                : [];


        renderOrders();


    }catch(error){

        container.innerHTML =
            "<p>Could not load orders.</p>";

    }

}


function renderOrders(){

    const container =
        document.getElementById(
            "ordersContainer"
        );


    if(!orders.length){

        container.innerHTML = `

            <div style="
                text-align:center;
                background:white;
                padding:40px;
                border-radius:20px">

                <h3>
                    No orders yet 📦
                </h3>

                <br>

                <button
                    class="btn"
                    type="button"
                    onclick="startShopping()">

                    Start Shopping

                </button>

            </div>

        `;

        return;

    }


    container.innerHTML =
        orders.map(function(order){

            const items =
                Array.isArray(order.items)
                    ? order.items
                    : [];


            const text =
                items.map(
                    function(x){

                        return (
                            x.name +
                            " × " +
                            (x.quantity || 1)
                        );

                    }
                ).join(", ");


            return `

            <div class="order-card">

                <h3>
                    📦 Order #${escapeHtml(
                        order.orderId ||
                        order.order_id ||
                        order.id
                    )}
                </h3>

                <p>
                    <strong>Items:</strong>
                    ${escapeHtml(text)}
                </p>

                <p>
                    <strong>Total:</strong>
                    ₹${Number(
                        order.total || 0
                    ).toFixed(2)}
                </p>

                <p>
                    <strong>Payment:</strong>
                    ${escapeHtml(
                        order.paymentMethod ||
                        order.payment_method ||
                        "Cash on Delivery"
                    )}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${escapeHtml(
                        order.status ||
                        "Placed"
                    )}
                </p>

            </div>

            `;

        }).join("");

}


/* =====================================================
   ADMIN LOGIN
===================================================== */

document
.getElementById("adminLoginForm")
.addEventListener(
"submit",
async function(e){

    e.preventDefault();


    const email =
        document
        .getElementById("adminEmail")
        .value.trim();


    const password =
        document
        .getElementById("adminPassword")
        .value;


    showMessage(
        "adminLoginMessage",
        "Checking admin login...",
        "info"
    );


    try{

        const response =
            await fetch(
                API + "/api/admin/login",
                {
                    method:"POST",

                    headers:{
                        "Content-Type":
                            "application/json"
                    },

                    body:JSON.stringify({
                        email:email,
                        password:password
                    })
                }
            );


        const data =
            await response.json();


        if(!response.ok){

            throw new Error(
                data.message ||
                "Invalid admin login."
            );

        }


        if(!data.token){

            throw new Error(
                "Admin token was not received."
            );

        }


        adminToken =
            data.token;


        localStorage.setItem(
            "glowcart_admin_token",
            adminToken
        );


        showPage("adminPage");

        await loadAdminData();


    }catch(error){

        showMessage(
            "adminLoginMessage",
            "❌ " + error.message,
            "error"
        );

    }

});


/* =====================================================
   ADMIN DATA
===================================================== */

async function loadAdminData(){

    if(!adminToken){

        showAdminLogin();

        showMessage(
            "adminLoginMessage",
            "Please login as admin first.",
            "info"
        );

        return;

    }


    try{

        const response =
            await fetch(
                API + "/api/admin/users",
                {
                    method:"GET",

                    headers:{
                        "Authorization":
                            "Bearer " +
                            adminToken
                    }
                }
            );


        if(response.status === 401){

            localStorage.removeItem(
                "glowcart_admin_token"
            );

            adminToken = null;

            showAdminLogin();

            showMessage(
                "adminLoginMessage",
                "Admin session expired. Please login again.",
                "error"
            );

            return;

        }


        const data =
            await response.json();


        if(!response.ok){

            throw new Error(
                data.message ||
                "Could not load members."
            );

        }


        const members =
            Array.isArray(data.users)
                ? data.users
                : [];


        document.getElementById(
            "memberCount"
        ).textContent =
            members.length;


        const tbody =
            document.getElementById(
                "membersTableBody"
            );


        if(!members.length){

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="9"
                        style="
                            text-align:center;
                            padding:25px">

                        No registered members yet.

                    </td>

                </tr>

            `;

        }else{

            tbody.innerHTML =
                members.map(function(user){

                    return `

                    <tr>

                        <td>
                            ${escapeHtml(user.id)}
                        </td>

                        <td>
                            ${escapeHtml(
                                user.name ||
                                user.fullName ||
                                user.full_name ||
                                ""
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                user.email || ""
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                user.mobile || ""
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                user.address || ""
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                user.address2 || ""
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                user.pincode || ""
                            )}
                        </td>

                        <td>
                            ${
                                user.registeredAt ||
                                user.created_at
                                    ? new Date(
                                        user.registeredAt ||
                                        user.created_at
                                      ).toLocaleString()
                                    : "-"
                            }
                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn btn-mail"
                                onclick="resendWelcomeEmail(${Number(user.id)}, this)">

                                📧 Resend Mail

                            </button>

                        </td>

                    </tr>

                    `;

                }).join("");

        }


        /* DASHBOARD STATISTICS */

        const dashboardResponse =
            await fetch(
                API + "/api/admin/dashboard",
                {
                    method:"GET",

                    headers:{
                        "Authorization":
                            "Bearer " +
                            adminToken
                    }
                }
            );


        if(dashboardResponse.ok){

            const dashboard =
                await dashboardResponse.json();


            const stats =
                dashboard.statistics ||
                dashboard.dashboard ||
                {};


            document.getElementById(
                "memberCount"
            ).textContent =
                stats.registeredMembers ??
                members.length;


            document.getElementById(
                "adminOrderCount"
            ).textContent =
                stats.totalOrders ??
                stats.orders ??
                0;


            document.getElementById(
                "adminProductCount"
            ).textContent =
                stats.totalProducts ??
                stats.products ??
                0;

        }


    }catch(error){

        console.error(
            "ADMIN DATA ERROR:",
            error
        );


        document.getElementById(
            "membersTableBody"
        ).innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        color:red;
                        padding:25px">

                    ❌ ${escapeHtml(
                        error.message
                    )}

                </td>

            </tr>

        `;

    }

}


/* =====================================================
   RESEND WELCOME EMAIL
   THIS IS THE NEW ADMIN FEATURE
===================================================== */

async function resendWelcomeEmail(userId,button){

    if(!adminToken){

        alert(
            "Admin session expired. Please login again."
        );

        showAdminLogin();

        return;

    }


    if(!userId){

        alert("Invalid member ID.");

        return;

    }


    const originalText =
        button.textContent;


    button.disabled = true;

    button.textContent =
        "📨 Sending...";


    try{

        const response =
            await fetch(
                API +
                "/api/admin/users/" +
                encodeURIComponent(userId) +
                "/resend-welcome",
                {
                    method:"POST",

                    headers:{
                        "Authorization":
                            "Bearer " +
                            adminToken,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if(response.status === 401){

            localStorage.removeItem(
                "glowcart_admin_token"
            );

            adminToken = null;

            alert(
                "Admin session expired. Please login again."
            );

            showAdminLogin();

            return;

        }


        if(!response.ok){

            throw new Error(
                data.message ||
                "Welcome email could not be sent."
            );

        }


        button.textContent =
            "✅ Sent";


        alert(
            "✅ Welcome email resent successfully!"
        );


        setTimeout(function(){

            button.disabled = false;

            button.textContent =
                originalText;

        },2000);


    }catch(error){

        console.error(
            "RESEND EMAIL ERROR:",
            error
        );


        alert(
            "❌ " + error.message
        );


        button.disabled = false;

        button.textContent =
            originalText;

    }

}


/* =====================================================
   ADMIN LOGOUT
===================================================== */

function adminLogout(){

    adminToken = null;


    localStorage.removeItem(
        "glowcart_admin_token"
    );


    showHome();

}


/* =====================================================
   CUSTOMER LOGOUT
===================================================== */

function logout(){

    currentUser = null;

    cart = [];


    localStorage.removeItem(
        "glowcart_user"
    );


    document.body.classList.remove(
        "logged-in"
    );


    updateCartCount();

    showHome();

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value){

    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


/* =====================================================
   START
===================================================== */

loadSavedUser();

loadAdminToken();

loadCart();

updateCartCount();

showPage("homePage");

</script>

</body>
</html>
