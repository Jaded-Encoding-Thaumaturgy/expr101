export type Token = {
  text: string,
  start: number,
  end: number,  // exclusive
};

export type Arity = {
  popped: number,
  pushed: number,
};

export type OperatorTree = {
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
    const num: number = operator === "drop" ? 1 : Number(operator.substring("drop".length));
    return {popped: num, pushed: 0};
  } else if (operator.startsWith("sort")) {
    const num: number = Number(operator.substring("sort".length));
    return {popped: num, pushed: num};
  } else {
    return {popped: 0, pushed: 1};
  }
}

export function tokenize(text: string): Token[] {
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

export function buildTrees(tokens: Token[]): OperatorTree[] {
  const stack: OperatorTree[] = [];
  const trees: OperatorTree[] = [];

  const expectNumValues = (tree: OperatorTree, num: number) => {
    if (stack.length < num) {
      tree.errors.push(`Too few values on stack: Expected ${num}, got ${tree.children.length}.`);
    }
  }

  for (const [i, token] of Array.from(tokens.entries())) {
    const tree: OperatorTree = {
      token: token,
      children: [],
      errors: [],
    };

    if (token.text.startsWith("dup")) {
      const num: number = token.text === "dup" ? 0 : Number(token.text.substring("dup".length));

      expectNumValues(tree, num + 1);
      tree.children = [stack[stack.length - num - 1]];

      stack.push(tree);
    } else if (token.text.startsWith("swap")) {
      const num: number = token.text === "swap" ? 1 : Number(token.text.substring("swap".length));

      const [n, m] = [stack.length - num - 1, stack.length - 1]

      expectNumValues(tree, num + 1);
      tree.children = [stack[n], stack[m]];

      stack[m] = tree.children[0];
      stack[n] = tree.children[1];
    } else {
      const {popped, pushed} = getArity(token.text);
      expectNumValues(tree, popped);

      tree.children = popped === 0 ? [] : stack.slice(-popped);

      for (let j = 0; j < popped; j++) {
        stack.pop();
      }
      for (let j = 0; j < pushed; j++) {
        stack.push(tree);
      }
    }

    if (i === tokens.length - 1 && stack.length > 1) {
      tree.errors.push(`${stack.length - 1} values left on stack!`);
    }

    trees.push(tree);
  }

  return trees;
}

