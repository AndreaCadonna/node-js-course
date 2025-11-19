# Custom Separators Guide

When and how to use custom separators instead of & and =.

## Why Custom Separators?

Default separators (& and =) work for URLs, but custom separators are useful for:
- Log file formats
- Configuration files  
- Cookie headers
- Non-URL data serialization
- Legacy system compatibility

## Common Separators

### Semicolon (;)
Used in cookies and some config formats.

```javascript
const qs = require('querystring');
qs.parse('a=1;b=2', ';'); // { a: '1', b: '2' }
qs.stringify({ a: 1, b: 2 }, ';'); // 'a=1;b=2'
```

### Pipe (|)
Common in log formats.

```javascript
qs.stringify({ level: 'ERROR', msg: 'Failed' }, ' | '); 
// 'level=ERROR | msg=Failed'
```

### Colon (:)
Alternative delimiter.

```javascript
qs.parse('a:1;b:2', ';', ':'); // { a: '1', b: '2' }
```

## Use Cases

**Cookies**: `sessionId=abc; userId=42; theme=dark`
**Logs**: `level=ERROR | msg=Failed | code=500`
**Config**: `host=localhost\nport=3000\ndebug=true`

## Best Practices

1. Use standard & and = for URLs
2. Document custom separators clearly
3. Choose separators that don't appear in values
4. Be consistent within your application
5. Provide parsing utilities for users

Custom separators are powerful for non-URL contexts!
