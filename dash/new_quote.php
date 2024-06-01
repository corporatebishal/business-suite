<?php
session_start();

$quote_link = '';
if (isset($_SESSION['quote_link'])) {
    $quote_link = $_SESSION['quote_link'];
    // Unset the session variable after use
    unset($_SESSION['quote_link']);
}
?>

<!DOCTYPE html>
<html>
<head>
	<title>Quote Generator</title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
	<!--<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>-->
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>

	<link rel="stylesheet" type="text/css" href="https://bishal.com.au/work/generateQuote.css">

</head>
<body class="quotes-container">
	<h1>Quote Generator</h1>
	<form id="generatePdfForm" method="post" action="generate_pdf.php">
		<label for="name">Name:</label>
		<input type="text" id="name" name="name" value="Bishal"><br><br>

		<label for="address">Address:</label>
		<input type="text" id="address" name="address" value="50 Sample St, Sample Suburb, VIC 3000"><br><br>

		<label for="phone">Phone Number:</label>
		<input type="text" id="phone" name="phone" value="04123456789"><br><br>

		<label for="inclusions">Inclusions:</label>
		<select multiple id="inclusions" name="inclusions[]">
			<option value="Change of Broken Tiles">Change of Broken Tiles</option>
			<option value="Application of Silicone">Application of Silicone</option>
			<option value="Remove old Mortal">Remove old Mortal</option>
			<option value="Grinding of Ridges">Grinding of Ridges</option>
			<option value="Re Bedding of Ridges">Re Bedding of Ridges</option>
			<option value="Repointing of Ridges">Repointing of Ridges</option>
			<option value="Removal of Waste Masterials from Site">Removal of Waste Masterials from Site</option>
		</select><br><br>

		<label for="total_cost">Total Cost:</label>
		<input type="text" id="total_cost" name="total_cost"><br><br>

		<input type="submit" value="Generate PDF">
	</form>
	
	<!-- ... your form ends here ... -->
	<!-- Bootstrap Modal -->
	<div class="modal fade" id="quoteModal" tabindex="-1" aria-labelledby="quoteModalLabel" aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="quoteModalLabel">Quote Generated</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					Quote generated with quote number: <span id="quoteNumber"></span>
				</div>
				<div class="modal-footer">
					<a href="#" id="viewQuote" target="_blank" class="btn btn-primary">View Quote</a>
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Exit</button>
				</div>
			</div>
		</div>
	</div>

	
	<script>
		$(document).ready(function() {
		$("#generatePdfForm").on('submit', function(e) {
			e.preventDefault();  // Stops the form from submitting the normal way.

			$.ajax({
				type: "POST",
				url: 'generate_pdf.php',
				data: $(this).serialize(),
				success: function(response) {
					// Extract quote number from filename (like 'Q1234.pdf' becomes 'Q1234')
					let quoteNumber = response.replace('.pdf', '');

					$('#quoteNumber').text(quoteNumber);
					$('#viewQuote').attr('href', '' + response); // Adjust path if needed
					$('#quoteModal').modal('show');
				}
			});
		});
	});

	</script>

	<?php
	if ($quote_link) {
		//echo "<p>Quote has been successfully generated! <a href='$quote_link'>View Quote</a></p>";
	}
	?>
</body>
</html>
