class RequestQueue {
  private queue: Array<() => Promise<void>> = []
  private running = 0
  private readonly maxConcurrent = 2
  private readonly minDelayMs = 500
  private lastRequestAt = 0

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        const elapsed = Date.now() - this.lastRequestAt
        if (elapsed < this.minDelayMs) {
          await new Promise(r => setTimeout(r, this.minDelayMs - elapsed))
        }
        this.lastRequestAt = Date.now()
        try {
          resolve(await fn())
        } catch (err) {
          reject(err)
        }
      })
      this.drain()
    })
  }

  private async drain() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return
    this.running++
    const fn = this.queue.shift()!
    try {
      await fn()
    } finally {
      this.running--
      this.drain()
    }
  }
}

export const requestQueue = new RequestQueue()
