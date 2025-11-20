# File Organizer

A powerful Node.js tool that automatically organizes files into categorized folders based on their file extensions. Built using only Node.js core modules (`fs` and `path`).

## Features

- **Automatic Categorization**: Organizes files into 10+ predefined categories (Images, Documents, Videos, Audio, etc.)
- **Custom Categories**: Define your own file categories and folder names
- **Dry Run Mode**: Preview changes before actually moving files
- **Smart Conflict Resolution**: Automatically handles duplicate file names
- **Detailed Reporting**: Generates comprehensive organization reports
- **Undo Functionality**: Restore files to their original locations
- **Error Handling**: Robust error handling for edge cases
- **Statistics Tracking**: Track files processed, directories created, and errors

## Project Structure

```
file-organizer/
├── src/
│   ├── index.js           # CLI interface
│   ├── file-organizer.js  # Main organizer class
│   └── config.js          # File category configuration
├── tests/
│   └── test-file-organizer.js  # Comprehensive test suite
├── examples/
│   └── demo.js            # Interactive demos
└── README.md              # This file
```

## Installation

No installation required! This project uses only Node.js core modules.

```bash
# Clone or download the project
cd file-organizer
```

## Usage

### Command Line Interface

#### Basic Usage

Organize files in the current directory:
```bash
node src/index.js
```

Organize a specific directory:
```bash
node src/index.js /path/to/directory
```

#### Options

```bash
# Preview without moving files (dry run)
node src/index.js --dry-run --verbose

# Organize with detailed output
node src/index.js ~/Downloads --verbose

# Organize without generating a report
node src/index.js ~/Downloads --no-report

# Undo previous organization
node src/index.js ~/Downloads --undo

# Show help
node src/index.js --help
```

### Programmatic Usage

```javascript
const FileOrganizer = require('./src/file-organizer');

// Basic usage
const organizer = new FileOrganizer('/path/to/directory');
const stats = await organizer.organize();

console.log(`Organized ${stats.filesOrganized} files`);
```

#### With Options

```javascript
const organizer = new FileOrganizer('/path/to/directory', {
  dryRun: true,        // Preview mode
  verbose: true,       // Detailed output
  createReport: true   // Generate report file
});

const stats = await organizer.organize();
```

#### Custom Categories

```javascript
const customCategories = {
  design: {
    extensions: ['.psd', '.ai', '.sketch', '.fig'],
    folder: 'Design-Files'
  },
  ebooks: {
    extensions: ['.epub', '.mobi', '.azw3'],
    folder: 'E-Books'
  }
};

const organizer = new FileOrganizer('/path/to/directory', {
  customCategories: customCategories
});

await organizer.organize();
```

#### Undo Organization

```javascript
const organizer = new FileOrganizer('/path/to/directory');

// First organize
await organizer.organize();

// Later, undo the organization
await organizer.undo();
```

## File Categories

The organizer includes 10 predefined categories:

| Category | Extensions | Folder Name |
|----------|-----------|-------------|
| **Images** | .jpg, .jpeg, .png, .gif, .bmp, .svg, .webp, .ico | Images |
| **Documents** | .pdf, .doc, .docx, .txt, .rtf, .odt, .xls, .xlsx, .ppt, .pptx | Documents |
| **Videos** | .mp4, .avi, .mkv, .mov, .wmv, .flv, .webm, .m4v | Videos |
| **Audio** | .mp3, .wav, .flac, .aac, .ogg, .wma, .m4a | Audio |
| **Archives** | .zip, .rar, .7z, .tar, .gz, .bz2, .xz | Archives |
| **Code** | .js, .ts, .py, .java, .cpp, .c, .h, .cs, .php, .rb, .go, .rs | Code |
| **Web** | .html, .css, .scss, .sass, .less, .jsx, .tsx, .vue | Web |
| **Data** | .json, .xml, .yaml, .yml, .csv, .sql, .db | Data |
| **Executables** | .exe, .msi, .app, .deb, .rpm, .dmg | Executables |
| **Fonts** | .ttf, .otf, .woff, .woff2, .eot | Fonts |
| **Others** | *All other extensions* | Others |

## Examples

### Example 1: Organize Downloads Folder

```bash
# Preview what would happen
node src/index.js ~/Downloads --dry-run --verbose

# Actually organize the files
node src/index.js ~/Downloads --verbose
```

**Before:**
```
Downloads/
├── vacation.jpg
├── report.pdf
├── song.mp3
├── video.mp4
├── archive.zip
└── script.js
```

**After:**
```
Downloads/
├── Images/
│   └── vacation.jpg
├── Documents/
│   └── report.pdf
├── Audio/
│   └── song.mp3
├── Videos/
│   └── video.mp4
├── Archives/
│   └── archive.zip
├── Code/
│   └── script.js
└── organization-report.txt
```

### Example 2: Custom Organization for Design Files

```javascript
const FileOrganizer = require('./src/file-organizer');

const customCategories = {
  photoshop: {
    extensions: ['.psd', '.psb'],
    folder: 'Photoshop-Files'
  },
  illustrator: {
    extensions: ['.ai'],
    folder: 'Illustrator-Files'
  },
  sketch: {
    extensions: ['.sketch'],
    folder: 'Sketch-Files'
  }
};

const organizer = new FileOrganizer('./design-projects', {
  customCategories: customCategories,
  verbose: true
});

await organizer.organize();
```

