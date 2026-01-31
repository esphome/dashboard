import test from "node:test";
import assert from "node:assert/strict";

import { is_host_device } from "../src/util/is-host-device";

test("is_host_device: true when target_platform is HOST", () => {
  assert.equal(is_host_device({ target_platform: "HOST" }), true);
});

test("is_host_device: true when target_platform is host (case-insensitive)", () => {
  assert.equal(is_host_device({ target_platform: "host" }), true);
});

test("is_host_device: true when loaded_integrations contains host", () => {
  assert.equal(is_host_device({ loaded_integrations: ["api", "host"] }), true);
});

test("is_host_device: false when neither signal is present", () => {
  assert.equal(
    is_host_device({ target_platform: "ESP32", loaded_integrations: ["api"] }),
    false,
  );
});

test("is_host_device: false for empty object", () => {
  assert.equal(is_host_device({}), false);
});
