<?php
    // start session
    session_start();

    // check if user is not logged in
    if(!isset($_SESSION["user_id"])) {
        // redirect to login page
        header("Location: ../index.php");
        exit();
    }

    // include the database connection file
    include("../connect_db.php");

    // retrieve user's full name and user ID from session variables
    $user_id = $_SESSION["user_id"];
    $full_name = $_SESSION["full_name"];

    // check if the page parameter has been set
    if(isset($_POST["page"])) {
        $page = $_POST["page"];

        // check if user is authorized to access the selected module
        switch($page) {
            case "quotes":
                // check if user is authorized to create a new quote
                if(check_authorization("create_quote")) {
                    include("new_quote.php");
                } else {
                    echo "<p>You are not authorized to create a new quote.</p>";
                }
                break;
			case "view_quotes":
				// check if user is authorized to create a new quote
				if(check_authorization("view_quotes")) {
					include("view_quotes.php");
				} else {
					echo "<p>You are not authorized to create a new quote.</p>";
				}
				break;
            case "invoices":
                // check if user is authorized to create an invoice
                if(check_authorization("create_invoice")) {
                    include("invoices.php");
                } else {
                    echo "<p>You are not authorized to create an invoice.</p>";
                }
                break;
            case "profile":
                // check if user is authorized to update the company profile
                if(check_authorization("update_profile")) {
                    include("profile.php");
                } else {
                    echo "<p>You are not authorized to update the company profile.</p>";
                }
                break;
            case "services":
                // check if user is authorized to update services
                if(check_authorization("update_services")) {
                    include("services.php");
                } else {
                    echo "<p>You are not authorized to update services.</p>";
                }
                break;
            default:
                echo "<p>Invalid page selection.</p>";
        }
    } else {
        echo "<p>No page selected.</p>";
    }

    // function to check user authorization for a specific action
    function check_authorization($action) {
        // check if the user is authorized to perform the requested action
        // you can implement your own authorization logic here
        return true;
    }
?>
