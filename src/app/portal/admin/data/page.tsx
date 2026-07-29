import { AdminGroupIndex } from "../group-index";

export const dynamic = "force-dynamic";

export default function DataGroupPage() {
	return <AdminGroupIndex segment="data" whoFor="Configure events and points, record retention, and export the data" />;
}
