const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());




const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.rydeejw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client;

function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: "unauthorized access", code: "401"})
  }
  const token = authHeader.split(' ')?.[ 1 ]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(401).send({message: "unauthorized access", code: "401"})
    }
    req.decoded = decoded;
    next()
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    if (client) {
      return { client };
    }
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    // await client.connect();

    const database = client.db("allInOne");

    const servicesCollection = database.collection("services");
    const reviewsCollection = database.collection("reviews");
    const testimonialsCollection = database.collection("testimonials");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    // get 3 services
    app.get("/services3", async (req, res) => {
      const options = {
        // Sort returned documents in ascending order by title (A->Z)
        sort: { Title: 1 },
      };
      const cursor = servicesCollection.find({}, options);
      const result = await cursor.limit(3).toArray();
      res.send(result);
    });

    app.get("/services", async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/service-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.send(result);
    });

    app.post("/add-service", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });

    // add reviews
    app.post("/addReview", async (req, res) => {
      const document = req.body;
      const date = new Date();
      const day = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      document.creationDate = `${day}/${month + 1}/${year}`;
      const result = await reviewsCollection.insertOne(document);
      res.send(result);
    });

    // Get all reviews for specific service
    app.get("/getReview/:id", async (req, res) => {
      const serviceId = req.params.id;
      const options = {
        // Sort returned documents in ascending order by title (A->Z)
        sort: { creationDate: -1 },
      };
      const query = { serviceId: serviceId };
      const cursor = reviewsCollection.find(query, options);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get single review
    app.get("/oneReview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewsCollection.findOne(query);
      res.send(result);
    });

    app.get("/my-reviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "unauthorized access", code: "403" });
      }
      let query = {};
      if (req.query.email) {
        query = { email: req.query.email };
        const cursor = reviewsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      }
    });

    // update a review
    app.put("/edit-review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const review = req.body;
      const updatedReview = {
        $set: {
          occupation: review.occupation,
          ratings: review.ratings,
          reviewTitle: review.reviewTitle,
          reviewDescription: review.reviewDescription,
        },
      };
      const result = await reviewsCollection.updateOne(
        filter,
        updatedReview,
        option
      );
      res.send(result);
    });

    // delete a review
    app.delete("/my-reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/testimonials", async (req, res) => {
      const cursor = testimonialsCollection.find();
      const result = await cursor.limit(6).toArray();
      res.send(result);
    });

    app.post("/testimonials", async (req, res) => {
      const { load } = req.body;
      if (load) {
        const cursor = testimonialsCollection.find();
        const result = await cursor.toArray();
        const count = await testimonialsCollection.estimatedDocumentCount();
        res.send({ result, count });
      }
    });

    app.get("/", (req, res) => {
      res.send(
        "Server running successfully <br/> <br/> Pinged your deployment. You successfully connected to MongoDB!"
      );
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } catch(err) {
    // Ensures that the client will close when you finish/error
    // await client.close();
    console.log(err)
  }
}
run().catch(console.dir);







app.listen(port, ()=>{
  console.log(`Server running on port: ${port}`);
})