import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: users, error } = await supabase
            .from("User")
            .select("id, name, email, role, avatar, createdAt")
            .order("createdAt", { ascending: false });

        if (error) {
            console.error("GET Users Error:", error);
            return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
        }

        return NextResponse.json(users);
    } catch (error) {
        console.error("GET Users Exception:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
        }

        const supabase = await createClient();

        // Check if user exists
        const { data: existingUser } = await supabase
            .from("User")
            .select("id")
            .eq("email", email)
            .single();

        if (existingUser) {
            return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const avatar = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

        const { data: newUser, error } = await supabase
            .from("User")
            .insert({
                name,
                email,
                password: hashedPassword,
                role,
                avatar
            })
            .select("id, name, email, role, avatar, createdAt")
            .single();

        if (error) {
            console.error("Create User Error:", error);
            return NextResponse.json({ error: "Error creating user" }, { status: 500 });
        }

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error("POST User Exception:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
