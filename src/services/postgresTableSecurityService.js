const PUBLIC_API_ROLES = ["anon", "authenticated"];

export function buildPostgresTableSecurityStatements(tableName) {
  const table = quoteIdentifier(tableName);
  const revokeStatements = PUBLIC_API_ROLES.map((role) => `
  IF to_regrole('${role}') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE ${table} FROM ${role}';
  END IF;`).join("");

  return [
    `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`,
    `DO $stockflix_security$
BEGIN${revokeStatements}
END
$stockflix_security$`,
  ];
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}
