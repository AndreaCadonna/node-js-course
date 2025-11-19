/**
 * SOLUTION: Exercise 4 - Interactive Todo App
 *
 * This solution demonstrates building interactive CLI applications using process.stdin
 * and process.stdout. It showcases stream handling, user interaction, state management,
 * and creating responsive command-line interfaces.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - Reading from process.stdin (standard input)
 * - Writing to process.stdout (standard output)
 * - Handling stream events ('data', 'end')
 * - Interactive command processing
 * - Application state management
 * - Line-by-line input processing
 * - Graceful shutdown with process.exit()
 *
 * PRODUCTION FEATURES:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Input validation and error handling
 * - User-friendly prompts and feedback
 * - Command parsing with arguments
 * - Clear visual formatting
 * - Help system with examples
 */

// Application state - stores all todos
let todos = [];
let nextId = 1;

/**
 * Displays welcome message and available commands
 *
 * This function sets the stage for user interaction by clearly explaining
 * what the application does and how to use it.
 */
function displayWelcome() {
  // Using process.stdout.write() instead of console.log for practice
  // Note: We need to add \n manually for line breaks
  process.stdout.write('╔════════════════════════════════════════════╗\n');
  process.stdout.write('║        Interactive Todo App                ║\n');
  process.stdout.write('╚════════════════════════════════════════════╝\n');
  process.stdout.write('\n');
  process.stdout.write('Available Commands:\n');
  process.stdout.write('  add <task>        - Add a new todo item\n');
  process.stdout.write('  list              - Show all todo items\n');
  process.stdout.write('  complete <id>     - Mark a todo as completed\n');
  process.stdout.write('  delete <id>       - Delete a todo item\n');
  process.stdout.write('  help              - Show this help message\n');
  process.stdout.write('  quit              - Exit the application\n');
  process.stdout.write('\n');
  process.stdout.write('Examples:\n');
  process.stdout.write('  add Buy groceries\n');
  process.stdout.write('  list\n');
  process.stdout.write('  complete 1\n');
  process.stdout.write('  delete 2\n');
  process.stdout.write('\n');
  process.stdout.write('═'.repeat(46) + '\n');
  process.stdout.write('\n');
}

/**
 * Displays the input prompt
 *
 * The prompt appears on the same line where the user types,
 * creating an interactive feel like a shell.
 */
function displayPrompt() {
  // Write without newline so user types on the same line
  process.stdout.write('todo> ');
}

/**
 * Adds a new todo item
 *
 * @param {string} task - The task description
 */
function addTodo(task) {
  // Validate that task is not empty
  if (!task || task.trim() === '') {
    process.stdout.write('❌ Error: Task description cannot be empty\n');
    return;
  }

  // Create new todo object
  const todo = {
    id: nextId++,
    task: task.trim(),
    completed: false,
    createdAt: new Date()
  };

  // Add to todos array
  todos.push(todo);

  // Provide user feedback
  process.stdout.write(`✅ Added todo #${todo.id}: "${todo.task}"\n`);
}

/**
 * Lists all todo items
 *
 * Displays todos in a formatted, readable manner with checkboxes
 * to indicate completion status.
 */
function listTodos() {
  // Check if there are any todos
  if (todos.length === 0) {
    process.stdout.write('📋 No todos yet. Add one with: add <task>\n');
    return;
  }

  // Display header
  process.stdout.write('\n📋 Your Todos:\n');
  process.stdout.write('─'.repeat(46) + '\n');

  // Display each todo with formatting
  todos.forEach(todo => {
    // Checkbox: [x] for completed, [ ] for incomplete
    const checkbox = todo.completed ? '[✓]' : '[ ]';

    // Strike-through effect for completed tasks using Unicode
    const taskDisplay = todo.completed
      ? `\x1b[9m${todo.task}\x1b[0m` // ANSI strikethrough
      : todo.task;

    // Format: ID. [checkbox] Task
    process.stdout.write(`  ${todo.id}. ${checkbox} ${taskDisplay}\n`);
  });

  process.stdout.write('─'.repeat(46) + '\n');

  // Display summary statistics
  const completedCount = todos.filter(t => t.completed).length;
  const pendingCount = todos.length - completedCount;
  process.stdout.write(`Total: ${todos.length} | Completed: ${completedCount} | Pending: ${pendingCount}\n`);
  process.stdout.write('\n');
}

