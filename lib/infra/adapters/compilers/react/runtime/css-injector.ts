import generate from '@babel/generator'
import { callExpression, expressionStatement, identifier, memberExpression, stringLiteral } from '@babel/types'
import { readReactTemplate } from './template-loader'

export class CssInjector {
  build(): string {
    return readReactTemplate('css-injector.js')
  }

  buildCall(css: string, id: string): string {
    return generate(
      expressionStatement(
        callExpression(memberExpression(identifier('window'), identifier('__react_css_inject__')), [stringLiteral(css), stringLiteral(id)]),
      ),
    ).code
  }
}
