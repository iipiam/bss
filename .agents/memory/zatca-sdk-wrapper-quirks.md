---
name: ZATCA fatoora SDK CLI quirks
description: Non-obvious behaviors of the ZATCA fatoora CLI wrapped by the server SDK wrapper.
---

- `fatoora -help` exits with a NONZERO code but prints usage text. Availability checks must accept output matching `/flag used to/` rather than relying on exit code.
- CSR environment flags: sandbox → `-nonprod`, simulation → `-sim`, production → no flag. Wrapper accepts an environment string (with boolean back-compat for older callers).
- fatoora label output is inconsistent (`Label = value` vs `label: value`, mixed case); parse with tolerant any-case `=|:` matching.
- Signed-XML QR must be read from `EmbeddedDocumentBinaryObject` following `<cbc:ID>QR</cbc:ID>`, not from stdout.
- **Why:** exit-code-based checks silently reported the SDK as missing even when fully installed, disabling all SDK signing paths.
- **How to apply:** any change to sdk-wrapper availability/parsing logic must preserve these tolerances; verify with `npx tsx -e` calling isSDKAvailable().
- Certificate hash convention: keep base64(hex-of-sha256) — matches ZATCA SDK samples despite spec docs implying raw bytes.
