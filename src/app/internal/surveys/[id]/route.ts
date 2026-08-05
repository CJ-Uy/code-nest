import { getD1Db } from "@/db/client";
import { getAppConfig } from "@/server/env";
import { getFeatureFlags } from "@/server/features";
import { splitAllowedOrigins } from "@/server/internal/cors";
import { createSurveysInternalHandlers } from "@/server/internal/surveys";

type SurveyRouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: SurveyRouteContext) {
	if (!getFeatureFlags().surveys) return new Response("Not found", { status: 404 });
	const config = getAppConfig();
	const { id } = await context.params;
	return createSurveysInternalHandlers({
		db: getD1Db(),
		deployEnv: config.DEPLOY_ENV ?? "prod",
		allowedOrigins: splitAllowedOrigins(config.SHARED_API_ALLOWED_ORIGINS),
	}).fetch(request, id);
}
