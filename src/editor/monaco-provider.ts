import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { CompletionsHandler } from "./completions-handler";
import { DefinitionHandler } from "./definition-handler";
import { fromMonacoPosition } from "./editor-shims";
import { ESPHomeDocuments } from "./esphome-document";
import { HoverHandler } from "./hover-handler";
import { TextBuffer } from "./utils/text-buffer";

const documents = new ESPHomeDocuments();

// Register the custom language
monaco.languages.register({ id: "esphome" });
monaco.languages.register({ id: "cpp" });

const hoverHandler = new HoverHandler(documents);
monaco.languages.registerHoverProvider("esphome", {
  provideHover: async function (model, position) {
    documents.update(model.uri.toString(), new TextBuffer(model));
    const hover = await hoverHandler.getHover(
      model.uri.toString(),
      fromMonacoPosition(position),
    );
    return hover;
  },
});

const completionsHandler = new CompletionsHandler(documents);
monaco.languages.registerCompletionItemProvider("esphome", {
  provideCompletionItems: async function (model, position) {
    documents.update(model.uri.toString(), new TextBuffer(model));
    const completions = await completionsHandler.getCompletions(
      model.uri.toString(),
      fromMonacoPosition(position),
    );
    return { suggestions: completions };
  },
});

const definitionHandler = new DefinitionHandler(documents);
monaco.languages.registerDefinitionProvider("esphome", {
  provideDefinition: async function (model, position) {
    documents.update(model.uri.toString(), new TextBuffer(model));
    const ret = await definitionHandler.getDefinition(
      model.uri.toString(),
      fromMonacoPosition(position),
    );
    if (!ret) return;

    return {
      uri: model.uri,
      range: {
        startLineNumber: ret.range.start.line + 1,
        startColumn: ret.range.start.character + 1,
        endLineNumber: ret.range.end.line + 1,
        endColumn: ret.range.end.character + 1,
      },
    };
  },
});

monaco.editor.defineTheme("esphome", {
  base: "vs", // can also be vs-dark or hc-black
  inherit: true, // can also be false to completely replace the builtin rules
  rules: [{ token: "type", foreground: "000099", fontStyle: "" }],

  colors: {
    "editor.foreground": "#000000",
  },
});

monaco.editor.defineTheme("esphome-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [{ token: "type", foreground: "E8E8E9", fontStyle: "" }],

  colors: {
    "editor.foreground": "#E8E8E9",
  },
});

monaco.languages.setLanguageConfiguration("esphome", {
  comments: {
    lineComment: "#",
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    offSide: true,
  },
  onEnterRules: [
    {
      beforeText: /:\s*$/,
      action: {
        indentAction: monaco.languages.IndentAction.Indent,
      },
    },
  ],
});

