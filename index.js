const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());




const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.rydeejw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client;


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    if(client){
      return {client}
    }
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();

    const database = client.db("allInOne");

    const servicesCollection = database.collection("services");
    const testimonialsCollection = database.collection("testimonials");


    // get 3 services
    app.get("/services3", async(req, res)=>{
      const cursor = servicesCollection.find();
      const result = await cursor.limit(3).toArray();
      res.send(result);
    })

    app.get("/services", async(req, res)=>{
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    app.get("/testimonials", async(req, res)=>{
      const cursor = testimonialsCollection.find();
      const result = await cursor.limit(6).toArray();
      res.send(result);
    })

    app.post("/testimonials", async(req, res)=>{
      const {load} = req.body;
      if(load){
        const cursor = testimonialsCollection.find();
        const result = await cursor.toArray();
        const count = await testimonialsCollection.estimatedDocumentCount();
        res.send({ result, count })
      }
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    app.get("/", (req, res) => {
      res.send(
        "Server running successfuly <br/> <br/> Pinged your deployment. You successfully connected to MongoDB!"
      );
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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