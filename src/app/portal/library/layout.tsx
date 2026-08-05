import { notFound } from "next/navigation";
import { getFeatureFlags } from "@/server/features";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
	if (!getFeatureFlags().library) notFound();
	return children;
}
