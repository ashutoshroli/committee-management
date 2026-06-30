const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../../../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await db.query(schema);
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
