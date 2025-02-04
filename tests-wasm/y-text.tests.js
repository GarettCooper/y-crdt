import { exchangeUpdates } from './testHelper.js' // eslint-disable-line

import * as Y from 'ywasm'
import * as t from 'lib0/testing'

/**
 * @param {t.TestCase} tc
 */
export const testInserts = tc => {
    const d1 = new Y.YDoc()
    var x = d1.getText('test')

    d1.transact(txn => x.push(txn, "hello!"))
    d1.transact(txn => x.insert(txn, 5, " world"))

    const expected = "hello world!"

    var value = d1.transact(txn => x.toString(txn))
    t.compareStrings(value, expected)

    const d2 = new Y.YDoc(2)
    x = d2.getText('test')

    exchangeUpdates([d1, d2])

    value = d2.transact(txn => x.toString(txn))
    t.compareStrings(value, expected)
}

/**
 * @param {t.TestCase} tc
 */
export const testDeletes = tc => {
    const d1 = new Y.YDoc()
    var x = d1.getText('test')

    d1.transact(txn => x.push(txn, "hello world!"))
    t.compare(x.length, 12)
    d1.transact(txn => x.delete(txn, 5, 6))
    t.compare(x.length, 6)
    d1.transact(txn => x.insert(txn, 5, " Yrs"))
    t.compare(x.length, 10)

    const expected = "hello Yrs!"

    var value = d1.transact(txn => x.toString(txn))
    t.compareStrings(value, expected)

    const d2 = new Y.YDoc(2)
    x = d2.getText('test')

    exchangeUpdates([d1, d2])

    value = d2.transact(txn => x.toString(txn))
    t.compareStrings(value, expected)
}

/**
 * @param {t.TestCase} tc
 */
export const testObserver = tc => {
    const d1 = new Y.YDoc()
    /**
     * @param {Y.YText} tc
     */
    const getValue = (x) => d1.transact(txn => x.toString(txn))
    const x = d1.getText('test')
    let target = null
    let delta = null
    let observer = x.observe(e => {
        target = e.target
        delta = e.delta
    })

    // insert initial data to an empty YText
    d1.transact(txn => x.insert(txn, 0, 'abcd'))
    t.compare(getValue(target), getValue(x))
    t.compare(delta, [{ insert: 'abcd' }])
    target = null
    delta = null

    // remove 2 chars from the middle
    d1.transact(txn => x.delete(txn, 1, 2))
    t.compare(getValue(target), getValue(x))
    t.compare(delta, [{ retain: 1 }, { delete: 2 }])
    target = null
    delta = null

    // insert new item in the middle
    d1.transact(txn => x.insert(txn, 1, 'e', { bold: true }))
    t.compare(getValue(target), getValue(x))
    t.compare(delta, [{ retain: 1 }, { insert: 'e', attributes: { bold: true } }])
    target = null
    delta = null

    // remove formatting
    d1.transact(txn => x.format(txn, 1, 1, { bold: null }))
    t.compare(getValue(target), getValue(x))
    t.compare(delta, [{ retain: 1 }, { retain: 1, attributes: { bold: null } }])
    target = null
    delta = null

    // free the observer and make sure that callback is no longer called
    observer.free()
    d1.transact(txn => x.insert(txn, 1, 'fgh'))
    t.compare(target, null)
    t.compare(delta, null)
}

/**
 * @param {t.TestCase} tc
 */
export const testToDeltaEmbedAttributes = tc => {
    const d1 = new Y.YDoc()
    const text = d1.getText('test')

    let delta = null
    let observer = text.observe(e => {
        delta = e.delta
    })

    d1.transact(txn => {
        text.insert(txn, 0, 'ab', { bold: true })
        text.insertEmbed(txn, 1, { image: 'imageSrc.png' }, { width: 100 })
    })
    console.log(delta)
    t.compare(delta, [
        { insert: 'a', attributes: { bold: true } },
        { insert: { image: 'imageSrc.png' }, attributes: { width: 100 } },
        { insert: 'b', attributes: { bold: true } }
    ])
    observer.free()
}