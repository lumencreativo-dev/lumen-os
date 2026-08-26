import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyTaskUpdate } from "@/lib/discord";

export async function GET() {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                client: { select: { id: true, name: true } },
                subtasks: true,
                comments: {
                    include: { author: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                _count: { select: { subtasks: true, comments: true } },
            },
        });

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error("API Tasks Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.title) {
            return NextResponse.json({ error: "Title required" }, { status: 400 });
        }

        const newTask = await prisma.task.create({
            data: {
                title: body.title,
                description: body.description,
                status: (body.status || 'OPEN').toUpperCase(),
                priority: (body.priority || 'MEDIUM').toUpperCase(),
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                project: body.project,
                tags: body.tags || [],
                assignedToId: body.assignedToId,
                clientId: body.clientId,
                subtasks: body.subtasks?.length ? {
                    create: body.subtasks.map((st: any) => ({
                        title: st.title,
                        completed: st.completed || false,
                    })),
                } : undefined,
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
                subtasks: true,
            },
        });

        notifyTaskUpdate({
            titulo: newTask.title,
            estado: newTask.status,
            asignado: newTask.assignedTo?.name,
        }).catch(console.error);

        return NextResponse.json({ success: true, task: newTask });
    } catch (error) {
        console.error("POST Task Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const updatedTask = await prisma.task.update({
            where: { id },
            data: {
                title: updates.title,
                description: updates.description,
                status: updates.status?.toUpperCase(),
                priority: updates.priority?.toUpperCase(),
                dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
                project: updates.project,
                tags: updates.tags,
                assignedToId: updates.assignedToId,
                clientId: updates.clientId,
            },
            include: {
                assignedTo: { select: { id: true, name: true } },
                client: { select: { id: true, name: true } },
                subtasks: true,
            },
        });

        if (updates.status) {
            notifyTaskUpdate({
                titulo: updatedTask.title,
                estado: updatedTask.status,
                asignado: updatedTask.assignedTo?.name,
                cliente: updatedTask.client?.name,
            }).catch(console.error);
        }

        return NextResponse.json({ success: true, task: updatedTask });
    } catch (error) {
        console.error("PUT Task Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
