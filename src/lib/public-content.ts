export const publicArticles = [
	{
		slug: "member-formation-through-practice",
		title: "Member formation through practice",
		category: "Reflection",
		date: "June 2026",
		excerpt: "How CODE turns project work, feedback, and shared review into member growth.",
		readTime: "6 min read",
	},
	{
		slug: "what-retention-points-are-for",
		title: "What retention points are for",
		category: "Explainer",
		date: "June 2026",
		excerpt: "A public guide to the retention system, what it measures, and what stays inside the member portal.",
		readTime: "4 min read",
	},
	{
		slug: "case-study-public-notes",
		title: "Case study public notes",
		category: "Case note",
		date: "May 2026",
		excerpt: "A non-confidential look at how CODE documents organizational learning after a project.",
		readTime: "5 min read",
	},
];

export const publicResources = [
	"Organization development primer",
	"Event planning checklist",
	"Reflection circle guide",
	"Public announcement archive",
];

export function getArticle(slug: string) {
	return publicArticles.find((article) => article.slug === slug);
}