/**
 * Marks a todo as completed
 *
 * @param {number} id - The todo ID to complete
 */
function completeTodo(id) {
  // Find the todo with matching ID
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    process.stdout.write(`❌ Error: Todo #${id} not found\n`);
    process.stdout.write('💡 Tip: Use "list" to see all todos and their IDs\n');
    return;
  }

  // Check if already completed
  if (todo.completed) {
    process.stdout.write(`ℹ️  Todo #${id} is already completed\n`);
    return;
  }

  // Mark as completed
  todo.completed = true;
  todo.completedAt = new Date();

  process.stdout.write(`✅ Completed todo #${id}: "${todo.task}"\n`);
}

/**
 * Deletes a todo item
 *
 * @param {number} id - The todo ID to delete
 */
function deleteTodo(id) {
  // Find the index of the todo
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    process.stdout.write(`❌ Error: Todo #${id} not found\n`);
    process.stdout.write('💡 Tip: Use "list" to see all todos and their IDs\n');
    return;
  }

  // Get todo for confirmation message
  const todo = todos[index];

  // Remove from array
  todos.splice(index, 1);

  process.stdout.write(`🗑️  Deleted todo #${id}: "${todo.task}"\n`);
}

/**
 * Processes user commands
 *
 * This is the command dispatcher that parses input and routes to
 * appropriate handler functions.
 *
 * @param {string} input - The user input line
 */
function processCommand(input) {
  // Trim whitespace
  const trimmed = input.trim();

  // Ignore empty input
  if (!trimmed) {
    return;
  }

  // Split input into command and arguments
  // e.g., "add Buy milk" -> ["add", "Buy", "milk"]
  const parts = trimmed.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Route to appropriate handler based on command
  switch (command) {
    case 'add':
      // Join all arguments to form the task description
      // This allows tasks with spaces: "add Buy milk and bread"
      const task = args.join(' ');
      addTodo(task);
      break;

    case 'list':
      listTodos();
      break;

    case 'complete':
      // Parse ID from first argument
      if (args.length === 0) {
        process.stdout.write('❌ Error: Please provide a todo ID\n');
        process.stdout.write('   Usage: complete <id>\n');
        break;
      }

      const completeId = parseInt(args[0], 10);
      if (isNaN(completeId)) {
        process.stdout.write(`❌ Error: "${args[0]}" is not a valid ID\n`);
        process.stdout.write('   IDs must be numbers (e.g., complete 1)\n');
        break;
      }

      completeTodo(completeId);
      break;

    case 'delete':
      // Parse ID from first argument
      if (args.length === 0) {
        process.stdout.write('❌ Error: Please provide a todo ID\n');
        process.stdout.write('   Usage: delete <id>\n');
        break;
      }

      const deleteId = parseInt(args[0], 10);
      if (isNaN(deleteId)) {
        process.stdout.write(`❌ Error: "${args[0]}" is not a valid ID\n`);
        process.stdout.write('   IDs must be numbers (e.g., delete 1)\n');
        break;
      }

      deleteTodo(deleteId);
      break;

    case 'help':
      displayWelcome();
      break;

    case 'quit':
    case 'exit':
      // Display goodbye message
      process.stdout.write('\n👋 Goodbye! Thanks for using Todo App!\n\n');

      // Exit gracefully
      process.exit(0);
      break;

    default:
      process.stdout.write(`❌ Unknown command: "${command}"\n`);
      process.stdout.write('💡 Type "help" to see available commands\n');
  }
}

/**
 * Sets up stdin and starts the interactive application
 *
 * This function configures the input stream and sets up event handlers
 * for processing user input line by line.
 */
