import { expect, test } from "vitest";
import { extractPageData, getFirstParagraphFromHTML, getH1FromHTML, getImagesFromHTML, getURLsFromHTML, normalizeURL } from "./crawl";

test("normalizeURL", () => {
	expect(normalizeURL("https://blog.boot.dev/path/")).toBe("blog.boot.dev/path")
	expect(normalizeURL("https://blog.boot.dev/path")).toBe("blog.boot.dev/path")
	expect(normalizeURL("http://blog.boot.dev/path/")).toBe("blog.boot.dev/path")
	expect(normalizeURL("http://blog.boot.dev/path")).toBe("blog.boot.dev/path")
});

test("getH1FromHTML", () => {
	const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
	const actual = getH1FromHTML(inputBody);
	const expected = "Test Title";
	expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML", () => {
	const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
	const actual = getFirstParagraphFromHTML(inputBody);
	const expected = "Main paragraph.";
	expect(actual).toEqual(expected);
});

test("getURLsFromHTML", () => {
	const baseURL = "https://blog.boot.dev";
	const html = `
    <html>
      <body>
        <a href="/about">About</a>
        <a href="https://example.com/contact">Contact</a>
        <a>No href</a>
      </body>
    </html>
  `;

	const actual = getURLsFromHTML(html, baseURL);
	const expected = ["https://blog.boot.dev/about", "https://example.com/contact"];

	expect(actual).toEqual(expected);
});

test("getImagesFromHTML", () => {
	const baseURL = "https://blog.boot.dev";
	const html = `
    <html>
      <body>
        <img src="/logo.png" alt="Logo">
        <img src="https://example.com/banner.jpg">
        <img> <!-- missing src -->
      </body>
    </html>
  `;

	const actual = getImagesFromHTML(html, baseURL);
	const expected = ["https://blog.boot.dev/logo.png", "https://example.com/banner.jpg"];

	expect(actual).toEqual(expected);
});

test("extractPageData", () => {
	const inputURL = "https://blog.boot.dev";
	const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

	const actual = extractPageData(inputBody, inputURL);
	const expected = {
		url: "https://blog.boot.dev",
		h1: "Test Title",
		first_paragraph: "This is the first paragraph.",
		outgoing_links: ["https://blog.boot.dev/link1"],
		image_urls: ["https://blog.boot.dev/image1.jpg"],
	};

	expect(actual).toEqual(expected);
});
