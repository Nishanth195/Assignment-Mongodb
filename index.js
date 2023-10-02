import { MongoClient,ObjectId } from 'mongodb';

const uri = 'mongodb://localhost:27017/trial'; 
const client = new MongoClient(uri, {  });

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
      const now = new Date(); // Current date and time
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
      const testPosts = [
        { groupId:new ObjectId("6516eadbb029d404b0c196a4"), createdAt: lastWeek },
        { groupId:new ObjectId("6516d690f084a3a3da0cf28b"), createdAt: lastWeek },
        { groupId:new ObjectId("6517d51dcbde365d3bfd0b02"), createdAt: lastWeek },
        //Can Add more test posts with different group IDs and recent timestamps
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
    console.log('Posts:', posts);
  } catch (err) {
    console.error('Error checking posts:', err);
  }
}

async function performCRUDOperations(db) {
  const groupsCollection = db.collection('groups');
  const postsCollection = db.collection('posts');

  // Create a new group
  const newGroup = { name: 'Group A' };
  await groupsCollection.insertOne(newGroup);
  console.log('Group created:', newGroup);

  // Retrieve groups
  const groups = await groupsCollection.find({}).toArray();
  console.log('Groups:', groups);
}

async function retrieveMostActiveGroups(db) {
    const postsCollection = db.collection('posts');
  
    // Aggregation pipeline to retrieve most active groups based on recent post counts
    const aggregationPipeline = [
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Filter posts from the last 7 days 
        }
      },
      {
        $group: {
          _id: '$groupId',
          totalRecentPosts: { $sum: 1 }
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
        console.log('No active groups found within the specified time frame.');
      } else {
        console.log('Most active groups:', activeGroups);
      }
    } catch (err) {
      console.error('Error retrieving most active groups:', err);
    }
  }
  

connectToMongoDB();


