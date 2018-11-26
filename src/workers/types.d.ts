import {IItem} from '../typings/hackernews'

export const enum MESSAGE_TYPE {
    READY = 'ready',
    REQUEST = 'request',
    RESULT = 'result',
    ERROR = 'error',
}

export interface IStoryData {
    id: number
    title: string
    topUsers: any[]
    commentsByUser: Map<string, number>
}

interface IRequestMessage {
    type: MESSAGE_TYPE.REQUEST
    id: number
}

interface IErrorMessage {
    type: MESSAGE_TYPE.ERROR;
    error: string;
}

interface IStoryResultMessage {
    type: MESSAGE_TYPE.RESULT
    data: IStoryData
    bubbles: boolean
}

// -> simplify post-process by creating a meta-message type that is the union of all kind of message
type MyWorkerMessage =  IRequestMessage | IStoryResultMessage | IErrorMessage;

interface IMyMessageEvent extends MessageEvent {
    data: MyWorkerMessage;
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

    public postMessage(this: AbstractStoryWorker, msg: MyWorkerMessage, transferList?: ArrayBuffer[]): any
    public addEventListener(type: 'message', listener: (this: AbstractStoryWorker, ev: IMyMessageEvent) => any, useCapture?: boolean): void
    public addEventListener(type: 'error', listener: (this: AbstractStoryWorker, ev: IErrorMessage) => any, useCapture?: boolean): void
}