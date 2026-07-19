#!/usr/bin/env node

import bcrypt from "bcryptjs";
import readline from "node:readline";

const minimumPasswordLength = 10;
const bcryptCostFactor = 12;

if (process.argv.length > 2) {
  console.error("Do not pass the password as a command-line argument.");
  process.exit(1);
}

function createHiddenPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true
  });

  const originalWriteToOutput = rl._writeToOutput;
  let muted = false;

  rl._writeToOutput = function writeToOutput(value) {
    if (muted) {
      rl.output.write("*");
      return;
    }

    originalWriteToOutput.call(rl, value);
  };

  async function question(prompt) {
    muted = true;
    const answer = await new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
    muted = false;
    rl.output.write("\n");

    return answer;
  }

  return {
    close: () => rl.close(),
    question
  };
}

const prompt = createHiddenPrompt();

try {
  let password = await prompt.question("Development admin password: ");
  let confirmation = await prompt.question("Confirm development admin password: ");

  if (password.length < minimumPasswordLength) {
    console.error(`Password must be at least ${minimumPasswordLength} characters.`);
    process.exitCode = 1;
  } else if (password !== confirmation) {
    console.error("Password confirmation does not match.");
    process.exitCode = 1;
  } else {
    const hash = await bcrypt.hash(password, bcryptCostFactor);
    process.stdout.write(`${hash}\n`);
  }

  password = "";
  confirmation = "";
} finally {
  prompt.close();
}
