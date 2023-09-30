import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017/trial'; // Your MongoDB URI
const client = new MongoClient(uri, {});

export async function connectToMongoDB() {
  if (!client.isConnected()) {
    await client.connect();
  }
  return client.db('trial');
}

export async function closeMongoDBConnection() {
  if (client.isConnected()) {
    return client.close();
  }
}
