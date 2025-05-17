import { Worker } from 'worker_threads';

type Task<T> = {
  fn: string;
  resolve: (value: T) => void;
  reject: (error: any) => void;
};

type WorkerMessage<T> = { result: T } | { error: string };

// Extend Worker to carry the current task callbacks
interface WorkerWithTask<T> extends Worker {
  current?: Task<T>;
}

export class MyThreadPool<T> {
  private workers: WorkerWithTask<T>[] = [];
  private idleWorkers: WorkerWithTask<T>[] = [];
  private taskQueue: Task<T>[] = [];
  private workerScript: string;

  /**
   * @param threadCount Number of worker threads to spawn
   */
  constructor(threadCount: number) {
    // Inline worker script: deserialize, execute, and post back the result
    this.workerScript = `
      const { parentPort } = require('worker_threads');
      parentPort.on('message', async (taskStr) => {
        try {
          const fn = eval('(' + taskStr + ')');
          const result = await fn();
          parentPort.postMessage({ result });
        } catch (err) {
          parentPort.postMessage({ error: err?.toString() });
        }
      });
    `;

    for (let i = 0; i < threadCount; i++) {
      const worker = new Worker(this.workerScript, { eval: true }) as WorkerWithTask<T>;
      worker.on('message', (msg: WorkerMessage<T>) => this.handleMessage(worker, msg));
      worker.on('error', (err: Error) => this.handleError(worker, err));
      this.workers.push(worker);
      this.idleWorkers.push(worker);
    }
  }

  /**
   * Submit a task to the pool and get its result.
   * @param task A zero-arg function that returns T
   */
  execute(task: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ fn: task.toString(), resolve, reject });
      this.schedule();
    });
  }

  private schedule(): void {
    if (!this.idleWorkers.length || !this.taskQueue.length) return;

    const worker = this.idleWorkers.shift()!;
    const task = this.taskQueue.shift()!;
    worker.current = task;
    worker.postMessage(task.fn);
  }

  private handleMessage(worker: WorkerWithTask<T>, msg: WorkerMessage<T>): void {
    const { current } = worker;
    if (current) {
      const { resolve, reject } = current;
      delete worker.current;
      if ('error' in msg) {
        reject(new Error(msg.error));
      } else {
        resolve(msg.result);
      }
    }
    this.idleWorkers.push(worker);
    this.schedule();
  }

  private handleError(worker: WorkerWithTask<T>, err: Error): void {
    if (worker.current) {
      worker.current.reject(err);
      delete worker.current;
    }
    this.idleWorkers.push(worker);
    this.schedule();
  }

  /**
   * Gracefully terminate all worker threads.
   */
  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}