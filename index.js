const express = require('express');
const cors = require('cors')
const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb')
require('@dotenvx/dotenvx').config() 

const port = process.env.PORT || 4000;
const app = express();

app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mujla7p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
   const tutorCollection = client.db('tutorsdb').collection('tutors');
   const bookedTutorCollection = client.db('tutorsdb').collection('booked-tutors');
  
    //get all tutors from db
    app.get('/find-tutors', async(req, res) =>{
      const email = req.query.email;
      let query = {};

      if(email){
        query= {email: email}
      }
      try{
        const result = await tutorCollection.find(query).toArray();
        res.send(result)
      }
      catch(err){
        res.status(500).send(err.message)
      }
    })
    
    //get a single tutor details by id
    app.get('/tutors/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await tutorCollection.findOne(query);
      res.send(result);
    })

    //get tutor by language category
    app.get('/find-tutors/:category' , async(req, res) =>{
      const category = req.params.category.toLowerCase();
      const query = {language: {
        $eq : category.charAt(0).toUpperCase() + category.slice(1)
      }};

      const result = await tutorCollection.find(query).toArray();
      res.send(result);
    })


    //get booked tutor data for user's email from db
    app.get('/booked-tutors', async(req, res) =>{
      const email = req.query.email;
      const query = {userEmail: email};
      
      const result = await bookedTutorCollection.find(query).toArray();
      
      res.send(result);
    })

    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');

  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello from TutorHunt Server....');
});

app.listen(
  port, () => console.log(`Server running on port ${port}`)
);