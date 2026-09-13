const express=require("express");
const cors=require("cors");
const fs=require("fs");
const path=require("path");
const {Resend}=require("resend");

const app=express();
app.use(cors());
app.use(express.json());

const PORT=process.env.PORT||10000;
const API_KEY=process.env.RESEND_API_KEY;
const EMAIL_FROM=process.env.EMAIL_FROM||"onboarding@resend.dev";
const resend=API_KEY?new Resend(API_KEY):null;

const usersFile=path.join(__dirname,"users.json");
function readUsers(){try{return JSON.parse(fs.readFileSync(usersFile,"utf8"))}catch{return []}}
function writeUsers(users){fs.writeFileSync(usersFile,JSON.stringify(users,null,2))}
function readProducts(){return JSON.parse(fs.readFileSync(path.join(__dirname,"products.json"),"utf8"))}

app.get("/",(req,res)=>res.json({success:true,status:"online",message:"GlowCart Backend is running successfully! 💖"}));
app.get("/health",(req,res)=>res.json({success:true,message:"GlowCart server is healthy"}));
app.get("/api/products",(req,res)=>{try{res.json(readProducts())}catch(e){res.status(500).json({success:false,message:"Unable to load products"})}});

async function sendEmail(to,subject,html){
  if(!resend)return {sent:false,reason:"RESEND_API_KEY is missing"};
  const result=await resend.emails.send({from:EMAIL_FROM,to:[to],subject,html});
  if(result.error) return {sent:false,reason:result.error.message||"Resend error"};
  return {sent:true};
}

app.post("/api/register",async(req,res)=>{
 const {name,email,password,mobile}=req.body;
 if(!name||!email||!password)return res.status(400).json({success:false,message:"Name, email and password are required"});
 try{
   const users=readUsers();
   if(users.some(u=>u.email.toLowerCase()===email.toLowerCase()))return res.status(409).json({success:false,message:"Email already registered. Please login."});
   users.push({name,email,password,mobile:mobile||"",createdAt:new Date().toISOString()});writeUsers(users);
   const mail=await sendEmail(email,"GlowCart Registration Successful 💖",`
   <div style="font-family:Arial;max-width:600px;margin:30px auto;padding:30px;background:#fff5fa;border-radius:18px">
   <h1 style="color:#9c27b0">Welcome to GlowCart 💖</h1>
   <p>Hello <b>${escapeHtml(name)}</b>,</p><p>Your GlowCart account was registered successfully.</p>
   <p>You can now login and start shopping for your favourite skincare products.</p>
   <p style="color:#777;text-align:center">GlowCart Team ✨</p></div>`);
   res.json({success:true,emailSent:mail.sent,message:mail.sent?"Registration successful. Email sent.":"Registration successful. Email service is not configured.",user:{name,email,mobile:mobile||""}});
 }catch(e){console.error(e);res.status(500).json({success:false,message:"Registration failed"})}
});

app.post("/api/login",async(req,res)=>{
 const {email,password}=req.body;
 if(!email||!password)return res.status(400).json({success:false,message:"Email and password are required"});
 try{
   const users=readUsers(),u=users.find(x=>x.email.toLowerCase()===email.toLowerCase());
   if(!u)return res.status(401).json({success:false,message:"Account not found. Please register first."});
   if(u.password!==password)return res.status(401).json({success:false,message:"Incorrect password."});
   const mail=await sendEmail(email,"GlowCart Login Successful 🔐",`
   <div style="font-family:Arial;max-width:600px;margin:30px auto;padding:32px;background:#fff7fb;border-radius:20px">
   <h1 style="color:#9c27b0">Login Successful 💖</h1>
   <p>Hello <b>${escapeHtml(u.name)}</b>,</p>
   <p>You have successfully logged into your GlowCart account.</p>
   <p>Welcome back! 🛍️✨</p>
   <hr><p style="color:#777;text-align:center">GlowCart Team 💕</p></div>`);
   res.json({success:true,emailSent:mail.sent,message:"Login successful",user:{name:u.name,email:u.email,mobile:u.mobile||""}});
 }catch(e){console.error(e);res.status(500).json({success:false,message:"Login failed"})}
});

app.post("/api/orders",async(req,res)=>{
 const {customer,items,total,orderId,payment}=req.body;
 if(!customer?.email||!Array.isArray(items)||!items.length)return res.status(400).json({success:false,message:"Customer email and order information are required"});
 try{
   const id=orderId||"GC"+Date.now();
   const rows=items.map(x=>`<tr><td style="padding:8px">${escapeHtml(x.name)}</td><td style="padding:8px">${x.qty}</td><td style="padding:8px">₹${x.price*x.qty}</td></tr>`).join("");
   const address=customer.address?`${escapeHtml(customer.address.address)}, ${escapeHtml(customer.address.city)} - ${escapeHtml(customer.address.pincode)}`:"";
   const mail=await sendEmail(customer.email,"GlowCart Order Confirmed 🎉",`
   <div style="font-family:Arial;max-width:650px;margin:30px auto;padding:30px;background:#fff7fb;border-radius:20px">
   <h1 style="color:#9c27b0">Order Confirmed 🎉</h1><p>Hello <b>${escapeHtml(customer.name||"Customer")}</b>,</p>
   <p>Your GlowCart order <b>${id}</b> has been placed successfully.</p>
   <table style="width:100%;border-collapse:collapse"><tr><th align="left">Product</th><th>Qty</th><th>Price</th></tr>${rows}</table>
   <p><b>Total: ₹${total}</b></p><p>Delivery: ${address}</p><p>Payment: ${escapeHtml(payment||"COD")}</p>
   <p style="color:#777;text-align:center">Thank you for shopping with GlowCart 💕</p></div>`);
   res.json({success:true,emailSent:mail.sent,orderId:id,message:mail.sent?"Order placed. Confirmation email sent.":"Order placed. Email service is not configured."});
 }catch(e){console.error(e);res.status(500).json({success:false,message:"Unable to place order"})}
});

function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

app.listen(PORT,"0.0.0.0",()=>console.log(`GlowCart backend running on port ${PORT}`));