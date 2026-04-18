const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    const adminEmail = 'admin@gmail.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const admin = new User({
        username: 'Admin',
        email: adminEmail,
        password: 'admin123',
        phone: '0000000000',
        role: 'admin'
      });

      await admin.save();
      console.log('Admin user created successfully');
    } else {
      adminExists.password = 'admin123';
      await adminExists.save();
      console.log('Admin user password updated successfully');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
