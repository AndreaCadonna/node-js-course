// Exercise 3 Solutions - URL Building
const { URL } = require('url');

function buildUrl(components) {
  const { protocol, hostname, port, pathname, query, hash } = components;
  const url = new URL(`${protocol}://${hostname}`);
  if (port) url.port = port;
  url.pathname = pathname || '/';
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  if (hash) url.hash = hash;
  return url.href;
}

function changeProtocol(urlString, newProtocol) {
  const url = new URL(urlString);
  url.protocol = newProtocol + ':';
  return url.href;
}

function updatePathname(urlString, newPathname) {
  const url = new URL(urlString);
  url.pathname = newPathname;
  return url.href;
}

function cloneAndModify(urlString, modifications) {
  const url = new URL(urlString);
  if (modifications.pathname) url.pathname = modifications.pathname;
  if (modifications.query) Object.entries(modifications.query).forEach(([k, v]) => url.searchParams.set(k, v));
  if (modifications.hash) url.hash = modifications.hash;
  return url.href;
}

function buildPaginationUrls(baseUrl, currentPage, totalPages) {
  const current = new URL(baseUrl);
  current.searchParams.set('page', currentPage);
  
  let next = null, prev = null;
  if (currentPage < totalPages) {
    next = new URL(baseUrl);
    next.searchParams.set('page', currentPage + 1);
    next = next.href;
  }
  if (currentPage > 1) {
    prev = new URL(baseUrl);
    prev.searchParams.set('page', currentPage - 1);
    prev = prev.href;
  }
  
  return { current: current.href, next, prev };
}

console.log('Exercise 3 Solutions - See source code for implementations');
