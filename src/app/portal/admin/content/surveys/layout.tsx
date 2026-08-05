import { notFound } from "next/navigation";
import { getFeatureFlags } from "@/server/features";

export default function AdminSurveysLayout({ children }: { children: React.ReactNode }) {
	if (!getFeatureFlags().surveys) notFound();
	return children;
}
