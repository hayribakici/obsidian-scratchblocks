import assert from "assert/strict";
import { findBacktickedText } from "../src/editor-extension";
import { getInlineScratchblocksSource } from "../src/utils/utils";

function test(name: string, run: () => void) {
    run();
    console.log(`ok - ${name}`);
}

test("finds inline backticked text", () => {
    assert.deepEqual(findBacktickedText("before `like so` after", 3), [
        {
            lineNumber: 3,
            from: 7,
            to: 16,
            text: "like so",
        },
    ]);
});

test("finds multiple inline backticked texts", () => {
    assert.deepEqual(findBacktickedText("`one` and `two`"), [
        {
            lineNumber: 1,
            from: 0,
            to: 5,
            text: "one",
        },
        {
            lineNumber: 1,
            from: 10,
            to: 15,
            text: "two",
        },
    ]);
});

test("ignores code fence lines", () => {
    assert.deepEqual(findBacktickedText("```scratchblocks"), []);
    assert.deepEqual(findBacktickedText("```"), []);
});

test("ignores double-backticked text", () => {
    assert.deepEqual(findBacktickedText("before ``like so`` after"), []);
});

test("extracts sb-prefixed inline scratchblocks source", () => {
    assert.equal(
        getInlineScratchblocksSource("sb when green flag clicked"),
        "when green flag clicked"
    );
});

test("ignores inline code without sb prefix", () => {
    assert.equal(getInlineScratchblocksSource("const x = 1"), null);
});

test("ignores empty sb prefix", () => {
    assert.equal(getInlineScratchblocksSource("sb "), null);
});
