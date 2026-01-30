import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Password "PaarthaRev@2026" contains '@', so it might need encoding if passed in URL directly, 
// but here we can parse it or just use the connection string if pg handles it. 
// pg handles encoded passwords in connection strings.
// Encoded: PaarthaRev%402026
const connectionString = "postgresql://postgres.nrlquoeuotdrikmhopqc:PaarthaRev%402026@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false, // Required for some Supabase pooler connections
    },
});

async function migrate() {
    try {
        await client.connect();
        console.log("Connected to database.");

        const schemaPath = path.resolve('..', 'supabase', 'schema.sql');
        console.log(`Reading schema from: ${schemaPath}`);

        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing SQL...");
        await client.query(sql);

        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

migrate();
