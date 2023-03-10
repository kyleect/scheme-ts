import { Token, TokenType } from "./token";

export class Expr {
  toString(): string {
    return `<Expr>`;
  }

  static Call(callee, args): CallExpr {
    return new CallExpr(callee, args);
  }

  static Symbol(token: Token): SymbolExpr {
    return new SymbolExpr(token);
  }

  static Literal(value: unknown): LiteralExpr {
    return new LiteralExpr(value);
  }

  static If(test, consequent, alternative): IfExpr {
    return new IfExpr(test, consequent, alternative);
  }

  static Define(token: Token, value: unknown): DefineExpr {
    return new DefineExpr(token, value);
  }

  static Set(token: Token, value: unknown): SetExpr {
    return new SetExpr(token, value);
  }

  static Let(bindings: LetBindingNode[], body: Expr[]): LetExpr {
    return new LetExpr(bindings, body);
  }

  static Lambda(params: Token[], body: Expr[]): LambdaExpr {
    return new LambdaExpr(params, body);
  }

  static IsCall(expression: Expr): expression is CallExpr {
    return expression instanceof CallExpr;
  }

  static IsSymbol(expression: Expr): expression is SymbolExpr {
    return expression instanceof SymbolExpr;
  }

  static IsLiteral(expression: Expr): expression is LiteralExpr {
    return expression instanceof LiteralExpr;
  }

  static IsIf(expression: Expr): expression is IfExpr {
    return expression instanceof IfExpr;
  }

  static isDefine(expression: Expr): expression is DefineExpr {
    return expression instanceof DefineExpr;
  }

  static isSet(expression: Expr): expression is SetExpr {
    return expression instanceof SetExpr;
  }

  static isLet(expression: Expr): expression is LetExpr {
    return expression instanceof LetExpr;
  }

  static isLambda(expression: Expr): expression is LambdaExpr {
    return expression instanceof LambdaExpr;
  }
}

class CallExpr extends Expr {
  constructor(public callee: unknown, public args: unknown[]) {
    super();
  }

  toString(): string {
    return `<CallExpr callee=${this.callee}; args=[${this.args}]>`;
  }
}

class SymbolExpr extends Expr {
  constructor(public token: Token) {
    super();
  }

  toString(): string {
    return `<SymbolExpr token=${this.token}>`;
  }
}

class LiteralExpr extends Expr {
  constructor(public value: unknown) {
    super();
  }

  toString(): string {
    return `<LiteralExpr value=${this.value}>`;
  }
}

class IfExpr extends Expr {
  constructor(public test, public consequent, public alternative) {
    super();
  }
}

class DefineExpr extends Expr {
  constructor(public token: Token, public value: unknown) {
    super();
  }

  toString(): string {
    return `<DefineExpr token=${this.token}; value=${this.value}>`;
  }
}

class SetExpr extends Expr {
  constructor(public token: Token, public value: unknown) {
    super();
  }

  toString(): string {
    return `<SetExpr token=${this.token}; value=${this.value}>`;
  }
}

class LetExpr extends Expr {
  constructor(public bindings: LetBindingNode[], public body: Expr[]) {
    super();
  }

  toString(): string {
    return `<LetExpr bindings=[${this.bindings}]; body=[${this.body}]>`;
  }

  bindingsToMap(): ReturnType<Map<string, unknown>["entries"]> {
    return new Map(
      this.bindings.map((binding) => {
        return [binding.name.getLexeme(), binding.value];
      })
    ).entries();
  }
}

export class LetBindingNode {
  constructor(public name: Token, public value: Expr) {}

  toString(): string {
    return `<LetBindingNode name=${this.name}; value=${this.value}>`;
  }
}

export class LambdaExpr extends Expr {
  constructor(public params: Token[], public body: Expr[]) {
    super();
  }

  toString(): string {
    return `<Lambda params=[${this.params}]; body=[${this.body}]>`;
  }
}

export class Parser {
  static NULL_VALUE = [];

  private current = 0;

