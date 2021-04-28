import * as _ from 'lodash';
import * as cytoscape from 'cytoscape';
import * as cytosnap from 'cytosnap';
import * as fs from 'fs';
import coseBilkent from 'cytoscape-cose-bilkent';

type StatesMatrix = Record<string, Record<string, Array<string>>>;

export default class Automaton {
    public nextStates: StatesMatrix = {};
    public states: Array<string> = [];
    public startingState: string;
    public endStates: Array<string> = [];
    public symbols: Array<string> = [];

    get isDeterministic() {
        for (const state in this.nextStates) {
            for (const symbol in this.nextStates[state]) {
                if (this.nextStates[state][symbol].length > 1) {
                    return false;
                }
            }
        }
        return true;
    }

    toDeterministic() {
        if (this.isDeterministic) {
            return;
        }

        const newA = new Automaton();
        newA.symbols = this.symbols;
        newA.startingState = this.startingState;
        const tempNextStates: StatesMatrix = {};
        tempNextStates[newA.startingState] = this.nextStates[this.startingState];

        const newStates = [...Object.values(tempNextStates[this.startingState])
            .map(v => v.sort().join('')).filter(v => v !== '')];

        for (const newState of newStates) {
            if (tempNextStates[newState]) {
                continue;
            }
            tempNextStates[newState] = {};
            for (const symbol of this.symbols) {
                tempNextStates[newState][symbol] = [];
                for (const state of newState) {
                    for (const val of this.nextStates[state][symbol]) {
                        if (!tempNextStates[newState][symbol].some(v => v === val)) {
                            tempNextStates[newState][symbol].push(val);
                        }
                        const posNewState = tempNextStates[newState][symbol].sort().join('');
                        newStates.push(posNewState);
                    }
                }
            }
        }

        newA.nextStates = tempNextStates;
        newA.states = Object.keys(tempNextStates);
        newA.endStates = newA.states.filter(v => this.endStates.some(vv => v.includes(vv)));

        newA._renameStates();

        this.states = newA.states;
        this.endStates = newA.endStates
        this.startingState = newA.startingState;
        this.nextStates = newA.nextStates;
        this.symbols = newA.symbols;
    }

    generateGraph(path) {
        const nodes = this.states.map(v => {
            return {
                data: {
                    id: v,
                    label: v
                }
            }
        });

        const edges = this.states.map(v => {
            const connections = [];
            for (const el in this.nextStates[v]) {
                for (const next of this.nextStates[v][el]) {
                    connections.push({
                        data: {
                            source: v,
                            target: next,
                            label: el
                        }
                    });
                }
            }
            return connections;
        }).flat();

        const elements: cytoscape.ElementsDefinition = {nodes, edges};
        cytosnap.use(['cytoscape-cose-bilkent']);
        const snap = cytosnap();
        snap.start()
            .then(() => {
                return snap.shot({
                    elements,
                    style: [
                        {
                            "selector": "node",
                            "style": {
                                "width": 16,
                                "height": 16,
                            }
                        },
                        {
                            "selector": "node[label]",
                            "style": {
                                "label": "data(label)",
                                "text-valign": "center",
                                "text-halign": "center",
                            }
                        },
                        {
                            "selector": "edge[label]",
                            "style": {
                                "label": "data(label)",
                            }
                        },
                        {
                            "selector": "edge",
                            "style": {
                                "width": 1,
                                "curve-style": "bezier",
                                "target-arrow-shape": "triangle"
                            }
                        }
                    ],
                    layout: {name: 'cose-bilkent'},
                    resolvesTo: 'base64',
                    format: 'jpeg',
                    width: 4000,
                    height: 4000,
                    background: 'transparent'
                });
            })
            .then(img => {
                fs.writeFileSync(path, new Buffer(img, 'base64'));
            });
    }

    _renameStates() {
        const s = 'ABCDEFGHIJKLMNPQRSTUVWXYZ';
        const alreadyNamed = this.states.filter(v => v.length === 1);
        const mapping = {};
        alreadyNamed.forEach(v => {
            mapping[v] = v;
        });
        this.states.forEach((v) => {
            if (mapping[v]) {
                return;
            }
            let res = s[Math.floor(Math.random() * 24)];
            while (alreadyNamed.some(v => v === res)) {
                res = s[Math.floor(Math.random() * 24)];
            }
            alreadyNamed.push(res);
            mapping[v] = res;
        });

        this.states = this.states.map(v => mapping[v]);
        this.endStates = this.states.map(v => mapping[v]);

        for (const state in this.nextStates) {
            for (const symbol in this.nextStates[state]) {
                this.nextStates[state][symbol] =
                    [this.nextStates[state][symbol].sort().join('')].filter(v => v !== '').map(v => mapping[v]);
            }
            if (mapping[state] !== state) {
                this.nextStates[mapping[state]] = this.nextStates[state];
                delete this.nextStates[state]
            }
        }

    }
}