  # Grammar definition:

  # G = ({a, b, c}, {S}, P, S);

  # P = [
  #   S -> eps | abS | Sbc
  # ];

defmodule Lab1 do
  @terminals ["a", "b", "c"]
  @nonterminals ["S"]
  @start "S"
  @rules %{
    "S" => ["", "abS", "Scb"],
  }

  def inGrammar?(str, depth) when is_binary(str) do
    _inGrammar? "", @start, str, depth
  end

  defp _inGrammar?(prev, acc, str, _depth) when prev <> acc == str do
    true
  end

  defp _inGrammar?(prev, << head :: utf8, tail :: binary >>, str, depth) when <<head>> in @nonterminals and depth != 0 do 
    Enum.reduce(@rules[<<head>>], false, fn x, a -> _inGrammar?(prev, x <> tail, str, depth - 1) or a end)
  end

  defp _inGrammar?(prev, << head :: utf8, tail :: binary >>, str, depth) when <<head>> in @terminals and depth != 0 do
    _inGrammar?(prev <> <<head>>, tail, str, depth - 1)
  end

  defp _inGrammar?(_prev, _acc, _str, _depth) do
    false
  end

end
