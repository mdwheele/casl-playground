import { ref } from 'vue'
import { AbilityBuilder, createMongoAbility, createAliasResolver } from '@casl/ability'

const builder = new AbilityBuilder(createMongoAbility)

const ability = ref(builder.build({
  /**
   * We create a custom `crud` alias because `manage` and `all` have changed
   * definitions several times between CASL releases. Better to have our own
   * rather than accidentally allow unintended actions.
   */
  resolveAction: createAliasResolver({
    crud: ['create', 'read', 'update', 'delete']
  })
}))

export default function useAbility() {
  return {
    ability,
    updateRules(rules) {
      ability.value.update(rules)
    }
  }
}
