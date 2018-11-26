import axios, { AxiosResponse } from 'axios'

import Config from '../core/Config'
import { AbstractStoryWorker, IStoryData, IMyMessageEvent, WorkerEvent } from './types.d'
import { IItem } from '../typings/hackernews'
import ObjectQuickSort, { ISortableObject } from '../utils/ObjectQuickSort'

const ctx: AbstractStoryWorker = self as any

/**
 * Load the Story item, and then iterate through children
 * @param {IMyMessageEvent} event
 */
ctx.onmessage = function(event: IMyMessageEvent): void {
    const msg = event.data
    ctx.completed = 0       // number of  API call currently completed
    ctx.length = 0          // total number of item to load to collect comment's datas
    switch (msg.type) {
        case WorkerEvent.REQUEST:
            ctx.id = msg.id
            const _url = (Config.baseUrl + Config.endPoints.item).replace('{id}', msg.id.toString())
            axios.get(_url).then((response: AxiosResponse) => {
                // prepare final response
                // ctx.length = response.data.descendants // watch out for deleted!
                ctx.title = response.data.title
                ctx.commentsByUser = new Map<string, number>()
                // look for children
                ctx.loadChildren(response.data)
            }).catch((error: any) => {
                console.error(error)
                ctx.postMessage({type: WorkerEvent.ERROR, error: error.toString()})
                ctx.ready = true
            })
            return
        case WorkerEvent.RESULT:
            return
    }
}

/**
 * Methods to get all comments (kids) of an item.
 * Used recursively, so we add new item to fetch to the completed target
 */
ctx.loadChildren = function(item: IItem): void {
    if (item.kids) {
        ctx.length += item.kids.length
        for (let i = 0; i < item.kids.length; ++i) {
            const _url = (Config.baseUrl + Config.endPoints.item).replace('{id}', item.kids[i].toString())
            axios.get(_url)
                .then(ctx.onResponse)
                .catch(ctx.onError)
        }
    } else {
        ctx.onComplete()
    }
}

ctx.onResponse = function(response: AxiosResponse): void {
    ++ctx.completed
    if (!response.data.deleted) {
        if (ctx.commentsByUser.has(response.data.by)) {
            ctx.commentsByUser.set(response.data.by, ctx.commentsByUser.get(response.data.by) + 1)
        } else {
            ctx.commentsByUser.set(response.data.by, 1)
        }
        ctx.loadChildren(response.data)
    } else {
        ctx.onComplete()
    }
}

ctx.onError = function(error: any): void {
    ++ctx.completed
    console.error(error)
    ctx.onComplete()
}

ctx.onComplete = function(): void {
    if (ctx.completed === ctx.length) {
        // ok, the dictionnary is usefull to check if exists, or to get a value
        // but make an array to sort
        const _users = []
        let i = 0
        for (const [user, count] of ctx.commentsByUser.entries()) {
            _users[i++] = {
                name: user,
                count: count,
            } as ISortableObject
        }
        ObjectQuickSort.sort(_users, 0, i - 1, i)
        if (i > 10) _users.length = 10

        const _data = {
            id: ctx.id,
            title: ctx.title,
            topUsers: _users,
            commentsByUser: ctx.commentsByUser,
        } as IStoryData

        ctx.postMessage({type: WorkerEvent.RESULT, data: _data, bubbles: false})
        ctx.ready = true
    }
}
// just to satisfy Typescript 2.8.9 ^^
export default null as any
