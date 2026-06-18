import { LogIn } from "lucide-react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
			<section className="w-full max-w-md border border-border bg-card p-8 text-card-foreground">
				<p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">CODE member access</p>
				<h1 className="mt-3 text-4xl">Sign in to the portal</h1>
				<p className="mt-4 text-sm leading-6 text-muted-foreground">
					Use your approved Google account. Access is limited to current CODE members.
				</p>
				<form
					className="mt-8"
					action={async () => {
						"use server";
						await signIn("google", { redirectTo: "/portal" });
					}}
				>
					<Button className="w-full" type="submit">
						<LogIn />
						Continue with Google
					</Button>
				</form>
			</section>
		</main>
	);
}
