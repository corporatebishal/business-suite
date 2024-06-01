<?php
require('fpdf185/fpdf.php');

// Get the form data
$name = $_POST['name'];
$address = $_POST['address'];
$phone = $_POST['phone'];
$inclusions = array(
    'Change of Broken Tiles' => $_POST['inclusion_1'],
    'Application of Silicone' => $_POST['inclusion_2'],
    'Remove old Mortar' => $_POST['inclusion_3'],
    'Grinding of Ridges' => $_POST['inclusion_4'],
    'Re-Bedding of Ridges' => $_POST['inclusion_5'],
    'Repointing of Ridges' => $_POST['inclusion_6'],
    'Removal of Waste Materials from Site' => $_POST['inclusion_7']
);
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
$quote_number = 'QN' . (1113 + rand(1, 1000));
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
// Add the inclusions and cost to the first row
$pdf->Cell(80, 10, $job_description, 1, 0, 'L');
$pdf->Cell(40, 10, '$' . $total_cost, 1, 1, 'L');

// Add the remaining inclusions and costs to subsequent rows
foreach ($inclusions as $inclusion => $cost) {
    if ($cost > 0) {
        $pdf->Cell(80, 10, $inclusion, 1, 0, 'L');
        $pdf->Cell(40, 10, '$' . $cost, 1, 1, 'L');
    }
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

// Open the PDF in a new tab
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename=' . $filename);
readfile($filename);

// Show link to quote file
echo '<a href="' . $filename . '">Download Quote</a>';

?>
