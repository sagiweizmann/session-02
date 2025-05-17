import { MyThreadPool } from './MyThreadPool';

async function main() {
  const pool = new MyThreadPool<boolean>(3);

  const tasks = [
    pool.execute(() => isPrime(961748941)),
    pool.execute(() => isPrime(961748947)),
    pool.execute(() => isPrime(6)),
    pool.execute(() => isPrime(961751851)),
    pool.execute(() => isPrime(7)),
  ];

  const results = await Promise.all(tasks);
  console.log('Prime checks:', results);

  await pool.close();
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  const limit = Math.floor(Math.sqrt(n));
  for (let i = 2; i <= limit; i++) {
    if (n % i === 0) {
      return false;
    }
  }
  return true;
}

main();