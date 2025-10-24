import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase(uri) {
    if (isConnected) {
        return mongoose.connection;
    }

    if (!uri) {
        throw new Error("Missing MongoDB connection string. Set MONGODB_URI in your environment.");
    }

    mongoose.set("strictQuery", true);

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    return mongoose.connection;
}

export function disconnectFromDatabase() {
    if (!isConnected) {
        return;
    }

    mongoose.connection.close();
    isConnected = false;
}
