import React, { Fragment, useState } from 'react';
import './App.css';

type Token = {
  text: string,
  start: number,
  end: number,  // exclusive
};

type Arity = {
  popped: number,
  pushed: number,
};

type OperatorTree = {
  token: Token,
  children: OperatorTree[],
  errors: string[],
}

const operatorArity: {[operator: string]: number} = {
  // Standard operations
  exp: 1,
  log: 1,
  sqrt: 1,
  sin: 1,
  cos: 1,
  abs: 1,
  not: 1,
  dup: 1,
  dupN: 1,

  "+": 2,
  "-": 2,
  "*": 2,
  "/": 2,
  max: 2,
  min: 2,
  pow: 2,
  ">": 2,
  "<": 2,
  "=": 2,
  ">=": 2,
  "<=": 2,
  and: 2,
  or: 2,
  xor: 2,

  "?": 3,

  // Akarin additions
  trunc: 1,
  round: 1,
  floor: 1,
  bitnot: 1,

  "%": 2,
  "**": 2,
  bitand: 2,
  bitor: 2,
  bitxor: 2,

  clip: 3,
  clamp: 3,
}

function getArity(operator: string): Arity {
  if (operatorArity[operator] !== undefined) {
    return {popped: operatorArity[operator], pushed: 1};
  } else if (operator.endsWith("!")) {
    return {popped: 1, pushed: 0};
  } else if (operator.endsWith("[]")) {
    return {popped: 2, pushed: 1};
  } else if (operator.startsWith("drop")) {
    const num: number = Number(operator.substring("drop".length));
    return {popped: num, pushed: 0};
  } else if (operator.startsWith("sort")) {
    const num: number = Number(operator.substring("sort".length));
    return {popped: num, pushed: num};
  } else {
    return {popped: 0, pushed: 1};
  }
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  for (const part of text.split(" ")) {
    if (part !== "") {
      tokens.push({
        text: part,
        start: pos,
        end: pos + part.length,
      });
      pos += part.length;
    }

    pos += 1;
  }
  return tokens;
}

// TODO: handle swap, swapN, dup, dupN, sortN

function buildTrees(tokens: Token[]): OperatorTree[] {
  const stack: OperatorTree[] = [];
  const trees: OperatorTree[] = [];

  for (const [i, token] of Array.from(tokens.entries())) {
    const {popped, pushed} = getArity(token.text);

    const tree: OperatorTree = {
      token: token,
      children: popped === 0 ? [] : stack.slice(-popped),
      errors: [],
    };

    if (tree.children.length < popped) {
      tree.errors.push(`Too few values on stack: Expected ${popped}, got ${tree.children.length}.`);
    }

    if (i === tokens.length - 1 && popped < stack.length) {
      tree.errors.push(`${stack.length - popped} values left on stack!`);
    }

    for (let j = 0; j < popped; j++) {
      stack.pop();
    }
    for (let j = 0; j < pushed; j++) {
      stack.push(tree);
    }
    trees.push(tree);
  }

  return trees;
}

function ExprDisplay({trees}: {trees: OperatorTree[]}) {
  const [hovered, setHovered] = useState<number | undefined>(undefined);

  const operators: number[] = (hovered ? trees[hovered].children : []).map((c) => trees.findIndex(t => t.token.start === c.token.start));

  const spanColor = (i: number): string => {
    const index = operators.findIndex((o) => o === i);
    if (i === hovered) {
      return "expr-term-operator";
    } else if (index !== -1) {
      return `expr-term-operand-${index % 3 + 1}`;
    } else if (trees[i].errors.length) {
      return "expr-term-error";
    }
    return "";
  };

  return (
    <div className="expr-display">
      {Array.from(trees.entries()).map(([i, tree]) =>
        <Fragment key={i}>
          <span className={spanColor(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(undefined)}>
            {tree.token.text}
          </span>
          {i !== trees.length && " "}
        </Fragment>
      )}
    </div>
  );
}

function App() {
  const [expr, setExpr] = useState<string>("");

  return (
    <div className="App">
      <input type="text" className="expr-input" placeholder="Enter your expression here" onChange={(e) => setExpr(e.target.value)}/>
      <ExprDisplay trees={buildTrees(tokenize(expr))} />
    </div>
  );
}

export default App;
