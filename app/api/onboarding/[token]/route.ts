import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request, props: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await props.params;
        const body = await request.json();
        const { clientData, identityData } = body;

        const supabase = await createClient();

        // Find the client by portalToken
        const { data: client, error: clientError } = await supabase
            .from("Client")
            .select("id")
            .eq("portalToken", token)
            .single();

        if (clientError || !client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        const clientId = client.id;

        // Update Client Basic Info
        const { error: updateError } = await supabase
            .from("Client")
            .update({
                industry: clientData.industry,
                website: clientData.website,
                contactName: clientData.contactName,
                contactPhone: clientData.contactPhone,
                updatedAt: new Date().toISOString()
            })
            .eq("id", clientId);

        if (updateError) {
            console.error("Error updating client:", updateError);
            return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
        }

        // Check if identity exists
        const { data: existingIdentity } = await supabase
            .from("ClientIdentity")
            .select("id")
            .eq("clientId", clientId)
            .single();

        const identityPayload = {
            purpose: identityData.purpose,
            toneOfVoice: identityData.toneOfVoice,
            archetype: identityData.archetype,
            targetAudience: identityData.targetAudience,
            competitors: identityData.competitors,
            updatedAt: new Date().toISOString()
        };

        if (existingIdentity) {
            await supabase
                .from("ClientIdentity")
                .update(identityPayload)
                .eq("clientId", clientId);
        } else {
            await supabase
                .from("ClientIdentity")
                .insert({
                    clientId,
                    ...identityPayload
                });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Onboarding API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
