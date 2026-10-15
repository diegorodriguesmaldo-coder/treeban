import test from "node:test";
import assert from "node:assert/strict";
import { mergeChanges, mergeWorkspace } from "../src/merge.ts";

const fixture = () => ({
  version: 1,
  workspace: "Brisa",
  members: [],
  labels: [],
  activeBoardId: "b",
  autoComplete: true,
  boards: [
    {
      id: "b",
      name: "Board",
      columns: [
        {
          id: "a",
          cards: [
            {
              id: "1",
              title: "Primeiro",
              description: "Original",
              members: [],
              comments: [],
              checklist: [],
            },
          ],
        },
        { id: "z", cards: [] },
      ],
    },
  ],
});
test("merges independent fields edited at the same time", () => {
  const base = { title: "Título", description: "Texto" },
    local = { ...base, title: "Título novo" },
    remote = { ...base, description: "Texto novo" };
  assert.deepEqual(mergeChanges(base, local, remote), {
    title: "Título novo",
    description: "Texto novo",
  });
});
test("preserves simultaneous card additions in the same column", () => {
  assert.deepEqual(
    mergeChanges(
      [{ id: "a" }],
      [{ id: "a" }, { id: "b" }],
      [{ id: "a" }, { id: "c" }],
    ).map((i) => i.id),
    ["a", "c", "b"],
  );
});
test("preserves remote deletions rather than resurrecting items", () => {
  assert.deepEqual(
    mergeChanges([{ id: "a", name: "old" }], [{ id: "a", name: "new" }], []),
    [],
  );
});
test("preserves local reorder and concurrent new entities", () => {
  const base = [{ id: "a" }, { id: "b" }],
    local = [{ id: "b" }, { id: "a" }],
    remote = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(
    mergeChanges(base, local, remote).map((i) => i.id),
    ["b", "a", "c"],
  );
});
test("merges label and responsible membership as sets", () => {
  assert.deepEqual(mergeChanges(["a"], ["a", "b"], ["a", "c"]), [
    "a",
    "c",
    "b",
  ]);
  assert.deepEqual(mergeChanges(["a", "b"], ["b"], ["a", "b", "c"]), [
    "b",
    "c",
  ]);
});
test("a card move preserves concurrent text edits", () => {
  const base = fixture(),
    local = structuredClone(base),
    remote = structuredClone(base);
  local.boards[0].columns[1].cards.push(local.boards[0].columns[0].cards.pop());
  remote.boards[0].columns[0].cards[0].description = "Texto da outra pessoa";
  const result = mergeWorkspace(base, local, remote);
  assert.equal(result.boards[0].columns[0].cards.length, 0);
  assert.equal(
    result.boards[0].columns[1].cards[0].description,
    "Texto da outra pessoa",
  );
});
test("simultaneous moves never duplicate the same card", () => {
  const base = fixture();
  base.boards[0].columns.push({ id: "last", cards: [] });
  const local = structuredClone(base),
    remote = structuredClone(base);
  local.boards[0].columns[1].cards.push(local.boards[0].columns[0].cards.pop());
  remote.boards[0].columns[2].cards.push(
    remote.boards[0].columns[0].cards.pop(),
  );
  const result = mergeWorkspace(base, local, remote);
  assert.equal(result.boards[0].columns.flatMap((c) => c.cards).length, 1);
  assert.equal(result.boards[0].columns[1].cards[0].id, "1");
});
test("does not mutate any of its input snapshots", () => {
  const base = fixture(),
    local = structuredClone(base),
    remote = structuredClone(base);
  local.boards[0].columns[0].cards[0].title = "Mudança";
  const snapshots = JSON.stringify([base, local, remote]);
  mergeWorkspace(base, local, remote);
  assert.equal(JSON.stringify([base, local, remote]), snapshots);
});
