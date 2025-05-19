import { Worker } from 'worker_threads';
import path from 'path';

interface Task<T, R> {
  data: T;
  resolve: (value: R) => void;
  reject: (error: any) => void;
}

export class MyThreadPool<T, R> {
  private workers: Worker[] = [];
  private idle: Worker[] = [];
  private queue: Task<T, R>[] = [];

  /**
   * @param size Number of worker threads to spawn
   * @param workerFile Path to the compiled worker script (.js)
   */
  constructor(size: number, workerFile: string) {
    const workerPath = path.resolve(workerFile);
    for (let i = 0; i < size; i++) {
      const w = new Worker(workerPath);
      w.on('message', (result: R) => this.onMessage(w, result));
      w.on('error', err => this.onError(w, err));
      this.workers.push(w);
      this.idle.push(w);
    }
  }

  private onMessage(worker: Worker, result: R) {
    const task = (worker as any)._task as Task<T, R>;
    task.resolve(result);
    delete (worker as any)._task;
    this.idle.push(worker);
    this.dequeue();
  }

  private onError(worker: Worker, err: any) {
    const task = (worker as any)._task as Task<T, R>;
    task.reject(err);
    delete (worker as any)._task;
    this.idle.push(worker);
    this.dequeue();
  }

  private dequeue() {
    if (!this.idle.length || !this.queue.length) return;
    const worker = this.idle.shift()!;
    const { data, resolve, reject } = this.queue.shift()!;
    (worker as any)._task = { resolve, reject };
    worker.postMessage(data);
  }

  /**
   * Runs a unit of work (data) in the pool, returning the worker's result.
   */
  exec(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.dequeue();
    });
  }

  /**
   * Terminates all worker threads.
   */
  async close(): Promise<void> {
    await Promise.all(this.workers.map(w => w.terminate()));
  }
}