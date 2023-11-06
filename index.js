const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare
app.use(cors());
app.use(express.json());
app.use(cookieParser());

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

    //  Get Top Ordered Food item
    app.get("/api/v1/foods/topSellingFood", async (req, res) => {
      const result = await foodsCollection
        .find()
        .sort({ OrderCount: -1 }).limit(6)
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
    app.get("/api/v1/foods/myOrder", async (req, res) => {
      const userEmail = req?.query?.customerEmail;
      let query = {};
      if (userEmail) {
        query = { customerEmail: userEmail };
      }
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    // Get order by id
    app.get("/api/v1/foods/myOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });

    // Delete order
    app.delete("/api/v1/foods/myOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
    // create foods order
    app.post("/api/v1/foods/order", async (req, res) => {
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
    app.put("/api/v1/foods/:id", async (req, res) => {
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
