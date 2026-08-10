export interface Config {
  delimiter: string;
  pretty: boolean;
  maxRows: number;
}

export function parseConfig(
  args: string[],
  env: Record<string, string>,
): Config {
  const delimiter =
    flagValue(args, "--delimiter") ?? env.CSV2JSON_DELIMITER ?? ",";
  const pretty = args.includes("--pretty");
  const maxRows = Number(flagValue(args, "--max-rows") ?? "10000");
  return { delimiter, pretty, maxRows };
}

function flagValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}
