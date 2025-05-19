import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { MyThreadPool } from './MyThreadPool';

async function main() {
  const inputFile = 'input.txt';
  const data = await fs.readFile(inputFile, 'utf-8');
  const numbers = data.split(/\r?\n/).filter(Boolean).map(Number);

  // Initialize thread pool with the number of CPU cores [all we have]
  const cores = os.cpus().length;
  const workerScript = path.resolve(__dirname, 'primeWorker.js');
  const pool = new MyThreadPool<number[], number>(cores, workerScript);

  // Split input into chunks to keep all threads busy
  const chunkSize = Math.ceil(numbers.length / cores);
  const chunks: number[][] = [];
  for (let i = 0; i < numbers.length; i += chunkSize) {
    chunks.push(numbers.slice(i, i + chunkSize));
  }

  console.log(`Counting primes in ${numbers.length} numbers across ${cores} threads...`);

  const start = process.hrtime.bigint();
  
  const counts = await Promise.all(chunks.map(chunk => pool.exec(chunk)));
  const total = counts.reduce((sum, c) => sum + c, 0);

  const end = process.hrtime.bigint();
  const seconds = Number(end - start) / 1000000000;

  console.log(`Found ${total} primes in ${seconds}s`);

  // Close the pool safely
  await pool.close();
}

main();
