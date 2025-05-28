<?php
// Assuming you have a database connection established
$dbHost = '127.0.0.1';
$dbUsername = 'root';
$dbPassword = 'sysadmin';
$dbName = 'rpsods';

$conn = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);

// Check database connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if it's a POST request and that the necessary data is provided
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['doctorName']) && isset($_POST['rnCheckbox']) && isset($_FILES['image'])) {
    $doctorName = $_POST['doctorName'];
    $rnCheckbox = $_POST['rnCheckbox'];
    $image = $_FILES['image'];

    // Check for file upload errors
    if ($image['error'] !== UPLOAD_ERR_OK) {
        echo "Error uploading file. Error code: " . $image['error'];
    } else {
        $uploadDir = '/path/to/upload/directory/'; // Replace with your desired path
        $uploadFile = $uploadDir . basename($image['name']);

        if (move_uploaded_file($image['tmp_name'], $uploadFile)) {
            // File uploaded successfully
            $fileName = $image['name'];

            // Insert the file name and other prescription data into the database
            $sql = "INSERT INTO prescriptions (doctorName, rnCheckbox, fileName) VALUES (?, ?, ?)";
            
            // Use prepared statements to prevent SQL injection
            if ($stmt = $conn->prepare($sql)) {
                $stmt->bind_param("sss", $doctorName, $rnCheckbox, $fileName);
                if ($stmt->execute()) {
                    echo "Prescription uploaded successfully";
                } else {
                    echo "Error executing SQL statement: " . $stmt->error;
                }
                $stmt->close();
            } else {
                echo "Error preparing SQL statement: " . $conn->error;
            }
        } else {
            echo "Error moving uploaded file.";
        }
    }
} else {
    echo "Invalid request or missing data.";
}

$conn->close();
?>
