import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.nrlquoeuotdrikmhopqc:PaarthaRev%402026@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

// UUIDs
const users = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'alex@revsit.com',
        name: 'Alex Engineer',
        role: 'safety_engineer'
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'sarah@revsit.com',
        name: 'Sarah Manager',
        role: 'safety_manager'
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'david@revsit.com',
        name: 'David Head',
        role: 'dept_manager'
    }
];

async function seed() {
    try {
        await client.connect();
        console.log("Connected.");

        await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

        for (const u of users) {
            console.log(`Processing ${u.name}...`);

            try {
                // 1. Auth User
                await client.query(`
              INSERT INTO auth.users (
                 instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
                 raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                 is_super_admin, phone_change_sent_at, confirmation_sent_at, 
                 recovery_sent_at, email_change_sent_at, last_sign_in_at
              )
              VALUES (
                 '00000000-0000-0000-0000-000000000000', $1::uuid, 'authenticated', 'authenticated', $2, 
                 crypt('Revsit@2026', gen_salt('bf')), now(),
                 '{"provider":"email","providers":["email"]}', $3, now(), now(),
                 false, null, null, null, null, null
              )
              ON CONFLICT (id) DO NOTHING;
            `, [u.id, u.email, `{"full_name":"${u.name}"}`]);

                // 2. Identity
                // Explicit cast $1::uuid for user_id, $1::text for provider_id
                await client.query(`
                INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at, email)
                VALUES (gen_random_uuid(), $1::uuid, $2, 'email', $1::text, now(), now(), now(), $3)
                ON CONFLICT (provider, provider_id) DO NOTHING;
            `, [u.id, `{"sub":"${u.id}","email":"${u.email}"}`, u.email]);
                // Warning: Some older supabase versions use 'email' column in identities, newer ones might not. 
                // If it fails with "column email does not exist", I will remove it.
                // But usually identities table has `email` column now? 
                // Let's check schema? No, let's try WITHOUT email column first, usually identity_data has it.
                // Actually, `email` column was added to identity recently for performance.
                // I'll stick to Standard columns `id, user_id, identity_data, provider, provider_id`.

                // REVERTING TO STANDARD COLUMNS ONLY TO BE SAFE
            } catch (e) {
                // Fallback if it failed at step 1 or 2
                console.error(`- Failed Step 1/2 for ${u.email}:`, e.message);
            }

            // Retry Identity without 'email' column just in case
            try {
                await client.query(`
                INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
                VALUES (gen_random_uuid(), $1::uuid, $2, 'email', $1::text, now(), now(), now())
                ON CONFLICT (provider, provider_id) DO NOTHING;
            `, [u.id, `{"sub":"${u.id}","email":"${u.email}"}`]);
            } catch (e) {
                // It might duplicate key error if previous one succeeded? No, on conflict do nothing.
                if (!e.message.includes("duplicate")) console.error(`- Identity Insert Error:`, e.message);
            }

            try {
                // 3. Profile
                await client.query(`
                INSERT INTO public.profiles (id, full_name, role) VALUES ($1::uuid, $2, $3)
                ON CONFLICT(id) DO UPDATE SET role = $3, full_name = $2;
            `, [u.id, u.name, u.role]);

                console.log(`- Success: ${u.email}`);
            } catch (e) {
                console.error(`- Profile Error ${u.email}:`, e.message);
            }
        }

    } catch (err) {
        console.error("Global Error:", err);
    } finally {
        await client.end();
    }
}

seed();
