#!/usr/bin/env node

/**
 * File Organizer CLI
 * Command-line interface for organizing files
 */

const FileOrganizer = require('./file-organizer');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    directory: null,
    dryRun: false,
    verbose: false,
    noReport: false,
    undo: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;

      case '-d':
      case '--dry-run':
        options.dryRun = true;
        break;

      case '-v':
      case '--verbose':
        options.verbose = true;
        break;

      case '--no-report':
        options.noReport = true;
        break;

      case '-u':
      case '--undo':
        options.undo = true;
        break;

      default:
        if (!arg.startsWith('-') && !options.directory) {
          options.directory = arg;
        } else {
          console.error(`Unknown option: ${arg}`);
          options.help = true;
        }
    }
  }

  return options;
}

// Display help message
function showHelp() {
  console.log(`
File Organizer - Automatically organize files by type

USAGE:
  node index.js [directory] [options]

ARGUMENTS:
  directory           Directory to organize (defaults to current directory)

OPTIONS:
  -h, --help          Show this help message
  -d, --dry-run       Preview changes without moving files
  -v, --verbose       Show detailed output
  --no-report         Don't generate organization report
  -u, --undo          Restore files to root directory

EXAMPLES:
  # Organize current directory
  node index.js

  # Organize specific directory
  node index.js /path/to/downloads

  # Preview organization without making changes
  node index.js --dry-run --verbose

  # Organize with detailed output
  node index.js ~/Downloads --verbose

  # Undo previous organization
  node index.js ~/Downloads --undo

CATEGORIES:
  The organizer categorizes files into these folders:
  - Images (jpg, png, gif, etc.)
  - Documents (pdf, doc, txt, etc.)
  - Videos (mp4, avi, mkv, etc.)
  - Audio (mp3, wav, flac, etc.)
  - Archives (zip, rar, 7z, etc.)
  - Code (js, py, java, etc.)
  - Web (html, css, jsx, etc.)
  - Data (json, xml, csv, etc.)
  - Executables (exe, msi, app, etc.)
  - Fonts (ttf, otf, woff, etc.)
  - Others (everything else)
`);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Default to current directory if none specified
  const directory = options.directory || process.cwd();

  console.log('='.repeat(60));
  console.log('FILE ORGANIZER');
  console.log('='.repeat(60));
  console.log();

  try {
    const organizer = new FileOrganizer(directory, {
      dryRun: options.dryRun,
      verbose: options.verbose,
      createReport: !options.noReport
    });

    if (options.undo) {
      // Undo previous organization
      console.log(`Undoing organization in: ${directory}\n`);
      const count = await organizer.undo();
      console.log();
      console.log('='.repeat(60));
      console.log(`SUCCESS! Restored ${count} files.`);
      console.log('='.repeat(60));
    } else {
      // Perform organization
      if (options.dryRun) {
        console.log('DRY RUN MODE - No files will be moved\n');
      }

      console.log(`Organizing: ${directory}\n`);

      const stats = await organizer.organize();

      // Display results
      console.log();
      console.log('='.repeat(60));
      console.log('ORGANIZATION COMPLETE');
      console.log('='.repeat(60));
      console.log();
      console.log(`Total files: ${stats.totalFiles}`);
      console.log(`Files organized: ${stats.filesOrganized}`);
      console.log(`Files skipped: ${stats.filesSkipped}`);
      console.log(`Directories created: ${stats.directoriesCreated}`);

      if (stats.errors.length > 0) {
        console.log(`Errors: ${stats.errors.length}`);
        console.log();
        console.log('ERRORS:');
        stats.errors.forEach(err => {
          console.log(`  - ${err.message}`);
        });
      }

      console.log();

      if (Object.keys(stats.categoryCounts).length > 0) {
        console.log('FILES BY CATEGORY:');
        Object.entries(stats.categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .forEach(([category, count]) => {
            console.log(`  ${category.padEnd(20)} : ${count} files`);
          });
        console.log();
      }

      const duration = stats.endTime - stats.startTime;
      console.log(`Duration: ${duration}ms`);
      console.log();
      console.log('='.repeat(60));

      if (!options.dryRun && !options.noReport) {
        console.log();
        console.log('A detailed report has been saved to organization-report.txt');
      }
    }

  } catch (error) {
    console.error();
    console.error('ERROR:', error.message);
    console.error();

    if (options.verbose) {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { parseArgs, showHelp };
