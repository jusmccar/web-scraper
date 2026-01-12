import { crawlSiteAsync } from "./crawl";
import { writeCSVReport } from "./report";

async function main() {
	const cliArgs = process.argv.slice(2)

	if (cliArgs.length < 3) {
		console.error("Error: not enough arguments");
		process.exit(1);
	}

	if (cliArgs.length > 3) {
		console.error("Error: too many arguments");
		process.exit(1);
	}

	const baseURL = cliArgs[0];
	const maxConcurrency = Number(cliArgs[1]);
	const maxPages = Number(cliArgs[2]);

	console.log(`Starting crawler at: ${baseURL}`);

	const pageData = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

	writeCSVReport(pageData);
}

main();
