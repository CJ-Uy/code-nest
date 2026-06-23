import { Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/public/contact-form";
import { PlaceholderBlock } from "@/components/public/placeholder-block";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { CONTACTS, ORG } from "@/content/site";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "Contact — CODE" };

export default function ContactPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SiteHeader />

			<section className="border-b border-border bg-card">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Contact</p>
					<h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight sm:text-5xl">Let&apos;s talk about your organization</h1>
					<p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
						Reach the right point of contact, or send us a message and we&apos;ll route it for you.
					</p>
				</div>
			</section>

			<section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
				<div className="grid gap-6">
					<div className="grid gap-3">
						{CONTACTS.map((rep) => (
							<Card key={rep.email}>
								<CardContent className="flex items-start gap-3 py-4">
									<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-accent">
										<Mail className="size-5" />
									</span>
									<div className="min-w-0">
										<p className="font-medium">{rep.role}</p>
										<p className="text-sm text-muted-foreground">{rep.scope}</p>
										<a href={`mailto:${rep.email}`} className="mt-1 block truncate text-sm text-accent hover:underline">
											{rep.email}
										</a>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
					<div className="rounded-2xl border border-border p-4">
						<p className="flex items-center gap-2 text-sm font-medium">
							<MapPin className="size-4 text-accent" />
							Find us
						</p>
						<p className="mt-1 text-sm text-muted-foreground">{ORG.room}</p>
						<p className="text-sm text-muted-foreground">{ORG.campus}</p>
						<PlaceholderBlock label="Campus map" className="mt-3 aspect-[16/9]" />
					</div>
				</div>

				<div>
					<h2 className="font-heading text-2xl">Send a message</h2>
					<p className="mt-1 text-sm text-muted-foreground">We read every inquiry. Expect a reply over email.</p>
					<div className="mt-5">
						<ContactForm />
					</div>
				</div>
			</section>

			<SiteFooter />
		</div>
	);
}
