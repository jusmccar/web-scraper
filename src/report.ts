import * as fs from "node:fs";
import * as path from "node:path";

export interface ExtractedPageData {
	h1?: string;
	first_paragraph?: string;
	outgoing_link_urls?: string[];
	image_urls?: string[];
}

function csvEscape(field: string) {
	const str = field ?? "";
	const needsQuoting = /[",\n]/.test(str);
	const escaped = str.replace(/"/g, '""');
	return needsQuoting ? `"${escaped}"` : escaped;
}

export function writeCSVReport(
	pageData: Record<string, ExtractedPageData>,
	filename = "report.csv",
): void {
	const headers = ["page_url", "h1", "first_paragraph", "outgoing_link_urls", "image_urls"];
	const rows: string[] = [headers.join(",")];

	for (const [url, page] of Object.entries(pageData)) {
		const row = [
			csvEscape(url),
			csvEscape(page.h1 ?? ""),
			csvEscape(page.first_paragraph ?? ""),
			csvEscape((page.outgoing_link_urls ?? []).join(";")),
			csvEscape((page.image_urls ?? []).join(";")),
		];
		rows.push(row.join(","));
	}

	const filePath = path.resolve(process.cwd(), filename);
	fs.writeFileSync(filePath, rows.join("\n"), { encoding: "utf8" });
	console.log(`CSV report written to ${filePath}`);
}
