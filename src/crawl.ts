import { JSDOM } from "jsdom";
import pLimit from "p-limit";

export class ConcurrentCrawler {
	baseURL: string;
	pages: Record<string, number>;
	limit: ReturnType<typeof pLimit>;

	constructor(baseURL: string, maxConcurrency: number) {
		this.baseURL = baseURL;
		this.pages = {};
		this.limit = pLimit(maxConcurrency);
	}

	private addPageVisit(normalizedURL: string): boolean {
		if (this.pages[normalizedURL] === undefined) {
			this.pages[normalizedURL] = 1;
			return true;
		}

		this.pages[normalizedURL]++;
		return false;
	}

	private async getHTML(url: string): Promise<string> {
		return await this.limit(async () => {
			try {
				const response = await fetch(url, { headers: { "User-Agent": "BootCrawler/1.0" } });

				if (response.status >= 400) {
					console.error(`Error fetching ${url}: ${response.status} ${response.statusText}`);
					return "";
				}

				const contentType = response.headers.get("Content-Type");

				if (!contentType || !contentType.includes("text/html")) {
					console.error(`Invalid Content-Type for ${url}: ${contentType ?? ""}`);
					return "";
				}

				return await response.text();
			} catch (err) {
				console.error(`Failed to fetch ${url}:`, err);
				return "";
			}
		});
	}

	private async crawlPage(currentURL: string): Promise<void> {
		try {
			const baseDomain = new URL(this.baseURL).hostname;
			const currentDomain = new URL(currentURL).hostname;

			if (baseDomain !== currentDomain) {
				return;
			}

			const normalizedURL = normalizeURL(currentURL);
			const isFirstVisit = this.addPageVisit(normalizedURL);

			if (!isFirstVisit) {
				return;
			}

			console.log(`Crawling: ${normalizedURL}`);

			const html = await this.getHTML(currentURL);

			if (!html) {
				return;
			}

			const linkRegex = /href="(.*?)"/g;
			const links = [];
			let match: RegExpExecArray | null;

			while (true) {
				match = linkRegex.exec(html)

				if (!match) {
					break;
				}

				let link = match[1];

				try {
					link = new URL(link, currentURL).toString();
				} catch {
					continue;
				}

				links.push(link);
			}

			const crawlPromises = links.map((nextURL) =>
				this.crawlPage(nextURL),
			);

			await Promise.all(crawlPromises);
		} catch (err) {
			console.error(`Error crawling ${currentURL}:`, err);
		}
	}

	async crawl(): Promise<Record<string, number>> {
		await this.crawlPage(this.baseURL);
		return this.pages;
	}
}

export interface ExtractedPageData {
	url: string;
	h1: string;
	first_paragraph: string;
	outgoing_links: string[];
	image_urls: string[];
}

export function extractPageData(html: string, pageURL: string): ExtractedPageData {
	return {
		url: pageURL,
		h1: getH1FromHTML(html),
		first_paragraph: getFirstParagraphFromHTML(html),
		outgoing_links: getURLsFromHTML(html, pageURL),
		image_urls: getImagesFromHTML(html, pageURL),
	};
}

export function normalizeURL(urlString: string): string {
	const url = new URL(urlString);
	const host = url.hostname;
	let path = url.pathname;

	if (path.endsWith("/")) {
		path = path.slice(0, -1);
	}

	return `${host}${path}`;
}

export function getH1FromHTML(html: string): string {
	const dom = new JSDOM(html);
	const h1 = dom.window.document.querySelector("h1");

	if (!h1 || !h1.textContent) {
		return "";
	}

	return h1.textContent;
}

export function getFirstParagraphFromHTML(html: string): string {
	let p: HTMLElement | null = null;
	const dom = new JSDOM(html);
	const document = dom.window.document;
	const main = document.querySelector("main");

	if (main) {
		p = main.querySelector("p");
	}

	if (!p) {
		p = document.querySelector("p");
	}

	if (!p || !p.textContent) {
		return "";
	}

	return p.textContent;
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
	const urls: string[] = [];
	const dom = new JSDOM(html);
	const document = dom.window.document;
	const links = document.querySelectorAll("a");

	links.forEach((link) => {
		const href = link.getAttribute("href");

		if (href) {
			const absoluteURL = new URL(href, baseURL).href;
			urls.push(absoluteURL);
		}
	});

	return urls;
};

export function getImagesFromHTML(html: string, baseURL: string): string[] {
	const images: string[] = [];
	const dom = new JSDOM(html);
	const document = dom.window.document;
	const imgElements = document.querySelectorAll("img");

	imgElements.forEach((img) => {
		const src = img.getAttribute("src");

		if (src) {
			const absoluteURL = new URL(src, baseURL).href;
			images.push(absoluteURL);
		}
	});

	return images;
}

export async function crawlSiteAsync(
	baseURL: string,
	maxConcurrency: number,
): Promise<Record<string, number>> {
	const crawler = new ConcurrentCrawler(baseURL, maxConcurrency);
	return await crawler.crawl();
}
