import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

const LANDING_PAGE_URL = "https://sites.google.com/view/ateneo-code/landing";

function GoogleIcon() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
			<path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3z" />
			<path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.6-2.5L15.4 17c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
			<path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6z" />
			<path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.9 9.4 6.1 12 6.1z" />
		</svg>
	);
}

export default function SignInPage() {
	return (
		<main className="grid min-h-screen place-items-center bg-primary px-5 py-12 text-white">
			<div className="w-full max-w-sm">
				<span className="mx-auto grid size-16 place-items-center rounded-full bg-white">
					<Image src="/code-falcon-transparent.png" alt="CODE" width={44} height={49} priority className="h-12 w-auto object-contain" />
				</span>
				<section className="mt-7 rounded-lg border border-white/15 bg-white/[0.04] p-7 sm:p-8">
					<p className="text-xs font-semibold uppercase text-[#90B4CC]">Member access</p>
					<h1 className="mt-3 font-heading text-4xl">Welcome back</h1>
					<p className="mt-3 text-sm leading-6 text-white/65">Sign in with your approved Google account to enter the member portal.</p>
					<form
						className="mt-7"
						action={async () => {
							"use server";
							await signIn("google", { redirectTo: "/portal" });
						}}
					>
						<Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90" type="submit">
							<GoogleIcon />
							Continue with Google
						</Button>
					</form>
				</section>
				<a href={LANDING_PAGE_URL} className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#90B4CC] hover:text-white">
					<ArrowLeft className="size-4" />
					Back to the public site
				</a>
			</div>
		</main>
	);
}
