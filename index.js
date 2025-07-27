require('@dotenvx/dotenvx').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const port = process.env.PORT || 4000;
const app = express();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://tutor-hub-2025.web.app',
    'https://tutor-hub-2025.firebaseapp.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

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

    //jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SECRET_KEY, { expiresIn: '10h' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });

    //clear cookie after logout
    app.get('/logout', async (req, res) => {
      res
        .clearCookie('token', {
          maxAge: 0,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });

    //verify jwt token
    const verifyToken = (req, res, next) => {
      const token = req.cookies?.token;

      //if there is no token then show unauthorized message
      if (!token) return res.status(401).send({ message: 'unauthorized access' });

      jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        req.user = decoded;
        next();
      });
    };

    //get all tutors from db
    app.get('/find-tutors', async (req, res) => {
      
      //determine no. of pages on pagination
      const page = parseInt(req.query.page) || 1;

      //determine no. of data shown each page
      const limit = parseInt(req.query.limit) || 10;

      // calculate no. of data to skipbased on current page and limit
      const skip = (page - 1) * limit;
      
      let query = {};
      
      //if user email added on query
      if (req.query.email) {
        query = { email: req.query.email };
      }
      //if language added on query
      if (req.query.language) {
        query.language = { $regex: req.query.language, $options: 'i' };
      }

      try {
        const total = await tutorCollection.countDocuments(query);
        const result = await tutorCollection.find(query).skip(skip).limit(limit).sort({_id: 1}).toArray();

        res.send({result, currentPage: page, totalPage: Math.ceil(total / limit), totalItems: total});
      } catch (err) {
        res.status(500).send(err.message);
      }
    });

    //add a single tutor data to db
    app.post('/tutors', verifyToken, async (req, res) => {
      const tutor = req.body;
      const result = await tutorCollection.insertOne(tutor);
      res.send(result);
    });

    //get a single tutor details by id
    app.get('/tutors/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorCollection.findOne(query);
      res.send(result);
    });

    //update a single tutor data by id
    app.patch('/tutors/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const tutorData = req.body;
      const updatedTutorData = {
        $set: {
          image: tutorData.image,
          language: tutorData.language,
          price: tutorData.price,
          description: tutorData.description,
        },
      };
      const query = { _id: new ObjectId(id) };
      const result = await tutorCollection.updateOne(query, updatedTutorData);
      res.send(result);
    });

    //get tutor by language category
    app.get('/find-tutors/:category', async (req, res) => {
      const category = req.params.category.toLowerCase();
      const query = {
        language: {
          $eq: category.charAt(0).toUpperCase() + category.slice(1),
        },
      };

      const result = await tutorCollection.find(query).toArray();
      res.send(result);
    });

    //add tutor to booked-tutor in db
    app.post('/booked-tutors', verifyToken, async (req, res) => {
      const bookedTutor = req.body;

      //check if this tutor already included on booked-tutors collection
      const alreadyBooked = await bookedTutorCollection.findOne({
        tutorId: bookedTutor.tutorId,
        userEmail: bookedTutor.userEmail,
      });
      if (alreadyBooked) {
        return res.status(400).send({
          success: false,
          message: 'Tutor already booked by the user!',
        });
      }

      //if not on the booked-tutor list, add tutor to booked tutor
      const result = await bookedTutorCollection.insertOne({
        ...bookedTutor,
        hasReviewed: false,
      });
      res.send({ success: true, message: 'Tutor booked successfully', result });
    });

    //update review count on booked-tutors page
    app.patch('/tutors/:id/review', verifyToken, async (req, res) => {
      try {
        const tutorId = req.params.id;
        const userEmail = req.query.email;

        //check user email is provided or not
        if (!userEmail) {
          return res.status(400).send({ success: false, message: 'User email is required' });
        }

        //check that the user making the request is the same user in token
        if (req.user.email !== userEmail) {
          return res.status(403).send({ message: 'Forbidden access' });
        }

        //check added tutor on bookedTutor does exist on tutorcollection in db
        const tutor = await tutorCollection.findOne({ _id: new ObjectId(tutorId) });
        if (!tutor) {
          return res.status(404).send({ success: false, message: 'Tutor not found' });
        }

        //check user already booked tutors on bookedtutorcollection
        const booking = await bookedTutorCollection.findOne({
          tutorId: tutorId,
          userEmail: userEmail,
        });
        if (!booking) {
          return res.status(404).send({
            success: false,
            message: 'You have not booked this tutor',
          });
        }

        //check user already reviewed booked-tutor
        if (booking.hasReviewed) {
          return res.status(403).send({
            success: false,
            message: 'You have already reviewed this tutor',
          });
        }

        const result = await tutorCollection.updateOne(
          { _id: new ObjectId(tutorId) },
          { $inc: { review: 1 } }
        );
        if (result.modifiedCount === 0) {
          return res.status(500).send({
            success: false,
            message: 'Failed to update the tutor review',
          });
        }
        await bookedTutorCollection.updateOne(
          { tutorId: tutorId, userEmail: userEmail },
          { $set: { hasReviewed: true } }
        );
        res.send({ success: true, message: 'Review submitted successfully' });
      } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).send({ success: false, message: 'Server error while submitting review' });
      }
    });

    //get booked tutor data for user's email from db
    app.get('/booked-tutors', verifyToken, async (req, res) => {
      const email = req.query.email;

      if (req.user.email !== email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }

      const query = { userEmail: email };
      const result = await bookedTutorCollection.find(query).toArray();
      res.send(result);
    });

    //delete specific tutor from db
    app.delete('/tutors/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        console.log('Deleting tutor with ID:', id); // This will show the ID in console

        const query = { _id: new ObjectId(id) };
        const result = await tutorCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.send({ success: true, message: 'Tutor deleted successfully' });
        } else {
          res.status(404).send({ success: false, message: 'Tutor not found' });
        }
      } catch (err) {
        console.error('Delete error:', err);
        res.status(500).send({ success: false, message: 'Error deleting tutor' });
      }
    });

    //stat about tutors, reviews, lanuages
    app.get('/stats', async(req, res) =>{
      
      const totalTutors = await tutorCollection.countDocuments();
      
      // Get distinct languages using aggregation
    const languageResult = await tutorCollection
      .aggregate([
        {
          $group: {
            _id: '$language', // Group by the language field
          },
        },
        {
          $count: 'totalLanguages', // Count the number of unique languages
        },
      ])
      .toArray();
    const totalLanguages = languageResult.length > 0 ? languageResult[0].totalLanguages : 0;

      //get total review counts
      const reviewStat = await tutorCollection.aggregate([{
        $group:{
          _id: null,
          totalReviews: {$sum: "$review"},
        }
      }]).toArray();

      const totalReviews = reviewStat.length > 0 ? reviewStat[0].totalReviews : 0;

      // Get total unique users based on userEmail
    const userResult = await bookedTutorCollection
      .aggregate([
        {
          $group: {
            _id: '$userEmail', // Group by the userEmail field
          },
        },
        {
          $count: 'totalUsers', // Count the number of unique users
        },
      ])
      .toArray();
    const totalUsers = userResult.length > 0 ? userResult[0].totalUsers : 0;

      res.send({totalTutors, totalLanguages, totalReviews, totalUsers})
    })

    // await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from TutorHunt Server....');
});

app.listen(port, () => console.log(`Server running on port ${port}`));
