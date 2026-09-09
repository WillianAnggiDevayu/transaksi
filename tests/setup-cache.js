import { beforeEach } from "vitest";
import CacheStore from "../src/services/CacheStore";

// Each test represents an isolated authenticated session.
beforeEach(() => CacheStore.clearAll());
