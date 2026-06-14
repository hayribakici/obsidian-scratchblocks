import assert from "assert/strict";
import { getAllScratchblocksSourcesFromText } from "../src/utils/utils";

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
