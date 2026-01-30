import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.nrlquoeuotdrikmhopqc:PaarthaRev%402026@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function verify() {
    try {
        await client.connect();
        console.log("Verifying Users...");
        const res = await client.query("SELECT email, role, email_confirmed_at FROM auth.users");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

verify();
