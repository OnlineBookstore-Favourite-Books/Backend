const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const REQUIRED_ENV = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];

const missingVars = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

const DB_NAME = process.env.DB_NAME;
const ROOT_DIR = path.join(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT_DIR, "database", "schema.sql");
const SEED_PATH = path.join(ROOT_DIR, "database", "seed.sql");

const normalizeSql = (sqlText) => sqlText.replace(/\bfavourite_books_db\b/g, DB_NAME);

const readSqlFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`);
  }

  return fs.readFileSync(filePath, "utf8");
};

const run = async () => {
  let connection;

  try {
    const rawSchemaSql = readSqlFile(SCHEMA_PATH);
    const rawSeedSql = readSqlFile(SEED_PATH);

    const schemaSql = normalizeSql(rawSchemaSql);
    const seedSql = normalizeSql(rawSeedSql);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });

    console.log("Running schema...");
    await connection.query(schemaSql);

    console.log("Running seed data...");
    await connection.query(seedSql);

    console.log(`Database setup complete for '${DB_NAME}'.`);
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

run();
