import { expect, test } from "vitest";
import { getFirstParagraphFromHTML, getH1FromHTML, normalizeURL } from "./crawl";

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