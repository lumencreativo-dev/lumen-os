import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const lead = await prisma.lead.findFirst({
            where: { OR: [{ id }, { name: id }] },
            include: {
                pipeline: true,
                column: true,
                assignedTo: { select: { id: true, name: true, avatar: true } },
            },
        });

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        return NextResponse.json({ lead });
    } catch (error) {
        console.error("API Lead Detail Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const lead = await prisma.lead.findFirst({
            where: { OR: [{ id }, { name: id }] },
        });

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        await prisma.lead.delete({ where: { id: lead.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Lead Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
