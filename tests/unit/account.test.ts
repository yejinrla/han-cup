import { test, expect } from "vitest";
import { deleteAccount } from "@/features/account/delete";
test("account removal waits for Kakao unlink and can retry after DB failure", async () => {
  const calls: string[] = [];
  let unlinked = false,
    fail = true;
  const port = {
    isUnlinked: async () => unlinked,
    unlink: async () => {
      calls.push("unlink");
    },
    markUnlinked: async () => {
      unlinked = true;
    },
    remove: async () => {
      calls.push("remove");
      if (fail) throw new Error("temporary");
    },
  };
  await expect(deleteAccount("user", "123", port)).rejects.toThrow("temporary");
  fail = false;
  await deleteAccount("user", "123", port);
  expect(calls).toEqual(["unlink", "remove", "remove"]);
});
test("unlink failure never deletes user data", async () => {
  let removed = false;
  await expect(
    deleteAccount("user", "123", {
      isUnlinked: async () => false,
      unlink: async () => {
        throw new Error("unlink failed");
      },
      markUnlinked: async () => {},
      remove: async () => {
        removed = true;
      },
    }),
  ).rejects.toThrow("unlink failed");
  expect(removed).toBe(false);
});
