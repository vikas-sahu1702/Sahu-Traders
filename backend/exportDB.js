const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const User = require('./models/User');
const CompanySettings = require('./models/CompanySettings');
const ActivityLog = require('./models/ActivityLog');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/sahu_traders';
const DATA_DIR = path.join(__dirname, 'data');

async function exportData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR);
    }

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
      console.log(`Exporting ${name}...`);
      const data = await model.find({}).lean();
      fs.writeFileSync(
        path.join(DATA_DIR, `${name}.json`),
        JSON.stringify(data, null, 2)
      );
      console.log(`Exported ${data.length} records to ${name}.json`);
    }

    console.log('Data export completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
  }
}

exportData();
