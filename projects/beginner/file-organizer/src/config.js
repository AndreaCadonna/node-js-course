/**
 * File Organizer Configuration
 * Defines how files should be organized by extension
 */

const FILE_CATEGORIES = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'],
    folder: 'Images'
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx'],
    folder: 'Documents'
  },
  videos: {
    extensions: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'],
    folder: 'Videos'
  },
  audio: {
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
    folder: 'Audio'
  },
  archives: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
    folder: 'Archives'
  },
  code: {
    extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs'],
    folder: 'Code'
  },
  web: {
    extensions: ['.html', '.css', '.scss', '.sass', '.less', '.jsx', '.tsx', '.vue'],
    folder: 'Web'
  },
  data: {
    extensions: ['.json', '.xml', '.yaml', '.yml', '.csv', '.sql', '.db'],
    folder: 'Data'
  },
  executables: {
    extensions: ['.exe', '.msi', '.app', '.deb', '.rpm', '.dmg'],
    folder: 'Executables'
  },
  fonts: {
    extensions: ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
    folder: 'Fonts'
  }
};

// Default folder for files that don't match any category
const DEFAULT_FOLDER = 'Others';

// Files to ignore during organization
const IGNORE_FILES = [
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  '.gitkeep',
  '.gitignore'
];

module.exports = {
  FILE_CATEGORIES,
  DEFAULT_FOLDER,
  IGNORE_FILES
};