monaco.languages.setMonarchTokensProvider("esphome", {
  tokenPostfix: ".esphome",

  brackets: [
    { token: "delimiter.bracket", open: "{", close: "}" },
    { token: "delimiter.square", open: "[", close: "]" },
  ],

  keywords: [
    "true",
    "True",
    "TRUE",
    "false",
    "False",
    "FALSE",
    "null",
    "Null",
    "Null",
    "~",
  ],

  numberInteger: /(?:0|[+-]?[0-9]+)/,
  numberFloat: /(?:0|[+-]?[0-9]+)(?:\.[0-9]+)?(?:e[-+][1-9][0-9]*)?/,
  numberOctal: /0o[0-7]+/,
  numberHex: /0x[0-9a-fA-F]+/,
  numberInfinity: /[+-]?\.(?:inf|Inf|INF)/,
  numberNaN: /\.(?:nan|Nan|NAN)/,
  numberDate:
    /\d{4}-\d\d-\d\d([Tt ]\d\d:\d\d:\d\d(\.\d+)?(( ?[+-]\d\d?(:\d\d)?)|Z)?)?/,

  escapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,

  tokenizer: {
    root: [
      { include: "@whitespace" },
      { include: "@comment" },

      // Directive
      [/%[^ ]+.*$/, "meta.directive"],

      // Document Markers
      [/---/, "operators.directivesEnd"],
      [/\.{3}/, "operators.documentEnd"],

      // Block Structure Indicators
      [/[-?:](?= )/, "operators"],

      { include: "@anchor" },
      { include: "@tagHandle" },
      { include: "@flowCollections" },
      { include: "@blockStyle" },

      // Numbers
      [/@numberInteger(?![ \t]*\S+)/, "number"],
      [/@numberFloat(?![ \t]*\S+)/, "number.float"],
      [/@numberOctal(?![ \t]*\S+)/, "number.octal"],
      [/@numberHex(?![ \t]*\S+)/, "number.hex"],
      [/@numberInfinity(?![ \t]*\S+)/, "number.infinity"],
      [/@numberNaN(?![ \t]*\S+)/, "number.nan"],
      [/@numberDate(?![ \t]*\S+)/, "number.date"],

      // Key:Value pair
      [
        /(".*?"|'.*?'|[^#'"]*?)([ \t]*)(:)( |$)/,
        ["type", "white", "operators", "white"],
      ],

      { include: "@flowScalars" },

      // String nodes
      [
        /.+?(?=(\s+#|$))/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "type",
          },
        },
      ],
    ],

    // Flow Collection: Flow Mapping
    object: [
      { include: "@whitespace" },
      { include: "@comment" },

      // Flow Mapping termination
      [/\}/, "@brackets", "@pop"],

      // Flow Mapping delimiter
      [/,/, "delimiter.comma"],

      // Flow Mapping Key:Value delimiter
      [/:(?= )/, "operators"],

      // Flow Mapping Key:Value key
      [/(?:".*?"|'.*?'|[^,\{\[]+?)(?=: )/, "type"],

      // Start Flow Style
      { include: "@flowCollections" },
      { include: "@flowScalars" },

      // Scalar Data types
      { include: "@tagHandle" },
      { include: "@anchor" },
      { include: "@flowNumber" },

      // Other value (keyword or string)
      [
        /[^\},]+/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "string",
          },
        },
      ],
    ],

    // Flow Collection: Flow Sequence
    array: [
      { include: "@whitespace" },
      { include: "@comment" },

      // Flow Sequence termination
      [/\]/, "@brackets", "@pop"],

      // Flow Sequence delimiter
      [/,/, "delimiter.comma"],

      // Start Flow Style
      { include: "@flowCollections" },
      { include: "@flowScalars" },

      // Scalar Data types
      { include: "@tagHandle" },
      { include: "@anchor" },
      { include: "@flowNumber" },

      // Other value (keyword or string)
      [
        /[^\],]+/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "identifier",
          },
        },
      ],
    ],

    // First line of a Block Style
    multiString: [[/^( +).+$/, "string", "@multiStringContinued.$1"]],

    // Further lines of a Block Style
    //   Workaround for indentation detection
    multiStringContinued: [
      [
        /^( *).+$/,
        {
          cases: {
            "$1==$S2": "string",
            "@default": { token: "@rematch", next: "@popall" },
          },
        },
      ],
    ],

    whitespace: [[/[ \t\r\n]+/, "white"]],

    // Only line comments
    comment: [[/#.*$/, "comment"]],

    // Start Flow Collections
    flowCollections: [
      [/\[/, "@brackets", "@array"],
      [/\{/, "@brackets", "@object"],
    ],

    // Start Flow Scalars (quoted strings)
    flowScalars: [
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/'([^'\\]|\\.)*$/, "string.invalid"],
      [/'[^']*'/, "string"],
      [/"/, "string", "@doubleQuotedString"],
    ],

    doubleQuotedString: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, "string", "@pop"],
    ],

    // Start Block Scalar
    blockStyle: [[/[>|][0-9]*[+-]?$/, "operators", "@multiString"]],

    // Numbers in Flow Collections (terminate with ,]})
    flowNumber: [
      [/@numberInteger(?=[ \t]*[,\]\}])/, "number"],
      [/@numberFloat(?=[ \t]*[,\]\}])/, "number.float"],
      [/@numberOctal(?=[ \t]*[,\]\}])/, "number.octal"],
      [/@numberHex(?=[ \t]*[,\]\}])/, "number.hex"],
      [/@numberInfinity(?=[ \t]*[,\]\}])/, "number.infinity"],
      [/@numberNaN(?=[ \t]*[,\]\}])/, "number.nan"],
      [/@numberDate(?=[ \t]*[,\]\}])/, "number.date"],
    ],

    tagHandle: [
      [/\!lambda /, "tag", "@lambda"],
      [/\![^ ]*/, "tag"],
    ],

    anchor: [[/[&*][^ ]+/, "namespace"]],

    lambda : [
      [/[ \t]*[>|][0-9]*[+-]?[ \t]*$/, {token: "operators", switchTo: "@lambdaBlock"}],
      [/[ \t]*(['"])/, {token: "string", switchTo: "@lambdaString.$1", nextEmbedded: "cpp"}],
      [/.+$/, {token: "@rematch", switchTo: "@lambdaNewline", nextEmbedded: "cpp"}],
    ],

    lambdaBlock : [
      [/^([ \t]+).+$/, {token: "@rematch", switchTo: "@lambdaBlockContinued.$1", nextEmbedded: "cpp"}],
    ],

    lambdaBlockContinued: [
      [/^($S2).+$/, {token: ""}],
      [/^(?!$S2).+$/, {token: "@rematch", next: "@pop", nextEmbedded: "@pop" }],
    ],

    lambdaString: [
      [/[^$S2]+/, {token: ""}],
      [/[$S2]/, {token: "string", next: "@pop", nextEmbedded: "@pop" }],
    ],

    lambdaNewline: [
      [/./, {token: ""}],
      [/$/, {token: "@rematch", next: "@pop", nextEmbedded: "@pop" }],
    ],
  },
});

