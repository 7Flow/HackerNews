export enum ItemType {
    STORY = 'story',
    COMMENT = 'comment',
}

export interface IItem {
    deleted?: boolean
    by: string
    descendants: number,
    id: number
    score: number
    time: number
    title: string
    type: ItemType
    url: string
    kids?: number[]
    parent?: number
}
