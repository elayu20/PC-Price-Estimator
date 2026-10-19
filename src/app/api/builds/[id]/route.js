import { NextResponse } from "next/server";
import { prisma } from "../../../../../utils/prisma";
import { BUILD_ID_PATTERN, canEdit, limitWrites, parseBuildInput, publicBuild } from "../../../../../utils/builds";

async function findBuild(params) {
    const { id } = await params;
    if (!BUILD_ID_PATTERN.test(id)) return null;
    return prisma.build.findUnique({ where: { id } });
}

const notFound = () => NextResponse.json({ error: "Build not found" }, { status: 404 });
const forbidden = () => NextResponse.json({ error: "Only the browser that created this build can change it" }, { status: 403 });

// GET /api/builds/<id> -> { build }. Anyone with the link can read it
export async function GET(request, { params }) {
    const build = await findBuild(params);
    if (!build) return notFound();
    return NextResponse.json({ build: publicBuild(build) });
}

// PATCH /api/builds/<id> { name?, parts? } with `Authorization: Bearer <editToken>`
// -> { build }
export async function PATCH(request, { params }) {
    const limited = limitWrites(request);
    if (limited) return limited;

    const build = await findBuild(params);
    if (!build) return notFound();
    if (!canEdit(request, build)) return forbidden();

    const body = await request.json().catch(() => null);
    const { data, error } = await parseBuildInput(body, { partial: true });
    if (error) return NextResponse.json({ error }, { status: 400 });

    const updated = await prisma.build.update({ where: { id: build.id }, data });
    return NextResponse.json({ build: publicBuild(updated) });
}

// DELETE /api/builds/<id> with `Authorization: Bearer <editToken>` -> 204
export async function DELETE(request, { params }) {
    const limited = limitWrites(request);
    if (limited) return limited;

    const build = await findBuild(params);
    if (!build) return notFound();
    if (!canEdit(request, build)) return forbidden();

    await prisma.build.delete({ where: { id: build.id } });
    return new Response(null, { status: 204 });
}
