# Build Tool

A custom build system for processing files with parallel builds, incremental compilation, file watching, and plugin architecture.

## Features

- **Dependency Graph**: Track file dependencies automatically
- **Parallel Processing**: Build files in parallel using worker threads
- **Incremental Builds**: Only rebuild changed files
- **Plugin Architecture**: Extend with custom build plugins
- **Watch Mode**: Auto-rebuild on file changes
- **Cache Management**: Smart caching with crypto hashing

## Quick Start

```bash
node index.js build ./src
node index.js watch ./src  # Watch mode
node index.js clean        # Clean cache
```

## Architecture

Uses: child_process, fs.watch, stream, worker_threads, crypto modules

## Project Structure

- `src/dependency-graph.js` - Dependency tracking
- `src/cache-manager.js` - Build caching
- `plugins/` - Build plugins
- `examples/` - Usage examples
- `tests/` - Test suites

Built with Node.js core modules only.
