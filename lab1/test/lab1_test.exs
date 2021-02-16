defmodule Lab1Test do
  use ExUnit.Case
  doctest Lab1

  test "'abcb' is in grammar" do
    assert Lab1.inGrammar?("abcb", 10) == true
  end

  test "'ab' is in grammar" do
    assert Lab1.inGrammar?("ab", 10) == true
  end

  test "'ababcb' is in grammar" do
    assert Lab1.inGrammar?("ababcb", 10) == true
  end

  test "'cb' is in grammar" do
    assert Lab1.inGrammar?("cb", 10) == true
  end

  test "empty string is in grammar" do
    assert Lab1.inGrammar?("", 10) == true
  end

  test "'rubbish' is not in grammar" do
    assert Lab1.inGrammar?("rubbish", 10 )== false
  end
end