function startApp() {
  // Set encoding to UTF-8 so we get strings instead of buffers
  process.stdin.setEncoding('utf8');

  // Display welcome message
  displayWelcome();

  // Display initial prompt
  displayPrompt();

  // Buffer to accumulate partial lines
  let buffer = '';

  /**
   * Handle data events from stdin
   *
   * Data can come in chunks, so we need to:
   * 1. Accumulate data in a buffer
   * 2. Split by newlines to get complete lines
   * 3. Process each complete line
   * 4. Keep any partial line for next data event
   */
  process.stdin.on('data', (chunk) => {
    // Add chunk to buffer
    buffer += chunk;

    // Split by newlines to get lines
    const lines = buffer.split('\n');

    // Last element might be incomplete, so save it for next time
    buffer = lines.pop() || '';

    // Process each complete line
    lines.forEach(line => {
      // Process the command
      processCommand(line);

      // Show prompt for next command
      displayPrompt();
    });
  });

  /**
   * Handle end of input (Ctrl+D on Unix, Ctrl+Z on Windows)
   *
   * This event fires when stdin is closed.
   */
  process.stdin.on('end', () => {
    process.stdout.write('\n\n👋 Input stream closed. Goodbye!\n');
    process.exit(0);
  });

  /**
   * Handle errors on stdin
   */
  process.stdin.on('error', (err) => {
    process.stderr.write(`\n❌ Input error: ${err.message}\n`);
    process.exit(1);
  });
}

// Start the application
startApp();

/**
 * LEARNING NOTES:
 *
 * 1. process.stdin is a readable stream for user input
 * 2. process.stdout is a writable stream for output
 * 3. process.stderr is a writable stream for errors
 *
 * 4. Streams emit events:
 *    - 'data': When data is available to read
 *    - 'end': When stream is closed
 *    - 'error': When an error occurs
 *
 * 5. setEncoding('utf8') converts buffers to strings automatically
 *
 * 6. Data can arrive in chunks, not always complete lines:
 *    - Need to buffer incomplete lines
 *    - Split by '\n' to get complete lines
 *    - Save partial line for next chunk
 *
 * 7. process.stdout.write() vs console.log():
 *    - write() gives more control (no automatic newline)
 *    - console.log() adds newline automatically
 *
 * BEST PRACTICES:
 *
 * 1. Always set encoding on stdin to get strings
 * 2. Handle incomplete lines with buffering
 * 3. Provide clear prompts for user input
 * 4. Give immediate feedback for user actions
 * 5. Validate all user input
 * 6. Provide helpful error messages
 * 7. Handle edge cases (empty input, invalid IDs, etc.)
 * 8. Allow multiple ways to exit (quit, exit, Ctrl+D)
 *
 * INTERACTIVE CLI PATTERNS:
 *
 * 1. Command-argument pattern: "command arg1 arg2"
 * 2. Prompt-response pattern: Display prompt, wait for input
 * 3. Feedback loop: Input -> Process -> Output -> Prompt
 * 4. Help system: Always provide help command
 * 5. Graceful exit: Multiple exit methods, goodbye message
 *
 * ENHANCEMENTS FOR PRODUCTION:
 *
 * 1. Add readline module for better input handling:
 *    - Line editing
 *    - Command history
 *    - Tab completion
 *
 * 2. Add file persistence:
 *    - Save todos to JSON file
 *    - Load todos on startup
 *
 * 3. Add more commands:
 *    - edit <id> <new task>
 *    - clear (delete all completed)
 *    - search <keyword>
 *    - sort (by date, completion, etc.)
 *
 * 4. Add priorities:
 *    - High, medium, low priority
 *    - Sort by priority
 *
 * 5. Add due dates:
 *    - Set deadlines
 *    - Show overdue items
 *
 * 6. Use colors:
 *    - chalk or colors package
 *    - Color-code by priority or status
 *
 * 7. Add undo functionality:
 *    - Keep command history
 *    - Allow undoing last action
 *
 * COMMON USE CASES:
 *
 * 1. Interactive CLIs (task managers, note apps, etc.)
 * 2. REPLs (Read-Eval-Print-Loop) for custom languages
 * 3. Configuration wizards
 * 4. Interactive debugging tools
 * 5. Chat applications
 * 6. Command shells
 * 7. Interactive installers
 */
