import Grammar from './grammar';

const g = new Grammar();

const a = g.toAutomaton();

console.table(a.nextStates);

a.toDeterministic();

console.table(a.nextStates);

a.generateGraph('example.jpeg');
