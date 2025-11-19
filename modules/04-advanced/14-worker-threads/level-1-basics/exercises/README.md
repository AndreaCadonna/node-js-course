# Level 1 Exercises - Worker Threads Basics

Practice your worker thread skills with these exercises.

## How to Use These Exercises

1. **Read the exercise description** carefully
2. **Attempt to solve it yourself** before looking at the solution
3. **Run your solution** to test it
4. **Compare with the provided solution** in the solutions directory
5. **Experiment** with variations

## Exercises

### Exercise 1: Hello Worker (Easy)
**File:** `exercise-1.js`
**Time:** 10-15 minutes

Create a worker that:
- Accepts a name via `workerData`
- Sends back a greeting message
- Main thread prints the greeting

**Skills:** Worker creation, workerData, basic messaging

---

### Exercise 2: Number Processor (Easy)
**File:** `exercise-2.js`
**Time:** 15-20 minutes

Create a worker that:
- Receives an array of numbers via postMessage
- Calculates: sum, average, min, max
- Sends results back to main thread

**Skills:** Message passing, data processing, objects

---

### Exercise 3: Ping Pong (Medium)
**File:** `exercise-3.js`
**Time:** 20-25 minutes

Create a ping-pong exchange:
- Main sends "ping" to worker
- Worker responds with "pong"
- Continue for 5 exchanges
- Then gracefully shutdown

**Skills:** Two-way communication, counting, graceful shutdown

---

### Exercise 4: Error Recovery (Medium)
**File:** `exercise-4.js`
**Time:** 20-30 minutes

Create a robust worker that:
- Processes tasks that might fail
- Catches and reports errors properly
- Continues processing after errors
- Handles at least 3 different error scenarios

**Skills:** Error handling, try-catch, error reporting

---

### Exercise 5: Prime Number Finder (Hard)
**File:** `exercise-5.js`
**Time:** 30-40 minutes

Create a worker that:
- Finds all prime numbers in a given range
- Reports progress every 10%
- Returns array of primes
- Compare performance vs single-threaded

**Skills:** CPU-intensive tasks, progress reporting, performance comparison

---

## Tips

- Start with exercise 1 and work your way up
- Don't peek at the solutions immediately
- Test your code thoroughly
- Try different inputs and edge cases
- Use console.log to debug

## Solutions

Solutions are available in the `solutions/` directory. Each solution includes:
- Complete working code
- Comments explaining the approach
- Alternative implementations where applicable
