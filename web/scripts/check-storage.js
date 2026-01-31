import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nrlquoeuotdrikmhopqc.supabase.co';
const supabaseKey = 'sb_publishable_V_Yj3rABK5WSjItLxtI_hQ_PSwNyWrC';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    try {
        console.log("Fetching buckets...");
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error("Error listing buckets:", error.message);
            return;
        }

        console.log("Buckets found:");
        data.forEach(b => console.log(`- ${b.name} (Public: ${b.public})`));

        const exists = data.find(b => b.name === 'incident-photos');
        if (!exists) {
            console.log("\n!!! 'incident-photos' bucket is MISSING !!!");
        } else {
            console.log("\n'incident-photos' bucket exists.");
        }

    } catch (err) {
        console.error("Fatal error:", err);
    }
}

checkStorage();
