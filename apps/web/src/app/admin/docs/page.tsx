import { DocsView } from "../../../components/docs/DocsView";
import { DEFAULT_DOC } from "../../../content/docs";

export default function DocsHome() {
  return <DocsView slug={DEFAULT_DOC} />;
}
