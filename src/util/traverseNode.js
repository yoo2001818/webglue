export default function traverseNode(current, next, ascend, descend, reset) {
  // Find least common parent node
  let currentDepth = current == null ? 0 : current.depth;
  if (current == null || current.root !== next.root) {
    if (reset != null) reset();
    // Ignore going up - just go down.
    let descendStack = [];
    while (next != null) {
      descendStack.unshift(next);
      next = next.parent;
      nextDepth --;
    }
    return descendStack.forEach(descend);
  }
  let nextDepth = next == null ? 0 : next.depth;
  let ascendStack = [];
  let descendStack = [];
  if (next == null) throw new Error('Next node is null');
  // Balance the depth
  while (current != null && currentDepth > nextDepth) {
    ascendStack.push(current);
    current = current.parent;
    currentDepth --;
  }
  while (next != null && nextDepth > currentDepth) {
    descendStack.unshift(next);
    next = next.parent;
    nextDepth --;
  }
  // Find common node
  while (nextDepth !== 0 && currentDepth !== 0 && current !== next) {
    ascendStack.push(current);
    current = current.parent;
    descendStack.unshift(next);
    next = next.parent;
  }
  ascendStack.forEach(ascend);
  return descendStack.forEach(descend);
}
