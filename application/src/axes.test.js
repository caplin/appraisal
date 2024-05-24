import db from "./database.js"
import {expect, test} from '@jest/globals';
import {Axes} from "./axes.js";

// The tests are intended to run against a freshly initialised test database

describe('Axes', () => {
    let axes = null

    beforeAll(() => {
        axes = new Axes(db)
    })

    describe('can work with a new axis', () => {
        const newAxis = {
            name: "Speaking Up",
            category: "Soft",
            description: "Speaking up appropriately in meetings",
            referencePoints: [
                {
                    rating: 0,
                    description: "never talks in meetings"
                },
                {
                    rating: 100,
                    description: "runs meetings with inspired chairpersonship"
                }
            ],
            audience: ['quiet'],
            creator: 'adam.iley@caplin.com',
            active: "true"
        }
        let returnedAxis = null

        beforeAll(async () => {
            returnedAxis = await axes.upsert(newAxis)
        })

        test('can retrieve the new axis', async () => {
            const retrievedAxis = await axes.getById(returnedAxis.id)
            expect(retrievedAxis).toMatchObject(returnedAxis)
        })

        test('can update the axis', async() => {
            const newCategory = "Soft Skills"
            await axes.upsert({
                id: returnedAxis.id,
                category: newCategory
            })

            const retrievedAxis = await axes.getById(returnedAxis.id)
            expect(retrievedAxis).toMatchObject({
                ...returnedAxis,
                category: newCategory
            })
        })

        afterAll(async () => {
            await axes.delete([returnedAxis.id])
        })
    })

    afterAll(async () => {
        await db.end()
    })
})