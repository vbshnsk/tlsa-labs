import * as sinon from "sinon";
import LexicalAnalyzer from "./lexicalAnalyzer";
import * as fs from "fs";
import * as should from "should";
import Parser from './parser';

let analyzer: LexicalAnalyzer;
let parser: Parser;

describe('LexicalAnalyzer', () => {

    beforeEach(() => {
       analyzer = new LexicalAnalyzer();
       parser = new Parser();
    });

    afterEach(() => {
        sinon.restore();
    });

    test('it should read pattern file', () => {
        sinon.stub(fs, 'readFileSync').returns('{"math": {\n' +
            '    "regex": [\n' +
            '      "/a/"' +
            '    ],\n' +
            '    "actions": "class:operation, value:match",\n' +
            '    "matches": {\n' +
            '      "a": "A"' +
            '    }\n' +
            '  }}');

        const patterns = analyzer.readPatternsFromFile('');
        should(patterns).match({
            math: {
                regex: new RegExp('/a/'),
                actions: [{type: 'class', value: 'operation'}, {type: 'value', value: 'match'}],
                matches: {
                    a: 'A'
                }
            }
        });
    });

    test('should analyze simple line', () => {
       const patterns = analyzer.readPatternsFromFile('patterns.json');
       console.table(analyzer.analyze('int a = 1').tokens);
    });

    test('should analyze multiline', () => {
        const patterns = analyzer.readPatternsFromFile('patterns.json');
        console.table(analyzer.analyze('' +
            'int a = 1\n' +
            'while a <= 2 do a = a + 1 end').tokens
        );
    })

    test('should throw on error', () => {
        const patterns = analyzer.readPatternsFromFile('patterns.json');
        const result = analyzer.analyze('' +
            'in.__t a = 1\n' +
            'while a <= 2 do a = a + 1 end');
        console.table(result.errors);
        console.table(result.tokens);
    });

    test.only('idk', () => {
      const patterns = analyzer.readPatternsFromFile('patterns.json');
      const result = analyzer.analyze('1 + 3');
      console.table(result.tokens);
      const parsed = parser.parse(result.tokens);
    });

});


