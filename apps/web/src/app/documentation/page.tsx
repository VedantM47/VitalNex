import { DocsView } from "../../components/docs/DocsView";
import { DEFAULT_DOC } from "../../content/docs";

// Public documentation: no sign-in (the route is not in PROTECTED_ROUTES, lib/roles.ts).
export default function PublicDocsHome() {
  return <DocsView slug={DEFAULT_DOC} mode="public" />;
}
