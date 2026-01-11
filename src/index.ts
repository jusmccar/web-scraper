import { crawlPage } from "./crawl";

async function main() {
	const cliArgs = process.argv.slice(2)

	if (cliArgs.length < 1) {
		console.error("Error: at least one argument is required.");
		process.exit(1);
	}

	if (cliArgs.length > 1) {
		console.error("Error: more than one argument is not allowed.");
		process.exit(1);
	}

	const baseURL = cliArgs[0];
	console.log(`Starting crawler at: ${baseURL}`);

	const pages = await crawlPage(baseURL);

	console.log(pages);
}

main();
