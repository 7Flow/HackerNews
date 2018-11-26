import { IItem } from '../typings/hackernews'
import { AxiosResponse } from 'axios'

export const enum WorkerEvent {
    READY = 'ready',
    REQUEST = 'request',
    RESULT = 'result',
    ERROR = 'error',
    MESSAGE = 'message',
}

export interface IStoryData {
    id: number
    title: string
    topUsers: any[]
    commentsByUser: Map<string, number>
}

interface IRequestMessage {
    type: WorkerEvent.REQUEST
    id: number
}

interface IErrorMessage {
    type: WorkerEvent.ERROR
    error: string;
}

interface IStoryResultMessage {
    type: WorkerEvent.RESULT
    data: IStoryData
    bubbles: boolean
}

// -> simplify post-process by creating a meta-message type that is the union of all kind of message
type WorkerMessage = IRequestMessage | IStoryResultMessage | IErrorMessage

interface IMyMessageEvent extends MessageEvent {
    data: WorkerMessage;
}

export class AbstractStoryWorker extends Worker {
    completed: number
    length: number
    length2: number
    data: IStoryData
    ready: boolean
    title: string
    id: number
    commentsByUser: Map<string, number>

    public onmessage: (this: AbstractStoryWorker, ev: IMyMessageEvent) => any
    public onComplete: () => void
    public loadChildren: (item: IItem) => void
    public onResponse: (response: AxiosResponse) => void
    public onError: (error: any) => void

    public postMessage(this: AbstractStoryWorker, msg: WorkerMessage, transferList?: ArrayBuffer[]): any
    public addEventListener(type: WorkerEvent.MESSAGE, listener: (this: AbstractStoryWorker, ev: IMyMessageEvent) => any, useCapture?: boolean): void
    public addEventListener(type: WorkerEvent.ERROR, listener: (this: AbstractStoryWorker, ev: IErrorMessage) => any, useCapture?: boolean): void
}