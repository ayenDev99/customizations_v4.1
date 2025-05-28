<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Specify the root directory where the images will be stored
    $rootDirectory = 'C:/Program Data/Retail Pro/PRESCRIPTIONS/';
    $uploadDir = isset($_POST["uploadDirectory"]) ? $_POST["uploadDirectory"] : $rootDirectory;

    return print_r($uploadDir);

    // Check if it does not end with a slash and add it if not present
    if (!empty($uploadDir) && substr($uploadDir, -1) !== '/') {
        $uploadDir .= '/';
    }
    
    // Get the <CustomerID> (you need to replace this with your actual logic)
    $customerId = $_POST['customerId']; // Replace with your actual method of obtaining the customer ID

    // Create a directory for the customer if it doesn't exist
    $customerDirectory = $rootDirectory . $customerId . '/';
    if (!file_exists($customerDirectory)) {
        mkdir($customerDirectory, 0777, true);
    }

    // Get the uploaded file
    $file = $_FILES["imageFile"];
    $targetFile = $customerDirectory . basename($file["name"]);

    // Define allowed file types (you can customize this array)
    $allowedFileTypes = array("jpg", "jpeg", "png", "gif");

    // Get the file extension
    $fileExtension = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));

    // Check if the file type is allowed
    if (in_array($fileExtension, $allowedFileTypes)) {
        if (move_uploaded_file($file["tmp_name"], $targetFile)) {
            $response = ["success" => true, "fileName" => $file["name"]];
            echo json_encode($response);
        } else {
            $response = ["success" => false, "error" => "Failed to upload file"];
            echo json_encode($response);
        }
    } else {
        $response = ["success" => false, "error" => "Invalid file type. Allowed types: jpg, jpeg, png, gif"];
        echo json_encode($response);
    }
}

// Function to validate the CustomerID (you should replace this with your actual validation logic)
function isValidCustomerId($customerId) {
    // Add your validation logic here
    return true; // Return true if it's valid, otherwise return false
}
?>
