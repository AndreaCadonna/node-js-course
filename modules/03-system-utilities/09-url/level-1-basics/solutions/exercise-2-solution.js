// Exercise 2 Solutions - Query Parameters
const { URL } = require('url');

function addQueryParams(urlString, params) {
  const url = new URL(urlString);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.href;
}

function updateQueryParams(urlString, updates) {
  const url = new URL(urlString);
  Object.entries(updates).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.href;
}

function removeQueryParams(urlString, paramsToRemove) {
  const url = new URL(urlString);
  paramsToRemove.forEach(param => url.searchParams.delete(param));
  return url.href;
}

function addArrayParams(urlString, params) {
  const url = new URL(urlString);
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, value);
    }
  });
  return url.href;
}

function getAllParamValues(urlString, paramName) {
  const url = new URL(urlString);
  return url.searchParams.getAll(paramName);
}

console.log('Exercise 2 Solutions - See source code for implementations');
