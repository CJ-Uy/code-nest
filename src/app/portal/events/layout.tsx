import { notFound } from "next/navigation";
import { getFeatureFlags } from "@/server/features";

export default function EventsLayout({ children }: { children: React.ReactNode }) {
	if (!getFeatureFlags().retention) notFound();
	return children;
}
