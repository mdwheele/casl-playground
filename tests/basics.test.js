import { defineAbility, AbilityBuilder, createMongoAbility, subject } from "@casl/ability"

class User {
  constructor(data) {
    Object.assign(this, data)
  }
}

const sue = new User({ username: 'sue@nutanix.com', retired: false })
const frank = new User({ username: 'frank@nutanix.com', retired: true })

/**
 * @see https://casl.js.org/v6/en/guide/intro
 */
describe('Basic CASL Functionality', () => {
  let ability

  test('An ability depends on an action, subject, fields, and condition', () => {

    ability = defineAbility((can, cannot) => {
      // can(action, subject?, conditions?)

      can('read', 'all')
      cannot('delete', 'User')
      can('delete', 'User', { retired: true })
    })

  })

  test('Anybody can read anything', () => {
    expect(ability.can('read', sue)).toBe(true)
    expect(ability.can('read', frank)).toBe(true)

    /**
     * How does CASL know that `sue` and `frank` are of the `User` subject type?
     * 
     * CASL infers subject types from `.constructor.name`, which is the class name in this case.
     * So when it is passed `sue`, it looks for `sue.constructor.name`, which should be "User".
     */

    expect(sue.constructor.name).toBe('User')
  })

  test('Cannot delete users, unconditionally', () => {
    expect(ability.can('delete', sue)).toBe(false)
  })

  test('Retired users can be deleted', () => {
    expect(ability.can('delete', frank)).toBe(true)
  })

  describe('Works on the front-end or back-end', () => {
    let serialized, frontendAbility

    test('We can serialize ability instances', () => {
      expect(ability.rules).toEqual(
        [
          { action: 'read', subject: 'all' },
          { action: 'delete', subject: 'User', inverted: true },
          { action: 'delete', subject: 'User', conditions: { retired: true }},
        ]
      )

      // Imagine this is sent from the backend as JSON to the front-end...
      serialized = JSON.stringify(ability.rules)
    })

    test('We can re-hydrate an ability instance in the front-end with serialized rules', () => {
      frontendAbility = new AbilityBuilder(createMongoAbility).build()
      frontendAbility.update(JSON.parse(serialized))      

      /**
       * In practice, wrap the ability instance in a composable and hydrate it once from the backend. 
       * Then you can re-use the same instance everywhere.
       */
    })

    test('All the same tests pass', () => {
      expect(frontendAbility.can('read', sue)).toBe(true)
      expect(frontendAbility.can('read', frank)).toBe(true)
      expect(frontendAbility.can('delete', sue)).toBe(false)
      expect(frontendAbility.can('delete', frank)).toBe(true)
    })

    test('Dealing with objects, not class instances', () => {
      /**
       * When the front-end queries the backend for information about a user, 
       * we don't want to have to duplicate our models JUST to get an instance of a 
       * User class. We'll be dealing with JSON objects in the front-end.
       * 
       * However, CASL won't be able to infer the subject from a plain object...
       */

      const frankAsJSON = {
        username: 'frank@nutanix.com',
        retired: true
      }

      expect(frontendAbility.can('delete', frankAsJSON)).toBe(false)

      /**
       * We need to use the subject helper to annotate plain objects with a Subject type
       */

      expect(frontendAbility.can('delete', subject('User', frankAsJSON))).toBe(true)
    })
  })
})