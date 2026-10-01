const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function diagnose() {
  const env = fs.readFileSync('.env.local', 'utf8');
  // Parse env manually to avoid PowerShell regex issues
  const lines = env.split('\n');
  let url = '', key = '';
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      url = line.split('=').slice(1).join('=').trim().replace(/"/g, '');
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      key = line.split('=').slice(1).join('=').trim().replace(/"/g, '');
    }
  }
  
  console.log('URL:', url);
  console.log('KEY:', key.substring(0, 20) + '...');
  
  const supabase = createClient(url, key);

  // 1. Check clients
  const clients = await supabase.from('Client').select('*');
  console.log('\n=== CLIENTS ===');
  console.log('Data:', JSON.stringify(clients.data, null, 2));
  console.log('Error:', JSON.stringify(clients.error, null, 2));
  console.log('Count:', clients.data?.length);

  if (!clients.data || clients.data.length === 0) {
    console.log('\nNo clients found. Cannot test identity insert.');
    return;
  }

  const clientId = clients.data[0].id;
  console.log('\nUsing clientId:', clientId);

  // 2. Try inserting identity
  const insertResult = await supabase.from('ClientIdentity').insert({
    clientId: clientId,
    purpose: 'Test purpose',
    toneOfVoice: 'Test tone',
    archetype: 'Test archetype',
    constraints: 'Test constraints',
    foundersQuote: 'Test quote'
  }).select();
  
  console.log('\n=== INSERT IDENTITY ===');
  console.log('Data:', JSON.stringify(insertResult.data, null, 2));
  console.log('Error:', JSON.stringify(insertResult.error, null, 2));
  console.log('Status:', insertResult.status);
  console.log('StatusText:', insertResult.statusText);

  // 3. Check existing identities
  const identities = await supabase.from('ClientIdentity').select('*');
  console.log('\n=== ALL IDENTITIES ===');
  console.log('Data:', JSON.stringify(identities.data, null, 2));
  console.log('Error:', JSON.stringify(identities.error, null, 2));
}

diagnose().catch(console.error);
