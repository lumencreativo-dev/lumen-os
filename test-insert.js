const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?(.*?)"?$/m);
  const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?(.*?)"?$/m);
  const supabase = createClient(urlMatch[1], keyMatch[1]);

  const { data: client } = await supabase.from('Client').select('*').limit(1).single();
  console.log('Client ID:', client?.id);
  if (!client) {
      console.log("No client found");
      return;
  }
  const { data, error } = await supabase.from('ClientIdentity').insert({
    clientId: client.id,
    purpose: 'Test'
  }).select();
  
  console.log('INSERT RESULT:', data);
  console.log('INSERT ERROR:', error);
}

test();
