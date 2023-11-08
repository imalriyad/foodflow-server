const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://foodflow-6447d.web.app",
      "https://foodflow-6447d.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// verify user
const verifyUser = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.aclhyjq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("foodflow");
    const foodsCollection = database.collection("foods");
    const orderCollection = database.collection("orders");
    const usersCollection = database.collection("users");



   // Filtering for highest-to-lowest-stock
   app.get("/api/v1/food/highest-to-lowest-stock", async (req, res) => {
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
    const skip = page * size;
    const result = await foodsCollection
      .find()
      .sort({ Quantity : -1 })
      .skip(skip)
      .limit(size)
      .toArray();
    res.send(result);
  });

  // Filtering for lowest-to-highest-price
  app.get("/api/v1/food/lowest-to-highest-stock", async (req, res) => {
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
    const skip = page * size;
    const result = await foodsCollection
      .find()
      .sort({ Quantity: 1 })
      .skip(skip)
      .limit(size)
      .toArray();
    res.send(result);
  });


    // Filtering for highest-to-lowest-price
    app.get("/api/v1/food/highest-to-lowest-price", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const skip = page * size;
      const result = await foodsCollection
        .find()
        .sort({ Price: -1 })
        .skip(skip)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // Filtering for lowest-to-highest-price
    app.get("/api/v1/food/lowest-to-highest-price", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const skip = page * size;
      const result = await foodsCollection
        .find()
        .sort({ Price: 1 })
        .skip(skip)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // creating and storing cookie with jwt
    app.post("/api/v1/jwt-token", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })

        .send({ success: true });
    });

    // Removing cookie when user logout
    app.post("/api/v1/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ status: true });
    });

    // Stored Users when registration
    app.post("/api/v1/user", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    //  update food items
    app.patch("/api/v1/foods/updateItem/:id", async (req, res) => {
      const updatedItem = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateFeild = {
        $set: {
          FoodName: updatedItem.FoodName,
          FoodImage: updatedItem.FoodImage,
          Price: updatedItem.Price,
          Quantity: updatedItem.Quantity,
          FoodCategory: updatedItem.FoodCategory,
          FoodOrigin: updatedItem.FoodOrigin,
        },
      };
      const result = await foodsCollection.updateOne(query, updateFeild);
      res.send(result);
    });

    // get my added Items
    app.get("/api/v1/foods/myaddedItem", verifyUser, async (req, res) => {
      const madeByEmail = req.query?.MadeByEmail;
      const cookieMail = req.user.email;

      if (madeByEmail !== cookieMail) {
        return res.status(403).send({ message: "Forbidden" });
      }
      let query = {};
      if (madeByEmail) {
        query = { MadeByEmail: madeByEmail };
      }
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    // Add a item
    app.post("/api/v1/foods/addItem", verifyUser, async (req, res) => {
      const newItem = req.body;
      const result = await foodsCollection.insertOne(newItem);
      res.send(result);
    });

    //  Get Top Ordered Food item
    app.get("/api/v1/foods/topSellingFood", async (req, res) => {
      const result = await foodsCollection
        .find()
        .sort({ OrderCount: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    //  Get single top Ordered Food item
    app.get("/api/v1/foods/topSellingFood/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // get Myorder foods
    app.get("/api/v1/foods/myOrder", verifyUser, async (req, res) => {
      const userEmail = req?.query?.customerEmail;
      const cookieMail = req.user.email;

      if (userEmail !== cookieMail) {
        return res.status(403).send({ message: "Forbidden" });
      }
      let query = {};
      if (userEmail) {
        query = { customerEmail: userEmail };
      }
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    // Get order by id
    app.get("/api/v1/foods/myOrder/:id", verifyUser, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });

    // Delete order
    app.delete("/api/v1/foods/myOrder/:id", verifyUser, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
    // create foods order
    app.post("/api/v1/foods/order", verifyUser, async (req, res) => {
      try {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // get food by id
    app.get("/api/v1/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // update qauntity food by id
    app.put("/api/v1/foods/:id", verifyUser, async (req, res) => {
      const id = req.params.id;
      const updateQuantity = req.body;
      console.log(updateQuantity);
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateFeld = {
        $set: {
          Quantity: updateQuantity.Quantity,
          OrderCount: updateQuantity.OrderCount,
        },
      };
      const result = await foodsCollection.updateOne(
        query,
        updateFeld,
        options
      );
      res.send(result);
    });

    // paginations
    app.get("/api/v1/foods", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const skip = page * size;
      const result = await foodsCollection
        .find()
        .skip(skip)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // get totalfood length
    app.get("/api/v1/totalItem", async (req, res) => {
      const totalItem = await foodsCollection.estimatedDocumentCount();
      res.send({ totalItem: totalItem });
    });

    // Search functionality by Text
    app.get("/api/v1/food", async (req, res) => {
      const searchText = req.query.FoodName;
      let query = {};
      if (searchText) {
        query = { FoodName: { $regex: new RegExp(searchText, "i") } };
      }
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("FoodFlow Server is runnig....");
});

app.listen(port, () => {
  console.log(`FoodFlow Server is running in Port ${port}`);
});
