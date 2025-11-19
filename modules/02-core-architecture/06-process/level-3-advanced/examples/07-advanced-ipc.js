/**
 * Advanced Inter-Process Communication (IPC)
 *
 * This module demonstrates enterprise-grade IPC using:
 * - High-performance message protocols
 * - Binary data streaming
 * - Message queuing and buffering
 * - Request-response patterns
 * - Pub/sub messaging
 * - Protocol buffers simulation
 *
 * Production Features:
 * - Low-latency communication
 * - Backpressure handling
 * - Message acknowledgment
 * - Error recovery
 * - Connection pooling
 * - Performance metrics
 *
 * @module AdvancedIPC
 */

const cluster = require('cluster');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');
const crypto = require('crypto');

/**
 * IPC Configuration
 */
const DEFAULT_IPC_CONFIG = {
  // Performance
  enableBinaryProtocol: true,
  enableCompression: false,
  maxMessageSize: 10 * 1024 * 1024, // 10MB

  // Reliability
  enableAcknowledgment: true,
  ackTimeout: 5000,
  maxRetries: 3,
  retryDelay: 1000,

  // Flow control
  enableBackpressure: true,
  highWaterMark: 100,
  lowWaterMark: 25,

  // Buffering
  enableBuffering: true,
  maxBufferSize: 1000,

  // Metrics
  enableMetrics: true,
  metricsInterval: 5000,
};

/**
 * Message Types
 */
const MessageType = {
  REQUEST: 0x01,
  RESPONSE: 0x02,
  NOTIFICATION: 0x03,
  ACK: 0x04,
  ERROR: 0x05,
  STREAM_START: 0x06,
  STREAM_DATA: 0x07,
  STREAM_END: 0x08,
  PUBSUB: 0x09,
};

/**
 * Message Priority
 */
const MessagePriority = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
};

/**
 * IPC Message
 */
class IPCMessage {
  constructor(type, data, options = {}) {
    this.id = options.id || this.generateId();
    this.type = type;
    this.timestamp = Date.now();
    this.priority = options.priority || MessagePriority.NORMAL;
    this.correlationId = options.correlationId || null;
    this.data = data;
    this.requiresAck = options.requiresAck !== false;
  }

  generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  serialize() {
    return JSON.stringify({
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      priority: this.priority,
      correlationId: this.correlationId,
      requiresAck: this.requiresAck,
      data: this.data,
    });
  }

  static deserialize(json) {
    const parsed = JSON.parse(json);
    return new IPCMessage(parsed.type, parsed.data, {
      id: parsed.id,
      priority: parsed.priority,
      correlationId: parsed.correlationId,
      requiresAck: parsed.requiresAck,
    });
  }

  toBuffer() {
    const json = this.serialize();
    return Buffer.from(json, 'utf8');
  }

  static fromBuffer(buffer) {
    const json = buffer.toString('utf8');
    return IPCMessage.deserialize(json);
  }
}

/**
 * Message Queue with priority
 */
class PriorityMessageQueue {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.queues = {
      [MessagePriority.CRITICAL]: [],
      [MessagePriority.HIGH]: [],
      [MessagePriority.NORMAL]: [],
      [MessagePriority.LOW]: [],
    };
  }

  enqueue(message) {
    const queue = this.queues[message.priority];

    if (this.size() >= this.maxSize) {
      throw new Error('Queue full');
    }

    queue.push(message);
  }

  dequeue() {
    // Dequeue from highest priority first
    for (const priority of [
      MessagePriority.CRITICAL,
      MessagePriority.HIGH,
      MessagePriority.NORMAL,
      MessagePriority.LOW,
    ]) {
      const queue = this.queues[priority];
      if (queue.length > 0) {
        return queue.shift();
      }
    }
    return null;
  }

  size() {
    return Object.values(this.queues).reduce((sum, q) => sum + q.length, 0);
  }

  isEmpty() {
    return this.size() === 0;
  }

  clear() {
    for (const priority in this.queues) {
      this.queues[priority] = [];
    }
  }
}

/**
 * Request Tracker
 */
class RequestTracker {
  constructor() {
    this.pending = new Map();
  }

