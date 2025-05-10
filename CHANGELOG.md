# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-05-10

### Added
- Support for specifying Gemini model via environment variables
- Support for runtime model selection via request parameters
- Updated documentation with model selection examples
- Better JSDoc comments throughout the codebase

### Changed
- Enhanced handlers to support model switching at runtime
- Server now accepts a model parameter in the constructor
- Model name is now included in response metadata
- Changed default server port from 3005 to 3071 to avoid conflicts

### Fixed
- Improved error handling when model switching fails

## [1.0.0] - 2025-04-15

### Added
- Initial release with support for Google Gemini API
- Basic MCP protocol implementation
- Support for generate and stream endpoints
- Documentation for setup and usage
