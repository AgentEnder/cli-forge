import{getEnvironmentProvider as e,getFileSystemProvider as t}from"./chunk-qYV-o7uy.js";function n(e){return e.replace(/[^a-zA-Z0-9_]/g,`_`)}function r(e){let t=`_${n(e)}_completions`;return`${t}() {
  local cur_word args
  cur_word="\${COMP_WORDS[COMP_CWORD]}"
  args=("\${COMP_WORDS[@]:1:\$COMP_CWORD}")

  local completions
  completions="$("${e}" --get-completions "\${args[@]}" 2>/dev/null)"

  COMPREPLY=($(compgen -W "$completions" -- "$cur_word"))
}
complete -F ${t} "${e}"`}function i(e){let t=`_${n(e)}_completions`;return`${t}() {
  local completions
  completions=("\${(@f)$("${e}" --get-completions "\${words[@]:1}" 2>/dev/null)}")
  compadd -- $completions
}
compdef ${t} "${e}"`}function a(e){return`complete -c "${e}" -f -a '("${e}" --get-completions (commandline -cop)[2..] 2>/dev/null)'`}function o(e){return`Register-ArgumentCompleter -CommandName "${e}" -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $args = $commandAst.ToString().Split() | Select-Object -Skip 1
  $completions = & "${e}" --get-completions @args 2>$null
  $completions -split '\\n' | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
  }
}`}function s(e,n,r,i,a=!1){let o=t(),s=`# cli-forge completion for ${i}`;if(a)return o.writeFileSync(n,`${s}\n${r}\n`),{shell:e,file:n,action:`created`};if(!o.existsSync(n)||o.readFileSync(n).includes(s))return{shell:e,file:n,action:`skipped`};let c=`\n${s}\n${r}\n${s} end\n`;return o.appendFileSync(n,c),{shell:e,file:n,action:`appended`}}async function c(n){let c=t(),l=e(),u=l.getEnv(`HOME`)??l.getEnv(`USERPROFILE`)??`/`,d=[],f=c.join(u,`.bashrc`);d.push(s(`bash`,f,r(n),n));let p=c.join(u,`.zshrc`);d.push(s(`zsh`,p,i(n),n));let m=c.join(u,`.config`,`fish`,`completions`),h=c.join(m,`${n}.fish`);c.existsSync(c.join(u,`.config`,`fish`))&&(c.existsSync(m)||c.mkdirSync(m,{recursive:!0}),d.push(s(`fish`,h,a(n),n,!0)));let g=c.join(u,`Documents`,`PowerShell`,`Microsoft.PowerShell_profile.ps1`);c.existsSync(c.dirname(g))&&d.push(s(`PowerShell`,g,o(n),n)),console.log(`Shell completion installation results:`);for(let e of d)console.log(`  ${e.shell}: ${e.action} (${e.file})`);d.every(e=>e.action===`skipped`)?console.log(`
No shell config files detected. You can manually source the completion scripts.`):console.log(`
Restart your shell or source the updated config to enable completions.`)}export{c as installCompletionScripts};