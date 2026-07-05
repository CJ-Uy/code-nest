import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { createNavPinAction, deleteNavPinAction, updateNavPinAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NavPinsAdminPage() {
	const actor = await requireActor();
	if (!can(actor, "nav:configure")) redirect("/portal/admin");
	const repositories = await getRepositories();
	// nav pins has no shared-dev internal proxy yet; degrade to an empty list instead of crashing.
	const pins = await repositories.navPins.list(actor).catch(() => []);

	return (
		<div className="grid gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Add a nav pin</CardTitle>
					<CardDescription>Pinned links every signed-in member sees in the top nav and mobile menu.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={createNavPinAction} className="grid gap-2 sm:grid-cols-5">
						<Input name="label" placeholder="Label" required />
						<Input name="url" type="url" placeholder="https://" required className="sm:col-span-2" />
						<Input name="icon" placeholder="Icon name" required />
						<Input name="position" type="number" defaultValue={0} min={0} required />
						<Button type="submit" className="sm:col-span-5">
							Add pin
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Current pins ({pins.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Position</TableHead>
								<TableHead>Label</TableHead>
								<TableHead>URL</TableHead>
								<TableHead>Icon</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{pins.map((pin) => (
								<TableRow key={pin.id}>
									<TableCell>
										<form action={updateNavPinAction} className="flex items-center gap-1">
											<input type="hidden" name="id" value={pin.id} />
											<input type="hidden" name="label" value={pin.label} />
											<input type="hidden" name="url" value={pin.url} />
											<input type="hidden" name="icon" value={pin.icon} />
											<Input name="position" type="number" defaultValue={pin.position} className="w-20" min={0} />
											<Button type="submit" size="sm" variant="outline">
												Save
											</Button>
										</form>
									</TableCell>
									<TableCell>{pin.label}</TableCell>
									<TableCell className="max-w-xs truncate">{pin.url}</TableCell>
									<TableCell>{pin.icon}</TableCell>
									<TableCell className="text-right">
										<form action={deleteNavPinAction}>
											<input type="hidden" name="id" value={pin.id} />
											<Button type="submit" size="sm" variant="outline">
												Remove
											</Button>
										</form>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
