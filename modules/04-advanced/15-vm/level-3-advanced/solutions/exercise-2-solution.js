/**
 * Exercise 2 Solution: Production REPL
 *
 * A complete, production-grade REPL (Read-Eval-Print Loop) system with:
 * - Multi-line input detection and handling
 * - Command history with navigation
 * - Auto-completion for variables and keywords
 * - Persistent state across evaluations
 * - Built-in commands
 * - Security sandboxing
 * - Execution timeout
 * - Session save/load
 * - Syntax error detection
 * - Result formatting and statistics
 */

const vm = require('vm');
const readline = require('readline');
const fs = require('fs');
const { performance } = require('perf_hooks');
const util = require('util');

/**
 * ProductionREPL - A production-grade REPL system
 */
class ProductionREPL {
  constructor(options = {}) {
    // Configuration
    this.timeout = options.timeout || 5000;
    this.maxHistorySize = options.maxHistorySize || 100;
    this.enableAutoComplete = options.enableAutoComplete !== false;
    this.enableSecurity = options.enableSecurity !== false;
    this.historyFile = options.historyFile || null;

    // REPL state
    this.context = null;
    this.inputBuffer = '';
    this.history = [];
    this.historyIndex = -1;
    this.tempInput = ''; // Store current input when navigating history

    // Statistics
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalExecutionTime: 0,
      startTime: Date.now()
    };

    // JavaScript keywords for auto-completion
    this.keywords = [
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
      'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
      'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
      'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
      'void', 'while', 'with', 'yield', 'async', 'await', 'of',
      // Built-in objects
      'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math',
      'Number', 'Object', 'Promise', 'RegExp', 'String', 'Symbol',
      'Map', 'Set', 'WeakMap', 'WeakSet'
    ];

    // Built-in commands
    this.commands = {
      '.help': 'Show available commands',
      '.clear': 'Clear REPL context',
      '.history': 'Show command history',
      '.save': 'Save session to file (.save <filename>)',
      '.load': 'Load session from file (.load <filename>)',
      '.stats': 'Show execution statistics',
      '.reset': 'Reset REPL to initial state'
    };

