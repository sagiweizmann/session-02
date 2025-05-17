import { MyThreadPool } from './MyThreadPool';
const tp = new MyThreadPool(3); // 3 worker threads, say thread1, thread2, thread3
tp.execute(() => isPrime(961748941)); // --> thread1, takes a while because it's a prime number
tp.execute(() => isPrime(961748947)); // --> thread2, takes a while because it's a prime number
tp.execute(() => isPrime(6)); // --> thread3, very fast
tp.execute(() => isPrime(961751851)); // --> most likely to thread3
tp.execute(() => isPrime(7)); // --> most likely to thread1/thread2, since thread3 would be busy

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