monaco.languages.setMonarchTokensProvider("cpp", {
  defaultToken: '',
  tokenPostfix: '.cpp',

  brackets: [
    { token: 'delimiter.curly', open: '{', close: '}' },
    { token: 'delimiter.parenthesis', open: '(', close: ')' },
    { token: 'delimiter.square', open: '[', close: ']' },
    { token: 'delimiter.angle', open: '<', close: '>' }
  ],

  keywords: [
    'abstract',
    'amp',
    'array',
    'auto',
    'bool',
    'break',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'constexpr',
    'const_cast',
    'continue',
    'cpu',
    'decltype',
    'default',
    'delegate',
    'delete',
    'do',
    'double',
    'dynamic_cast',
    'each',
    'else',
    'enum',
    'event',
    'explicit',
    'export',
    'extern',
    'false',
    'final',
    'finally',
    'float',
    'for',
    'friend',
    'gcnew',
    'generic',
    'goto',
    'if',
    'in',
    'initonly',
    'inline',
    'int',
    'interface',
    'interior_ptr',
    'internal',
    'literal',
    'long',
    'mutable',
    'namespace',
    'new',
    'noexcept',
    'nullptr',
    '__nullptr',
    'operator',
    'override',
    'partial',
    'pascal',
    'pin_ptr',
    'private',
    'property',
    'protected',
    'public',
    'ref',
    'register',
    'reinterpret_cast',
    'restrict',
    'return',
    'safe_cast',
    'sealed',
    'short',
    'signed',
    'sizeof',
    'static',
    'static_assert',
    'static_cast',
    'struct',
    'switch',
    'template',
    'this',
    'thread_local',
    'throw',
    'tile_static',
    'true',
    'try',
    'typedef',
    'typeid',
    'typename',
    'union',
    'unsigned',
    'using',
    'virtual',
    'void',
    'volatile',
    'wchar_t',
    'where',
    'while',

    '_asm', // reserved word with one underscores
    '_based',
    '_cdecl',
    '_declspec',
    '_fastcall',
    '_if_exists',
    '_if_not_exists',
    '_inline',
    '_multiple_inheritance',
    '_pascal',
    '_single_inheritance',
    '_stdcall',
    '_virtual_inheritance',
    '_w64',

    '__abstract', // reserved word with two underscores
    '__alignof',
    '__asm',
    '__assume',
    '__based',
    '__box',
    '__builtin_alignof',
    '__cdecl',
    '__clrcall',
    '__declspec',
    '__delegate',
    '__event',
    '__except',
    '__fastcall',
    '__finally',
    '__forceinline',
    '__gc',
    '__hook',
    '__identifier',
    '__if_exists',
    '__if_not_exists',
    '__inline',
    '__int128',
    '__int16',
    '__int32',
    '__int64',
    '__int8',
    '__interface',
    '__leave',
    '__m128',
    '__m128d',
    '__m128i',
    '__m256',
    '__m256d',
    '__m256i',
    '__m512',
    '__m512d',
    '__m512i',
    '__m64',
    '__multiple_inheritance',
    '__newslot',
    '__nogc',
    '__noop',
    '__nounwind',
    '__novtordisp',
    '__pascal',
    '__pin',
    '__pragma',
    '__property',
    '__ptr32',
    '__ptr64',
    '__raise',
    '__restrict',
    '__resume',
    '__sealed',
    '__single_inheritance',
    '__stdcall',
    '__super',
    '__thiscall',
    '__try',
    '__try_cast',
    '__typeof',
    '__unaligned',
    '__unhook',
    '__uuidof',
    '__value',
    '__virtual_inheritance',
    '__w64',
    '__wchar_t'
  ],

  operators: [
    '=',
    '>',
    '<',
    '!',
    '~',
    '?',
    ':',
    '==',
    '<=',
    '>=',
    '!=',
    '&&',
    '||',
    '++',
    '--',
    '+',
    '-',
    '*',
    '/',
    '&',
    '|',
    '^',
    '%',
    '<<',
    '>>',
    '+=',
    '-=',
    '*=',
    '/=',
    '&=',
    '|=',
    '^=',
    '%=',
    '<<=',
    '>>='
  ],

  // we include these common regular expressions
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\(?:[0abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  integersuffix: /([uU](ll|LL|l|L)|(ll|LL|l|L)?[uU]?)/,
  floatsuffix: /[fFlL]?/,
  encoding: /u|u8|U|L/,

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // C++ 11 Raw String
      [/@encoding?R\"(?:([^ ()\\\t]*))\(/, { token: 'string.raw.begin', next: '@raw.$1' }],

      // identifiers and keywords
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@keywords': { token: 'keyword.$0' },
            '@default': 'identifier'
          }
        }
      ],

      // The preprocessor checks must be before whitespace as they check /^\s*#/ which
      // otherwise fails to match later after other whitespace has been removed.

      // Inclusion
      [/^\s*#\s*include/, { token: 'keyword.directive.include', next: '@include' }],

      // Preprocessor directive
      [/^\s*#\s*\w+/, 'keyword.directive'],

      // whitespace
      { include: '@whitespace' },

      // [[ attributes ]].
      [/\[\s*\[/, { token: 'annotation', next: '@annotation' }],
      // delimiters and operators
      [/[{}()<>\[\]]/, '@brackets'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'delimiter',
            '@default': ''
          }
        }
      ],

      // numbers
      [/\d*\d+[eE]([\-+]?\d+)?(@floatsuffix)/, 'number.float'],
      [/\d*\.\d+([eE][\-+]?\d+)?(@floatsuffix)/, 'number.float'],
      [/0[xX][0-9a-fA-F']*[0-9a-fA-F](@integersuffix)/, 'number.hex'],
      [/0[0-7']*[0-7](@integersuffix)/, 'number.octal'],
      [/0[bB][0-1']*[0-1](@integersuffix)/, 'number.binary'],
      [/\d[\d']*\d(@integersuffix)/, 'number'],
      [/\d(@integersuffix)/, 'number'],

      // delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
      [/"/, 'string', '@string'],

      // characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid']
    ],

    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/\/\*\*(?!\/)/, 'comment.doc', '@doccomment'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*\\$/, 'comment', '@linecomment'],
      [/\/\/.*$/, 'comment']
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    //For use with continuous line comments
    linecomment: [
      [/.*[^\\]$/, 'comment', '@pop'],
      [/[^]+/, 'comment']
    ],

    //Identical copy of comment above, except for the addition of .doc
    doccomment: [
      [/[^\/*]+/, 'comment.doc'],
      [/\*\//, 'comment.doc', '@pop'],
      [/[\/*]/, 'comment.doc']
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop']
    ],

    raw: [
      [/[^)]+/, 'string.raw'],
      [/\)$S2\"/, { token: 'string.raw.end', next: '@pop' }],
      [/\)/, 'string.raw']
    ],

    annotation: [
      { include: '@whitespace' },
      [/using|alignas/, 'keyword'],
      [/[a-zA-Z0-9_]+/, 'annotation'],
      [/[,:]/, 'delimiter'],
      [/[()]/, '@brackets'],
      [/\]\s*\]/, { token: 'annotation', next: '@pop' }]
    ],

    include: [
      [
        /(\s*)(<)([^<>]*)(>)/,
        [
          '',
          'keyword.directive.include.begin',
          'string.include.identifier',
          { token: 'keyword.directive.include.end', next: '@pop' }
        ]
      ],
      [
        /(\s*)(")([^"]*)(")/,
        [
          '',
          'keyword.directive.include.begin',
          'string.include.identifier',
          { token: 'keyword.directive.include.end', next: '@pop' }
        ]
      ]
    ]
  }
});
