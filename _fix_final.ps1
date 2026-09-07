$path = 'C:\Users\User\eternitysos\src\lib\fiscal\focusnfe.ts'
$c = [System.IO.File]::ReadAllText($path)

# Fix the comment - replace Bearer with Basic Auth
$c = $c -replace "Bearer Token .Authorization: Bearer . access_token.. O access_token e obtido.*", "Basic Auth estrito: Authorization: Basic base64(token + colon). O token e o username, senha fica vazia. Gerado no painel FocusNFe - API - Token de Acesso."

# Fix the function body
$c = $c -replace "return .Bearer . . token;", "return 'Basic ' + Buffer.from(token + ':').toString('base64')"

# Fix function name back to basicAuth
$c = $c -replace "function bearerAuth", "function basicAuth"

# Fix all call sites
$c = $c -replace "bearerAuth(", "basicAuth("

[System.IO.File]::WriteAllText($path, $c)
Write-Output "File updated successfully"
