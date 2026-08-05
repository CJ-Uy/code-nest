import { notFound } from "next/navigation";
import { getFeatureFlags } from "@/server/features";

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
	if (!getFeatureFlags().notifications) notFound();
	return children;
}
