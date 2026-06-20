import { notFound, redirect } from "next/navigation";
import { Send } from "lucide-react";
import { getRepositories } from "@/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getActor } from "@/server/auth/actor";
import { submitResponseAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MemberSurveyPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ t?: string; done?: string }>;
}) {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	const { id } = await params;
	const { t: token, done } = await searchParams;
	const repositories = await getRepositories();
	// surveys has no shared-dev internal proxy yet; degrade to not-found instead of crashing.
	const detail = await repositories.surveys.getForRespondent(id).catch(() => null);
	if (!detail) notFound();

	if (done) {
		return (
			<main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">Thank you</CardTitle>
						<CardDescription>Your response was recorded anonymously.</CardDescription>
					</CardHeader>
				</Card>
			</main>
		);
	}

	return (
		<main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">{detail.survey.title}</CardTitle>
					<CardDescription>Your answers are anonymous. They cannot be traced back to you.</CardDescription>
				</CardHeader>
				<CardContent>
					{!token ? (
						<p className="text-sm text-muted-foreground">This survey link is missing its access token.</p>
					) : (
						<form action={submitResponseAction} className="grid gap-5">
							<input type="hidden" name="surveyId" value={detail.survey.id} />
							<input type="hidden" name="token" value={token} />
							{detail.questions.map((question) => (
								<label key={question.id} className="grid gap-2 text-sm font-medium">
									{question.prompt}
									{question.type === "text" ? (
										<Textarea name={`q:${question.id}`} rows={3} />
									) : (
										<Input name={`q:${question.id}`} />
									)}
								</label>
							))}
							<div>
								<Button type="submit">
									<Send />
									Submit response
								</Button>
							</div>
						</form>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
