<!doctype html>
<html>
<head>
<title>git update</title>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, target-densitydpi=device-dpi" />
<meta name="mobile-web-app-capable" content="yes" />
<link rel="stylesheet" href="../../bootstrap/css/bootstrap.css">
</head>
<body class="container">
<br/>
<pre><?php
require_once("../include/includes.php");
$gitPath = getExePath($exe="GIT", $key="_GIT");
if(!$gitPath || !file_exists($gitPath)) 
	echo "git disabled.";
else
{
	echo "\nstatus:\n";
	echo execCommand(makeCommand("[0] status", $gitPath));
	echo "\npull:\n";
	echo execCommand(makeCommand("[0] pull --rebase", $gitPath));
}
?></pre>
<a href="..">return to application</a>
</body>
</html>