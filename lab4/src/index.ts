import LexicalAnalyzer from './lexicalAnalyzer';
import Parser from './parser';
import Linter from './linter';

let indent = 1;
function walk(tree) {
  tree.forEach(function(node) {
    console.log('--' + Array(indent).join('--'),
      `${node.class}:${node.name}(${node.value || ''})`);
    if(node.children) {
      indent++;
      walk(node.children);
    }
    if(tree.indexOf(node) === tree.length - 1) {
      indent--;
    }
  })
}

let analyzer: LexicalAnalyzer = new LexicalAnalyzer();
const patterns = analyzer.readPatternsFromFile('patterns.json');
const result = analyzer.analyze('while a < 2 do a = a + 1 end');
console.table(result.tokens);

let parser: Parser = new Parser();

const parsed = parser.parse(result.tokens);

walk([parsed]);

const linter = new Linter();

console.table(linter.lint(parsed));