  constructor(private tokens: Token[]) {}

  public parse(): Expr[] {
    const expressions = [];
    while (!this.isAtEnd()) {
      const expr = this.expression();
      expressions.push(expr);
    }
    return expressions;
  }

  private isAtEnd(): boolean {
    return this.peek().getTokenType() === TokenType.Eof;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private expression(): Expr {
    if (this.match(TokenType.LeftBracket)) {
      if (this.match(TokenType.RightBracket)) {
        return Expr.Literal(Parser.NULL_VALUE);
      }

      const token = this.peek();
      if (token.getLexeme() === "if") return this.if();
      if (token.getLexeme() === "define") return this.define();
      if (token.getLexeme() === "set!") return this.set();
      if (token.getLexeme() === "let") return this.let();
      if (token.getLexeme() === "lambda") return this.lambda();
      return this.call();
    }
    return this.atom();
  }

  private match(tokenType): boolean {
    if (this.check(tokenType)) {
      this.current++;
      return true;
    }
    return false;
  }

  private check(tokenType): boolean {
    return this.peek().getTokenType() === tokenType;
  }

  private call() {
    const callee = this.expression();
    const args = [];
    while (!this.match(TokenType.RightBracket)) {
      args.push(this.expression());
    }
    return Expr.Call(callee, args);
  }

  private if(): IfExpr {
    this.advance(); // move past the "if" token
    const test = this.expression();
    const consequent = this.expression();
    let alternative;
    if (!this.match(TokenType.RightBracket)) {
      alternative = this.expression();
    }
    this.consume(TokenType.RightBracket);
    return Expr.If(test, consequent, alternative);
  }

  private consume(tokenType) {
    if (this.check(tokenType)) {
      return this.advance();
    }
    throw new SyntaxError(
      `Unexpected token ${this.previous().getTokenType()}, expected ${tokenType}`
    );
  }

  private previous() {
    return this.tokens[this.current - 1];
  }

  private atom(): SymbolExpr | LiteralExpr {
    switch (true) {
      case this.match(TokenType.Symbol):
        return Expr.Symbol(this.previous());
      case this.match(TokenType.Number):
      case this.match(TokenType.String):
      case this.match(TokenType.Boolean):
        return Expr.Literal(this.previous().getLiteral());
      default:
        throw new SyntaxError(
          `Unexpected token: ${this.peek().getTokenType()}`
        );
    }
  }

  private advance(): Token {
    return this.tokens[this.current++];
  }

  private define(): DefineExpr {
    this.advance(); // move past the "define" token
    const name = this.consume(TokenType.Symbol);
    const value = this.expression();
    this.consume(TokenType.RightBracket);
    return Expr.Define(name, value);
  }

  private set(): SetExpr {
    this.advance(); // move past the "set!" token
    const name = this.consume(TokenType.Symbol);
    const value = this.expression();
    this.consume(TokenType.RightBracket);
    return Expr.Set(name, value);
  }

  let() {
    this.advance(); // move past the "let" token
    this.consume(TokenType.LeftBracket);

    const bindings = [];
    while (!this.match(TokenType.RightBracket)) {
      bindings.push(this.letBinding());
    }

    const body = [];
    while (!this.match(TokenType.RightBracket)) {
      body.push(this.expression());
    }

    return new LetExpr(bindings, body);
  }

  letBinding() {
    this.consume(TokenType.LeftBracket);
    const name = this.consume(TokenType.Symbol);
    const value = this.expression();
    this.consume(TokenType.RightBracket);
    return new LetBindingNode(name, value);
  }

  lambda(): LambdaExpr {
    this.advance(); // move past the "lambda" token
    this.consume(TokenType.LeftBracket);

    const params: Token[] = [];
    while (!this.match(TokenType.RightBracket)) {
      params.push(this.consume(TokenType.Symbol));
    }

    const body: Expr[] = [];
    while (!this.match(TokenType.RightBracket)) {
      body.push(this.expression());
    }

    return new LambdaExpr(params, body);
  }
}
