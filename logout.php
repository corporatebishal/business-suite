<?php
    // start session
    session_start();

    // clear session variables
    session_unset();

    // destroy session
    session_destroy();

    // redirect to login page
    header("Location: index.php");
    exit();
?>
