import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { success: false, message: 'Faltan variables de entorno de Supabase' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Despertar la base de datos
        const { data, error } = await supabase
            .from('PlannerClient')
            .select('id')
            .limit(1);

        if (error) {
            // Intentar con Client si PlannerClient fallara
            const fallback = await supabase.from('Client').select('id').limit(1);
            if (fallback.error) {
                return NextResponse.json(
                    { success: false, error: error.message, fallbackError: fallback.error.message },
                    { status: 500 }
                );
            }
        }

        // 2. Auto-publicar piezas en 'Programado' cuya fecha de publicación ya llegó o pasó
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: autoPublished, error: autoPubError } = await supabase
            .from('PlannerItem')
            .update({ status: 'Publicado' })
            .eq('status', 'Programado')
            .lte('date', todayStr)
            .select('id');

        return NextResponse.json({
            success: true,
            status: 'active',
            message: 'Supabase keep-alive ping exitoso. Base de datos activa y protegida contra pausa.',
            timestamp: new Date().toISOString(),
            recordsChecked: data?.length ?? 0,
            autoPublishedCount: autoPublished?.length ?? 0,
            autoPubError: autoPubError?.message || null
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || 'Error desconocido' },
            { status: 500 }
        );
    }
}
