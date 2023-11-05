const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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
    await client.connect();

    const database = client.db("foodflow");
    const foodsCollection = database.collection("foods");

    // // Get all Foods items
    // app.get("/api/v1/foods", async (req, res) => {
    //   const cursor = foodsCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // paginations
    app.get("/api/v1/foods", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      console.log(page,size);
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
