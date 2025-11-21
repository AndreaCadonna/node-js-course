/**
 * File Organizer - Automatically organize files by type
 * Uses fs and path modules to scan, categorize, and move files
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { FILE_CATEGORIES, DEFAULT_FOLDER, IGNORE_FILES } = require('./config');

class FileOrganizer {
  constructor(sourceDir, options = {}) {
    this.sourceDir = path.resolve(sourceDir);
    this.options = {
      dryRun: options.dryRun || false,
      createReport: options.createReport !== false, // default true
      verbose: options.verbose || false,
      customCategories: options.customCategories || null
    };

    // Use custom categories if provided, otherwise use defaults
    this.categories = this.options.customCategories || FILE_CATEGORIES;

    // Statistics tracking
    this.stats = {
      totalFiles: 0,
      filesOrganized: 0,
      filesSkipped: 0,
      directoriesCreated: 0,
      errors: [],
      categoryCounts: {},
      startTime: null,
      endTime: null
    };
  }

  /**
   * Main method to organize files
   */
  async organize() {
    this.stats.startTime = new Date();

    try {
      // Validate source directory
      await this.validateDirectory();

      // Scan directory for files
      const files = await this.scanDirectory();

      if (this.options.verbose) {
        console.log(`Found ${files.length} files to process`);
      }

      // Process each file
      for (const file of files) {
        await this.processFile(file);
      }

      this.stats.endTime = new Date();

      // Generate report if enabled
      if (this.options.createReport) {
        await this.generateReport();
      }

      return this.stats;

    } catch (error) {
      this.stats.errors.push({
        type: 'CRITICAL',
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate that the source directory exists and is accessible
   */
  async validateDirectory() {
    try {
      const stats = await fs.stat(this.sourceDir);

      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${this.sourceDir}`);
      }

      // Check if we have read and write permissions
      await fs.access(this.sourceDir, fsSync.constants.R_OK | fsSync.constants.W_OK);

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Directory does not exist: ${this.sourceDir}`);
      } else if (error.code === 'EACCES') {
        throw new Error(`Permission denied: ${this.sourceDir}`);
      }
      throw error;
    }
  }

  /**
   * Scan directory and return list of files to organize
   */
  async scanDirectory() {
    const files = [];

    try {
      const entries = await fs.readdir(this.sourceDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(this.sourceDir, entry.name);

        // Skip directories and ignored files
        if (entry.isDirectory()) {
          continue;
        }

        if (IGNORE_FILES.includes(entry.name)) {
          this.stats.filesSkipped++;
          continue;
        }

        files.push({
          name: entry.name,
          path: fullPath,
          extension: path.extname(entry.name).toLowerCase()
        });

        this.stats.totalFiles++;
      }

      return files;

    } catch (error) {
      throw new Error(`Failed to scan directory: ${error.message}`);
    }
  }

  /**
   * Process a single file - determine category and move it
   */
  async processFile(file) {
    try {
      const category = this.determineCategory(file.extension);
      const targetFolder = category ? this.categories[category].folder : DEFAULT_FOLDER;
      const targetDir = path.join(this.sourceDir, targetFolder);
      const targetPath = path.join(targetDir, file.name);

      // Check if file already exists in target location
      if (file.path === targetPath) {
        this.stats.filesSkipped++;
        return;
      }

      // Track category counts
      this.stats.categoryCounts[targetFolder] =
        (this.stats.categoryCounts[targetFolder] || 0) + 1;

      if (this.options.dryRun) {
        if (this.options.verbose) {
          console.log(`[DRY RUN] Would move: ${file.name} -> ${targetFolder}/`);
        }
        this.stats.filesOrganized++;
        return;
      }

      // Create target directory if it doesn't exist
      await this.ensureDirectory(targetDir);

      // Handle naming conflicts
      const finalPath = await this.handleNamingConflict(targetPath, file.name);

      // Move the file
      await fs.rename(file.path, finalPath);

      if (this.options.verbose) {
        console.log(`Moved: ${file.name} -> ${path.relative(this.sourceDir, finalPath)}`);
      }

      this.stats.filesOrganized++;

    } catch (error) {
      this.stats.errors.push({
        type: 'FILE_PROCESS_ERROR',
        file: file.name,
        message: error.message
      });

      if (this.options.verbose) {
        console.error(`Error processing ${file.name}: ${error.message}`);
      }
    }
  }

  /**
   * Determine which category a file belongs to based on extension
   */
  determineCategory(extension) {
    for (const [category, config] of Object.entries(this.categories)) {
      if (config.extensions.includes(extension)) {
        return category;
      }
    }
    return null;
  }

  /**
   * Ensure a directory exists, create it if necessary
   */
  async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
        this.stats.directoriesCreated++;

        if (this.options.verbose) {
          console.log(`Created directory: ${path.relative(this.sourceDir, dirPath)}`);
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Handle file naming conflicts by adding a number suffix
   */
  async handleNamingConflict(targetPath, originalName) {
    let counter = 1;
    let newPath = targetPath;

    while (true) {
      try {
        await fs.access(newPath);
        // File exists, try next number
        const ext = path.extname(originalName);
        const nameWithoutExt = path.basename(originalName, ext);
        const dir = path.dirname(targetPath);
        newPath = path.join(dir, `${nameWithoutExt}_${counter}${ext}`);
        counter++;
      } catch (error) {
        // File doesn't exist, we can use this path
        return newPath;
      }
    }
  }

  /**
   * Generate a detailed organization report
   */
  async generateReport() {
    const duration = this.stats.endTime - this.stats.startTime;
    const reportPath = path.join(this.sourceDir, 'organization-report.txt');

    const report = [
      '='.repeat(60),
      'FILE ORGANIZATION REPORT',
      '='.repeat(60),
      '',
      `Directory: ${this.sourceDir}`,
      `Date: ${new Date().toLocaleString()}`,
      `Duration: ${duration}ms`,
      '',
      'SUMMARY',
      '-'.repeat(60),
      `Total files found: ${this.stats.totalFiles}`,
      `Files organized: ${this.stats.filesOrganized}`,
      `Files skipped: ${this.stats.filesSkipped}`,
      `Directories created: ${this.stats.directoriesCreated}`,
      `Errors: ${this.stats.errors.length}`,
      '',
      'FILES BY CATEGORY',
      '-'.repeat(60)
    ];

    // Add category breakdown
    const sortedCategories = Object.entries(this.stats.categoryCounts)
      .sort((a, b) => b[1] - a[1]);

    for (const [category, count] of sortedCategories) {
      report.push(`${category.padEnd(20)} : ${count} files`);
    }

    // Add errors if any
    if (this.stats.errors.length > 0) {
      report.push('');
      report.push('ERRORS');
      report.push('-'.repeat(60));

      for (const error of this.stats.errors) {
        report.push(`[${error.type}] ${error.file || 'N/A'}: ${error.message}`);
      }
    }

    report.push('');
    report.push('='.repeat(60));
    report.push('Report generated by File Organizer');
    report.push('='.repeat(60));

    const reportContent = report.join('\n');

    try {
      await fs.writeFile(reportPath, reportContent, 'utf8');

      if (this.options.verbose) {
        console.log(`\nReport saved to: ${reportPath}`);
      }

      return reportPath;
    } catch (error) {
      this.stats.errors.push({
        type: 'REPORT_GENERATION_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Undo the last organization (restore files to root)
   */
  async undo() {
    console.log('Starting undo operation...');
    let movedCount = 0;

    try {
      const entries = await fs.readdir(this.sourceDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const dirPath = path.join(this.sourceDir, entry.name);
        const files = await fs.readdir(dirPath);

        for (const file of files) {
          const sourcePath = path.join(dirPath, file);
          const targetPath = path.join(this.sourceDir, file);

          // Check if target already exists
          try {
            await fs.access(targetPath);
            console.log(`Skipping ${file} - already exists in root`);
            continue;
          } catch {
            // File doesn't exist, we can move it
          }

          await fs.rename(sourcePath, targetPath);
          movedCount++;
          console.log(`Restored: ${file}`);
        }

        // Remove empty directory
        const remainingFiles = await fs.readdir(dirPath);
        if (remainingFiles.length === 0) {
          await fs.rmdir(dirPath);
          console.log(`Removed empty directory: ${entry.name}`);
        }
      }

      console.log(`\nUndo complete! Moved ${movedCount} files back to root.`);
      return movedCount;

    } catch (error) {
      throw new Error(`Undo failed: ${error.message}`);
    }
  }
}

module.exports = FileOrganizer;
