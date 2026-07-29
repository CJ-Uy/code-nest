import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RetentionAdminPage() {
	redirect("/portal/admin/data");
}
