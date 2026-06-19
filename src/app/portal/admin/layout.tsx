import { redirect } from "next/navigation";
import { getActor } from "@/server/auth/actor";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
			<div className="mb-6">
				<p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Admin</p>
			</div>
			{children}
		</div>
	);
}
