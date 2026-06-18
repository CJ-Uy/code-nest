import { redirect } from "next/navigation";

const LANDING_PAGE_URL = "https://sites.google.com/view/ateneo-code/landing";

export default function Home() {
	redirect(LANDING_PAGE_URL);
}
