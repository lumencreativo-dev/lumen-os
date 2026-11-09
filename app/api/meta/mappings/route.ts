import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MAPPINGS_FILE = path.join(process.cwd(), 'data', 'meta_mappings.json');

function getMappings(): Record<string, any> {
  try {
    if (fs.existsSync(MAPPINGS_FILE)) {
      const raw = fs.readFileSync(MAPPINGS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading meta_mappings.json:', e);
  }
  return {};
}

function saveMappings(data: Record<string, any>) {
  try {
    const dir = path.dirname(MAPPINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing meta_mappings.json:', e);
  }
}

export async function GET() {
  const mappings = getMappings();
  return NextResponse.json({ success: true, mappings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, clientName, igUsername, facebookPageId, facebookPageName } = body;

    if (!clientId && !clientName) {
      return NextResponse.json(
        { error: 'Se requiere clientId o clientName para guardar el mapeo.' },
        { status: 400 }
      );
    }

    const key = clientId || clientName;
    const current = getMappings();

    current[key] = {
      clientId,
      clientName,
      igUsername: igUsername ? igUsername.replace(/^@/, '').trim() : undefined,
      facebookPageId,
      facebookPageName,
      updatedAt: new Date().toISOString()
    };

    saveMappings(current);

    return NextResponse.json({ success: true, mappings: current });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al guardar mapeo' }, { status: 500 });
  }
}