    // Initialize
    this.createContext();
    this.loadHistoryFromFile();
  }

  /**
   * Create a secure sandboxed context for code execution
   */
  createContext() {
    const contextObj = {};

    if (this.enableSecurity) {
      // Security-restricted context - only safe globals
      contextObj.console = console;
      contextObj.setTimeout = setTimeout;
      contextObj.setInterval = setInterval;
      contextObj.clearTimeout = clearTimeout;
      contextObj.clearInterval = clearInterval;

      // Safe built-in objects
      contextObj.Array = Array;
      contextObj.Boolean = Boolean;
      contextObj.Date = Date;
      contextObj.Error = Error;
      contextObj.Function = Function;
      contextObj.JSON = JSON;
      contextObj.Math = Math;
      contextObj.Number = Number;
      contextObj.Object = Object;
      contextObj.Promise = Promise;
      contextObj.RegExp = RegExp;
      contextObj.String = String;
      contextObj.Symbol = Symbol;
      contextObj.Map = Map;
      contextObj.Set = Set;
      contextObj.WeakMap = WeakMap;
      contextObj.WeakSet = WeakSet;

      // Utility functions
      contextObj.parseInt = parseInt;
      contextObj.parseFloat = parseFloat;
      contextObj.isNaN = isNaN;
      contextObj.isFinite = isFinite;
      contextObj.encodeURI = encodeURI;
      contextObj.encodeURIComponent = encodeURIComponent;
      contextObj.decodeURI = decodeURI;
      contextObj.decodeURIComponent = decodeURIComponent;
    } else {
      // Full global context (less secure)
      Object.assign(contextObj, global);
    }

    this.context = vm.createContext(contextObj);
  }

  /**
   * Check if the input is syntactically complete
   * Returns true if code can be executed, false if waiting for more input
   */
  isCompleteInput(code) {
    if (!code.trim()) {
      return true;
    }

    try {
      // Try to parse the code as a script
      new vm.Script(code);
      return true;
    } catch (error) {
      // Check if error indicates incomplete input
      if (error instanceof SyntaxError) {
        const message = error.message;

        // Common patterns for incomplete input
        const incompletePatterns = [
          /Unexpected end of input/,
          /Unexpected token/,
          /Missing/,
          /Unterminated/
        ];

        // Check for unclosed braces, brackets, parentheses
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        const openBrackets = (code.match(/\[/g) || []).length;
        const closeBrackets = (code.match(/\]/g) || []).length;
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;

        if (openBraces !== closeBraces ||
            openBrackets !== closeBrackets ||
            openParens !== closeParens) {
          return false;
        }

        // Check for incomplete patterns
        for (const pattern of incompletePatterns) {
          if (pattern.test(message)) {
            return false;
          }
        }
      }

      // If we can't determine, assume it's complete (will show error on eval)
      return true;
    }
  }

  /**
   * Add a line of input to the buffer
   * If input is complete, evaluate it; otherwise, wait for more input
   */
  addLine(line) {
    // Check for built-in commands
    if (line.trim().startsWith('.')) {
      const result = this.processCommand(line.trim());
      this.inputBuffer = '';
      return result;
    }

    // Add line to input buffer
    if (this.inputBuffer) {
      this.inputBuffer += '\n' + line;
    } else {
      this.inputBuffer = line;
    }

    // Check if input is complete
    if (this.isCompleteInput(this.inputBuffer)) {
      const code = this.inputBuffer;
      this.inputBuffer = '';
      return this.eval(code);
    } else {
      // Waiting for more input
      return {
        complete: false,
        prompt: '... '
      };
    }
  }

  /**
   * Evaluate code in the REPL context
   */
  eval(code) {
    const startTime = performance.now();
    const result = {
      complete: true,
      success: false,
      result: undefined,
      error: null,
      executionTime: 0
    };

    try {
      // Add to history (before execution in case of timeout)
      this.addToHistory(code);

      // Compile the script
      const script = new vm.Script(code, {
        filename: 'repl',
        displayErrors: true
      });

      // Execute with timeout
      const value = script.runInContext(this.context, {
        timeout: this.timeout,
        displayErrors: true
      });

      // Success
      result.success = true;
      result.result = value;
      this.stats.successfulExecutions++;

    } catch (error) {
      // Execution failed
      result.success = false;
      result.error = error.message || String(error);
      this.stats.failedExecutions++;
    }

    // Update statistics
    const executionTime = performance.now() - startTime;
    result.executionTime = executionTime;
    this.stats.totalExecutions++;
    this.stats.totalExecutionTime += executionTime;

    return result;
  }

  /**
   * Get auto-completion suggestions for partial input
   */
  getCompletions(partial) {
    if (!this.enableAutoComplete) {
      return [];
    }

    const completions = new Set();

    // Handle property access (e.g., "Math.P")
    const match = partial.match(/^(.*\.)([^.]*)$/);

    if (match) {
      // Property completion: "object.prop"
      const [, objectPath, propertyPrefix] = match;

      try {
        // Evaluate the object path in context
        const script = new vm.Script(objectPath.slice(0, -1));
        const obj = script.runInContext(this.context, { timeout: 100 });

        if (obj && typeof obj === 'object') {
          // Get all properties
          const props = Object.getOwnPropertyNames(obj);
          const protoProps = obj.constructor ? Object.getOwnPropertyNames(obj.constructor.prototype) : [];

          [...props, ...protoProps].forEach(prop => {
            if (prop.startsWith(propertyPrefix)) {
              completions.add(objectPath + prop);
            }
          });
        }
      } catch (error) {
        // Ignore errors in completion
      }
    } else {
      // Variable/keyword completion

      // Add JavaScript keywords
      this.keywords.forEach(keyword => {
        if (keyword.startsWith(partial)) {
          completions.add(keyword);
        }
      });

      // Add context variables
      try {
        const contextVars = Object.keys(this.context);
        contextVars.forEach(varName => {
          if (varName.startsWith(partial)) {
            completions.add(varName);
          }
        });
      } catch (error) {
        // Ignore errors
      }
    }

    return Array.from(completions).sort();
  }

  /**
   * Add code to command history
   */
  addToHistory(code) {
    if (!code.trim()) {
      return;
    }

    // Don't add duplicate consecutive entries
    if (this.history.length > 0 && this.history[this.history.length - 1] === code) {
      return;
    }

    this.history.push(code);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Reset history navigation
    this.historyIndex = -1;
    this.tempInput = '';

    // Save to file if configured
    this.saveHistoryToFile();
  }

  /**
   * Get full command history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Navigate to previous history item
   */
  historyPrev() {
    if (this.history.length === 0) {
      return null;
    }

    // First time navigating - save current input
    if (this.historyIndex === -1) {
      this.tempInput = this.inputBuffer;
      this.historyIndex = this.history.length - 1;
    } else if (this.historyIndex > 0) {
      this.historyIndex--;
    }

    return this.history[this.historyIndex];
  }

  /**
   * Navigate to next history item
   */
  historyNext() {
    if (this.historyIndex === -1) {
      return null;
    }

    this.historyIndex++;

    // Reached end of history - restore temp input
    if (this.historyIndex >= this.history.length) {
      this.historyIndex = -1;
      return this.tempInput;
    }

    return this.history[this.historyIndex];
  }

  /**
   * Process built-in commands
   */
  processCommand(input) {
    const parts = input.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    const result = {
      complete: true,
      success: true,
      output: '',
      isCommand: true
    };

    try {
      switch (command) {
        case '.help':
          result.output = this.getHelpText();
          break;

        case '.clear':
          this.createContext();
          result.output = 'Context cleared';
          break;

        case '.history':
          result.output = this.getHistoryText();
          break;

        case '.save':
          if (args.length === 0) {
            result.success = false;
            result.output = 'Usage: .save <filename>';
          } else {
            this.saveSession(args[0]);
            result.output = `Session saved to ${args[0]}`;
          }
          break;

        case '.load':
          if (args.length === 0) {
            result.success = false;
            result.output = 'Usage: .load <filename>';
          } else {
            this.loadSession(args[0]);
            result.output = `Session loaded from ${args[0]}`;
          }
          break;

        case '.stats':
          result.output = this.getStatsText();
          break;

        case '.reset':
          this.reset();
          result.output = 'REPL reset to initial state';
          break;

        default:
          result.success = false;
          result.output = `Unknown command: ${command}\nType .help for available commands`;
      }
    } catch (error) {
      result.success = false;
      result.output = `Command error: ${error.message}`;
    }

    return result;
  }

  /**
   * Get help text for commands
   */
  getHelpText() {
    let text = 'Available Commands:\n';
    for (const [cmd, desc] of Object.entries(this.commands)) {
      text += `  ${cmd.padEnd(15)} - ${desc}\n`;
    }
    return text.trim();
  }

  /**
   * Get formatted history text
   */
  getHistoryText() {
    if (this.history.length === 0) {
      return 'No command history';
    }

    return this.history
      .map((cmd, index) => `  ${(index + 1).toString().padStart(3)}: ${cmd}`)
      .join('\n');
  }

  /**
   * Get formatted statistics text
   */
  getStatsText() {
    const stats = this.getStats();
    return `
Execution Statistics:
  Total Executions:      ${stats.totalExecutions}
  Successful:            ${stats.successfulExecutions}
  Failed:                ${stats.failedExecutions}
  Average Time:          ${stats.averageExecutionTime.toFixed(2)}ms
  Total Time:            ${stats.totalExecutionTime.toFixed(2)}ms
  Uptime:                ${stats.uptime}ms
  History Size:          ${this.history.length}
    `.trim();
  }

  /**
   * Save session to file
   */
  saveSession(filename) {
    const sessionData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      history: this.history,
      // Save context variables (only serializable ones)
      contextVars: this.getSerializableContext(),
      stats: this.stats
    };

    fs.writeFileSync(filename, JSON.stringify(sessionData, null, 2), 'utf8');
  }

  /**
   * Load session from file
   */
  loadSession(filename) {
    const sessionData = JSON.parse(fs.readFileSync(filename, 'utf8'));

    // Restore history
    this.history = sessionData.history || [];

    // Restore context variables
    if (sessionData.contextVars) {
      for (const [key, value] of Object.entries(sessionData.contextVars)) {
        try {
          this.context[key] = value;
        } catch (error) {
          // Skip non-restorable variables
        }
      }
    }

    // Optionally restore stats
    if (sessionData.stats) {
      Object.assign(this.stats, sessionData.stats);
    }
  }

  /**
   * Get serializable context variables
   */
  getSerializableContext() {
    const serializable = {};

    for (const key of Object.keys(this.context)) {
      const value = this.context[key];
      const type = typeof value;

      // Only save primitive values and simple objects
      if (type === 'string' || type === 'number' || type === 'boolean') {
        serializable[key] = value;
      } else if (value === null || value === undefined) {
        serializable[key] = value;
      } else if (Array.isArray(value)) {
        try {
          JSON.stringify(value);
          serializable[key] = value;
        } catch (error) {
          // Skip non-serializable arrays
        }
      } else if (type === 'object' && value.constructor === Object) {
        try {
          JSON.stringify(value);
          serializable[key] = value;
        } catch (error) {
          // Skip non-serializable objects
        }
      }
    }

    return serializable;
  }

  /**
   * Load history from file
   */
  loadHistoryFromFile() {
    if (!this.historyFile || !fs.existsSync(this.historyFile)) {
      return;
    }

    try {
      const data = fs.readFileSync(this.historyFile, 'utf8');
      this.history = data.split('\n').filter(line => line.trim());
    } catch (error) {
      // Ignore errors loading history file
    }
  }

  /**
   * Save history to file
   */
  saveHistoryToFile() {
    if (!this.historyFile) {
      return;
    }

    try {
      fs.writeFileSync(this.historyFile, this.history.join('\n'), 'utf8');
    } catch (error) {
      // Ignore errors saving history file
    }
  }

  /**
   * Format result for display
   */
  formatResult(result) {
    if (result === undefined) {
      return 'undefined';
    }

    if (result === null) {
      return 'null';
    }

    const type = typeof result;

    if (type === 'string') {
      return `'${result}'`;
    }

    if (type === 'number' || type === 'boolean') {
      return String(result);
    }

    if (type === 'function') {
      return `[Function: ${result.name || 'anonymous'}]`;
    }

    if (type === 'symbol') {
      return result.toString();
    }

    // Object or Array - use util.inspect for nice formatting
    return util.inspect(result, {
      depth: 3,
      colors: false,
      maxArrayLength: 20,
      breakLength: 60
    });
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      totalExecutions: this.stats.totalExecutions,
      successfulExecutions: this.stats.successfulExecutions,
      failedExecutions: this.stats.failedExecutions,
      averageExecutionTime: this.stats.totalExecutions > 0
        ? this.stats.totalExecutionTime / this.stats.totalExecutions
        : 0,
      totalExecutionTime: this.stats.totalExecutionTime,
      uptime: Date.now() - this.stats.startTime,
      historySize: this.history.length
    };
  }

  /**
   * Reset REPL to initial state
   */
  reset() {
    this.createContext();
    this.inputBuffer = '';
    this.history = [];
    this.historyIndex = -1;
    this.tempInput = '';

    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalExecutionTime: 0,
      startTime: Date.now()
    };
  }
}

