import { defineAbility } from "@casl/ability"

class User {
  constructor(data) {
    Object.assign(this, data)
  }
}

class Forklift {
  constructor(data) {
    Object.assign(this, data)
  }
}

const bob = new User({ username: 'bob@nutanix.com', yearsOfService: 7, retired: false })
const sue = new User({ username: 'sue@nutanix.com', yearsOfService: 24, retired: false })
const frank = new User({ username: 'frank@nutanix.com', yearsOfService: 32, retired: true })

const slowForklift = new Forklift({ horsepower: 10 })
const fastForklift = new Forklift({ horsepower: 800 })

describe('How you might go about building ability instances specific to a user', () => {

  /**
   * Define a function that receives an instance of a user and returns an ability
   * instance whose policies are specific to that user.
   */
  function defineAbilityFor(user) {
    return defineAbility((can, cannot) => {
      if (user.retired) {
        return
      }

      can('read', 'all')

      if (user.yearsOfService < 15) {
        can('operate', 'Forklift', { horsepower: { $lte: 25 }})
      } else {
        can('operate', 'Forklift')
      }
    })
  }

  test('Employees who are retired cannot see or operate any forklift', () => {
    const ability = defineAbilityFor(frank)

    expect(ability.cannot('read', slowForklift)).toBe(true)
    expect(ability.cannot('read', fastForklift)).toBe(true)
    expect(ability.can('operate', slowForklift)).toBe(false)
    expect(ability.can('operate', fastForklift)).toBe(false)
  })

  test('Employees who have less than 15 years of service can operate forklifts 25HP and below', () => {
    const ability = defineAbilityFor(bob)

    expect(ability.can('operate', slowForklift)).toBe(true)
    expect(ability.can('operate', fastForklift)).toBe(false)
  })


  test('Employees with more than 15 years of service can operate any forklift', () => {
    const ability = defineAbilityFor(sue)

    expect(ability.can('operate', slowForklift)).toBe(true)
    expect(ability.can('operate', fastForklift)).toBe(true)
  })

})