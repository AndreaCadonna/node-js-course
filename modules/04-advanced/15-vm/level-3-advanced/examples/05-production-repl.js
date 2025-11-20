/**
 * Example 5: Production-Grade REPL System
 *
 * This example demonstrates:
 * - Complete REPL implementation
 * - Multi-line input support
 * - Command history
 * - Auto-completion
 * - Persistent state
 * - Security features
 */

const vm = require('vm');
const readline = require('readline');
const util = require('util');
const fs = require('fs');
const path = require('path');

console.log('=== Production-Grade REPL System ===\n');

// ============================================================================
// Part 1: Basic REPL Implementation
// ============================================================================

console.log('Part 1: Basic REPL Implementation\n');

/**
 * Simple REPL with persistent context
 */
class BasicREPL {
  constructor() {
    this.context = vm.createContext({
      console,
      Math,
      JSON,
      Date
    });
    this.history = [];
  }

  /**
   * Evaluate code
   */
  eval(code) {
    try {
      this.history.push(code);
      const result = vm.runInContext(code, this.context, {
        timeout: 5000,
        displayErrors: true
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get history
   */
  getHistory() {
    return this.history;
  }

  /**
   * Clear context
   */
  clear() {
    for (const key in this.context) {
      if (!['console', 'Math', 'JSON', 'Date'].includes(key)) {
        delete this.context[key];
      }
    }
  }
}

// Test basic REPL
console.log('Testing basic REPL:');
const basic = new BasicREPL();

const tests = [
  'x = 10',
  'y = 20',
  'x + y',
  'function add(a, b) { return a + b }',
  'add(x, y)'
];

tests.forEach(code => {
  const result = basic.eval(code);
  if (result.success) {
    console.log(`  > ${code}`);
    console.log(`    ${result.result}`);
  } else {
    console.log(`  > ${code}`);
    console.log(`    Error: ${result.error}`);
  }
});

// ============================================================================
// Part 2: Multi-Line Input Support
// ============================================================================

console.log('\n\nPart 2: Multi-Line Input Support\n');

/**
 * REPL with multi-line input detection
 */
class MultiLineREPL extends BasicREPL {
  constructor() {
    super();
    this.buffer = '';
    this.inMultiLine = false;
  }

  /**
   * Check if input is complete
   */
  isCompleteInput(code) {
    try {
      // Try to parse as complete syntax
      new vm.Script(code);
      return true;
    } catch (err) {
      // Check if it's incomplete (not a syntax error)
      if (err.message.includes('Unexpected end of input')) {
        return false;
      }
      return true; // Syntax error, treat as complete
    }
  }

  /**
   * Add line to buffer
   */
  addLine(line) {
    if (this.buffer) {
      this.buffer += '\n' + line;
    } else {
      this.buffer = line;
    }

    if (this.isCompleteInput(this.buffer)) {
      const result = this.eval(this.buffer);
      this.buffer = '';
      this.inMultiLine = false;
      return { complete: true, ...result };
    } else {
      this.inMultiLine = true;
      return { complete: false };
    }
  }

  /**
   * Get prompt
   */
  getPrompt() {
    return this.inMultiLine ? '... ' : '> ';
  }
}

// Test multi-line REPL
console.log('Testing multi-line REPL:');
const multiLine = new MultiLineREPL();

const multiLineTests = [
  ['function factorial(n) {'],
  ['  if (n <= 1) return 1;'],
  ['  return n * factorial(n - 1);'],
  ['}'],
  ['factorial(5)']
];

multiLineTests.forEach(([line]) => {
  const result = multiLine.addLine(line);
  console.log(`  ${multiLine.getPrompt()}${line}`);
  if (result.complete && result.success) {
    console.log(`    ${result.result}`);
  } else if (result.complete && !result.success) {
    console.log(`    Error: ${result.error}`);
  }
});

// ============================================================================
// Part 3: Command History and Auto-Completion
// ============================================================================

console.log('\n\nPart 3: Command History and Auto-Completion\n');

/**
 * REPL with history and completion
 */
class AdvancedREPL extends MultiLineREPL {
  constructor(options = {}) {
    super();
    this.options = {
      maxHistory: options.maxHistory || 100,
      historyFile: options.historyFile || null,
      ...options
    };

    this.history = [];
    this.historyIndex = -1;

    if (this.options.historyFile) {
      this.loadHistory();
    }
  }

  /**
   * Load history from file
   */
  loadHistory() {
    try {
      if (fs.existsSync(this.options.historyFile)) {
        const content = fs.readFileSync(this.options.historyFile, 'utf8');
        this.history = content.split('\n').filter(line => line.trim());
      }
    } catch (err) {
      console.log('  [Warning] Could not load history:', err.message);
    }
  }

  /**
   * Save history to file
   */
  saveHistory() {
    try {
      if (this.options.historyFile) {
        const content = this.history.slice(-this.options.maxHistory).join('\n');
        fs.writeFileSync(this.options.historyFile, content);
      }
    } catch (err) {
      console.log('  [Warning] Could not save history:', err.message);
    }
  }

  /**
   * Add to history
   */
  addToHistory(code) {
    if (code.trim() && this.history[this.history.length - 1] !== code) {
      this.history.push(code);
      if (this.history.length > this.options.maxHistory) {
        this.history.shift();
      }
      this.saveHistory();
    }
    this.historyIndex = this.history.length;
  }

  /**
   * Get previous history item
   */
  historyPrev() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return null;
  }

  /**
   * Get next history item
   */
  historyNext() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    this.historyIndex = this.history.length;
    return '';
  }

  /**
   * Get completions for input
   */
  getCompletions(line) {
    const completions = [];

    // Get all context properties
    const contextKeys = Object.keys(this.context);

    // Match properties
    const match = line.match(/(\w+)$/);
    if (match) {
      const prefix = match[1];
      completions.push(
        ...contextKeys.filter(key => key.startsWith(prefix))
      );
    }

    // Add keywords
    const keywords = [
      'function', 'const', 'let', 'var', 'if', 'else',
      'for', 'while', 'return', 'try', 'catch', 'throw'
    ];
    if (match) {
      const prefix = match[1];
      completions.push(
        ...keywords.filter(kw => kw.startsWith(prefix))
      );
    }

    return [...new Set(completions)];
  }

  /**
   * Execute with history tracking
   */
  eval(code) {
    this.addToHistory(code);
    return super.eval(code);
  }
}

// Test advanced REPL
console.log('Testing advanced REPL features:');
const advanced = new AdvancedREPL({
  maxHistory: 50
});

console.log('Executing commands...');
['x = 42', 'y = 100', 'x + y'].forEach(code => {
  const result = advanced.eval(code);
  console.log(`  > ${code} => ${result.result}`);
});

console.log('\nHistory:', advanced.history.slice(-3));

console.log('\nCompletions for "Ma":');
console.log('  ', advanced.getCompletions('Ma'));

// ============================================================================
// Part 4: Security Features
// ============================================================================

console.log('\n\nPart 4: Security Features\n');

/**
 * Secure REPL with sandboxing
 */
class SecureREPL extends AdvancedREPL {
  constructor(options = {}) {
    super(options);

    this.options = {
      ...this.options,
      timeout: options.timeout || 5000,
      maxOutputLength: options.maxOutputLength || 1000,
      enableLogging: options.enableLogging !== false,
      blacklist: options.blacklist || ['process', 'require', 'module', 'global'],
      ...options
    };

    this.executionLog = [];
    this.recreateSecureContext();
  }

  /**
   * Create secure context
   */
  recreateSecureContext() {
    // Create context with null prototype
    const base = Object.create(null);

    // Add safe globals
    base.console = {
      log: (...args) => this.logOutput('log', args),
      error: (...args) => this.logOutput('error', args),
      warn: (...args) => this.logOutput('warn', args)
    };
    base.Math = Object.create(Math);
    base.JSON = Object.create(JSON);
    base.Date = Date;
    base.Array = Array;
    base.Object = Object;

    // Create proxy for protection
    const handler = {
      get: (target, prop) => {
        if (this.options.blacklist.includes(prop)) {
          throw new Error(`Access to '${prop}' is not allowed`);
        }
        return Reflect.get(target, prop);
      },
      set: (target, prop, value) => {
        if (this.options.blacklist.includes(prop)) {
          throw new Error(`Cannot set '${prop}'`);
        }
        return Reflect.set(target, prop, value);
      }
    };

    this.context = vm.createContext(new Proxy(base, handler));
  }

  /**
   * Log output
   */
  logOutput(level, args) {
    const formatted = args.map(arg =>
      typeof arg === 'object' ? util.inspect(arg) : String(arg)
    ).join(' ');

    const truncated = formatted.length > this.options.maxOutputLength
      ? formatted.substring(0, this.options.maxOutputLength) + '...'
      : formatted;

    console[level](truncated);

    if (this.options.enableLogging) {
      this.executionLog.push({
        timestamp: new Date().toISOString(),
        level,
        message: truncated
      });
    }
  }

  /**
   * Secure evaluation
   */
  eval(code) {
    const startTime = Date.now();

    try {
      // Check code length
      if (code.length > 10000) {
        return {
          success: false,
          error: 'Code too long (max 10000 characters)'
        };
      }

      // Execute with timeout
      const result = vm.runInContext(code, this.context, {
        timeout: this.options.timeout,
        displayErrors: true
      });

      const duration = Date.now() - startTime;

      // Log execution
      if (this.options.enableLogging) {
        this.executionLog.push({
          timestamp: new Date().toISOString(),
          code: code.substring(0, 100),
          duration,
          success: true
        });
      }

      this.addToHistory(code);

      return { success: true, result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      if (this.options.enableLogging) {
        this.executionLog.push({
          timestamp: new Date().toISOString(),
          code: code.substring(0, 100),
          duration,
          success: false,
          error: error.message
        });
      }

      return { success: false, error: error.message, duration };
    }
  }

  /**
   * Get execution statistics
   */
  getStats() {
    const successful = this.executionLog.filter(e => e.success).length;
    const failed = this.executionLog.filter(e => !e.success).length;

    return {
      totalExecutions: this.executionLog.length,
      successful,
      failed,
      successRate: this.executionLog.length > 0
        ? ((successful / this.executionLog.length) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset REPL
   */
  reset() {
    this.recreateSecureContext();
    this.buffer = '';
    this.inMultiLine = false;
    console.log('REPL reset');
  }
}

// Test secure REPL
console.log('Testing secure REPL:');
const secure = new SecureREPL({
  timeout: 2000,
  enableLogging: true
});

console.log('Safe operations:');
['x = 10', 'y = 20', 'x * y'].forEach(code => {
  const result = secure.eval(code);
  console.log(`  > ${code} => ${result.result}`);
});

console.log('\nTesting security:');
const securityTests = [
  'process',
  'require("fs")',
  'while(true) {}'
];

securityTests.forEach(code => {
  const result = secure.eval(code);
  console.log(`  > ${code}`);
  console.log(`    ${result.success ? 'Result: ' + result.result : '✓ Blocked: ' + result.error}`);
});

console.log('\nREPL Statistics:');
console.log(util.inspect(secure.getStats(), { depth: null, colors: true }));

// ============================================================================
// Part 5: Complete Production REPL
// ============================================================================

console.log('\n\nPart 5: Complete Production REPL\n');

/**
 * Production-ready REPL system
 */
class ProductionREPL extends SecureREPL {
  constructor(options = {}) {
    super(options);

    this.commands = new Map([
      ['.help', () => this.showHelp()],
      ['.clear', () => this.clear()],
      ['.reset', () => this.reset()],
      ['.history', () => this.showHistory()],
      ['.stats', () => this.showStats()],
      ['.save', (file) => this.saveSession(file)],
      ['.load', (file) => this.loadSession(file)]
    ]);
  }

  /**
   * Process input
   */
  processInput(input) {
    // Check for commands
    if (input.startsWith('.')) {
      return this.processCommand(input);
    }

    // Regular evaluation
    return this.addLine(input);
  }

  /**
   * Process command
   */
  processCommand(input) {
    const [cmd, ...args] = input.split(' ');
    const handler = this.commands.get(cmd);

    if (handler) {
      handler(...args);
      return { complete: true, success: true };
    } else {
      return {
        complete: true,
        success: false,
        error: `Unknown command: ${cmd}`
      };
    }
  }

  /**
   * Show help
   */
  showHelp() {
    console.log('\nAvailable commands:');
    console.log('  .help     - Show this help');
    console.log('  .clear    - Clear context variables');
    console.log('  .reset    - Reset REPL completely');
    console.log('  .history  - Show command history');
    console.log('  .stats    - Show execution statistics');
    console.log('  .save <file> - Save current session');
    console.log('  .load <file> - Load session from file');
  }

  /**
   * Show history
   */
  showHistory() {
    console.log('\nCommand history:');
    this.history.slice(-10).forEach((cmd, i) => {
      console.log(`  ${i + 1}. ${cmd}`);
    });
  }

  /**
   * Show statistics
   */
  showStats() {
    console.log('\nREPL Statistics:');
    const stats = this.getStats();
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }

  /**
   * Save session
   */
  saveSession(filename) {
    if (!filename) {
      console.log('  Error: Filename required');
      return;
    }

    try {
      const session = {
        history: this.history,
        context: this.getContextState()
      };
      fs.writeFileSync(filename, JSON.stringify(session, null, 2));
      console.log(`  Session saved to ${filename}`);
    } catch (err) {
      console.log(`  Error saving session: ${err.message}`);
    }
  }

  /**
   * Load session
   */
  loadSession(filename) {
    if (!filename) {
      console.log('  Error: Filename required');
      return;
    }

    try {
      const content = fs.readFileSync(filename, 'utf8');
      const session = JSON.parse(content);
      this.history = session.history || [];
      console.log(`  Session loaded from ${filename}`);
    } catch (err) {
      console.log(`  Error loading session: ${err.message}`);
    }
  }

  /**
   * Get context state
   */
  getContextState() {
    const state = {};
    for (const key in this.context) {
      try {
        const value = this.context[key];
        if (typeof value !== 'function') {
          state[key] = value;
        }
      } catch (err) {
        // Skip inaccessible properties
      }
    }
    return state;
  }

  /**
   * Clear context
   */
  clear() {
    super.clear();
    console.log('  Context cleared');
  }
}

// Test production REPL
console.log('Testing production REPL:');
const production = new ProductionREPL({
  timeout: 5000,
  enableLogging: true
});

console.log('Executing commands:');
['x = 100', 'y = 200', 'function multiply(a, b) { return a * b }', 'multiply(x, y)'].forEach(code => {
  const result = production.processInput(code);
  if (result.complete && result.success) {
    console.log(`  > ${code} => ${result.result}`);
  }
});

console.log('\nTesting REPL commands:');
production.processInput('.help');
production.processInput('.stats');

console.log('\n=== Summary: Production REPL ===\n');
console.log('Features Implemented:');
console.log('✓ Multi-line input support');
console.log('✓ Command history with persistence');
console.log('✓ Auto-completion');
console.log('✓ Security sandboxing');
console.log('✓ Execution logging');
console.log('✓ Session save/load');
console.log('✓ Built-in commands');
console.log('✓ Timeout protection');
console.log('✓ Output limiting');
console.log('✓ Statistics tracking');
