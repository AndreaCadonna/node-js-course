/**
 * Example 7: URL Templates and Patterns
 *
 * Creating flexible URL construction patterns using templates.
 */

console.log('=== URL Templates ===\n');

// Example 1: Simple URL Template
console.log('1. Simple URL Template');

class URLTemplate {
  constructor(template) {
    this.template = template;
  }

  build(params = {}) {
    let url = this.template;
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(new RegExp(`:${key}`, 'g'), encodeURIComponent(value));
    });
    return url;
  }
}

const userTemplate = new URLTemplate('https://api.example.com/users/:userId/posts/:postId');
console.log(userTemplate.build({ userId: 123, postId: 456 }));
console.log('');

// Example 2: REST API URL builder
console.log('2. REST API URL Builder');

function buildRestUrl(base, resource, id = null, action = null) {
  const url = new URL(base);
  const pathParts = [resource];
  if (id) pathParts.push(id);
  if (action) pathParts.push(action);
  url.pathname = '/' + pathParts.join('/');
  return url.href;
}

console.log('List:', buildRestUrl('https://api.com', 'users'));
console.log('Get:', buildRestUrl('https://api.com', 'users', 123));
console.log('Nested:', buildRestUrl('https://api.com', 'users', 123, 'posts'));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ URL templates provide flexible construction');
console.log('✓ Parameter substitution simplifies API calls');
console.log('✓ REST patterns standardize endpoint naming');
