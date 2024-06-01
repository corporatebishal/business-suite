<?php
    // start session
    session_start();

    // include the database connection file
    include("connect_db.php");

    // check if user is already logged in
    if(isset($_SESSION["user_id"])) {
        // redirect to dashboard
        header("Location: dash/index.php");
        exit();
    }

    // initialize variables
    $email = "";
    $password = "";
    $error = "";

    // check if login form is submitted
    if($_SERVER["REQUEST_METHOD"] == "POST") {
        // get email and password from form
        $email = $_POST["email"];
        $password = md5($_POST["password"]);

        // check if email and password match in database
        $stmt = $conn->prepare("SELECT * FROM users WHERE user_name=? AND password=?");
        $stmt->bind_param("ss", $email, $password);
        $stmt->execute();
        $result = $stmt->get_result();

        if($result->num_rows == 1) {
            // set session variables
            $row = $result->fetch_assoc();
            $_SESSION["user_id"] = $row["user_id"];
            $_SESSION["full_name"] = $row["full_name"];

            // redirect to dashboard
            header("Location: dash/index.php");
            exit();
        } else {
            // display error message
            $error = "Incorrect email or password";
        }
    }
?>

<!DOCTYPE html>
<html>
<head>
    <title>Login Page</title>
	<link rel="stylesheet" type="text/css" href="style.css">

</head>
<body>
    <h1>Login Page</h1>
    <form method="POST" action="">
        <label for="email">Email Address:</label>
        <input type="email" name="email" id="email" value="<?php echo $email; ?>" required>
        <br>
        <label for="password">Password:</label>
        <input type="password" name="password" id="password" required>
        <br>
        <button type="submit">Login</button>
    </form>
    <?php if($error != "") { ?>
        <p><?php echo $error; ?></p>
    <?php } ?>
</body>
</html>
