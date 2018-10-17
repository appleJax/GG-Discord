export const PREFIX = 'gg!';

export function parseInput(msg) {
  const args = msg.content.substr(PREFIX.length).split(/\s+/);
  const command = args.shift().toLowerCase();
  return [command, args];
}

export function shouldIgnore(msg) {
  return !msg.content.startsWith(PREFIX) || msg.author.bot;
}
