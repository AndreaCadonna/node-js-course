/**
 * Exercise 4: Interactive Todo App
 *
 * OBJECTIVE:
 * Build an interactive todo list application using process.stdin and process.stdout.
 *
 * REQUIREMENTS:
 * 1. Read user input from stdin
 * 2. Support commands: add, list, complete, delete, quit
 * 3. Maintain todo items in memory
 * 4. Display formatted output to stdout
 * 5. Handle line-by-line input processing
 * 6. Provide interactive prompts and feedback
 *
 * LEARNING GOALS:
 * - Working with process.stdin and process.stdout
 * - Handling interactive input
 * - Processing data events from readable streams
 * - Managing application state
 * - Graceful shutdown with process.exit()
 */

// Todo storage
let todos = [];
let nextId = 1;

/**
 * TODO 1: Implement function to display welcome message and instructions
 *
 * Steps:
 * 1. Write welcome message to process.stdout
 * 2. List all available commands:
 *    - add <task> - Add a new todo
 *    - list - Show all todos
 *    - complete <id> - Mark todo as complete
 *    - delete <id> - Delete a todo
 *    - quit - Exit the app
 * 3. Show example usage
 * 4. Use process.stdout.write() instead of console.log for practice
 */
function displayWelcome() {
  // Your code here
}

/**
 * TODO 2: Implement function to display the prompt
 *
 * Steps:
 * 1. Write a prompt symbol to stdout (e.g., '> ')
 * 2. Don't add a newline (so user types on same line)
 *
 * Hint: Use process.stdout.write() without '\n'
 */
function displayPrompt() {
  // Your code here
}

/**
 * TODO 3: Implement function to add a todo
 *
 * Steps:
 * 1. Take the task description as parameter
 * 2. Create a todo object with: id, task, completed (false)
 * 3. Add to todos array
 * 4. Increment nextId
 * 5. Display success message
 *
 * @param {string} task - The task description
 */
function addTodo(task) {
  // Your code here
}

/**
 * TODO 4: Implement function to list all todos
 *
 * Steps:
 * 1. Check if todos array is empty
 * 2. If empty, display "No todos yet"
 * 3. If not empty, display each todo with:
 *    - ID number
 *    - Checkbox [x] if completed, [ ] if not
 *    - Task description
 * 4. Format nicely for readability
 *
 * Example output:
 * 1. [ ] Buy groceries
 * 2. [x] Finish homework
 */
function listTodos() {
  // Your code here
}

/**
 * TODO 5: Implement function to mark todo as complete
 *
 * Steps:
 * 1. Take the todo ID as parameter
 * 2. Find the todo with matching ID
 * 3. If found, set completed to true
 * 4. Display success message
 * 5. If not found, display error message
 *
 * @param {number} id - The todo ID
 */
function completeTodo(id) {
  // Your code here
}

/**
 * TODO 6: Implement function to delete a todo
 *
 * Steps:
 * 1. Take the todo ID as parameter
 * 2. Find the index of todo with matching ID
 * 3. If found, remove from array using splice()
 * 4. Display success message
 * 5. If not found, display error message
 *
 * @param {number} id - The todo ID
 */
function deleteTodo(id) {
  // Your code here
}

/**
 * TODO 7: Implement function to process user commands
 *
 * Steps:
 * 1. Parse the input line
 * 2. Extract command and arguments
 * 3. Handle each command:
 *    - 'add <task>': call addTodo with task
 *    - 'list': call listTodos
 *    - 'complete <id>': call completeTodo with id
 *    - 'delete <id>': call deleteTodo with id
 *    - 'quit': exit gracefully
 * 4. Handle unknown commands
 * 5. Validate arguments (e.g., ID should be a number)
 *
 * @param {string} input - The user input line
 */
function processCommand(input) {
  const trimmed = input.trim();

  if (!trimmed) {
    return; // Ignore empty input
  }

  // Your code here
  // Parse command and args
  // Execute appropriate function
}

/**
 * TODO 8: Implement function to setup stdin and start the app
 *
 * Steps:
 * 1. Set stdin encoding to 'utf8'
 * 2. Display welcome message
 * 3. Display initial prompt
 * 4. Listen to 'data' event on stdin
 * 5. Split input by newlines to handle line-by-line
 * 6. Process each line as a command
 * 7. Display prompt after each command
 * 8. Handle errors gracefully
 */
function startApp() {
  // Your code here
  // Set up stdin
  // process.stdin.setEncoding('utf8');

  // Handle data events
  // process.stdin.on('data', (data) => { ... });
}

// TODO 9: Run the app
// Call startApp to begin

console.log('=== Interactive Todo App ===\n');

// Call your function here

// Hint: For testing, you can simulate input:
// process.stdin.emit('data', 'add Buy milk\n');
// process.stdin.emit('data', 'list\n');
