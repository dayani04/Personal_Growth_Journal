const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = 'mongodb+srv://dayanisandamali20:DjQH1FGVnGpLxgNb@cluster0.6um4a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let db;

async function connectToMongoDB() {
    try {
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        await client.connect();
        console.log('Connected to MongoDB Atlas');
        db = client.db();
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        throw err;
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

module.exports = { connectToMongoDB, getDb };
