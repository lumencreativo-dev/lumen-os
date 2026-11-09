import { NextResponse } from 'next/server';
import { getConnectedMetaAccounts } from '@/lib/meta';

export async function GET() {
  try {
    const accounts = await getConnectedMetaAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al conectar con Meta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
