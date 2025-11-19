/**
 * Exercise 4: HTTP Client
 *
 * Practice making HTTP requests to external APIs.
 */

const http = require('http');
const https = require('https');

console.log('=== Exercise 4: HTTP Client ===\n');

// Task 1: Create a GET request wrapper
/**
 * Create a function that makes a GET request and returns a Promise
 * @param {string} url - Full URL to request
 * @returns {Promise<{statusCode, headers, body}>}
 */
function httpGet(url) {
  // TODO: Implement HTTP GET request
  // Parse URL
  // Make request
  // Return Promise with response data
  // Your code here
}

// Task 2: Fetch user data from JSONPlaceholder API
/**
 * Fetch user with ID 1 from: https://jsonplaceholder.typicode.com/users/1
 * Parse the JSON response
 * Log the user's name and email
 */
async function fetchUser(userId) {
  // TODO: Implement user fetching
  // Your code here
}

// Task 3: Fetch multiple users concurrently
/**
 * Fetch users with IDs 1, 2, and 3 concurrently
 * Use Promise.all()
 * Log all users
 */
async function fetchMultipleUsers(userIds) {
  // TODO: Implement concurrent fetching
  // Your code here
}

// Task 4: Make a POST request
/**
 * Create a function that makes a POST request
 * @param {string} url - Full URL
 * @param {object} data - Data to send
 * @returns {Promise<{statusCode, headers, body}>}
 */
function httpPost(url, data) {
  // TODO: Implement HTTP POST request
  // Your code here
}

// Task 5: Create a new post on JSONPlaceholder
/**
 * POST to: https://jsonplaceholder.typicode.com/posts
 * Send: { title: "My Post", body: "Content", userId: 1 }
 * Log the created post
 */
async function createPost(postData) {
  // TODO: Implement post creation
  // Your code here
}

// Run the exercises
async function runExercises() {
  console.log('Task 2: Fetch a single user');
  // await fetchUser(1);

  console.log('\nTask 3: Fetch multiple users');
  // await fetchMultipleUsers([1, 2, 3]);

  console.log('\nTask 5: Create a post');
  // await createPost({
  //   title: 'My Post',
  //   body: 'This is my post content',
  //   userId: 1
  // });

  console.log('\nAll tasks completed!');
}

// Uncomment to run
// runExercises().catch(console.error);

console.log('Implement the functions and uncomment runExercises() to test!');

/**
 * Testing:
 * 1. Implement all functions
 * 2. Uncomment the runExercises() call
 * 3. Run: node exercise-4.js
 *
 * Expected Output:
 * - User data from JSONPlaceholder API
 * - Multiple users fetched concurrently
 * - Created post response
 */
