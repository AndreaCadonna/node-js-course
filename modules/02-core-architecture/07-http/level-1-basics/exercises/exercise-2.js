/**
 * Exercise 2: Query Parameters
 *
 * Build a server that parses and uses URL query parameters.
 */

const http = require('http');
const url = require('url');

console.log('=== Exercise 2: Query Parameters ===\n');

// Task 1: Create a greeting endpoint
/**
 * Create GET /greet endpoint that:
 * - Accepts query parameters: name and language
 * - Returns greeting in specified language
 * - Defaults: name="Guest", language="en"
 *
 * Examples:
 * /greet?name=Alice&language=en -> "Hello, Alice!"
 * /greet?name=Bob&language=es -> "Hola, Bob!"
 * /greet?name=Charlie&language=fr -> "Bonjour, Charlie!"
 * /greet -> "Hello, Guest!"
 */

// Task 2: Create a calculator endpoint
/**
 * Create GET /calculate endpoint that:
 * - Accepts query parameters: a, b, operation
 * - Performs calculation (add, subtract, multiply, divide)
 * - Returns result as JSON
 * - Handles invalid input with 400 error
 *
 * Examples:
 * /calculate?a=10&b=5&operation=add -> {"result": 15}
 * /calculate?a=10&b=5&operation=subtract -> {"result": 5}
 * /calculate?a=10&b=5&operation=multiply -> {"result": 50}
 * /calculate?a=10&b=5&operation=divide -> {"result": 2}
 * /calculate?a=10&operation=add -> {"error": "Missing parameters"}
 */

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // TODO: Implement /greet endpoint
  if (pathname === '/greet') {
    // Your code here
    res.end('TODO: Implement greeting');
  }

  // TODO: Implement /calculate endpoint
  else if (pathname === '/calculate') {
    // Your code here
    res.end('TODO: Implement calculator');
  }

  // TODO: Handle 404
  else {
    // Your code here
    res.end('TODO: Handle 404');
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/\n`);
  console.log('Try these commands:');
  console.log('  curl "http://localhost:3000/greet?name=Alice&language=en"');
  console.log('  curl "http://localhost:3000/calculate?a=10&b=5&operation=add"');
});

/**
 * Testing:
 * curl "http://localhost:3000/greet?name=Alice&language=en"
 * curl "http://localhost:3000/greet?name=Bob&language=es"
 * curl "http://localhost:3000/calculate?a=10&b=5&operation=add"
 * curl "http://localhost:3000/calculate?a=10&b=5&operation=divide"
 */
