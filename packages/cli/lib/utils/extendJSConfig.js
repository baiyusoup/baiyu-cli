module.exports = function extendJSConfig(value, source) {
  const recast = require('recast')
  const stringifyJS = JSON.stringify

  let exportsIdentifier = null

  const ast = recast.parse(source)

  recast.types.visit(ast, {
    visitAssignmentExpression(path) {
      const { node } = path
      if (
        node.left.type === 'MemberExpression' &&
        node.left.object.name === 'module' &&
        node.left.property.name === 'exports'
      ) {
        if (node.right.type === 'ObjectExpression') {
          augmentExports(node.right)
        } else if (node.right.type === 'Identifier') {
          // do a second pass
          exportsIdentifier = node.right.name
        }
        return false
      }
      this.traverse(path)
    },
  })

  if (exportsIdentifier) {
    recast.types.visit(ast, {
      visitVariableDeclarator({ node }) {
        if (
          node.id.name === exportsIdentifier &&
          node.init.type === 'ObjectExpression'
        ) {
          augmentExports(node.init)
        }
        return false
      },
    })
  }

  function augmentExports(node) {
    const valueAST = recast.parse(`(${stringifyJS(value, null, 2)})`)
    const props = valueAST.program.body[0].expression.properties
    const existingProps = node.properties
    for (const prop of props) {
      const isUndefinedProp =
        prop.value.type === 'Identifier' && prop.value.name === 'undefined'

      const existing = existingProps.findIndex((p) => {
        return !p.computed && p.key.name === prop.key.name
      })
      if (existing > -1) {
        // replace
        existingProps[existing].value = prop.value

        // remove `undefined` props
        if (isUndefinedProp) {
          existingProps.splice(existing, 1)
        }
      } else if (!isUndefinedProp) {
        // append
        existingProps.push(prop)
      }
    }
  }

  return recast.print(ast).code
}