import { mergeURLs, mergeHeaders } from "./utils.ts";
import {
  assert,
  assertThrows,
  assertEquals,
} from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("mergeURLs - url and base as string", () => {
  assert(
    mergeURLs("/user", "http://example.com/api/").toString() ===
      "http://example.com/api/user"
  );
  assert(
    mergeURLs("user", "http://example.com/api").toString() ===
      "http://example.com/api/user"
  );
  assert(
    mergeURLs("/user", "http://example.com/api").toString() ===
      "http://example.com/api/user"
  );
  assert(
    mergeURLs("user", "http://example.com/api/").toString() ===
      "http://example.com/api/user"
  );

  assert(
    mergeURLs("/user", "http://example.com/api?a=3#abc").toString() ===
      "http://example.com/api/user?a=3#abc"
  );
});

Deno.test("mergeURLs - base as URL", () => {
  assert(
    mergeURLs("/user", new URL("http://example.com/api/")).toString() ===
      "http://example.com/api/user"
  );
  assert(
    mergeURLs("/user", new URL("http://example.com/api?a=3#abc")).toString() ===
      "http://example.com/api/user?a=3#abc"
  );
});

Deno.test("mergeURLs - url and base as URL", () => {
  assert(
    mergeURLs(
      new URL("http://example.com/api/user"),
      new URL("http://example.com/api/")
    ).toString() === "http://example.com/api/user"
  );
});

Deno.test("mergeURLs - without base", () => {
  assert(
    mergeURLs(new URL("http://example.com/api/user")).toString() ===
      "http://example.com/api/user"
  );
  assert(
    mergeURLs("http://example.com/api/user").toString() ===
      "http://example.com/api/user"
  );
  assertThrows(() => mergeURLs("/api/url"));
});

const headersEqual = (h1: HeadersInit, h2: HeadersInit) => {
  const _h1 = new Headers(h1);
  const _h2 = new Headers(h2);

  for (const [key, value] of _h1.entries()) {
    if (_h2.get(key) !== value) return false;
  }

  return true;
};

Deno.test("mergeHeaders - merge two headers", () => {
  const h1 = new Headers({ "Content-Type": "application/json" });
  const h2 = new Headers({ Authorization: "Bearer token" });

  assert(
    headersEqual(mergeHeaders(h1, h2), {
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    })
  );
});
