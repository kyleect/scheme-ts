import { Expr, Parser } from "./parser";
import { Scanner } from "./scanner";
import { Token } from "./token";

describe("Parser", () => {
  it("should return literal expression for bracket pair", () => {
    expectInputReturns("()", [Expr.Literal([])]);
  });

  it("should return expressions for nested calls", () => {
    expectInputReturns("(+ (+ 1 2) (+ 3 4))", [
      Expr.Call(Expr.Symbol(Token.Symbol("+")), [
        Expr.Call(Expr.Symbol(Token.Symbol("+")), [
          Expr.Literal(1),
          Expr.Literal(2),
        ]),
        Expr.Call(Expr.Symbol(Token.Symbol("+")), [
          Expr.Literal(3),
          Expr.Literal(4),
        ]),
      ]),
    ]);
  });

  it("should return expressions for if", () => {
    expectInputReturns("(if (> 2 1) 3 4)", [
      Expr.If(
        Expr.Call(
          Expr.Symbol(Token.Symbol(">")),
          [
            Expr.Literal(2),
            Expr.Literal(1),
          ]
        ),
        Expr.Literal(3),
        Expr.Literal(4)
      ),
    ]);
  });

  it("should throw for unmatched bracket", () => {
    expect(() => parseInput("(()")).toThrowError(
      new SyntaxError(`Unexpected token: ${Token.Eof().getTokenType()}`)
    );
  });

  it("should throw for unmatched right bracket", () => {
    expect(() => parseInput(")")).toThrowError(
      new SyntaxError(`Unexpected token: ${Token.RightBracket().getTokenType()}`)
    );
  });
});

function parseInput(input: string): Expr[] {
  const scanner = new Scanner(input);
  const tokens = scanner.scan();
  const parser = new Parser(tokens);

  const expressions = parser.parse();

  return expressions;
}

function expectInputReturns(input: string, expectedOutput: Expr[]) {
  expect(parseInput(input)).toStrictEqual(expectedOutput);
}
