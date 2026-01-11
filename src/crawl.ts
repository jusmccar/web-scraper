import { JSDOM } from "jsdom";

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
