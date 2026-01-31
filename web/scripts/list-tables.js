import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.nrlquoeuotdrikmhopqc:PaarthaRev%402026@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function listTables() {
    try {
        await client.connect();
        console.log("Connected to database.");

        const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    `);

        console.log("\nTables in 'public' schema:");
        res.rows.forEach(row => console.log(`- ${row.table_name}`));

    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

listTables();
