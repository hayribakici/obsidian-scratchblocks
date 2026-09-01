import assert from "assert/strict";
import {
    getAllScratchblocksSourcesFromText,
    hasValidScratchblocksFrontmatter,
} from "../src/utils/utils";

function test(name: string, run: () => void) {
    run();
    console.log(`ok - ${name}`);
}

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
