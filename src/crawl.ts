import { JSDOM } from "jsdom";
import pLimit from "p-limit";

export class ConcurrentCrawler {
	baseURL: string;
	pages: Record<string, ExtractedPageData>;
	limit: ReturnType<typeof pLimit>;
	maxPages: number;
	shouldStop: boolean;
	allTasks: Set<Promise<void>>;
	abortController: AbortController;

	constructor(baseURL: string, maxConcurrency: number, maxPages: number) {
		this.baseURL = baseURL;
		this.pages = {};
		this.limit = pLimit(maxConcurrency);
		this.maxPages = maxPages;
		this.shouldStop = false;
		this.allTasks = new Set();
		this.abortController = new AbortController();
	}

	private addPageVisit(normalizedURL: string): boolean {
		if (this.shouldStop) {
			return false;
		}

		if (this.pages[normalizedURL] === undefined) {
			if (Object.keys(this.pages).length >= this.maxPages) {
				this.shouldStop = true;
				console.log("Reached maximum number of pages to crawl.");
				this.abortController.abort();
				return false;
			}

			return true;
		}

		return false;
	}

	private async getHTML(url: string): Promise<string> {
		return await this.limit(async () => {
			try {
				const response = await fetch(url, {
					headers: { "User-Agent": "BootCrawler/1.0" },
					signal: this.abortController.signal
				});

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
		if (this.shouldStop) {
			return;
		}

		try {
			const baseDomain = new URL(this.baseURL).hostname;
			const currentDomain = new URL(currentURL).hostname;

			if (baseDomain !== currentDomain) {
				return;
			}

			const normalizedURL = normalizeURL(currentURL);
			const isFirstVisit = this.addPageVisit(normalizedURL);

			if (!isFirstVisit || this.shouldStop) {
				return;
			}

			console.log(`Crawling: ${normalizedURL}`);

			const html = await this.getHTML(currentURL);

			if (!html || this.shouldStop) {
				return;
			}

			const pageData = extractPageData(html, currentURL);
			this.pages[normalizedURL] = pageData;

			const linkRegex = /href="(.*?)"/g;
			let match: RegExpExecArray | null;

			while (true) {
				match = linkRegex.exec(html);

				if (!match) {
					break
				}

				if (this.shouldStop) {
					break
				}

				let link = match[1];

				try {
					link = new URL(link, currentURL).toString();
				} catch {
					continue;
				}

				const task = this.crawlPage(link);
				this.allTasks.add(task);
				task.finally(() => {
					this.allTasks.delete(task);
				});
			}
		} catch (err) {
			console.error(`Error crawling ${currentURL}:`, err);
		}
	}

	async crawl(): Promise<Record<string, ExtractedPageData>> {
		const initialTask = this.crawlPage(this.baseURL);
		this.allTasks.add(initialTask);
		initialTask.finally(() => this.allTasks.delete(initialTask));

		while (this.allTasks.size > 0) {
			await Promise.all(Array.from(this.allTasks));
		}

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
	maxPages: number
): Promise<Record<string, ExtractedPageData>> {
	const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
	return await crawler.crawl();
}