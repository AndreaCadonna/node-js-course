/**
 * Image Processing Handler
 * Example task handler for image processing operations
 */

async function execute(payload, context) {
  const { imagePath, operations } = payload;

  context.log(`Processing image: ${imagePath}`);
  context.progress(5);

  if (!imagePath || !operations || !Array.isArray(operations)) {
    throw new Error('Invalid payload: imagePath and operations array required');
  }

  const results = [];
  const totalOps = operations.length;

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    const progress = Math.round(((i + 1) / totalOps) * 100);

    context.log(`Applying operation: ${operation.type}`);

    switch (operation.type) {
      case 'resize':
        await simulateResize(operation.width, operation.height);
        results.push({ type: 'resize', width: operation.width, height: operation.height });
        break;

      case 'crop':
        await simulateCrop(operation.x, operation.y, operation.width, operation.height);
        results.push({ type: 'crop', ...operation });
        break;

      case 'filter':
        await simulateFilter(operation.filter);
        results.push({ type: 'filter', filter: operation.filter });
        break;

      case 'compress':
        await simulateCompress(operation.quality);
        results.push({ type: 'compress', quality: operation.quality });
        break;

      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }

    context.progress(progress);
  }

  context.log('Image processing complete');

  return {
    imagePath,
    operations: results,
    outputPath: imagePath.replace(/\.(jpg|png)$/, '-processed.$1'),
    processedAt: new Date().toISOString()
  };
}

async function simulateResize(width, height) {
  // Simulate CPU-intensive resize operation
  await sleep(1500);
}

async function simulateCrop(x, y, width, height) {
  // Simulate crop operation
  await sleep(800);
}

async function simulateFilter(filter) {
  // Simulate filter application
  await sleep(2000);
}

async function simulateCompress(quality) {
  // Simulate compression
  await sleep(1000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { execute };
