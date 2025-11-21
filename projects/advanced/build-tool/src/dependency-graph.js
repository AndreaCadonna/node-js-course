const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * DependencyGraph - Build and manage file dependency relationships
 *
 * Analyzes source files to detect dependencies and build a dependency graph.
 * Supports incremental builds by tracking which files need rebuilding.
 */
class DependencyGraph extends EventEmitter {
  constructor() {
    super();
    this.nodes = new Map(); // file -> { dependencies, dependents, metadata }
    this.entries = new Set(); // Entry point files
  }

  /**
   * Add a file node to the graph
   */
  addNode(filePath, metadata = {}) {
    if (!this.nodes.has(filePath)) {
      this.nodes.set(filePath, {
        dependencies: new Set(),
        dependents: new Set(),
        metadata: {
          lastModified: null,
          hash: null,
          ...metadata
        }
      });
    }
    return this.nodes.get(filePath);
  }

  /**
   * Add a dependency relationship: source depends on dependency
   */
  addDependency(source, dependency) {
    const sourceNode = this.addNode(source);
    const depNode = this.addNode(dependency);

    sourceNode.dependencies.add(dependency);
    depNode.dependents.add(source);

    this.emit('dependency:added', { source, dependency });
  }

  /**
   * Remove a dependency relationship
   */
  removeDependency(source, dependency) {
    const sourceNode = this.nodes.get(source);
    const depNode = this.nodes.get(dependency);

    if (sourceNode) sourceNode.dependencies.delete(dependency);
    if (depNode) depNode.dependents.delete(source);

    this.emit('dependency:removed', { source, dependency });
  }

  /**
   * Mark a file as an entry point
   */
  addEntry(filePath) {
    this.addNode(filePath);
    this.entries.add(filePath);
    this.emit('entry:added', { filePath });
  }

  /**
   * Get all dependencies of a file (direct only)
   */
  getDependencies(filePath) {
    const node = this.nodes.get(filePath);
    return node ? Array.from(node.dependencies) : [];
  }

  /**
   * Get all files that depend on this file (direct only)
   */
  getDependents(filePath) {
    const node = this.nodes.get(filePath);
    return node ? Array.from(node.dependents) : [];
  }

  /**
   * Get all dependencies recursively (transitive closure)
   */
  getAllDependencies(filePath, visited = new Set()) {
    if (visited.has(filePath)) return [];
    visited.add(filePath);

    const deps = this.getDependencies(filePath);
    const allDeps = [...deps];

    for (const dep of deps) {
      allDeps.push(...this.getAllDependencies(dep, visited));
    }

    return [...new Set(allDeps)];
  }

  /**
   * Get all dependents recursively
   */
  getAllDependents(filePath, visited = new Set()) {
    if (visited.has(filePath)) return [];
    visited.add(filePath);

    const dependents = this.getDependents(filePath);
    const allDependents = [...dependents];

    for (const dependent of dependents) {
      allDependents.push(...this.getAllDependents(dependent, visited));
    }

    return [...new Set(allDependents)];
  }

  /**
   * Detect circular dependencies
   */
  detectCycles() {
    const cycles = [];
    const visiting = new Set();
    const visited = new Set();

    const visit = (node, path = []) => {
      if (visiting.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        cycles.push([...path.slice(cycleStart), node]);
        return;
      }

      if (visited.has(node)) return;

      visiting.add(node);
      path.push(node);

      const deps = this.getDependencies(node);
      for (const dep of deps) {
        visit(dep, [...path]);
      }

      visiting.delete(node);
      visited.add(node);
    };

    for (const node of this.nodes.keys()) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    return cycles;
  }

  /**
   * Topological sort for build order
   * Returns files in the order they should be built
   */
  getBuildOrder() {
    const inDegree = new Map();
    const queue = [];
    const result = [];

    // Calculate in-degree for each node
    for (const [file, node] of this.nodes) {
      inDegree.set(file, node.dependencies.size);
      if (node.dependencies.size === 0) {
        queue.push(file);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const file = queue.shift();
      result.push(file);

      const dependents = this.getDependents(file);
      for (const dependent of dependents) {
        const degree = inDegree.get(dependent) - 1;
        inDegree.set(dependent, degree);

        if (degree === 0) {
          queue.push(dependent);
        }
      }
    }

    // Check for cycles
    if (result.length !== this.nodes.size) {
      const cycles = this.detectCycles();
      throw new Error(`Circular dependencies detected: ${JSON.stringify(cycles[0])}`);
    }

    return result;
  }

  /**
   * Get files that need rebuilding based on changes
   */
  getAffectedFiles(changedFiles) {
    const affected = new Set(changedFiles);

    for (const file of changedFiles) {
      const dependents = this.getAllDependents(file);
      dependents.forEach(dep => affected.add(dep));
    }

    return Array.from(affected);
  }

  /**
   * Update node metadata
   */
  updateMetadata(filePath, metadata) {
    const node = this.nodes.get(filePath);
    if (node) {
      node.metadata = { ...node.metadata, ...metadata };
      this.emit('metadata:updated', { filePath, metadata });
    }
  }

  /**
   * Get node metadata
   */
  getMetadata(filePath) {
    const node = this.nodes.get(filePath);
    return node ? node.metadata : null;
  }

  /**
   * Serialize graph to JSON
   */
  toJSON() {
    const nodes = {};
    for (const [file, node] of this.nodes) {
      nodes[file] = {
        dependencies: Array.from(node.dependencies),
        dependents: Array.from(node.dependents),
        metadata: node.metadata
      };
    }

    return {
      nodes,
      entries: Array.from(this.entries)
    };
  }

  /**
   * Load graph from JSON
   */
  fromJSON(data) {
    this.nodes.clear();
    this.entries.clear();

    // Restore nodes
    for (const [file, nodeData] of Object.entries(data.nodes)) {
      const node = this.addNode(file, nodeData.metadata);
      node.dependencies = new Set(nodeData.dependencies);
      node.dependents = new Set(nodeData.dependents);
    }

    // Restore entries
    data.entries.forEach(entry => this.entries.add(entry));

    this.emit('graph:loaded');
  }

  /**
   * Get graph statistics
   */
  getStats() {
    let totalDeps = 0;
    let maxDeps = 0;
    let maxDependents = 0;

    for (const node of this.nodes.values()) {
      totalDeps += node.dependencies.size;
      maxDeps = Math.max(maxDeps, node.dependencies.size);
      maxDependents = Math.max(maxDependents, node.dependents.size);
    }

    return {
      totalFiles: this.nodes.size,
      totalDependencies: totalDeps,
      entryPoints: this.entries.size,
      avgDependencies: this.nodes.size > 0 ? totalDeps / this.nodes.size : 0,
      maxDependencies: maxDeps,
      maxDependents: maxDependents
    };
  }

  /**
   * Clear the graph
   */
  clear() {
    this.nodes.clear();
    this.entries.clear();
    this.emit('graph:cleared');
  }
}

module.exports = DependencyGraph;
