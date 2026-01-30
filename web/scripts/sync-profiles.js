import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.nrlquoeuotdrikmhopqc:PaarthaRev%402026@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

const roleMapping = [
    { email: 'alex@revsit.com', role: 'safety_engineer', name: 'Alex Engineer' },
    { email: 'sarah@revsit.com', role: 'safety_manager', name: 'Sarah Manager' },
    { email: 'david@revsit.com', role: 'dept_manager', name: 'David Head' }
];

async function sync() {
    try {
        await client.connect();
        console.log("Connected to database.");

        for (const mapping of roleMapping) {
            console.log(`Syncing ${mapping.email}...`);

            // 1. Find user ID from auth.users
            const res = await client.query("SELECT id FROM auth.users WHERE email = $1", [mapping.email]);

            if (res.rows.length > 0) {
                const userId = res.rows[0].id;
                console.log(`Found ID: ${userId}`);

                // 2. Upsert into public.profiles
                await client.query(`
          INSERT INTO public.profiles (id, full_name, role)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO UPDATE 
          SET role = $3, full_name = $2;
        `, [userId, mapping.name, mapping.role]);

                console.log(`- Profile updated successfully.`);
            } else {
                console.warn(`! User not found for email: ${mapping.email}`);
            }
        }

        console.log("Sync completed!");

    } catch (err) {
        console.error("Sync failed:", err);
    } finally {
        await client.end();
    }
}

sync();
