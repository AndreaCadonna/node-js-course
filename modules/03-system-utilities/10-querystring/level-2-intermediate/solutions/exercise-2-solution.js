/**
 * Level 2 Exercise 2 Solution: URLSearchParams Mastery
 */

console.log('=== Level 2 Exercise 2 Solutions ===\n');

// Task 1: Build search params with method chaining
console.log('Task 1: Chainable parameter builder');
function buildSearchParams(baseParams) {
  return new URLSearchParams(baseParams);
}

const params = buildSearchParams({ q: 'nodejs', page: 1 });
params.append('tag', 'tutorial');
params.set('limit', 20);
console.log(params.toString());
console.log('✓ Task 1 complete\n');

// Task 2: Convert URLSearchParams to object with arrays
console.log('Task 2: Convert to object preserving arrays');
function searchParamsToObject(params) {
  const obj = {};
  
  for (const [key, value] of params) {
    if (obj[key]) {
      if (Array.isArray(obj[key])) {
        obj[key].push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  }
  
  return obj;
}

const testParams = new URLSearchParams('color=red&color=blue&size=large');
const obj = searchParamsToObject(testParams);
console.log(obj);
console.log('color is array:', Array.isArray(obj.color));
console.log('✓ Task 2 complete\n');

// Task 3: Merge two URLSearchParams
console.log('Task 3: Merge URLSearchParams');
function mergeSearchParams(params1, params2) {
  const merged = new URLSearchParams(params1);
  for (const [key, value] of params2) {
    merged.append(key, value);
  }
  return merged;
}

const p1 = new URLSearchParams('a=1&b=2');
const p2 = new URLSearchParams('c=3&d=4');
const merged = mergeSearchParams(p1, p2);
console.log(merged.toString());
console.log('✓ Task 3 complete\n');

console.log('=== All Solutions Complete ===');
