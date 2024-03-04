import { format } from "date-fns/format";
import clc from "cli-color";

const BRACKET_MESSAGE = clc.xterm(240);
const LEFT_BRACKET = BRACKET_MESSAGE("[");
const RIGHT_BRACKET = BRACKET_MESSAGE("]");

const date = () => format(new Date(), "dd MMM yyyy");
const time = () => format(new Date(), "hh':'mm':'ss");
const at = `${clc.white(" @ ")}`;

const prefix = () => `${LEFT_BRACKET}${date()}${at}${time()}${RIGHT_BRACKET}`;

const log = (message: string) =>
  console.log(`${prefix()} ${clc.white(message)}`);
const error = (message: string) =>
  console.error(`${prefix()} ${clc.red(message)}`);

export const logger = {
  log,
  error
};
