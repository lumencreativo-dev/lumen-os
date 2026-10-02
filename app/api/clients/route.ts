import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        
        // Fetch clients
        const { data: clients, error } = await supabase
            .from('Client')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error("Supabase GET Clients Error:", error);
            return NextResponse.json({ clients: [], error: error.message }, { status: 500 });
        }

        return NextResponse.json({ clients: clients || [], source: "supabase" });
    } catch (error) {
        console.error("GET Clients Error:", error);
        return NextResponse.json({ clients: [], error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { name, email, contactPhone, instagram, website, contactName, status } = body;

        if (!name) {
            return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
        }

        const portalToken = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

        const { data: newClient, error } = await supabase.from('Client').insert({
            name: name.trim(),
            email,
            contactPhone: contactPhone || body.phone,
            contactName: contactName || body.contactPerson,
            portalToken,
            instagram: body.instagram,
            industry: body.industry,
            whatsapp: body.whatsapp,
            paymentDay: body.paymentDay,
            address: body.address,
            taxId: body.taxId,
            website: body.website,
            notes: body.notes,
            brandColor: body.brandColor,
            logoUrl: body.logoUrl
        }).select().single();

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            client: newClient,
            portalLink: `/portal/${newClient.portalToken}`,
        });
    } catch (error) {
        console.error("POST Client Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "id requerido" }, { status: 400 });
        }

        // Remove properties that don't belong to the Client table in Supabase
        const { socialCredentials, phone, contactPerson, status, token, portalToken, ...clientUpdates } = updates as any;

        if (phone) clientUpdates.contactPhone = phone;
        if (contactPerson) clientUpdates.contactName = contactPerson;

        const { data: updatedClient, error } = await supabase
            .from('Client')
            .update(clientUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error("Supabase update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, client: updatedClient });
    } catch (error) {
        console.error("PUT Client Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "id requerido" }, { status: 400 });
        }

        const { error } = await supabase.from('Client').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Client Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
