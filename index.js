const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors())
app.use(express())

// DB_USER = product_hunter
// DB_PASS = v8N96RnHtI9m4RfV


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6aryg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const productCollection = client.db('productsItem').collection('products')
    app.get('/addQueries', async(req, res)=>{
      const cursor = productCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.post('/addQueries', async(req, res) =>{
      const newQueries = req.body 
      console.log(newQueries)
      const result = await productCollection.insertOne(newQueries)
      res.send(result)
    })
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('Job is falling from sky.')
})

app.listen(port, ()=>{
    console.log(`Job is waiting at: ${port}`)
})

