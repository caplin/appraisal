import db from "./database.js"
import {expect, test} from '@jest/globals';
import {Ratings} from "./ratings.js";

// The tests are intended to run against a freshly initialised test database

describe('Ratings', () => {
    let ratings = null

    beforeAll(() => {
        ratings = new Ratings(db)
    })

    describe('can work with a new rating', () => {
        const newRating = {
            dateTime: Date.now(),
            rater: "alice.smith@example",
            ratee: "bob.jones@example.com",
            comment: "Bob is awful",
            shareWithRatee: true,
            acknowledgedByRatee: false,
            rateeComment: "this is clear nonsense",
            lmComment: "I have to agree with Alice here",
            active: true,
            ratings: [
                {
                    axis: 1,
                    score: 24
                },
                {
                    axis: 2,
                    score: 32
                }
            ]
        }
        let returnedRating = null

        beforeAll(async () => {
            returnedRating = await ratings.upsert(newRating)
        })

        test('can retrieve the new ratings', async () => {
            const retrievedRating = await ratings.getById(returnedRating.id)
            expect(retrievedRating).toMatchObject(returnedRating)
        })

        test('can update the axis', async() => {
            const newComment = "not that bad"
            await ratings.upsert({
                id: returnedRating.id,
                comment: newComment
            })

            const retrievedRating = await ratings.getById(returnedRating.id)
            expect(retrievedRating).toMatchObject({
                ...returnedRating,
                comment: newComment
            })
        })

        afterAll(async () => {
            await ratings.delete([returnedRating.id])
        })
    })

    afterAll(async () => {
        await db.end()
    })
})