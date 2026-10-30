import { DocsView } from "../../../../components/docs/DocsView";
import { DOC_PAGES } from "../../../../content/docs";

export function generateStaticParams() {
  return DOC_PAGES.map((p) => ({ slug: p.slug }));
}

export default async function DocPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DocsView slug={slug} />;
}
