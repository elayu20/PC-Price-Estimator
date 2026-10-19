import { NextResponse } from "next/server";
import { prisma } from "../../../../utils/prisma";
import {
    BUILD_ID_PATTERN, newBuildId, newEditToken, hashToken, limitWrites,
    parseBuildInput, publicBuild, withCachedTotals,
} from "../../../../utils/builds";

// Most builds one list request can ask for
const MAX_IDS = 50;

// GET /api/builds?ids=a,b,c -> { builds: [...] }, for the "My builds" list.
// Each build gets totalCad / unpricedCount from cached prices. Ids that don't
// exist (e.g. deleted) are just missing from the result
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const ids = (searchParams.get("ids") ?? "")
        .split(",")
        .filter(id => BUILD_ID_PATTERN.test(id))
        .slice(0, MAX_IDS);

    if (ids.length === 0) return NextResponse.json({ builds: [] });

    const builds = await prisma.build.findMany({ where: { id: { in: ids } } });
    return NextResponse.json({ builds: await withCachedTotals(builds.map(publicBuild)) });
}

// POST /api/builds { name, parts } -> { build, editToken }
// The edit token is only ever sent here. The client keeps it to change the
// build later
export async function POST(request) {
    const limited = limitWrites(request);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const { data, error } = await parseBuildInput(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const editToken = newEditToken();

    // An id collision is very unlikely, but retry a few times rather than fail
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const build = await prisma.build.create({
                data: { id: newBuildId(), editTokenHash: hashToken(editToken), ...data },
            });
            return NextResponse.json({ build: publicBuild(build), editToken }, { status: 201 });
        } catch (err) {
            if (err.code !== "P2002") throw err;
        }
    }
    return NextResponse.json({ error: "Could not create build" }, { status: 500 });
}
