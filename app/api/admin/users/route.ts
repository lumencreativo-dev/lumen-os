import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import bcrypt from "bcryptjs";

// MOCKED FOR NOW TO PREVENT CRASH - WE WILL MIGRATE THIS TO SUPABASE AUTH IN PHASE 6
export async function GET() {
    try {
        // Return mock users for the UI to not crash, returning as an array instead of object 
        // to match the frontend `setUsers(data)` expectation.
        const mockUsers = [
            { id: "1", name: "Administrador", username: "admin", role: "admin", avatar: "AD" }
        ];

        return NextResponse.json(mockUsers);
    } catch (error) {
        console.error("GET Users Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    return NextResponse.json({ error: "Creación de usuarios deshabilitada temporalmente hasta migrar a Supabase Auth" }, { status: 501 });
}
