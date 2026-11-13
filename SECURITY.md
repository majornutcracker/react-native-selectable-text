# Security Policy

## Supported versions

Only the latest published minor release of
`@majornutcracker/react-native-selectable-text` receives security fixes.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅        |
| < 1.0   | ❌        |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through either channel:

1. **GitHub Security Advisories** (preferred) — use
   [Report a vulnerability](https://github.com/majornutcracker/react-native-selectable-text/security/advisories/new)
   on this repository. This keeps the report private until a fix is published.
2. **Email** — <joshiparsa@gmail.com> with `SECURITY` in the subject.

Please include:

- The affected version of this package (and of Expo / React Native /
  `react-native-webview`).
- A description of the issue and its impact.
- A minimal reproduction, if you have one.

You can expect an acknowledgement within **7 days** and a status update within
**30 days**. Once a fix ships, you will be credited in the advisory and the
[CHANGELOG](./CHANGELOG.md) unless you prefer to stay anonymous.

## Scope notes

This module renders caller-supplied HTML inside a `react-native-webview` and
bridges messages between the WebView and React Native. Reports are especially
welcome for:

- Ways for WebView content to reach the native bridge beyond the documented
  `BridgingNames` message contract.
- Injection issues in the HTML/JS runtime built in `src/utils.ts` (for example,
  caller-supplied text, CSS, or highlighter options escaping their context).
- Anything that lets untrusted page content trigger native behavior.

Out of scope:

- Vulnerabilities in [Rangy](https://github.com/timdown/rangy), which is
  vendored under `src/rangy@1.3.2/` — please report those upstream, though we
  do want to know so we can pull in a fix.
- Issues that require a consumer to deliberately pass untrusted HTML while
  disabling the module's documented safeguards.
