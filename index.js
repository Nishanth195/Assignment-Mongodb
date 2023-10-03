import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import moment from 'moment-timezone';

const uri = 'mongodb://localhost:27017/trial'; // MongoDB URI
const client = new MongoClient(uri, {});

// Set your desired time zone here
moment.tz.setDefault('Asia/India'); //

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('MongoDB connected successfully');
    const db = client.db('trial'); //database name

    // CRUD operations and aggregation can access the 'db' object here
    await performCRUDOperations(db);
    await retrieveMostActiveGroups(db);
    await addTestPosts(db);
    // Check posts in the 'posts' collection
    await checkPosts(db);
  } catch (err) {
    console.error('MongoDB connection failed:', err);
  } finally {
    // Close the MongoDB client when done
    await client.close();
  }
}

async function addTestPosts(db) {
  const postsCollection = db.collection('posts');

  try {
    const now = moment(); // Current date and time in the specified time zone
    const post1Timestamp = now.subtract(7, 'days'); // 7 days ago
    const post2Timestamp = now.subtract(5, 'days'); // 5 days ago
    const post3Timestamp = now.subtract(3, 'days'); // 3 days ago

    const testPosts = [
      { groupId: new ObjectId("651922d65535398850f5dbee") },
      { groupId: new ObjectId("65191e089ace0b8414606b6a") },
      { groupId: new ObjectId("6517d51dcbde365d3bfd0b02") },
    ];

    await postsCollection.insertMany(testPosts);
    console.log('Test posts added:', testPosts);
  } catch (err) {
    console.error('Error adding test posts:', err);
  }
}

async function checkPosts(db) {
  const postsCollection = db.collection('posts');

  try {
    const posts = await postsCollection.find({}).toArray();
    //console.log('Posts:', posts); // commented this because the output would be too long to read
  } catch (err) {
    console.error('Error checking posts:', err);
  }
}

async function performCRUDOperations(db) {
  const groupsCollection = db.collection('groups');
  const postsCollection = db.collection('posts');

  //Only Create a new group operation is performed 
  //Can add other CRUD operations as well
  const newGroup = { name: 'Group B' };
  await groupsCollection.insertOne(newGroup);
  console.log('Group created:', newGroup);

  // Retrieve groups
  const groups = await groupsCollection.find({}).toArray();
  console.log('Groups:', groups);
}

async function retrieveMostActiveGroups(db) {
  const postsCollection = db.collection('posts');

  // Can Adjust the time frame here 
  const timeFrameInDays = 21; 

  //Can Adjust the minimum post count required for a group to be considered active
  const minPostCount = 5; 

  // Aggregation pipeline to retrieve most active groups based on recent post counts
  const aggregationPipeline = [
    {
      $match: {
        createdAt: { $gte: moment().subtract(timeFrameInDays, 'days').toDate() } // Filter posts from the last 'timeFrameInDays' days
      }
    },
    {
      $group: {
        _id: '$groupId',
        totalRecentPosts: { $sum: 1 }
      }
    },
    {
      $match: {
        totalRecentPosts: { $gte: minPostCount } // Filter groups with at least 'minPostCount' posts
      }
    },
    {
      $sort: { totalRecentPosts: -1 }
    },
    {
      $lookup: {
        from: 'groups',
        localField: '_id',
        foreignField: '_id',
        as: 'group'
      }
    },
    {
      $unwind: '$group'
    },
    {
      $project: {
        groupName: '$group.name',
        totalRecentPosts: 1
      }
    }
  ];

  try {
    const activeGroups = await postsCollection.aggregate(aggregationPipeline).toArray();
    console.log('Intermediate Result:', activeGroups); // Log intermediate result
    if (activeGroups.length === 0) {
      console.log('No active groups found within the specified criteria.');
    } else {
      console.log('Most active groups:', activeGroups);
    }
  } catch (err) {
    console.error('Error retrieving most active groups:', err);
  }
}

connectToMongoDB();

// Create an Express.js application
const app = express();
const port = process.env.PORT || 5000;

// Middleware to open and close MongoDB connection
app.use(async (req, res, next) => {
  try {
    req.db = await connectToMongoDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Middleware to parse JSON requests
app.use(express.json());

// Defined API routes here 
app.get('/api/posts', async (req, res) => {
  const postsCollection = req.db.collection('posts');
  try {
    const posts = await postsCollection.find({}).toArray();
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the Express server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  closeMongoDBConnection().finally(() => {
    console.log('Server and MongoDB connection closed.');
    server.close(() => {
      console.log('Express server closed.');
      process.exit(0);
    });
  });
});

export async function closeMongoDBConnection() {
  if (client.isConnected()) {
    return client.close();
  }
}
  

connectToMongoDB();