  track(requestId, resolve, reject, timeout) {
    const timer = setTimeout(() => {
      this.timeout(requestId);
    }, timeout);

    this.pending.set(requestId, {
      resolve,
      reject,
      timer,
      timestamp: Date.now(),
    });
  }

  resolve(requestId, data) {
    const request = this.pending.get(requestId);
    if (request) {
      clearTimeout(request.timer);
      request.resolve(data);
      this.pending.delete(requestId);
    }
  }

  reject(requestId, error) {
    const request = this.pending.get(requestId);
    if (request) {
      clearTimeout(request.timer);
      request.reject(error);
      this.pending.delete(requestId);
    }
  }

  timeout(requestId) {
    const request = this.pending.get(requestId);
    if (request) {
      request.reject(new Error('Request timeout'));
      this.pending.delete(requestId);
    }
  }

  getPendingCount() {
    return this.pending.size;
  }
}

/**
 * Pub/Sub Manager
 */
class PubSubManager {
  constructor() {
    this.subscriptions = new Map();
  }

  subscribe(topic, handler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }

    this.subscriptions.get(topic).add(handler);

    return () => this.unsubscribe(topic, handler);
  }

  unsubscribe(topic, handler) {
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(topic);
      }
    }
  }

  publish(topic, data) {
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in pub/sub handler for ${topic}:`, error);
        }
      });
    }
  }

  getTopics() {
    return Array.from(this.subscriptions.keys());
  }

  getSubscriberCount(topic) {
    return this.subscriptions.get(topic)?.size || 0;
  }
}

/**
 * Stream Manager
 */
class StreamManager extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map();
  }

  createStream(streamId) {
    const stream = {
      id: streamId,
      chunks: [],
      startTime: Date.now(),
      bytesReceived: 0,
    };

    this.streams.set(streamId, stream);
    return stream;
  }

  addChunk(streamId, chunk) {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.chunks.push(chunk);
      stream.bytesReceived += chunk.length;
      this.emit('chunk', streamId, chunk);
    }
  }

  endStream(streamId) {
    const stream = this.streams.get(streamId);
    if (stream) {
      const duration = Date.now() - stream.startTime;
      this.emit('end', streamId, {
        chunks: stream.chunks.length,
        bytes: stream.bytesReceived,
        duration,
      });

      this.streams.delete(streamId);
      return stream;
    }
  }

  getStream(streamId) {
    return this.streams.get(streamId);
  }
}

/**
 * Advanced IPC Channel
 */
class IPCChannel extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_IPC_CONFIG, ...config };

    this.messageQueue = new PriorityMessageQueue(this.config.maxBufferSize);
    this.requestTracker = new RequestTracker();
    this.pubsub = new PubSubManager();
    this.streamManager = new StreamManager();

    this.isConnected = false;
    this.isPaused = false;

    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      errors: 0,
      requestLatencies: [],
    };

    this.handlers = new Map();
  }

  /**
   * Connect to worker or parent
   */
  connect(worker = null) {
    this.worker = worker;
    this.isConnected = true;

    // Setup message handler
    if (cluster.isMaster && worker) {
      worker.on('message', (msg) => this.handleIncomingMessage(msg));
    } else if (cluster.isWorker) {
      process.on('message', (msg) => this.handleIncomingMessage(msg));
    }

    this.emit('connected');
  }

  /**
   * Handle incoming message
   */
  handleIncomingMessage(rawMsg) {
    try {
      const msg = typeof rawMsg === 'string'
        ? IPCMessage.deserialize(rawMsg)
        : rawMsg;

      this.metrics.messagesReceived++;

      // Handle ACK
      if (msg.type === MessageType.ACK) {
        this.requestTracker.resolve(msg.correlationId, null);
        return;
      }

      // Handle response
      if (msg.type === MessageType.RESPONSE) {
        this.requestTracker.resolve(msg.correlationId, msg.data);
        return;
      }

      // Handle error
      if (msg.type === MessageType.ERROR) {
        this.requestTracker.reject(msg.correlationId, new Error(msg.data));
        return;
      }

      // Handle pub/sub
      if (msg.type === MessageType.PUBSUB) {
        this.pubsub.publish(msg.data.topic, msg.data.payload);
        return;
      }

      // Handle stream messages
      if (msg.type === MessageType.STREAM_START) {
        this.streamManager.createStream(msg.id);
        return;
      }

      if (msg.type === MessageType.STREAM_DATA) {
        this.streamManager.addChunk(msg.correlationId, msg.data);
        return;
      }

      if (msg.type === MessageType.STREAM_END) {
        this.streamManager.endStream(msg.correlationId);
        return;
      }

      // Handle request
      if (msg.type === MessageType.REQUEST) {
        this.handleRequest(msg);
        return;
      }

      // Handle notification
      if (msg.type === MessageType.NOTIFICATION) {
        this.emit('notification', msg.data);
        return;
      }

      // Send ACK if required
      if (this.config.enableAcknowledgment && msg.requiresAck) {
        this.sendAck(msg.id);
      }

      this.emit('message', msg);
    } catch (error) {
      console.error('Error handling message:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Handle request message
   */
  async handleRequest(msg) {
    const handler = this.handlers.get(msg.data.method);

    if (!handler) {
      this.sendError(msg.id, `No handler for method: ${msg.data.method}`);
      return;
    }

    try {
      const result = await handler(msg.data.params);
      this.sendResponse(msg.id, result);
    } catch (error) {
      this.sendError(msg.id, error.message);
    }
  }

  /**
   * Send message
   */
  send(msg) {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    // Check backpressure
    if (this.config.enableBackpressure) {
      if (this.messageQueue.size() >= this.config.highWaterMark) {
        this.isPaused = true;
        this.emit('backpressure', true);
      }
    }

    // Queue or send immediately
    if (this.isPaused && this.config.enableBuffering) {
      this.messageQueue.enqueue(msg);
    } else {
      this.sendImmediate(msg);
    }

    // Resume if queue drains
    if (this.messageQueue.size() <= this.config.lowWaterMark) {
      this.isPaused = false;
      this.emit('backpressure', false);
      this.drainQueue();
    }
  }

  /**
   * Send message immediately
   */
  sendImmediate(msg) {
    const serialized = msg.serialize();

    if (cluster.isMaster && this.worker) {
      this.worker.send(serialized);
    } else if (cluster.isWorker) {
      process.send(serialized);
    }

    this.metrics.messagesSent++;
    this.metrics.bytesTransferred += serialized.length;
  }

  /**
   * Drain message queue
   */
  drainQueue() {
    while (!this.isPaused && !this.messageQueue.isEmpty()) {
      const msg = this.messageQueue.dequeue();
      this.sendImmediate(msg);
    }
  }

  /**
   * Send acknowledgment
   */
  sendAck(messageId) {
    const ackMsg = new IPCMessage(MessageType.ACK, null, {
      correlationId: messageId,
      requiresAck: false,
    });
    this.send(ackMsg);
  }

  /**
   * Send response
   */
  sendResponse(requestId, data) {
    const responseMsg = new IPCMessage(MessageType.RESPONSE, data, {
      correlationId: requestId,
      requiresAck: false,
    });
    this.send(responseMsg);
  }

  /**
   * Send error
   */
  sendError(requestId, error) {
    const errorMsg = new IPCMessage(MessageType.ERROR, error, {
      correlationId: requestId,
      requiresAck: false,
    });
    this.send(errorMsg);
  }

  /**
   * Request-response pattern
   */
  async request(method, params, options = {}) {
    const { timeout = this.config.ackTimeout, priority = MessagePriority.NORMAL } = options;

    const requestMsg = new IPCMessage(MessageType.REQUEST, { method, params }, {
      priority,
      requiresAck: false,
    });

    const start = performance.now();

    return new Promise((resolve, reject) => {
      this.requestTracker.track(requestMsg.id, resolve, reject, timeout);
      this.send(requestMsg);
    }).then(result => {
      const latency = performance.now() - start;
      this.metrics.requestLatencies.push(latency);

      // Keep only last 1000 latencies
      if (this.metrics.requestLatencies.length > 1000) {
        this.metrics.requestLatencies.shift();
      }

      return result;
    });
  }

  /**
   * Register request handler
   */
  handle(method, handler) {
    this.handlers.set(method, handler);
  }

  /**
   * Send notification (fire and forget)
   */
  notify(data, options = {}) {
    const notificationMsg = new IPCMessage(MessageType.NOTIFICATION, data, {
      priority: options.priority || MessagePriority.NORMAL,
      requiresAck: false,
    });

    this.send(notificationMsg);
  }

  /**
   * Publish to topic
   */
  publish(topic, payload) {
    const pubsubMsg = new IPCMessage(MessageType.PUBSUB, { topic, payload }, {
      requiresAck: false,
    });

    this.send(pubsubMsg);
  }

  /**
   * Subscribe to topic
   */
  subscribe(topic, handler) {
    return this.pubsub.subscribe(topic, handler);
  }

  /**
   * Stream data
   */
  async streamData(data, chunkSize = 64 * 1024) {
    const streamId = crypto.randomBytes(8).toString('hex');

    // Send stream start
    const startMsg = new IPCMessage(MessageType.STREAM_START, null, {
      id: streamId,
      requiresAck: false,
    });
    this.send(startMsg);

    // Send chunks
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const chunks = Math.ceil(buffer.length / chunkSize);

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, buffer.length);
      const chunk = buffer.slice(start, end);

      const chunkMsg = new IPCMessage(MessageType.STREAM_DATA, chunk, {
        correlationId: streamId,
        requiresAck: false,
      });

      this.send(chunkMsg);

      // Small delay to avoid overwhelming
      await new Promise(resolve => setImmediate(resolve));
    }

    // Send stream end
    const endMsg = new IPCMessage(MessageType.STREAM_END, null, {
      correlationId: streamId,
      requiresAck: false,
    });
    this.send(endMsg);

    return streamId;
  }

  /**
   * Receive stream
   */
  receiveStream(streamId) {
    return new Promise((resolve) => {
      this.streamManager.once('end', (id, stats) => {
        if (id === streamId) {
          const stream = this.streamManager.getStream(id);
          resolve({
            chunks: stream?.chunks || [],
            stats,
          });
        }
      });
    });
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const latencies = this.metrics.requestLatencies;

    return {
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      bytesTransferred: this.metrics.bytesTransferred,
      errors: this.metrics.errors,
      queueSize: this.messageQueue.size(),
      pendingRequests: this.requestTracker.getPendingCount(),
      latency: latencies.length > 0 ? {
        avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        min: Math.min(...latencies),
        max: Math.max(...latencies),
        count: latencies.length,
      } : null,
    };
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.isConnected = false;
    this.messageQueue.clear();
    this.emit('disconnected');
  }
}

/**
 * Demo: Advanced IPC
 */
async function demonstrateAdvancedIPC() {
  if (cluster.isWorker) {
    // Worker process
    const channel = new IPCChannel();
    channel.connect();

    console.log(`Worker ${cluster.worker.id} started`);

    // Register request handlers
    channel.handle('echo', async (params) => {
      return { echo: params };
    });

    channel.handle('compute', async (params) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { result: params.a + params.b };
    });

    channel.handle('heavy', async (params) => {
      // Simulate heavy computation
      await new Promise(resolve => setTimeout(resolve, 500));
      return { computed: params.value * 2 };
    });

    // Subscribe to topics
    channel.subscribe('broadcast', (data) => {
      console.log(`Worker ${cluster.worker.id} received broadcast:`, data);
    });

    // Periodic metrics report
    setInterval(() => {
      const metrics = channel.getMetrics();
      console.log(`Worker ${cluster.worker.id} metrics:`, metrics);
    }, 10000);

    return;
  }

  // Master process
  console.log('='.repeat(80));
  console.log('ADVANCED IPC DEMO');
  console.log('='.repeat(80));
  console.log();

  // Fork workers
  const workers = [];
  const channels = [];

  for (let i = 0; i < 2; i++) {
    const worker = cluster.fork();
    workers.push(worker);

    const channel = new IPCChannel();
    channel.connect(worker);
    channels.push(channel);
  }

  // Wait for workers to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Demo 1: Request-Response
  console.log('='.repeat(80));
  console.log('1. REQUEST-RESPONSE PATTERN');
  console.log('='.repeat(80));
  console.log();

  const channel = channels[0];

  const echoResult = await channel.request('echo', { message: 'Hello IPC' });
  console.log('Echo result:', echoResult);

  const computeResult = await channel.request('compute', { a: 5, b: 3 });
  console.log('Compute result:', computeResult);

  // Demo 2: High-throughput requests
  console.log('\n' + '='.repeat(80));
  console.log('2. HIGH-THROUGHPUT REQUESTS');
  console.log('='.repeat(80));
  console.log();

  const start = performance.now();
  const promises = [];

  for (let i = 0; i < 100; i++) {
    const targetChannel = channels[i % channels.length];
    promises.push(
      targetChannel.request('compute', { a: i, b: i * 2 })
    );
  }

  await Promise.all(promises);
  const duration = performance.now() - start;

  console.log(`Completed 100 requests in ${duration.toFixed(2)}ms`);
  console.log(`Throughput: ${(100 / duration * 1000).toFixed(0)} req/s`);

  // Demo 3: Pub/Sub
  console.log('\n' + '='.repeat(80));
  console.log('3. PUB/SUB MESSAGING');
  console.log('='.repeat(80));
  console.log();

  console.log('Broadcasting to all workers...');
  channels.forEach(ch => {
    ch.publish('broadcast', { message: 'Hello from master', timestamp: Date.now() });
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Demo 4: Streaming
  console.log('\n' + '='.repeat(80));
  console.log('4. DATA STREAMING');
  console.log('='.repeat(80));
  console.log();

  const largeData = Buffer.alloc(1024 * 1024); // 1MB
  largeData.fill('A');

  console.log('Streaming 1MB of data...');
  const streamStart = performance.now();
  const streamId = await channel.streamData(largeData, 64 * 1024);
  const streamDuration = performance.now() - streamStart;

  console.log(`Streamed in ${streamDuration.toFixed(2)}ms`);
  console.log(`Throughput: ${(1 / streamDuration * 1000).toFixed(2)} MB/s`);

  // Show metrics
  console.log('\n' + '='.repeat(80));
  console.log('FINAL METRICS');
  console.log('='.repeat(80));
  console.log();

  channels.forEach((ch, i) => {
    const metrics = ch.getMetrics();
    console.log(`\nChannel ${i + 1}:`);
    console.log(`  Messages Sent: ${metrics.messagesSent}`);
    console.log(`  Messages Received: ${metrics.messagesReceived}`);
    console.log(`  Bytes Transferred: ${(metrics.bytesTransferred / 1024).toFixed(2)} KB`);
    console.log(`  Errors: ${metrics.errors}`);
    if (metrics.latency) {
      console.log(`  Avg Latency: ${metrics.latency.avg.toFixed(2)}ms`);
      console.log(`  Min Latency: ${metrics.latency.min.toFixed(2)}ms`);
      console.log(`  Max Latency: ${metrics.latency.max.toFixed(2)}ms`);
    }
  });

  console.log('\n✅ Demo complete!');
  console.log('\n💡 Production IPC Best Practices:');
  console.log('  1. Use binary protocols for performance (MessagePack, Protocol Buffers)');
  console.log('  2. Implement backpressure to prevent memory issues');
  console.log('  3. Use request acknowledgment for reliability');
  console.log('  4. Implement message prioritization for critical operations');
  console.log('  5. Monitor IPC performance and latency');
  console.log('  6. Use connection pooling for multiple workers');
  console.log('  7. Implement circuit breakers for failing workers');
  console.log('  8. Use streaming for large data transfers');
  console.log('  9. Implement message versioning for backward compatibility');
  console.log('  10. Use pub/sub for event broadcasting');

  // Cleanup
  setTimeout(() => {
    workers.forEach(w => w.kill());
    process.exit(0);
  }, 2000);
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateAdvancedIPC().catch(console.error);
}

module.exports = {
  IPCChannel,
  IPCMessage,
  PriorityMessageQueue,
  RequestTracker,
  PubSubManager,
  StreamManager,
  MessageType,
  MessagePriority,
};
