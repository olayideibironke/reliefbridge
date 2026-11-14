// Run TypeScript unit tests with the repository's existing TypeScript compiler.
// No additional runtime or package dependency is required.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => "\n",
    }));
  }
  module._compile(result.outputText, filename);
};

for (const testFile of [
  "billing-entitlements.test.ts",
  "case-capacity.test.ts",
  "quote-intake-errors.test.ts",
  "quote-form-validation.test.ts",
]) {
  require(path.resolve(__dirname, "../src/lib", testFile));
}
