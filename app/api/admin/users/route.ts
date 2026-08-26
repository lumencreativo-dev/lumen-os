import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                phone: true,
                location: true,
                createdAt: true,
                // Exclude password
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("GET Users Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "name, email, password requeridos" }, { status: 400 });
        }

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role?.toUpperCase() || 'TEAM',
                avatar: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("POST User Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
