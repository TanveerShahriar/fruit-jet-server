const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.31xws.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const fruitsCollection = client.db("fruitJet").collection("fruits");

    // Get fruits
    app.get("/inventory", async (req, res) => {
      console.log(req.query)
      const limit = parseInt(req.query.limit);
      console.log(limit);

      const query = {};
      const cursor = fruitsCollection.find(query);
      let fruits;

      if (limit) {
        fruits = await cursor.limit(limit).toArray();
      }
      else {
        fruits = await cursor.toArray();
      }
      res.send(fruits);
    });

    app.get("/inventory/:id", async (req, res) => {
      const fruitId = req.params.id;
      const query = { _id: ObjectId(fruitId) };
      const fruit = await fruitsCollection.findOne(query);
      res.send(fruit);
    });

    // Delete fruits
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await fruitsCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Server");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});

// AIzaSyBHpV7SXKJMNtHeZq7klJpeCQYDKcuCOgc