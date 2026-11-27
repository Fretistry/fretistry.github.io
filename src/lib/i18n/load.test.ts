import { describe, expect, it } from "vitest";
import { assembleBundle, LOCALES } from "./core";
import { createBundle } from "./index";
import { loadMessages, loadedMessages, messagesSettled } from "./load";

describe("loading one language at a time", () => {
  it("has English at hand from the start, and nothing else", () => {
    expect(loadedMessages("en")).toBeDefined();
    expect(messagesSettled("en")).toBe(true);
    expect(loadedMessages("fr")).toBeUndefined();
  });

  it("loads every language on request, with the same texts the server pages use", async () => {
    for (const { code, defaultNaming } of LOCALES) {
      const messages = await loadMessages(code);
      expect(loadedMessages(code)).toBe(messages);
      expect(messagesSettled(code)).toBe(true);
      const lazy = assembleBundle(code, defaultNaming, messages);
      const all = createBundle(code, defaultNaming);
      expect(lazy.ui).toBe(all.ui);
      expect(lazy.theory.scaleName({ id: "major", name: "Major" } as never)).toBe(all.theory.scaleName({ id: "major", name: "Major" } as never));
    }
  });

  it("shares one download when asked twice", async () => {
    const [a, b] = await Promise.all([loadMessages("de"), loadMessages("de")]);
    expect(a).toBe(b);
  });
});
