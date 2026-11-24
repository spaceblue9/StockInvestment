export function normalizeStockSearchValue(value) {
  return String(value || "").trim().toUpperCase().replace(/\.BK$/u, "");
}

export function parseStockSearchTokens(value) {
  return [...new Set(
    normalizeStockSearchValue(value)
      .split(/[\s,;]+/u)
      .map((token) => normalizeStockSearchValue(token))
      .filter(Boolean),
  )];
}

export function createStockSearchMatcher(rows, value) {
  const tokens = parseStockSearchTokens(value);
  const availableSymbols = new Set(rows.map((row) => normalizeStockSearchValue(row.Symbol)).filter(Boolean));
  const exactSymbolTokens = tokens.filter((token) => availableSymbols.has(token));
  const textTokens = tokens.filter((token) => !availableSymbols.has(token));

  return {
    tokens,
    exactSymbolTokens,
    textTokens,
    matches(row) {
      if (!tokens.length) return true;

      const symbol = normalizeStockSearchValue(row.Symbol);
      if (exactSymbolTokens.includes(symbol)) return true;
      if (!textTokens.length) return false;

      const searchableText = [row.Symbol, row.Name, row.Company, row.Company_Name, row.Security_Name]
        .map((item) => normalizeStockSearchValue(item))
        .filter(Boolean)
        .join(" ");
      return textTokens.every((token) => searchableText.includes(token));
    },
  };
}
