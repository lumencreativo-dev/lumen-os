import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: user, error } = await supabase
            .from("User")
            .select("*")
            .eq("email", email)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        }

        // Return user data (excluding password)
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.toLowerCase(),
                avatar: user.avatar || user.name.split(' ').map((n: any) => n[0]).join('').toUpperCase(),
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
