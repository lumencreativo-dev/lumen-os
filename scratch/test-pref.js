const SUPABASE_URL = "https://nufggtvilxlgojkjfwqq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZmdndHZpbHhsZ29qa2pmd3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3NDQ5NjcsImV4cCI6MjEwNjMyMDk2N30.rugx0E8tRxKB1r-qORFPoUC37rYZEn44lrj7ynUNetc";

async function check() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/StylePreference`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            clientId: "dummy",
            rule: "test",
            category: "DISEÑO",
            isStrict: true,
            context: ""
        })
    });
    console.log(await res.text());
}
check();
