import test from "node:test";
import assert from "node:assert/strict";
import {
  getHeaderValue,
  isHtmlContentType,
  sanitizeHtmlForPreview,
} from "../.test-dist/utils/responseViewer.js";

test("HTML responses are detected from content-type (banner condition)", () => {
  const contentType = getHeaderValue({ "content-type": "text/html; charset=utf-8" }, "content-type");
  assert.equal(isHtmlContentType(contentType), true);
});

test("Pretty should be disabled for HTML responses", () => {
  const contentType = getHeaderValue({ "Content-Type": "text/html" }, "content-type");
  assert.equal(isHtmlContentType(contentType), true);
});

test("Preview sanitization strips executable script surfaces", () => {
  const html =
    `<html><body onload="alert(1)"><script>alert(1)</script><a href="javascript:alert(2)">x</a></body></html>`;
  const sanitized = sanitizeHtmlForPreview(html);
  assert.equal(sanitized.includes("<script"), false);
  assert.equal(/onload\s*=/.test(sanitized), false);
  assert.equal(/javascript:/i.test(sanitized), false);
});

test("JSON responses do not trigger HTML banner condition", () => {
  const contentType = getHeaderValue({ "content-type": "application/json" }, "content-type");
  assert.equal(isHtmlContentType(contentType), false);
});
