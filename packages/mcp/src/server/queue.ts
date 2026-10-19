/** Runs jobs strictly one at a time, in submission order; a failing job never blocks the next. */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve()

  run<T>(job: () => Promise<T>): Promise<T> {
    const result = this.tail.then(job, job)
    this.tail = result.catch(() => undefined)
    return result
  }
}
