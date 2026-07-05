import { AdminGroupIndex } from "../group-index";

export const dynamic = "force-dynamic";

export default function MembersGroupPage() {
	return <AdminGroupIndex segment="members" whoFor="Manage who is in CODE and who has admin access" />;
}
