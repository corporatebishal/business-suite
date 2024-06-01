<?php
    // start session
    session_start();

    // check if user is not logged in
    if(!isset($_SESSION["user_id"])) {
        // redirect to login page
        header("Location: /index.php");
        exit();
    }

    // include the database connection file
    include("../connect_db.php");

    // retrieve user's full name and user ID from session variables
    $user_id = $_SESSION["user_id"];
	$user_name=$_SESSION["user_name"];

    // retrieve the company ID and user name for the current user from the users table
    $stmt = $conn->prepare("SELECT company_id, user_name FROM users WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if($result->num_rows == 1) {
        // retrieve the company name and address from the company_db table
        $row = $result->fetch_assoc();
        $company_id = $row["company_id"];
        $stmt = $conn->prepare("SELECT company_name, company_address FROM company_db WHERE company_id = ?");
        $stmt->bind_param("i", $company_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if($result->num_rows == 1) {
            $row = $result->fetch_assoc();
            $company_name = $row["company_name"];
            $company_address = $row["company_address"];

            // display the company name and address on the dashboard
            $welcome_message = "Welcome $user_name";
            $company_message = "Company Name: $company_name";
            $address_message = "Company Address: $company_address";
        } else {
            $welcome_message = "Welcome $user_name";
            $company_message = "Company details not found";
            $address_message = "";
        }
    } else {
        $welcome_message = "Welcome User $user_id";
        $company_message = "Company details not found";
        $address_message = "";
    }
?>

<!DOCTYPE html>
<html>
<head>
    <title>Dashboard</title>
    <!--<link rel="stylesheet" type="text/css" href="../style.css">-->
	<link rel="stylesheet" type="text/css" href="../dash.css">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
	<!--<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>-->
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1><?php echo $company_name; ?></h1>
        </div>
        <div class="header-right">
            <p class="logged-in">Logged in as <?php echo $_SESSION["user_name"]; ?></p>
            <a href="../logout.php" class="logout">Logout</a>
        </div>
    </div>
    <div class="dashboard">
        <div class="left-container" id="menu">
    <a href="#" class="menu-item quotes">Create a New Quote</a>
	<a href="#" class="menu-item view_quotes">View Quotes</a>
    <a href="#" class="menu-item invoices">Create an Invoice</a>
    <a href="#" class="menu-item profile">Update Company Profile</a>
    <a href="#" class="menu-item services">Update Services</a>
</div>

        <div class="center-container" id="center-container">
            <h1>Welcome to the Dashboard</h1>
            <p>Please select an option from the menu to get started.</p>
        </div>
    </div>

    <script>
        $(document).ready(function() {
            // Add click event listener to each menu item
            $('.menu-item').click(function(e) {
                e.preventDefault();
                var page = $(this).attr('class').split(' ')[1];
                loadContent(page);
				console.log(page);
            });
        });

        function loadContent(page) {
            // Make AJAX request to load the appropriate module
            $.ajax({
                url: 'loadcontent.php',
                type: 'POST',
                data: {page: page},
                success: function(response) {
                    $('#center-container').html(response);
                },
                error: function() {
                    $('#center-container').html('<p>Error loading content.</p>');
                }
            });
        }
    </script>

</body>
</html>
