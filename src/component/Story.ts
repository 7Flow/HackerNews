import * as StoryWorker from '../workers/Story.worker' // hack to make sure all the file is imported, to be build separatly
import { AbstractStoryWorker as IWorker, IMyMessageEvent, WorkerEvent } from '../workers/types.d'
import { StoryEvent } from './types.d'
import EventDispatcher from '../core/EventDispatcher'

/**
 * Simple component wrapper around a Web worker.
 */
export default class Story extends EventDispatcher {
    id: number
    worker: IWorker
    ready: boolean
    autoTerminate: boolean = true

    constructor(reusable?: boolean) {
        super()
        this.ready = true
        this.autoTerminate = !reusable

        this.worker = (StoryWorker as any)('')
        this.worker.addEventListener(WorkerEvent.MESSAGE, (response: IMyMessageEvent) => {
            this.ready = true
            // time could change from a Story to another, 'cause Worker have to wait for an available thread
            console.timeEnd(`story${this.id}`)

            switch(response.data.type) {
                case WorkerEvent.RESULT:
                    this.dispatch(StoryEvent.COMPLETE, response.data.data)
                    break
                case WorkerEvent.ERROR:
                    console.error('[Story]: worker has failed.')
                    this.dispatch(StoryEvent.ERROR, response.data)
                    break
            }
            if (this.autoTerminate) {
                this.worker.terminate()
            }
        })
    }

    load(id: number): void {
        this.id = id
        this.ready = false
        console.time(`story${this.id}`)
        this.worker.postMessage({type: WorkerEvent.REQUEST, id: this.id})
    }

    terminate(): void {
        this.worker.terminate()
    }
}