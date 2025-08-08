import mongoose from "mongoose";

const DB_NAME = "Shulker";

export const dbConnect = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`);
        console.log('✅ Connected to MongoDB !!!', `The host is ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log('🔴 Error connecting to MongoDB !!! ', error);
        process.exit(1);
    }
}
