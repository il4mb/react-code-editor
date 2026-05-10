const code = "border: 2px dashed rgb(10,10,10)";

const colorBlocks = [];
const colorRegex = /rgba?\s*\([^)]*\)|hsla?\s*\([^)]*\)/gi;
let colorMatch;
while ((colorMatch = colorRegex.exec(code)) !== null) {
    colorBlocks.push([colorMatch.index, colorMatch.index + colorMatch[0].length]);
}

console.log("Color Blocks:", colorBlocks);

const numRegex = /(?<![#\w])-?\b\d+(\.\d+)?\w*%?/gi;
let match;
while ((match = numRegex.exec(code)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    const isInsideColor = colorBlocks.some(block => start >= block[0] && end <= block[1]);
    console.log(`Match: ${match[0]} at [${start}, ${end}], Inside Color: ${isInsideColor}`);
}
