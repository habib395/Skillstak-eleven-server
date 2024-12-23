const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())

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

    await client.connect();
    const productCollection = client.db('productsItem').collection('products')


    app.get('/addQuery', async(req, res)=>{
      const cursor = productCollection.find().limit(6)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/addQueries', async(req, res)=>{
      const cursor = productCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/queries/:email/:id', async(req, res) => {
      const id = req.params.id 
      const query = {_id: new ObjectId(id)}
      const result = await productCollection.findOne(query)
      res.send(result)
    })

    app.post('/addQueries', async(req, res) =>{
      const newQueries = req.body 
      console.log(newQueries)
      const result = await productCollection.insertOne(newQueries)
      res.send(result)
    })

    app.get('/queries/:email', async(req, res) =>{
      const email = req.params.email
      // console.log(email)
      if(!email){
        return res.status(400).send({ message: 'Email is required'})
      }
      const cursor = productCollection.find({ userEmail : email})
      const result = await cursor.toArray()
      console.log(result)
      if(result.length === 0){
        return res.status(404).send({ message: 'Unfortunately , No product found for this user.'})
      }
      res.send(result)
    })

    app.put('/queries/:id', async(req, res) =>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const options = {upsert: true}
      const updateQueries = req.body 
      const queries = {
        $set: {
        productName: updateQueries.productName,
        productBrand: updateQueries.productBrand,
        PhotoURL: updateQueries.PhotoURL,
        queryTitle: updateQueries.queryTitle,
        BoycottingReasonDetails: updateQueries.BoycottingReasonDetails,
        // userEmail: updateQueries.userEmail,
        // name: updateQueries.name,
        // userImage: updateQueries.userImage,
        // currentDate: updateQueries.currentDate, 
        // recommendationCount: updateQueries.recommendationCount  
        }
      }
      const result = await productCollection.updateOne(filter, queries, options)
      res.send(result)
    })

    

    app.delete('/queries/:id', async(req, res)=>{
      const id = req.params.id 
      const query = { _id: new ObjectId(id) }
      const result = await productCollection.deleteOne(query)
      res.send(result)
    })
    // Connect the client to the server	(optional starting in v4.7)
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

