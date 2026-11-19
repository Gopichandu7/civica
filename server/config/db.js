const mongoose = require('mongoose');
const dotenv= require('dotenv')
dotenv.config()
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        console.log(mongoURI)
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};
connectDB();