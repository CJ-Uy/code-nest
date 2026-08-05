"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TourStep = { title: string; body: string };

// ponytail: a centered step-through walkthrough, not a per-element spotlight
// overlay. Targeting real shell elements with a cutout needs refs threaded
// through the shell; add that only if a guided highlight is actually requested.
export function GuidedTour({ steps, onComplete }: { steps: TourStep[]; onComplete: () => Promise<void> }) {
	const [index, setIndex] = useState(0);
	const [open, setOpen] = useState(true);
	if (!open || steps.length === 0) return null;

	const step = steps[index];
	const isLast = index === steps.length - 1;

	async function dismiss() {
		setOpen(false);
		await onComplete().catch(() => {});
	}

	return (
		<div className="fixed inset-0 z-[60] flex items-end justify-center bg-primary/50 p-4 animate-in fade-in-0 sm:items-center">
			<div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg animate-in slide-in-from-bottom-4">
				<div className="flex items-start justify-between gap-4">
					<span className="text-xs font-semibold uppercase tracking-wide text-accent">
						Step {index + 1} of {steps.length}
					</span>
					<button
						type="button"
						onClick={() => void dismiss()}
						aria-label="Skip tour"
						className="text-muted-foreground hover:text-foreground"
					>
						<X className="size-4" />
					</button>
				</div>
				<h2 className="mt-2 font-heading text-2xl text-foreground">{step.title}</h2>
				<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

				<div className="mt-5 flex items-center justify-between gap-3">
					<div className="flex gap-1.5">
						{steps.map((_, dotIndex) => (
							<span
								key={dotIndex}
								className={dotIndex === index ? "size-2 rounded-full bg-accent" : "size-2 rounded-full bg-border"}
							/>
						))}
					</div>
					<div className="flex gap-2">
						{index > 0 ? (
							<Button variant="outline" size="sm" onClick={() => setIndex((value) => value - 1)}>
								<ArrowLeft />
								Back
							</Button>
						) : null}
						{isLast ? (
							<Button size="sm" onClick={() => void dismiss()}>
								<Check />
								Done
							</Button>
						) : (
							<Button size="sm" onClick={() => setIndex((value) => value + 1)}>
								Next
								<ArrowRight />
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
