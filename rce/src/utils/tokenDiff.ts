import { Token } from "../type"
import { compareTokens, getTokenId } from "./tokenizer"

export function areTokenListsEqual(left: Token[], right: Token[]) {
    if (left === right) return true
    if (left.length !== right.length) return false

    for (let index = 0; index < left.length; index += 1) {
        if (getTokenId(left[index]) !== getTokenId(right[index])) {
            return false
        }
    }

    return true
}

export function sortTokens(tokens: Token[]) {
    return [...tokens].sort(compareTokens)
}
