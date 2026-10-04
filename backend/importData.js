const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const User = require('./models/User');
const CompanySettings = require('./models/CompanySettings');
const ActivityLog = require('./models/ActivityLog');

const MONGODB_URI = process.argv[2] || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: Please provide your MongoDB Atlas URI as an argument.');
  console.log('Example: node importData.js "mongodb+srv://user:pass@cluster.mongodb.net/dbname"');
  process.exit(1);
}

const DATA_DIR = path.join(__dirname, 'data');

async function importData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected Successfully!');

    const collections = [
      { name: 'customers', model: Customer },
      { name: 'products', model: Product },
      { name: 'invoices', model: Invoice },
      { name: 'payments', model: Payment },
      { name: 'users', model: User },
      { name: 'companysettings', model: CompanySettings },
      { name: 'activitylogs', model: ActivityLog },
    ];

    for (const { name, model } of collections) {
      const filePath = path.join(DATA_DIR, `${name}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (data.length > 0) {
          console.log(`Importing ${data.length} records into '${name}' collection...`);
          // Note: We don't delete existing data just in case, or maybe we should? 
          // Let's delete existing data so it cleanly mirrors the local DB.
          await model.deleteMany({});
          await model.insertMany(data);
          console.log(`✅ ${name} imported.`);
        }
      }
    }

    console.log('\n🎉 All local data has been successfully uploaded to MongoDB Atlas!');
    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

importData();
