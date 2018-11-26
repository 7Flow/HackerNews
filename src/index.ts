import Config from './core/config'

import Story from './component/Story'
import axios, {AxiosResponse} from 'axios'
import {IStoryData} from "./workers/types"
import {IItem} from "./typings/hackernews";
import {ISortableObject, default as ObjectQuickSort} from "./utils/ObjectQuickSort";
import {StoryEvent} from "./component/types";

const LIMIT = 30            // limit calls for benchmarking
const WORKER_POOL_SIZE = 4  // number of concurrent Workers (tweak this number to see performance impact)
// -> instead of creating a lot of Workers that will actually spend most of the time waiting for a thread
//    create only a optimized amount of Workers (according to number of thread available on most CPU) and reuse them

/**
 * Display the list of the top 30 news stories
 * 1. collect the 30 ids on https://hacker-news.firebaseio.com/v0/topstories.json
 * 2. then load all stories in // with web workers (parsing a lots a json, iterating on Arrays could freeze the main thread)
 *    - do all computation on each thread
 * 3. collect and group comments by User to display the top 10 commenter and the count of comments on the main thread
 */
export default class App {
    completed: number = 0               // current completed story count
    storiesId: number[]                 // used to load next Story
    nextStoryIndex: number              // next index of Story to load
    workerPool: Story[]
    stories: Map<number, IStoryData>  // used to store Story results
    commentsByUser: Map<string, number> // final data

    constructor() {
        this.stories = new Map<number, IStoryData>()
        this.commentsByUser = new Map<string, number>()

        this.onComplete = this.onComplete.bind(this)
    }
    /**
     * Load the list of top stories id
     */
    loadStoriesId(): void {
        console.time('APP')
        this.workerPool = []
        axios.get(Config.baseUrl + Config.endPoints.topStory).then((response: AxiosResponse) => {
            // here we assume that the Firebase DB exists for a while, and we can't get less than 30 items
            response.data.length = LIMIT // cut down the array
            this.storiesId = response.data
            // Do not loop through, and create a bunch of Workers.. Just create a pool and reuse it
            for (let i = 0; i < WORKER_POOL_SIZE; ++i) {
                this.createStoryWorker(i, this.storiesId[i])
            }
            this.nextStoryIndex = WORKER_POOL_SIZE
        }).catch((error: any) => {
            console.warn(error)
        })
    }

    /**
     * Init the worker's pool. These workers will be reused.
     * @param {number} index
     * @param {number} id
     */
    createStoryWorker(index: number, id?: number): void {
        const _story = new Story(true)
        _story.addListener(StoryEvent.COMPLETE, this.onComplete)
        _story.addListener(StoryEvent.ERROR, this.onComplete)

        this.workerPool[index] = _story

        if (id !== null) {
            _story.load(id)
        }
    }

    /**
     * Load the next story, if there is others stories to load
     */
    loadNextStory(id: number): void {
        // find a ready Worker
        let _story
        for (let i = 0; i < WORKER_POOL_SIZE; ++i) {
            if (this.workerPool[i].ready) {
                _story = this.workerPool[i]
                break
            }
        }

        if (_story) {
            _story.load(id)
        } else {
            console.warn(`[APP]: no worker available for Story "${id}"`)
        }
    }

    /**
     * Once a story is complete, look for remaining stories to load.
     * @param {IStoryData} data
     */
    onComplete(data: IStoryData): void {
        ++this.completed

        this.stories.set(data.id, data)

        if (this.nextStoryIndex < LIMIT) {
            // wait for a frame to prevent race conditions (found no worker ready but one should have been complete)
            this.loadNextStory(this.storiesId[this.nextStoryIndex++])
        }

        if (this.completed === LIMIT) {
            for (let i = 0; i < WORKER_POOL_SIZE; ++i) {
                this.workerPool[i].terminate()
            }
            this.finalGather()
        }
    }

    /**
     * Final loop through each storie's comment list.
     * This final gathering is necessarry to compute total by user.
     *
     * If the details by story was not important, we could have collect all comments ids
     * and updated only one hash table of all users of all the stories.
     * But it will update one shared object, multi-threading is not possible.
     * I guess this will takes more time to compute.
     */
    finalGather(): void {
        console.time('finalGather')
        for (const story of this.stories.values()) {
            this.displayStory(story)
            for (const [user, count] of story.commentsByUser.entries()) {
                if (!this.commentsByUser.has(user)) {
                    this.commentsByUser.set(user, count)
                } else {
                    this.commentsByUser.set(user, this.commentsByUser.get(user) + count)
                }
            }
        }

        let _users = []
        let i = 0
        for (const [user, count] of this.commentsByUser.entries()) {
            _users[i++] = {
                name: user,
                count: count,
            } as ISortableObject
        }
        ObjectQuickSort.sort(_users, 0, i - 1, i)

        console.timeEnd('finalGather')

        this.displayResults(_users)

        console.timeEnd('APP')
    }

    //----------------------------------------------------------------------------------------------------------------//
    // DISPLAY
    //----------------------------------------------------------------------------------------------------------------//

    displayStory(story: IStoryData) {
        const _fragment = document.createDocumentFragment()
        const _div = document.createElement('div')

        let _d = _div.cloneNode(false)
        _d.textContent = `${story.id} - ${story.title}`
        _fragment.appendChild( _d )

        _fragment.appendChild( this.createUserList(story.topUsers) )

        _d = _div.cloneNode(false)
        _d.textContent = '-------------------------------------------'
        _fragment.appendChild( _d )

        const App = document.getElementById('app')
        if (App) {
            App.appendChild(_fragment)
        } else {
            console.log('[App] No container present in HTML.')
        }
    }

    displayResults(users: any[]) {
        const App = document.getElementById('app')
        if (App) {
            App.appendChild( this.createUserList(users) )
        } else {
            console.log('[App] No container present in HTML.')
        }
    }

    createUserList(users: any[]): DocumentFragment {
        const _fragment = document.createDocumentFragment()
        const _div = document.createElement('div')
        for (let i = 0; i < users.length; ++i) {
            let _d = _div.cloneNode(false)
            _d.textContent = `${users[i].name}: ${users[i].count}`
            _fragment.appendChild( _d )
        }
        return _fragment
    }
}

function init() {
    const _app = new App()
    _app.loadStoriesId()
}
init()
