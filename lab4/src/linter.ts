import {Token} from './parser';

type Error = {
  message: string,
  line: number,
  position: number
}

export default class Linter {

  lint(start: Token) {

    const errors = [];

    this._helper(start, [], errors);

    return errors;
  }

  private _helper(t: Token, ids: Array<String>, errors: Array<Error>) {
    const children = t.children;

    if (t.class === 'assign') {
      if (children[0].class === 'keyword') {

        if (ids.some(v => v === children[1].value)) {
          errors.push({
            message: 'Identifier ' + children[1].value + ' has already been declared',
            line: children[1].line,
            position: children[1].position
          });
        }
        else {
          ids.push(children[1].value + '');
        }

      }
      else if (children[0].class === 'identifier') {
        if (!ids.some(v => v === children[1].value)) {
          errors.push({
            message: 'Identifier ' + children[1].value + ' hasn\'t been declared',
            line: children[1].line,
            position: children[1].position
          });
        }
      }
    }

    if (children) {
      for (const child of children) {
        this._helper(child, ids, errors);
      }
    }
  }
}

