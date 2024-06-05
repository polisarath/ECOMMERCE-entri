require("dotenv").config();
const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { error } = require("console");
app.use(express.json());
app.use(cors());

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.log("MongoDB connection error: ", error));

// API creation
app.get("/", (req, res) => {
  res.send("Express app is running");
});

app.listen(port, (error) => {
  if (!error) {
    console.log("Server connected on port " + port);
  } else {
    console.log("Error: " + error);
  }
});

// Image storage
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

// Creating an endpoint for uploading images
app.use("/images", express.static(path.join(__dirname, "upload/images")));
app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

//schema for create product
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    requied: true,
  },
  old_price: {
    type: Number,
    requied: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
  });
  console.log(product);
  await product.save();
  console.log("saved");
  res.json({
    success: true,
    name: req.body.name,
  });
});

//delete product from databse

app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

//create api for getting all products

app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("all products fetched");
  res.send(products);
});
// schema for user model

const Users = mongoose.model("Users", {
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  cartData: {
    type: Object,
    default: {},
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Creating end point for create user
// app.post("/signup", async (req, res) => {
//   let check = await Users.findOne({ email: req.body.email });
//   if (check) {
//     return res
//       .status(400)
//       .json({ success: false, error: "existing user found with same email" });
//   }
//   let cart = {};
//   for (let i = 0; i < 300; i++) {
//     cart[i] = 0;
//   }
//   const User = new Users({
//     name: req.body.username,
//     email: req.body.email,
//     password: req.body.password,
//     cartData: cart,
//   });
//   await User.save();

//   const data = {
//     user: {
//       id: User.id,
//     },
//   };
//   const token = jwt.sign(data, "secert_ecom");
//   res.json({
//     success: true,
//     token,
//   });
// });

//creating endpoint for user login

app.post("/signup", async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({
      success: false,
      error: "Existing user found with the same email",
    });
  }

  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }

  const User = new Users({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await User.save();

  const data = { user: { id: User._id, name: User.name, email: User.email } };
  const token = jwt.sign(data, "secert_ecom");
  res.json({ success: true, token });
});

//login user

// app.post("/login", async (req, res) => {
//   let User = await Users.findOne({ email: req.body.email });
//   if (User) {
//     const passCompare = req.body.password === User.password;
//     if (passCompare) {
//       const data = {
//         User: {
//           id: User.id,
//         },
//       };
//       const token = jwt.sign(data, "secert_ecom");
//       res.json({ success: true, token });
//     } else {
//       res.json({ success: false, error: "Wrong Password" });
//     }
//   } else {
//     res.json({ success: false, errors: "wrong email id" });
//   }
// });

app.post("/login", async (req, res) => {
  let User = await Users.findOne({ email: req.body.email });
  if (User) {
    const passCompare = req.body.password === User.password;
    if (passCompare) {
      const data = {
        user: { id: User._id, name: User.name, email: User.email },
      };
      const token = jwt.sign(data, "secert_ecom");
      res.json({ success: true, token });
    } else {
      res.json({ success: false, error: "Wrong Password" });
    }
  } else {
    res.json({ success: false, errors: "Wrong email id" });
  }
});

// creating endpoint for newcollection

app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("newcollection fetch");
  res.send(newcollection);
});

//creating endpoint for pop collection
// app.get('/popularinwomen',async(req,res)=>{
//   let product=await product.find({category:"women"});
//   let popular_women = product.slice(0,4);
//   console.log("women.fetched")
//   res.send(popular_women)
// })
app.get("/popularinwomen", async (req, res) => {
  try {
    let products = await Product.find({ category: "women" });
    let popularWomen = products.slice(0, 4);
    console.log("women fetched");
    res.send(popularWomen);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
});

//create middleware to fetch user

// const fetchUser = async (req, res) => {
//   const token = req.header("auth-token");
//   if (!token) {
//     res.static(401).send({ errors: "please autheticate using valide token" });
//   } else {
//     try {
//       const data = jwt.verify(token, "secert_ecom");
//       req.user = data.user;
//       next();
//     } catch (error) {
//       express.response
//         .status(401)
//         .send({ errors: "please authenticate using token" });
//     }
//   }
// };

const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res
      .status(401)
      .send({ errors: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token, "secert_ecom");
    console.log("Token data:", data); // Debugging log
    req.user = data.user;
    next();
  } catch (error) {
    console.error("Token verification error:", error); // Debugging log
    return res
      .status(401)
      .send({ errors: "Please authenticate using a valid token" });
  }
};

//creating end data for cart

// app.post("/addtocart", fetchUser, async (req, res) => {
//   console.log(req.body, req.user);

//   res.status(200).json({ message: "Item added to cart", data: req.body });
// console.log("Request body:", req.body); // Debugging log
// console.log("User from token:", req.user); // Debugging log
// res
//   .status(200)
//   .json({
//     message: "Item added to cart",
//     data: req.body,
//     userId: req.user.id,
//   });
// });
app.post("/addtocart", fetchUser, async (req, res) => {
  console.log("added", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("added");
});

//creating endpoint to remove cart data

app.post("/removefromcart", fetchUser, async (req, res) => {
  console.log("removed", req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
  await Users.findOneAndUpdate(
    { _id: req.user.id },
    { cartData: userData.cartData }
  );
  res.send("removed");
});
// creating endpoint for cart data
app.post('/getcart',fetchUser,async(req,res)=>{
console.log("getcart")
let userData=await Users.findOne({_id:req.user.id})
res.json(userData.cartData)

})