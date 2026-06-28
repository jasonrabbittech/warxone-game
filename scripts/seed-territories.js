#!/usr/bin/env node
/**
 * Seed Territories Script
 * Seeds Earth (~200) and Mars (~100) territories
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Earth territories (sample - in production, load from JSON file)
const earthTerritories = [
  { id: 'CN-BJ', name: 'Beijing', adjacent: ['CN-TJ', 'CN-HE'] },
  { id: 'CN-TJ', name: 'Tianjin', adjacent: ['CN-BJ', 'CN-HE'] },
  { id: 'CN-SH', name: 'Shanghai', adjacent: ['CN-JS', 'CN-ZJ'] },
  { id: 'CN-GZ', name: 'Guangzhou', adjacent: ['CN-GD', 'CN-GX'] },
  // ... 200+ territories
];

// Mars territories (sample)
const marsTerritories = [
  { id: 'M-OL', name: 'Olympus Mons', adjacent: ['M-AS', 'M-PA'] },
  { id: 'M-AS', name: 'Ascraeus Mons', adjacent: ['M-OL', 'M-PA'] },
  // ... 100+ territories
];

async function seed() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      multipleStatements: true,
    });

    console.log('Connected to database');

    // Seed Earth territories
    console.log(`Seeding ${earthTerritories.length} Earth territories...`);
    for (const territory of earthTerritories) {
      await connection.execute(
        `INSERT IGNORE INTO territories (id, name, world, adjacent) VALUES (?, ?, 'earth', ?)`,
        [territory.id, territory.name, JSON.stringify(territory.adjacent)]
      );
    }

    // Seed Mars territories
    console.log(`Seeding ${marsTerritories.length} Mars territories...`);
    for (const territory of marsTerritories) {
      await connection.execute(
        `INSERT IGNORE INTO territories (id, name, world, adjacent) VALUES (?, ?, 'mars', ?)`,
        [territory.id, territory.name, JSON.stringify(territory.adjacent)]
      );
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run seed
seed();
