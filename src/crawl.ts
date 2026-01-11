import { JSDOM } from "jsdom";

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
