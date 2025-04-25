const { AbilityBuilder, createMongoAbility, createAliasResolver } = require('@casl/ability')

const Actions = {
  Create: 'create',
  Read: 'read',
  Update: 'update',
  Delete: 'delete',
  Manage: 'crud',
  All: 'manage', // This means you can perform ANY action on the subject.
}

/**
 * Example: Expected Usage 
 * app.use('/api/*', authenticate, authorize)
 */
async function middleware(req, res, next) {
  try {
    /**
     * 🔥🔥🔥 Important!!!
     *
     * The order that rules are defined in @casl/ability matters!
     * Rules applied later in the policy override those defined earlier.
     *
     * https://casl.js.org/v6/en/guide/define-rules#inverted-rules-order
     */
    const builder = new AbilityBuilder(createMongoAbility)

    await defineRulesForUser(req.user.username, builder)

    const resolveAction = createAliasResolver({
      crud: ['create', 'read', 'update', 'delete']
    })

    const ability = build({ resolveAction })

    req.user.ability = ability
    req.user.can = ability.can.bind(ability),
    req.user.cannot = ability.cannot.bind(ability)

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * We alias can and cannot to allow and forbid, respectively, to distinguish these
 * functions from the can/cannot that appear by the same name on the ability instance.
 *
 * can/cannot in this context is about describing what a user is allowed or forbidden
 * from doing as a matter of policy. The can/cannot methods on an ability instance are
 * there to ask the question: "Can a user perform this ACTION on this SUBJECT?"
 *
 * See: https://casl.js.org/v6/en/cookbook/less-confusing-can-api
 */

async function defineRulesForUser(username, { can: allow, cannot: forbid }) {
  // ...
}

module.exports = {
  Actions,
  middleware
}