require('dotenv').config()
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin: ['http://localhost:5173', 'https://discreet-birth.surge.sh'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.Authorization
  console.log(req)
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'unauthorized access to'})
    }
    req.user = decoded
    next()
  })
  console.log('token inside the verifyToken', token)
}



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

    // await client.connect();
    const productCollection = client.db('productsItem').collection('products')
    const reProductCollection = client.db('productsItem').collection('reProducts')

    //auth related api
    app.post('/jwt', (req, res) =>{
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '5h'
      })

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV=="production",
        sameSite: process.env.NODE_ENV=="production" ? "none":"strict",
      })
      .send({ success: true, token})
    })

    app.post('/logout', (req, res) =>{
      res
      .clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV=="production",
        sameSite: process.env.NODE_ENV=="production" ? "none":"strict",
      })
      .send({ success: true})
    })


    app.get('/addQuery', async(req, res)=>{
      const cursor = productCollection.find().limit(6)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/addQueries', async(req, res)=>{
      const search = req.query.search
      // console.log(search)
      let query = {};
      if (search) {
        query = {
          productName: {
            $regex: search,
            $options: 'i', 
          },
        };
      }=
      const cursor = productCollection.find(query).sort({ readableDate: -1 })
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/addRecommendation', async(req, res) =>{
      const cursor = reProductCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
   

    app.get('/addRecommendation/:queryId', verifyToken, async(req, res) =>{
      const id = req.params.queryId 
      if(!id){
        return res.status(400).send({ message: 'Email is required.'})
      }
      const cursor = reProductCollection.find({ queryId : id})
      const result = await cursor.toArray()
      if(result.length === 0){
        return res.status(404).send({message: 'Unfortunately, No Product found for this user.'})
      }
      res.send(result)
    })

    app.get('/myRecommendation/:email', verifyToken, async(req, res) =>{
      try{
        const email = req.params.email
      // console.log(email)
      console.log(req.cookies?.token)
      if(req.user.email !== req.params.email){
        return res.status(403).send({message: 'Forbidden access'})
      }
      
      const cursor = reProductCollection.find({ recommenderEmail : email})
      const result = await cursor.toArray()
      
      res.send(result)
    }catch(error){
      console.log(error)
      if (!res.headersSent) {
        res.status(500).send('Error fetching sorted data');
      }
    }
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

    app.post('/addRecommendation', async(req, res) =>{
      const newReQueries = req.body
      console.log(newReQueries)
      const result = await reProductCollection.insertOne(newReQueries)
     
      res.send(result)
    })

    app.get('/queries/:email', verifyToken, async(req, res) =>{
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
        }
      }
      const result = await productCollection.updateOne(filter, queries, options)
      res.send(result)
    })

    app.put('/incrementRecommendation/:id', async(req, res) =>{
      const id = req.params.id
      const filter = { _id: new ObjectId(id)}
      const updateDoc = {
        $inc: { recommendationCount: 1}
      }

      try{
        const result = await productCollection.updateOne(filter, updateDoc)
        if(result.modifiedCount > 0){
          res.status(200).send({ message: 'Recommendation count update successfull'})
        }else{
          res.status(404).send({ message: 'No Document found'})
        }
      }
      catch(error){
        res.status(500).send({ error: error.message})
      }
    })

    
    app.put('/decreaseRecommendation/:id', async(req, red) =>{
      const id = req.params.id
      console.log(id)
      const filter = { _id: new ObjectId(id)}
      const updateDoc = {
        $inc: { recommendationCount: -1}
      }

      try{
        const result = await productCollection.updateOne(filter, updateDoc)
        if(result.modifiedCount > 0){
          return res.status(200).send({ message: 'Recommendation count update successfull'})
        }else{
          return res.status(404).send({ message: 'No Document found.'})
        }
      }
      catch(error){
        res.status(500).send({ error: error.message})
      }
    })
    

    app.delete('/queries/:id', async(req, res)=>{
      const id = req.params.id 
      const query = { _id: new ObjectId(id) }
      const result = await productCollection.deleteOne(query)
      res.send(result)
    })

    app.delete('/myRecommendation/:id', async(req, res) =>{
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const cursor = await reProductCollection.findOne(query)
      console.log(cursor)
      const filter = { _id: new ObjectId(cursor?.queryId)}
      const updateDoc = {
        $inc: { recommendationCount: -1}
      }
      const rest = await productCollection.updateOne(filter, updateDoc)
      console.log(rest)
      const result = await reProductCollection.deleteOne(query)
      if(result.deletedCount > 0){
        return res.send({ message: "Recommendation deleted successfully."})
      }else{
        return res.status(404).send({ message: "No Recommendation found."})
      }
      res.send(result)
    })

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



// http://localhost:5000/myRecommendation/md.habiburrahmanjwd@gmail.com
// https://localhost:5000/myRecommendation/md.habiburrahmanjwd@gmail.com