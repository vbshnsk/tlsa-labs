import * as fs from "fs";

type Token = string;
type Action = {
    type: string,
    value: string
};
type PatternData = {
    regex: RegExp,
    actions: Array<Action>,
    matches: Record<string, string>
};
type RawPatternData = {
    regex: Array<string>,
    actions?: string,
    matches?: Record<string, string>
};
type Match = {
    name: string,
    class: string,
    line: number,
    position: number,
    value?: string | number
};
type Error = {
    description: string,
    value: string,
    fromPosition: number,
    toPosition?: number,
    fromLine: number,
    toLine?: number;
};

export default class LexicalAnalyzer {
    private _patterns: Record<Token, PatternData>;
    private _buffer: string = '';
    private _currentLine = 1;
    private _currentPosition = 1;
    private _prevBuffer: string;

    readPatternsFromFile(path: string): Record<Token, PatternData> {
        const contents = JSON.parse(fs.readFileSync(path, {encoding: 'utf-8'}));
        if (this._isValidPatternsFile(contents)) {
            this._patterns = {};
            for (const key in contents) {
                if (contents.hasOwnProperty(key)) {
                    this._patterns[key] = {
                        regex: contents[key].regex
                            .map(v => new RegExp(v))
                            .reduce((acc, v) => new RegExp(acc.source + '|' + v.source)),
                        actions: contents[key].actions ? this._parseActions(contents[key].actions) : [],
                        matches: contents[key].matches
                    };
                }
            }
            return this._patterns;
        }
        throw new Error('Invalid patterns file for lexical analysis');
    }

    private _parseActions(str: string): Array<Action> {
        str = str.replace(' ', '');
        const res = str.split(',').map(v => v.split(':'));
        if (this._isArrayOf<[string, string]>(res, this._isTupleLike)) {
            return res.map(value => {return {type: value[0], value: value[1]};});
        }
    }

    private _isValidPatternsFile(obj): obj is Record<string, RawPatternData> {
        return typeof obj === "object" &&
            Object.keys(obj).every(v => typeof v === 'string') &&
            Object.values(obj).every(v => this._isPatternData(v));
    }

    private _isPatternData(obj): obj is RawPatternData {
        return obj.regex && this._isArrayOf(obj.regex, this._isString);
    }

    private _isArrayOf<T>(obj, guard: (value) => value is T): obj is Array<T> {
        return obj instanceof Array && obj.every(v => guard(v));
    }

    private _isString(obj): obj is string {
        return typeof obj === 'string'
    }

    private _isTupleLike<T>(obj): obj is [T, T] {
        return obj.length >= 2;
    }

    analyze(str: string): {errors: Array<Error>, tokens: Array<Match>} {
        str += '\n';
        const tokens: Array<Match> = [];
        const errors: Array<Error> = [];
        let currentError: Error;
        let lastMatch: Match;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const match = this._getExactMatch(char);

            if (!match || match.class === 'skip') {
                this._resetBuffer((match || {value: ''}).value === '\n');
                if (lastMatch) {
                    tokens.push(lastMatch);
                    i--;
                }
                else if (!match) {
                    if (currentError) {
                        currentError.value += this._prevBuffer;
                    }
                    else {
                        currentError = {
                            description: 'Couldn\'t parse tokens',
                            value: this._prevBuffer,
                            fromPosition: this._currentPosition - this._prevBuffer.length,
                            fromLine: this._currentLine
                        };
                    }
                }
            }

            if (match && currentError) {
                currentError.toLine = this._currentLine;
                currentError.toPosition = this._currentPosition - this._prevBuffer.length;
                errors.push(currentError);
                currentError = undefined;
            }

            lastMatch = match;
        }
        return {errors, tokens};
    }

    private _getExactMatch(char: string): Match | null {
        this._buffer += char;
        const matches: Array<Match> = [];
        for (const token in this._patterns) {
            if (this._patterns.hasOwnProperty(token)) {
                const regexp = this._patterns[token].regex;
                const actions = this._patterns[token].actions;
                const mapping = this._patterns[token].matches;
                if (regexp.test(this._buffer)) {
                    const match = regexp.exec(this._buffer);
                    if (actions.length) {
                        const res = {
                            name: token,
                            class: this._getClass(actions),
                            value: this._getValue(match[0], actions, mapping),
                            position: this._currentPosition,
                            line: this._currentLine
                        };
                        if (!res.value) {
                            delete res.value;
                        }
                        matches.push(res);
                    }
                }
            }
        }
        if (matches.length > 1) {
            const keywordMatch = matches.find(v => v.class === 'keyword');
            if (!keywordMatch) {
                throw new Error('Matched more than once without a keyword match: ' + JSON.stringify(matches));
            }
            return keywordMatch;
        }

        if (matches.length === 0) {
            return null;
        }

        return matches[0];
    }

    private _resetBuffer(updateLine?: boolean) {
        this._currentPosition += this._buffer.length;
        if (updateLine) {
            this._currentLine++;
        }
        this._prevBuffer = this._buffer;
        this._buffer = '';
    }

    private _getClass(actions: Array<Action>): string {
        return actions.find(v => v.type === 'class').value;
    }

    private _getValue(match: string, actions: Array<Action>, matches: Record<string, string>): string | number {
        const action = actions.find(v => v.type === 'value');

        if (!action) {
            return;
        }

        switch (action.value) {
            case 'match':
                return matches[match];
            case 'string':
                return match;
            case 'number':
                return Number(match);
        }
    }

}