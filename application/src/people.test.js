import {People} from "./people.js"
import db from "./database.js"
import {expect, test} from '@jest/globals';

// The tests are intended to run against a freshly initialised test database

describe('people', () => {
    let people = null

    beforeAll(() => {
        people = new People(db)
    })

    describe('can work with a new person', () => {
        const newPerson = {
            name: 'bob',
            email: "bob@caplin.com",
            team: "imaginary",
            level: 500,
            groups: ["everyone", "examplegroup"],
            manager: "bigboss@caplin.com",
            rateable: true,
            active: true
        }

        beforeAll(async () => {
            await people.upsert(newPerson)
        })

        test('can retreive the new person', async () => {
            const retrievedPerson = await people.getUserByEmail("bob@caplin.com")
            expect(retrievedPerson).toMatchObject(newPerson)
        })

        test('can update the new persons team', async () => {
            const newTeam = "real"
            await people.upsert({
                email: "bob@caplin.com",
                team: newTeam
            })
            const retrievedPerson = await people.getUserByEmail("bob@caplin.com")
            expect(retrievedPerson).toMatchObject({
                ...newPerson,
                team: newTeam
            })
        })

        afterAll(async () => {
            await people.delete([newPerson.email])
        })
    })

    describe('can get', () => {
        const newDrones = [
            { email: "drone1@caplin.com", name: "drone-1", manager: "drone-manager@caplin.com", level: 10},
            { email: "drone2@caplin.com", name: "drone-2", manager: "drone-manager@caplin.com", level: 20},
            { email: "drone3@caplin.com", name: "drone-3", manager: "drone-manager@caplin.com", level: 30},
        ]

        beforeAll(async () => {
            for (const newDrone of newDrones) {
                await people.upsert(newDrone)
            }
        })

        test('filtered by manager', async () => {
            const retrievedPeople = await people.get({manager: "drone-manager@caplin.com"})
            expect(retrievedPeople.map(x=>x.name).sort()).toEqual(['drone-1', 'drone-2', 'drone-3'])
         })

        test('with a limit', async () => {
            const limitedPeople = await people.get({manager: "drone-manager@caplin.com"},2)
            expect(limitedPeople.length).toEqual(2)
        })

        test('with a custom filter', async () => {
            const retrievedPeople = await people.get({level: "gte(15)", manager: "drone-manager@caplin.com"})
            expect(retrievedPeople.length).toEqual(2)
            expect(retrievedPeople.map(x=>x.name).sort()).toEqual(['drone-2', 'drone-3'])
        })

        test('incorrect filters are ignored', async () => {
            const retrievedPeople = await people.get({badfilter: "gte(15)", manager: "drone-manager@caplin.com"})
            expect(retrievedPeople.map(x=>x.name).sort()).toEqual(['drone-1', 'drone-2', 'drone-3'])
        })

        afterAll(async () => {
            await people.delete(newDrones.map(x=>x.email))
        })
    })

    afterAll(async () => {
        await db.end()
    })
})