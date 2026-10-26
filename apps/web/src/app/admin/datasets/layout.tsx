import { FrozenRouteNotice } from "@/components/layout/FrozenRouteNotice";

// Frozen for the MVP (docs/SPEC.md §1.2): the page in this segment is kept on disk
// but never rendered.
export default function FrozenLayout() {
  return <FrozenRouteNotice />;
}
