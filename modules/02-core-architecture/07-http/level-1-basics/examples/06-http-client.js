/**
 * Example 6: HTTP Client Requests
 *
 * Demonstrates:
 * - Making HTTP GET requests
 * - Making HTTP POST requests
 * - Handling responses
 * - Error handling
 * - Using http.get() and http.request()
 */

const http = require('http');
const https = require('https');

console.log('=== HTTP Client Example ===\n');

// Example 1: Simple GET request using http.get()
function simpleGetRequest() {
  console.log('1. Simple GET Request:');

  http.get('http://httpbin.org/get', (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';

    // Collect response data
    res.on('data', (chunk) => {
      data += chunk;
    });

    // When response is complete
    res.on('end', () => {
      console.log('Response:', data);
      console.log('');
    });

  }).on('error', (error) => {
    console.error('Error:', error.message);
  });
}

// Example 2: GET request with query parameters
function getRequestWithParams() {
  console.log('2. GET Request with Query Parameters:');

  const options = {
    hostname: 'httpbin.org',
    port: 80,
    path: '/get?name=Alice&age=30',
    method: 'GET',
    headers: {
      'User-Agent': 'Node.js HTTP Client'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Query Args:', parsed.args);
        console.log('');
      } catch (error) {
        console.error('Parse error:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  req.end();
}

// Example 3: POST request with JSON data
function postJsonRequest() {
  console.log('3. POST Request with JSON:');

  const postData = JSON.stringify({
    name: 'Bob',
    email: 'bob@example.com',
    age: 25
  });

  const options = {
    hostname: 'httpbin.org',
    port: 80,
    path: '/post',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Posted Data:', parsed.json);
        console.log('');
      } catch (error) {
        console.error('Parse error:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });

  // Write data to request body
  req.write(postData);
  req.end();
}

// Example 4: HTTPS GET request
function httpsGetRequest() {
  console.log('4. HTTPS GET Request:');

  https.get('https://api.github.com/users/octocat', {
    headers: {
      'User-Agent': 'Node.js'
    }
  }, (res) => {
    console.log('Status Code:', res.statusCode);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const user = JSON.parse(data);
        console.log('User:', user.login);
        console.log('Name:', user.name);
        console.log('Public Repos:', user.public_repos);
        console.log('');
      } catch (error) {
        console.error('Parse error:', error.message);
      }
    });
  }).on('error', (error) => {
    console.error('Error:', error.message);
  });
}

// Example 5: Request with timeout
function requestWithTimeout() {
  console.log('5. Request with Timeout:');

  const options = {
    hostname: 'httpbin.org',
    port: 80,
    path: '/delay/2', // This endpoint delays for 2 seconds
    method: 'GET',
    timeout: 3000 // 3 second timeout
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Request completed successfully');
      console.log('');
    });
  });

  req.on('timeout', () => {
    console.log('Request timed out');
    req.destroy();
  });

  req.on('error', (error) => {
    if (error.code === 'ECONNRESET') {
      console.log('Connection was reset (due to timeout)');
    } else {
      console.error('Request error:', error.message);
    }
    console.log('');
  });

  req.end();
}

// Example 6: Promise-based request wrapper
function httpGetPromise(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET'
    };

    http.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Example 7: Using the promise wrapper
async function usePromiseWrapper() {
  console.log('6. Using Promise-based Wrapper:');

  try {
    const response = await httpGetPromise('http://httpbin.org/get');
    console.log('Status:', response.statusCode);
    console.log('Body length:', response.body.length);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run all examples sequentially
async function runExamples() {
  simpleGetRequest();

  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  getRequestWithParams();

  await new Promise(resolve => setTimeout(resolve, 1000));
  postJsonRequest();

  await new Promise(resolve => setTimeout(resolve, 1000));
  httpsGetRequest();

  await new Promise(resolve => setTimeout(resolve, 1000));
  requestWithTimeout();

  await new Promise(resolve => setTimeout(resolve, 1000));
  await usePromiseWrapper();

  console.log('All examples completed!');
}

// Run the examples
runExamples().catch(console.error);

/**
 * Key Concepts:
 *
 * 1. http.get() is a shortcut for GET requests
 * 2. http.request() is more flexible for all methods
 * 3. Response is a stream - use 'data' and 'end' events
 * 4. Always handle 'error' events
 * 5. Set Content-Length header for POST requests
 * 6. Use https module for HTTPS requests
 * 7. Implement timeouts to prevent hanging requests
 * 8. Wrap in Promises for easier async/await usage
 */
