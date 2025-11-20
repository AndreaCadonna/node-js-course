/**
 * File Organizer Demo
 * Demonstrates the File Organizer capabilities
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const FileOrganizer = require('../src/file-organizer');

// Create a demo directory with sample files
async function createDemoFiles() {
  const demoDir = path.join(__dirname, 'demo-directory');

  // Clean up if exists
  if (fsSync.existsSync(demoDir)) {
    await fs.rm(demoDir, { recursive: true, force: true });
  }

  // Create demo directory
  await fs.mkdir(demoDir, { recursive: true });

  // Create sample files of various types
  const sampleFiles = [
    // Images
    'vacation-photo.jpg',
    'screenshot.png',
    'logo.svg',
    'profile-picture.gif',

    // Documents
    'resume.pdf',
    'letter.doc',
    'report.docx',
    'notes.txt',
    'spreadsheet.xlsx',

    // Videos
    'tutorial.mp4',
    'movie.avi',
    'recording.mkv',

    // Audio
    'song.mp3',
    'podcast.wav',
    'music.flac',

    // Archives
    'backup.zip',
    'files.tar.gz',
    'package.rar',

    // Code
    'script.js',
    'app.py',
    'component.jsx',
    'styles.css',

    // Data
    'config.json',
    'data.xml',
    'settings.yaml',

    // Others
    'README',
    'unknown.xyz',
    'Makefile'
  ];

  console.log('Creating demo files...\n');

  for (const file of sampleFiles) {
    const filePath = path.join(demoDir, file);
    await fs.writeFile(filePath, `Sample content for ${file}\nCreated: ${new Date().toISOString()}`);
    console.log(`  Created: ${file}`);
  }

  console.log(`\nCreated ${sampleFiles.length} sample files in ${demoDir}`);

  return demoDir;
}

// Demo 1: Basic organization
async function demo1_basicOrganization() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 1: Basic File Organization');
  console.log('='.repeat(60) + '\n');

  const demoDir = await createDemoFiles();

  console.log('\nOrganizing files...\n');

  const organizer = new FileOrganizer(demoDir, {
    verbose: true,
    createReport: true
  });

  const stats = await organizer.organize();

  console.log('\n' + '-'.repeat(60));
  console.log('RESULTS:');
  console.log('-'.repeat(60));
  console.log(`Files organized: ${stats.filesOrganized}`);
  console.log(`Directories created: ${stats.directoriesCreated}`);
  console.log();

  console.log('Category breakdown:');
  Object.entries(stats.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category.padEnd(15)}: ${count} files`);
    });

  console.log('\nCheck the demo-directory to see the organized files!');
}

// Demo 2: Dry run mode
async function demo2_dryRun() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 2: Dry Run Mode (Preview Without Moving)');
  console.log('='.repeat(60) + '\n');

  const demoDir = await createDemoFiles();

  console.log('\nRunning dry-run mode...\n');

  const organizer = new FileOrganizer(demoDir, {
    dryRun: true,
    verbose: true,
    createReport: false
  });

  const stats = await organizer.organize();

  console.log('\n' + '-'.repeat(60));
  console.log('DRY RUN COMPLETE');
  console.log('-'.repeat(60));
  console.log('No files were actually moved!');
  console.log(`Would have organized: ${stats.filesOrganized} files`);
  console.log(`Would have created: ${stats.directoriesCreated} directories`);

  // Clean up
  await fs.rm(demoDir, { recursive: true, force: true });
}

// Demo 3: Custom categories
async function demo3_customCategories() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 3: Custom File Categories');
  console.log('='.repeat(60) + '\n');

  const demoDir = path.join(__dirname, 'demo-custom');

  // Clean up if exists
  if (fsSync.existsSync(demoDir)) {
    await fs.rm(demoDir, { recursive: true, force: true });
  }

  await fs.mkdir(demoDir, { recursive: true });

  // Create custom file types
  const customFiles = [
    'project.sketch',
    'design.fig',
    'model.blend',
    'animation.ae'
  ];

  for (const file of customFiles) {
    await fs.writeFile(path.join(demoDir, file), `Custom file: ${file}`);
  }

  // Define custom categories
  const customCategories = {
    design: {
      extensions: ['.sketch', '.fig', '.psd', '.ai'],
      folder: 'Design-Files'
    },
    '3d': {
      extensions: ['.blend', '.fbx', '.obj', '.stl'],
      folder: '3D-Models'
    },
    motion: {
      extensions: ['.ae', '.pr', '.fcp'],
      folder: 'Motion-Graphics'
    }
  };

  console.log('Custom categories defined:');
  Object.entries(customCategories).forEach(([name, config]) => {
    console.log(`  ${config.folder}: ${config.extensions.join(', ')}`);
  });

  console.log('\nOrganizing with custom categories...\n');

  const organizer = new FileOrganizer(demoDir, {
    customCategories,
    verbose: true,
    createReport: false
  });

  await organizer.organize();

  console.log('\nCustom organization complete!');

  // Clean up
  await fs.rm(demoDir, { recursive: true, force: true });
}

// Demo 4: Undo operation
async function demo4_undoOperation() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 4: Undo Organization');
  console.log('='.repeat(60) + '\n');

  const demoDir = path.join(__dirname, 'demo-undo');

  // Clean up if exists
  if (fsSync.existsSync(demoDir)) {
    await fs.rm(demoDir, { recursive: true, force: true });
  }

  await fs.mkdir(demoDir, { recursive: true });

  // Create a few test files
  const files = ['image.jpg', 'document.pdf', 'song.mp3'];
  for (const file of files) {
    await fs.writeFile(path.join(demoDir, file), `Test file: ${file}`);
  }

  console.log('Step 1: Organizing files...');

  const organizer = new FileOrganizer(demoDir, { createReport: false });
  await organizer.organize();

  console.log('Files organized into categories');

  // List directories
  const entries = await fs.readdir(demoDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  console.log(`Created folders: ${dirs.join(', ')}`);

  console.log('\nStep 2: Undoing organization...\n');

  await organizer.undo();

  console.log('\nFiles restored to original location!');

  // Clean up
  await fs.rm(demoDir, { recursive: true, force: true });
}

// Main demo runner
async function runAllDemos() {
  console.log('\n' + '='.repeat(60));
  console.log('FILE ORGANIZER - INTERACTIVE DEMOS');
  console.log('='.repeat(60));

  try {
    await demo1_basicOrganization();

    console.log('\n\nPress Ctrl+C to exit or wait for next demo...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    await demo2_dryRun();

    await new Promise(resolve => setTimeout(resolve, 2000));

    await demo3_customCategories();

    await new Promise(resolve => setTimeout(resolve, 2000));

    await demo4_undoOperation();

    console.log('\n' + '='.repeat(60));
    console.log('ALL DEMOS COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nThe demo-directory folder contains the organized files.');
    console.log('Explore it to see how files were categorized!');
    console.log('\nTo clean up, run: rm -rf examples/demo-*');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\nDemo failed:', error.message);
    process.exit(1);
  }
}

// Run demos if executed directly
if (require.main === module) {
  runAllDemos();
}

module.exports = {
  createDemoFiles,
  demo1_basicOrganization,
  demo2_dryRun,
  demo3_customCategories,
  demo4_undoOperation
};
