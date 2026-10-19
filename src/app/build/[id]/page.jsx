import Builder from "../../../../components/Builder";
import { prisma } from "../../../../utils/prisma";
import { BUILD_ID_PATTERN } from "../../../../utils/builds";

// Puts the build's name in the tab title, and in previews of shared links
export async function generateMetadata({ params }) {
  const { id } = await params;
  const build = BUILD_ID_PATTERN.test(id)
    ? await prisma.build.findUnique({ where: { id }, select: { name: true } })
    : null;
  return { title: build ? `${build.name} | PC Price Estimator` : "PC Price Estimator" };
}

// /build/<id>: the picker with a saved build opened
export default async function BuildPage({ params }) {
  const { id } = await params;
  return <Builder buildId={id} />;
}
