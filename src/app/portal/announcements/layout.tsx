import { notFound } from "next/navigation";
import { getFeatureFlags } from "@/server/features";

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
	if (!getFeatureFlags().announcements) notFound();
	return children;
}
