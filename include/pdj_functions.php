<?php

function pdjCurrentUser()
{
    return arrayGet($_SESSION, "pdj_user");
}

function pdjCurrentUsername()
{
    return arrayGet($_SESSION, "pdj_user.Username");
}

function pdjCurrentUserId()
{
    return arrayGet($_SESSION, "pdj_user.UserID");
}

function pdjSetUser($user)
{
    $user["ASPXAUTH"] = getAspxAuthCookie();
    return $_SESSION["pdj_user"] = $user;
}

function getAspxAuthCookie()
{
    $headers = getallheaders();
    if(!$cookies = @$headers["Cookie"]) return null;
    
    $aspxAuth = substringAfter($cookies, ".ASPXAUTH=");
    $aspxAuth = substringBefore($aspxAuth, ";");

    return $aspxAuth;
}

function pdjUserLogout()
{
    unset($_SESSION["pdj_user"]);
}

function getRecipeUrl($id)
{
    if(!$id) return;

    if(getConfig("debug.offline"))
    {
        $url = getConfig("api.pdj.offline.recipeDetails");
        return toAbsoluteUrl($url);
    }

    $pdjApiRoot = getConfig("api.pdj.url");
    $url = getConfig("api.pdj.recipeDetails");
    $proxy = getConfig("api.proxy");
    if($proxy && isExternalUrl($pdjApiRoot))
      $pdjApiRoot = combine($proxy, $pdjApiRoot);

    $url = combine($pdjApiRoot, $url) . $id;

    return toAbsoluteUrl($url);
}

function getRecipeDetail($recipeid)
{
    if(!$recipeid) return;

    $url = getRecipeUrl($recipeid);
    debug("getRecipeUrl", $url);
    $cookie = array();
    $pdjUser = pdjCurrentUser();
    if(isset($pdjUser["ASPXAUTH"]))
        $cookie[".ASPXAUTH"] = $pdjUser["ASPXAUTH"];
    $json = curlGet($url, null, null, null, $cookie); //TODO: for private recipes: forward .net cookie
    debug("json", !!$json);
    if(!$json) return;

    //parse JSON
    $data = json_decode($json);
    $data = objToArray($data, false, false, true);
    $recipe = arrayGet($data, "Data");

    return $recipe;
}

function errorMessage($msg)
{
    global $response;
    $response["post"] = $_POST;
    $response["message"] = $msg;
    $response["time"] = getTimer(true);
    die(jsValue($response, true));
}

//process uploaded file
//store in destination
function processUpload($file, $subdir)
{
    $tmpFile = $file["tmp_name"];
    $mimeType = $file["type"];
    $filename = utf8_decode($file["name"]);
    $filename = cleanupFilename($filename);

    $getcwd=getcwd();
    $freeSpace=disk_free_space("/");

    $uploaded = is_uploaded_file($tmpFile);
    $message="OK";
    if(!$uploaded)
        return errorMessage("Uploaded file not found.");
    //verify file type
    if(!startsWith($mimeType, "image"))
        return errorMessage("Uploaded file $filename is not an image. ($mimeType)");

    //move file to destination dir
    $dataRoot = getConfig("upload._diskPath");
    $dataRootUrl = getConfig("upload.baseUrl");
    $uploadDir  = combine($dataRoot, $subdir);
    
    //first image uploaded in dir will be called id.jpg
    $setMain = !is_dir($uploadDir);

    createDir($dataRoot, $subdir);
    $uploadedFile = combine($dataRoot, $subdir, $filename);
    $filesize = filesize($tmpFile);
    $success = move_uploaded_file($tmpFile, $uploadedFile);
    debug("move to $uploadedFile", $success);
    if(!$success)
        return errorMessage("Cannot move file into target dir.");

    $result = processImage($uploadDir, $filename);

    if($setMain)
    {
        $recipeId = substringAfterLast($subdir, "/");
        $result["main"] = setImageAsMain($uploadDir, $filename, $recipeId);
    }
    return $result;
}

//process image in data folder: extract metadata, resize
function processImage($uploadDir, $filename)
{
    $uploadedFile = combine($uploadDir, $filename);
    //save exif data
    $message =  "File uploaded.";
    $exif = getImageMetadata($uploadedFile);
    $dateTaken = getExifDateTaken($uploadedFile, $exif);
    if(!$dateTaken)     $dateTaken = getIptcDate($exif);
    if(!$dateTaken)   $dateTaken = getFileDate($uploadedFile);
    $exif["dateTaken"]  = $dateTaken;

    $description = arrayGetCoalesce($exif, "ImageDescription", "IPTC.Caption");
    $description = trim($description);

    writeCsvFile("$uploadedFile.txt", $exif);
    writeTextFile("$uploadedFile.js", jsValue($exif));

    //resize images and keep hd version
    $sizes = getConfig("thumbnails.sizes");
    $resized = resizeMultiple($uploadDir, $filename, $sizes);
    $keep = getConfig("thumbnails.keep");
    if($keep)
    {
        moveFile("$uploadDir/.$keep", $filename, $uploadDir);
        deleteDir("$uploadDir/.$keep");
        unset($resized[$keep]);
    }
    if($dateTaken)
        setFileDate($uploadedFile, $dateTaken);

    $vars = get_defined_vars();
    $result = array();
//    $exif["meal"] = selectMeal($dateTaken);
//    $result["_exif"] = $exif;
    $result["success"] = true;
    return addVarsToArray($result, "filename filesize mimeType dateTaken description", $vars);
}


//is current user owner of recipe
function isOwner($path)
{
    // /RecipeImages/1/34/34.jpg
    $patharr = explode("/", $path);
    $recipeId = array_pop($patharr);
    $recipeUserId = array_pop($patharr);

    $pdjUser = pdjCurrentUser();
    return $pdjUser["UserID"] == $recipeUserId;
}

function deleteImage($relPath, $file)
{
    $message = "deleting file $relPath/$file";
    $result = deleteFile($relPath, $file);

    //delete thumbnails
    $tnsizes = getConfig("thumbnails.sizes");
    foreach($tnsizes as $dir => $size)
    {
        $message .= " deleting file .$dir/$file";
        $result += deleteFile("$relPath/.$dir", $file);
    }
    return $result;
}

function renameImage($relPath, $file, $newName)
{
    $message = " Renaming file $relPath/$file to $newName.";
    $result = renameFile($relPath, $file, $newName);

    //rename thumbnails
    $tnsizes = getConfig("thumbnails.sizes");
    foreach($tnsizes as $dir => $size)
    {
        $message .= " renaming file .$dir/$file";
        $result += renameFile("$relPath/.$dir", $file, $newName);
    }
    return $result;
}

function setImageAsMain($relPath, $file, $newName)
{
    $message = " Copying file $relPath/$file to $newName.";
    $result = copyFile($relPath, $file, $relPath, $newName);

    //rename thumbnails
    $tnsizes = getConfig("thumbnails.sizes");
    foreach($tnsizes as $dir => $size)
    {
        $message .= " renaming file .$dir/$file";
        $result += copyFile("$relPath/.$dir", $file, "$relPath/.$dir", $newName);
    }
    return $result;
}


?>