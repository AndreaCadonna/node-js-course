/**
 * Example 5: Buffer Comparison
 *
 * Demonstrates different ways to compare buffers.
 */

console.log('=== Buffer Comparison ===\n');

// 1. Wrong way: Using ===
console.log('1. Why === doesn\'t work for buffers');
const buf1 = Buffer.from('Hello');
const buf2 = Buffer.from('Hello');
const buf3 = buf1;

console.log('buf1:', buf1);
console.log('buf2:', buf2);
console.log('buf3 = buf1');
console.log('');
console.log('buf1 === buf2:', buf1 === buf2); // false (different objects)
console.log('buf1 === buf3:', buf1 === buf3); // true (same reference)
console.log('⚠️  === compares object identity, not content!');
console.log('');

// 2. Correct way: Using equals()
console.log('2. Correct: Using equals() method');
const bufA = Buffer.from('Hello');
const bufB = Buffer.from('Hello');
const bufC = Buffer.from('World');

console.log('bufA:', bufA, '→', bufA.toString());
console.log('bufB:', bufB, '→', bufB.toString());
console.log('bufC:', bufC, '→', bufC.toString());
console.log('');
console.log('bufA.equals(bufB):', bufA.equals(bufB)); // true
console.log('bufA.equals(bufC):', bufA.equals(bufC)); // false
console.log('');

// 3. Length must match
console.log('3. Length must match for equality');
const short = Buffer.from('Hi');
const long = Buffer.from('Hello');

console.log('short:', short, '→', short.toString());
console.log('long:', long, '→', long.toString());
console.log('short.equals(long):', short.equals(long)); // false
console.log('');

// 4. Byte-by-byte comparison
console.log('4. equals() compares byte-by-byte');
const num1 = Buffer.from([1, 2, 3, 4]);
const num2 = Buffer.from([1, 2, 3, 4]);
const num3 = Buffer.from([1, 2, 3, 5]);

console.log('num1:', Array.from(num1));
console.log('num2:', Array.from(num2));
console.log('num3:', Array.from(num3));
console.log('');
console.log('num1.equals(num2):', num1.equals(num2)); // true
console.log('num1.equals(num3):', num1.equals(num3)); // false (last byte differs)
console.log('');

// 5. Ordering with compare()
console.log('5. Ordering buffers with compare()');
const abc = Buffer.from('abc');
const def = Buffer.from('def');
const abc2 = Buffer.from('abc');

console.log('abc.compare(def):', abc.compare(def)); // -1 (abc < def)
console.log('def.compare(abc):', def.compare(abc)); //  1 (def > abc)
console.log('abc.compare(abc2):', abc.compare(abc2)); //  0 (equal)
console.log('');
console.log('Return values:');
console.log('  -1 (negative): first < second');
console.log('   0 (zero):     first === second');
console.log('   1 (positive): first > second');
console.log('');

// 6. Lexicographic (dictionary) ordering
console.log('6. Lexicographic ordering');
const words = [
  Buffer.from('zebra'),
  Buffer.from('apple'),
  Buffer.from('mango'),
  Buffer.from('banana')
];

console.log('Before sorting:');
words.forEach(w => console.log(' ', w.toString()));

words.sort((a, b) => a.compare(b));

console.log('\nAfter sorting:');
words.forEach(w => console.log(' ', w.toString()));
console.log('');

// 7. Numeric comparison
console.log('7. Comparing numeric values');
const bytes = [
  Buffer.from([1, 2, 3]),
  Buffer.from([1, 2, 4]),
  Buffer.from([1, 3, 0]),
  Buffer.from([2, 0, 0])
];

console.log('Buffers (as arrays):');
bytes.forEach((b, i) => console.log(`  [${i}]:`, Array.from(b)));

bytes.sort((a, b) => a.compare(b));

console.log('\nAfter sorting:');
bytes.forEach((b, i) => console.log(`  [${i}]:`, Array.from(b)));
console.log('');

// 8. Static Buffer.compare()
console.log('8. Static Buffer.compare() method');
const x = Buffer.from('aaa');
const y = Buffer.from('bbb');

console.log('Using instance method:');
console.log('x.compare(y):', x.compare(y));

console.log('\nUsing static method:');
console.log('Buffer.compare(x, y):', Buffer.compare(x, y));
console.log('Both give same result!');
console.log('');

// 9. Practical: File signature verification
console.log('9. Practical: Verifying file signatures');

function isPNG(buffer) {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const header = buffer.subarray(0, 8);
  return header.equals(pngSignature);
}

function isJPEG(buffer) {
  const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);
  const header = buffer.subarray(0, 3);
  return header.equals(jpegSignature);
}

const pngData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
const jpegData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00]);
const textData = Buffer.from('This is text');

console.log('PNG data:', isPNG(pngData) ? '✓ Valid PNG' : '✗ Not PNG');
console.log('JPEG data:', isJPEG(jpegData) ? '✓ Valid JPEG' : '✗ Not JPEG');
console.log('Text data:', isPNG(textData) ? '✓ Valid PNG' : '✗ Not PNG');
console.log('');

// 10. Practical: Finding duplicates
console.log('10. Practical: Finding duplicate buffers');

function findDuplicates(bufferArray) {
  const seen = [];
  const duplicates = [];

  for (const buf of bufferArray) {
    const isDuplicate = seen.some(s => s.equals(buf));
    if (isDuplicate && !duplicates.some(d => d.equals(buf))) {
      duplicates.push(buf);
    } else if (!isDuplicate) {
      seen.push(buf);
    }
  }

  return duplicates;
}

const data = [
  Buffer.from('apple'),
  Buffer.from('banana'),
  Buffer.from('apple'),  // duplicate
  Buffer.from('cherry'),
  Buffer.from('banana')  // duplicate
];

console.log('Data:');
data.forEach((d, i) => console.log(`  [${i}]:`, d.toString()));

const dupes = findDuplicates(data);
console.log('\nDuplicates found:');
dupes.forEach(d => console.log(' ', d.toString()));
console.log('');

// 11. Comparing partial buffers
console.log('11. Comparing parts of buffers');
const file1 = Buffer.from('HEADER:data1:END');
const file2 = Buffer.from('HEADER:data2:END');

const header1 = file1.subarray(0, 6);
const header2 = file2.subarray(0, 6);

console.log('file1:', file1.toString());
console.log('file2:', file2.toString());
console.log('');
console.log('Headers equal:', header1.equals(header2));
console.log('Full files equal:', file1.equals(file2));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use equals() to check if buffers have same content');
console.log('✓ Use compare() for ordering/sorting buffers');
console.log('✓ Never use === to compare buffer contents');
console.log('✓ equals() returns true/false');
console.log('✓ compare() returns -1, 0, or 1');
console.log('✓ Useful for: file signatures, deduplication, sorting');
