import Image from "next/image";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<header className="border-b bg-card">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<Link className="flex items-center gap-3" href="/" aria-label="CODE home">
						<Image src="/code-logo-full-navy.png" alt="CODE" width={140} height={48} priority style={{ height: "auto" }} />
					</Link>
					<Button asChild variant="ghost" size="sm" className="text-muted-foreground">
						<Link href="/signin">
							<KeyRound />
							Member sign in
						</Link>
					</Button>
				</div>
			</header>

			<section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
				<div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#06192F_0%,rgba(6,25,47,0.92)_48%,rgba(6,25,47,0.76)_100%)]" />
				<div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
					<div className="max-w-3xl">
						<Image src="/code-logo-full-white.png" alt="CODE" width={176} height={60} priority style={{ height: "auto" }} />
						<h1 className="mt-5 text-6xl font-bold text-white sm:text-7xl lg:text-8xl">CODE</h1>
						<p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
							Ateneo CODE runs student consulting practice, retention programming, and member events. This page
							is the public front door; member records, retention tools, and internal tools live in the portal.
						</p>
						<div className="mt-8">
							<Button asChild variant="secondary">
								<Link href="/signin">
									Member sign in
									<ArrowRight />
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
				<Card>
					<CardHeader>
						<CardTitle>Services</CardTitle>
						<CardDescription>
							Student-run consulting engagements for partner organizations, paired with formation programming
							for members.
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>About</CardTitle>
						<CardDescription>
							Ateneo CODE is a student organization. Membership runs on a per-term retention system tracked
							inside the member portal.
						</CardDescription>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Contact</CardTitle>
						<CardDescription>Reach the officer team through the org&#39;s usual contact channels.</CardDescription>
					</CardHeader>
				</Card>
			</section>

			<footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
				<p>CODE public site.</p>
				<Link className="text-xs hover:text-foreground" href="/signin">Member sign in</Link>
			</footer>
		</main>
	);
}
