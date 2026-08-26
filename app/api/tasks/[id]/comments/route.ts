import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();

        if (!body.content) {
            return NextResponse.json({ error: "Content required" }, { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: {
                content: body.content,
                authorId: body.authorId,
                taskId: id,
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
        });

        return NextResponse.json({ success: true, comment });
    } catch (error) {
        console.error("POST Comment Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const comments = await prisma.comment.findMany({
            where: { taskId: id },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ comments });
    } catch (error) {
        console.error("GET Comments Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
