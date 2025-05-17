import fs from 'fs';
import readline from 'readline';
import os from 'os';
import path from 'path';
import { MyThreadPool } from './MyThreadPool';


async function main() {
  const inputFile = 'input.txt';
  try {
    console.log(`Reading numbers from "${inputFile}"…`);
    const numbers = await readNumbers(inputFile);

    const cores = os.cpus().length;
    console.log(`Dispatching ${numbers.length} numbers across ${cores} threads…`);

    // point to the compiled worker script in dist/
    const workerScript = path.resolve(__dirname, 'primeWorker.js');
    const pool = new MyThreadPool<number[], number>(cores, workerScript);

    // split into roughly equal chunks
    const chunkSize = Math.ceil(numbers.length / cores);
    const chunks: number[][] = [];
    for (let i = 0; i < numbers.length; i += chunkSize) {
      chunks.push(numbers.slice(i, i + chunkSize));
    }

    const start = process.hrtime.bigint();
    // each chunk returns a count of primes
    const counts = await Promise.all(chunks.map(chunk => pool.exec(chunk)));
    const totalPrimes = counts.reduce((sum, c) => sum + c, 0);
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;

    console.log(`Found ${totalPrimes} primes in ${durationSec.toFixed(3)}s`);

    await pool.close();
  } catch (err: any) {
    console.error(`Error: ${err.message || err}`);
    process.exit(1);
  }
}

async function readNumbers(filePath: string): Promise<number[]> {
  const numbers: number[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) {
      const num = Number(trimmed);
      if (!Number.isNaN(num)) {
        numbers.push(num);
      }
    }
  }

  return numbers;
}

main();
