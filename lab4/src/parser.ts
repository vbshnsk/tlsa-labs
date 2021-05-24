import {Match} from './lexicalAnalyzer';

export type Token = Match & {
  children?: Array<Token>
}

type Rule = (t: Token, max: Number) => Rule | boolean;

export default class Parser {

  private _induct = (rules: Array<Array<boolean>>, checkFor: number, min: number) =>
    rules
      .map(rule => {
        if (rule.length < min) {
          return false;
        }
        return rule.slice(0, checkFor).reduce((part, acc) => part && acc);
      })
      .reduce((rule, acc) => rule || acc);

  _rules = {
    assign: (v: Array<Token>, n?: number) => v.length <= 4 && this._induct([
      [
        v[0]?.class === 'keyword' && v[0]?.name === 'type',
        v[1]?.class === 'identifier',
        v[2]?.class === 'operation' && v[2]?.name === 'assign',
        v[3]?.class === 'expression'
      ],
      [
        v[0]?.class === 'identifier',
        v[1]?.class === 'operation' && v[1]?.name === 'assign',
        v[2]?.class === 'expression'
      ]
    ], n || 4, v.length),

    while: (v: Array<Token>, n?: number) => v.length <= 5 && this._induct([
      [
        v[0]?.class === 'keyword' && v[0]?.name === 'while',
        v[1]?.class === 'boolExpression',
        v[2]?.class === 'keyword' && v[2]?.name === 'do',
        v[3]?.class === 'statement',
        v[4]?.class === 'keyword' && v[4]?.name === 'end'
      ]
    ], n || 5, v.length),

    expression: (v: Array<Token>, n?: number) => v.length <= 1 && this._induct([
      [v[0]?.class === 'boolExpression'],
      [v[0]?.class === 'mathExpression']
    ], n || 1, v.length),

    statement: (v: Array<Token>, n?: number) => v.length <= 1 && this._induct([
      [v[0]?.class === 'expression'],
      [v[0]?.class === 'while'],
      [v[0]?.class === 'assign']
    ], n || 1, v.length),

    relop: (v: Array<Token>, n?: number) => v.length <= 1 && this._induct([
      [v[0]?.class === 'operation' &&
      v[0]?.name === 'relop']
    ], n || 1, v.length),

    program: (v: Array<Token>, n?: number) => v.length <= 2 && this._induct([
      [v[0]?.class === 'statement'],
      [v[0]?.class === 'program', v[1]?.class === 'statement'],
    ], n || 2, v.length),

    boolExpression: (v: Array<Token>, n?: number) => v.length <= 3 && this._induct([
      [v[0]?.class === 'mathExpression',
      v[1]?.class === 'operation' && v[1]?.name === 'relop',
      v[2]?.class === 'mathExpression']
    ], n || 3, v.length),

    mathExpression: (v: Array<Token>, n?: number) => v.length <= 3 && this._induct([
      [v[0]?.class === 'mathExpression',
      v[1]?.class === 'operation' && v[1]?.name === 'math' && (v[1]?.value === 'ADD' || v[1]?.value === 'SUB'),
      v[2]?.class === 'mathExpression'],
      [v[0]?.class === 'factor']
    ], n || 3, v.length),

    factor: (v: Array<Token>, n?: number) => v.length <= 3 &&  this._induct([
      [v[0]?.class === 'factor',
        v[1]?.class === 'operation' && v[1]?.name === 'math' && v[1]?.value === 'MUL',
        v[2]?.class === 'factor'],
      [v[0]?.class === 'identifier'],
      [v[0]?.class === 'literal']
    ], n || 3, v.length),
  };

  anyRule(tokens: Array<Token>, n?: Number): string {
    for (const rule in this._rules) {
      if (this._rules.hasOwnProperty(rule)) {
        if (this._rules[rule](tokens, n)) {
          return rule;
        }
      }
    }
  }

  parse(tokens: Array<Token>) {
    const stack = [tokens.shift()];
    let t;

    while (t = tokens.shift()) {
      this.apply(stack, t);
    }

    while (stack.length > 1) {
      let from;
      for (let i = 0; i < stack.length; i++) {
        const slice = stack.slice(stack.length - (i + 1));
        if (this.anyRule(slice)) {
          from = (i + 1);
        }
      }
      if (from) {
        this.doReduction(stack, stack.length - from);
      }
    }

    while (this.anyRule(stack)) {
      this.doReduction(stack, 0);
    }

    return stack.pop();
  }

  apply(stack: Array<Token>, t: Token) {
    while (true) {
      let pattern = [t];
      let reduction: number = -1;
      for (let i = 0; i < stack.length; i++) {
        pattern = [stack[stack.length - i - 1], ...pattern]

        if (stack.length === 1 && stack[0].class === 'program') {
          stack.push(t);
          return;
        }

        if (this.anyRule(pattern, pattern.length)) {
          stack.push(t);
          return;
        }

        if (this.anyRule(pattern.slice(0, i + 1), pattern.length - 1)
          && this._isNonTerminal(t)) {
          stack.push(t);
          return;
        }

        if (this.anyRule(pattern.slice(0, i + 1))) {
          reduction = i + 1;
        }
      }
      if (reduction >= 0) {
        this.doReduction(stack, stack.length - reduction);
      }
    }
  }

  private _isNonTerminal(t: Token) {
    return t.class === 'math-expression' ||
      t.class === 'factor' ||
      t.class === 'literal' ||
      t.class === 'identifier';
  }

  private doReduction(stack: Array<Token>, from: number = 0) {
    const prev = stack.splice(from);
    const reduction = this.anyRule(prev);
    stack.push({
      name: reduction,
      class: reduction,
      children: prev,
      line:  prev[0].line,
      position: prev[0].position
    });
  }
}