### Example 3: Handling Naming Conflicts

If a file with the same name already exists in the target folder, the organizer automatically adds a numeric suffix:

```
Images/photo.jpg  (existing file)
photo.jpg         (new file to organize)

Result:
Images/photo.jpg    (original)
Images/photo_1.jpg  (newly organized)
```

## Running Tests

The project includes a comprehensive test suite:

```bash
node tests/test-file-organizer.js
```

**Test Coverage:**
- ✓ FileOrganizer instantiation
- ✓ Directory validation
- ✓ File scanning
- ✓ Category determination
- ✓ File organization
- ✓ Dry run mode
- ✓ Naming conflict resolution
- ✓ Statistics generation
- ✓ Report generation
- ✓ Undo functionality
- ✓ Custom categories
- ✓ Error handling

## Running Demos

Interactive demonstrations showcasing all features:

```bash
node examples/demo.js
```

**Demos include:**
1. Basic file organization
2. Dry run mode
3. Custom categories
4. Undo operation

## API Reference

### FileOrganizer Class

#### Constructor

```javascript
new FileOrganizer(sourceDir, options)
```

**Parameters:**
- `sourceDir` (string): Path to directory to organize
- `options` (object):
  - `dryRun` (boolean): Preview mode, don't move files (default: false)
  - `verbose` (boolean): Show detailed output (default: false)
  - `createReport` (boolean): Generate organization report (default: true)
  - `customCategories` (object): Custom file categories (default: null)

#### Methods

##### organize()

Organizes files in the source directory.

```javascript
const stats = await organizer.organize();
```

**Returns:** Statistics object containing:
- `totalFiles`: Number of files found
- `filesOrganized`: Number of files moved
- `filesSkipped`: Number of files skipped
- `directoriesCreated`: Number of folders created
- `errors`: Array of error objects
- `categoryCounts`: Object with file counts per category
- `startTime`: Organization start time
- `endTime`: Organization end time

##### undo()

Restores files to the root directory.

```javascript
const count = await organizer.undo();
```

**Returns:** Number of files restored

##### validateDirectory()

Validates the source directory exists and is accessible.

```javascript
await organizer.validateDirectory();
```

##### scanDirectory()

Scans directory and returns list of files.

```javascript
const files = await organizer.scanDirectory();
```

**Returns:** Array of file objects with `name`, `path`, and `extension`

## Organization Report

When organization completes, a detailed report is generated:

```
============================================================
FILE ORGANIZATION REPORT
============================================================

Directory: /Users/username/Downloads
Date: 11/20/2025, 10:30:45 AM
Duration: 1523ms

SUMMARY
------------------------------------------------------------
Total files found: 25
Files organized: 23
Files skipped: 2
Directories created: 5
Errors: 0

FILES BY CATEGORY
------------------------------------------------------------
Images               : 8 files
Documents            : 6 files
Videos               : 4 files
Audio                : 3 files
Code                 : 2 files

============================================================
Report generated by File Organizer
============================================================
```

## Error Handling

The organizer includes comprehensive error handling:

- **Directory Validation**: Checks if directory exists and is accessible
- **Permission Errors**: Catches and reports permission issues
- **File Processing Errors**: Individual file errors don't stop the entire process
- **Naming Conflicts**: Automatically resolves duplicate file names
- **Error Reporting**: All errors are logged and included in statistics

## Best Practices

1. **Always test with dry run first:**
   ```bash
   node src/index.js ~/Downloads --dry-run --verbose
   ```

2. **Back up important files** before organizing

3. **Review the organization report** after running

4. **Use verbose mode** when debugging:
   ```bash
   node src/index.js ~/Downloads --verbose
   ```

5. **Keep the undo option in mind** - you can always restore files

## Learning Objectives

This project demonstrates:

- **File System Operations**: Reading directories, moving files, creating folders
- **Path Manipulation**: Working with file paths and extensions
- **Error Handling**: Robust error catching and reporting
- **Async/Await**: Modern asynchronous JavaScript patterns
- **CLI Development**: Building command-line interfaces
- **Testing**: Writing comprehensive test suites
- **Code Organization**: Modular, maintainable code structure

## Troubleshooting

### Permission Denied Errors

If you get permission errors, make sure you have read/write access to the directory:

```bash
# Check permissions
ls -la /path/to/directory

# Grant permissions (if needed)
chmod u+rw /path/to/directory
```

### Files Not Being Organized

1. Check if files match known extensions in `src/config.js`
2. Look for errors in the organization report
3. Run with `--verbose` flag to see detailed output

### Undo Doesn't Work

The undo operation moves files from category folders back to root. If folders have been manually deleted or files moved, undo may not work completely.

## Contributing

To extend this project:

1. Add new file categories in `src/config.js`
2. Enhance the CLI in `src/index.js`
3. Add more features to `src/file-organizer.js`
4. Write tests in `tests/test-file-organizer.js`

## License

MIT License - Free to use and modify

## Author

Created as part of the Node.js Core Modules Course - Beginner Project 1

---

**Happy Organizing! 📁**
