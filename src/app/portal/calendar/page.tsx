import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { CalendarMonth } from "@/components/calendar-month";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage({
	searchParams,
}: {
	searchParams: Promise<{ year?: string; month?: string }>;
}) {
	const actor = await requireActor();
	const params = await searchParams;
	const now = new Date();
	const year = Number(params.year) || now.getUTCFullYear();
	const month = Number(params.month) || now.getUTCMonth() + 1;

	const repositories = await getRepositories();
	const items = await repositories.calendar.getMonth(actor, { year, month }).catch(() => []);

	return (
		<main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
			<h1 className="mb-4 font-heading text-2xl">Calendar</h1>
			<CalendarMonth items={items} monthLabel={`${MONTH_NAMES[month - 1]} ${year}`} />
		</main>
	);
}
