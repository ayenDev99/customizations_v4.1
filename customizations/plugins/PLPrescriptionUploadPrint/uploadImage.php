<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    $uploadDir = $_POST["uploadDirectory"];
    $uploadDir = $_SERVER['DOCUMENT_ROOT'] . $uploadDir;
    
    // Check if it does not end with a slash and add it if not present
    if (!empty($uploadDir) && substr($uploadDir, -1) !== '/') {
        $uploadDir .= '/';
    }

    // Ensure the directory exists, create it if not
    $customerId = $_POST['customerId'];
    $uploadDir = $uploadDir . $customerId . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $response = ["success" => true, "fileName" => []]; // Initialize the response with an empty array

    // Flag to track whether an error occurred
    $errorOccurred = false;

    // Variable to store the names of successfully uploaded files
    $uploadedFiles = [];

    // Loop through each uploaded file
    foreach ($_FILES["imageFiles"]["error"] as $key => $error) {
        if ($error == UPLOAD_ERR_OK) {
            $file = $_FILES["imageFiles"]["name"][$key];
            $tmpFilePath = $_FILES["imageFiles"]["tmp_name"][$key];

            // Define allowed file types (you can customize this array)
            $allowedFileTypes = array("jpg", "jpeg", "png", "gif");

            // Get the file extension
            $fileExtension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

            // Check if the file type is allowed
            if (in_array($fileExtension, $allowedFileTypes)) {
                $targetFile = $uploadDir . basename($file);

                if (move_uploaded_file($tmpFilePath, $targetFile)) {
                    $uploadedFiles[] = $file;
                } else {
                    $response["success"] = false;
                    $response["error"] = "Failed to upload file: " . $file;
                    $errorOccurred = true; // Set the error flag
                    break; // Exit the loop on the first error
                }
            } else {
                $response["success"] = false;
                $response["error"] = "Invalid file type. Allowed types: jpg, jpeg, png, gif";
                $errorOccurred = true; // Set the error flag
                break; // Exit the loop on the first error
            }
        }
    }

    // If an error occurred, delete all successfully uploaded files
    if ($errorOccurred) {
        foreach ($uploadedFiles as $uploadedFile) {
            $targetFile = $uploadDir . $uploadedFile;
            unlink($targetFile); // Delete the file
        }
    } else {
        // If no error occurred, set the response's "fileName" field to the array of uploaded filenames
        $response["fileName"] = $uploadedFiles;
    }

    // Send the response as JSON
    echo json_encode($response);
}
?>
