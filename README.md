# Hacker News Tests

## Problem
The main problem is the number of request we have to make to fetch all data.
Browsers can make several call in parallel (but have a limit per domain), but all the javascript events and processes will occurs on the main thread.
The time needed to make http request is a constraint, the only thing we can optimize is the data processing.

## Optimization
### Multi threading and object pooling
So create a pool of Web workers, that will make all request (and json parsing, user sorting) needed by a Story.
Once a story is completed, reuse the worker to load another story.

### Data structure and algorithm
Use hashtable to store data to better collect and count comments by user.
Then make an array before sorting user by comments count. And better don't use the native sorting function.
In fact using quick sort is a gain only for large arrays.
