import{getEnvironmentProvider as f,getFileSystemProvider as m}from"./chunk-OkmEJUY9.js";function u(o){return o.replace(/[^a-zA-Z0-9_]/g,"_")}function d(o){const n=`_${u(o)}_completions`;return`${n}() {
  local cur_word args
  cur_word="\${COMP_WORDS[COMP_CWORD]}"
  args=("\${COMP_WORDS[@]:1:$COMP_CWORD}")

  local completions
  completions="$("${o}" --get-completions "\${args[@]}" 2>/dev/null)"

  COMPREPLY=($(compgen -W "$completions" -- "$cur_word"))
}
complete -F ${n} "${o}"`}function h(o){const n=`_${u(o)}_completions`;return`${n}() {
  local completions
  completions=("\${(@f)$("${o}" --get-completions "\${words[@]:1}" 2>/dev/null)}")
  compadd -- $completions
}
compdef ${n} "${o}"`}function g(o){return`complete -c "${o}" -f -a '("${o}" --get-completions (commandline -cop)[2..] 2>/dev/null)'`}function S(o){return`Register-ArgumentCompleter -CommandName "${o}" -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $args = $commandAst.ToString().Split() | Select-Object -Skip 1
  $completions = & "${o}" --get-completions @args 2>$null
  $completions -split '\\n' | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
    [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
  }
}`}function p(o,n,r,t,e=!1){const s=m(),c=`# cli-forge completion for ${t}`;if(e)return s.writeFileSync(n,`${c}
${r}
`),{shell:o,file:n,action:"created"};if(!s.existsSync(n))return{shell:o,file:n,action:"skipped"};if(s.readFileSync(n).includes(c))return{shell:o,file:n,action:"skipped"};const i=`
${c}
${r}
${c} end
`;return s.appendFileSync(n,i),{shell:o,file:n,action:"appended"}}async function C(o){const n=m(),r=f(),t=r.getEnv("HOME")??r.getEnv("USERPROFILE")??"/",e=[],s=n.join(t,".bashrc");e.push(p("bash",s,d(o),o));const c=n.join(t,".zshrc");e.push(p("zsh",c,h(o),o));const i=n.join(t,".config","fish","completions"),a=n.join(i,`${o}.fish`);n.existsSync(n.join(t,".config","fish"))&&(n.existsSync(i)||n.mkdirSync(i,{recursive:!0}),e.push(p("fish",a,g(o),o,!0)));const $=n.join(t,"Documents","PowerShell","Microsoft.PowerShell_profile.ps1");n.existsSync(n.dirname($))&&e.push(p("PowerShell",$,S(o),o)),console.log("Shell completion installation results:");for(const l of e)console.log(`  ${l.shell}: ${l.action} (${l.file})`);e.every(l=>l.action==="skipped")?console.log(`
No shell config files detected. You can manually source the completion scripts.`):console.log(`
Restart your shell or source the updated config to enable completions.`)}export{C as installCompletionScripts};
