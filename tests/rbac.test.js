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

class KB {
  constructor(data) {
    Object.assign(this, data)
  }
}

const bob = new User({ username: 'bob@nutanix.com', role: 'operator', yearsOfService: 7, retired: false })
const sue = new User({ username: 'sue@nutanix.com', role: 'operator', yearsOfService: 24, retired: false })
const frank = new User({ username: 'frank@nutanix.com', role: 'plant-manager', yearsOfService: 32, retired: false })

const slowForklift = new Forklift({ horsepower: 10 })
const fastForklift = new Forklift({ horsepower: 800 })

const howToDrive = new KB({ message: 'Do it well.', audience: 'employee' })
const tradeSecrets = new KB({ message: 'Do not share!', audience: 'hr' })

describe('RBAC', () => {
  function defineAbilityFor(user) {
    return defineAbility((can, cannot) => {
      if (user.retired) {
        return
      }

      if (user.role === 'operator') {
        can('read', 'KB', { audience: 'employee' })

        if (user.yearsOfService < 15) {
          can('operate', 'Forklift', { horsepower: { $lte: 25 }})
        } else {
          can('operate', 'Forklift')
        }
      }

      if (user.role === 'plant-manager') {
        can('read', 'KB', { audience: { $in: ['employee', 'hr'] }})
      }
    })
  }

  test('Newer Operators can read employee KBs and operate slow forklifts', () => {
    const ability = defineAbilityFor(bob)

    expect(ability.can('read', howToDrive)).toBe(true)
    expect(ability.can('read', tradeSecrets)).toBe(false)

    expect(ability.can('operate', slowForklift)).toBe(true)
    expect(ability.can('operate', fastForklift)).toBe(false)
  })

  test('Experienced Operators can read employee KBs and operate all forklifts', () => {
    const ability = defineAbilityFor(sue)

    expect(ability.can('read', howToDrive)).toBe(true)
    expect(ability.can('read', tradeSecrets)).toBe(false)

    expect(ability.can('operate', slowForklift)).toBe(true)
    expect(ability.can('operate', fastForklift)).toBe(true)
  })

  test('Plant Managers can read all KBs, but cannot operate any forklifts', () => {
    const ability = defineAbilityFor(frank)

    expect(ability.can('read', howToDrive)).toBe(true)
    expect(ability.can('read', tradeSecrets)).toBe(true)

    expect(ability.can('operate', slowForklift)).toBe(false)
    expect(ability.can('operate', fastForklift)).toBe(false)
  })
})