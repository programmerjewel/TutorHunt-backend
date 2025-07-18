const express = require('express');
const cors = require('cors');
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
    
    //add a single tutor data to db
    app.post('/tutors', async(req, res) =>{
      const tutor = req.body;
      const result = await tutorCollection.insertOne(tutor);
      res.send(result);
    })

    //get a single tutor details by id
    app.get('/tutors/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await tutorCollection.findOne(query);
      res.send(result);
    })

    //update a single tutor data by id
    app.patch('/tutors/:id', async(req, res) =>{
      const id = req.params.id;
      const tutorData = req.body;
      const updatedTutorData = {
        $set: {
          image: tutorData.image,
          language: tutorData.language,
          price: tutorData.price,
          description: tutorData.description
        }
      }
      const query = {_id: new ObjectId(id)};
      const result = await tutorCollection.updateOne(query, updatedTutorData);
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

    //delete specific tutor from db
    app.delete('/tutors/:id', async(req, res) => {
      try {
        const id = req.params.id;
        console.log('Deleting tutor with ID:', id); // This will show the ID in console
        
        const query = {_id: new ObjectId(id)};
        const result = await tutorCollection.deleteOne(query);
        
        if(result.deletedCount === 1) {
          res.send({success: true, message: 'Tutor deleted successfully'});
        } else {
          res.status(404).send({success: false, message: 'Tutor not found'});
        }
      } catch (err) {
        console.error('Delete error:', err);
        res.status(500).send({success: false, message: 'Error deleting tutor'});
      }
    });

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