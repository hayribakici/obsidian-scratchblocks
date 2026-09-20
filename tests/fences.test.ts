import assert from "assert/strict";
import {
    getAllScratchblocksSourcesFromText,
    getScratchblocksFrontmatterKey,
    hasValidScratchblocksFrontmatter,
} from "../src/utils/utils";

function test(name: string, run: () => void) {
    run();
    console.log(`ok - ${name}`);
}

test("compares only Scratchblocks frontmatter properties", () => {
    const key = getScratchblocksFrontmatterKey;
    const frontmatter = { "sb-lang": "de", "sb-scale": 1.2 };
    const before = key(frontmatter);

    assert.equal(key({ ...frontmatter, title: "Edited", tags: ["test"] }), before);
    assert.equal(key({ ...frontmatter, "sb-scale": "1.2" }), before);
    assert.notEqual(key({ ...frontmatter, "sb-lang": "en" }), before);
    assert.notEqual(key({ "sb-lang": "de" }), before);
    assert.notEqual(key(undefined), before);
    assert.equal(key(undefined), key({ title: "Note" }));
    assert.equal(key({ "sb-scale": "invalid" }), "");

    frontmatter["sb-scale"] = 2;
    assert.notEqual(key(frontmatter), before);
    assert.equal(key({ ...frontmatter }), key(frontmatter));
});

test("finds all real scratchblocks fences", () => {
    const markdown = [
        "before",
        "```scratchblock",
        "when green flag clicked",
        "```",
        "",
        "```scratchblocks",
        "say [hello]",
        "```",
        "",
        "```sb",
        "say [hello]",
        "```",
        "",
        "~~~sb",
        "turn cw (15) degrees",
        "~~~",
        "after",
    ].join("\n");

    assert.deepEqual(getAllScratchblocksSourcesFromText(markdown), [
        "when green flag clicked",
        "say [hello]",
        "say [hello]",
        "turn cw (15) degrees",
    ]);
});

test("ignores scratchblocks examples inside another fence", () => {
    const markdown = [
        "~~~",
        "```scratchblocks",
        "when green flag clicked",
        "```",
        "~~~",
        "",
        "```scratchblock",
        "go to x:(10) y:(10)",
        "```",
    ].join("\n");

    assert.deepEqual(getAllScratchblocksSourcesFromText(markdown), [
        "go to x:(10) y:(10)",
    ]);
});

test("supports tilde scratchblocks fences", () => {
    const markdown = [
        "~~~scratchblock",
        "when green flag clicked",
        "~~~",
    ].join("\n");

    assert.deepEqual(getAllScratchblocksSourcesFromText(markdown), [
        "when green flag clicked",
    ]);
});

test("supports four-backtick scratchblocks fences", () => {
    const markdown = [
        "````scratchblocks",
        "when green flag clicked",
        "````",
    ].join("\n");

    assert.deepEqual(getAllScratchblocksSourcesFromText(markdown), [
        "when green flag clicked",
    ]);
});

test("detects only usable scratchblocks frontmatter values", () => {
    assert.equal(hasValidScratchblocksFrontmatter({}), false);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-scale": null }), false);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-scale": "" }), false);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-scale": "abc" }), false);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-lang": "" }), false);
    assert.equal(hasValidScratchblocksFrontmatter({ title: "Note" }), false);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-lang": "de", "sb-scale": "" }), false);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-scale": 1.2 }), true);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-scale": "1.2" }), true);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-lang": "de" }), true);
    assert.equal(hasValidScratchblocksFrontmatter({ "sb-lang": "de", "sb-scale": 1.2 }), true);
});
