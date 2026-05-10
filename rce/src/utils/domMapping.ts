import { Range } from "../type"

function isPlaceholderBr(node: Node) {
    return node.nodeType === Node.ELEMENT_NODE
    && (node as HTMLElement).dataset.placeholder === "true"
}

function getNodeLength(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue?.length ?? 0
    }

    if (isPlaceholderBr(node)) {
        return 0
    }

    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "BR") {
        return 1
    }

    let total = 0
    node.childNodes.forEach(child => {
        total += getNodeLength(child)
    })
    return total
}

function getOffsetWithinNode(node: Node, targetOffset: number): number {
    if (node.nodeType === Node.TEXT_NODE) {
        return Math.min(targetOffset, node.nodeValue?.length ?? 0)
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        if (element.dataset.placeholder === "true") {
            return 0
        }
        if (element.tagName === "BR") {
            return 0
        }

        let total = 0
        const limit = Math.min(targetOffset, node.childNodes.length)
        for (let index = 0; index < limit; index += 1) {
            total += getNodeLength(node.childNodes[index])
        }
        return total
    }

    return 0
}

function getLinearOffset(root: Node, targetNode: Node, targetOffset: number): number {
    let offset = 0

    const walk = (node: Node): boolean => {
        if (node === targetNode) {
            offset += getOffsetWithinNode(node, targetOffset)
            return true
        }

        if (node.nodeType === Node.TEXT_NODE) {
            offset += node.nodeValue?.length ?? 0
            return false
        }

        if (isPlaceholderBr(node)) {
            // Don't add to offset (placeholder is 0-length), but still walk children
            for (const child of Array.from(node.childNodes)) {
                if (walk(child)) return true
            }
            return false
        }

        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "BR") {
            offset += 1
            return false
        }

        for (const child of Array.from(node.childNodes)) {
            if (walk(child)) return true
        }

        return false
    }

    walk(root)
    return offset
}

function locatePosition(root: Node, offset: number): { node: Node; offset: number } {
    let remaining = Math.max(0, offset)

    const walk = (node: Node): { node: Node; offset: number } | null => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue ?? ""
            if (remaining <= text.length) {
                return { node, offset: remaining }
            }

            remaining -= text.length
            return null
        }

        if (isPlaceholderBr(node)) {
            // Placeholder is 0-length, but walk its children
            for (const child of Array.from(node.childNodes)) {
                const found = walk(child)
                if (found) return found
            }
            return null
        }

        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === "BR") {
            if (remaining <= 1) {
                const parent = node.parentNode ?? root
                const index = node.parentNode ? Array.from(node.parentNode.childNodes).indexOf(node as ChildNode) : 0
                return { node: parent, offset: index }
            }

            remaining -= 1
            return null
        }

        for (const child of Array.from(node.childNodes)) {
            const found = walk(child)
            if (found) return found
        }

        return null
    }

    const found = walk(root)
    if (found) return found

    // If we're at the end and didn't find anything, try to find the placeholder BR
    if (root.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(root.childNodes)
        const lastChild = children[children.length - 1]
        if (lastChild && isPlaceholderBr(lastChild)) {
            return { node: root, offset: children.length - 1 }
        }
    }

    return {
        node: root,
        offset: root.nodeType === Node.TEXT_NODE ? (root.nodeValue?.length ?? 0) : root.childNodes.length
    }
}

export function getSelectionOffsets(container: HTMLElement): Range | null {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null

    const anchorNode = selection.anchorNode
    const focusNode = selection.focusNode
    if (!anchorNode || !focusNode) return null

    if (!container.contains(anchorNode) || !container.contains(focusNode)) {
        return null
    }

    const anchor = getLinearOffset(container, anchorNode, selection.anchorOffset)
    const focus = getLinearOffset(container, focusNode, selection.focusOffset)
    // Preserve user direction: forward => [start,end], backward => [end,start] in visual terms.
    return [anchor, focus]
}

export function setSelectionOffsets(container: HTMLElement, start: number, end: number) {
    const selection = window.getSelection()
    if (!selection) return

    const startPoint = locatePosition(container, start)
    const endPoint = locatePosition(container, end)

    try {
        // Use anchor/focus when available to preserve backward direction.
        if (typeof selection.setBaseAndExtent === "function") {
            selection.setBaseAndExtent(
                startPoint.node,
                startPoint.offset,
                endPoint.node,
                endPoint.offset
            )
        } else {
            const documentRange = container.ownerDocument?.createRange() ?? document.createRange()
            // Fallback: keep the visible range valid, then extend if backward.
            const isBackward = start > end
            const first = isBackward ? endPoint : startPoint
            const second = isBackward ? startPoint : endPoint

            documentRange.setStart(first.node, first.offset)
            documentRange.setEnd(second.node, second.offset)

            selection.removeAllRanges()
            selection.addRange(documentRange)

            if (isBackward && typeof selection.extend === "function") {
                selection.collapse(second.node, second.offset)
                selection.extend(first.node, first.offset)
            }
            return
        }
    } catch {
        const documentRange = container.ownerDocument?.createRange() ?? document.createRange()
        documentRange.selectNodeContents(container)
        documentRange.collapse(false)
        selection.removeAllRanges()
        selection.addRange(documentRange)
        return
    }
}
