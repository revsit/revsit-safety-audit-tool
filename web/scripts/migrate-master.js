import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Parse connection string
// Format: postgresql://postgres.user:password@host:port/postgres
const DATABASE_URL = "postgresql://postgres.nrlquoeuotdrikmhopqc:PaarthaRev@2026@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

async function runMigration() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to database...");

        const sqlPath = path.join(projectRoot, 'supabase', 'master_data.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Applying Master Data Schema...");
        await client.query(sql);

        console.log("Schema applied successfully!");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.end();
    }
}

runMigration();
