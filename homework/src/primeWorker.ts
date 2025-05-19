import { parentPort } from 'worker_threads';
import { isPrime } from './utils';

if (!parentPort) {
  throw new Error('Worker must be spawned as a worker thread');
}

parentPort!.on('message', (numbers: number[]) => {
  try {
    let count = 0;
    for (const n of numbers) {
      if (isPrime(n)) count++;
    }
    parentPort!.postMessage(count);
  } catch (err: any) {
    parentPort!.postMessage({ error: err.message || err.toString() });
  }
});