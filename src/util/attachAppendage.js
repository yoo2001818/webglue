export default function attachAppendage(code, appendage) {
  // Find #version and skip it.
  let versionPos = code.indexOf('#version');
  let newLinePos = code.indexOf('\n', versionPos);
  return code.slice(0, newLinePos + 1) + appendage + code.slice(newLinePos + 1);
}
