import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage(props: { params: Promise<{ token: string }> }) {
    const { token } = await props.params;
    const supabase = await createClient();
    
    // Fetch Client by token
    const { data: client, error } = await supabase
        .from("Client")
        .select("*")
        .eq("portalToken", token)
        .single();

    if (error || !client) {
        return notFound();
    }

    // Fetch existing Identity if any
    const { data: identity } = await supabase
        .from("ClientIdentity")
        .select("*")
        .eq("clientId", client.id)
        .single();

    return <OnboardingWizard initialClient={client} initialIdentity={identity} />;
}
