import Automaton from "./automaton";

export default class Grammar {
    private _terminals = <const>['a', 'b', 'c'];
    private _nonTerminals = <const>['S', 'A', 'B', 'C'];
    private _rules: Record<string, Array<string>> = {
        'S': ['aA', 'bB', 'aC'],
        'A': ['bA', 'bB', 'c'],
        'B': ['aA', 'cC', 'b'],
        'C': ['bB', 'bC', 'a']
    };
    private _maxRounds = 30;
    private _automaton: Automaton = null;
    private _starting = 'S';

    // private _terminals = <const>['a', 'b'];
    // private _nonTerminals = <const>['S', 'A', 'B'];
    // private _rules: Record<string, Array<string>> = {
    //     'S': ['aA', 'aB'],
    //     'A': ['aA', 'b'],
    //     'B': ['bB', 'a']
    // };
    // private _maxRounds = 30;
    // private _automaton: Automaton = null;
    // private _starting = 'S';

    public isInGrammar(s: string) {
        return this._inGrammarHelper(s, this._starting, '', 0, []);
    }

    public isRegular() {
        for (const rule in this._rules) {
            for (const r of this._rules[rule]) {
                if (r.length > 2) {
                    return false;
                }
                if (r.length === 1 && !this._nonTerminals.some(v => v === r)) {
                    return false;
                }
                if (this._nonTerminals.some(v => v === r[0]) &&
                    this._terminals.some(v => v === r[1])) {
                    return false;
                }
            }
        }
        return true;
    }

    public toAutomaton() {
        if (this._automaton !== null) {
            return this._automaton;
        }

        this._automaton = new Automaton();
        const newRules = new Grammar()._rules;
        for (const nonTerminal of this._nonTerminals) {
            for (const rule of this._rules[nonTerminal]) {
                if (this._isTerminal(rule) && !this._rules[nonTerminal].some(v => v.startsWith(rule) && v !== rule)) {
                    newRules[nonTerminal].push(rule + 'N');
                }
            }
        }

        this._automaton.startingState = this._starting;
        this._automaton.states = [...this._nonTerminals, 'N'];
        this._automaton.symbols = [...this._terminals];

        for (const state of this._automaton.states) {
            this._automaton.nextStates[state] = {};
            for (const symbol of this._automaton.symbols) {
                if (newRules[state]) {
                    const rules = newRules[state].filter(
                        v => v.length > 1 && v[0] === symbol
                    ).map(str => str[1]);
                    this._automaton.nextStates[state][symbol] = rules;
                }
                else {
                    this._automaton.nextStates[state][symbol] = [];
                }
            }

            if (newRules[state]) {
                this._automaton.endStates = [
                    ...this._automaton.endStates,
                    ...newRules[state].filter(v => {
                        return v.length > 1 &&
                            newRules[state].some(vv => vv === v[0]) &&
                            !this._automaton.endStates.some(vv => vv === v[1])
                    }).map(v => v[1])
                ];
            }
        }

        return this._automaton;
    }

    private _isTerminal(s: string): boolean {
        return this._terminals.some(v => v === s);
    }

    private _isNonTerminal(s: string): boolean {
        return this._nonTerminals.some(v => v === s);
    }

    private _inGrammarHelper(target: string, current: string, accum: string, round: number, checked: Array<[string, string]>) {
        if (accum + current  === target) {
            return true;
        }

        if (checked.some(v => v[0] === accum && v[1] === current)) {
            return false;
        }
        if (target.length < accum.length + current.length) {
            return false;
        }
        if (round === this._maxRounds) {
            return false;
        }

        checked = [...checked, [accum, current]];
        let res = false;
        const char = current[0];
        if (this._isTerminal(char)) {
            accum += char;
            res ||= this._inGrammarHelper(target, current.slice(1), accum, round + 1, checked);
            if (res === true) {
                return true;
            }
        }
        if (this._isNonTerminal(char)) {
            for (const rule of this._rules[char]) {
                res ||= this._inGrammarHelper(target, rule + current.slice(1), accum, round + 1, checked);
                if (res === true) {
                    return true;
                }
            }
        }

        return false;
    }
}
