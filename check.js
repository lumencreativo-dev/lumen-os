const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function check() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?(.*?)"?$/m);
  const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?(.*?)"?$/m);
  
  if (!urlMatch || !keyMatch) {
    console.error("Missing env vars locally");
    return;
  }
  
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  const { data, error } = await supabase.from('User').select('*');
  console.log("USERS IN DB:", JSON.stringify(data, null, 2));
  console.log("ERROR:", error);
}

check();
