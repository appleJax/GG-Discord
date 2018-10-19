export const PREFIX = 'gg!';

export const Colors = {
  BLUE: '#1DA1F2',
  GREEN: '#008140',
  RED: '#CA0401',
};

export function commandNotFound(command) {
  let notFound = `sorry, I don't understand that command: \`${command}\`\n`;
  notFound += `Use \`${PREFIX}help\` to see a list of all my commands.`;
  return notFound;
}

export function parseInput(msg) {
  const args = msg.content.substr(PREFIX.length).split(/\s+/);
  const command = args.shift().toLowerCase();
  return [command, args];
}

export function shouldIgnore(msg) {
  return !msg.content.startsWith(PREFIX) || msg.author.bot;
}
