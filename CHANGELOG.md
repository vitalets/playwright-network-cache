# Changelog

> This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [Unreleased]

## [0.3.1] - 2026-11-14
* fix: write `headers.json` atomically to avoid corrupted cache with parallel workers ([#10](https://github.com/vitalets/playwright-network-cache/issues/10)).

* new release script.
* update dependencies.

## [0.3.0] - 2026-05-12
* fix: support Playwright 1.60+.
* fix: await body write and write body before headers in saveResponse ([#9](https://github.com/vitalets/playwright-network-cache/pull/9)).

## [0.2.2] - 2025-03-02
* Support Playwright 1.51

## [0.2.1]
* Handle requests after page is closed

## [0.2.0]
* New api released (breaking)

[unreleased]: https://github.com/vitalets/playwright-network-cache/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/vitalets/playwright-network-cache/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/vitalets/playwright-network-cache/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/vitalets/playwright-network-cache/releases/tag/v0.2.2
