const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support Base64 images for logos
app.use(express.urlencoded({ extended: true }));

// Seed Default Admin User & Settings
const seedDatabase = async () => {
  try {
    const User = require('./models/User');
    const CompanySettings = require('./models/CompanySettings');

    // Seed default admin if no users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({
        name: 'Sahu Traders Admin',
        email: 'admin@sahutraders.com',
        password: 'Admin@123', // Will be hashed by pre-save hook
        role: 'Admin',
        status: 'Active',
      });
      console.log('Seeded Default Admin: admin@sahutraders.com / Admin@123');
    }

    // Seed default company details if none exist
    const settingsCount = await CompanySettings.countDocuments();
    if (settingsCount === 0) {
      await CompanySettings.create({
        companyName: 'SAHU TRADERS',
        address: 'Main Bazar, Mandi',
        mobile: '9876543210',
        email: 'info@sahutraders.com',
        gstin: '22AAAAA0000A1Z5',
        invoicePrefix: 'ST-',
        defaultTaxRate: 18,
      });
      console.log('Seeded Default Company Settings');
    }
  } catch (error) {
    console.error('Seeding error:', error.message);
  }
};

// Run seeding
seedDatabase();

// Routes Mounting
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/raw-materials', require('./routes/rawMaterialRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));

const path = require('path');

// Serve Frontend in Production or if dist folder exists
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// SPA Catch-all Route to fix "Not Found" on page refresh
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Centralized Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
