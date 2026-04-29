import { test } from "node:test";
import assert from "node:assert/strict";

import { BitbucketClient } from "../src/bitbucket.js";

void test("BitbucketClient follows paginated directory responses", async () => {
  const restoreFetch = replaceFetch((url) => {
    const payload = url.includes("page=2")
      ? {
          values: [{ path: "разработка/two", type: "commit_directory" }]
        }
      : {
          next: "https://api.bitbucket.org/2.0/repositories/team/repo/src/main/?page=2",
          values: [{ path: "разработка/one", type: "commit_directory" }]
        };

    return jsonResponse(payload);
  });

  try {
    const client = new BitbucketClient({
      ref: "main",
      repo: { workspace: "team", repoSlug: "repo" },
      token: "token"
    });

    assert.deepEqual(await client.listDirectory(""), [
      { path: "разработка/one", type: "commit_directory" },
      { path: "разработка/two", type: "commit_directory" }
    ]);
  } finally {
    restoreFetch();
  }
});

void test("BitbucketClient requests root directories with a trailing slash", async () => {
  let requestedUrl = "";
  const restoreFetch = replaceFetch((url) => {
    requestedUrl = url;
    return jsonResponse({ values: [] });
  });

  try {
    const client = new BitbucketClient({
      ref: "main",
      repo: { workspace: "team", repoSlug: "repo" },
      token: "token"
    });

    await client.listDirectory("");
    assert.match(requestedUrl, /\/src\/main\/\?pagelen=100$/);
  } finally {
    restoreFetch();
  }
});

void test("BitbucketClient keeps nested directory URLs encoded", async () => {
  let requestedUrl = "";
  const restoreFetch = replaceFetch((url) => {
    requestedUrl = url;
    return jsonResponse({ values: [] });
  });

  try {
    const client = new BitbucketClient({
      ref: "main",
      repo: { workspace: "team", repoSlug: "repo" },
      token: "token"
    });

    await client.listDirectory("разработка/x-uikit");
    assert.match(requestedUrl, /\/src\/main\/%D1%80%D0%B0%D0%B7/);
    assert.match(requestedUrl, /\/x-uikit\?pagelen=100$/);
  } finally {
    restoreFetch();
  }
});

void test("BitbucketClient ignores malformed directory entries", async () => {
  const restoreFetch = replaceFetch(() =>
    jsonResponse({
      values: [
        { path: "valid/file.md", type: "commit_file" },
        { path: "missing-type.md" },
        { path: 42, type: "commit_file" },
        { path: "unknown.md", type: "commit_symlink" }
      ]
    })
  );

  try {
    const client = new BitbucketClient({
      ref: "main",
      repo: { workspace: "team", repoSlug: "repo" },
      token: "token"
    });

    assert.deepEqual(await client.listDirectory(""), [
      { path: "valid/file.md", type: "commit_file" }
    ]);
  } finally {
    restoreFetch();
  }
});

function replaceFetch(handler: (url: string) => Response): () => void {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (input: RequestInfo | URL) => {
    const url = getRequestUrl(input);
    return Promise.resolve(handler(url));
  };

  return () => {
    globalThis.fetch = previousFetch;
  };
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status: 200
  });
}
