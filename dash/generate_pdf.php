<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

require('fpdf185/fpdf.php');
require('../connect_db.php');

// Get the user ID from the session
$user_id = $_SESSION['user_id'];

// Prepare the statement
$stmt = $conn->prepare("SELECT company_id FROM users WHERE user_id = ?");

// Bind the user ID to the statement
$stmt->bind_param("i", $user_id);

// Execute the statement
$stmt->execute();

// Get the result
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$company_id = $row['company_id'];

// Close the statement
$stmt->close();

// Retrieve the latest quote SN associated with the company ID
$query = "SELECT quote_sn FROM quotes_db WHERE company_id = $company_id ORDER BY createddatetime DESC LIMIT 1";
$result = mysqli_query($conn, $query);
if (!$result) {
    die("Query failed: " . mysqli_error($conn));
}
$row = mysqli_fetch_assoc($result);
$quote_sn = $row['quote_sn'] ?? 0; // Default to 0 if not found
$quote_sn++;

// Get the form data
$name = $_POST['name'];
$address = $_POST['address'];
$phone = $_POST['phone'];

// Handle the inclusions
$inclusions = $_POST['inclusions'] ?? [];  // Default to an empty array if not set

// Now $inclusions will be an array containing the selected options

$total_cost = $_POST['total_cost'];

// Create a new PDF object
$pdf = new FPDF();
$pdf->AddPage();

// Concatenate the services and costs into a single string
$job_description = '';
foreach ($inclusions as $inclusion => $cost) {
    if ($cost > 0) {
        $job_description .= $inclusion . "\n";
    }
}

// Calculate the sub-total, GST, and grand total
$sub_total = $total_cost;
$gst = $total_cost * 0.1;
$grand_total = $sub_total + $gst;

// Add the quote details
$pdf->SetFont('Arial', 'B', 14);
$pdf->Cell(0, 10, 'Quote', 0, 1, 'C');
$pdf->Ln();

// Add the quote date and number
$date = date('d/m/Y');
$quote_number = 'Q' . $quote_sn;
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(0, 10, 'Date: ' . $date, 0, 1, 'L');
$pdf->Cell(0, 10, 'Quote Number: ' . $quote_number, 0, 1, 'L');
$pdf->Ln();

// Add the customer details
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, 'Customer Details', 0, 1, 'L');
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(0, 10, 'Name: ' . $name, 0, 1, 'L');
$pdf->Cell(0, 10, 'Address: ' . $address, 0, 1, 'L');
$pdf->Cell(0, 10, 'Phone: ' . $phone, 0, 1, 'L');
$pdf->Ln();


// Add the quote inclusions table
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, 'Job Description', 0, 1, 'L');
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(0, 10, '', 0, 1, 'L');
$pdf->SetFont('Arial', 'B', 10);
$pdf->Cell(80, 10, 'Services', 1, 0, 'L');
$pdf->Cell(40, 10, 'Cost', 1, 1, 'L');
$pdf->SetFont('Arial', '', 10);
// Add the job description and total cost to the first row
$pdf->Cell(80, 10, $job_description, 1, 0, 'L');
$pdf->Cell(40, 10, '$' . $total_cost, 1, 1, 'L');

// Add the remaining inclusions to subsequent rows
foreach ($inclusions as $inclusion) {
    $pdf->Cell(80, 10, $inclusion, 1, 0, 'L');
    $pdf->Cell(40, 10, '', 1, 1, 'L'); // No cost is available
}

$pdf->Cell(80, 10, 'Sub-Total', 1, 0, 'L');
$pdf->Cell(40, 10, '$' . $sub_total, 1, 1, 'L');
$pdf->Cell(80, 10, 'GST (10%)', 1, 0, 'L');
$pdf->Cell(40, 10, '$' . $gst, 1, 1, 'L');
$pdf->Cell(80, 10, 'Grand Total', 1, 0, 'L');
$pdf->Cell(40, 10, '$' . $grand_total, 1, 1, 'L');

$pdf->Ln();


// Add the payment details
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, 'Payment Details', 0, 1, 'L');
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(0, 10, 'Bank Details', 0, 1, 'L');
$pdf->Cell(0, 10, 'Account name: Everest roof services', 0, 1, 'L');
$pdf->Cell(0, 10, 'BSB: 063115', 0, 1, 'L');
$pdf->Cell(0, 10, 'Account number: 10536794', 0, 1, 'L');
$pdf->Ln();

// Add the business details again
$pdf->SetFont('Arial', '', 10);
$pdf->Cell(0, 10, 'Everest Roof Services', 0, 1, 'C');
$pdf->Cell(0, 10, 'Murrumbeena, VIC 3163', 0, 1, 'C');
$pdf->Cell(0, 10, 'info@everestroofservices.com.au', 0, 1, 'C');
$pdf->Cell(0, 10, '0424 853 545 / 0468 457 905', 0, 1, 'C');
$pdf->Cell(0, 10, 'ACN: 46 662 311 873', 0, 1, 'C');
$pdf->Ln();

// Output the PDF
$filename = 'Q' . $quote_number . '.pdf';
$pdf->Output('F', $filename);

// Insert the new quote number into the quotes_db
$insert_query = "INSERT INTO quotes_db (company_id, quote_sn, createddatetime) VALUES (?, ?, NOW())";

$stmt = $conn->prepare($insert_query);
$stmt->bind_param("ii", $company_id, $quote_sn);
$result = $stmt->execute();

if (!$result) {
    die("Insertion failed: " . $stmt->error);
}

$stmt->close();

// Store the link to the quote in a session variable
$_SESSION['quote_link'] = $filename;
// After generating the quote
echo $filename;

// Redirect back to index.php
//header('Location: index.php');
exit;

?>