export default function EventDetailLoading() {
	return (
		<div role="status" aria-label="Loading event" className="grid animate-pulse gap-5 motion-reduce:animate-none">
			<span className="sr-only">Loading event</span>
			<div className="h-5 w-32 rounded bg-muted" />
			<div className="grid gap-5 lg:grid-cols-[1fr_320px]">
				<div className="h-80 rounded-lg border bg-card" />
				<div className="grid gap-5">
					<div className="h-48 rounded-lg border bg-card" />
					<div className="h-72 rounded-lg border bg-card" />
				</div>
			</div>
		</div>
	);
}