// ============================================================================
// Test Cases - DO NOT MODIFY
// ============================================================================

function runTests() {
  console.log('Testing Production REPL\n');
  console.log('='.repeat(60));

  const repl = new ProductionREPL({
    timeout: 3000,
    maxHistorySize: 50,
    enableAutoComplete: true,
    enableSecurity: true
  });

  // Test 1: Simple evaluation
  console.log('\n✓ Test 1: Simple Evaluation');
  let result = repl.addLine('2 + 2');
  console.assert(result.complete === true, 'Should be complete');
  console.assert(result.result === 4, 'Result should be 4');
  console.log('  Result:', result.result);

  // Test 2: Variable persistence
  console.log('\n✓ Test 2: Variable Persistence');
  repl.addLine('x = 10');
  result = repl.addLine('y = 20');
  result = repl.addLine('x + y');
  console.assert(result.result === 30, 'Variables should persist');
  console.log('  Result:', result.result);

  // Test 3: Multi-line input
  console.log('\n✓ Test 3: Multi-line Input');
  result = repl.addLine('function add(a, b) {');
  console.assert(result.complete === false, 'Should be incomplete');
  result = repl.addLine('  return a + b;');
  console.assert(result.complete === false, 'Should be incomplete');
  result = repl.addLine('}');
  console.assert(result.complete === true, 'Should be complete');
  result = repl.addLine('add(5, 7)');
  console.assert(result.result === 12, 'Function should work');
  console.log('  Function result:', result.result);

  // Test 4: Auto-completion
  console.log('\n✓ Test 4: Auto-completion');
  const completions = repl.getCompletions('Ma');
  console.assert(completions.includes('Math'), 'Should include Math');
  console.log('  Completions for "Ma":', completions);

  // Test 5: History
  console.log('\n✓ Test 5: Command History');
  const history = repl.getHistory();
  console.assert(history.length > 0, 'Should have history');
  console.log('  History entries:', history.length);

  // Test 6: Security
  console.log('\n✓ Test 6: Security Sandboxing');
  result = repl.addLine('process');
  console.assert(result.success === false || result.result === undefined,
    'process should be blocked');
  console.log('  Security works');

  // Test 7: Timeout
  console.log('\n✓ Test 7: Timeout Protection');
  result = repl.addLine('while(true) {}');
  console.assert(result.success === false, 'Should timeout');
  console.log('  Timeout works');

  // Test 8: Statistics
  console.log('\n✓ Test 8: Statistics');
  const stats = repl.getStats();
  console.assert(stats.totalExecutions > 0, 'Should track executions');
  console.log('  Stats:', stats);

  console.log('\n' + '='.repeat(60));
  console.log('\nAll tests completed!');
}

// Export for reuse
module.exports = ProductionREPL;

// Run tests if executed directly
if (require.main === module) {
  runTests();
}
