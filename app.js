import express from 'express';
import { connectToMongoDB, closeMongoDBConnection } from './mongodb.js'; // Update the import path accordingly

const app = express();
const port = process.env.PORT || 3000;

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

// Define your API routes here (e.g., CRUD operations)
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




