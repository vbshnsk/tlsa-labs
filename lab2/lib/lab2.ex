defmodule Lab2 do
  @priorities %{
    "while" => 0,
    "-" => 3,
    "+" => 3,
    ">=" => 2,
    "<=" => 2,
    "<" => 2,
    ">" => 2,
    "=" => 1,
    "int" => 4
  }
  @operators ["-", "+", ">=", "<=", "<", ">", "=", "int"]

  def transform(str, path \\ "res.txt") when is_binary(str) do
    res = transform(String.split(str, " "), [], [])
    |> Enum.join(" ");
    File.write(path, res);
  end

  defp transform([s | tail], accum, opstack) when s in @operators do
    {higher, lower} = Enum.split_with(opstack, &(priority(&1, s)))
    transform(tail, Enum.concat(Enum.reverse(higher), accum), [s | lower])
  end

  defp transform(["while" | tail], accum, opstack) do
    transform(tail, accum, ["while" | opstack])
  end

  defp transform(["do" | tail], accum, opstack) do
    {operators, others} = Enum.split_while(opstack, &(&1 != "while"))
    transform(tail, Enum.concat(Enum.reverse(operators), accum), others)
  end

  defp transform(["end" | tail], accum, opstack) do
    {operators, others} = Enum.split_while(opstack, &(&1 != "do"))
    transform(tail, Enum.concat(Enum.reverse(operators), accum), others)
  end


  defp transform([s | tail], accum, opstack) do
    transform(tail, [s | accum], opstack)
  end


  defp transform([], accum, opstack) do
    opstack
    |> Enum.reverse()
    |> Enum.concat(accum)
    |> Enum.reverse()
  end

  defp priority(op1, op2) do
    @priorities[op1] >= @priorities[op2]
  end

end
