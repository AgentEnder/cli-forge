let fs: typeof import('fs') | undefined;
let os: typeof import('os') | undefined;
let path: typeof import('path') | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  os = require('os');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  path = require('path');
} catch {
  // Running in a browser environment — completion scripts are unavailable.
}

function sanitizeName(cliName: string): string {
  return cliName.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Generates a bash completion script for the given CLI name.
 */
export function bashCompletionScript(cliName: string): string {
  const funcName = `_${sanitizeName(cliName)}_completions`;
  return `${funcName}() {
  local cur_word args
  cur_word="\${COMP_WORDS[COMP_CWORD]}"
  args=("\${COMP_WORDS[@]:1:\$COMP_CWORD}")

  local completions
  completions="$("${cliName}" --get-completions "\${args[@]}" 2>/dev/null)"

  COMPREPLY=($(compgen -W "$completions" -- "$cur_word"))
}
complete -F ${funcName} "${cliName}"`;
}

/**
 * Generates a zsh completion script for the given CLI name.
 */
export function zshCompletionScript(cliName: string): string {
  const funcName = `_${sanitizeName(cliName)}_completions`;
  return `${funcName}() {
  local completions
  completions=("\${(@f)$("${cliName}" --get-completions "\${words[@]:1}" 2>/dev/null)}")
  compadd -- $completions
}
compdef ${funcName} "${cliName}"`;
}

/**
 * Generates a fish completion script for the given CLI name.
 */
export function fishCompletionScript(cliName: string): string {
  return `complete -c "${cliName}" -f -a '("${cliName}" --get-completions (commandline -cop)[2..] 2>/dev/null)'`;
}

/**
 * Generates a PowerShell completion script for the given CLI name.
 */
export function powershellCompletionScript(cliName: string): string {
  return `Register-ArgumentCompleter -CommandName "${cliName}" -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $args = $commandAst.ToString().Split() | Select-Object -Skip 1
  $completions = & "${cliName}" --get-completions @args 2>$null
  $completions -split '\\n' | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
  }
}`;
}

interface InstallResult {
  shell: string;
  file: string;
  action: 'created' | 'appended' | 'skipped';
}

function installForShell(
  shell: string,
  file: string,
  script: string,
  cliName: string,
  overwrite = false
): InstallResult {
  if (!fs) throw new Error('Shell completion installation is not available in this environment.');
  const marker = `# cli-forge completion for ${cliName}`;

  if (overwrite) {
    // For fish, write the whole file (each CLI gets its own file)
    fs.writeFileSync(file, `${marker}\n${script}\n`);
    return { shell, file, action: 'created' };
  }

  if (!fs.existsSync(file)) {
    return { shell, file, action: 'skipped' };
  }

  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes(marker)) {
    return { shell, file, action: 'skipped' };
  }

  const block = `\n${marker}\n${script}\n${marker} end\n`;
  fs.appendFileSync(file, block);
  return { shell, file, action: 'appended' };
}

/**
 * Auto-detect available shells and install completion scripts.
 */
export async function installCompletionScripts(
  cliName: string
): Promise<void> {
  if (!os || !path || !fs) throw new Error('Shell completion installation is not available in this environment.');
  const home = os.homedir();
  const results: InstallResult[] = [];

  // Bash: ~/.bashrc
  const bashrc = path.join(home, '.bashrc');
  results.push(
    installForShell('bash', bashrc, bashCompletionScript(cliName), cliName)
  );

  // Zsh: ~/.zshrc
  const zshrc = path.join(home, '.zshrc');
  results.push(
    installForShell('zsh', zshrc, zshCompletionScript(cliName), cliName)
  );

  // Fish: ~/.config/fish/completions/<cliName>.fish
  const fishDir = path.join(home, '.config', 'fish', 'completions');
  const fishFile = path.join(fishDir, `${cliName}.fish`);
  if (fs.existsSync(path.join(home, '.config', 'fish'))) {
    if (!fs.existsSync(fishDir)) {
      fs.mkdirSync(fishDir, { recursive: true });
    }
    results.push(
      installForShell(
        'fish',
        fishFile,
        fishCompletionScript(cliName),
        cliName,
        true
      )
    );
  }

  // PowerShell: check for profile directory
  const psProfile = path.join(
    home,
    'Documents',
    'PowerShell',
    'Microsoft.PowerShell_profile.ps1'
  );
  if (fs.existsSync(path.dirname(psProfile))) {
    results.push(
      installForShell(
        'PowerShell',
        psProfile,
        powershellCompletionScript(cliName),
        cliName
      )
    );
  }

  // Report
  console.log('Shell completion installation results:');
  for (const r of results) {
    console.log(`  ${r.shell}: ${r.action} (${r.file})`);
  }
  if (results.every((r) => r.action === 'skipped')) {
    console.log(
      '\nNo shell config files detected. You can manually source the completion scripts.'
    );
  } else {
    console.log(
      '\nRestart your shell or source the updated config to enable completions.'
    );
  }
}
