import assert from "node:assert/strict";
import test from "node:test";
import { litellmConfig } from "../src/litellm.ts";
import { discoverClaudeModels } from "../src/claude-cli.ts";

test("LiteLLM routing requires both explicit settings", () => {
  assert.equal(litellmConfig({}), undefined);
  assert.throws(() => litellmConfig({ PI_CLAUDE_CODE_LITELLM_BASE_URL: "https://gateway.example" }), /Set both/);
  assert.throws(() => litellmConfig({ PI_CLAUDE_CODE_LITELLM_API_KEY: "test-key" }), /Set both/);
});

test("LiteLLM routing accepts an HTTPS root and preserves the raw key", () => {
  assert.deepEqual(litellmConfig({
    PI_CLAUDE_CODE_LITELLM_BASE_URL: "https://gateway.example/",
    PI_CLAUDE_CODE_LITELLM_API_KEY: "test-key",
  }), { baseUrl: "https://gateway.example", apiKey: "test-key" });
});

test("LiteLLM routing rejects unsafe URLs and header characters", () => {
  for (const baseUrl of [
    "not-a-url", "http://gateway.example", "https://user:password@gateway.example",
    "https://gateway.example/v1", "https://gateway.example/?key=value", "https://gateway.example/#fragment",
  ]) {
    assert.throws(() => litellmConfig({
      PI_CLAUDE_CODE_LITELLM_BASE_URL: baseUrl,
      PI_CLAUDE_CODE_LITELLM_API_KEY: "test-key",
    }));
  }
  for (const apiKey of [" test-key", "test-key ", "test-key\nheader:value"]) {
    assert.throws(() => litellmConfig({
      PI_CLAUDE_CODE_LITELLM_BASE_URL: "https://gateway.example",
      PI_CLAUDE_CODE_LITELLM_API_KEY: apiKey,
    }), /characters/);
  }
});

test("LiteLLM routing permits loopback HTTP for local checks", () => {
  assert.equal(litellmConfig({
    PI_CLAUDE_CODE_LITELLM_BASE_URL: "http://127.0.0.1:4000",
    PI_CLAUDE_CODE_LITELLM_API_KEY: "test-key",
  })?.baseUrl, "http://127.0.0.1:4000");
});

test("LiteLLM routing keeps the API-key and backend guards", async () => {
  for (const name of [
    "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "ANTHROPIC_FOUNDRY_API_KEY",
    "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY",
  ]) {
    await assert.rejects(discoverClaudeModels({
      PI_CLAUDE_CODE_LITELLM_BASE_URL: "https://gateway.example",
      PI_CLAUDE_CODE_LITELLM_API_KEY: "test-key",
      [name]: "present",
    }), new RegExp(name));
  }
});

test("LiteLLM routing rejects a duplicate gateway authentication header", async () => {
  await assert.rejects(discoverClaudeModels({
    PI_CLAUDE_CODE_LITELLM_BASE_URL: "https://gateway.example",
    PI_CLAUDE_CODE_LITELLM_API_KEY: "test-key",
    ANTHROPIC_CUSTOM_HEADERS: "X-LiteLLM-Api-Key: Bearer other-test-key",
  }), /Set the LiteLLM key only through/);
});
