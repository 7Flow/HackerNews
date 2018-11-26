export interface ISortableObject {
    count: number
}

/**
 * Fast descending sorting
 */
export default class ObjectQuickSort {
    public static sort(list: ISortableObject[], left: number, right: number, length: number) {
        let initialLeft: number = left
        let initialRight: number = right
        let direction: boolean = true
        let pivot: number = right

        while ((left - right) < 0) {
            if (direction) {
                if (list[pivot].count > list[left].count) {
                    ObjectQuickSort.swap(list, pivot, left)
                    pivot = left
                    --right
                    direction = !direction
                } else
                    ++left
            } else {
                if (list[pivot].count >= list[right].count) {
                    --right
                } else {
                    ObjectQuickSort.swap(list, pivot, right)
                    ++left
                    pivot = right
                    direction = !direction
                }
            }
        }
        if (pivot - 1 > initialLeft) {
            ObjectQuickSort.sort(list, initialLeft, --pivot, length)
        }
        if (pivot + 1 < initialRight) {
            ObjectQuickSort.sort(list, ++pivot, initialRight, length)
        }
    }

    static swap(list: ISortableObject[], index1: number, index2: number) {
        const swapedElem = list[index1]
        list[index1] = list[index2]
        list[index2] = swapedElem
    }
}
