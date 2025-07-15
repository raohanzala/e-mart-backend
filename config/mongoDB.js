import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully')
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected')
    })

    // Connection options for better reliability
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      // bufferMaxEntries: 0, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority'
    }

    await mongoose.connect(
      'mongodb+srv://hanzalar502:Hanzala%4012345@cluster0.itbzgxy.mongodb.net/e-mart?retryWrites=true&w=majority',
      // connectionOptions
    )

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message)
    throw error
  }
}

export default connectDB