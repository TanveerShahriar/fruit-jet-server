const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// JWT verify
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
    return decoded
  });
}


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
    const myFruitsCollection = client.db("fruitJet").collection("myfruits");

    // Token generate from login
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // Get fruits
    app.get("/inventory", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const page = parseInt(req.query.page);
      const size = 5;

      const query = {};
      let fruits;

      const cursor = fruitsCollection.find(query);

      if (limit) {
        fruits = await cursor.limit(limit).toArray();
      }
      else if (page || page === 0) {
        fruits = await cursor.skip(page * size).limit(size).toArray();
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

    // Fruit count
    app.get('/fruitCount', async (req, res) => {
      const count = await fruitsCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // Delete fruits
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await fruitsCollection.deleteOne(query);
      res.send(result);
    });

    // Update Fruits Stock 
    app.put('/inventory/:id', async (req, res) => {
      const id = req.params.id;
      const updatedFruit = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedData = {
        $set: {
          quantity: updatedFruit.quantity
        }
      };
      const result = await fruitsCollection.updateOne(filter, updatedData, options);
      res.send(result);

    });

    // Add Fruits
    app.post("/inventory", async (req, res) => {
      const fruit = req.body;
      const result = await fruitsCollection.insertOne(fruit);
      res.send(result);
    });

    // Get My Fruits with JWT
    app.get("/myinventory", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      console.log(decodedEmail, email);
      if (email === decodedEmail) {
        const query = { email };
        console.log(query);
        const cursor = fruitsCollection.find(query);
        const myfruits = await cursor.toArray();
        console.log(myfruits);
        res.send(myfruits);
      }
      else {
        res.status(403).send({ message: "Forbidden access" });
      }
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