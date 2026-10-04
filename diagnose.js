const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');

console.log('==============================================');
console.log('       SAHU TRADERS ERP - DIAGNOSTIC TOOL     ');
console.log('==============================================\n');

// 1. Check Node & NPM
console.log(`Node.js Version: ${process.version}`);

// Helper to check if a port is in use
const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is free
    });
    server.listen(port);
  });
};

// 2. Check Directories and dependencies
const backendModules = fs.existsSync(path.join(__dirname, 'backend', 'node_modules'));
const frontendModules = fs.existsSync(path.join(__dirname, 'frontend', 'node_modules'));

console.log(`Backend node_modules installed: ${backendModules ? 'Yes' : 'NO'}`);
console.log(`Frontend node_modules installed: ${frontendModules ? 'Yes' : 'NO'}`);

// 3. Check MongoDB connection
const checkMongo = async () => {
  console.log('\nChecking MongoDB Connection...');
  try {
    const mongoose = require(path.join(__dirname, 'backend', 'node_modules', 'mongoose'));
    const dotenv = require(path.join(__dirname, 'backend', 'node_modules', 'dotenv'));
    
    // Load .env
    const envPath = path.join(__dirname, 'backend', '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sahu_traders';
    console.log(`Attempting to connect to: ${mongoUri}`);
    
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ MongoDB Connected successfully!');
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log('❌ MongoDB Connection FAILED.');
    console.log(`Error Details: ${err.message}`);
    console.log('\nTroubleshooting MongoDB:');
    console.log('1. Make sure MongoDB is installed on your machine.');
    console.log('2. Make sure MongoDB Service is running (run "net start MongoDB" in Administrator cmd).');
    console.log('3. If you use MongoDB Atlas (cloud), update MONGODB_URI in the "backend/.env" file.');
    return false;
  }
};

const runDiagnostics = async () => {
  const port5000InUse = await checkPort(5000);
  const port3000InUse = await checkPort(3000);
  
  console.log(`\nPort 5000 (Backend) Status: ${port5000InUse ? 'IN USE (Running or blocked)' : 'Free'}`);
  console.log(`Port 3000 (Frontend) Status: ${port3000InUse ? 'IN USE (Running or blocked)' : 'Free'}`);
  
  if (backendModules) {
    await checkMongo();
  } else {
    console.log('\n[Warning] Backend node_modules not installed. Cannot test MongoDB connection automatically.');
    console.log('Please run "run_project.bat" first to install dependencies.');
  }
  
  console.log('\n==============================================');
  console.log('              DIAGNOSTICS COMPLETE            ');
  console.log('==============================================');
};

runDiagnostics();
